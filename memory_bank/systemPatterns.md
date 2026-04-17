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
3. Gemini API обрабатывает фото
4. Результат сохраняется в БД
5. Three.js визуализирует модель

## Зависимости подсистем

- Supabase → PostgreSQL
- NextAuth → Supabase Auth
- Three.js → WebGL
- Gemini API → External API