# Tech Context

## Стек технологий

- **Runtime**: Bun
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: NextAuth.js
- **3D**: Three.js, React Three Fiber
- **AI**: Google Gemini API
- **Testing**: Bun test, fast-check property tests, browserless E2E contract harness

## Окружение

### Разработка
- Node.js (Bun)
- Supabase Local (опционально)

### Продакшен
- Vercel (Frontend)
- Supabase Cloud (Backend)

## Внешние сервисы

1. **Supabase**
   - Database: PostgreSQL
   - Auth: User management
   - Storage: Файлы и изображения

2. **Google Gemini API**
   - AI генерация описаний
   - Бесплатный tier: 60 req/min

## Ограничения

- Supabase Free: 500MB DB, 1GB Storage
- Rate limits Gemini API
- Max file size: 10MB
- Playwright не установлен; E2E сценарии задачи 19 покрыты contract harness без запуска браузера/dev-сервера

## Настройки CI/CD

CI/CD подготовлен через GitHub Actions без реального деплоя:

- `.github/workflows/ci.yml` использует Bun, `bun install --frozen-lockfile`, Biome, TypeScript, `bun test` и production build smoke test с placeholder env без секретов.
- `.github/workflows/vercel-preview.yml` проверяет наличие `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` и намеренно пропускает deployment step, пока секреты и политика деплоя не включены вручную.
- `vercel.json` задает Next.js framework, Bun install command и build command.
- `.env.production.example` служит шаблоном production env для Vercel Project Settings; реальные значения не хранятся в репозитории.

## Мониторинг

- `src/lib/monitoring` хранит безопасные feature flags для Vercel Analytics, Sentry и LogRocket.
- Все monitoring flags по умолчанию выключены, optional DSN/app id могут быть пустыми, build не требует SDK или secrets.
