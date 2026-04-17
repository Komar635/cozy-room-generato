"""Data models for Style Analysis Service."""
from typing import List, Dict, Any, Literal, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class StyleAnalysisRequest(BaseModel):
    """Request to analyze style of a 3D model."""
    model_id: str
    image_urls: List[str] = Field(..., min_length=1)


class StyleAnalysis(BaseModel):
    """Result of style analysis."""
    id: str
    model_id: str
    style_description: str
    dominant_colors: List[str]
    materials: List[str]
    style_tags: List[str]
    analyzed_at: datetime


class ModificationSuggestionRequest(BaseModel):
    """Request to generate modification suggestions."""
    model_id: str
    style_analysis_id: str
    modification_types: List[Literal["recolor", "restoration", "geometry"]] = Field(
        default=["recolor", "restoration", "geometry"]
    )


class ModificationSuggestion(BaseModel):
    """A suggestion for modifying the 3D model."""
    id: str
    model_id: str
    modification_type: Literal["recolor", "restoration", "geometry"]
    description: str
    parameters: Dict[str, Any]
    preview_url: Optional[str] = None
    created_at: datetime


class RecolorParameters(BaseModel):
    """Parameters for recolor modification."""
    color_map: Dict[str, str] = Field(..., description="Mapping of original colors to new colors")
    finish: Optional[str] = Field(None, description="Surface finish (matte, glossy, satin)")


class RestorationParameters(BaseModel):
    """Parameters for restoration modification."""
    damaged_regions: List[str] = Field(..., description="Description of damaged areas")
    restoration_style: str = Field(..., description="Style of restoration (original, modern, etc.)")


class GeometryParameters(BaseModel):
    """Parameters for geometry modification."""
    modification_description: str = Field(..., description="Description of geometry changes")
    scale_factor: Optional[float] = Field(None, ge=0.1, le=10.0)
    dimensions: Optional[Dict[str, float]] = None


class ErrorResponse(BaseModel):
    """Error response."""
    error: str
    detail: Optional[str] = None
