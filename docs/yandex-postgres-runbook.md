# Миграция и запуск без Supabase: PostgreSQL + Yandex Object Storage

Этот вариант убирает зависимость runtime-пути `projects/photos/scan/models` от Supabase Cloud.

## Что используется вместо Supabase

- База данных: обычный PostgreSQL через Prisma (`DATABASE_URL`).
- Storage: Yandex Object Storage через S3 API.
- Auth: существующий NextAuth credentials/local auth и таблица `users`.
- Progress realtime: polling `/api/projects/:id/scan/status` каждые 3 секунды вместо Supabase Realtime.

## 1. PostgreSQL

Создайте PostgreSQL базу, например в Yandex Managed PostgreSQL или на VPS.

Пример `DATABASE_URL`:

```env
DATABASE_URL=postgresql://app_user:password@host:5432/reality_digitizer_3d
```

Примените Prisma migration:

```bash
bunx prisma migrate deploy
bunx prisma generate
```

## 2. Yandex Object Storage

Создайте bucket, например:

```text
reality-digitizer-3d
```

Для самого простого MVP bucket должен отдавать файлы по публичному URL, потому что:

- photogrammetry service скачивает фото по URL;
- browser viewer загружает PLY по URL.

Настройте CORS bucket так, чтобы frontend мог делать `GET` модели:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

## 3. `.env.local`

Заполните:

```env
DATABASE_URL=postgresql://app_user:password@host:5432/reality_digitizer_3d

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=long-random-string
AUTH_PROVIDER=local

YC_STORAGE_REGION=ru-central1
YC_STORAGE_ENDPOINT=https://storage.yandexcloud.net
YC_STORAGE_BUCKET=reality-digitizer-3d
YC_STORAGE_ACCESS_KEY=...
YC_STORAGE_SECRET_KEY=...
YC_STORAGE_PUBLIC_URL=https://reality-digitizer-3d.storage.yandexcloud.net

PHOTOGRAMMETRY_SERVICE_URL=http://localhost:8001
MODIFICATION_SERVICE_URL=http://localhost:8002
```

## 4. `services/photogrammetry/.env`

Заполните теми же PostgreSQL/Yandex значениями:

```env
DATABASE_URL=postgresql://app_user:password@host:5432/reality_digitizer_3d

YC_STORAGE_REGION=ru-central1
YC_STORAGE_ENDPOINT=https://storage.yandexcloud.net
YC_STORAGE_BUCKET=reality-digitizer-3d
YC_STORAGE_ACCESS_KEY=...
YC_STORAGE_SECRET_KEY=...
YC_STORAGE_PUBLIC_URL=https://reality-digitizer-3d.storage.yandexcloud.net

SERVICE_PORT=8001
SERVICE_HOST=0.0.0.0
COLMAP_BIN=colmap
PHOTOGRAMMETRY_MATCHER=exhaustive
PHOTOGRAMMETRY_TIMEOUT_SECONDS=1800
PHOTOGRAMMETRY_MAX_IMAGE_SIZE=2000
PHOTOGRAMMETRY_KEEP_TEMP_FILES=false
```

## 5. Проверка

```bash
bun run doctor
bun run typecheck
```

## 6. Запуск

Терминал 1:

```bash
bun run photogrammetry:build
bun run photogrammetry:up
```

Терминал 2:

```bash
bun run dev
```

## 7. Проверочный сценарий

1. Зарегистрируйтесь через local auth.
2. Создайте проект.
3. Загрузите минимум 10 фото.
4. Запустите scan.
5. Дождитесь completed.
6. Проверьте, что `.ply` появился в Yandex Object Storage.
7. Проверьте viewer на странице проекта.

## Текущие ограничения миграции

- Supabase-specific property tests ещё могут оставаться и потребуют отдельной миграции тестового слоя.
- Modification service нужно отдельно перевести с fake/generated URLs на Yandex Object Storage.
- Для приватного bucket понадобится генерация signed URLs вместо постоянного публичного `url`.
