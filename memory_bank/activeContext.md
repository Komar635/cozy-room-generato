# Active Context

## Текущий фокус

Задачи 12-20 закрыты по локальному плану: modification service, checkpoint'ы, сравнение версий, спецификации материалов, обработка ошибок, оптимизация viewer, интеграционные/browserless E2E contract tests, документация и деплой-подготовка. Текущий продуктовый фокус — довести PR-03: реальную фотограмметрию вместо mock-артефакта и стабильный end-to-end scanning pipeline.

## Активные решения

- Использование Supabase для хранения данных
- NextAuth.js для аутентификации
- React Three Fiber для 3D-визуализации
- Gemini API для AI-генерации описаний
- Для задач 7, 9, 12 и 13 Next.js теперь использует server-to-server вызовы Python-сервисов, а source of truth для UI остается в БД
- `POST /api/models/[id]/modify` принимает snake_case API payload и camelCase payload из UI suggestions через общий нормализатор контракта
- Сравнение моделей использует общий `comparisonSync` для clone/sync состояния камеры между двумя viewer'ами
- Спецификация материалов генерируется лениво через `GET /api/modifications/[id]/spec`: сначала пытается Gemini, затем использует детерминированный fallback без новых зависимостей
- Для задачи 16 добавлен централизованный слой ошибок, retry, логирования и сохранения критического состояния с опциональной Sentry-интеграцией без обязательной зависимости
- 3D viewer использует локальный слой `modelPerformance`: progressive preview/full asset load, in-memory cache, compressed URL preference, LOD budgets и frustum culling для mock GS/NeRF представления
- CI/CD подготовлен через GitHub Actions: `CI` выполняет Biome, typecheck, tests и build smoke, а `Vercel Preview Preparation` только валидирует будущие Vercel secrets без деплоя
- Мониторинг подготовлен безопасными feature flags в `src/lib/monitoring`: Vercel Analytics, Sentry и LogRocket выключены по умолчанию и не требуют secrets для сборки

## Приоритеты

1. Заменить mock-артефакт photogrammetry service на реальный COLMAP/NeRF/GS pipeline или зафиксированный production-ready adapter
2. Подключить реальные Vercel/GitHub secrets только во внешних настройках, когда будет принято решение о деплое
3. При необходимости заменить browserless E2E contract harness на полноценные Playwright-сценарии

## Известные неопределенности

- Точный формат вывода Gemini API
- Пределы бесплатного tier
- Python photogrammetry service все еще генерирует mock-артефакт вместо реального COLMAP/NeRF/GS pipeline
- Python modification service возвращает artifact metadata, но пока не сохраняет состояние в БД самостоятельно
- Playwright не установлен; для задачи 19 используется браузер-независимый E2E contract harness, покрывающий пользовательские сценарии на уровне стабильных маршрутов, селекторов и API контрактов
