'use client'

import { useRoomStore } from '@/store/room-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart } from 'lucide-react'

interface BudgetStatsProps {
  className?: string
}

export default function BudgetStats({ className = "" }: BudgetStatsProps) {
  const { budget, spentAmount, furniture, getBudgetStatus } = useRoomStore()
  
  const budgetStatus = getBudgetStatus()
  const remainingBudget = budget - spentAmount
  const averageItemPrice = furniture.length > 0 ? spentAmount / furniture.length : 0
  const budgetUsagePercent = budget > 0 ? (spentAmount / budget) * 100 : 0
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  
  const stats = [
    {
      title: 'Общий бюджет',
      value: formatCurrency(budget),
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Потрачено',
      value: formatCurrency(spentAmount),
      icon: budgetStatus === 'exceeded' ? TrendingDown : TrendingUp,
      color: budgetStatus === 'safe' ? 'text-green-600' : 
             budgetStatus === 'warning' ? 'text-yellow-600' : 'text-red-600',
      bgColor: budgetStatus === 'safe' ? 'bg-green-50' : 
               budgetStatus === 'warning' ? 'bg-yellow-50' : 'bg-red-50'
    },
    {
      title: 'Остаток',
      value: formatCurrency(remainingBudget),
      icon: remainingBudget >= 0 ? TrendingUp : TrendingDown,
      color: remainingBudget >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: remainingBudget >= 0 ? 'bg-green-50' : 'bg-red-50'
    },
    {
      title: 'Предметов',
      value: furniture.length.toString(),
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]
  
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 truncate">{stat.title}</p>
                  <p className={`text-sm font-semibold ${stat.color} truncate`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}