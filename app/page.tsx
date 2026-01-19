import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-8">
        {/* Заголовок */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold mb-4">Создатель Уютных Комнат</h1>
          <p className="text-xl text-muted-foreground">
            Создайте дизайн интерьера с 3D-визуализацией и бюджетным планированием
          </p>
          
          {/* Навигация */}
          <div className="flex gap-4 justify-center">
            <Link href="/room">
              <Button size="lg">
                🏠 Создать комнату
              </Button>
            </Link>
            <Link href="/setup">
              <Button variant="outline" size="lg">
                ⚙️ Настройки API
              </Button>
            </Link>
            <Link href="/api-demo">
              <Button variant="outline" size="lg">
                🚀 Демо функций
              </Button>
            </Link>
          </div>
        </div>

        {/* Возможности */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏠 3D Комнаты
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Создавайте комнаты с настраиваемыми размерами и смотрите результат в 3D в реальном времени
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 ИИ Рекомендации
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Получайте умные рекомендации по мебели на основе размеров комнаты, стиля и бюджета
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💰 Управление бюджетом
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Отслеживайте расходы и получайте предложения по оптимизации бюджета
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Статус */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>🚀 Статус приложения</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✅ Готово к использованию</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Создание 3D комнат</li>
                  <li>• Валидация размеров</li>
                  <li>• Локальные ИИ алгоритмы</li>
                  <li>• Сохранение проектов</li>
                  <li>• Адаптивный дизайн</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-blue-600">🔄 Дополнительно</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Внешние API (опционально)</li>
                  <li>• Генерация изображений</li>
                  <li>• Расширенный каталог мебели</li>
                  <li>• Облачное сохранение</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Быстрый старт */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>⚡ Быстрый старт</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">1</span>
                <div>
                  <p className="font-medium">Создайте комнату</p>
                  <p className="text-sm text-muted-foreground">Укажите размеры и посмотрите 3D предпросмотр</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">2</span>
                <div>
                  <p className="font-medium">Получите рекомендации</p>
                  <p className="text-sm text-muted-foreground">ИИ предложит подходящую мебель</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">3</span>
                <div>
                  <p className="font-medium">Управляйте бюджетом</p>
                  <p className="text-sm text-muted-foreground">Оптимизируйте расходы и сохраните проект</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link href="/room">
                <Button className="w-full" size="lg">
                  Начать создание комнаты →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}