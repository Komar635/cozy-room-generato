# Architecture

## Runtime Boundaries

Проект разделен на четыре runtime-зоны:

| Zone | Path | Responsibility |
|------|------|----------------|
| Web UI | `src/app`, `src/components` | Пользовательские страницы, загрузка фото, 3D viewer, сравнение и материалы |
| Next.js API | `src/app/api` | Авторизация, доступ к данным, server-to-server вызовы микросервисов, сохранение состояния |
| Shared Library | `src/lib` | Контракты, Prisma/Supabase клиенты, ошибки, fallback-генераторы, testing harness |
| Python Services | `services/*` | Фотограмметрия, анализ стиля, модификация модели |

## Data Ownership

Source of truth для UI — база данных Supabase/PostgreSQL.

- `projects` хранит статус пользовательского проекта.
- `photos` хранит metadata фотографий; файлы находятся в Supabase Storage.
- `models_3d` хранит оригинальные и производные версии моделей.
- `processing_jobs` хранит scan/modify прогресс.
- `style_analyses` и `modification_suggestions` хранят AI-результаты.
- `modifications` хранит lineage модификации: оригинальная модель, новая модель, параметры, статус.
- `material_specifications` хранит лениво созданные спецификации материалов.

## Scan Flow

1. UI отправляет фотографии в `POST /api/projects/[id]/photos`.
2. API валидирует формат/размер, загружает файлы в Storage и записывает metadata.
3. UI вызывает `POST /api/projects/[id]/scan`, если сохранено минимум 10 фото.
4. API проверяет владельца проекта, переводит проект в `scanning` и вызывает `PHOTOGRAMMETRY_SERVICE_URL/scan`.
5. Статус читается из `GET /api/projects/[id]/scan/status`.
6. Когда job завершен, проект переводится в `ready`; модель отображается через `GET /api/projects/[id]/models`.

## Modification Flow

1. UI получает suggestions через `GET /api/models/[id]/suggestions`.
2. UI отправляет выбранную модификацию в `POST /api/models/[id]/modify`.
3. API нормализует camelCase/snake_case payload и маппит `geometry` в service value `geometry_change`.
4. API создает pending `processing_jobs` и `modifications`, затем вызывает `MODIFICATION_SERVICE_URL/modify`.
5. При успешном ответе создается новая `models_3d` с `parent_model_id` исходной модели.
6. UI может сравнить версии через `ComparisonView` и получить материалы через `GET /api/modifications/[id]/spec`.

## Error Handling

Upload, scan и modify используют общий слой `src/lib/errors`:

- нормализованные типы ошибок;
- retry для временных сетевых/5xx ошибок;
- централизованное логирование;
- сохранение критического состояния;
- человекочитаемые рекомендации для UI.

## Testing Strategy

Тесты делятся на уровни:

- Unit/property tests для валидации фото, контрактов анализа, синхронизации камер, ошибок и производительности.
- Integration contract tests для полного scan/modify цикла без реальных Supabase/Gemini/Python сервисов.
- Browserless E2E contract harness вместо Playwright runtime, потому что Playwright не установлен и dev-сервер не должен запускаться в рамках текущей задачи.

## Current Limitations

- Photogrammetry service пока создает mock-артефакт, а не полноценный COLMAP/NeRF/GS результат.
- Modification service возвращает metadata артефакта, но не владеет персистентностью в БД.
- Playwright browser tests не добавлены; contract harness фиксирует сценарии и точки интеграции без запуска браузера.
- Production CI/CD и мониторинг относятся к задаче 20.
