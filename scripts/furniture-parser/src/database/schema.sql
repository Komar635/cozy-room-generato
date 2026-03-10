-- Создание базы данных для мебели
CREATE DATABASE furniture_db;

-- Подключение к базе
\c furniture_db;

-- Таблица категорий мебели
CREATE TABLE furniture_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица производителей/брендов
CREATE TABLE furniture_brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    country VARCHAR(100),
    website VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Основная таблица мебели
CREATE TABLE furniture_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL,
    category_id INTEGER REFERENCES furniture_categories(id),
    brand_id INTEGER REFERENCES furniture_brands(id),
    
    -- Размеры
    width_cm DECIMAL(8,2),
    height_cm DECIMAL(8,2),
    depth_cm DECIMAL(8,2),
    weight_kg DECIMAL(8,2),
    
    -- Характеристики
    color VARCHAR(100),
    material VARCHAR(200),
    style VARCHAR(100),
    
    -- Цены
    price_min INTEGER NOT NULL, -- в копейках
    price_avg INTEGER NOT NULL,
    price_max INTEGER NOT NULL,
    
    -- Изображения
    main_image_url VARCHAR(1000),
    images_urls TEXT[], -- массив URL изображений
    
    -- Описание
    description TEXT,
    features TEXT[],
    
    -- Метаданные
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_parsed_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Таблица источников цен
CREATE TABLE price_sources (
    id SERIAL PRIMARY KEY,
    furniture_item_id INTEGER REFERENCES furniture_items(id) ON DELETE CASCADE,
    source_name VARCHAR(100) NOT NULL, -- 'wildberries', 'ozon', 'hoff'
    source_url VARCHAR(1000) NOT NULL,
    price INTEGER NOT NULL, -- в копейках
    availability BOOLEAN DEFAULT true,
    rating DECIMAL(3,2),
    reviews_count INTEGER DEFAULT 0,
    parsed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(furniture_item_id, source_name)
);

-- Таблица истории цен
CREATE TABLE price_history (
    id SERIAL PRIMARY KEY,
    furniture_item_id INTEGER REFERENCES furniture_items(id) ON DELETE CASCADE,
    source_name VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX idx_furniture_items_category ON furniture_items(category_id);
CREATE INDEX idx_furniture_items_price_range ON furniture_items(price_min, price_max);
CREATE INDEX idx_furniture_items_updated ON furniture_items(updated_at);
CREATE INDEX idx_price_sources_item ON price_sources(furniture_item_id);
CREATE INDEX idx_price_history_item_date ON price_history(furniture_item_id, recorded_at);

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автообновления updated_at
CREATE TRIGGER update_furniture_items_updated_at 
    BEFORE UPDATE ON furniture_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Вставка базовых категорий
INSERT INTO furniture_categories (name, slug, description) VALUES
('Диваны и кресла', 'sofas-chairs', 'Мягкая мебель для отдыха'),
('Столы', 'tables', 'Обеденные, журнальные и рабочие столы'),
('Шкафы и стеллажи', 'wardrobes-shelves', 'Системы хранения'),
('Кровати', 'beds', 'Спальная мебель'),
('Стулья', 'chairs', 'Стулья и табуреты'),
('Комоды и тумбы', 'dressers-cabinets', 'Низкая мебель для хранения'),
('Декор и аксессуары', 'decor', 'Декоративные элементы интерьера'),
('Освещение', 'lighting', 'Светильники и лампы'),
('Текстиль', 'textiles', 'Шторы, ковры, подушки'),
('Детская мебель', 'kids-furniture', 'Мебель для детских комнат');

-- Вставка популярных брендов
INSERT INTO furniture_brands (name, country, website) VALUES
('IKEA', 'Швеция', 'https://ikea.com'),
('Hoff', 'Россия', 'https://hoff.ru'),
('Много Мебели', 'Россия', 'https://mnogomebeli.com'),
('Шатура', 'Россия', 'https://shatura.com'),
('Столплит', 'Россия', 'https://stolplit.ru'),
('Мария', 'Россия', 'https://maria.ru'),
('Дятьково', 'Россия', 'https://dyatkovo.ru'),
('Лазурит', 'Россия', 'https://lazurit.com');