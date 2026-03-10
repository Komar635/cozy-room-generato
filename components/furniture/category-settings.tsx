'use client'

import { useState } from 'react'
import { FurnitureCategory } from '../../types/room'
import { CATEGORY_NAMES, CATEGORY_ICONS } from '../../lib/constants'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Switch } from '../ui/switch'
import { Settings, Eye, EyeOff } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

interface CategorySettingsProps {
  visibleCategories: FurnitureCategory[]
  onVisibilityChange: (categories: FurnitureCategory[]) => void
  className?: string
}

export function CategorySettings({
  visibleCategories,
  onVisibilityChange,
  className = ''
}: CategorySettingsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const allCategories = Object.values(FurnitureCategory)

  const toggleCategory = (category: FurnitureCategory) => {
    const isVisible = visibleCategories.includes(category)
    
    if (isVisible) {
      // Убираем категорию из видимых (но не даем убрать все)
      if (visibleCategories.length > 1) {
        onVisibilityChange(visibleCategories.filter(c => c !== category))
      }
    } else {
      // Добавляем категорию в видимые
      onVisibilityChange([...visibleCategories, category])
    }
  }

  const showAll = () => {
    onVisibilityChange(allCategories)
  }

  const hideAll = () => {
    // Оставляем только первую категорию
    onVisibilityChange([allCategories[0]])
  }

  const getIcon = (category: FurnitureCategory) => {
    const iconName = CATEGORY_ICONS[category] as keyof typeof LucideIcons
    const IconComponent = LucideIcons[iconName] as React.ComponentType<{ className?: string }>
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 ${className}`}
      >
        <Settings className="h-4 w-4" />
        Настроить категории
      </Button>
    )
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Видимые категории</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Быстрые действия */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={showAll}
            className="flex items-center gap-1"
          >
            <Eye className="h-3 w-3" />
            Показать все
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={hideAll}
            className="flex items-center gap-1"
          >
            <EyeOff className="h-3 w-3" />
            Скрыть все
          </Button>
        </div>

        {/* Список категорий */}
        <div className="space-y-3">
          {allCategories.map((category) => {
            const isVisible = visibleCategories.includes(category)
            const isLastVisible = visibleCategories.length === 1 && isVisible
            
            return (
              <div
                key={category}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {getIcon(category)}
                  <span className="font-medium">
                    {CATEGORY_NAMES[category]}
                  </span>
                </div>
                
                <Switch
                  checked={isVisible}
                  onCheckedChange={() => toggleCategory(category)}
                  disabled={isLastVisible}
                />
              </div>
            )
          })}
        </div>

        {/* Информация */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          Показано {visibleCategories.length} из {allCategories.length} категорий.
          Минимум одна категория должна быть видимой.
        </div>
      </CardContent>
    </Card>
  )
}