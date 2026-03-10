'use client'

import { useRoomStore } from '@/store/room-store'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Ban, CheckCircle } from 'lucide-react'

interface BudgetWarningProps {
  className?: string
}

export default function BudgetWarning({ className = "" }: BudgetWarningProps) {
  const { getBudgetStatus, budget, spentAmount } = useRoomStore()
  
  const budgetStatus = getBudgetStatus()
  const overspend = spentAmount - budget
  
  if (budgetStatus === 'safe') {
    return null // Не показываем предупреждение если все в порядке
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  
  return (
    <div className={className}>
      {budgetStatus === 'warning' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Внимание!</strong> Превышение бюджета на {formatCurrency(overspend)}. 
            Вы находитесь в буферной зоне (до 10 000 ₽). 
            Рекомендуем найти более бюджетные альтернативы.
          </AlertDescription>
        </Alert>
      )}
      
      {budgetStatus === 'exceeded' && (
        <Alert className="border-red-200 bg-red-50">
          <Ban className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Критическое превышение!</strong> Превышение бюджета на {formatCurrency(overspend)}. 
            Добавление новых предметов заблокировано. Удалите что-то или увеличьте бюджет.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}