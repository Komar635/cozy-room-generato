export type ProjectStatus = 'created' | 'uploading' | 'scanning' | 'ready' | 'modifying' | 'error';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  status: ProjectStatus;
  created_at: Date;
  updated_at: Date;
}

export type ModelType = 'gaussian-splatting' | 'nerf';

export interface Model3D {
  id: string;
  project_id: string;
  parent_model_id?: string;
  model_type: ModelType;
  storage_path: string;
  url: string;
  is_original: boolean;
  processing_job_id?: string;
  created_at: Date;
}

export interface Photo {
  id: string;
  project_id: string;
  storage_path: string;
  url: string;
  size_bytes?: number;
  uploaded_at: Date;
}

export interface StyleAnalysis {
  id: string;
  model_id: string;
  style_description: string;
  dominant_colors: Array<{
    hex: string;
    name: string;
    percentage: number;
  }>;
  materials: Array<{
    name: string;
    type: string;
    confidence: number;
  }>;
  style_tags: string[];
  analyzed_at: Date;
}

export type ModificationType = 'recolor' | 'restoration' | 'geometry';
export type ModificationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ModificationSuggestion {
  id: string;
  model_id: string;
  modification_type: ModificationType;
  description: string;
  parameters: Record<string, any>;
  preview_url?: string;
  created_at: Date;
}

export interface Modification {
  id: string;
  original_model_id: string;
  modified_model_id?: string;
  modification_type: ModificationType;
  parameters: Record<string, any>;
  status: ModificationStatus;
  processing_job_id?: string;
  created_at: Date;
  completed_at?: Date;
}

export type JobType = 'scan' | 'modify';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ProcessingJob {
  id: string;
  job_type: JobType;
  project_id: string;
  status: JobStatus;
  progress: number;
  error_message?: string;
  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
}

export interface MaterialSpec {
  id: string;
  modification_id: string;
  materials: Material[];
  instructions: string;
  created_at: Date;
}

export interface Material {
  name: string;
  type: 'paint' | 'fabric' | 'wood' | 'metal';
  color?: string;
  brand?: string;
  code?: string;
  quantity?: string;
}
