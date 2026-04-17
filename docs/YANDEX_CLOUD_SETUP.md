# Настройка Yandex Cloud

## 1. Создание проекта

1. Перейдите на [console.cloud.yandex.ru](https://console.cloud.yandex.ru)
2. Создайте новый проект или выберите существующий
3. Включите необходимые сервисы:
   - **Yandex Database (YDB)** - для базы данных
   - **Object Storage** - для хранения файлов
   - **Cloud Functions** - для серверных функций
   - **API Gateway** - для API

## 2. Настройка базы данных (YDB)

1. В консоли перейдите в раздел "Yandex Database"
2. Создайте новую базу данных:
   - Тип: Serverless
   - Имя: `reality-digitizer-db`
3. Получите endpoint базы данных

## 3. Настройка Object Storage

1. В консоли перейдите в раздел "Object Storage"
2. Создайте bucket:
   - Имя: `reality-digitizer-storage`
   - Класс хранилища: Стандартное
3. Создайте сервисный аккаунт с правами на Object Storage

## 4. Создание сервисного аккаунта

1. Перейдите в раздел "Identity and Access Management"
2. Создайте сервисный аккаунт:
   - Имя: `reality-digitizer-service`
   - Роли: 
     - `storage.editor` (для Object Storage)
     - `ydb.editor` (для YDB)
     - `functions.invoker` (для Cloud Functions)
3. Создайте статический ключ доступа для Object Storage
4. Создайте авторизованный ключ для YDB

## 5. Переменные окружения

Добавьте в `.env.local`:

```env
# Yandex Cloud
YC_FOLDER_ID=your-folder-id
YC_SERVICE_ACCOUNT_KEY_FILE=path/to/service-account-key.json

# YDB
YDB_ENDPOINT=your-ydb-endpoint
YDB_DATABASE=your-database-path

# Object Storage
YC_STORAGE_ACCESS_KEY=your-access-key
YC_STORAGE_SECRET_KEY=your-secret-key
YC_STORAGE_BUCKET=reality-digitizer-storage
YC_STORAGE_REGION=ru-central1

# NextAuth (остается без изменений)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Google OAuth (остается без изменений)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```