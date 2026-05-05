# Локальный запуск реального scan → PLY viewer

Этот runbook описывает минимальные действия, которые нужно выполнить вручную,
чтобы проект работал как реальный MVP: фото загружаются в Supabase, Python-сервис
запускает COLMAP, создаёт PLY point cloud, Next.js показывает модель через PLYLoader.

## Что не запускается фоном

- Docker-сервис photogrammetry не имеет `restart: always`.
- В `docker-compose.yml` сервис спрятан за profile `photogrammetry`.
- Ничего не стартует, пока вы сами не выполните `bun run photogrammetry:up`.
- После `bun run photogrammetry:down` контейнер не потребляет CPU/RAM.
- Во время scan используется только ваш Supabase Storage/DB и локальный контейнер.

## 1. Подготовить Supabase

1. Создайте проект в Supabase.
2. В SQL Editor выполните миграцию:
   `supabase/migrations/001_initial_schema.sql`.
3. Создайте public Storage buckets:
   - `photos`
   - `models-3d`

## 2. Заполнить env для Next.js

Создайте `.env.local` из `.env.local.example` и заполните минимум:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=long-random-string

PHOTOGRAMMETRY_SERVICE_URL=http://localhost:8001
MODIFICATION_SERVICE_URL=http://localhost:8002
```

## 3. Заполнить env для photogrammetry

Создайте `services/photogrammetry/.env` из `.env.example`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

SERVICE_PORT=8001
SERVICE_HOST=0.0.0.0
COLMAP_BIN=colmap
PHOTOGRAMMETRY_MATCHER=exhaustive
PHOTOGRAMMETRY_TIMEOUT_SECONDS=1800
PHOTOGRAMMETRY_MAX_IMAGE_SIZE=2000
PHOTOGRAMMETRY_KEEP_TEMP_FILES=false
```

## 4. Проверить готовность окружения

```bash
bun run doctor
```

`doctor` проверит env-файлы, Docker CLI и доступность photogrammetry service, если он уже запущен.

## 5. Собрать photogrammetry контейнер

```bash
bun run photogrammetry:build
```

## 6. Запустить photogrammetry вручную

```bash
bun run photogrammetry:up
```

В другом терминале проверьте:

```bash
curl http://localhost:8001/health
```

Должно быть:

```json
{
  "photogrammetry_backend": "colmap",
  "colmap_available": true
}
```

## 7. Запустить Next.js

В отдельном терминале:

```bash
bun install
bun run dev
```

Откройте `http://localhost:3000`.

## 8. Проверить реальный сценарий

1. Войти/зарегистрироваться.
2. Создать проект.
3. Загрузить минимум 10 резких фото одного объекта с перекрытием ракурсов.
4. Запустить scan.
5. Дождаться completed.
6. Проверить, что в Supabase bucket `models-3d` появился `.ply`.
7. Открыть проект и убедиться, что viewer показывает point cloud.

## 9. Остановить сервисы

Next.js: `Ctrl+C` в терминале dev-сервера.

Photogrammetry:

```bash
bun run photogrammetry:down
```

## Если что-то не работает

- `colmap_available=false`: пересоберите контейнер `bun run photogrammetry:build` и проверьте логи запуска.
- Scan падает на reconstruction: нужны более резкие фото с большим перекрытием и текстурой объекта.
- Фото загрузились, но scan не стартует: проверьте `PHOTOGRAMMETRY_SERVICE_URL=http://localhost:8001` в `.env.local`.
- Viewer не показывает модель: проверьте, что файл в `models-3d` действительно `.ply`, bucket public, URL открывается в браузере.
