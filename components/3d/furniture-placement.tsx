'use client'

import { useState, useCallback } from 'react'
import { FurnitureItem, Vector3 } from '@/types/room'
import { useRoomStore } from '@/store/room-store'
import { FurnitureContextMenu } from './furniture-context-menu'
import { PositionControls } from './position-controls'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Trash2,
  Copy,
  Move3D
} from 'lucide-react'

interface FurniturePlacementProps {
  selectedItem: FurnitureItem | null
  onItemSelect: (item: FurnitureItem | null) => void
  className?: string
}

export function FurniturePlacement({
  selectedItem,
  onItemSelect,
  className = ''
}: FurniturePlacementProps) {
  const { furniture, removeFurniture, addFurniture, updateFurniture } = useRoomStore()
  
  const [contextMenu, setContextMenu] = useState<{
    item: FurnitureItem | null
    position: { x: number; y: number }
    visible: boolean
  }>({
    item: null,
    position: { x: 0, y: 0 },
    visible: false
  })
  
  const [showPositionControls, setShowPositionControls] = useState(false)

  // Обработчики для контекстного меню
  const handleContextMenu = useCallback((item: FurnitureItem, event: React.MouseEvent) => {
    event.preventDefault()
    setContextMenu({
      item,
      position: { x: event.clientX, y: event.clientY },
      visible: true
    })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }))
  }, [])

  // Быстрые действия
  const handleQuickRotate = (item: FurnitureItem) => {
    const newRotation = {
      ...item.rotation,
      y: item.rotation.y + Math.PI / 2
    }
    updateFurniture(item.id, { rotation: newRotation })
  }

  const handleQuickCopy = (item: FurnitureItem) => {
    const newItem: FurnitureItem = {
      ...item,
      id: `${item.id.split('_')[0]}_${Date.now()}`,
      position: {
        x: item.position.x + 0.5,
        y: item.position.y,
        z: item.position.z + 0.5
      }
    }
    addFurniture(newItem)
  }

  const handleQuickDelete = (item: FurnitureItem) => {
    removeFurniture(item.id)
    if (selectedItem?.id === item.id) {
      onItemSelect(null)
    }
  }

  const clearSelection = () => {
    onItemSelect(null)
    setShowPositionControls(false)
  }

  const togglePositionControls = () => {
    setShowPositionControls(!showPositionControls)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Список размещенных предметов */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Move3D className="h-5 w-5" />
              Размещенные предметы
            </span>
            <Badge variant="secondary">
              {furniture.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {furniture.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Move3D className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                Перетащите предметы из каталога в 3D сцену
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {furniture.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedItem?.id === item.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => onItemSelect(item)}
                  onContextMenu={(e) => handleContextMenu(item, e)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {item.position.x.toFixed(1)}, {item.position.y.toFixed(1)}, {item.position.z.toFixed(1)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuickRotate(item)
                        }}
                        className="h-8 w-8 p-0"
                        title="Повернуть на 90°"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuickCopy(item)
                        }}
                        className="h-8 w-8 p-0"
                        title="Копировать"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuickDelete(item)
                        }}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Панель управления выбранным предметом */}
      {selectedItem && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Выбранный предмет</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePositionControls}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  {showPositionControls ? 'Скрыть' : 'Настройки'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">{selectedItem.name}</h4>
                <p className="text-sm text-gray-600">
                  {selectedItem.dimensions.width}×{selectedItem.dimensions.height}×{selectedItem.dimensions.depth} м
                </p>
                <p className="text-sm text-green-600 font-medium">
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    minimumFractionDigits: 0
                  }).format(selectedItem.price)}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickRotate(selectedItem)}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Повернуть
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickCopy(selectedItem)}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Копировать
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDelete(selectedItem)}
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Удалить
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Точное позиционирование */}
      {showPositionControls && selectedItem && (
        <PositionControls
          item={selectedItem}
          onPositionChange={(item, position) => {
            updateFurniture(item.id, { position })
          }}
          onRotationChange={(item, rotation) => {
            updateFurniture(item.id, { rotation })
          }}
          onScaleChange={(item, scale) => {
            // Обновление масштаба обрабатывается в PositionControls
          }}
        />
      )}

      {/* Контекстное меню */}
      <FurnitureContextMenu
        item={contextMenu.item}
        position={contextMenu.position}
        visible={contextMenu.visible}
        onClose={closeContextMenu}
        onRotate={handleQuickRotate}
        onCopy={handleQuickCopy}
        onDelete={handleQuickDelete}
      />
    </div>
  )
}