# PhotoUploader Component

Компонент для загрузки фотографий с drag & drop интерфейсом, превью и валидацией.

## Использование

```tsx
import { PhotoUploader } from '@/components/photos';
import type { Photo } from '@/types/database';

function MyComponent() {
  const handleUploadComplete = (photos: Photo[]) => {
    console.log('Загружено фотографий:', photos.length);
    // Обработка успешной загрузки
  };

  const handleError = (error: PhotoUploadError) => {
    console.error('Ошибка загрузки:', error.message);
    // Показать сообщение об ошибке пользователю
  };

  return (
    <PhotoUploader
      projectId="your-project-id"
      onUploadComplete={handleUploadComplete}
      onError={handleError}
    />
  );
}
```

## Props

- `projectId` (string, обязательный) - ID проекта для загрузки фотографий
- `onUploadComplete` (function, обязательный) - Callback при успешной загрузке
- `onError` (function, обязательный) - Callback при ошибке

## Валидация

Компонент автоматически валидирует:

- **Формат файлов**: JPEG, PNG, WebP
- **Размер файлов**: максимум 10 МБ на файл
- **Минимальное количество**: минимум 10 фотографий для загрузки

## Типы ошибок

```typescript
interface PhotoUploadError {
  type: 'invalid_format' | 'file_too_large' | 'insufficient_photos' | 'network_error' | 'upload_failed';
  message: string;
  recommendations?: string[];
}
```

## API Endpoints

Компонент использует следующие API endpoints:

- `POST /api/projects/[id]/photos` - загрузка фотографий
- `GET /api/projects/[id]/photos` - получение списка фотографий

## Тестирование

Unit-тесты для валидации находятся в `__tests__/photo-validation.test.ts`.

Запуск тестов:
```bash
bun test src/components/photos/__tests__/photo-validation.test.ts
```
