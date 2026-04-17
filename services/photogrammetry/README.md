# Photogrammetry Service

Микросервис для создания 3D-моделей из фотографий с использованием фотограмметрии.

## Установка

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
- `GET /health` - Detailed health check
- `POST /scan` - Start photogrammetry scan (будет реализовано в задаче 6.2)
- `GET /jobs/{job_id}` - Get job status (будет реализовано в задаче 6.2)
- `GET /models/{model_id}` - Get 3D model (будет реализовано в задаче 6.2)

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
