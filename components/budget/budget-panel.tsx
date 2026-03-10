'use client'

import { useState, useEffect } from 'react'
import { useRoomStore } from '@/store/room-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

interface BudgetPanelProps {
  className?: string
}

export default function BudgetPanel({ className = "" }: BudgetPanelProps) {
  const { 
    budget, 
    spentAmount, 
    setBudget, 
    getBudgetStatus, 
    getTotalCost,
    furniture 
  } = useRoomStore()
  
  const [budgetInput, setBudgetInput] = useState(budget.toString())
  const [isEditing, setIsEditing] = useState(false)
  
  const budgetStatus = getBudgetStatus()
  const remainingBudget = budget - spentAmount
  const budgetUsagePercent = budget > 0 ? (spentAmount / budget) * 100 : 0
  
  // Обновляем локальное состояние при изменении бюджета в store
  useEffect(() => {
    setBudgetInput(budget.toString())
  }, [budget])
  
  const handleBudgetSave = () => {
    const newBudget = parseInt(budgetInput.replace(/\s/g, ''))
    if (!isNaN(newBudget) && newBudget > 0) {
      setBudget(newBudget)
      setIsEditing(false)
    }
  }
  
  const handleBudgetCancel = () => {
    setBudgetInput(budget.toString())
    setIsEditing(false)
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  
  const getStatusColor = () => {
    switch (budgetStatus) {
      case 'safe': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'exceeded': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }
  
  const getStatusIcon = () => {
    switch (budgetStatus) {
      case 'safe': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'exceeded': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }
  
  const getStatusMessage = () => {
    switch (budgetStatus) {
      case 'safe': 
        return 'Бюджет в норме'
      case 'warning': 
        return `Превышение на ${formatCurrency(Math.abs(remainingBudget))} (в пределах буферной зоны)`
      case 'exceeded': 
        return `Критическое превышение на ${formatCurrency(Math.abs(remainingBudget))}`
      default: 
        return 'Статус бюджета'
    }
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Управление бюджетом
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Установка бюджета */}
        <div className="space-y-2">
          <Label htmlFor="budget">Общий бюджет</Label>
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                id="budget"
                type="text"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="Введите бюджет в рублях"
                className="flex-1"
              />
              <Button size="sm" onClick={handleBudgetSave}>
                ✓
              </Button>
              <Button size="sm" variant="outline" onClick={handleBudgetCancel}>
                ✕
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">
                {formatCurrency(budget)}
              </span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsEditing(true)}
              >
                Изменить
              </Button>
            </div>
          )}
        </div>
        
        {/* Статус бюджета */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Потрачено</span>
            <span className="text-sm font-semibold">
              {formatCurrency(spentAmount)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Остаток</span>
            <span className={`text-sm font-semibold ${getStatusColor()}`}>
              {formatCurrency(remainingBudget)}
            </span>
          </div>
          
          {/* Прогресс-бар */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                budgetStatus === 'safe' ? 'bg-green-500' :
                budgetStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
            />
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            Использовано {budgetUsagePercent.toFixed(1)}% от бюджета
          </div>
        </div>
        
        {/* Статус и предупреждения */}
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          budgetStatus === 'safe' ? 'bg-green-50 border border-green-200' :
          budgetStatus === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-red-50 border border-red-200'
        }`}>
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusMessage()}
          </span>
        </div>
        
        {/* Информация о предметах */}
        {furniture.length > 0 && (
          <div className="space-y-2">
            <Label>Предметы в комнате ({furniture.length})</Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {furniture.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="truncate flex-1">{item.name}</span>
                  <span className="font-medium ml-2">
                    {formatCurrency(item.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Предупреждения и рекомендации */}
        {budgetStatus === 'warning' && (
          <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
            💡 Рекомендуем найти более бюджетные альтернативы для некоторых предметов
          </div>
        )}
        
        {budgetStatus === 'exceeded' && (
          <div className="text-xs text-red-700 bg-red-50 p-2 rounded">
            ⚠️ Добавление новых предметов заблокировано. Удалите что-то или увеличьте бюджет
          </div>
        )}
      </CardContent>
    </Card>
  )
}