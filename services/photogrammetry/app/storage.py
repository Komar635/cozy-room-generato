"""PostgreSQL + Yandex Object Storage integration."""

from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse
import logging
import uuid

import boto3
import psycopg
import requests

from app.config import settings

logger = logging.getLogger(__name__)


class AppStorage:
    """Wrapper for PostgreSQL metadata and Yandex Object Storage files."""

    def __init__(self):
        self.bucket_name = settings.yc_storage_bucket
        self.public_base_url = settings.yc_storage_public_url.rstrip("/")
        self.s3_client = boto3.client(
            "s3",
            region_name=settings.yc_storage_region,
            endpoint_url=settings.yc_storage_endpoint,
            aws_access_key_id=settings.yc_storage_access_key,
            aws_secret_access_key=settings.yc_storage_secret_key,
        )

    def _connect(self):
        return psycopg.connect(settings.database_url)

    def _public_url(self, storage_path: str) -> str:
        if self.public_base_url:
            return f"{self.public_base_url}/{storage_path}"
        return f"https://{self.bucket_name}.storage.yandexcloud.net/{storage_path}"

    async def upload_model(self, file_path: str, storage_path: str) -> str:
        """Upload a 3D model file to Yandex Object Storage."""
        if not self.bucket_name:
            raise RuntimeError("YC_STORAGE_BUCKET is not configured")

        try:
            with open(file_path, "rb") as file:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=storage_path,
                    Body=file,
                    ContentType="model/ply",
                )

            logger.info("Model uploaded successfully to %s", storage_path)
            return self._public_url(storage_path)
        except Exception as error:
            logger.error("Failed to upload model: %s", str(error))
            raise

    async def download_photo(self, photo_url: str, local_path: str) -> None:
        """Download a photo by public URL or signed URL."""
        try:
            response = requests.get(photo_url, timeout=60)
            response.raise_for_status()

            with open(local_path, "wb") as file:
                file.write(response.content)

            logger.info("Photo downloaded to %s", local_path)
        except Exception as error:
            logger.error("Failed to download photo: %s", str(error))
            raise

    async def update_job_status(
        self,
        job_id: str,
        status: str,
        progress: int = 0,
        error_message: Optional[str] = None,
    ) -> None:
        """Update processing job status in PostgreSQL."""
        try:
            started_at = None
            completed_at = None
            now = datetime.now(timezone.utc)

            if status == "processing" and progress == 0:
                started_at = now
            elif status in ["completed", "failed"]:
                completed_at = now

            with self._connect() as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        UPDATE processing_jobs
                        SET status = %s,
                            progress = %s,
                            error_message = COALESCE(%s, error_message),
                            started_at = COALESCE(%s, started_at),
                            completed_at = COALESCE(%s, completed_at)
                        WHERE id = %s
                        """,
                        (
                            status,
                            progress,
                            error_message,
                            started_at,
                            completed_at,
                            job_id,
                        ),
                    )

            logger.info("Job %s status updated to %s", job_id, status)
        except Exception as error:
            logger.error("Failed to update job status: %s", str(error))
            raise

    async def save_model_metadata(
        self,
        model_id: str,
        project_id: str,
        model_type: str,
        storage_path: str,
        url: str,
        processing_job_id: str,
    ) -> None:
        """Save 3D model metadata to PostgreSQL."""
        try:
            with self._connect() as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        INSERT INTO models_3d (
                            id,
                            project_id,
                            model_type,
                            storage_path,
                            url,
                            is_original,
                            processing_job_id,
                            created_at
                        ) VALUES (%s, %s, %s, %s, %s, true, %s, %s)
                        """,
                        (
                            model_id,
                            project_id,
                            model_type,
                            storage_path,
                            url,
                            processing_job_id,
                            datetime.now(timezone.utc),
                        ),
                    )

            logger.info("Model metadata saved for %s", model_id)
        except Exception as error:
            logger.error("Failed to save model metadata: %s", str(error))
            raise

    async def create_job_record(self, job_id: str, project_id: str) -> None:
        """Create processing job metadata in PostgreSQL."""
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO processing_jobs (
                        id,
                        job_type,
                        project_id,
                        status,
                        progress,
                        created_at
                    ) VALUES (%s, 'scan', %s, 'pending', 0, %s)
                    """,
                    (job_id, project_id, datetime.now(timezone.utc)),
                )

    async def get_job(self, job_id: str) -> dict:
        """Get a processing job from PostgreSQL."""
        with self._connect() as connection:
            with connection.cursor(row_factory=psycopg.rows.dict_row) as cursor:
                cursor.execute(
                    """
                    SELECT id, status, progress, error_message, started_at, completed_at
                    FROM processing_jobs
                    WHERE id = %s
                    """,
                    (job_id,),
                )
                job = cursor.fetchone()

        if not job:
            raise ValueError(f"Job {job_id} not found")

        return dict(job)

    async def get_model(self, model_id: str) -> dict:
        """Get a model from PostgreSQL."""
        with self._connect() as connection:
            with connection.cursor(row_factory=psycopg.rows.dict_row) as cursor:
                cursor.execute(
                    """
                    SELECT id, project_id, model_type, storage_path, url, created_at
                    FROM models_3d
                    WHERE id = %s
                    """,
                    (model_id,),
                )
                model = cursor.fetchone()

        if not model:
            raise ValueError(f"Model {model_id} not found")

        return dict(model)


storage = AppStorage()
