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
      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex-shrink-0 space-y-3 text-center md:mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Создание комнаты</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Настройте размеры комнаты и посмотрите результат в 3D
          </p>
          
          {/* Навигация */}
          <div className="flex flex-wrap justify-center gap-3">
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
            <Link href="/room/performance">
              <Button variant="outline" size="sm">
                3D Perf Lab
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="flex-1 min-h-0">
          <RoomSetup onComplete={handleRoomComplete} />
        </div>
      </div>
    </main>
  )
}
