'use client'

import { useState } from 'react'
import { useRoomStore } from '@/store/room-store'
import { AIApiService } from '@/lib/services/ai-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AsyncButton, LoadingSpinner } from '@/components/ui/loading'
import { Download, Trash2, Wand2 } from 'lucide-react'

export default function ImageGenerator() {
  const { roomDimensions, selectedStyle } = useRoomStore()
  const [roomDescription, setRoomDescription] = useState('')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<any>(null)

  const generateImage = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const description = roomDescription || `Комната ${roomDimensions.width}x${roomDimensions.depth} м в стиле ${selectedStyle}`

      const result = await AIApiService.generateRoomImage({
        roomDescription: description,
        style: selectedStyle,
        dimensions: roomDimensions
      })

      if (result.success) {
        setGeneratedImage(result.imageUrl)
      } else {
        setGeneratedImage(null)
        setError(result.message || 'Не удалось сгенерировать изображение')
      }

      const status = await AIApiService.checkAIStatus()
      setApiStatus(status)
    } catch (err) {
      console.error('Ошибка генерации изображения:', err)
      setGeneratedImage(null)
      setError('Ошибка генерации изображения')
    } finally {
      setIsLoading(false)
    }
  }

  const getApiStatusBadge = () => {
    if (!apiStatus) return null

    const hasImageAPI =
      apiStatus.roomgpt?.services?.replicate?.available ||
      apiStatus.roomgpt?.services?.huggingface?.available

    if (hasImageAPI) {
      return <Badge variant="default" className="bg-green-100 text-green-800">API доступен</Badge>
    }

    return <Badge variant="destructive">API недоступен</Badge>
  }

  return (
    <Card className="w-full border-border/70 bg-card/90 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.9)] animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          ИИ генерация изображений
          {getApiStatusBadge()}
        </CardTitle>
        <CardDescription>
          Создание реалистичных изображений интерьера с помощью ИИ
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl bg-muted p-3 text-sm">
          <p><strong>Размеры:</strong> {roomDimensions.width} x {roomDimensions.depth} м</p>
          <p><strong>Стиль:</strong> {selectedStyle}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="roomDescription">Описание комнаты</Label>
          <Input
            id="roomDescription"
            value={roomDescription}
            onChange={(e) => setRoomDescription(e.target.value)}
            placeholder={`Комната ${roomDimensions.width}x${roomDimensions.depth} м в стиле ${selectedStyle}`}
          />
        </div>

        {apiStatus && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900/60 dark:bg-blue-950/40">
            <p className="font-medium text-blue-800 dark:text-blue-200">Статус API для генерации изображений:</p>
            <div className="mt-1 space-y-1">
              <p className="text-blue-700 dark:text-blue-300">
                - Replicate API: {apiStatus.roomgpt?.services?.replicate?.available ? 'доступен' : 'недоступен'}
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                - HuggingFace API: {apiStatus.roomgpt?.services?.huggingface?.available ? 'доступен' : 'недоступен'}
              </p>
            </div>
          </div>
        )}

        <AsyncButton onClick={generateImage} loading={isLoading} loadingText="Генерация изображения..." className="w-full">
          Сгенерировать изображение
        </AsyncButton>

        {isLoading && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4 animate-fade-in">
            <LoadingSpinner size="sm" />
            <div className="text-sm text-muted-foreground">
              Подготавливаем визуализацию комнаты. Это может занять до минуты.
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/30">
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>Ошибка:</strong> {error}
            </p>
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Для генерации изображений требуется настройка Replicate или HuggingFace API.
            </p>
          </div>
        )}

        {generatedImage && (
          <div className="space-y-3 animate-fade-in">
            <h4 className="font-medium">Сгенерированное изображение</h4>
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/30 shadow-sm">
              <img
                src={generatedImage}
                alt="Сгенерированный интерьер"
                className="h-auto w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <AsyncButton
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = generatedImage
                  link.download = `room-design-${Date.now()}.png`
                  link.click()
                }}
              >
                <Download className="h-4 w-4" />
                Скачать изображение
              </AsyncButton>
              <AsyncButton variant="outline" size="sm" className="justify-start" onClick={() => setGeneratedImage(null)}>
                <Trash2 className="h-4 w-4" />
                Очистить
              </AsyncButton>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Примеры описаний</h4>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <AsyncButton
              variant="ghost"
              size="sm"
              className="h-auto justify-start whitespace-normal rounded-xl p-3 text-left"
              onClick={() => setRoomDescription('Уютная спальня с большой кроватью, прикроватными тумбами и мягким освещением')}
            >
              "Уютная спальня с большой кроватью..."
            </AsyncButton>
            <AsyncButton
              variant="ghost"
              size="sm"
              className="h-auto justify-start whitespace-normal rounded-xl p-3 text-left"
              onClick={() => setRoomDescription('Современная кухня с островом, белыми шкафами и деревянными акцентами')}
            >
              "Современная кухня с островом..."
            </AsyncButton>
            <AsyncButton
              variant="ghost"
              size="sm"
              className="h-auto justify-start whitespace-normal rounded-xl p-3 text-left"
              onClick={() => setRoomDescription('Минималистичная гостиная с серым диваном, журнальным столиком и растениями')}
            >
              "Минималистичная гостиная..."
            </AsyncButton>
          </div>
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900/60 dark:bg-yellow-950/30">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Требуется API:</strong> для генерации изображений настройте ключи Replicate или HuggingFace в `.env`.
            Без них можно продолжать использовать 3D предпросмотр.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
