'use client'

import { useState } from 'react'
import { RoomDimensions } from '@/types/room'
import { useRoomStore } from '@/store/room-store'
import RoomCreator from './room-creator'
import RoomInfo from './room-info'
import Scene from '@/components/3d/scene'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface RoomSetupProps {
  onComplete?: (dimensions: RoomDimensions) => void
}

export default function RoomSetup({ onComplete }: RoomSetupProps) {
  const [showInfo, setShowInfo] = useState(false)
  const { roomDimensions } = useRoomStore()

  const handleRoomCreated = (dimensions: RoomDimensions) => {
    setShowInfo(true)
    onComplete?.(dimensions)
  }

  return (
    <div className="room-setup-container w-full h-full flex flex-col lg:flex-row gap-4 p-4">
      {/* Левая панель - настройки */}
      <div className="w-full lg:w-80 lg:max-w-80 lg:min-w-80 flex-shrink-0 space-y-4 overflow-y-auto max-h-full">
        <RoomCreator onRoomCreated={handleRoomCreated} />
        
        {showInfo && (
          <div className="space-y-4">
            <RoomInfo />
            
            {/* Кнопки действий */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={() => onComplete?.(roomDimensions)}
                >
                  Продолжить к мебели
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
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
      <div className="flex-1 min-w-0 min-h-[500px] lg:min-h-[700px] overflow-hidden">
        <Card className="w-full h-full">
          <CardHeader className="flex-shrink-0 py-3">
            <CardTitle className="text-lg">3D Предпросмотр</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 h-full overflow-hidden">
            <div className="scene-container w-full h-full min-h-[450px] lg:min-h-[600px] rounded-b-lg overflow-hidden">
              <Scene />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}