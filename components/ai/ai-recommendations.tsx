'use client'

import { useState } from 'react'
import { useRoomStore } from '@/store/room-store'
import { LocalAIService } from '@/lib/services/local-ai'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AIRecommendation {
  id: string
  name: string
  category: string
  price: number
  reason: string
  confidence: number
}

export default function AIRecommendations() {
  const { roomDimensions, selectedStyle, budget, furniture } = useRoomStore()
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const getRecommendations = async () => {
    try {
      setIsLoading(true)
      
      // Используем ТОЛЬКО локальный ИИ - никаких внешних API!
      const result = LocalAIService.getFurnitureRecommendations({
        roomDimensions,
        style: selectedStyle,
        budget,
        existingFurniture: furniture
      })
      
      if (result.success) {
        setRecommendations(result.data.recommendations)
      }
    } catch (err: any) {
      console.error('Ошибка локального ИИ:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(price)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧠 Локальный ИИ Рекомендации
        </CardTitle>
        <CardDescription>
          Умные рекомендации на основе встроенных алгоритмов (работает без интернета!)
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Информация о текущих параметрах */}
        <div className="p-3 bg-muted rounded-md text-sm">
          <p><strong>Размеры:</strong> {roomDimensions.width} × {roomDimensions.height} × {roomDimensions.depth} м</p>
          <p><strong>Стиль:</strong> {selectedStyle}</p>
          <p><strong>Бюджет:</strong> {formatPrice(budget)}</p>
          <p><strong>Текущая мебель:</strong> {furniture.length} предметов</p>
        </div>

        {/* Кнопка получения рекомендаций */}
        <Button 
          onClick={getRecommendations}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Анализ комнаты...' : 'Получить рекомендации'}
        </Button>

        {/* Список рекомендаций */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Рекомендации локального ИИ:</h4>
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-3 border rounded-md space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">{rec.name}</h5>
                    <p className="text-sm text-muted-foreground capitalize">{rec.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(rec.price)}</p>
                    <p className={`text-xs ${getConfidenceColor(rec.confidence)}`}>
                      Уверенность: {Math.round(rec.confidence * 100)}%
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{rec.reason}</p>
                <Button size="sm" variant="outline" className="w-full">
                  Добавить в комнату
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Информация о локальном ИИ */}
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700 text-sm">
            <strong>✅ Работает без API:</strong> Использует встроенные алгоритмы на основе правил дизайна интерьера. 
            Никаких внешних сервисов не требуется!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}