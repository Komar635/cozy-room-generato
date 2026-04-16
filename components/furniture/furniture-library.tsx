import { useState, useMemo, useEffect } from 'react'
import { FurnitureCategory, FurnitureItem, RoomStyle, SizeCategory } from '../../types/room'
import { useRoomStore } from '../../store/room-store'
import { 
  FURNITURE_DATABASE,
  getFurnitureByCategory, 
  searchFurnitureAdvanced,
  getItemSizeCategory
} from '../../lib/data/furniture-database'
import { CategoryTabs } from './category-tabs'
import { CategorySettings } from './category-settings'
import { FurnitureGrid } from './furniture-grid'
import { SearchFilters } from './search-filters'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Search, X } from 'lucide-react'
import { LoadingOverlay } from '../ui/loading'

interface FurnitureLibraryProps {
  className?: string
}

interface SearchFiltersState {
  query: string
  minPrice: number
  maxPrice: number
  colors: string[]
  styles: RoomStyle[]
  sizeCategories: SizeCategory[]
}

export function FurnitureLibrary({ className = '' }: FurnitureLibraryProps) {
  const { 
    selectedCategory, 
    setSelectedCategory, 
    selectedStyle,
    budget 
  } = useRoomStore()

  // Состояние для видимых категорий
  const [visibleCategories, setVisibleCategories] = useState<FurnitureCategory[]>(
    Object.values(FurnitureCategory)
  )

  // Состояние для быстрого поиска
  const [quickSearchQuery, setQuickSearchQuery] = useState('')
  
  // Состояние для расширенных фильтров
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFiltersState>({
    query: '',
    minPrice: 0,
    maxPrice: budget || 100000,
    colors: [],
    styles: [],
    sizeCategories: []
  })

  // Состояние загрузки и данных
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<FurnitureItem[]>([])

  // Получаем уникальные цвета для фильтров
  const availableColors = useMemo(() => {
    const colors = new Set<string>()
    FURNITURE_DATABASE.forEach(item => colors.add(item.color))
    return Array.from(colors).sort()
  }, [])

  // Обновляем максимальную цену фильтра при изменении бюджета
  useEffect(() => {
    if (budget && filters.maxPrice > budget) {
      setFilters(prev => ({ ...prev, maxPrice: budget }))
    }
  }, [budget, filters.maxPrice])

  // Загрузка мебели при изменении фильтров
  useEffect(() => {
    const loadFurniture = async () => {
      setLoading(true)
      try {
        const searchQuery = quickSearchQuery || filters.query
        
        if (searchQuery || filters.colors.length > 0 || filters.styles.length > 0 || 
            filters.sizeCategories.length > 0 || filters.minPrice > 0 || 
            filters.maxPrice < (budget || 100000)) {
          
          // Используем расширенный поиск
          const result = await searchFurnitureAdvanced(searchQuery, {
            categories: [selectedCategory],
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            colors: filters.colors,
            styles: filters.styles,
            sizeCategories: filters.sizeCategories
          })
          setItems(result)
        } else {
          // Загружаем по категории
          const result = await getFurnitureByCategory(selectedCategory)
          setItems(result)
        }
      } catch (error) {
        console.error('Ошибка загрузки мебели:', error)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    loadFurniture()
  }, [selectedCategory, quickSearchQuery, filters, budget])

  // Обработчики
  const handleQuickSearch = (query: string) => {
    setQuickSearchQuery(query)
  }

  const handleCategoryChange = (category: FurnitureCategory) => {
    setSelectedCategory(category)
    setQuickSearchQuery('')
    setFilters(prev => ({ ...prev, query: '' }))
  }

  const handleFiltersChange = (newFilters: SearchFiltersState) => {
    setFilters(newFilters)
    setQuickSearchQuery('')
  }

  const clearAllFilters = () => {
    setFilters({
      query: '',
      minPrice: 0,
      maxPrice: budget || 100000,
      colors: [],
      styles: [],
      sizeCategories: []
    })
    setQuickSearchQuery('')
  }

  const hasActiveFilters = quickSearchQuery || filters.query || filters.colors.length > 0 || 
    filters.styles.length > 0 || filters.sizeCategories.length > 0 ||
    filters.minPrice > 0 || filters.maxPrice < (budget || 100000)

  return (
    <Card className={`flex h-full flex-col border-border/70 bg-card/90 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.9)] transition-all-smooth ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>Каталог мебели</span>
          <CategorySettings
            visibleCategories={visibleCategories}
            onVisibilityChange={setVisibleCategories}
          />
        </CardTitle>

        {/* Быстрый поиск */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Быстрый поиск предметов..."
            value={quickSearchQuery}
            onChange={(e) => handleQuickSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {quickSearchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickSearch('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Вкладки категорий */}
        <CategoryTabs
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          visibleCategories={visibleCategories}
        />

        {/* Расширенные фильтры */}
        <SearchFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          availableColors={availableColors}
          maxBudget={budget || 100000}
          isVisible={showAdvancedFilters}
          onToggleVisibility={() => setShowAdvancedFilters(!showAdvancedFilters)}
        />

        {/* Кнопка сброса всех фильтров */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Сбросить все фильтры
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
        <LoadingOverlay isLoading={loading && items.length > 0} text="Обновляем каталог...">
          {/* Результаты поиска */}
          <div className="mb-4 rounded-xl border border-border/60 bg-muted/30 p-3 animate-fade-in transition-all-smooth">
            <p className="text-sm text-muted-foreground">
              Найдено предметов: <span className="font-medium text-foreground">{items.length}</span>
              {hasActiveFilters && (
                <span className="ml-2 text-primary">
                  (с фильтрами)
                </span>
              )}
            </p>
            
            {(quickSearchQuery || filters.query) && (
              <p className="mt-1 text-xs text-muted-foreground">
                Поиск: &quot;{quickSearchQuery || filters.query}&quot;
              </p>
            )}
          </div>

          <FurnitureGrid
            items={items}
            loading={loading}
            emptyMessage={
              hasActiveFilters 
                ? 'Попробуйте изменить параметры поиска или фильтры'
                : 'В этой категории пока нет предметов'
            }
          />
        </LoadingOverlay>
      </CardContent>
    </Card>
  )
}
