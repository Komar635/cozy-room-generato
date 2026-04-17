# Следующие шаги для запуска проекта

## ✅ Что уже сделано:

1. Установлены все необходимые зависимости
2. Создана схема Prisma для PostgreSQL
3. Настроена интеграция с Yandex Object Storage
4. Обновлен API регистрации для работы без Supabase

## 📋 Что нужно сделать СЕЙЧАС:

### 1. Создать базу данных в Yandex Cloud (15 минут)

Откройте [console.cloud.yandex.ru](https://console.cloud.yandex.ru) и следуйте инструкции:
📄 `docs/YANDEX_CLOUD_QUICK_START.md`

Вам нужно:
- ✅ Создать Managed PostgreSQL кластер
- ✅ Создать Object Storage bucket
- ✅ Создать сервисный аккаунт и получить ключи

### 2. Обновить .env.local

После создания ресурсов в Yandex Cloud, обновите файл `.env.local`:

```env
DATABASE_URL=postgresql://app_user:ВАШ_ПАРОЛЬ@c-xxx.rw.mdb.yandexcloud.net:6432/reality_digitizer?sslmode=require

YC_STORAGE_ACCESS_KEY=ваш_access_key
YC_STORAGE_SECRET_KEY=ваш_secret_key
YC_STORAGE_BUCKET=reality-digitizer-storage

NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

### 3. Применить миграции базы данных

```bash
# Создать и применить миграцию
bunx prisma migrate dev --name init

# Сгенерировать Prisma Client
bunx prisma generate
```

### 4. Запустить проект

```bash
bun dev
```

Откройте http://localhost:3000 и попробуйте зарегистрироваться!

## 🐛 Если что-то не работает:

### Ошибка подключения к базе данных:
- Проверьте, что кластер PostgreSQL запущен в Yandex Cloud
- Проверьте правильность DATABASE_URL в .env.local
- Убедитесь, что добавили свой IP в whitelist (настройки кластера)

### Ошибка при регистрации:
- Проверьте логи: `bun dev` покажет ошибки в консоли
- Убедитесь, что миграции применены: `bunx prisma migrate status`

### Ошибка загрузки файлов:
- Проверьте ключи доступа к Object Storage
- Убедитесь, что bucket создан и доступен

## 📚 Полезные команды:

```bash
# Просмотр базы данных
bunx prisma studio

# Проверка статуса миграций
bunx prisma migrate status

# Сброс базы данных (ОСТОРОЖНО!)
bunx prisma migrate reset

# Запуск тестов
bun test
```

## 🎯 После успешного запуска:

1. Протестируйте регистрацию и вход
2. Создайте первый проект
3. Попробуйте загрузить фотографии
4. Переходите к настройке Python-микросервисов для 3D обработки

## 💰 Стоимость Yandex Cloud:

- PostgreSQL s2.micro: ~1500₽/месяц
- Object Storage: ~2₽/ГБ/месяц
- Первые 60 дней: грант 4000₽ (бесплатно!)

---

Если возникнут вопросы - пишите!