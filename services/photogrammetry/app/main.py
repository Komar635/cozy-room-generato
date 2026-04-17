"""Main FastAPI application for photogrammetry service."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models import ScanRequest, ScanResponse, JobStatus, Model3D, PhotoQualityError
from app.config import settings
from app.photogrammetry_service import photogrammetry_service
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Photogrammetry Service",
    description="Service for creating 3D models from photos using photogrammetry",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "photogrammetry",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "service": "photogrammetry"
    }


@app.post("/scan", response_model=ScanResponse)
async def start_scan(request: ScanRequest):
    """
    Start a photogrammetry scan to create a 3D model.
    
    Args:
        request: Scan request with project_id, photo_urls, and output_format
        
    Returns:
        ScanResponse with job_id and status
    """
    logger.info(f"Scan request received for project {request.project_id}")
    
    try:
        # Validate minimum photos
        if len(request.photo_urls) < 10:
            raise HTTPException(
                status_code=400,
                detail={
                    "error_type": "insufficient_photos",
                    "message": f"Недостаточно фотографий: {len(request.photo_urls)}. Требуется минимум 10.",
                    "recommendations": [
                        "Сделайте больше фотографий объекта с разных ракурсов",
                        "Рекомендуется 20-30 фотографий для лучшего качества",
                        "Фотографируйте объект по кругу с шагом 15-20 градусов"
                    ]
                }
            )
        
        # Start processing
        job_id = await photogrammetry_service.process_photos(
            project_id=request.project_id,
            photo_urls=request.photo_urls,
            output_format=request.output_format
        )
        
        return ScanResponse(
            job_id=job_id,
            status="pending",
            message=f"Сканирование запущено. Job ID: {job_id}"
        )
        
    except PhotoQualityError as e:
        raise HTTPException(
            status_code=400,
            detail={
                "error_type": e.error_type,
                "message": e.message,
                "recommendations": e.recommendations
            }
        )
    except Exception as e:
        logger.error(f"Failed to start scan: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при запуске сканирования: {str(e)}"
        )


@app.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    """
    Get the status of a processing job.
    
    Args:
        job_id: Job ID
        
    Returns:
        JobStatus with current status and progress
    """
    logger.info(f"Status request for job {job_id}")
    
    try:
        status = await photogrammetry_service.get_job_status(job_id)
        return status
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get job status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении статуса: {str(e)}"
        )


@app.get("/models/{model_id}", response_model=Model3D)
async def get_model(model_id: str):
    """
    Get a 3D model by ID.
    
    Args:
        model_id: Model ID
        
    Returns:
        Model3D with model details
    """
    logger.info(f"Model request for {model_id}")
    
    try:
        model = await photogrammetry_service.get_model(model_id)
        return model
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get model: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении модели: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.service_host,
        port=settings.service_port,
        reload=True
    )
