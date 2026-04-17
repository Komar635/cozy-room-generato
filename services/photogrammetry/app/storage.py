"""Supabase Storage integration."""
from typing import Optional
from supabase import create_client, Client
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class SupabaseStorage:
    """Wrapper for Supabase Storage operations."""
    
    def __init__(self):
        """Initialize Supabase client."""
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key
        )
        self.bucket_name = "models-3d"
    
    async def upload_model(self, file_path: str, storage_path: str) -> str:
        """
        Upload a 3D model file to Supabase Storage.
        
        Args:
            file_path: Local path to the model file
            storage_path: Destination path in storage
            
        Returns:
            Public URL of the uploaded file
        """
        try:
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            response = self.client.storage.from_(self.bucket_name).upload(
                storage_path,
                file_data
            )
            
            # Get public URL
            public_url = self.client.storage.from_(self.bucket_name).get_public_url(storage_path)
            
            logger.info(f"Model uploaded successfully to {storage_path}")
            return public_url
            
        except Exception as e:
            logger.error(f"Failed to upload model: {str(e)}")
            raise
    
    async def download_photo(self, photo_url: str, local_path: str) -> None:
        """
        Download a photo from Supabase Storage.
        
        Args:
            photo_url: URL of the photo in storage
            local_path: Local path to save the photo
        """
        try:
            # Extract storage path from URL
            storage_path = photo_url.split('/storage/v1/object/public/')[-1]
            bucket_name = storage_path.split('/')[0]
            file_path = '/'.join(storage_path.split('/')[1:])
            
            response = self.client.storage.from_(bucket_name).download(file_path)
            
            with open(local_path, 'wb') as f:
                f.write(response)
            
            logger.info(f"Photo downloaded to {local_path}")
            
        except Exception as e:
            logger.error(f"Failed to download photo: {str(e)}")
            raise
    
    async def update_job_status(
        self,
        job_id: str,
        status: str,
        progress: int = 0,
        error_message: Optional[str] = None
    ) -> None:
        """
        Update processing job status in database.
        
        Args:
            job_id: Job ID
            status: New status
            progress: Progress percentage
            error_message: Error message if failed
        """
        try:
            update_data = {
                'status': status,
                'progress': progress
            }
            
            if error_message:
                update_data['error_message'] = error_message
            
            if status == 'processing' and progress == 0:
                update_data['started_at'] = 'now()'
            elif status in ['completed', 'failed']:
                update_data['completed_at'] = 'now()'
            
            self.client.table('processing_jobs').update(update_data).eq('id', job_id).execute()
            
            logger.info(f"Job {job_id} status updated to {status}")
            
        except Exception as e:
            logger.error(f"Failed to update job status: {str(e)}")
            raise
    
    async def save_model_metadata(
        self,
        model_id: str,
        project_id: str,
        model_type: str,
        storage_path: str,
        url: str,
        processing_job_id: str
    ) -> None:
        """
        Save 3D model metadata to database.
        
        Args:
            model_id: Model ID
            project_id: Project ID
            model_type: Type of model (gaussian-splatting or nerf)
            storage_path: Path in storage
            url: Public URL
            processing_job_id: Associated job ID
        """
        try:
            model_data = {
                'id': model_id,
                'project_id': project_id,
                'model_type': model_type,
                'storage_path': storage_path,
                'url': url,
                'is_original': True,
                'processing_job_id': processing_job_id
            }
            
            self.client.table('models_3d').insert(model_data).execute()
            
            logger.info(f"Model metadata saved for {model_id}")
            
        except Exception as e:
            logger.error(f"Failed to save model metadata: {str(e)}")
            raise


# Global storage instance
storage = SupabaseStorage()
