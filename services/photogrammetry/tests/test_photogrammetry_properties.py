"""
Property-based тесты для сервиса фотограмметрии

Feature: reality-digitizer-3d
Property 1: Сканирование создаёт модель корректного формата
Property 2: Сканирование сохраняет модель в хранилище

Validates: Требования 1.1, 1.2, 1.5
"""
import pytest
import asyncio
import uuid
from hypothesis import given, strategies as st, settings, HealthCheck
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from app.photogrammetry_service import PhotogrammetryService
from app.models import JobStatus, Model3D


# Стратегии для генерации тестовых данных
@st.composite
def photo_urls_strategy(draw):
    """Генерирует список валидных URL фотографий."""
    num_photos = draw(st.integers(min_value=10, max_value=50))
    project_id = str(uuid.uuid4())
    return [
        f"https://example.supabase.co/storage/v1/object/public/photos/{project_id}/photo_{i}.jpg"
        for i in range(num_photos)
    ]


@st.composite
def scan_request_strategy(draw):
    """Генерирует валидный запрос на сканирование."""
    project_id = str(uuid.uuid4())
    photo_urls = draw(photo_urls_strategy())
    output_format = draw(st.sampled_from(['gaussian-splatting', 'nerf']))
    
    return {
        'project_id': project_id,
        'photo_urls': photo_urls,
        'output_format': output_format
    }


class TestPhotogrammetryProperties:
    """Property-based тесты для фотограмметрии."""
    
    @pytest.mark.asyncio
    @given(scan_request_strategy())
    @settings(
        max_examples=100,
        deadline=5000,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    async def test_property_1_scanning_creates_correct_format_model(self, scan_request):
        """
        Feature: reality-digitizer-3d
        Property 1: Сканирование создаёт модель корректного формата
        
        Validates: Требования 1.1, 1.2
        
        Для любого валидного набора фотографий объекта, после успешного
        завершения сканирования должна быть создана 3D-модель в формате
        Gaussian Splatting или NeRF.
        """
        # Arrange
        project_id = scan_request['project_id']
        photo_urls = scan_request['photo_urls']
        output_format = scan_request['output_format']
        
        # Mock storage operations
        with patch('app.photogrammetry_service.storage') as mock_storage, \
             patch('app.photogrammetry_service.photo_validator') as mock_validator, \
             patch('app.photogrammetry_service.asyncio.sleep', new_callable=AsyncMock), \
             patch('app.photogrammetry_service.asyncio.create_task') as mock_create_task:
            
            mock_storage.client = MagicMock()
            mock_storage.client.table.return_value.insert.return_value.execute.return_value = None
            mock_storage.update_job_status = AsyncMock()
            mock_storage.upload_model = AsyncMock(return_value=f"https://example.com/model.{output_format}")
            mock_storage.save_model_metadata = AsyncMock()
            mock_storage.download_photo = AsyncMock()
            mock_validator.validate_photo_count = AsyncMock()
            mock_validator.validate_all_photos = AsyncMock()
            
            # Вместо создания фоновой задачи, выполняем синхронно
            async def sync_task(coro):
                await coro
            
            mock_create_task.side_effect = sync_task
            
            service = PhotogrammetryService()
            
            # Act
            job_id = await service.process_photos(project_id, photo_urls, output_format)
            
            # Assert
            assert job_id is not None
            assert isinstance(job_id, str)
            
            # Проверяем, что модель была сохранена с правильным форматом
            mock_storage.save_model_metadata.assert_called_once()
            call_args = mock_storage.save_model_metadata.call_args
            
            assert call_args is not None
            assert call_args.kwargs['model_type'] == output_format
            assert call_args.kwargs['project_id'] == project_id
            assert call_args.kwargs['processing_job_id'] == job_id
            
            # Проверяем, что storage_path содержит правильное расширение
            storage_path = call_args.kwargs['storage_path']
            expected_extension = 'ply' if output_format == 'gaussian-splatting' else 'nerf'
            assert storage_path.endswith(f'.{expected_extension}')
    
    @pytest.mark.asyncio
    @given(scan_request_strategy())
    @settings(
        max_examples=100,
        deadline=5000,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    async def test_property_2_scanning_saves_model_to_storage(self, scan_request):
        """
        Feature: reality-digitizer-3d
        Property 2: Сканирование сохраняет модель в хранилище
        
        Validates: Требования 1.5
        
        Для любого успешно завершённого сканирования, созданная 3D-модель
        должна быть доступна в хранилище и иметь корректные метаданные
        в базе данных.
        """
        # Arrange
        project_id = scan_request['project_id']
        photo_urls = scan_request['photo_urls']
        output_format = scan_request['output_format']
        
        model_id = str(uuid.uuid4())
        model_url = f"https://example.com/models/{model_id}.{output_format}"
        
        # Mock storage operations
        with patch('app.photogrammetry_service.storage') as mock_storage, \
             patch('app.photogrammetry_service.photo_validator') as mock_validator, \
             patch('app.photogrammetry_service.asyncio.sleep', new_callable=AsyncMock), \
             patch('app.photogrammetry_service.asyncio.create_task') as mock_create_task:
            
            mock_storage.client = MagicMock()
            mock_storage.client.table.return_value.insert.return_value.execute.return_value = None
            mock_storage.update_job_status = AsyncMock()
            mock_storage.upload_model = AsyncMock(return_value=model_url)
            mock_storage.save_model_metadata = AsyncMock()
            mock_storage.download_photo = AsyncMock()
            mock_validator.validate_photo_count = AsyncMock()
            mock_validator.validate_all_photos = AsyncMock()
            
            # Вместо создания фоновой задачи, выполняем синхронно
            async def sync_task(coro):
                await coro
            
            mock_create_task.side_effect = sync_task
            
            service = PhotogrammetryService()
            
            # Act
            job_id = await service.process_photos(project_id, photo_urls, output_format)
            
            # Assert: проверяем, что модель была загружена в хранилище
            mock_storage.upload_model.assert_called_once()
            upload_call_args = mock_storage.upload_model.call_args
            
            assert upload_call_args is not None
            model_file_path = upload_call_args.args[0]
            storage_path = upload_call_args.args[1]
            
            # Проверяем, что файл модели существует
            assert model_file_path is not None
            
            # Проверяем, что storage_path корректен
            assert storage_path.startswith(project_id)
            
            # Assert: проверяем, что метаданные были сохранены
            mock_storage.save_model_metadata.assert_called_once()
            metadata_call_args = mock_storage.save_model_metadata.call_args
            
            assert metadata_call_args is not None
            assert metadata_call_args.kwargs['project_id'] == project_id
            assert metadata_call_args.kwargs['model_type'] == output_format
            assert metadata_call_args.kwargs['url'] == model_url
            assert metadata_call_args.kwargs['storage_path'] == storage_path
            assert metadata_call_args.kwargs['processing_job_id'] == job_id
            
            # Проверяем, что статус задачи был обновлён до 'completed'
            status_calls = [
                call for call in mock_storage.update_job_status.call_args_list
                if call.args[1] == 'completed'
            ]
            assert len(status_calls) > 0
            assert status_calls[0].args[2] == 100  # progress = 100%


# Вспомогательная функция для запуска тестов
if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
