import { supabase, FurnitureItem, FurnitureCategory, FurnitureBrand } from './supabase'

export interface FurnitureFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  colors?: string[]
  styles?: string[]
  sizeCategories?: string[]
  brands?: string[]
  search?: string
}

export interface PaginationOptions {
  page?: number
  limit?: number
}

export class FurnitureAPI {
  // Получение списка мебели с фильтрами
  static async getFurnitureItems(
    filters: FurnitureFilters = {},
    pagination: PaginationOptions = {}
  ) {
    const { page = 1, limit = 20 } = pagination
    const offset = (page - 1) * limit

    let query = supabase
      .from('furniture_items')
      .select(`
        *,
        category:furniture_categories(id, name, slug),
        brand:furniture_brands(id, name, country),
        price_sources(source_name, price, availability, rating, reviews_count)
      `)
      .eq('is_active', true)

    // Применяем фильтры
    if (filters.category) {
      query = query.eq('furniture_categories.slug', filters.category)
    }

    if (filters.minPrice) {
      query = query.gte('price_min', filters.minPrice * 100) // переводим в копейки
    }

    if (filters.maxPrice) {
      query = query.lte('price_max', filters.maxPrice * 100)
    }

    if (filters.colors && filters.colors.length > 0) {
      query = query.in('color', filters.colors)
    }

    if (filters.styles && filters.styles.length > 0) {
      query = query.in('style', filters.styles)
    }

    if (filters.brands && filters.brands.length > 0) {
      query = query.in('furniture_brands.name', filters.brands)
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Пагинация и сортировка
    query = query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Ошибка получения мебели:', error)
      throw error
    }

    // Преобразуем цены из копеек в рубли
    const items = data?.map(item => ({
      ...item,
      price_min_rub: item.price_min / 100,
      price_avg_rub: item.price_avg / 100,
      price_max_rub: item.price_max / 100
    })) || []

    return {
      items,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  // Получение конкретного предмета мебели
  static async getFurnitureItem(id: string) {
    const { data, error } = await supabase
      .from('furniture_items')
      .select(`
        *,
        category:furniture_categories(id, name, slug),
        brand:furniture_brands(id, name, country, website),
        price_sources(source_name, source_url, price, availability, rating, reviews_count, parsed_at)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Ошибка получения предмета мебели:', error)
      throw error
    }

    if (!data) return null

    return {
      ...data,
      price_min_rub: data.price_min / 100,
      price_avg_rub: data.price_avg / 100,
      price_max_rub: data.price_max / 100,
      price_sources: data.price_sources?.map((source: any) => ({
        ...source,
        price_rub: source.price / 100
      }))
    }
  }

  // Получение категорий мебели
  static async getCategories() {
    const { data, error } = await supabase
      .from('furniture_categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Ошибка получения категорий:', error)
      throw error
    }

    return data || []
  }

  // Получение брендов
  static async getBrands() {
    const { data, error } = await supabase
      .from('furniture_brands')
      .select('*')
      .order('name')

    if (error) {
      console.error('Ошибка получения брендов:', error)
      throw error
    }

    return data || []
  }

  // Получение уникальных цветов
  static async getAvailableColors() {
    const { data, error } = await supabase
      .from('furniture_items')
      .select('color')
      .not('color', 'is', null)
      .eq('is_active', true)

    if (error) {
      console.error('Ошибка получения цветов:', error)
      throw error
    }

    const colors = [...new Set(data?.map(item => item.color).filter(Boolean))]
    return colors.sort()
  }

  // Получение уникальных стилей
  static async getAvailableStyles() {
    const { data, error } = await supabase
      .from('furniture_items')
      .select('style')
      .not('style', 'is', null)
      .eq('is_active', true)

    if (error) {
      console.error('Ошибка получения стилей:', error)
      throw error
    }

    const styles = [...new Set(data?.map(item => item.style).filter(Boolean))]
    return styles.sort()
  }

  // Поиск мебели
  static async searchFurniture(query: string, limit = 10) {
    const { data, error } = await supabase
      .from('furniture_items')
      .select(`
        id, name, price_avg, main_image_url,
        category:furniture_categories(name),
        brand:furniture_brands(name)
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_active', true)
      .order('name')
      .limit(limit)

    if (error) {
      console.error('Ошибка поиска мебели:', error)
      throw error
    }

    return data?.map(item => ({
      ...item,
      price_avg_rub: item.price_avg / 100
    })) || []
  }

  // Получение истории цен
  static async getPriceHistory(itemId: string, days = 30) {
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)

    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('furniture_item_id', itemId)
      .gte('recorded_at', fromDate.toISOString())
      .order('recorded_at')

    if (error) {
      console.error('Ошибка получения истории цен:', error)
      throw error
    }

    return data?.map(item => ({
      ...item,
      price_rub: item.price / 100
    })) || []
  }

  // Получение статистики по категориям
  static async getCategoryStats() {
    const { data, error } = await supabase
      .from('furniture_items')
      .select(`
        category_id,
        category:furniture_categories(name, slug),
        price_min,
        price_max,
        price_avg
      `)
      .eq('is_active', true)

    if (error) {
      console.error('Ошибка получения статистики категорий:', error)
      throw error
    }

    // Группируем по категориям
    const stats = data?.reduce((acc, item) => {
      const categorySlug = item.category?.slug
      if (!categorySlug) return acc

      if (!acc[categorySlug]) {
        acc[categorySlug] = {
          name: item.category.name,
          slug: categorySlug,
          count: 0,
          minPrice: Infinity,
          maxPrice: 0,
          totalPrice: 0
        }
      }

      acc[categorySlug].count++
      acc[categorySlug].minPrice = Math.min(acc[categorySlug].minPrice, item.price_min / 100)
      acc[categorySlug].maxPrice = Math.max(acc[categorySlug].maxPrice, item.price_max / 100)
      acc[categorySlug].totalPrice += item.price_avg / 100

      return acc
    }, {} as Record<string, any>)

    // Вычисляем средние цены
    Object.values(stats || {}).forEach((stat: any) => {
      stat.avgPrice = Math.round(stat.totalPrice / stat.count)
      delete stat.totalPrice
    })

    return stats || {}
  }

  // Получение похожих товаров
  static async getSimilarItems(itemId: string, limit = 6) {
    // Сначала получаем информацию о текущем товаре
    const currentItem = await this.getFurnitureItem(itemId)
    if (!currentItem) return []

    const { data, error } = await supabase
      .from('furniture_items')
      .select(`
        id, name, price_avg, main_image_url,
        category:furniture_categories(name),
        brand:furniture_brands(name)
      `)
      .eq('category_id', currentItem.category_id)
      .neq('id', itemId)
      .eq('is_active', true)
      .order('price_avg')
      .limit(limit)

    if (error) {
      console.error('Ошибка получения похожих товаров:', error)
      return []
    }

    return data?.map(item => ({
      ...item,
      price_avg_rub: item.price_avg / 100
    })) || []
  }
}