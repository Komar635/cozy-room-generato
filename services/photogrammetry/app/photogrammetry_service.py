"""Photogrammetry service for creating 3D models from photos."""

import os
import uuid
import logging
import asyncio
import shutil
from typing import List, Literal
from pathlib import Path
from PIL import Image
from app.config import settings
from app.storage import storage
from app.models import JobStatus, Model3D, PhotoQualityError
from app.validators import photo_validator
from app.error_logger import error_logger, ErrorSeverity

logger = logging.getLogger(__name__)


class PhotogrammetryService:
    """Service for processing photos and creating 3D models."""

    def __init__(self):
        """Initialize the photogrammetry service."""
        import tempfile

        self.temp_dir = Path(tempfile.gettempdir()) / "photogrammetry"
        self.temp_dir.mkdir(exist_ok=True)

    async def process_photos(
        self,
        project_id: str,
        photo_urls: List[str],
        output_format: Literal["gaussian-splatting", "nerf"],
    ) -> str:
        """
        Process photos to create a 3D model.

        Args:
            project_id: Project ID
            photo_urls: List of photo URLs from Supabase Storage
            output_format: Output format (gaussian-splatting or nerf)

        Returns:
            Job ID for tracking progress

        Raises:
            PhotoQualityError: If photos don't meet quality requirements
        """
        # Create job ID
        job_id = str(uuid.uuid4())

        logger.info(f"Starting photogrammetry job {job_id} for project {project_id}")

        # Create job record in database
        await self._create_job_record(job_id, project_id)

        # Start processing in background
        asyncio.create_task(
            self._process_photos_async(job_id, project_id, photo_urls, output_format)
        )

        return job_id

    async def _create_job_record(self, job_id: str, project_id: str) -> None:
        """Create a processing job record in the database."""
        try:
            await storage.create_job_record(job_id, project_id)
        except Exception as e:
            logger.error(f"Failed to create job record: {str(e)}")
            raise

    async def _process_photos_async(
        self,
        job_id: str,
        project_id: str,
        photo_urls: List[str],
        output_format: Literal["gaussian-splatting", "nerf"],
    ) -> None:
        """
        Asynchronously process photos to create 3D model.

        This method runs in the background and updates job status.
        """
        try:
            # Update status to processing
            await storage.update_job_status(job_id, "processing", 0)

            # Step 1: Validate photos (10% progress)
            logger.info(f"Job {job_id}: Validating photos")
            await self._validate_photos(photo_urls)
            await storage.update_job_status(job_id, "processing", 10)

            # Step 2: Download photos (30% progress)
            logger.info(f"Job {job_id}: Downloading photos")
            local_photos = await self._download_photos(job_id, photo_urls)
            await storage.update_job_status(job_id, "processing", 30)

            # Step 2.5: Validate photo quality (40% progress)
            logger.info(f"Job {job_id}: Validating photo quality")
            await photo_validator.validate_all_photos(local_photos)
            await storage.update_job_status(job_id, "processing", 40)

            # Step 3: Run photogrammetry (70% progress)
            logger.info(f"Job {job_id}: Running photogrammetry")
            model_file = await self._run_photogrammetry(
                job_id, local_photos, output_format
            )
            await storage.update_job_status(job_id, "processing", 70)

            # Step 4: Upload model to storage (90% progress)
            logger.info(f"Job {job_id}: Uploading model")
            model_id = str(uuid.uuid4())
            storage_path = (
                f"{project_id}/{model_id}.{self._get_file_extension(output_format)}"
            )
            model_url = await storage.upload_model(model_file, storage_path)
            await storage.update_job_status(job_id, "processing", 90)

            # Step 5: Save metadata (100% progress)
            logger.info(f"Job {job_id}: Saving metadata")
            await storage.save_model_metadata(
                model_id=model_id,
                project_id=project_id,
                model_type=output_format,
                storage_path=storage_path,
                url=model_url,
                processing_job_id=job_id,
            )

            # Complete job
            await storage.update_job_status(job_id, "completed", 100)
            logger.info(f"Job {job_id}: Completed successfully")

            # Cleanup
            await self._cleanup_temp_files(job_id)

        except PhotoQualityError as e:
            logger.error(f"Job {job_id}: Photo quality error - {e.message}")

            # Log error with full context
            error_logger.log_photo_quality_error(
                error=e, photo_urls=photo_urls, job_id=job_id, project_id=project_id
            )

            await storage.update_job_status(
                job_id, "failed", error_message=f"{e.error_type}: {e.message}"
            )
            await self._cleanup_temp_files(job_id)

        except Exception as e:
            logger.error(f"Job {job_id}: Processing failed - {str(e)}")

            # Log error with full context
            error_logger.log_processing_error(
                error=e,
                job_id=job_id,
                project_id=project_id,
                stage="photogrammetry_processing",
            )

            await storage.update_job_status(job_id, "failed", error_message=str(e))
            await self._cleanup_temp_files(job_id)

    async def _validate_photos(self, photo_urls: List[str]) -> None:
        """
        Validate photo quality and quantity.

        Raises:
            PhotoQualityError: If validation fails
        """
        # Check minimum number of photos
        await photo_validator.validate_photo_count(photo_urls)

        logger.info(f"Photo validation passed: {len(photo_urls)} photos")

    async def _download_photos(self, job_id: str, photo_urls: List[str]) -> List[str]:
        """
        Download photos from Supabase Storage to local temp directory.

        Returns:
            List of local file paths
        """
        job_dir = self.temp_dir / job_id
        job_dir.mkdir(exist_ok=True)

        local_paths = []
        for i, url in enumerate(photo_urls):
            local_path = str(job_dir / f"photo_{i:04d}.jpg")
            await storage.download_photo(url, local_path)
            local_paths.append(local_path)

        logger.info(f"Downloaded {len(local_paths)} photos to {job_dir}")
        return local_paths

    async def _run_photogrammetry(
        self,
        job_id: str,
        photo_paths: List[str],
        output_format: Literal["gaussian-splatting", "nerf"],
    ) -> str:
        """
        Run a real COLMAP structure-from-motion pipeline and export a PLY model.

        The current production MVP generates a real sparse point cloud with COLMAP
        and stores it as the ``gaussian-splatting`` compatibility artifact. NeRF
        training is intentionally not faked: unsupported formats fail fast instead
        of producing mock artifacts.

        Returns:
            Path to the generated model file
        """
        if output_format != "gaussian-splatting":
            raise ValueError(
                f"Output format '{output_format}' is not supported by the real "
                "photogrammetry pipeline yet. Use 'gaussian-splatting' for the "
                "COLMAP PLY preview pipeline."
            )

        if not shutil.which(settings.colmap_bin):
            raise RuntimeError(
                f"COLMAP binary '{settings.colmap_bin}' was not found. Install "
                "COLMAP and set COLMAP_BIN to its executable path."
            )

        job_dir = self.temp_dir / job_id
        images_dir = job_dir / "images"
        sparse_dir = job_dir / "sparse"
        database_path = job_dir / "database.db"
        output_file = job_dir / "model.ply"

        images_dir.mkdir(exist_ok=True)
        sparse_dir.mkdir(exist_ok=True)

        await self._normalize_photos_for_colmap(photo_paths, images_dir)

        await storage.update_job_status(job_id, "processing", 50)
        await self._run_colmap_command(
            job_id,
            "feature extraction",
            [
                settings.colmap_bin,
                "feature_extractor",
                "--database_path",
                str(database_path),
                "--image_path",
                str(images_dir),
                "--ImageReader.single_camera",
                "1",
            ],
        )

        await storage.update_job_status(job_id, "processing", 60)
        matcher = settings.photogrammetry_matcher.lower()
        if matcher not in {"exhaustive", "sequential"}:
            raise ValueError(
                "PHOTOGRAMMETRY_MATCHER must be either 'exhaustive' or 'sequential'"
            )

        matcher_command = (
            "sequential_matcher" if matcher == "sequential" else "exhaustive_matcher"
        )
        await self._run_colmap_command(
            job_id,
            f"{matcher} matching",
            [
                settings.colmap_bin,
                matcher_command,
                "--database_path",
                str(database_path),
            ],
        )

        await storage.update_job_status(job_id, "processing", 72)
        await self._run_colmap_command(
            job_id,
            "sparse mapping",
            [
                settings.colmap_bin,
                "mapper",
                "--database_path",
                str(database_path),
                "--image_path",
                str(images_dir),
                "--output_path",
                str(sparse_dir),
            ],
        )

        reconstruction_dir = self._find_reconstruction_dir(sparse_dir)

        await storage.update_job_status(job_id, "processing", 82)
        await self._run_colmap_command(
            job_id,
            "PLY export",
            [
                settings.colmap_bin,
                "model_converter",
                "--input_path",
                str(reconstruction_dir),
                "--output_path",
                str(output_file),
                "--output_type",
                "PLY",
            ],
        )

        self._validate_ply_artifact(output_file)

        logger.info(f"Photogrammetry completed: {output_file}")
        return str(output_file)

    async def _normalize_photos_for_colmap(
        self, photo_paths: List[str], images_dir: Path
    ) -> None:
        """Convert uploaded photos to RGB JPEG files that COLMAP can read."""
        max_size = settings.photogrammetry_max_image_size

        for index, photo_path in enumerate(photo_paths):
            output_path = images_dir / f"image_{index:04d}.jpg"

            with Image.open(photo_path) as image:
                rgb_image = image.convert("RGB")
                if max_size > 0:
                    rgb_image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                rgb_image.save(output_path, format="JPEG", quality=92, optimize=True)

        logger.info(f"Prepared {len(photo_paths)} COLMAP input images in {images_dir}")

    async def _run_colmap_command(
        self, job_id: str, stage: str, command: List[str]
    ) -> None:
        """Run a COLMAP command with timeout and useful error reporting."""
        logger.info("Job %s: Running COLMAP %s", job_id, stage)
        logger.debug("Job %s: Command: %s", job_id, " ".join(command))

        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=settings.photogrammetry_timeout_seconds,
            )
        except asyncio.TimeoutError:
            process.kill()
            await process.communicate()
            raise TimeoutError(
                f"COLMAP {stage} timed out after "
                f"{settings.photogrammetry_timeout_seconds} seconds"
            )

        stdout_text = stdout.decode(errors="replace").strip()
        stderr_text = stderr.decode(errors="replace").strip()

        if process.returncode != 0:
            logger.error(
                "COLMAP %s failed. stdout=%s stderr=%s", stage, stdout_text, stderr_text
            )
            raise RuntimeError(
                f"COLMAP {stage} failed with exit code {process.returncode}: "
                f"{stderr_text or stdout_text or 'no output'}"
            )

        if stdout_text:
            logger.debug("COLMAP %s stdout: %s", stage, stdout_text)
        if stderr_text:
            logger.debug("COLMAP %s stderr: %s", stage, stderr_text)

    def _find_reconstruction_dir(self, sparse_dir: Path) -> Path:
        """Find the largest COLMAP reconstruction directory."""
        candidates = [path for path in sparse_dir.iterdir() if path.is_dir()]
        valid_candidates = [
            path
            for path in candidates
            if (path / "cameras.bin").exists()
            and (path / "images.bin").exists()
            and (path / "points3D.bin").exists()
        ]

        if not valid_candidates:
            raise RuntimeError(
                "COLMAP did not produce a sparse reconstruction. Try adding more "
                "sharp, overlapping photos from different angles."
            )

        return max(
            valid_candidates, key=lambda path: (path / "points3D.bin").stat().st_size
        )

    def _validate_ply_artifact(self, output_file: Path) -> None:
        """Ensure that the generated artifact is a non-empty valid PLY file."""
        if not output_file.exists():
            raise RuntimeError("COLMAP model export did not create a PLY file")

        if output_file.stat().st_size < 128:
            raise RuntimeError("Generated PLY file is too small to be a valid model")

        with output_file.open("rb") as file:
            header = file.read(512)

        if not header.startswith(b"ply") or b"end_header" not in header[:512]:
            raise RuntimeError("Generated model is not a valid PLY artifact")

    def _get_file_extension(self, output_format: str) -> str:
        """Get file extension for the output format."""
        extensions = {"gaussian-splatting": "ply", "nerf": "nerf"}
        return extensions.get(output_format, "bin")

    async def _cleanup_temp_files(self, job_id: str) -> None:
        """Clean up temporary files for a job."""
        if settings.photogrammetry_keep_temp_files:
            logger.info(f"Keeping temp files for job {job_id}")
            return

        job_dir = self.temp_dir / job_id
        if job_dir.exists():
            shutil.rmtree(job_dir)
            logger.info(f"Cleaned up temp files for job {job_id}")

    async def get_job_status(self, job_id: str) -> JobStatus:
        """
        Get the status of a processing job.

        Args:
            job_id: Job ID

        Returns:
            JobStatus object
        """
        try:
            job_data = await storage.get_job(job_id)

            return JobStatus(
                job_id=job_data["id"],
                status=job_data["status"],
                progress=job_data["progress"],
                error_message=job_data.get("error_message"),
                started_at=job_data.get("started_at"),
                completed_at=job_data.get("completed_at"),
            )

        except Exception as e:
            logger.error(f"Failed to get job status: {str(e)}")
            raise

    async def get_model(self, model_id: str) -> Model3D:
        """
        Get a 3D model by ID.

        Args:
            model_id: Model ID

        Returns:
            Model3D object
        """
        try:
            model_data = await storage.get_model(model_id)

            return Model3D(
                model_id=model_data["id"],
                project_id=model_data["project_id"],
                model_type=model_data["model_type"],
                storage_path=model_data["storage_path"],
                url=model_data["url"],
                created_at=model_data["created_at"],
            )

        except Exception as e:
            logger.error(f"Failed to get model: {str(e)}")
            raise


# Global service instance
photogrammetry_service = PhotogrammetryService()
