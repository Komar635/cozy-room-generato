import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Типы для базы данных
export interface FurnitureItem {
  id: string
  name: string
  slug: string
  category_id: string
  brand_id: string
  width_cm?: number
  height_cm?: number
  depth_cm?: number
  weight_kg?: number
  color?: string
  material?: string
  style?: string
  price_min: number // в копейках
  price_avg: number
  price_max: number
  main_image_url?: string
  images_urls?: string[]
  description?: string
  features?: string[]
  created_at: string
  updated_at: string
  last_parsed_at?: string
  is_active: boolean
  
  // Связанные данные
  category?: FurnitureCategory
  brand?: FurnitureBrand
  price_sources?: PriceSource[]
}

export interface FurnitureCategory {
  id: string
  name: string
  slug: string
  description?: string
  created_at: string
}

export interface FurnitureBrand {
  id: string
  name: string
  country?: string
  website?: string
  created_at: string
}

export interface PriceSource {
  id: string
  furniture_item_id: string
  source_name: string
  source_url: string
  price: number
  availability: boolean
  rating?: number
  reviews_count?: number
  parsed_at: string
}

export interface PriceHistory {
  id: string
  furniture_item_id: string
  source_name: string
  price: number
  recorded_at: string
}