'use client'

import { useState } from 'react'
import { useRoomStore } from '@/store/room-store'
import { RoomStyle } from '@/types/room'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Wand2, Palette, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIApiService } from '@/lib/services/ai-api'
import { LoadingSpinner } from '@/components/ui/loading'

const STYLES = [
  {
    id: RoomStyle.SCANDINAVIAN,
    name: 'Скандинавский',
    description: 'Светлые тона, натуральное дерево и много света.',
    color: '#F5F5F5',
    secondaryColor: '#E8DCC4',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=120&fit=crop',
    keywords: ['уют', 'натуральность', 'простота', 'свет'],
    budget: { min: 30000, optimal: 80000 }
  },
  {
    id: RoomStyle.LOFT,
    name: 'Лофт',
    description: 'Индустриальный стиль, кирпич, металл и темные акценты.',
    color: '#4A4A4A',
    secondaryColor: '#333333',
    image: 'https://images.unsplash.com/photo-1505691722218-269e6353c573?w=200&h=120&fit=crop',
    keywords: ['индустриальный', 'металл', 'кирпич', 'брутальность'],
    budget: { min: 40000, optimal: 100000 }
  },
  {
    id: RoomStyle.CLASSIC,
    name: 'Классика',
    description: 'Изысканность, симметрия и традиционные формы.',
    color: '#E3DAC9',
    secondaryColor: '#5D4037',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&h=120&fit=crop',
    keywords: ['элегантность', 'традиции', 'роскошь', 'симметрия'],
    budget: { min: 60000, optimal: 150000 }
  },
  {
    id: RoomStyle.MODERN,
    name: 'Модерн',
    description: 'Современные формы, функциональность и лаконичность.',
    color: '#FFFFFF',
    secondaryColor: '#D3D3D3',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=120&fit=crop',
    keywords: ['современность', 'функциональность', 'технологии', 'чистота'],
    budget: { min: 35000, optimal: 90000 }
  },
  {
    id: RoomStyle.MINIMALIST,
    name: 'Минимализм',
    description: 'Ничего лишнего, чистое пространство и покой.',
    color: '#FAFAFA',
    secondaryColor: '#F0F0F0',
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=200&h=120&fit=crop',
    keywords: ['простота', 'чистота', 'порядок', 'спокойствие'],
    budget: { min: 25000, optimal: 70000 }
  }
]

export default function StyleSelector() {
  const { 
    selectedStyle, 
    applyStyleTemplate, 
    budget, 
    roomDimensions,
    addNotification 
  } = useRoomStore()
  
  const [isApplyingStyle, setIsApplyingStyle] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([])

  const handleStyleSelect = async (styleId: RoomStyle) => {
    setIsApplyingStyle(true)
    
    try {
      // Применяем базовый шаблон стиля
      applyStyleTemplate(styleId)
      
      // Получаем ИИ-рекомендации для выбранного стиля
      const recommendations = await AIApiService.getRecommendations({
        roomDimensions,
        style: styleId,
        budget,
        existingFurniture: []
      })
      
      setAiRecommendations(recommendations.recommendations || [])
      
      addNotification({
        type: 'success',
        title: 'Стиль применен',
        message: `Комната оформлена в стиле "${STYLES.find(s => s.id === styleId)?.name}". Получены ИИ-рекомендации.`
      })
      
    } catch (error) {
      console.error('Ошибка применения стиля:', error)
      addNotification({
        type: 'warning',
        title: 'Стиль применен частично',
        message: 'Базовый шаблон применен, но ИИ-рекомендации недоступны.'
      })
    } finally {
      setIsApplyingStyle(false)
    }
  }

  const getBudgetRecommendation = (style: any) => {
    if (budget < style.budget.min) {
      return {
        type: 'warning',
        message: `Рекомендуемый минимум: ${style.budget.min.toLocaleString('ru-RU')} ₽`
      }
    } else if (budget >= style.budget.optimal) {
      return {
        type: 'success',
        message: 'Отличный бюджет для этого стиля'
      }
    } else {
      return {
        type: 'info',
        message: `Оптимальный бюджет: ${style.budget.optimal.toLocaleString('ru-RU')} ₽`
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Выберите стиль комнаты
        </h3>
        {isApplyingStyle && (
          <div className="flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-sm text-muted-foreground animate-fade-in">
            <LoadingSpinner size="sm" />
            Применение стиля...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {STYLES.map((style) => {
          const budgetRec = getBudgetRecommendation(style)
          
          return (
            <Card
              key={style.id}
              className={cn(
                "cursor-pointer overflow-hidden border-border/70 bg-card/85 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-primary/30",
                selectedStyle === style.id ? "ring-2 ring-primary border-primary shadow-lg" : "",
                isApplyingStyle ? "opacity-50 pointer-events-none" : ""
              )}
              onClick={() => handleStyleSelect(style.id)}
            >
              <CardContent className="flex h-auto min-h-[7rem] flex-col overflow-hidden p-0 sm:h-28 sm:flex-row">
                <div
                  className="h-28 w-full bg-cover bg-center sm:h-full sm:w-1/3"
                  style={{ backgroundImage: `url(${style.image})` }}
                />
                <div className="flex-1 p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{style.name}</h4>
                      {selectedStyle === style.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {style.description}
                    </p>
                    
                    {/* Ключевые слова стиля */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {style.keywords.slice(0, 3).map((keyword) => (
                        <span 
                          key={keyword}
                          className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {/* Цветовая схема */}
                    <div className="flex gap-1 items-center">
                      <div 
                        className="w-3 h-3 rounded-full border" 
                        style={{ backgroundColor: style.color }} 
                      />
                      <div 
                        className="w-3 h-3 rounded-full border" 
                        style={{ backgroundColor: style.secondaryColor }} 
                      />
                      <span className="text-[10px] text-muted-foreground ml-1">
                        Цветовая схема
                      </span>
                    </div>
                    
                    {/* Рекомендация по бюджету */}
                    <div className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full",
                      budgetRec.type === 'success' && "bg-green-100 text-green-700",
                      budgetRec.type === 'warning' && "bg-yellow-100 text-yellow-700",
                      budgetRec.type === 'info' && "bg-blue-100 text-blue-700"
                    )}>
                      {budgetRec.message}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ИИ-рекомендации для выбранного стиля */}
      {aiRecommendations.length > 0 && (
        <Card className="mt-4 border-border/70 bg-card/90 shadow-sm animate-slide-up">
          <CardContent className="p-4">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              ИИ-рекомендации для стиля
            </h4>
            <div className="space-y-2">
              {aiRecommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="stagger-item rounded-xl border border-border/60 bg-muted/40 p-3 text-xs shadow-sm" style={{ animationDelay: `${index * 70}ms` }}>
                  <div className="font-medium">{rec.name}</div>
                  <div className="text-muted-foreground">{rec.reason}</div>
                  <div className="text-primary font-medium mt-1">
                    {rec.priceFormatted || `${rec.price?.toLocaleString('ru-RU')} ₽`}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
        <p className="text-xs text-blue-700">
          <strong>💡 Совет:</strong> Применение стиля заменит текущую мебель на базовый набор предметов, 
          подходящий под выбранный дизайн и размеры вашей комнаты. ИИ предложит дополнительные рекомендации.
        </p>
      </div>
    </div>
  )
}
