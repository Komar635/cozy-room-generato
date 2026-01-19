'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Динамический импорт для избежания SSR проблем
const RoomGPTSetup = dynamic(() => import('@/components/admin/roomgpt-setup'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64">Загрузка настроек...</div>
})

const ModelTester = dynamic(() => import('@/components/admin/model-tester'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-32">Загрузка тестера...</div>
})

export default function SetupPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-8">
        {/* Заголовок */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Настройка RoomGPT API</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Подключите RoomGPT API для генерации дизайна комнат с помощью искусственного интеллекта
          </p>
          
          {/* Навигация */}
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button variant="outline">
                ← Главная
              </Button>
            </Link>
            <Link href="/api-demo">
              <Button variant="outline">
                🚀 API Демо
              </Button>
            </Link>
          </div>
        </div>

        {/* Информационные карточки */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎯 Что дает RoomGPT?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>• Умная генерация дизайна комнат</p>
              <p>• Персональные рекомендации мебели</p>
              <p>• Оптимизация бюджета</p>
              <p>• Создание изображений интерьера</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⚡ Без API</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>• Базовые функции работают</p>
              <p>• Локальные рекомендации</p>
              <p>• Простые алгоритмы</p>
              <p>• Ограниченные возможности</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🚀 С RoomGPT API</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>• Полный функционал ИИ</p>
              <p>• Умные рекомендации</p>
              <p>• Генерация изображений</p>
              <p>• Профессиональный дизайн</p>
            </CardContent>
          </Card>
        </div>

        {/* Основная настройка */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <RoomGPTSetup />
          <ModelTester />
        </div>

        {/* Дополнительная информация */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>📚 Дополнительная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Поддерживаемые функции:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-green-600">✅ Готово сейчас:</h5>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Создание комнат с размерами</li>
                    <li>• 3D предпросмотр</li>
                    <li>• Валидация через API</li>
                    <li>• Сохранение проектов</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-blue-600">🔄 С RoomGPT API:</h5>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• ИИ генерация дизайна</li>
                    <li>• Умные рекомендации мебели</li>
                    <li>• Оптимизация бюджета</li>
                    <li>• Создание изображений</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">💡 Совет:</h4>
              <p className="text-sm text-blue-800">
                Приложение полностью функционально и без RoomGPT API. 
                API добавляет продвинутые ИИ функции, но базовый функционал работает из коробки.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}