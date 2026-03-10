'use client'

import { useState } from 'react'
import { FurnitureItem } from '@/types/room'
import { FurnitureLibrary } from '@/components/furniture/furniture-library'
import { FurniturePlacement } from '@/components/3d/furniture-placement'
import WorkingRoomCanvas from '@/components/3d/working-room-canvas'
import WebGLDiagnostics from '@/components/3d/webgl-diagnostics'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Home, Settings } from 'lucide-react'
import Link from 'next/link'

export default function FurnitureDemoPage() {
  const [selectedItem, setSelectedItem] = useState<FurnitureItem | null>(null)

  const handleItemSelect = (item: FurnitureItem | null) => {
    setSelectedItem(item)
  }

  const handleItemMove = (itemId: string, position: any) => {
    console.log('Item moved:', itemId, position)
  }

  // Простая функция для тестирования добавления мебели
  const addTestFurniture = () => {
    const testItem: FurnitureItem = {
      id: `test-${Date.now()}`,
      name: 'Тестовый диван',
      category: 'furniture' as any,
      price: 45000,
      dimensions: { width: 2, height: 0.8, depth: 1 },
      position: { x: Math.random() * 4 - 2, y: 0, z: Math.random() * 4 - 2 },
      rotation: { x: 0, y: 0, z: 0 },
      modelUrl: '',
      thumbnailUrl: '',
      style: [],
      color: 'Синий'
    }
    
    // Добавляем через store
    const { addFurniture } = require('@/store/room-store').useRoomStore.getState()
    addFurniture(testItem)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Заголовок */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Демо размещения мебели</h1>
                <p className="text-sm text-gray-600">
                  Перетаскивайте предметы из каталога в 3D сцену
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Link href="/room">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Создать комнату
                </Button>
              </Link>
              <Link href="/setup">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Настройки
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Каталог мебели */}
          <div className="lg:col-span-1">
            <FurnitureLibrary className="h-full" />
          </div>

          {/* 3D сцена */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  🏠 3D Комната
                </CardTitle>
                <div className="flex gap-2">
                  <p className="text-sm text-gray-600 flex-1">
                    Перетащите предметы из каталога сюда
                  </p>
                  <Button 
                    onClick={addTestFurniture}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Добавить тест
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)]">
                <WorkingRoomCanvas
                  onItemSelect={handleItemSelect}
                  onItemMove={handleItemMove}
                  className="w-full h-full rounded-lg border relative"
                />
              </CardContent>
            </Card>
          </div>

          {/* Панель управления */}
          <div className="lg:col-span-1 space-y-4">
            <FurniturePlacement
              selectedItem={selectedItem}
              onItemSelect={handleItemSelect}
              className="h-2/3"
            />
            
            {/* Диагностика WebGL */}
            <div className="h-1/3">
              <WebGLDiagnostics />
            </div>
          </div>
        </div>
      </div>

      {/* Инструкции */}
      <div className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">💡 Как использовать</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-600">1. Выберите предмет</h4>
                  <p className="text-gray-600">
                    Найдите нужный предмет в каталоге слева. Используйте поиск и фильтры.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-green-600">2. Перетащите в сцену</h4>
                  <p className="text-gray-600">
                    Перетащите предмет из каталога в 3D сцену. Он автоматически разместится.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-purple-600">3. Настройте позицию</h4>
                  <p className="text-gray-600">
                    Кликните на предмет для выбора. Используйте панель справа для точной настройки.
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">🎮 Управление:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                  <div>
                    <strong>Перетаскивание:</strong> Drag & Drop
                  </div>
                  <div>
                    <strong>Поворот:</strong> Двойной клик
                  </div>
                  <div>
                    <strong>Меню:</strong> Правый клик
                  </div>
                  <div>
                    <strong>Камера:</strong> Мышь + колесо
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}