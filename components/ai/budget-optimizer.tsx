'use client'

import { useState } from 'react'
import { useRoomStore } from '@/store/room-store'
import { AIApiService } from '@/lib/services/ai-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AsyncButton, LoadingSpinner } from '@/components/ui/loading'

interface BudgetOptimization {
  originalItem: any
  suggestedItem: any
  savings: number
  savingsFormatted?: string
  reason: string
}

export default function BudgetOptimizer() {
  const { furniture, budget, spentAmount, updateFurniture, removeFurniture } = useRoomStore()
  const [targetBudget, setTargetBudget] = useState(budget * 0.8) // 80% от текущего
  const [optimizations, setOptimizations] = useState<BudgetOptimization[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<any>(null)

  const optimizeBudget = async () => {
    try {
      setIsLoading(true)
      
      // Используем новый интегрированный API
      const result = await AIApiService.optimizeBudget({
        currentFurniture: furniture,
        targetBudget,
        currentBudget: spentAmount
      })
      
      if (result.needsOptimization) {
        setOptimizations(result.optimizations || [])
      } else {
        setOptimizations([])
      }

      // Проверяем статус API
      const status = await AIApiService.checkAIStatus()
      setApiStatus(status)
      
    } catch (err: any) {
      console.error('Ошибка оптимизации:', err)
      setOptimizations([])
    } finally {
      setIsLoading(false)
    }
  }

  const applyOptimization = (optimization: BudgetOptimization) => {
    // Удаляем оригинальный предмет
    removeFurniture(optimization.originalItem.id)
    
    // Добавляем предлагаемый предмет
    const suggestedFurniture = {
      ...optimization.suggestedItem,
      id: `opt_${Date.now()}`, // Новый уникальный ID
    }
    
    // Обновляем предмет в store
    updateFurniture(optimization.originalItem.id, suggestedFurniture)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(price)
  }

  const overspend = spentAmount - targetBudget
  const totalSavings = optimizations.reduce((sum, opt) => sum + opt.savings, 0)

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
        <CardTitle className="flex items-center gap-2">
          💰 ИИ Оптимизация бюджета
          {getSourceBadge()}
        </CardTitle>
        <CardDescription>
          Умная оптимизация расходов с адаптацией под российские цены
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Текущее состояние бюджета */}
        <div className="p-3 bg-muted rounded-md space-y-2">
          <div className="flex justify-between">
            <span>Потрачено:</span>
            <span className="font-medium">{formatPrice(spentAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Текущий бюджет:</span>
            <span className="font-medium">{formatPrice(budget)}</span>
          </div>
          {overspend > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Превышение:</span>
              <span className="font-medium">{formatPrice(overspend)}</span>
            </div>
          )}
        </div>

        {/* Настройка целевого бюджета */}
        <div className="space-y-2">
          <Label htmlFor="targetBudget">Целевой бюджет</Label>
          <Input
            id="targetBudget"
            type="number"
            value={targetBudget}
            onChange={(e) => setTargetBudget(Number(e.target.value))}
            min={0}
            step={1000}
          />
        </div>

        {/* Кнопка оптимизации */}
        <AsyncButton 
          onClick={optimizeBudget}
          disabled={isLoading || furniture.length === 0}
          className="w-full"
          loading={isLoading}
          loadingText="ИИ анализ бюджета..."
        >
          Оптимизировать с помощью ИИ
        </AsyncButton>

        {/* Индикатор загрузки */}
        {isLoading && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4 animate-fade-in">
            <LoadingSpinner size="sm" />
            <div className="text-sm text-muted-foreground">
              Анализируем текущую мебель и ищем варианты для экономии...
            </div>
          </div>
        )}

        {/* Результаты оптимизации */}
        {optimizations.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Предложения ИИ по экономии:</h4>
              <span className="text-green-600 font-medium">
                Экономия: {formatPrice(totalSavings)}
              </span>
            </div>
            
            {optimizations.map((opt, index) => (
              <div key={index} className="stagger-item space-y-3 rounded-xl border border-border/70 bg-card/60 p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md" style={{ animationDelay: `${index * 70}ms` }}>
                {/* Оригинальный предмет */}
                <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <div>
                    <p className="font-medium text-red-700">{opt.originalItem.name}</p>
                    <p className="text-sm text-red-600">Текущая цена</p>
                  </div>
                  <span className="font-medium text-red-700">
                    {opt.originalItem.priceFormatted || formatPrice(opt.originalItem.price)}
                  </span>
                </div>
                
                {/* Стрелка */}
                <div className="text-center text-muted-foreground">↓</div>
                
                {/* Предлагаемый предмет */}
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <div>
                    <p className="font-medium text-green-700">{opt.suggestedItem.name}</p>
                    <p className="text-sm text-green-600">ИИ рекомендация</p>
                  </div>
                  <span className="font-medium text-green-700">
                    {opt.suggestedItem.priceFormatted || formatPrice(opt.suggestedItem.price)}
                  </span>
                </div>
                
                {/* Информация об экономии */}
                <div className="p-2 bg-blue-50 rounded">
                  <p className="text-sm text-blue-700">
                    <strong>Экономия: {opt.savingsFormatted || formatPrice(opt.savings)}</strong>
                  </p>
                  <p className="text-xs text-blue-600">{opt.reason}</p>
                </div>
                
                <AsyncButton 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => applyOptimization(opt)}
                >
                  Применить замену
                </AsyncButton>
              </div>
            ))}
          </div>
        )}

        {optimizations.length === 0 && furniture.length > 0 && !isLoading && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 text-sm">
              ✅ Ваш бюджет оптимален! ИИ не нашел возможностей для дополнительной экономии.
            </p>
          </div>
        )}

        {/* Информация о технологии */}
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700 text-sm">
            <strong>🚀 Гибридный ИИ:</strong> Использует RoomGPT API для умного анализа замен, 
            с автоматическим переключением на локальные алгоритмы. Все цены в рублях.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
