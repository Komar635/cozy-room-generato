"""Data models for Modification Service."""

from typing import List, Dict, Any, Literal, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class ModificationRequest(BaseModel):
    """Request to apply a modification to a 3D model."""

    model_id: str
    modification_type: Literal["recolor", "restoration", "geometry_change"]
    parameters: Dict[str, Any]
    preserve_original: bool = Field(
        default=True, description="Keep original model as separate version"
    )


class ModificationResponse(BaseModel):
    """Response after applying a modification."""

    modification_id: str
    new_model_id: str
    original_model_id: str
    modification_type: str
    status: Literal["completed", "processing", "failed"]
    parameters: Dict[str, Any]
    created_at: datetime


class ModificationJob(BaseModel):
    """Job tracking for modifications."""

    job_id: str
    model_id: str
    modification_type: str
    status: Literal["pending", "processing", "completed", "failed"]
    progress: int = Field(default=0, ge=0, le=100)
    created_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None


class Model3D(BaseModel):
    """3D Model representation."""

    id: str
    project_id: str
    version: int
    model_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    format: str
    created_at: datetime
    modified_at: Optional[datetime] = None


class RecolorParameters(BaseModel):
    """Parameters for recolor modification."""

    color_map: Dict[str, str] = Field(
        ..., description="Mapping of original colors to new colors"
    )
    finish: Optional[str] = Field(
        None, description="Surface finish (matte, glossy, satin)"
    )


class RestorationParameters(BaseModel):
    """Parameters for restoration modification."""

    damaged_regions: List[str] = Field(..., description="Description of damaged areas")
    restoration_style: str = Field(
        ..., description="Style of restoration (original, modern, preserved)"
    )
    repair_method: Optional[str] = None


class GeometryParameters(BaseModel):
    """Parameters for geometry modification."""

    modification_description: str = Field(
        ..., description="Description of geometry changes"
    )
    scale_factor: Optional[float] = Field(None, ge=0.1, le=10.0)
    dimensions: Optional[Dict[str, float]] = None


class ErrorResponse(BaseModel):
    """Error response."""

    error: str
    detail: Optional[str] = None
    recommendations: Optional[List[str]] = None
