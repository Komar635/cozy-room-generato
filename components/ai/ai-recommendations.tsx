'use client'

import { useState } from 'react'
import { useRoomStore } from '@/store/room-store'
import { AIApiService } from '@/lib/services/ai-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AsyncButton, LoadingSpinner } from '@/components/ui/loading'

interface AIRecommendation {
  id: string
  name: string
  category: string
  price: number
  priceFormatted?: string
  reason: string
  confidence: number
  adaptedForRussia?: boolean
}

export default function AIRecommendations() {
  const { roomDimensions, selectedStyle, budget, furniture, addFurniture } = useRoomStore()
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<any>(null)

  const getRecommendations = async () => {
    try {
      setIsLoading(true)
      
      // Получаем рекомендации через новый интегрированный API
      const result = await AIApiService.getRecommendations({
        roomDimensions,
        style: selectedStyle,
        budget,
        existingFurniture: furniture
      })
      
      setRecommendations(result.recommendations || [])
      
      // Проверяем статус API сервисов
      const status = await AIApiService.checkAIStatus()
      setApiStatus(status)
      
    } catch (err: any) {
      console.error('Ошибка получения рекомендаций:', err)
      setRecommendations([])
    } finally {
      setIsLoading(false)
    }
  }

  const addRecommendationToRoom = (recommendation: AIRecommendation) => {
    // Преобразуем рекомендацию в FurnitureItem
    const furnitureItem = {
      id: `rec_${recommendation.id}`,
      name: recommendation.name,
      category: recommendation.category as any,
      price: recommendation.price,
      dimensions: { width: 1, height: 1, depth: 1 }, // Базовые размеры
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      modelUrl: '',
      thumbnailUrl: '',
      style: [selectedStyle],
      color: 'default'
    }
    
    addFurniture(furnitureItem)
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

  const getSourceBadge = () => {
    if (!apiStatus) return null
    
    if (apiStatus.roomgpt?.available) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">RoomGPT API</Badge>
    } else {
      return <Badge variant="secondary">Локальный ИИ</Badge>
    }
  }

  return (
    <Card className="w-full border-border/70 bg-card/90 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.9)] animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2" data-testid="ai-recommendations-title">
          🧠 ИИ Рекомендации
          {getSourceBadge()}
        </CardTitle>
        <CardDescription>
          Умные рекомендации мебели с адаптацией под российские цены
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Информация о текущих параметрах */}
        <div className="p-3 bg-muted rounded-md text-sm" data-testid="ai-recommendations-context">
          <p data-testid="ai-context-dimensions"><strong>Размеры:</strong> {roomDimensions.width} × {roomDimensions.height} × {roomDimensions.depth} м</p>
          <p data-testid="ai-context-style"><strong>Стиль:</strong> {selectedStyle}</p>
          <p data-testid="ai-context-budget"><strong>Бюджет:</strong> {formatPrice(budget)}</p>
          <p data-testid="ai-context-furniture-count"><strong>Текущая мебель:</strong> {furniture.length} предметов</p>
        </div>

        {/* Статус API сервисов */}
        {apiStatus && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm" data-testid="ai-status-panel">
            <p className="font-medium text-blue-800">Статус ИИ сервисов:</p>
            <div className="mt-1 space-y-1">
              <p className="text-blue-700" data-testid="ai-status-roomgpt">
                • RoomGPT API: {apiStatus.roomgpt?.available ? '✅ Доступен' : '❌ Недоступен'}
              </p>
              <p className="text-blue-700" data-testid="ai-status-local">
                • Локальный ИИ: ✅ Всегда доступен
              </p>
            </div>
            <p className="mt-2 text-blue-600 italic" data-testid="ai-status-recommendation">{apiStatus.recommendation}</p>
          </div>
        )}

        {/* Кнопка получения рекомендаций */}
        <AsyncButton 
          onClick={getRecommendations}
          className="w-full"
          loading={isLoading}
          loadingText="Загрузка рекомендаций..."
          data-testid="ai-recommendations-trigger"
        >
          Получить ИИ рекомендации
        </AsyncButton>

        {/* Индикатор загрузки */}
        {isLoading && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4 animate-fade-in" data-testid="ai-recommendations-loading">
            <LoadingSpinner size="sm" />
            <div className="text-sm text-muted-foreground">
              Анализируем вашу комнату и подбираем оптимальные варианты...
            </div>
          </div>
        )}

        {/* Список рекомендаций */}
        {recommendations.length > 0 && (
          <div className="space-y-3" data-testid="ai-recommendations-list">
            <h4 className="font-medium">Рекомендации ИИ:</h4>
            {recommendations.map((rec, index) => (
              <div
                key={rec.id}
                className="stagger-item space-y-2 rounded-xl border border-border/70 bg-card/60 p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                style={{ animationDelay: `${index * 60}ms` }}
                data-testid={`ai-recommendation-card-${rec.id}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h5 className="font-medium" data-testid={`ai-recommendation-name-${rec.id}`}>{rec.name}</h5>
                    <p className="text-sm text-muted-foreground capitalize" data-testid={`ai-recommendation-category-${rec.id}`}>{rec.category}</p>
                    {rec.adaptedForRussia && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Адаптировано для РФ
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium" data-testid={`ai-recommendation-price-${rec.id}`}>
                      {rec.priceFormatted || formatPrice(rec.price)}
                    </p>
                    <p className={`text-xs ${getConfidenceColor(rec.confidence)}`} data-testid={`ai-recommendation-confidence-${rec.id}`}>
                      Уверенность: {Math.round(rec.confidence * 100)}%
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground" data-testid={`ai-recommendation-reason-${rec.id}`}>{rec.reason}</p>
                <AsyncButton 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => addRecommendationToRoom(rec)}
                  data-testid={`ai-add-recommendation-${rec.id}`}
                >
                  Добавить в комнату
                </AsyncButton>
              </div>
            ))}
          </div>
        )}

        {/* Информация о технологии */}
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700 text-sm">
            <strong>🚀 Гибридный ИИ:</strong> Использует RoomGPT API (OpenAI/Replicate) когда доступен, 
            с автоматическим переключением на локальные алгоритмы. Все цены адаптированы под российский рынок.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
