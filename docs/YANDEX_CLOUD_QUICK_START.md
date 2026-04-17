# Быстрый старт с Yandex Cloud

## Шаг 1: Создание Managed PostgreSQL

1. В консоли Yandex Cloud перейдите в **"Managed Service for PostgreSQL"**
2. Нажмите **"Создать кластер"**
3. Настройки:
   - **Имя**: `reality-digitizer-db`
   - **Окружение**: `PRODUCTION` (или `PRESTABLE` для тестов)
   - **Версия**: PostgreSQL 15
   - **Класс хоста**: `s2.micro` (для начала, можно увеличить позже)
   - **Размер хранилища**: 10 ГБ (для начала)
   - **База данных**: `reality_digitizer`
   - **Пользователь**: `app_user`
   - **Пароль**: придумайте надежный пароль

4. Нажмите **"Создать кластер"** (создание займет 5-10 минут)

5. После создания скопируйте:
   - **Хост** (например: `c-xxx.rw.mdb.yandexcloud.net`)
   - **Порт** (обычно `6432`)

## Шаг 2: Создание Object Storage

1. В консоли перейдите в **"Object Storage"**
2. Нажмите **"Создать бакет"**
3. Настройки:
   - **Имя**: `reality-digitizer-storage` (должно быть уникальным)
   - **Класс хранилища**: Стандартное
   - **Доступ**: Ограниченный
   - **Шифрование**: Включить (опционально)

4. Нажмите **"Создать бакет"**

## Шаг 3: Создание сервисного аккаунта

1. Перейдите в **"Service Accounts"** (Сервисные аккаунты)
2. Нажмите **"Создать сервисный аккаунт"**
3. Настройки:
   - **Имя**: `reality-digitizer-sa`
   - **Роли**: 
     - `storage.editor` (для работы с Object Storage)
     - `mdb.admin` (для работы с PostgreSQL)

4. Нажмите **"Создать"**

## Шаг 4: Создание статического ключа доступа

1. Откройте созданный сервисный аккаунт
2. Перейдите на вкладку **"Статические ключи доступа"**
3. Нажмите **"Создать ключ доступа"**
4. **ВАЖНО**: Сохраните:
   - **Идентификатор ключа** (Access Key ID)
   - **Секретный ключ** (Secret Access Key)
   
   ⚠️ Секретный ключ показывается только один раз!

## Шаг 5: Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
# PostgreSQL (Yandex Managed Service)
DATABASE_URL=postgresql://app_user:ВАШ_ПАРОЛЬ@c-xxx.rw.mdb.yandexcloud.net:6432/reality_digitizer?sslmode=require

# Yandex Object Storage
YC_STORAGE_ENDPOINT=https://storage.yandexcloud.net
YC_STORAGE_ACCESS_KEY=ВАШ_ACCESS_KEY
YC_STORAGE_SECRET_KEY=ВАШ_SECRET_KEY
YC_STORAGE_BUCKET=reality-digitizer-storage
YC_STORAGE_REGION=ru-central1

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=сгенерируйте_случайную_строку

# Google OAuth (опционально)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Шаг 6: Установка зависимостей

```bash
# Установить зависимости для работы с Yandex Cloud
bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Prisma уже установлен
```

## Шаг 7: Применение миграций

```bash
# Применить миграции к базе данных
bunx prisma migrate deploy

# Или создать новую миграцию
bunx prisma migrate dev --name init

# Сгенерировать Prisma Client
bunx prisma generate
```

## Шаг 8: Запуск проекта

```bash
# Запустить в режиме разработки
bun dev
```

Откройте http://localhost:3000 и попробуйте зарегистрироваться!

## Проверка подключения

### Проверка базы данных:
```bash
bunx prisma studio
```

### Проверка Object Storage:
Попробуйте загрузить фотографию через интерфейс приложения.

## Стоимость

Примерная стоимость для начала:
- **PostgreSQL s2.micro**: ~1500₽/месяц
- **Object Storage**: ~2₽/ГБ/месяц
- **Первые 60 дней**: бесплатный грант 4000₽

## Следующие шаги

1. ✅ Настроить базу данных
2. ✅ Настроить хранилище файлов
3. ⏭️ Настроить Python-микросервисы для обработки 3D
4. ⏭️ Развернуть на Yandex Cloud Functions