'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const RoomSetup = dynamic(() => import('@/components/room/room-setup'), {
  ssr: false,
  loading: () => <div className="flex h-64 items-center justify-center">Загрузка комнаты...</div>
})

const AIRecommendations = dynamic(() => import('@/components/ai/ai-recommendations'), {
  ssr: false,
  loading: () => <div className="flex h-32 items-center justify-center">Загрузка рекомендаций...</div>
})

const BudgetOptimizer = dynamic(() => import('@/components/ai/budget-optimizer'), {
  ssr: false,
  loading: () => <div className="flex h-32 items-center justify-center">Загрузка оптимизатора...</div>
})

const ImageGenerator = dynamic(() => import('@/components/ai/image-generator'), {
  ssr: false,
  loading: () => <div className="flex h-32 items-center justify-center">Загрузка генератора...</div>
})

export default function ApiDemoPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold" data-testid="api-demo-title">Демо API и AI функций</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Здесь можно проверить ключевые API-сценарии приложения: валидацию комнаты,
            ИИ-рекомендации, оптимизацию бюджета и генерацию визуализаций.
          </p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Статус API интеграции</CardTitle>
            <CardDescription>
              Текущее состояние подключенных API и локальных fallback-механизмов.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">Готово сейчас</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>Валидация размеров комнаты</li>
                  <li>Сохранение и загрузка проектов</li>
                  <li>Локальные ИИ-рекомендации</li>
                  <li>Базовая оптимизация бюджета</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-orange-600">Доступно при внешних ключах</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>RoomGPT API интеграция</li>
                  <li>OpenAI для улучшенных рекомендаций</li>
                  <li>Replicate или HuggingFace для изображений</li>
                  <li>Расширенный каталог мебели</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <RoomSetup onComplete={(dimensions) => {
              console.log('Комната создана:', dimensions)
            }} />
          </div>

          <div className="space-y-6">
            <AIRecommendations />
            <BudgetOptimizer />
            <ImageGenerator />
          </div>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Техническая информация</CardTitle>
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
                <div>RoomApiService - работа с параметрами комнаты</div>
                <div>AIApiService - рекомендации, бюджет и визуализации</div>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-700 text-sm">
                <strong>Примечание:</strong> без внешних ключей AI-блоки используют локальные fallback-алгоритмы,
                поэтому демо остается рабочим и в тестовой среде.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
