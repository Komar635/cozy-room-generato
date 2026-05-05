CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'created',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "projects_user_id_idx" ON "projects"("user_id");

CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size_bytes" INTEGER,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "photos_project_id_idx" ON "photos"("project_id");

CREATE TABLE "models_3d" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "parent_model_id" TEXT,
    "model_type" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "is_original" BOOLEAN NOT NULL DEFAULT true,
    "processing_job_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "models_3d_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "models_3d_project_id_idx" ON "models_3d"("project_id");
CREATE INDEX "models_3d_parent_model_id_idx" ON "models_3d"("parent_model_id");

CREATE TABLE "style_analyses" (
    "id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "style_description" TEXT,
    "dominant_colors" JSONB,
    "materials" JSONB,
    "style_tags" TEXT[],
    "analyzed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "style_analyses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "modification_suggestions" (
    "id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "modification_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "preview_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modification_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "modification_suggestions_model_id_idx" ON "modification_suggestions"("model_id");

CREATE TABLE "modifications" (
    "id" TEXT NOT NULL,
    "original_model_id" TEXT NOT NULL,
    "modified_model_id" TEXT,
    "modification_type" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processing_job_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "modifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "modifications_original_model_id_idx" ON "modifications"("original_model_id");
CREATE INDEX "modifications_modified_model_id_idx" ON "modifications"("modified_model_id");

CREATE TABLE "material_specifications" (
    "id" TEXT NOT NULL,
    "modification_id" TEXT NOT NULL,
    "materials" JSONB NOT NULL,
    "instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_specifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "material_specifications_modification_id_idx" ON "material_specifications"("modification_id");

CREATE TABLE "processing_jobs" (
    "id" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processing_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "processing_jobs_project_id_idx" ON "processing_jobs"("project_id");
CREATE INDEX "processing_jobs_status_idx" ON "processing_jobs"("status");
CREATE INDEX "processing_jobs_job_type_project_id_created_at_idx" ON "processing_jobs"("job_type", "project_id", "created_at");

ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "photos" ADD CONSTRAINT "photos_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "models_3d" ADD CONSTRAINT "models_3d_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "models_3d" ADD CONSTRAINT "models_3d_parent_model_id_fkey" FOREIGN KEY ("parent_model_id") REFERENCES "models_3d"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "style_analyses" ADD CONSTRAINT "style_analyses_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models_3d"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "modification_suggestions" ADD CONSTRAINT "modification_suggestions_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models_3d"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "modifications" ADD CONSTRAINT "modifications_original_model_id_fkey" FOREIGN KEY ("original_model_id") REFERENCES "models_3d"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "modifications" ADD CONSTRAINT "modifications_modified_model_id_fkey" FOREIGN KEY ("modified_model_id") REFERENCES "models_3d"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "material_specifications" ADD CONSTRAINT "material_specifications_modification_id_fkey" FOREIGN KEY ("modification_id") REFERENCES "modifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
