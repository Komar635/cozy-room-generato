# API Reference

Все маршруты находятся в Next.js App Router. Пользовательские маршруты требуют активную сессию NextAuth. Ответы с ошибками используют JSON и, для новых upload/scan/modify flow, общий формат из `src/lib/errors`.

## Projects

### GET /api/projects

Возвращает список проектов текущего пользователя.

### POST /api/projects

Создает проект.

```json
{
  "name": "Кресло у окна",
  "description": "Сканирование винтажного кресла"
}
```

Ожидаемый успешный статус: `201`.

### GET /api/projects/[id]

Возвращает проект, если он принадлежит текущему пользователю.

### DELETE /api/projects/[id]

Удаляет проект и связанные данные каскадом на уровне БД.

## Photos

### GET /api/projects/[id]/photos

Возвращает фотографии проекта.

### POST /api/projects/[id]/photos

Загружает фотографии в Supabase Storage и сохраняет metadata в `photos`.

```json
{
  "photos": [
    {
      "fileName": "frame-01.jpg",
      "fileSize": 524288,
      "mimeType": "image/jpeg",
      "base64Data": "data:image/jpeg;base64,..."
    }
  ]
}
```

Ограничения:

- Поддерживаются `image/jpeg`, `image/jpg`, `image/png`, `image/webp`.
- Максимальный размер файла — 10 MB.
- Для запуска сканирования нужно минимум 10 сохраненных фотографий.

## Scanning

### POST /api/projects/[id]/scan

Запускает фотограмметрию через `PHOTOGRAMMETRY_SERVICE_URL`.

Next.js отправляет в сервис:

```json
{
  "project_id": "project-id",
  "photo_urls": ["https://storage.local/frame-01.jpg"],
  "output_format": "gaussian-splatting"
}
```

Успешный ответ Next.js:

```json
{
  "jobId": "job-id",
  "status": "pending",
  "progress": 0,
  "message": "Сканирование запущено"
}
```

### GET /api/projects/[id]/scan/status

Возвращает последний `processing_jobs` со значением `job_type = scan`.

```json
{
  "jobId": "job-id",
  "status": "processing",
  "progress": 45,
  "errorMessage": null,
  "startedAt": "2026-04-28T10:00:00.000Z",
  "completedAt": null,
  "elapsedTime": 120,
  "estimatedTimeRemaining": 330
}
```

## Models And Analysis

### GET /api/projects/[id]/models

Возвращает список моделей проекта, последнюю модель и последнюю модификацию.

### POST /api/models/[id]/analyze

Запускает анализ стиля модели.

### GET /api/models/[id]/analysis

Возвращает последний результат анализа стиля.

### GET /api/models/[id]/suggestions

Возвращает сохраненные предложения модификации или лениво генерирует их из последнего анализа.

## Modifications

### POST /api/models/[id]/modify

Создает pending job/modification, вызывает `MODIFICATION_SERVICE_URL` и сохраняет производную модель.

Принимает snake_case и camelCase payload:

```json
{
  "modification_type": "recolor",
  "parameters": {
    "color_map": { "#8B7355": "#D9C3A5" },
    "finish": "satin"
  }
}
```

```json
{
  "modificationType": "geometry",
  "parameters": {
    "modification_description": "Сделать форму компактнее",
    "scale_factor": 0.95
  }
}
```

Контракт вызова Python-сервиса:

```json
{
  "job_id": "job-id",
  "project_id": "project-id",
  "model_id": "model-id",
  "model_type": "gaussian-splatting",
  "modification_type": "geometry_change",
  "parameters": {},
  "preserve_original": true
}
```

Успешный ответ Next.js имеет статус `201`:

```json
{
  "modificationId": "modification-id",
  "originalModelId": "original-model-id",
  "modifiedModelId": "new-model-id",
  "processingJobId": "job-id",
  "status": "completed",
  "message": "Modification completed"
}
```

### GET /api/projects/[id]/modify/status

Возвращает последний `processing_jobs` со значением `job_type = modify`.

### GET /api/modifications/[id]

Возвращает данные модификации.

### GET /api/modifications/[id]/spec

Лениво возвращает или создает спецификацию материалов для модификации.

## Локальные Контракты Для Тестов

Для интеграционных проверок без внешних сервисов используются контракты из `src/lib/testing/scan-modify-contracts.ts`. Они фиксируют форму upload payload, scan request/response, modify request/response и browserless E2E harness.
