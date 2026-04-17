"""FastAPI application for Style Analysis Service."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import (
    StyleAnalysisRequest,
    StyleAnalysis,
    ModificationSuggestionRequest,
    ModificationSuggestion,
    ErrorResponse,
)
from .style_analysis_service import StyleAnalysisService
from typing import List

app = FastAPI(title="Style Analysis Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize service
style_service = StyleAnalysisService()


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/analyze", response_model=StyleAnalysis)
async def analyze_style(request: StyleAnalysisRequest):
    """
    Analyze the style of a 3D model.
    
    Returns complete style analysis with all required fields.
    """
    try:
        analysis = await style_service.analyze_style(
            model_id=request.model_id,
            image_urls=request.image_urls
        )
        return analysis
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/suggestions", response_model=List[ModificationSuggestion])
async def generate_suggestions(request: ModificationSuggestionRequest):
    """
    Generate modification suggestions based on style analysis.
    
    Returns suggestions for all requested modification types.
    """
    try:
        # In a real implementation, we would fetch the style analysis from the database
        # For now, we'll create a mock one for testing
        # TODO: Fetch from database using request.style_analysis_id
        
        raise HTTPException(
            status_code=501,
            detail="This endpoint requires database integration"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Suggestion generation failed: {str(e)}")
