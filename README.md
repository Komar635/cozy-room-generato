# Оцифровщик реальности в 3D

Веб-приложение для создания фотореалистичных 3D-копий объектов мебели и декора с возможностью их модификации.

## Технологический стек

- **Runtime**: Bun (быстрая альтернатива Node.js)
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Authentication**: NextAuth.js
- **3D Visualization**: Three.js, React Three Fiber
- **LLM**: Google Gemini API (бесплатный tier)
- **Testing**: Bun test (встроенное тестирование)

## Установка

### 0. Установка Bun (если еще не установлен)

```bash
# Windows
powershell -c "irm bun.sh/install.ps1|iex"

# macOS/Linux
curl -fsSL https://bun.sh/install | bash
```

### 1. Установка зависимостей

```bash
bun install
```

### 2. Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Скопируйте URL проекта и API ключи
3. Выполните миграцию базы данных:
   - Откройте SQL Editor в Supabase Dashboard
   - Скопируйте содержимое `supabase/migrations/001_initial_schema.sql`
   - Выполните SQL-скрипт

### 3. Настройка переменных окружения

Создайте файл `.env.local` на основе `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Заполните переменные:

```env
# Supabase (из Supabase Dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key  # Сгенерируйте: openssl rand -base64 32

# Google Gemini API (бесплатно на ai.google.dev)
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Получение Google Gemini API ключа (бесплатно)

1. Перейдите на [ai.google.dev](https://ai.google.dev)
2. Нажмите "Get API key"
3. Создайте новый API ключ
4. Скопируйте ключ в `.env.local`

## Запуск проекта

### Режим разработки

```bash
bun run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

### Сборка для продакшена

```bash
bun run build
bun start
```

## Тестирование

```bash
# Запуск всех тестов
bun test

# Запуск в watch режиме
bun test --watch
```

## Структура проекта

```
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── auth/           # Страницы аутентификации
│   │   └── projects/       # Страницы проектов
│   ├── components/         # React компоненты
│   ├── lib/               # Утилиты и конфигурация
│   │   ├── supabase/      # Supabase клиенты
│   │   └── auth/          # NextAuth конфигурация
│   └── types/             # TypeScript типы
├── supabase/
│   └── migrations/        # SQL миграции
└── public/                # Статические файлы
```

## Бесплатные лимиты

### Supabase Free Tier
- 500MB база данных
- 1GB хранилище файлов
- 50,000 активных пользователей/месяц
- 2GB bandwidth

### Google Gemini API Free Tier
- 60 запросов в минуту
- 1,500 запросов в день
- Бесплатно навсегда

## Следующие шаги

1. Настройте Supabase Storage buckets для фотографий и 3D-моделей
2. Реализуйте компоненты аутентификации (задача 2)
3. Создайте интерфейс управления проектами (задача 3)

## Документация

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Three.js Documentation](https://threejs.org/docs)
- [Google Gemini API](https://ai.google.dev/docs)
