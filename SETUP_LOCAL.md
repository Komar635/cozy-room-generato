# Настройка локальной разработки

## 1. Установка PostgreSQL

### Windows:
```bash
# Через Chocolatey
choco install postgresql

# Или скачать с официального сайта
# https://www.postgresql.org/download/windows/
```

### Настройка базы данных:
```bash
# Подключиться к PostgreSQL как суперпользователь
psql -U postgres

# Выполнить команды из файла setup-local-db.sql
\i setup-local-db.sql
```

## 2. Установка MinIO (локальное S3-хранилище)

### Windows:
```bash
# Скачать MinIO
curl -O https://dl.min.io/server/minio/release/windows-amd64/minio.exe

# Создать папку для данных
mkdir C:\minio-data

# Запустить MinIO
.\minio.exe server C:\minio-data --console-address ":9001"
```

Откройте http://localhost:9001 в браузере:
- Логин: `minioadmin`
- Пароль: `minioadmin`

Создайте bucket с именем `reality-digitizer-3d`.

## 3. Настройка проекта

```bash
# Скопировать переменные окружения
cp .env.local.example .env.local

# Отредактировать .env.local с вашими настройками

# Установить зависимости
bun install

# Применить миграции базы данных
bunx prisma migrate dev --name init

# Генерировать Prisma Client
bunx prisma generate

# Запустить проект
bun dev
```

## 4. Проверка настройки

1. **База данных**: `bunx prisma studio` - откроет веб-интерфейс для просмотра данных
2. **MinIO**: http://localhost:9001 - веб-интерфейс хранилища
3. **Приложение**: http://localhost:3000 - ваше приложение

## 5. Следующие шаги

После настройки локальной среды можно:
1. Протестировать регистрацию и вход
2. Создать первый проект
3. Загрузить тестовые фотографии
4. Настроить Python-микросервисы для обработки 3D

## Переход на Yandex Cloud

Когда будете готовы к продакшену:
1. Создать Managed Service for PostgreSQL в Yandex Cloud
2. Настроить Object Storage
3. Обновить переменные окружения
4. Развернуть на Yandex Cloud Functions или Compute Cloud