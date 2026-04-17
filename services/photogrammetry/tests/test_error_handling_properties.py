"""
Property-based тесты для обработки ошибок

Feature: reality-digitizer-3d
Property 3: Обработка ошибок при некачественных фотографиях

Validates: Требования 1.4, 9.1
"""
import pytest
import uuid
from hypothesis import given, strategies as st, settings, HealthCheck
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from app.validators import PhotoValidator
from app.models import PhotoQualityError


# Стратегии для генерации тестовых данных
@st.composite
def insufficient_photos_strategy(draw):
    """Генерирует недостаточное количество фотографий."""
    num_photos = draw(st.integers(min_value=0, max_value=9))
    project_id = str(uuid.uuid4())
    return [
        f"https://example.supabase.co/storage/v1/object/public/photos/{project_id}/photo_{i}.jpg"
        for i in range(num_photos)
    ]


class TestErrorHandlingProperties:
    """Property-based тесты для обработки ошибок."""
    
    @pytest.mark.asyncio
    @given(insufficient_photos_strategy())
    @settings(
        max_examples=100,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    async def test_property_3_error_handling_for_insufficient_photos(self, photo_urls):
        """
        Feature: reality-digitizer-3d
        Property 3: Обработка ошибок при некачественных фотографиях
        
        Validates: Требования 1.4, 9.1
        
        Для любого набора фотографий с недостаточным качеством, система должна
        вернуть сообщение об ошибке, содержащее конкретные рекомендации по улучшению.
        """
        # Arrange
        validator = PhotoValidator()
        
        # Act & Assert
        with pytest.raises(PhotoQualityError) as exc_info:
            await validator.validate_photo_count(photo_urls)
        
        error = exc_info.value
        
        # Проверяем, что ошибка содержит правильный тип
        assert error.error_type == 'insufficient_photos'
        
        # Проверяем, что сообщение об ошибке информативное
        assert error.message is not None
        assert len(error.message) > 0
        assert str(len(photo_urls)) in error.message
        
        # Проверяем, что есть конкретные рекомендации
        assert error.recommendations is not None
        assert len(error.recommendations) > 0
        
        # Проверяем, что рекомендации содержат полезную информацию
        recommendations_text = ' '.join(error.recommendations).lower()
        assert any(keyword in recommendations_text for keyword in [
            'фотографий', 'ракурс', 'объект', 'качество'
        ])


# Вспомогательная функция для запуска тестов
if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
