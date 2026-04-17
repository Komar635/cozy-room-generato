"""Pydantic models for the photogrammetry service."""
from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class PhotoInput(BaseModel):
    """Input model for a single photo."""
    url: str = Field(..., description="URL of the photo in Supabase Storage")
    id: str = Field(..., description="Photo ID")


class ScanRequest(BaseModel):
    """Request model for starting a scan."""
    project_id: str = Field(..., description="Project ID")
    photo_urls: List[str] = Field(..., min_length=10, description="List of photo URLs")
    output_format: Literal['gaussian-splatting', 'nerf'] = Field(
        default='gaussian-splatting',
        description="Output 3D model format"
    )


class JobStatus(BaseModel):
    """Status of a processing job."""
    job_id: str
    status: Literal['pending', 'processing', 'completed', 'failed']
    progress: int = Field(ge=0, le=100, description="Progress percentage")
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class Model3D(BaseModel):
    """3D model output."""
    model_id: str
    project_id: str
    model_type: Literal['gaussian-splatting', 'nerf']
    storage_path: str
    url: str
    created_at: datetime


class ScanResponse(BaseModel):
    """Response after starting a scan."""
    job_id: str
    status: str
    message: str


class PhotoQualityError(Exception):
    """Error details for photo quality issues."""
    
    def __init__(
        self,
        error_type: str,
        message: str,
        recommendations: List[str]
    ):
        self.error_type = error_type
        self.message = message
        self.recommendations = recommendations
        super().__init__(message)
