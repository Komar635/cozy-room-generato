"""Modification Service for applying modifications to 3D models."""

import asyncio
import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from app.models import ModificationJob, ModificationRequest, ModificationResponse


class ModificationService:
    """Service for applying modifications to 3D models."""

    def __init__(self):
        self._jobs: Dict[str, ModificationJob] = {}
        self._modifications: Dict[str, ModificationResponse] = {}

    async def apply_modification(
        self, request: ModificationRequest
    ) -> ModificationResponse:
        """Apply a modification to a 3D model and return artifact metadata."""
        if request.modification_type == "recolor":
            return await self.apply_recolor(request)

        if request.modification_type == "restoration":
            return await self.apply_restoration(request)

        return await self.apply_geometry_change(request)

    async def apply_recolor(self, request: ModificationRequest) -> ModificationResponse:
        """Apply recolor parameters to a model and create a new version."""
        return await self._apply_modification(request)

    async def apply_restoration(
        self, request: ModificationRequest
    ) -> ModificationResponse:
        """Apply restoration parameters to a model and create a new version."""
        return await self._apply_modification(request)

    async def apply_geometry_change(
        self, request: ModificationRequest
    ) -> ModificationResponse:
        """Apply geometry-change parameters to a model and create a new version."""
        return await self._apply_modification(request)

    async def _apply_modification(
        self, request: ModificationRequest
    ) -> ModificationResponse:
        """Run the common modification workflow and return artifact metadata."""
        job_id = request.job_id or str(uuid.uuid4())
        modification_id = str(uuid.uuid4())
        new_model_id = str(uuid.uuid4())
        created_at = datetime.utcnow()

        job = ModificationJob(
            job_id=job_id,
            model_id=request.model_id,
            modification_type=request.modification_type,
            status="pending",
            progress=0,
            created_at=created_at,
        )
        self._jobs[job_id] = job

        try:
            job.status = "processing"
            job.progress = 20
            await asyncio.sleep(0.1)

            result_parameters = self._build_result_parameters(request)
            file_extension = self._get_file_extension(request.model_type)
            storage_path = f"{request.project_id or 'projects'}/{new_model_id}-{request.modification_type}.{file_extension}"
            url = self._build_artifact_url(storage_path)

            job.progress = 100
            job.status = "completed"
            job.completed_at = datetime.utcnow()

            result = ModificationResponse(
                job_id=job_id,
                modification_id=modification_id,
                new_model_id=new_model_id,
                original_model_id=request.model_id,
                modification_type=request.modification_type,
                status="completed",
                parameters=result_parameters,
                storage_path=storage_path,
                url=url,
                model_type=request.model_type or "gaussian-splatting",
                created_at=created_at,
                completed_at=job.completed_at,
            )
            self._modifications[modification_id] = result

            return result
        except Exception as error:
            job.status = "failed"
            job.error_message = str(error)
            job.completed_at = datetime.utcnow()
            raise ValueError(f"Modification failed: {str(error)}")

    def _build_result_parameters(self, request: ModificationRequest) -> Dict[str, Any]:
        if request.modification_type == "recolor":
            color_map = request.parameters.get("color_map", {})
            return {
                "color_map": color_map,
                "finish": request.parameters.get("finish"),
                "applied_colors": list(color_map.values()),
            }

        if request.modification_type == "restoration":
            damaged_regions = request.parameters.get("damaged_regions", [])
            return {
                "damaged_regions": damaged_regions,
                "restoration_style": request.parameters.get(
                    "restoration_style", "preserved"
                ),
                "restored_areas": damaged_regions,
            }

        return {
            "modification_description": request.parameters.get(
                "modification_description", ""
            ),
            "scale_factor": request.parameters.get("scale_factor"),
            "dimensions": request.parameters.get("dimensions"),
        }

    def _build_artifact_url(self, storage_path: str) -> str:
        return f"https://example.com/generated-models/{storage_path}"

    def _get_file_extension(self, model_type: Optional[str]) -> str:
        if model_type == "nerf":
            return "nerf"

        return "ply"

    async def get_job_status(self, job_id: str) -> ModificationJob:
        """Get status of a modification job."""
        if job_id not in self._jobs:
            raise ValueError(f"Job not found: {job_id}")
        return self._jobs[job_id]

    async def get_modification(
        self, modification_id: str
    ) -> Optional[ModificationResponse]:
        """Get modification details by ID."""
        return self._modifications.get(modification_id)


modification_service = ModificationService()
