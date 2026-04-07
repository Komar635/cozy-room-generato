'use client'

import { useRoomStore } from '@/store/room-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, CheckCircle, Palette, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AsyncButton } from '@/components/ui/loading'

export default function StyleAnalyzer() {
  const { 
    selectedStyle, 
    furniture, 
    analyzeStyleConsistency,
    addNotification 
  } = useRoomStore()

  const analysis = analyzeStyleConsistency()
  const { score, inconsistentItems, recommendations } = analysis

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle className="w-4 h-4 text-green-600" />
    if (score >= 0.6) return <AlertTriangle className="w-4 h-4 text-yellow-600" />
    return <AlertTriangle className="w-4 h-4 text-red-600" />
  }

  const getScoreMessage = (score: number) => {
    if (score >= 0.9) return 'Отличное соответствие стилю!'
    if (score >= 0.7) return 'Хорошее соответствие стилю'
    if (score >= 0.5) return 'Частичное соответствие стилю'
    return 'Стиль требует доработки'
  }

  const handleFixStyle = () => {
    // Применяем стиль с сохранением существующей мебели
    const { applyStyleTemplate } = useRoomStore.getState()
    applyStyleTemplate(selectedStyle, { 
      keepExistingFurniture: true, 
      priorityOnly: true 
    })
    
    addNotification({
      type: 'info',
      title: 'Стиль улучшен',
      message: 'Добавлены ключевые предметы для лучшего соответствия стилю'
    })
  }

  if (furniture.length === 0) {
    return (
      <Card className="border-border/70 bg-card/90 shadow-sm animate-fade-in">
        <CardContent className="p-4 text-center text-muted-foreground">
          <Palette className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Добавьте мебель для анализа стиля</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/70 bg-card/90 shadow-sm animate-slide-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Анализ соответствия стилю
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Общий счет */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Соответствие стилю {selectedStyle}</span>
            <div className="flex items-center gap-2">
              {getScoreIcon(score)}
              <span className={cn("text-sm font-medium", getScoreColor(score))}>
                {Math.round(score * 100)}%
              </span>
            </div>
          </div>
          
          <Progress 
            value={score * 100} 
            className="h-2"
          />
          
          <p className="text-xs text-muted-foreground">
            {getScoreMessage(score)}
          </p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-2 bg-muted rounded">
            <div className="text-lg font-semibold text-green-600">
              {furniture.length - inconsistentItems.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Соответствует стилю
            </div>
          </div>
          <div className="p-2 bg-muted rounded">
            <div className="text-lg font-semibold text-red-600">
              {inconsistentItems.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Не соответствует
            </div>
          </div>
        </div>

        {/* Несоответствующие предметы */}
        {inconsistentItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" />
              Предметы не в стиле
            </h4>
            <div className="space-y-1">
              {inconsistentItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.name}</span>
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    Не подходит
                  </Badge>
                </div>
              ))}
              {inconsistentItems.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  и еще {inconsistentItems.length - 3} предметов...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Рекомендации */}
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-600 flex items-center gap-2">
              <Lightbulb className="w-3 h-3" />
              Рекомендации
            </h4>
            <div className="space-y-1">
              {recommendations.slice(0, 2).map((rec, index) => (
                <p key={index} className="text-xs text-muted-foreground">
                  • {rec}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Кнопка улучшения стиля */}
        {score < 0.8 && (
          <AsyncButton 
            onClick={handleFixStyle}
            size="sm" 
            variant="outline" 
            className="w-full"
          >
            <Palette className="w-3 h-3 mr-2" />
            Улучшить соответствие стилю
          </AsyncButton>
        )}

        {/* Информация о стиле */}
        <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          <strong>Стиль {selectedStyle}:</strong> Анализ учитывает соответствие предметов 
          выбранному стилю интерьера. Высокий показатель означает гармоничный дизайн.
        </div>
      </CardContent>
    </Card>
  )
}
