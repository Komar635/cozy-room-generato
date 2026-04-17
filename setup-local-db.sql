-- Создание базы данных для проекта
CREATE DATABASE reality_digitizer_3d;

-- Создание пользователя для приложения
CREATE USER app_user WITH PASSWORD 'your_secure_password';

-- Предоставление прав
GRANT ALL PRIVILEGES ON DATABASE reality_digitizer_3d TO app_user;

-- Подключение к базе данных
\c reality_digitizer_3d;

-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Предоставление прав на схему
GRANT ALL ON SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;