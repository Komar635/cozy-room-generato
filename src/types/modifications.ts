export interface ModificationSuggestion {
  id: string;
  modelId: string;
  modificationType: 'recolor' | 'restoration' | 'geometry';
  description: string;
  parameters: Record<string, any>;
  previewUrl?: string;
  createdAt: Date;
}

export interface StyleAnalysis {
  id: string;
  modelId: string;
  styleDescription: string;
  dominantColors: Array<{
    hex: string;
    name: string;
    percentage: number;
  }>;
  materials: Array<{
    name: string;
    type: string;
    confidence: number;
  }>;
  styleTags: string[];
  analyzedAt: Date;
}

export interface RecolorParameters {
  color_map: Record<string, string>;
  finish?: 'matte' | 'glossy' | 'satin';
}

export interface RestorationParameters {
  damaged_regions: string[];
  restoration_style: string;
}

export interface GeometryParameters {
  modification_description: string;
  scale_factor?: number;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
  };
}
