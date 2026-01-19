'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Динамический импорт компонента для избежания SSR проблем
const RoomSetup = dynamic(() => import('@/components/room/room-setup'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64">Загрузка 3D сцены...</div>
})

export default function RoomPage() {
  const handleRoomComplete = (dimensions: any) => {
    console.log('Комната создана с размерами:', dimensions)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-4 h-screen flex flex-col">
        <div className="text-center mb-4 space-y-2 flex-shrink-0">
          <h1 className="text-3xl font-bold">Создание комнаты</h1>
          <p className="text-lg text-muted-foreground">
            Настройте размеры комнаты и посмотрите результат в 3D
          </p>
          
          {/* Навигация */}
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button variant="outline" size="sm">
                ← Главная
              </Button>
            </Link>
            <Link href="/api-demo">
              <Button variant="outline" size="sm">
                🚀 Демо функций
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="flex-1 min-h-0 overflow-hidden">
          <RoomSetup onComplete={handleRoomComplete} />
        </div>
      </div>
    </main>
  )
}