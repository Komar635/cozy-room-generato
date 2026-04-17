-- Включаем расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица пользователей (управляется NextAuth.js и Supabase Auth)
-- Используем встроенную таблицу auth.users от Supabase

-- Таблица проектов
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    status VARCHAR(50) DEFAULT 'created',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица фотографий
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    size_bytes INTEGER,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Таблица 3D-моделей
CREATE TABLE models_3d (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_model_id UUID REFERENCES models_3d(id) ON DELETE SET NULL,
    model_type VARCHAR(50) NOT NULL,
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    is_original BOOLEAN DEFAULT TRUE,
    processing_job_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица анализа стиля
CREATE TABLE style_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES models_3d(id) ON DELETE CASCADE,
    style_description TEXT,
    dominant_colors JSONB,
    materials JSONB,
    style_tags TEXT[],
    analyzed_at TIMESTAMP DEFAULT NOW()
);

-- Таблица предложений по модификации
CREATE TABLE modification_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES models_3d(id) ON DELETE CASCADE,
    modification_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    parameters JSONB NOT NULL,
    preview_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица модификаций
CREATE TABLE modifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_model_id UUID NOT NULL REFERENCES models_3d(id) ON DELETE CASCADE,
    modified_model_id UUID REFERENCES models_3d(id) ON DELETE CASCADE,
    modification_type VARCHAR(50) NOT NULL,
    parameters JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    processing_job_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Таблица спецификаций материалов
CREATE TABLE material_specifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modification_id UUID NOT NULL REFERENCES modifications(id) ON DELETE CASCADE,
    materials JSONB NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица задач обработки
CREATE TABLE processing_jobs (
    id VARCHAR(255) PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_photos_project_id ON photos(project_id);
CREATE INDEX idx_models_project_id ON models_3d(project_id);
CREATE INDEX idx_modifications_original_model ON modifications(original_model_id);
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX idx_processing_jobs_project_id ON processing_jobs(project_id);

-- Row Level Security (RLS) политики
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE models_3d ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modification_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

-- Политики для projects
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Политики для photos
CREATE POLICY "Users can view photos of own projects" ON photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = photos.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert photos to own projects" ON photos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = photos.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- Политики для models_3d
CREATE POLICY "Users can view models of own projects" ON models_3d
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = models_3d.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- Политики для остальных таблиц (аналогично)
CREATE POLICY "Users can view style analyses" ON style_analyses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM models_3d 
            JOIN projects ON projects.id = models_3d.project_id
            WHERE models_3d.id = style_analyses.model_id 
            AND projects.user_id = auth.uid()
        )
    );

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для projects
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
