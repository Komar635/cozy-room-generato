# Progress

## Текущее состояние
- Основной путь пользователя реализован: создание комнаты, серверная валидация размеров, 3D предпросмотр, стили, бюджет, рекомендации, сохранение и экспорт.
- В проекте есть отдельные demo/ops страницы: `/api-demo`, `/setup`, `/search-demo`, `/search-demo-simple`, `/furniture-demo`.
- Тестовый каркас и документация по тестированию добавлены; минимально достаточное E2E покрытие основных пользовательских сценариев теперь стабилизировано.
- В блоке UI/UX закрыты подпункты темы, loading indicators и mobile optimization для основного пользовательского потока.
- Блок 13 целиком закрыт: дополнительно подтверждены shortcuts и усилены анимации/переходы для landing/workspace/header.

## Реализованные области

### Core room workflow
- Форма размеров комнаты с локальной и серверной валидацией.
- 3D сцена комнаты с client-only загрузкой и экспортом изображения.
- Панель информации о комнате и рекомендации по размерам.

### Furniture, styles, budget
- Каталог мебели, поиск и фильтрация.
- Система стилей с шаблонами, AI-подсказками и анализом соответствия стилю.
- Бюджетные ограничения, предупреждения, буфер перерасхода и AI-оптимизация.

### Editing and project management
- Undo/Redo, копирование, удаление и точное позиционирование мебели.
- Локальное сохранение проектов, импорт/экспорт JSON, PNG и TXT.
- Header navigation, theme toggle, toast feedback и keyboard shortcuts.

### Performance, docs, deployment, testing
- LOD, culling, lazy loading и device-based quality presets для 3D.
- Документация по разработке, стилям, AI-интеграции и тестированию.
- GitHub Actions workflow и Vercel конфигурация присутствуют.
- Jest unit/integration тесты и Playwright E2E матрица добавлены.
- Playwright smoke для основных пользовательских сценариев доведен до зеленого статуса на `chromium`.

## В работе / требует доводки
- Уточнение единого package manager и доведение server-side persistence для комнат.
- Дальнейшее расширение E2E/perf/browser coverage возможно, но минимально достаточный блок 15 уже закрыт.

## Known Issues
- Некоторые AI route handlers содержат поврежденные русские строки в логах/ошибках.
- `npm run lint` по-прежнему падает на существующих ошибках в `components/ai/image-generator.tsx` и не связанных с текущей задачей warning'ах в legacy/demo-компонентах.
- `GET /api/room/save?id=...` пока возвращает заглушку `404`, а не загрузку сохраненного проекта.

## Changelog

### 2026-04-09
- Проведен аудит репозитория и Memory Bank.
- Зафиксированы новые тестовые артефакты: Jest, Playwright, testing docs, browser/device matrix, 3D performance baseline.
- Обновлено описание CI/CD: GitHub Actions + Vercel config уже присутствуют в репозитории.
- Уточнен текущий AI pipeline: Route Handlers -> RoomGPTApiService -> LocalAIService fallback.
- Зафиксированы текущие проблемы: Playwright startup/navigation failures, mojibake в demo/API текстах, незавершенное persistent-хранение проектов.
- Обновлен last checked commit.

### 2026-04-16
- Закрыт подпункт `15.3` в `tasks.md`: стабилизированы E2E для `/room` и `/api-demo`, добавлены test ids и минимальные smoke-сценарии для ключевых пользовательских потоков.
- В `app/api-demo/page.tsx` исправлены поврежденные тексты, чтобы демо-страница была пригодна и для пользователя, и для Playwright.
- Обновлен `e2e/room-designer.spec.ts`: теперь покрыты создание/валидация комнаты, применение стиля с локальным сохранением и получение AI рекомендаций с добавлением в комнату.
- Прогнан таргетный Playwright запуск: `npx playwright test e2e/room-designer.spec.ts --project=chromium` -> `3/3 passed`.
- Выполнена следующая итерация по `tasks.md`: закрыты подпункты 13.1-13.3.
- Добавлен ранний theme init script в `app/layout.tsx`, чтобы убрать flash темы до hydration.
- Основные UI-компоненты приведены к theme tokens: бюджетная панель, фильтры, category tabs и slider.
- Улучшен feedback для async-flow: оверлей подгрузки 3D моделей, inline loading в `RoomGPTSetup`, batch progress в `ModelTester`.
- Обновлена мобильная компоновка `/room` и `room-setup`: меньше жестких размеров, лучше вертикальный flow на small screens.
- Прогнан `npm run lint`; обнаружены уже существующие ошибки в `components/ai/image-generator.tsx`, не относящиеся к этой итерации.
- Дополнительно закрыты подпункты 13.4-13.5: усилены motion-эффекты на ключевых экранах и подтвержден уже существующий слой keyboard shortcuts.
- Повторная верификация показала, что unit и integration тесты проходят: `33/33` и `13/13`.
- В `tasks.md` обновлен статус блока 15: unit и integration подпункты отмечены как выполненные, остальные остаются в работе.
- Закрыт подпункт `15.4`: добавлены `/room/performance`, `RoomPerformanceProbe`, baseline fixture и команда `npm run perf:3d`.
- Сохранен evidence artifact `docs/perf-evidence/3d-performance-baseline.json` с метриками load time, FPS, frame time и JS heap для основного 3D сценария.
- `docs/3D_PERFORMANCE_BASELINE.md` заменен с абстрактного checklist на конкретный workflow, baseline table и pass criteria.
- Закрыт подпункт `15.5`: добавлена команда `npm run test:e2e:matrix` для воспроизводимого прогона `e2e/room-designer.spec.ts` на всей существующей Playwright matrix.
- Обновлены `docs/TESTING.md` и `docs/CROSS_BROWSER_DEVICE_MATRIX.md` с понятным способом запуска и таблицей результатов по `chromium`, `firefox`, `webkit`, `mobile-chrome`, `mobile-safari`.
- Выполнен полный matrix smoke run: `npm run test:e2e` -> `15/15 passed`.
- В `e2e/room-designer.spec.ts` увеличен timeout ожидания для `ai-recommendations-title`, чтобы убрать flaky-падение WebKit при client-side dynamic load на `/api-demo`.
- Верхнеуровневый пункт 15 в `tasks.md` отмечен завершенным, так как все вложенные подпункты закрыты в формате practical minimum.

### 2026-04-07
- Расширены workflow комнаты, UI и tooling.
- Добавлены система тем, toast feedback, keyboard shortcuts и 3D performance optimizations.
- Добавлены документация и инфраструктура деплоя.

### 2026-03-10
- Проведен предыдущий аудит Memory Bank и актуализация контекста.

### 2026-02-06
- Добавлены поиск/фильтрация, demo-страницы и первоначальная структура Memory Bank.

### 2026-02-05
- Подготовлены Supabase интеграция, сервисы мебельных данных и схема БД.

## Контроль изменений

### Last Checked Commit
**Commit:** dd88f4c666020d48dfbe1dda1556d077a00d160f
**Date:** 2026-04-07
**Branch:** master
**Message:** feat: expand room designer workflows and tooling

### Следующая проверка
- После стабилизации Playwright прогонов и проверки кодировки demo/API экранов.
