# Оцифровщик реальности в 3D

Веб-приложение для создания фотореалистичных 3D-копий объектов мебели и декора с возможностью их модификации.

## Технологический стек

- **Runtime**: Bun (быстрая альтернатива Node.js)
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Authentication**: NextAuth.js
- **3D Visualization**: Three.js, React Three Fiber
- **LLM**: Google Gemini API (бесплатный tier)
- **Testing**: Bun test (встроенное тестирование)

## Установка

### 0. Установка Bun (если еще не установлен)

```bash
# Windows
powershell -c "irm bun.sh/install.ps1|iex"

# macOS/Linux
curl -fsSL https://bun.sh/install | bash
```

### 1. Установка зависимостей

```bash
bun install
```

### 2. Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Скопируйте URL проекта и API ключи
3. Выполните миграцию базы данных:
   - Откройте SQL Editor в Supabase Dashboard
   - Скопируйте содержимое `supabase/migrations/001_initial_schema.sql`
   - Выполните SQL-скрипт

### 3. Настройка переменных окружения

Создайте файл `.env.local` на основе `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Заполните переменные:

```env
# Supabase (из Supabase Dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key  # Сгенерируйте: openssl rand -base64 32

# Google Gemini API (бесплатно на ai.google.dev)
GEMINI_API_KEY=your-gemini-api-key

# Python-микросервисы
PHOTOGRAMMETRY_SERVICE_URL=http://localhost:8001
MODIFICATION_SERVICE_URL=http://localhost:8002
```

### 4. Получение Google Gemini API ключа (бесплатно)

1. Перейдите на [ai.google.dev](https://ai.google.dev)
2. Нажмите "Get API key"
3. Создайте новый API ключ
4. Скопируйте ключ в `.env.local`

## Запуск проекта

### Режим разработки

```bash
bun run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

### Python-микросервисы

Для реального запуска сканирования и модификаций должны быть доступны отдельные сервисы:

- photogrammetry service на `PHOTOGRAMMETRY_SERVICE_URL`
- modification service на `MODIFICATION_SERVICE_URL`

Приложение Next.js теперь вызывает их server-to-server, поэтому без этих сервисов `scan` и `modify` маршруты будут возвращать ошибку интеграции.

#### Photogrammetry через Docker без фонового автозапуска

В репозитории есть Docker-конфигурация только для ручного запуска real photogrammetry pipeline на COLMAP.

Она **ничего не запускает сама**, не имеет `restart: always` и не потребляет CPU/RAM, пока вы явно не выполните команду `docker compose`. Единственный внешний ресурс во время работы scan — ваш Supabase Storage/DB.

1. Создайте env-файл сервиса:

```bash
cp services/photogrammetry/.env.example services/photogrammetry/.env
```

2. Заполните в `services/photogrammetry/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
COLMAP_BIN=colmap
```

3. Соберите контейнер вручную, когда он нужен:

```bash
docker compose --profile photogrammetry build photogrammetry
```

4. Запустите сервис вручную:

```bash
docker compose --profile photogrammetry up photogrammetry
```

5. Проверьте health endpoint:

```bash
curl http://localhost:8001/health
```

Ожидаемо:

```json
{
  "photogrammetry_backend": "colmap",
  "colmap_available": true
}
```

6. Остановить сервис:

```bash
docker compose --profile photogrammetry down
```

После `down` контейнер не работает и ресурсы не потребляет. Docker volume `photogrammetry_tmp` хранит только временную рабочую директорию; его можно удалить при необходимости:

```bash
docker volume rm restvration_photogrammetry_tmp
```

Подробный пошаговый запуск реального сценария описан в [`docs/local-real-runbook.md`](docs/local-real-runbook.md).

### Сборка для продакшена

```bash
bun run build
bun start
```

### Подготовка к Vercel

- Используйте `vercel.json` как безопасную базовую конфигурацию: зависимости ставятся через `bun install --frozen-lockfile`, сборка выполняется через `bun run build`.
- Продакшен-переменные переносите из `.env.production.example` в Vercel Project Settings; реальные секреты не коммитьте.
- GitHub Actions `CI` запускает Biome, TypeScript, `bun test` и smoke-сборку без внешних секретов.
- Workflow `Vercel Preview Preparation` только проверяет наличие `VERCEL_TOKEN`, `VERCEL_ORG_ID` и `VERCEL_PROJECT_ID`; реальный деплой намеренно не запускается.

### Мониторинг

Мониторинг подготовлен через безопасные флаги окружения и не обязателен для сборки:

```env
NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS=false
NEXT_PUBLIC_ENABLE_SENTRY=false
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_ENABLE_LOGROCKET=false
NEXT_PUBLIC_LOGROCKET_APP_ID=
```

Пока соответствующие SDK и секреты не подключены в Vercel, оставляйте флаги выключенными. Текущая конфигурация доступна через `src/lib/monitoring` и не ломает build без ключей.

## Тестирование

```bash
# Запуск всех тестов
bun test

# Проверка TypeScript
bunx tsc --noEmit

# Запуск в watch режиме
bun test --watch
```

### Интеграционные и E2E contract tests

Для полного цикла без реальных внешних сервисов добавлены локальные contract tests:

- `src/app/api/__tests__/scan-modify-integration.test.ts` — upload -> scan -> model -> modify контракты.
- `src/app/api/__tests__/e2e-contract-harness.test.ts` — browserless E2E harness для создания проекта, загрузки фото, сканирования, визуализации, модификации и сравнения.

Playwright не установлен. Браузерные E2E тесты не запускаются; текущий harness документирует стабильные API/UI контракты без запуска dev-сервера.

## Структура проекта

```
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── auth/           # Страницы аутентификации
│   │   └── projects/       # Страницы проектов
│   ├── components/         # React компоненты
│   ├── lib/               # Утилиты и конфигурация
│   │   ├── supabase/      # Supabase клиенты
│   │   └── auth/          # NextAuth конфигурация
│   └── types/             # TypeScript типы
├── supabase/
│   └── migrations/        # SQL миграции
└── public/                # Статические файлы
```

## Бесплатные лимиты

### Supabase Free Tier
- 500MB база данных
- 1GB хранилище файлов
- 50,000 активных пользователей/месяц
- 2GB bandwidth

### Google Gemini API Free Tier
- 60 запросов в минуту
- 1,500 запросов в день
- Бесплатно навсегда

## Следующие шаги

1. Настройте Supabase Storage buckets для фотографий и 3D-моделей
2. Реализуйте компоненты аутентификации (задача 2)
3. Создайте интерфейс управления проектами (задача 3)

## Документация

- [Документация проекта](docs/README.md)
- [API Reference](docs/api.md)
- [Архитектура](docs/architecture.md)
- [Руководство пользователя](docs/user-guide.md)
- [FAQ](docs/faq.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Three.js Documentation](https://threejs.org/docs)
- [Google Gemini API](https://ai.google.dev/docs)
