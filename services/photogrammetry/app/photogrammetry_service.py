"""Photogrammetry service for creating 3D models from photos."""
import os
import uuid
import logging
import asyncio
from typing import List, Literal
from pathlib import Path
from PIL import Image
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
        output_format: Literal['gaussian-splatting', 'nerf']
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
            from app.storage import storage
            storage.client.table('processing_jobs').insert({
                'id': job_id,
                'job_type': 'scan',
                'project_id': project_id,
                'status': 'pending',
                'progress': 0
            }).execute()
        except Exception as e:
            logger.error(f"Failed to create job record: {str(e)}")
            raise
    
    async def _process_photos_async(
        self,
        job_id: str,
        project_id: str,
        photo_urls: List[str],
        output_format: Literal['gaussian-splatting', 'nerf']
    ) -> None:
        """
        Asynchronously process photos to create 3D model.
        
        This method runs in the background and updates job status.
        """
        try:
            # Update status to processing
            await storage.update_job_status(job_id, 'processing', 0)
            
            # Step 1: Validate photos (10% progress)
            logger.info(f"Job {job_id}: Validating photos")
            await self._validate_photos(photo_urls)
            await storage.update_job_status(job_id, 'processing', 10)
            
            # Step 2: Download photos (30% progress)
            logger.info(f"Job {job_id}: Downloading photos")
            local_photos = await self._download_photos(job_id, photo_urls)
            await storage.update_job_status(job_id, 'processing', 30)
            
            # Step 2.5: Validate photo quality (40% progress)
            logger.info(f"Job {job_id}: Validating photo quality")
            await photo_validator.validate_all_photos(local_photos)
            await storage.update_job_status(job_id, 'processing', 40)
            
            # Step 3: Run photogrammetry (70% progress)
            logger.info(f"Job {job_id}: Running photogrammetry")
            model_file = await self._run_photogrammetry(job_id, local_photos, output_format)
            await storage.update_job_status(job_id, 'processing', 70)
            
            # Step 4: Upload model to storage (90% progress)
            logger.info(f"Job {job_id}: Uploading model")
            model_id = str(uuid.uuid4())
            storage_path = f"{project_id}/{model_id}.{self._get_file_extension(output_format)}"
            model_url = await storage.upload_model(model_file, storage_path)
            await storage.update_job_status(job_id, 'processing', 90)
            
            # Step 5: Save metadata (100% progress)
            logger.info(f"Job {job_id}: Saving metadata")
            await storage.save_model_metadata(
                model_id=model_id,
                project_id=project_id,
                model_type=output_format,
                storage_path=storage_path,
                url=model_url,
                processing_job_id=job_id
            )
            
            # Complete job
            await storage.update_job_status(job_id, 'completed', 100)
            logger.info(f"Job {job_id}: Completed successfully")
            
            # Cleanup
            await self._cleanup_temp_files(job_id)
            
        except PhotoQualityError as e:
            logger.error(f"Job {job_id}: Photo quality error - {e.message}")
            
            # Log error with full context
            error_logger.log_photo_quality_error(
                error=e,
                photo_urls=photo_urls,
                job_id=job_id,
                project_id=project_id
            )
            
            await storage.update_job_status(
                job_id,
                'failed',
                error_message=f"{e.error_type}: {e.message}"
            )
            await self._cleanup_temp_files(job_id)
            
        except Exception as e:
            logger.error(f"Job {job_id}: Processing failed - {str(e)}")
            
            # Log error with full context
            error_logger.log_processing_error(
                error=e,
                job_id=job_id,
                project_id=project_id,
                stage='photogrammetry_processing'
            )
            
            await storage.update_job_status(
                job_id,
                'failed',
                error_message=str(e)
            )
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
        output_format: Literal['gaussian-splatting', 'nerf']
    ) -> str:
        """
        Run photogrammetry algorithm to create 3D model.
        
        NOTE: This is a placeholder implementation. In production, this would:
        - Use COLMAP for structure-from-motion
        - Generate point cloud
        - Create Gaussian Splatting or NeRF model
        
        For now, it creates a mock model file.
        
        Returns:
            Path to the generated model file
        """
        job_dir = self.temp_dir / job_id
        output_file = str(job_dir / f"model.{self._get_file_extension(output_format)}")
        
        # Placeholder: Create a mock model file
        # In production, this would run actual photogrammetry algorithms
        logger.warning("Using placeholder photogrammetry implementation")
        
        # Simulate processing time
        await asyncio.sleep(2)
        
        # Create mock model file
        with open(output_file, 'w') as f:
            f.write(f"Mock {output_format} model\n")
            f.write(f"Generated from {len(photo_paths)} photos\n")
            f.write(f"Job ID: {job_id}\n")
        
        logger.info(f"Photogrammetry completed: {output_file}")
        return output_file
    
    def _get_file_extension(self, output_format: str) -> str:
        """Get file extension for the output format."""
        extensions = {
            'gaussian-splatting': 'ply',
            'nerf': 'nerf'
        }
        return extensions.get(output_format, 'bin')
    
    async def _cleanup_temp_files(self, job_id: str) -> None:
        """Clean up temporary files for a job."""
        job_dir = self.temp_dir / job_id
        if job_dir.exists():
            import shutil
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
            response = storage.client.table('processing_jobs').select('*').eq('id', job_id).execute()
            
            if not response.data:
                raise ValueError(f"Job {job_id} not found")
            
            job_data = response.data[0]
            
            return JobStatus(
                job_id=job_data['id'],
                status=job_data['status'],
                progress=job_data['progress'],
                error_message=job_data.get('error_message'),
                started_at=job_data.get('started_at'),
                completed_at=job_data.get('completed_at')
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
            response = storage.client.table('models_3d').select('*').eq('id', model_id).execute()
            
            if not response.data:
                raise ValueError(f"Model {model_id} not found")
            
            model_data = response.data[0]
            
            return Model3D(
                model_id=model_data['id'],
                project_id=model_data['project_id'],
                model_type=model_data['model_type'],
                storage_path=model_data['storage_path'],
                url=model_data['url'],
                created_at=model_data['created_at']
            )
            
        except Exception as e:
            logger.error(f"Failed to get model: {str(e)}")
            raise


# Global service instance
photogrammetry_service = PhotogrammetryService()
