# Где найти ключи Supabase

## 1. URL проекта и API ключи

**Путь**: Settings (⚙️) → API

Там вы найдете:
- **Project URL**: `https://xxx.supabase.co`
- **anon public key**: длинный ключ начинающийся с `eyJ...`
- **service_role key**: еще один длинный ключ (НЕ ПУБЛИКУЙТЕ ЕГО!)

## 2. Строка подключения к базе данных

**Путь**: Settings (⚙️) → Database → Connection string → URI

Формат:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
```

Замените `[YOUR-PASSWORD]` на пароль, который вы создали при создании проекта.

## 3. Заполнение .env.local

После получения всех ключей, откройте файл `.env.local` и заполните:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJхххххх...

# Database
DATABASE_URL=postgresql://postgres:ВАШ_ПАРОЛЬ@db.xxx.supabase.co:5432/postgres

# NextAuth (уже заполнено)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=oT9D4QHGYhi0Tk46aT+qWsaDWUiNuoObfIUK1EcLM2A=
```

## 4. Применение миграций

После заполнения `.env.local`:

```bash
# Применить миграции к Supabase
bunx prisma db push

# Сгенерировать Prisma Client
bunx prisma generate
```

## 5. Запуск проекта

```bash
bun dev
```

Откройте http://localhost:3000 и попробуйте зарегистрироваться!