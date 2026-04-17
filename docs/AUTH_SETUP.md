# Настройка аутентификации

## Обзор

Система аутентификации построена на NextAuth.js и поддерживает:
- Вход/регистрация через email и пароль
- Вход через Google OAuth
- JWT-токены для сессий
- Защищённые роуты через middleware

## Настройка переменных окружения

Создайте файл `.env.local` на основе `.env.local.example`:

```bash
cp .env.local.example .env.local
```

### Обязательные переменные

1. **NEXTAUTH_SECRET** - секретный ключ для подписи JWT токенов
   ```bash
   # Сгенерируйте случайную строку:
   openssl rand -base64 32
   ```

2. **NEXTAUTH_URL** - URL вашего приложения
   ```
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Supabase** - настройки подключения к базе данных
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

### Настройка Google OAuth (опционально)

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 credentials:
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Скопируйте Client ID и Client Secret в `.env.local`:
   ```
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

## Использование в коде

### Защита страниц (Server Components)

```typescript
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/auth/signin');
  }
  
  return <div>Защищённый контент</div>;
}
```

### Использование в Client Components

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';

export function MyComponent() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) return <div>Загрузка...</div>;
  if (!isAuthenticated) return <div>Требуется вход</div>;
  
  return <div>Привет, {user?.name}!</div>;
}
```

### Защита API routes

```typescript
import { getCurrentUserId } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    // Пользователь авторизован, продолжаем
    return NextResponse.json({ userId });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

## Защищённые роуты

Middleware автоматически защищает следующие роуты:
- `/dashboard/*`
- `/projects/*`
- `/api/projects/*`
- `/api/models/*`
- `/api/modifications/*`

Для добавления новых защищённых роутов отредактируйте `src/middleware.ts`.

## Компоненты

### SignIn
Компонент для входа в систему с поддержкой email и Google OAuth.

```typescript
import { SignIn } from '@/components/auth/SignIn';

<SignIn callbackUrl="/dashboard" />
```

### SignUp
Компонент для регистрации новых пользователей.

```typescript
import { SignUp } from '@/components/auth/SignUp';

<SignUp callbackUrl="/dashboard" />
```

### UserMenu
Компонент для отображения информации о пользователе и кнопки выхода.

```typescript
import { UserMenu } from '@/components/auth/UserMenu';

<UserMenu />
```

## Страницы

- `/auth/signin` - страница входа
- `/auth/signup` - страница регистрации
- `/auth/error` - страница ошибок аутентификации
- `/dashboard` - пример защищённой страницы

## Тестирование

Для тестирования аутентификации:

1. Запустите приложение:
   ```bash
   bun run dev
   ```

2. Откройте http://localhost:3000

3. Попробуйте:
   - Регистрацию через email
   - Вход через email
   - Вход через Google (если настроен)
   - Доступ к защищённым страницам

## Troubleshooting

### Ошибка "Configuration"
- Проверьте, что все переменные окружения установлены
- Убедитесь, что NEXTAUTH_SECRET не пустой

### Ошибка "AccessDenied"
- Проверьте настройки Google OAuth
- Убедитесь, что redirect URI правильный

### Пользователь не создаётся в БД
- Проверьте подключение к Supabase
- Убедитесь, что таблица `users` существует
- Проверьте логи в консоли
