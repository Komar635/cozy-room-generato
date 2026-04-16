import Link from 'next/link'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

export default function Home() {
  return (
    <main className="page-shell min-h-screen overflow-hidden bg-background">
      <div className="container mx-auto space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="animate-reveal-gradient text-center space-y-4">
          <div className="mx-auto mb-4 inline-flex animate-soft-float items-center gap-2 rounded-full border border-border/70 bg-card/75 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary animate-gentle-glow" />
            3D дизайн, AI-подсказки и бюджет в одном потоке
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">Создатель Уютных Комнат</h1>
          <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
            Создайте дизайн интерьера с 3D-визуализацией и бюджетным планированием
          </p>
          
          {/* Навигация */}
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link href="/room">
              <Button size="lg" className="transition-all-smooth hover:-translate-y-1 hover:shadow-lg">
                🏠 Создать комнату
              </Button>
            </Link>
            <Link href="/furniture-demo">
              <Button size="lg" className="bg-green-600 transition-all-smooth hover:-translate-y-1 hover:bg-green-700 hover:shadow-lg">
                🪑 Демо размещения мебели
              </Button>
            </Link>
            <Link href="/setup">
              <Button variant="outline" size="lg" className="transition-all-smooth hover:-translate-y-1 hover:shadow-md">
                ⚙️ Настройки API
              </Button>
            </Link>
            <Link href="/api-demo">
              <Button variant="outline" size="lg" className="transition-all-smooth hover:-translate-y-1 hover:shadow-md">
                🚀 Демо функций
              </Button>
            </Link>
          </div>
        </div>

        {/* Возможности */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="glass-panel card-hover card-animate border-border/70 shadow-[0_22px_55px_-38px_rgba(15,23,42,0.9)]" style={{ animationDelay: '80ms' }}>
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

          <Card className="glass-panel card-hover card-animate border-border/70 shadow-[0_22px_55px_-38px_rgba(15,23,42,0.9)]" style={{ animationDelay: '180ms' }}>
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

          <Card className="glass-panel card-hover card-animate border-border/70 shadow-[0_22px_55px_-38px_rgba(15,23,42,0.9)]" style={{ animationDelay: '280ms' }}>
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
        <Card className="glass-panel mx-auto max-w-4xl animate-slide-up border-border/70 shadow-[0_22px_55px_-38px_rgba(15,23,42,0.9)]">
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
        <Card className="glass-panel mx-auto max-w-2xl animate-slide-up border-border/70 shadow-[0_22px_55px_-38px_rgba(15,23,42,0.9)]" style={{ animationDelay: '120ms' }}>
          <CardHeader>
            <CardTitle>⚡ Быстрый старт</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/55 px-3 py-3 transition-all-smooth hover:-translate-y-0.5 hover:border-primary/30 hover:bg-background/80">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">1</span>
                <div>
                  <p className="font-medium">Создайте комнату</p>
                  <p className="text-sm text-muted-foreground">Укажите размеры и посмотрите 3D предпросмотр</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/55 px-3 py-3 transition-all-smooth hover:-translate-y-0.5 hover:border-primary/30 hover:bg-background/80">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">2</span>
                <div>
                  <p className="font-medium">Получите рекомендации</p>
                  <p className="text-sm text-muted-foreground">ИИ предложит подходящую мебель</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/55 px-3 py-3 transition-all-smooth hover:-translate-y-0.5 hover:border-primary/30 hover:bg-background/80">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">3</span>
                <div>
                  <p className="font-medium">Управляйте бюджетом</p>
                  <p className="text-sm text-muted-foreground">Оптимизируйте расходы и сохраните проект</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link href="/room">
                <Button className="w-full transition-all-smooth hover:-translate-y-1 hover:shadow-lg" size="lg">
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
