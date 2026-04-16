'use client'

import { FurnitureCategory } from '@/types/room'
import { Button } from '@/components/ui/button'
import { 
  Sofa, 
  Shirt, 
  Palette, 
  Lightbulb, 
  TreePine, 
  Monitor 
} from 'lucide-react'

interface CategoryTabsProps {
  selectedCategory: FurnitureCategory
  onCategoryChange: (category: FurnitureCategory) => void
  visibleCategories: FurnitureCategory[]
}

const categoryIcons = {
  [FurnitureCategory.FURNITURE]: Sofa,
  [FurnitureCategory.TEXTILE]: Shirt,
  [FurnitureCategory.DECOR]: Palette,
  [FurnitureCategory.LIGHTING]: Lightbulb,
  [FurnitureCategory.PLANTS]: TreePine,
  [FurnitureCategory.APPLIANCES]: Monitor
}

const categoryNames = {
  [FurnitureCategory.FURNITURE]: 'Мебель',
  [FurnitureCategory.TEXTILE]: 'Текстиль',
  [FurnitureCategory.DECOR]: 'Декор',
  [FurnitureCategory.LIGHTING]: 'Освещение',
  [FurnitureCategory.PLANTS]: 'Растения',
  [FurnitureCategory.APPLIANCES]: 'Техника'
}

export function CategoryTabs({
  selectedCategory,
  onCategoryChange,
  visibleCategories
}: CategoryTabsProps) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 scrollbar-thin">
      {visibleCategories.map((category) => {
        const Icon = categoryIcons[category]
        const isSelected = selectedCategory === category
        
        return (
          <Button
            key={category}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category)}
            className="flex shrink-0 items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">
              {categoryNames[category]}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
