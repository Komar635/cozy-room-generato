-- Создание таблиц для Prisma схемы

-- Таблица пользователей
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица проектов
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    status TEXT DEFAULT 'created',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица фотографий
CREATE TABLE photos (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    size_bytes INTEGER,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Таблица 3D-моделей
CREATE TABLE models_3d (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_model_id TEXT REFERENCES models_3d(id) ON DELETE SET NULL,
    model_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    is_original BOOLEAN DEFAULT TRUE,
    processing_job_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица анализа стиля
CREATE TABLE style_analyses (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL REFERENCES models_3d(id) ON DELETE CASCADE,
    style_description TEXT,
    dominant_colors JSONB,
    materials JSONB,
    style_tags TEXT[],
    analyzed_at TIMESTAMP DEFAULT NOW()
);

-- Таблица предложений по модификации
CREATE TABLE modification_suggestions (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL,
    modification_type TEXT NOT NULL,
    description TEXT NOT NULL,
    parameters JSONB NOT NULL,
    preview_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица модификаций
CREATE TABLE modifications (
    id TEXT PRIMARY KEY,
    original_model_id TEXT NOT NULL REFERENCES models_3d(id) ON DELETE CASCADE,
    modified_model_id TEXT REFERENCES models_3d(id) ON DELETE CASCADE,
    modification_type TEXT NOT NULL,
    parameters JSONB NOT NULL,
    status TEXT DEFAULT 'pending',
    processing_job_id TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Таблица спецификаций материалов
CREATE TABLE material_specifications (
    id TEXT PRIMARY KEY,
    modification_id TEXT NOT NULL REFERENCES modifications(id) ON DELETE CASCADE,
    materials JSONB NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица задач обработки
CREATE TABLE processing_jobs (
    id TEXT PRIMARY KEY,
    job_type TEXT NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_photos_project_id ON photos(project_id);
CREATE INDEX idx_models_project_id ON models_3d(project_id);
