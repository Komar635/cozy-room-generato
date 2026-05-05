# System Patterns

## Архитектура

### Frontend (Next.js 14 App Router)
```
src/app/
├── api/           # API routes
├── auth/          # Аутентификация
└── projects/      # Управление проектами
```

### База данных (Supabase/PostgreSQL)
- users: Пользователи
- projects: Проекты пользователей
- models: 3D-модели

## Паттерны

### Client-Server
- Next.js как frontend и API
- Supabase как backend-as-a-service

### Authentication Flow
- NextAuth.js с Supabase провайдером
- JWT токены для сессий

### Data Flow
1. Пользователь загружает фото
2. Фото сохраняется в Supabase Storage
3. `POST /api/projects/[id]/scan` вызывает photogrammetry service server-to-server
4. Результат и прогресс сохраняются в БД как source of truth для UI
5. Three.js визуализирует модель
6. `POST /api/models/[id]/modify` вызывает modification service и создает производную модель с lineage к оригиналу
7. После модификации `GET /api/modifications/[id]/spec` лениво формирует спецификацию материалов и сохраняет ее в `material_specifications`

### Testing Contracts
- Интеграционный слой задачи 19 использует `src/lib/testing/scan-modify-contracts.ts` для проверки полного scan/modify цикла без реальных Supabase/Gemini/Python сервисов.
- Browserless E2E contract harness фиксирует пользовательские сценарии и UI-сигналы без Playwright, браузера и dev-сервера.

## Зависимости подсистем

- Supabase → PostgreSQL
- NextAuth → Supabase Auth
- Three.js → WebGL
- Gemini API → External API
- Next.js API → Python photogrammetry/modification services через server-to-server HTTP

## Deployment Preparation Pattern

- GitHub Actions разделены на обязательный CI smoke path и безопасную подготовку Vercel preview без реального деплоя.
- Production env хранится как шаблон `.env.production.example`; secrets должны задаваться только во внешних настройках Vercel/GitHub.
- Мониторинг подключается через централизованный `src/lib/monitoring` и feature flags, чтобы отсутствие Sentry/LogRocket/Vercel Analytics secrets не ломало локальные проверки и production build.
