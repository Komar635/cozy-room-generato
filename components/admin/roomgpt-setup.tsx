'use client'

import { useState, useEffect } from 'react'
import { RoomGPTApiService } from '@/lib/services/roomgpt-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading'

export default function RoomGPTSetup() {
  const [apiStatus, setApiStatus] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)
  const checkApiStatus = async () => {
    setIsChecking(true)
    try {
      const status = await RoomGPTApiService.checkApiStatus()
      setApiStatus(status)
    } catch (error) {
      setApiStatus({
        available: false,
        status: 0,
        hasApiKey: false,
        error: 'Ошибка проверки API'
      })
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkApiStatus()
  }, [])

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏠 Настройка RoomGPT API
        </CardTitle>
        <CardDescription>
          Настройте подключение к RoomGPT API для генерации дизайна комнат
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Статус API */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Статус подключения</h4>
            <Button 
              variant="outline" 
              size="sm"
              onClick={checkApiStatus}
              disabled={isChecking}
            >
              {isChecking ? 'Проверка...' : 'Проверить'}
            </Button>
          </div>

          {isChecking && (
            <div className="mb-3 rounded-md border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <LoadingSpinner size="sm" />
                <p className="text-sm text-muted-foreground">
                  Проверяем доступность провайдеров RoomGPT и внешних AI сервисов...
                </p>
              </div>
            </div>
          )}
          
          {apiStatus && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={apiStatus.services?.replicate?.available ? 'text-green-600' : 'text-gray-400'}>
                  {apiStatus.services?.replicate?.available ? '✅' : '⚪'} Replicate API
                </span>
                {apiStatus.services?.replicate?.hasKey && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Ключ настроен
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className={apiStatus.services?.openai?.available ? 'text-green-600' : 'text-gray-400'}>
                  {apiStatus.services?.openai?.available ? '✅' : '⚪'} OpenAI API
                </span>
                {apiStatus.services?.openai?.hasKey && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Ключ настроен
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className={apiStatus.services?.huggingface?.available ? 'text-green-600' : 'text-gray-400'}>
                  {apiStatus.services?.huggingface?.available ? '✅' : '⚪'} HuggingFace API
                </span>
                {apiStatus.services?.huggingface?.hasKey && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Ключ настроен
                  </span>
                )}
              </div>
            </div>
          )}
          
          {apiStatus?.error && (
            <p className="text-sm text-red-600 mt-1">
              Ошибка: {apiStatus.error}
            </p>
          )}
        </div>

        {/* Настройки API */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="replicateToken">Replicate API Token</Label>
            <Input
              id="replicateToken"
              type="password"
              placeholder="r8_ваш_токен_здесь"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Для генерации изображений интерьера
            </p>
          </div>

          <div>
            <Label htmlFor="openaiKey">OpenAI API Key</Label>
            <Input
              id="openaiKey"
              type="password"
              placeholder="sk-ваш_ключ_здесь"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Для умных рекомендаций мебели
            </p>
          </div>

          <div>
            <Label htmlFor="huggingfaceKey">HuggingFace API Key</Label>
            <Input
              id="huggingfaceKey"
              type="password"
              placeholder="hf_ваш_токен_здесь"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Бесплатная альтернатива для AI моделей
            </p>
          </div>
        </div>

        {/* Инструкции по получению API */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            🚀 Рекомендуемая настройка (2 минуты):
          </h4>
          <div className="text-sm text-blue-800 space-y-3">
            <div>
              <p className="font-medium">1. Replicate API (лучший выбор):</p>
              <p>• https://replicate.com/ → Sign up через GitHub</p>
              <p>• Account → API tokens → Create token</p>
              <p>• Бесплатно: $10 кредитов (~500 изображений)</p>
            </div>
            
            <div>
              <p className="font-medium">2. OpenAI API (для рекомендаций):</p>
              <p>• https://platform.openai.com/api-keys</p>
              <p>• Create new secret key</p>
              <p>• Бесплатно: $5 кредитов (3 месяца)</p>
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-blue-100 rounded font-mono text-sm">
            # Добавьте в .env.local:<br/>
            REPLICATE_API_TOKEN=r8_ваш_токен<br/>
            OPENAI_API_KEY=sk-ваш_ключ
          </div>
        </div>

        {/* Предупреждение о HuggingFace */}
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-900 mb-2">
            ⚠️ Важное обновление:
          </h4>
          <p className="text-sm text-red-800">
            <strong>HuggingFace Inference API больше не работает</strong> (ошибка 410). 
            Используйте Replicate API как основной вариант для генерации изображений.
          </p>
        </div>

        {/* Альтернативные решения */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">
            🔄 Альтернативные решения:
          </h4>
          <div className="text-sm text-yellow-800 space-y-2">
            <p><strong>1. Replicate API:</strong> Используйте модели дизайна интерьера на Replicate</p>
            <p><strong>2. Hugging Face:</strong> Бесплатные модели для генерации дизайна</p>
            <p><strong>3. Локальное решение:</strong> Встроенные алгоритмы без внешних API</p>
          </div>
        </div>

        {/* Тестирование API */}
        {apiStatus?.available && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">
              ✅ API готов к использованию!
            </h4>
            <p className="text-sm text-green-800 mb-3">
              Один или несколько API подключены и готовы генерировать дизайны комнат.
            </p>
            <div className="flex gap-2">
              <Button className="flex-1">
                Перейти к созданию комнат
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open('https://replicate.com/', '_blank')}
              >
                🔗 Replicate
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
