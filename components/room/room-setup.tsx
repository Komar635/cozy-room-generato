'use client'

import { useState, useRef } from 'react'
import { RoomDimensions } from '@/types/room'
import { useRoomStore } from '@/store/room-store'
import RoomCreator from './room-creator'
import RoomInfo from './room-info'
import Scene from '@/components/3d/scene'
import ProjectManager from './project-manager'
import StyleSelector from './style-selector'
import StyleAnalyzer from './style-analyzer'
import { BudgetPanel, BudgetWarning } from '@/components/budget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'

interface RoomSetupProps {
  onComplete?: (dimensions: RoomDimensions) => void
}

export default function RoomSetup({ onComplete }: RoomSetupProps) {
  const [showInfo, setShowInfo] = useState(false)
  const [is3DLoading, setIs3DLoading] = useState(true)
  const { roomDimensions } = useRoomStore()
  const sceneRef = useRef<{ captureImage?: () => string | null }>(null)

  const handleRoomCreated = (dimensions: RoomDimensions) => {
    setShowInfo(true)
    onComplete?.(dimensions)
  }

  const handleExportImage = () => {
    if (sceneRef.current?.captureImage) {
      return sceneRef.current.captureImage()
    }
    return null
  }

  const handle3DLoad = () => {
    setIs3DLoading(false)
  }

  return (
    <div className="room-setup-container w-full h-full animate-fade-in gap-3 p-2 md:gap-4 md:p-4">
      {/* Левая панель - настройки */}
      <div className="w-full flex-shrink-0 space-y-3 overflow-y-auto max-h-full lg:w-80 lg:max-w-80 lg:min-w-80 md:space-y-4">
        <RoomCreator onRoomCreated={handleRoomCreated} />
        
        {showInfo && (
          <div className="space-y-3 animate-slide-up md:space-y-4">
            <RoomInfo />
            <StyleSelector />
            <StyleAnalyzer />
            
            {/* Панель бюджета */}
            <BudgetPanel />
            
            {/* Управление проектом */}
            <ProjectManager onExportImage={handleExportImage} />
            
            {/* Кнопки действий */}
            <Card className="border-border/70 bg-card/90 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.9)]">
              <CardHeader>
                <CardTitle className="text-lg">Действия</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <Button 
                  className="w-full touch-punchy transition-all duration-300 hover:-translate-y-0.5" 
                  onClick={() => onComplete?.(roomDimensions)}
                >
                  Продолжить к мебели
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full transition-all duration-300 hover:-translate-y-0.5"
                  onClick={() => setShowInfo(false)}
                >
                  Изменить размеры
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Правая панель - 3D предпросмотр */}
      <div className="flex-1 min-w-0 min-h-[400px] lg:min-h-[700px] overflow-hidden">
        {/* Предупреждения о бюджете */}
        <BudgetWarning className="mb-2 md:mb-4" />
        
        <Card className="h-full w-full border-border/70 bg-card/85 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.95)] backdrop-blur">
          <CardHeader className="flex-shrink-0 py-2 md:py-3">
            <CardTitle className="text-lg">3D Предпросмотр</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 h-full overflow-hidden">
            <div className="scene-container w-full h-full min-h-[350px] lg:min-h-[600px] rounded-b-lg overflow-hidden relative">
              {/* Индикатор загрузки 3D сцены */}
              {is3DLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                  <LoadingSpinner size="lg" text="Загрузка 3D сцены..." />
                </div>
              )}
              <Scene 
                ref={sceneRef} 
                onLoad={handle3DLoad}
                className={is3DLoading ? 'opacity-50' : 'opacity-100 transition-opacity duration-300'}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
