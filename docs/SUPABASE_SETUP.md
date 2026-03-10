# 🗄️ Настройка Supabase для Room Designer

Пошаговое руководство по настройке Supabase в качестве базы данных для каталога мебели.

## 📋 Что вам понадобится

- Аккаунт на [Supabase](https://supabase.com)
- Около 10 минут времени

## 🚀 Шаг 1: Создание проекта

1. **Зайдите на [supabase.com](https://supabase.com)**
2. **Нажмите "Start your project"**
3. **Войдите через GitHub** (рекомендуется)
4. **Создайте новый проект:**
   - Name: `room-designer`
   - Database Password: `сгенерируйте надежный пароль`
   - Region: `Central EU (Frankfurt)` (ближе к России)

## 🔧 Шаг 2: Настройка базы данных

### 2.1 Выполнение миграции

1. **Откройте SQL Editor** в панели Supabase
2. **Скопируйте содержимое** файла `supabase/migrations/001_furniture_schema.sql`
3. **Вставьте в SQL Editor** и нажмите **Run**

Это создаст:
- ✅ Таблицы для мебели, категорий, брендов
- ✅ Таблицы для цен и истории цен
- ✅ Индексы для быстрого поиска
- ✅ Функции и триггеры
- ✅ Базовые данные (категории и бренды)

### 2.2 Проверка создания таблиц

В разделе **Table Editor** должны появиться таблицы:
- `furniture_categories`
- `furniture_brands` 
- `furniture_items`
- `price_sources`
- `price_history`

## 🔑 Шаг 3: Получение ключей API

1. **Перейдите в Settings → API**
2. **Скопируйте следующие ключи:**

```env
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Anon key (для клиентских запросов)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role key (для парсера, СЕКРЕТНЫЙ!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📝 Шаг 4: Настройка переменных окружения

1. **Скопируйте `.env.example` в `.env.local`:**
```bash
cp .env.example .env.local
```

2. **Заполните переменные Supabase:**
```env
NEXT_PUBLIC_SUPABASE_URL=ваш-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш-anon-key
SUPABASE_SERVICE_ROLE_KEY=ваш-service-role-key
```

## 🛡️ Шаг 5: Настройка безопасности (RLS)

Row Level Security уже настроен в миграции:

- ✅ **Публичное чтение** - все могут просматривать мебель
- ✅ **Ограниченная запись** - только парсер может добавлять данные
- ✅ **Защита от спама** - политики безопасности

## 🧪 Шаг 6: Тестирование подключения

1. **Запустите приложение:**
```bash
npm run dev
```

2. **Откройте браузер:** `http://localhost:3000`

3. **Проверьте каталог мебели** - должны загружаться категории

## 📊 Шаг 7: Запуск парсера (опционально)

Для наполнения базы данных реальными товарами:

1. **Настройте парсер:**
```bash
cd scripts/supabase-parser
npm install
cp .env.example .env
```

2. **Заполните .env парсера:**
```env
NEXT_PUBLIC_SUPABASE_URL=ваш-url
SUPABASE_SERVICE_ROLE_KEY=ваш-service-role-key
```

3. **Запустите тестирование:**
```bash
npm run test
```

4. **Запустите парсинг:**
```bash
npm start
```

## 📈 Мониторинг и аналитика

### Просмотр данных
- **Table Editor** - просмотр и редактирование данных
- **SQL Editor** - выполнение запросов
- **API Logs** - мониторинг запросов

### Полезные запросы

**Количество товаров по категориям:**
```sql
SELECT 
  fc.name,
  COUNT(fi.id) as items_count,
  AVG(fi.price_avg / 100.0) as avg_price_rub
FROM furniture_categories fc
LEFT JOIN furniture_items fi ON fc.id = fi.category_id
WHERE fi.is_active = true
GROUP BY fc.id, fc.name
ORDER BY items_count DESC;
```

**Статистика парсинга:**
```sql
SELECT 
  source_name,
  COUNT(*) as items_count,
  AVG(price / 100.0) as avg_price_rub,
  MAX(parsed_at) as last_update
FROM price_sources
GROUP BY source_name;
```

## 🔧 Устранение неполадок

### Ошибка подключения
```
Error: Invalid API key
```
**Решение:** Проверьте правильность ключей в `.env.local`

### Ошибка RLS
```
Error: Row Level Security policy violation
```
**Решение:** Убедитесь, что политики RLS настроены правильно

### Медленные запросы
**Решение:** Проверьте индексы в разделе Database → Indexes

## 📚 Дополнительные ресурсы

- [Документация Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 💡 Советы по оптимизации

1. **Используйте индексы** для часто запрашиваемых полей
2. **Настройте кеширование** на уровне приложения
3. **Мониторьте использование** в Dashboard
4. **Регулярно обновляйте** статистику таблиц

## 🎯 Следующие шаги

После настройки Supabase:
1. ✅ Запустите парсер для наполнения данными
2. ✅ Настройте NextAuth для аутентификации
3. ✅ Деплойте на Vercel
4. ✅ Настройте домен и SSL