"""Main FastAPI application for modification service."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models import (
    ModificationRequest,
    ModificationResponse,
    ModificationJob,
    ErrorResponse,
)
from app.config import settings
from app.modification_service import modification_service
import logging

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Modification Service",
    description="Service for applying modifications to 3D models",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"service": "modification", "status": "running", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "modification"}


@app.post("/modify", response_model=ModificationResponse)
async def apply_modification(request: ModificationRequest):
    """
    Apply a modification to a 3D model.

    Args:
        request: Modification request with model_id, type, and parameters

    Returns:
        ModificationResponse with new model details
    """
    logger.info(f"Modification request received for model {request.model_id}")

    try:
        result = await modification_service.apply_modification(request)
        return result
    except ValueError as e:
        logger.error(f"Modification failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/jobs/{job_id}", response_model=ModificationJob)
async def get_job_status(job_id: str):
    """Get the status of a modification job."""
    try:
        job = await modification_service.get_job_status(job_id)
        return job
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/modifications/{modification_id}", response_model=ModificationResponse)
async def get_modification(modification_id: str):
    """Get modification details by ID."""
    result = await modification_service.get_modification(modification_id)
    if not result:
        raise HTTPException(status_code=404, detail="Modification not found")
    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.service_host,
        port=settings.service_port,
        reload=True,
    )
