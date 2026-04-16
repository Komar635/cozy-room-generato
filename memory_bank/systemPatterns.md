# System Patterns

## Архитектура приложения

### Frontend architecture
- **App Router:** страницы и route handlers организованы через `app/**`
- **Store-centric UI:** основной сценарий комнаты управляется через `store/room-store.ts`
- **Client-only 3D boundary:** 3D сцена и связанные компоненты загружаются через `dynamic(..., { ssr: false })`

## Ключевые паттерны

### 1. Централизованное состояние комнаты
- Zustand хранит размеры комнаты, мебель, стиль, бюджет, историю Undo/Redo, уведомления и параметры производительности.
- UI-компоненты читают и изменяют единое состояние вместо локальной синхронизации между панелями.

### 2. Гибридный AI pipeline
- Клиент вызывает `AIApiService`.
- Route handlers в `app/api/ai/**` сначала обращаются к `RoomGPTApiService`, затем переключаются на `LocalAIService`.
- Рекомендации и оптимизация бюджета нормализуются под RUB/`ru-RU` перед возвратом в UI.

### 3. Гибридное сохранение проектов
- Используются JSON export/import, локальные сохранения в браузере и API-обертка для room project.
- `ProjectManager` работает как оркестратор пользовательских сценариев сохранения, экспорта PNG/TXT и локальной истории проектов.
- API `room/save` пока не является полноценным persistent backend.

### 4. Паттерн UI feedback
- Store пишет уведомления в `notifications`.
- `StoreFeedbackProvider` преобразует store-уведомления в toast UI и удаляет их после показа.
- Для долгих операций используются `AsyncButton`, loading overlays и явные текстовые статусы.
- Для темы применяется ранняя инициализация через inline script в `app/layout.tsx`, чтобы синхронизировать `documentElement` до hydration и избежать FOUC.
- Motion-слой опирается на глобальные utility-анимации в `app/globals.css` и используется точечно на header, landing, workspace и feedback overlays вместо тяжелой animation-библиотеки.

### 5. 3D performance-first rendering
- Выбор quality presets зависит от эвристики устройства/GPU.
- Используются LOD, frustum culling, lazy loading моделей и preloading популярных объектов.
- `Scene` предоставляет imperative `captureImage()` поверх `RoomCanvas` для экспорта изображения.
- Фоновая загрузка моделей дополнительно отражается в canvas overlay, чтобы пользователь видел состояние догрузки heavy assets.
- Для performance proof добавлен lab-поток `/room/performance`: он загружает фиксированный baseline project в основной store и снимает метрики через `RoomPerformanceProbe` прямо из production-like canvas.
- Воспроизводимый headless capture автоматизируется скриптом `scripts/collect-3d-performance.mjs`, который сохраняет evidence JSON в `docs/perf-evidence/3d-performance-baseline.json`.

### 8. Responsive room workspace
- Основной экран `/room` строится как mobile-first вертикальный flow, а в desktop-layout переключается на split panel через глобальные utility-классы.
- `room-setup-container` и `room-3d-viewport` служат базовыми layout hooks для координации прокрутки панели настроек и минимальных размеров сцены.

### 9. Global keyboard action layer
- Горячие клавиши собраны в `lib/hooks/use-keyboard-shortcuts.tsx` и активируются глобально через `AppHeader`, который смонтирован в корневом layout.
- Shortcut-слой покрывает основные действия редактирования и проекта: undo/redo, delete, duplicate, deselect, save, new project, toggle theme и shortcuts help.

### 6. Server-assisted validation
- Форма размеров комнаты валидирует ввод локально и подтверждает расчеты через `/api/room/validate`.
- UI показывает локальные расчеты до серверной проверки и серверные метрики после успешного ответа.

### 7. Тестирование слоями
- Unit тесты покрывают store и 3D utility функции.
- Integration тесты проверяют route handlers с моками AI сервисов.
- Playwright покрывает базовые пользовательские сценарии и кроссбраузерную матрицу устройств.
