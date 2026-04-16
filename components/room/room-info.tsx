'use client'

import { useRoomStore } from '@/store/room-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function RoomInfo() {
  const { roomDimensions } = useRoomStore()
  const { width, height, depth } = roomDimensions

  // Расчеты
  const floorArea = width * depth
  const wallArea = 2 * (width * height + depth * height)
  const totalArea = floorArea + wallArea + floorArea // пол + стены + потолок
  const volume = width * height * depth
  const perimeter = 2 * (width + depth)

  return (
    <Card className="w-full border-border/70 bg-card/90 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.9)] animate-slide-up">
      <CardHeader>
        <CardTitle className="text-lg" data-testid="room-info-title">Информация о комнате</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          {/* Основные размеры */}
          <div className="space-y-2">
            <h4 className="font-medium text-muted-foreground">Размеры</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Ширина:</span>
                <span className="font-mono" data-testid="room-info-width">{width.toFixed(1)} м</span>
              </div>
              <div className="flex justify-between">
                <span>Высота:</span>
                <span className="font-mono" data-testid="room-info-height">{height.toFixed(1)} м</span>
              </div>
              <div className="flex justify-between">
                <span>Глубина:</span>
                <span className="font-mono" data-testid="room-info-depth">{depth.toFixed(1)} м</span>
              </div>
            </div>
          </div>

          {/* Расчетные параметры */}
          <div className="space-y-2">
            <h4 className="font-medium text-muted-foreground">Параметры</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Площадь пола:</span>
                <span className="font-mono" data-testid="room-info-floor-area">{floorArea.toFixed(1)} м²</span>
              </div>
              <div className="flex justify-between">
                <span>Объем:</span>
                <span className="font-mono" data-testid="room-info-volume">{volume.toFixed(1)} м³</span>
              </div>
              <div className="flex justify-between">
                <span>Периметр:</span>
                <span className="font-mono" data-testid="room-info-perimeter">{perimeter.toFixed(1)} м</span>
              </div>
            </div>
          </div>

          {/* Дополнительная информация */}
          <div className="space-y-2 border-t pt-2 sm:col-span-2">
            <h4 className="font-medium text-muted-foreground">Дополнительно</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Площадь стен:</span>
                <span className="font-mono">{wallArea.toFixed(1)} м²</span>
              </div>
              <div className="flex justify-between">
                <span>Общая площадь:</span>
                <span className="font-mono">{totalArea.toFixed(1)} м²</span>
              </div>
            </div>
          </div>

          {/* Рекомендации */}
          <div className="border-t pt-2 sm:col-span-2">
            <h4 className="font-medium text-muted-foreground mb-2">Рекомендации</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              {floorArea < 10 && (
                <p className="text-orange-600">• Небольшая комната - рекомендуется минималистичный дизайн</p>
              )}
              {floorArea >= 10 && floorArea < 25 && (
                <p className="text-blue-600">• Средняя комната - подходит для большинства стилей</p>
              )}
              {floorArea >= 25 && (
                <p className="text-green-600">• Просторная комната - можно использовать крупную мебель</p>
              )}
              {height < 2.5 && (
                <p className="text-orange-600">• Низкие потолки - избегайте высокой мебели</p>
              )}
              {height >= 3.5 && (
                <p className="text-green-600">• Высокие потолки - можно использовать вертикальные элементы</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
