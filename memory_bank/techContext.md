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
- **Testing**: Bun test

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

## Настройки CI/CD

CI/CD не настроен. Деплой через Vercel.