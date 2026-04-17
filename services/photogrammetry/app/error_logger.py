"""Centralized error logging system."""
import logging
import traceback
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum

logger = logging.getLogger(__name__)


class ErrorSeverity(str, Enum):
    """Error severity levels."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class ErrorLogger:
    """Centralized error logger for the photogrammetry service."""
    
    @staticmethod
    def log_error(
        error: Exception,
        severity: ErrorSeverity = ErrorSeverity.ERROR,
        context: Optional[Dict[str, Any]] = None,
        job_id: Optional[str] = None,
        project_id: Optional[str] = None
    ) -> None:
        """
        Log an error with full context.
        
        Args:
            error: The exception that occurred
            severity: Severity level of the error
            context: Additional context information
            job_id: Associated job ID if applicable
            project_id: Associated project ID if applicable
        """
        error_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'severity': severity.value,
            'error_type': type(error).__name__,
            'error_message': str(error),
            'traceback': traceback.format_exc(),
            'job_id': job_id,
            'project_id': project_id,
            'context': context or {}
        }
        
        # Log to console
        log_message = (
            f"[{severity.value.upper()}] {error_data['error_type']}: {error_data['error_message']}"
        )
        
        if job_id:
            log_message = f"Job {job_id} - {log_message}"
        
        if severity == ErrorSeverity.CRITICAL:
            logger.critical(log_message, extra=error_data)
        elif severity == ErrorSeverity.ERROR:
            logger.error(log_message, extra=error_data)
        elif severity == ErrorSeverity.WARNING:
            logger.warning(log_message, extra=error_data)
        else:
            logger.info(log_message, extra=error_data)
        
        # In production, this would also send to:
        # - Sentry for error tracking
        # - CloudWatch/Datadog for monitoring
        # - Database for persistent storage
    
    @staticmethod
    def log_photo_quality_error(
        error: Exception,
        photo_urls: list,
        job_id: Optional[str] = None,
        project_id: Optional[str] = None
    ) -> None:
        """
        Log a photo quality error with specific context.
        
        Args:
            error: The PhotoQualityError exception
            photo_urls: List of photo URLs that failed validation
            job_id: Associated job ID
            project_id: Associated project ID
        """
        context = {
            'photo_count': len(photo_urls),
            'photo_urls': photo_urls[:5],  # Log first 5 URLs
            'error_details': getattr(error, 'recommendations', [])
        }
        
        ErrorLogger.log_error(
            error=error,
            severity=ErrorSeverity.WARNING,
            context=context,
            job_id=job_id,
            project_id=project_id
        )
    
    @staticmethod
    def log_processing_error(
        error: Exception,
        job_id: str,
        project_id: str,
        stage: str
    ) -> None:
        """
        Log a processing error during photogrammetry.
        
        Args:
            error: The exception that occurred
            job_id: Job ID
            project_id: Project ID
            stage: Processing stage where error occurred
        """
        context = {
            'processing_stage': stage
        }
        
        ErrorLogger.log_error(
            error=error,
            severity=ErrorSeverity.ERROR,
            context=context,
            job_id=job_id,
            project_id=project_id
        )


# Global error logger instance
error_logger = ErrorLogger()
