# Tech Context

## Технологический стек

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.9.x
- **UI:** React 18, Tailwind CSS 3.4, shadcn/ui, Radix UI
- **3D:** Three.js, `@react-three/fiber`, `@react-three/drei`
- **State:** Zustand

### Backend и данные
- **API слой:** Next.js Route Handlers в `app/api/**`
- **Хранилище проектов:** локальный `localStorage`, JSON import/export, API-обертка для room save/load
- **Каталог данных:** локальные TS/JSON базы мебели и шаблонов стилей
- **Database groundwork:** Supabase client и SQL migration присутствуют, но постоянное серверное хранение комнат еще не доведено до рабочего потока

### AI и внешние сервисы
- **Primary AI path:** `RoomGPTApiService` / внешние AI провайдеры
- **Fallback AI:** `LocalAIService` для рекомендаций, планировки и оптимизации бюджета
- **Image generation:** требует внешний ключ; локального фолбэка нет
- **Marketplace/Supabase services:** код и заготовки интеграций присутствуют, использование остается частично опциональным

### Инструменты разработки
- **Linting:** ESLint (`next lint`)
- **Unit/Integration tests:** Jest + Testing Library + `ts-jest`
- **E2E tests:** Playwright
- **Docs for QA:** `docs/TESTING.md`, `docs/CROSS_BROWSER_DEVICE_MATRIX.md`, `docs/3D_PERFORMANCE_BASELINE.md`
- **3D perf tooling:** `/room/performance`, `RoomPerformanceProbe`, `scripts/collect-3d-performance.mjs`, JSON evidence in `docs/perf-evidence/`

## Скрипты

### Основные команды
```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
npm run test:unit
npm run test:integration
npm run test:e2e
npm run perf:3d
```

### Пакетные менеджеры
- В репозитории есть `package-lock.json`, `pnpm-lock.yaml` и `bun.lock`.
- Локальные скрипты описаны через npm-совместимый `package.json`.
- CI и Vercel конфигурация ориентированы на pnpm.

## Окружение

### Системные требования
- Node.js 18+ локально; в CI используется Node.js 20
- Современный браузер с WebGL

### Переменные окружения
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI providers
OPENAI_API_KEY=
REPLICATE_API_TOKEN=
HUGGINGFACE_API_KEY=

# AI localization / budgets
MIN_BUDGET_RUB=
MIN_DESIGN_BUDGET_RUB=
CURRENCY=RUB
LOCALE=ru-RU

# Deployment
NEXT_PUBLIC_APP_URL=
```

### Порты
- **Local dev:** обычно `3000`; исторически использовался и `3001`, если `3000` занят
- **Playwright webServer:** `3100`

## Архитектурные ограничения и особенности
- 3D-сцена и тяжелые интерактивные модули загружаются как client-only через dynamic import.
- Производительность WebGL адаптируется под устройство: quality presets, LOD, culling, lazy loading.
- AI ответы и оптимизация форматируются под рубли и `ru-RU`.
- Сохранение проекта имеет несколько путей, но серверный persistent backend для комнат пока не завершен.

## CI/CD и деплой
- **GitHub Actions:** `.github/workflows/deploy.yml`
- **CI шаги:** checkout, Node 20, pnpm install, lint, build, test
- **Особенность:** шаг `Run tests` помечен `continue-on-error: true`
- **Hosting:** `vercel.json` настроен для Next.js, security headers и cache rules присутствуют

## Известные проблемы
- В части AI route handlers все еще встречаются поврежденные кириллические строки.
- `test-results/` может содержать старые Playwright артефакты прошлых падений, даже если текущий matrix smoke уже проходит успешно.
- Единый стандарт package manager в проекте пока не закреплен.
