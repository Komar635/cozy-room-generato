-- Создание базы данных для мебели в Supabase
-- Выполните этот скрипт в SQL Editor вашего Supabase проекта

-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица категорий мебели
CREATE TABLE furniture_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица производителей/брендов
CREATE TABLE furniture_brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    country VARCHAR(100),
    website VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Основная таблица мебели
CREATE TABLE furniture_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL,
    category_id UUID REFERENCES furniture_categories(id),
    brand_id UUID REFERENCES furniture_brands(id),
    
    -- Размеры
    width_cm DECIMAL(8,2),
    height_cm DECIMAL(8,2),
    depth_cm DECIMAL(8,2),
    weight_kg DECIMAL(8,2),
    
    -- Характеристики
    color VARCHAR(100),
    material VARCHAR(200),
    style VARCHAR(100),
    
    -- Цены (в копейках для точности)
    price_min INTEGER NOT NULL DEFAULT 0,
    price_avg INTEGER NOT NULL DEFAULT 0,
    price_max INTEGER NOT NULL DEFAULT 0,
    
    -- Изображения
    main_image_url VARCHAR(1000),
    images_urls TEXT[],
    
    -- Описание
    description TEXT,
    features TEXT[],
    
    -- Метаданные
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_parsed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Таблица источников цен
CREATE TABLE price_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    furniture_item_id UUID REFERENCES furniture_items(id) ON DELETE CASCADE,
    source_name VARCHAR(100) NOT NULL, -- 'wildberries', 'ozon', 'hoff'
    source_url VARCHAR(1000) NOT NULL,
    price INTEGER NOT NULL, -- в копейках
    availability BOOLEAN DEFAULT true,
    rating DECIMAL(3,2),
    reviews_count INTEGER DEFAULT 0,
    parsed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(furniture_item_id, source_name)
);

-- Таблица истории цен
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    furniture_item_id UUID REFERENCES furniture_items(id) ON DELETE CASCADE,
    source_name VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для оптимизации
CREATE INDEX idx_furniture_items_category ON furniture_items(category_id);
CREATE INDEX idx_furniture_items_brand ON furniture_items(brand_id);
CREATE INDEX idx_furniture_items_price_range ON furniture_items(price_min, price_max);
CREATE INDEX idx_furniture_items_updated ON furniture_items(updated_at);
CREATE INDEX idx_furniture_items_active ON furniture_items(is_active);
CREATE INDEX idx_furniture_items_search ON furniture_items USING gin(to_tsvector('russian', name || ' ' || COALESCE(description, '')));

CREATE INDEX idx_price_sources_item ON price_sources(furniture_item_id);
CREATE INDEX idx_price_sources_source ON price_sources(source_name);
CREATE INDEX idx_price_history_item_date ON price_history(furniture_item_id, recorded_at);

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автообновления updated_at
CREATE TRIGGER update_furniture_items_updated_at 
    BEFORE UPDATE ON furniture_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция для пересчета цен товара
CREATE OR REPLACE FUNCTION recalculate_item_prices(item_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE furniture_items 
    SET 
        price_min = (
            SELECT MIN(price) 
            FROM price_sources 
            WHERE furniture_item_id = item_id AND availability = true
        ),
        price_avg = (
            SELECT AVG(price)::INTEGER 
            FROM price_sources 
            WHERE furniture_item_id = item_id AND availability = true
        ),
        price_max = (
            SELECT MAX(price) 
            FROM price_sources 
            WHERE furniture_item_id = item_id AND availability = true
        )
    WHERE id = item_id;
END;
$$ language 'plpgsql';

-- Триггер для автоматического пересчета цен при изменении price_sources
CREATE OR REPLACE FUNCTION trigger_recalculate_prices()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recalculate_item_prices(OLD.furniture_item_id);
        RETURN OLD;
    ELSE
        PERFORM recalculate_item_prices(NEW.furniture_item_id);
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

CREATE TRIGGER price_sources_recalculate
    AFTER INSERT OR UPDATE OR DELETE ON price_sources
    FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_prices();

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
('Лазурит', 'Россия', 'https://lazurit.com'),
('Неизвестный бренд', 'Россия', NULL);

-- Настройка Row Level Security (RLS)
ALTER TABLE furniture_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE furniture_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE furniture_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Политики доступа (все могут читать, только аутентифицированные пользователи могут изменять)
CREATE POLICY "Все могут читать категории" ON furniture_categories FOR SELECT USING (true);
CREATE POLICY "Все могут читать бренды" ON furniture_brands FOR SELECT USING (true);
CREATE POLICY "Все могут читать мебель" ON furniture_items FOR SELECT USING (is_active = true);
CREATE POLICY "Все могут читать источники цен" ON price_sources FOR SELECT USING (true);
CREATE POLICY "Все могут читать историю цен" ON price_history FOR SELECT USING (true);

-- Политики для парсера (требуется service_role ключ)
CREATE POLICY "Парсер может изменять мебель" ON furniture_items FOR ALL USING (true);
CREATE POLICY "Парсер может изменять источники цен" ON price_sources FOR ALL USING (true);
CREATE POLICY "Парсер может изменять историю цен" ON price_history FOR ALL USING (true);

-- Создание представлений для удобства
CREATE VIEW furniture_items_with_details AS
SELECT 
    fi.*,
    fc.name as category_name,
    fc.slug as category_slug,
    fb.name as brand_name,
    fb.country as brand_country,
    (fi.price_min / 100.0) as price_min_rub,
    (fi.price_avg / 100.0) as price_avg_rub,
    (fi.price_max / 100.0) as price_max_rub
FROM furniture_items fi
LEFT JOIN furniture_categories fc ON fi.category_id = fc.id
LEFT JOIN furniture_brands fb ON fi.brand_id = fb.id
WHERE fi.is_active = true;

-- Функция полнотекстового поиска
CREATE OR REPLACE FUNCTION search_furniture(search_query TEXT, category_filter TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    price_avg_rub DECIMAL,
    category_name VARCHAR,
    brand_name VARCHAR,
    main_image_url VARCHAR,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fi.id,
        fi.name,
        (fi.price_avg / 100.0)::DECIMAL as price_avg_rub,
        fc.name as category_name,
        fb.name as brand_name,
        fi.main_image_url,
        ts_rank(to_tsvector('russian', fi.name || ' ' || COALESCE(fi.description, '')), plainto_tsquery('russian', search_query)) as rank
    FROM furniture_items fi
    LEFT JOIN furniture_categories fc ON fi.category_id = fc.id
    LEFT JOIN furniture_brands fb ON fi.brand_id = fb.id
    WHERE fi.is_active = true
    AND to_tsvector('russian', fi.name || ' ' || COALESCE(fi.description, '')) @@ plainto_tsquery('russian', search_query)
    AND (category_filter IS NULL OR fc.slug = category_filter)
    ORDER BY rank DESC, fi.updated_at DESC;
END;
$$ LANGUAGE plpgsql;