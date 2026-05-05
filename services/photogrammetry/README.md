# Photogrammetry Service

Микросервис для создания 3D-моделей из фотографий с использованием фотограмметрии.

## Установка

Сервис использует реальный photogrammetry pipeline на базе COLMAP. Перед запуском
установите системный binary `colmap` и убедитесь, что он доступен в `PATH`:

```bash
colmap -h
```

Если binary установлен не в `PATH`, укажите путь через `COLMAP_BIN` в `.env`.

```bash
cd services/photogrammetry
pip install -r requirements.txt
```

## Конфигурация

Скопируйте `.env.example` в `.env` и заполните переменные окружения:

```bash
cp .env.example .env
```

## Запуск

```bash
python -m app.main
```

Или с помощью uvicorn:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## API Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health check, включая доступность COLMAP
- `POST /scan` - Start photogrammetry scan
- `GET /jobs/{job_id}` - Get job status
- `GET /models/{model_id}` - Get 3D model

## Реальный pipeline

Production MVP выполняет Structure-from-Motion через COLMAP и экспортирует
реальный sparse point cloud в PLY:

1. скачивание фото из Supabase Storage;
2. нормализация входных изображений в RGB JPEG;
3. `colmap feature_extractor`;
4. `colmap exhaustive_matcher` или `colmap sequential_matcher`;
5. `colmap mapper`;
6. `colmap model_converter --output_type PLY`;
7. проверка PLY-артефакта;
8. загрузка результата в bucket `models-3d`.

Поддерживаемый формат запроса сейчас: `output_format=gaussian-splatting`.
Это compatibility name для PLY-preview результата. NeRF намеренно не
симулируется и должен внедряться отдельным GPU/training pipeline.

Рекомендуемые `.env` настройки:

```env
COLMAP_BIN=colmap
PHOTOGRAMMETRY_MATCHER=exhaustive
PHOTOGRAMMETRY_TIMEOUT_SECONDS=1800
PHOTOGRAMMETRY_MAX_IMAGE_SIZE=2000
PHOTOGRAMMETRY_KEEP_TEMP_FILES=false
```

Если reconstruction не создаётся, job завершается ошибкой с рекомендацией
добавить больше резких, перекрывающихся фото объекта с разных ракурсов.

## Структура

```
services/photogrammetry/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI приложение
│   ├── config.py        # Настройки
│   ├── models.py        # Pydantic модели
│   └── storage.py       # Интеграция с Supabase Storage
├── requirements.txt
├── .env.example
└── README.md
```

## Технологии

- FastAPI - веб-фреймворк
- Pydantic - валидация данных
- Supabase - хранилище и база данных
- Uvicorn - ASGI сервер
