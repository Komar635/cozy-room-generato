# Supabase - Бесплатная альтернатива

## Бесплатный план Supabase включает:
- ✅ PostgreSQL база данных (500 MB)
- ✅ Хранилище файлов (1 GB)
- ✅ Аутентификация
- ✅ Realtime подписки
- ✅ Без ограничения по времени!

## Настройка:

1. Зайдите на https://supabase.com
2. Создайте аккаунт (бесплатно)
3. Создайте новый проект:
   - Имя: `reality-digitizer`
   - Database Password: придумайте надежный
   - Region: выберите ближайший

4. После создания проекта (2-3 минуты):
   - Перейдите в Settings → Database
   - Скопируйте Connection String (URI)

5. Обновите `.env.local`:
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

6. Примените миграции:
```bash
bunx prisma migrate dev --name init
bunx prisma generate
```

7. Запустите проект:
```bash
bun dev
```

## Плюсы Supabase:
- ✅ Полностью бесплатно (до 500 MB)
- ✅ Облачное решение
- ✅ Встроенная аутентификация
- ✅ Realtime из коробки
- ✅ Хорошая документация

## Минусы:
- ❌ Ограничение 500 MB базы
- ❌ Не российский сервис
- ❌ Может быть медленнее из России

## Когда использовать:
- Для разработки и тестирования
- Для MVP и прототипов
- Для небольших проектов