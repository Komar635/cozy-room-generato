# Установка локальной PostgreSQL (БЕСПЛАТНО)

## Для Windows:

### Вариант A: Через Chocolatey
```bash
choco install postgresql
```

### Вариант B: Официальный установщик
1. Скачайте с https://www.postgresql.org/download/windows/
2. Запустите установщик
3. Пароль для postgres: придумайте и запомните

### После установки:

1. Откройте PowerShell от администратора
2. Создайте базу данных:

```bash
# Подключитесь к PostgreSQL
psql -U postgres

# В консоли PostgreSQL выполните:
CREATE DATABASE reality_digitizer;
CREATE USER app_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE reality_digitizer TO app_user;
\q
```

3. Обновите `.env.local`:
```env
DATABASE_URL=postgresql://app_user:your_password@localhost:5432/reality_digitizer
```

4. Примените миграции:
```bash
bunx prisma migrate dev --name init
bunx prisma generate
```

5. Запустите проект:
```bash
bun dev
```

## Для хранения файлов (тоже бесплатно):

Используйте локальную файловую систему вместо Object Storage:

```env
# В .env.local
STORAGE_TYPE=local
STORAGE_PATH=./uploads
```

## Плюсы локальной разработки:
- ✅ Полностью бесплатно
- ✅ Быстрая разработка
- ✅ Не нужен интернет
- ✅ Полный контроль

## Минусы:
- ❌ Нужно будет мигрировать на облако для продакшена
- ❌ Файлы хранятся локально

## Когда перейти на Yandex Cloud:
- Когда будете готовы к продакшену
- Когда нужно показать проект другим
- Когда закончится разработка