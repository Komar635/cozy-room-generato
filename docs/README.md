# Документация Reality Digitizer 3D

Этот каталог содержит рабочую документацию проекта. Высокоуровневая архитектура описана здесь и синхронизируется с Memory Bank.

## Архитектура

Reality Digitizer 3D состоит из Next.js приложения и Python-микросервисов:

- `src/app` — Next.js 14 App Router, страницы, API routes и серверные адаптеры.
- `src/components` — React UI для проектов, загрузки фото, 3D viewer, сравнения версий, анализа и материалов.
- `src/lib` — общие контракты, Supabase/Prisma клиенты, обработка ошибок, генерация спецификаций и тестовые harness-модули.
- `services/photogrammetry` — FastAPI сервис фотограмметрии; сейчас возвращает mock-артефакты вместо реального COLMAP/NeRF/GS pipeline.
- `services/modification` — FastAPI сервис модификации моделей; возвращает metadata артефакта, а персистентность в БД выполняет Next.js API.
- `services/style-analysis` — FastAPI/Gemini сервис анализа стиля, предложений и материалов; в Next.js есть deterministic fallback для локальной устойчивости.

## Поток данных

1. Пользователь создает проект через `POST /api/projects`.
2. Пользователь загружает минимум 10 фотографий через `POST /api/projects/[id]/photos`.
3. Next.js сохраняет фото в Supabase Storage и metadata в `photos`.
4. `POST /api/projects/[id]/scan` вызывает photogrammetry service server-to-server без раскрытия URL сервиса клиенту.
5. Статус читается через `GET /api/projects/[id]/scan/status` и таблицу `processing_jobs`.
6. Готовая модель хранится в `models_3d` и отображается в `Model3DViewer`.
7. Анализ стиля и suggestions создаются для модели через API `models/[id]/*`.
8. `POST /api/models/[id]/modify` создает pending modification/job, вызывает modification service и записывает производную модель.
9. Пользователь сравнивает версии через `ComparisonView` и получает спецификацию материалов через `GET /api/modifications/[id]/spec`.

## API

Подробное описание маршрутов находится в `docs/api.md`.

Ключевые маршруты:

- `GET /api/projects`, `POST /api/projects`
- `GET /api/projects/[id]`, `DELETE /api/projects/[id]`
- `GET /api/projects/[id]/photos`, `POST /api/projects/[id]/photos`
- `POST /api/projects/[id]/scan`, `GET /api/projects/[id]/scan/status`
- `GET /api/projects/[id]/models`
- `POST /api/models/[id]/analyze`, `GET /api/models/[id]/analysis`
- `GET /api/models/[id]/suggestions`
- `POST /api/models/[id]/modify`
- `GET /api/projects/[id]/modify/status`
- `GET /api/modifications/[id]`
- `GET /api/modifications/[id]/spec`

## Тестирование

Основной runtime и пакетный менеджер — Bun.

```bash
bun test
bunx tsc --noEmit
```

Для задачи 19 добавлены локальные тесты без реальных внешних сервисов:

- `src/app/api/__tests__/scan-modify-integration.test.ts` — полный цикл upload contract -> scan service contract -> model persistence contract -> modification service contract.
- `src/app/api/__tests__/e2e-contract-harness.test.ts` — browserless E2E contract harness для сценариев создания проекта, загрузки фото, сканирования, визуализации, модификации и сравнения версий.

Playwright не установлен в проекте. Вместо браузерных E2E тестов используется устойчивый contract harness без запуска браузера и dev-сервера; ограничение зафиксировано в документации и Memory Bank.

## Документация

- `README.md` — быстрый старт и карта проекта.
- `docs/api.md` — API reference.
- `docs/architecture.md` — архитектура и границы подсистем.
- `docs/user-guide.md` — пользовательское руководство.
- `docs/faq.md` — FAQ.
