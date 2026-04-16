'use client'

import { useState } from 'react'
import { RoomStyle, SizeCategory } from '../../types/room'
import { sizeCategoryNames } from '../../lib/data/furniture-database'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Label } from '../ui/label'
import { Slider } from '@/components/ui/slider'
import { X, SlidersHorizontal } from 'lucide-react'

export interface SearchFilters {
  query: string
  minPrice: number
  maxPrice: number
  colors: string[]
  styles: RoomStyle[]
  sizeCategories: SizeCategory[]
}

interface SearchFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  availableColors: string[]
  maxBudget: number
  isVisible: boolean
  onToggleVisibility: () => void
}

const styleNames = {
  [RoomStyle.SCANDINAVIAN]: 'Скандинавский',
  [RoomStyle.LOFT]: 'Лофт',
  [RoomStyle.CLASSIC]: 'Классика',
  [RoomStyle.MODERN]: 'Современный',
  [RoomStyle.MINIMALIST]: 'Минимализм'
}

export function SearchFilters({
  filters,
  onFiltersChange,
  availableColors,
  maxBudget,
  isVisible,
  onToggleVisibility
}: SearchFiltersProps) {
  const [priceRange, setPriceRange] = useState([filters.minPrice, filters.maxPrice])

  const updateFilters = (updates: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const toggleColor = (color: string) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter(c => c !== color)
      : [...filters.colors, color]
    updateFilters({ colors: newColors })
  }

  const toggleStyle = (style: RoomStyle) => {
    const newStyles = filters.styles.includes(style)
      ? filters.styles.filter(s => s !== style)
      : [...filters.styles, style]
    updateFilters({ styles: newStyles })
  }

  const toggleSizeCategory = (size: SizeCategory) => {
    const newSizes = filters.sizeCategories.includes(size)
      ? filters.sizeCategories.filter(s => s !== size)
      : [...filters.sizeCategories, size]
    updateFilters({ sizeCategories: newSizes })
  }

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values)
    updateFilters({ minPrice: values[0], maxPrice: values[1] })
  }

  const clearAllFilters = () => {
    const clearedFilters: SearchFilters = {
      query: '',
      minPrice: 0,
      maxPrice: maxBudget,
      colors: [],
      styles: [],
      sizeCategories: []
    }
    onFiltersChange(clearedFilters)
    setPriceRange([0, maxBudget])
  }

  const hasActiveFilters = filters.query || filters.colors.length > 0 || 
    filters.styles.length > 0 || filters.sizeCategories.length > 0 ||
    filters.minPrice > 0 || filters.maxPrice < maxBudget

  return (
    <div className="space-y-4">
      {/* Кнопка переключения фильтров */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleVisibility}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Фильтры
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1">
              !
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <X className="h-4 w-4 mr-1" />
            Сбросить все
          </Button>
        )}
      </div>

      {/* Панель фильтров */}
      {isVisible && (
        <Card className="space-y-6 border-border/60 bg-muted/30 p-4">
          {/* Поиск */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Поиск по названию
            </Label>
            <Input
              placeholder="Введите название предмета..."
              value={filters.query}
              onChange={(e) => updateFilters({ query: e.target.value })}
            />
          </div>

          {/* Фильтр по цене */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Диапазон цен: {priceRange[0].toLocaleString('ru-RU')} - {priceRange[1].toLocaleString('ru-RU')} ₽
            </Label>
            <Slider
              value={priceRange}
              onValueChange={handlePriceRangeChange}
              max={maxBudget}
              min={0}
              step={1000}
              className="w-full"
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Input
                type="number"
                placeholder="От"
                value={filters.minPrice || ''}
                onChange={(e) => {
                  const value = Number(e.target.value) || 0
                  setPriceRange([value, priceRange[1]])
                  updateFilters({ minPrice: value })
                }}
                className="w-full"
              />
              <Input
                type="number"
                placeholder="До"
                value={filters.maxPrice || ''}
                onChange={(e) => {
                  const value = Number(e.target.value) || maxBudget
                  setPriceRange([priceRange[0], value])
                  updateFilters({ maxPrice: value })
                }}
                className="w-full"
              />
            </div>
          </div>

          {/* Фильтр по размеру */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Размер предметов
            </Label>
            <div className="flex flex-wrap gap-2">
              {Object.values(SizeCategory).map(size => (
                <Button
                  key={size}
                  variant={filters.sizeCategories.includes(size) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSizeCategory(size)}
                  className="text-xs"
                >
                  {sizeCategoryNames[size]}
                </Button>
              ))}
            </div>
          </div>

          {/* Фильтр по цветам */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Цвета
            </Label>
            <div className="flex flex-wrap gap-2">
              {availableColors.map(color => (
                <Button
                  key={color}
                  variant={filters.colors.includes(color) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleColor(color)}
                  className="text-xs"
                >
                  {color}
                </Button>
              ))}
            </div>
          </div>

          {/* Фильтр по стилям */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Стили интерьера
            </Label>
            <div className="flex flex-wrap gap-2">
              {Object.values(RoomStyle).map(style => (
                <Button
                  key={style}
                  variant={filters.styles.includes(style) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleStyle(style)}
                  className="text-xs"
                >
                  {styleNames[style]}
                </Button>
              ))}
            </div>
          </div>

          {/* Активные фильтры */}
          {hasActiveFilters && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Активные фильтры
              </Label>
              <div className="flex flex-wrap gap-2">
                {filters.query && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Поиск: &quot;{filters.query}&quot;
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilters({ query: '' })}
                    />
                  </Badge>
                )}
                {filters.colors.map(color => (
                  <Badge key={color} variant="secondary" className="flex items-center gap-1">
                    {color}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => toggleColor(color)}
                    />
                  </Badge>
                ))}
                {filters.styles.map(style => (
                  <Badge key={style} variant="secondary" className="flex items-center gap-1">
                    {styleNames[style]}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => toggleStyle(style)}
                    />
                  </Badge>
                ))}
                {filters.sizeCategories.map(size => (
                  <Badge key={size} variant="secondary" className="flex items-center gap-1">
                    {sizeCategoryNames[size]}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => toggleSizeCategory(size)}
                    />
                  </Badge>
                ))}
                {(filters.minPrice > 0 || filters.maxPrice < maxBudget) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {filters.minPrice.toLocaleString('ru-RU')} - {filters.maxPrice.toLocaleString('ru-RU')} ₽
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => {
                        updateFilters({ minPrice: 0, maxPrice: maxBudget })
                        setPriceRange([0, maxBudget])
                      }}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
