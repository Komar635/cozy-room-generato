'use client'

import { FurnitureItem } from '../../types/room'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '@/components/ui/badge'
import { useRoomStore } from '../../store/room-store'
import { Plus, Info } from 'lucide-react'
import { useState } from 'react'

interface FurnitureCardProps {
  item: FurnitureItem
  onSelect?: (item: FurnitureItem) => void
  showAddButton?: boolean
  className?: string
}

export function FurnitureCard({ 
  item, 
  onSelect, 
  showAddButton = true,
  className = '' 
}: FurnitureCardProps) {
  const { canAddItem, addFurniture } = useRoomStore()
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const canAdd = canAddItem(item.price)
  
  const handleAddItem = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (canAdd) {
      // Создаем копию предмета с уникальным ID для размещения
      const newItem: FurnitureItem = {
        ...item,
        id: `${item.id}_${Date.now()}`,
        position: { x: 0, y: 0, z: 0 } // Будет установлена при размещении
      }
      addFurniture(newItem)
    }
  }

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(item)
    }
  }

  // Функция копирования полной информации
  const copyFullInfo = (e: React.MouseEvent) => {
    e.stopPropagation()
    const fullInfo = `
Название: ${item.name}
Цена: ${formatPrice(item.price)}
Цвет: ${item.color}
Размеры: ${getDimensions()}
Категория: ${item.category}
Стили: ${item.style.join(', ')}
ID: ${item.id}
    `.trim()
    
    navigator.clipboard.writeText(fullInfo)
  }

  // Обработчики drag & drop
  const handleDragStart = (e: React.DragEvent) => {
    if (!canAdd) {
      e.preventDefault()
      return
    }
    
    setIsDragging(true)
    
    // Передаем данные предмета
    e.dataTransfer.setData('application/json', JSON.stringify(item))
    e.dataTransfer.effectAllowed = 'copy'
    
    // Создаем превью для перетаскивания
    const dragImage = new Image()
    dragImage.src = item.thumbnailUrl
    e.dataTransfer.setDragImage(dragImage, 50, 50)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const getDimensions = () => {
    const { width, height, depth } = item.dimensions
    return `${width}×${height}×${depth} м`
  }

  return (
    <Card 
      className={`group cursor-pointer border-border/70 bg-card/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        isHovered ? 'scale-[1.01]' : ''
      } ${isDragging ? 'opacity-50' : ''} ${!canAdd ? 'opacity-60' : ''} ${className} h-full flex flex-col`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={canAdd}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <CardContent className="flex h-full flex-col gap-4 p-4 sm:flex-row">
        {/* Изображение предмета - слева */}
        <div className="relative h-40 w-full flex-shrink-0 overflow-hidden rounded-xl bg-muted sm:mr-0 sm:h-full sm:w-32">
          {!imageError ? (
            <img
              src={item.thumbnailUrl}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
              <Info className="h-8 w-8" />
              <span className="ml-2 text-xs">Нет изображения</span>
            </div>
          )}
          
          {/* Бейдж стиля */}
          {item.style.length > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute top-2 left-2 text-xs"
            >
              {item.style[0]}
            </Badge>
          )}
        </div>

        {/* Информация о предмете - справа */}
        <div className="flex flex-col justify-between flex-1 min-w-0">
          {/* Верхняя часть */}
          <div className="space-y-2">
            <h3 
              className="font-medium text-sm leading-tight line-clamp-2 select-text cursor-text"
              title={item.name}
            >
              {item.name}
            </h3>
            
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="select-text cursor-text">Цвет: {item.color}</div>
              <div className="select-text cursor-text">Размер: {getDimensions()}</div>
              <div className="select-text cursor-text">ID: {item.id}</div>
            </div>
          </div>
          
          {/* Нижняя часть */}
          <div className="space-y-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="select-text cursor-text text-lg font-bold text-green-600">
                {formatPrice(item.price)}
              </span>
              
              <div className="flex flex-wrap gap-1">
                {/* Кнопка копирования названия */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigator.clipboard.writeText(item.name)
                  }}
                  className="h-8 w-8 rounded-full p-0"
                  title="Копировать название"
                >
                  📋
                </Button>
                
                {/* Кнопка копирования всей информации */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyFullInfo}
                  className="h-8 w-8 rounded-full p-0"
                  title="Копировать всю информацию"
                >
                  📄
                </Button>
                
                {showAddButton && (
                  <Button
                    size="sm"
                    onClick={handleAddItem}
                    disabled={!canAdd}
                    className={`${
                      canAdd 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'cursor-not-allowed bg-gray-400'
                    } flex-shrink-0`}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Добавить
                  </Button>
                )}
              </div>
            </div>
            
            {/* Статус */}
            <div className="text-xs">
              {!canAdd ? (
                <p className="text-red-500 select-text cursor-text">
                  Превышение бюджета
                </p>
              ) : (
                <p className="text-gray-500 select-text cursor-text">
                  Перетащите в 3D сцену
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
