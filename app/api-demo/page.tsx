'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Динамические импорты для избежания SSR проблем
const RoomSetup = dynamic(() => import('@/components/room/room-setup'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64">Загрузка...</div>
})

const AIRecommendations = dynamic(() => import('@/components/ai/ai-recommendations'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-32">Загрузка AI...</div>
})

const BudgetOptimizer = dynamic(() => import('@/components/ai/budget-optimizer'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-32">Загрузка оптимизатора...</div>
})

const ImageGenerator = dynamic(() => import('@/components/ai/image-generator'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-32">Загрузка генератора...</div>
})

export default function ApiDemoPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-8">
        {/* Заголовок */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">API Демонстрация</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Демонстрация всех API функций приложения "Создатель Уютных Комнат"
          </p>
        </div>

        {/* Информационная карточка */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>🚀 Статус API интеграции</CardTitle>
            <CardDescription>
              Текущее состояние API функций в приложении
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✅ Готовые API</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Валидация размеров комнаты</li>
                  <li>• Сохранение/загрузка проектов</li>
                  <li>• Заглушки AI рекомендаций</li>
                  <li>• Заглушки оптимизации бюджета</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-orange-600">🔄 В разработке (Задача 9)</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• RoomGPT API интеграция</li>
                  <li>• OpenAI для анализа стилей</li>
                  <li>• Replicate для генерации изображений</li>
                  <li>• Реальный каталог мебели</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Основной контент */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Создание комнаты */}
          <div className="xl:col-span-2">
            <RoomSetup onComplete={(dimensions) => {
              console.log('Комната создана:', dimensions)
            }} />
          </div>

          {/* AI функции */}
          <div className="space-y-6">
            <AIRecommendations />
            <BudgetOptimizer />
            <ImageGenerator />
          </div>
        </div>

        {/* Техническая информация */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>🔧 Техническая информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">API Endpoints:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-mono">
                <div>POST /api/room/validate</div>
                <div>POST /api/room/save</div>
                <div>POST /api/ai/recommendations</div>
                <div>POST /api/ai/budget-optimization</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Сервисные классы:</h4>
              <div className="text-sm font-mono space-y-1">
                <div>RoomApiService - работа с комнатами</div>
                <div>AIApiService - AI функции</div>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-700 text-sm">
                <strong>Примечание:</strong> AI функции сейчас возвращают тестовые данные. 
                Реальная интеграция с RoomGPT API будет выполнена в задаче 9.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}