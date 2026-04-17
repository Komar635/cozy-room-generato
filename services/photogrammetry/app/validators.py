"""Photo validation utilities."""
import logging
from typing import List, Tuple
from pathlib import Path
from PIL import Image
from app.models import PhotoQualityError

logger = logging.getLogger(__name__)


class PhotoValidator:
    """Validator for photo quality and requirements."""
    
    MIN_PHOTOS = 10
    MIN_RESOLUTION = (1280, 720)  # Минимальное разрешение
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
    SUPPORTED_FORMATS = {'.jpg', '.jpeg', '.png'}
    
    @classmethod
    async def validate_photo_count(cls, photo_urls: List[str]) -> None:
        """
        Validate minimum number of photos.
        
        Raises:
            PhotoQualityError: If insufficient photos
        """
        if len(photo_urls) < cls.MIN_PHOTOS:
            raise PhotoQualityError(
                error_type='insufficient_photos',
                message=f'Недостаточно фотографий: {len(photo_urls)}. Требуется минимум {cls.MIN_PHOTOS}.',
                recommendations=[
                    'Сделайте больше фотографий объекта с разных ракурсов',
                    'Рекомендуется 20-30 фотографий для лучшего качества',
                    'Фотографируйте объект по кругу с шагом 15-20 градусов',
                    'Убедитесь, что объект виден полностью на каждой фотографии'
                ]
            )
        
        logger.info(f"Photo count validation passed: {len(photo_urls)} photos")
    
    @classmethod
    async def validate_photo_quality(cls, photo_path: str) -> Tuple[bool, List[str]]:
        """
        Validate individual photo quality.
        
        Args:
            photo_path: Path to the photo file
            
        Returns:
            Tuple of (is_valid, list of issues)
        """
        issues = []
        
        try:
            # Check file exists
            if not Path(photo_path).exists():
                issues.append(f"Файл не найден: {photo_path}")
                return False, issues
            
            # Check file size
            file_size = Path(photo_path).stat().st_size
            if file_size > cls.MAX_FILE_SIZE:
                issues.append(f"Файл слишком большой: {file_size / 1024 / 1024:.1f} MB (макс. 10 MB)")
            
            # Check format and resolution
            try:
                with Image.open(photo_path) as img:
                    # Check format
                    if img.format.lower() not in ['jpeg', 'jpg', 'png']:
                        issues.append(f"Неподдерживаемый формат: {img.format}")
                    
                    # Check resolution
                    width, height = img.size
                    if width < cls.MIN_RESOLUTION[0] or height < cls.MIN_RESOLUTION[1]:
                        issues.append(
                            f"Низкое разрешение: {width}x{height} "
                            f"(минимум {cls.MIN_RESOLUTION[0]}x{cls.MIN_RESOLUTION[1]})"
                        )
                    
                    # Check if image is too dark or too bright
                    if img.mode in ['RGB', 'L']:
                        import numpy as np
                        img_array = np.array(img)
                        mean_brightness = img_array.mean()
                        
                        if mean_brightness < 30:
                            issues.append("Фотография слишком тёмная")
                        elif mean_brightness > 225:
                            issues.append("Фотография слишком светлая (переэкспонирована)")
                    
            except Exception as e:
                issues.append(f"Ошибка при чтении изображения: {str(e)}")
            
            is_valid = len(issues) == 0
            
            if not is_valid:
                logger.warning(f"Photo quality issues for {photo_path}: {issues}")
            
            return is_valid, issues
            
        except Exception as e:
            logger.error(f"Error validating photo {photo_path}: {str(e)}")
            return False, [f"Ошибка валидации: {str(e)}"]
    
    @classmethod
    async def validate_all_photos(cls, photo_paths: List[str]) -> None:
        """
        Validate all photos in the set.
        
        Raises:
            PhotoQualityError: If photos don't meet quality requirements
        """
        all_issues = []
        invalid_count = 0
        
        for i, photo_path in enumerate(photo_paths):
            is_valid, issues = await cls.validate_photo_quality(photo_path)
            if not is_valid:
                invalid_count += 1
                all_issues.append(f"Фото {i+1}: {', '.join(issues)}")
        
        # If more than 20% of photos have issues, fail validation
        if invalid_count > len(photo_paths) * 0.2:
            raise PhotoQualityError(
                error_type='insufficient_quality',
                message=f'Слишком много фотографий низкого качества: {invalid_count} из {len(photo_paths)}',
                recommendations=[
                    'Используйте фотографии с разрешением не менее 1280x720',
                    'Обеспечьте хорошее освещение объекта',
                    'Избегайте размытых фотографий',
                    'Используйте стабилизацию камеры или штатив',
                    'Убедитесь, что объект хорошо виден на всех фотографиях',
                    *all_issues[:5]  # Показываем первые 5 проблем
                ]
            )
        
        logger.info(f"Photo quality validation passed: {len(photo_paths) - invalid_count}/{len(photo_paths)} valid photos")


# Global validator instance
photo_validator = PhotoValidator()
