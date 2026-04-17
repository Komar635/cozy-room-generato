# Настройка Supabase

## 1. Создание проекта

1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите "New Project"
3. Заполните данные проекта
4. Дождитесь создания проекта (~2 минуты)

## 2. Выполнение миграции базы данных

1. Откройте SQL Editor в Supabase Dashboard
2. Скопируйте содержимое файла `migrations/001_initial_schema.sql`
3. Вставьте в SQL Editor
4. Нажмите "Run" для выполнения

## 3. Настройка Storage Buckets

### Создание buckets

1. Перейдите в раздел "Storage" в Supabase Dashboard
2. Создайте следующие buckets:

#### Bucket: `photos`
- **Name**: photos
- **Public**: false (приватный)
- **File size limit**: 10 MB
- **Allowed MIME types**: image/jpeg, image/png, image/webp

#### Bucket: `models-3d`
- **Name**: models-3d
- **Public**: false (приватный)
- **File size limit**: 100 MB
- **Allowed MIME types**: application/octet-stream, model/gltf-binary

### Настройка политик доступа (RLS)

Для каждого bucket выполните следующие SQL-команды в SQL Editor:

```sql
-- Политики для bucket 'photos'
CREATE POLICY "Users can upload photos to own projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Политики для bucket 'models-3d'
CREATE POLICY "Users can upload models to own projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'models-3d' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own models"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'models-3d' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own models"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'models-3d' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 4. Получение API ключей

1. Перейдите в "Settings" > "API"
2. Скопируйте следующие значения:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: `SUPABASE_SERVICE_ROLE_KEY` (⚠️ держите в секрете!)

3. Добавьте их в файл `.env.local`

## 5. Настройка аутентификации

### Email аутентификация

1. Перейдите в "Authentication" > "Providers"
2. Включите "Email" provider
3. Настройте email templates (опционально)

### Google OAuth (опционально)

1. Создайте проект в [Google Cloud Console](https://console.cloud.google.com)
2. Включите Google+ API
3. Создайте OAuth 2.0 credentials
4. Добавьте redirect URI: `https://your-project.supabase.co/auth/v1/callback`
5. Скопируйте Client ID и Client Secret
6. В Supabase Dashboard включите Google provider и добавьте credentials

## 6. Проверка настройки

Выполните следующий SQL-запрос для проверки:

```sql
-- Проверка таблиц
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Проверка RLS политик
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Проверка storage buckets
SELECT * FROM storage.buckets;
```

Должны быть созданы:
- 8 таблиц (projects, photos, models_3d, и т.д.)
- RLS политики для всех таблиц
- 2 storage buckets (photos, models-3d)

## Готово!

Теперь можно запускать приложение:

```bash
bun run dev
```
