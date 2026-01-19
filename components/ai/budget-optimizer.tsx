'use client'

import { useState } from 'react'
import { useRoomStore } from '@/store/room-store'
import { LocalAIService } from '@/lib/services/local-ai'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BudgetOptimization {
  originalItem: any
  suggestedItem: any
  savings: number
  reason: string
}

export default function BudgetOptimizer() {
  const { furniture, budget, spentAmount } = useRoomStore()
  const [targetBudget, setTargetBudget] = useState(budget * 0.8) // 80% от текущего
  const [optimizations, setOptimizations] = useState<BudgetOptimization[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const optimizeBudget = async () => {
    try {
      setIsLoading(true)
      
      // Используем ТОЛЬКО локальный ИИ
      const result = LocalAIService.optimizeBudget({
        currentFurniture: furniture,
        targetBudget,
        currentBudget: spentAmount
      })
      
      if (result.success && result.data.needsOptimization) {
        setOptimizations(result.data.optimizations || [])
      } else {
        setOptimizations([])
      }
    } catch (err: any) {
      console.error('Ошибка оптимизации:', err)
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

  const overspend = spentAmount - targetBudget
  const totalSavings = optimizations.reduce((sum, opt) => sum + opt.savings, 0)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💰 Локальная оптимизация бюджета
        </CardTitle>
        <CardDescription>
          Умная оптимизация расходов с помощью встроенных алгоритмов
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
        <Button 
          onClick={optimizeBudget}
          disabled={isLoading || furniture.length === 0}
          className="w-full"
        >
          {isLoading ? 'Анализ бюджета...' : 'Оптимизировать бюджет'}
        </Button>

        {/* Результаты оптимизации */}
        {optimizations.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Предложения по экономии:</h4>
              <span className="text-green-600 font-medium">
                Экономия: {formatPrice(totalSavings)}
              </span>
            </div>
            
            {optimizations.map((opt, index) => (
              <div key={index} className="p-3 border rounded-md space-y-3">
                {/* Оригинальный предмет */}
                <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <div>
                    <p className="font-medium text-red-700">{opt.originalItem.name}</p>
                    <p className="text-sm text-red-600">Текущая цена</p>
                  </div>
                  <span className="font-medium text-red-700">
                    {formatPrice(opt.originalItem.price)}
                  </span>
                </div>
                
                {/* Стрелка */}
                <div className="text-center text-muted-foreground">↓</div>
                
                {/* Предлагаемый предмет */}
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <div>
                    <p className="font-medium text-green-700">{opt.suggestedItem.name}</p>
                    <p className="text-sm text-green-600">Рекомендуемая замена</p>
                  </div>
                  <span className="font-medium text-green-700">
                    {formatPrice(opt.suggestedItem.price)}
                  </span>
                </div>
                
                {/* Информация об экономии */}
                <div className="p-2 bg-blue-50 rounded">
                  <p className="text-sm text-blue-700">
                    <strong>Экономия: {formatPrice(opt.savings)}</strong>
                  </p>
                  <p className="text-xs text-blue-600">{opt.reason}</p>
                </div>
                
                <Button size="sm" variant="outline" className="w-full">
                  Применить замену
                </Button>
              </div>
            ))}
          </div>
        )}

        {optimizations.length === 0 && furniture.length > 0 && !isLoading && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 text-sm">
              ✅ Ваш бюджет оптимален! Дополнительная экономия не требуется.
            </p>
          </div>
        )}

        {/* Информация о локальном алгоритме */}
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700 text-sm">
            <strong>✅ Работает без API:</strong> Использует математические алгоритмы для поиска оптимальных замен. 
            Никаких внешних сервисов не требуется!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}