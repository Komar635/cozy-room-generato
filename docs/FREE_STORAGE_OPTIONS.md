# Бесплатные варианты хранилища файлов

## 🏆 Лучшие бесплатные варианты:

### 1. Supabase Storage (РЕКОМЕНДУЮ)
**Бесплатно: 1 GB**

✅ Плюсы:
- Полностью бесплатно до 1 GB
- S3-совместимый API
- Встроенная аутентификация
- CDN для быстрой загрузки
- Автоматическая оптимизация изображений

❌ Минусы:
- Ограничение 1 GB
- Не российский сервис

**Настройка:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Cloudflare R2 (Бесплатный план)
**Бесплатно: 10 GB хранилища + 10 GB трафика/месяц**

✅ Плюсы:
- 10 GB бесплатно!
- S3-совместимый API
- Без платы за трафик
- Быстрый CDN

❌ Минусы:
- Нужна банковская карта для регистрации
- Английский интерфейс

**Настройка:**
```env
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=reality-digitizer
```

### 3. Backblaze B2 (Бесплатный план)
**Бесплатно: 10 GB хранилища + 1 GB трафика/день**

✅ Плюсы:
- 10 GB бесплатно
- S3-совместимый API
- Дешевый платный план

❌ Минусы:
- Ограничение трафика
- Медленнее из России

**Настройка:**
```env
B2_ENDPOINT=https://s3.us-west-000.backblazeb2.com
B2_KEY_ID=your-key-id
B2_APPLICATION_KEY=your-app-key
B2_BUCKET_NAME=reality-digitizer
```

### 4. Vercel Blob (Бесплатный план)
**Бесплатно: 1 GB**

✅ Плюсы:
- Интеграция с Vercel
- Простая настройка
- Быстрый CDN

❌ Минусы:
- Только 1 GB
- Привязка к Vercel

**Настройка:**
```bash
bun add @vercel/blob
```

```env
BLOB_READ_WRITE_TOKEN=your-token
```

### 5. Локальное хранилище (БЕСПЛАТНО, для разработки)
**Бесплатно: неограниченно**

✅ Плюсы:
- Полностью бесплатно
- Быстро
- Не нужен интернет

❌ Минусы:
- Только для разработки
- Файлы на вашем компьютере

**Настройка:**
```env
STORAGE_TYPE=local
STORAGE_PATH=./uploads
```

## 📊 Сравнительная таблица:

| Сервис | Бесплатно | Трафик | S3 API | Из России |
|--------|-----------|--------|--------|-----------|
| Supabase | 1 GB | Неограничен | ✅ | ⚠️ Медленно |
| Cloudflare R2 | 10 GB | 10 GB/мес | ✅ | ✅ Быстро |
| Backblaze B2 | 10 GB | 1 GB/день | ✅ | ⚠️ Медленно |
| Vercel Blob | 1 GB | Неограничен | ❌ | ✅ Быстро |
| Локально | ∞ | - | ❌ | ✅ |

## 🎯 Моя рекомендация:

### Для разработки (СЕЙЧАС):
**Supabase Storage (1 GB бесплатно)**
- Простая настройка
- Достаточно для тестирования
- Легко мигрировать потом

### Для продакшена (ПОТОМ):
**Cloudflare R2 (10 GB бесплатно)**
- Больше места
- Быстрее из России
- S3-совместимый

## 🚀 Быстрый старт с Supabase Storage:

1. Зайдите на https://supabase.com
2. Создайте проект (бесплатно)
3. Перейдите в Storage → Create bucket
4. Скопируйте ключи из Settings → API
5. Обновите `.env.local`
6. Готово!

Подробная инструкция: `docs/SUPABASE_FREE_SETUP.md`