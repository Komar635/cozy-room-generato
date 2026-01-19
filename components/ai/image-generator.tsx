'use client'

import { useState } from 'react'
import { useRoomStore } from '@/store/room-store'
import { HuggingFaceApiService } from '@/lib/services/huggingface-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ImageGenerator() {
  const { roomDimensions, selectedStyle } = useRoomStore()
  const [description, setDescription] = useState('Современная гостиная с диваном и журнальным столиком')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateImage = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      
      const result = await HuggingFaceApiService.generateRoomImage({
        roomDescription: description,
        style: selectedStyle,
        dimensions: roomDimensions
      })
      
      if (result.success) {
        setGeneratedImage(result.data.imageUrl)
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка генерации изображения')
      console.error('Ошибка генерации:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎨 Генератор изображений
        </CardTitle>
        <CardDescription>
          Создайте изображение интерьера с помощью HuggingFace Stable Diffusion
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Параметры генерации */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="description">Описание комнаты</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите желаемый интерьер..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium">Размеры:</span>
              <p className="text-muted-foreground">
                {roomDimensions.width} × {roomDimensions.depth} м
              </p>
            </div>
            <div>
              <span className="font-medium">Стиль:</span>
              <p className="text-muted-foreground capitalize">{selectedStyle}</p>
            </div>
          </div>
        </div>

        {/* Кнопка генерации */}
        <Button 
          onClick={generateImage}
          disabled={isGenerating || !description.trim()}
          className="w-full"
        >
          {isGenerating ? 'Генерация изображения...' : 'Создать изображение'}
        </Button>

        {/* Ошибка */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Результат */}
        {generatedImage && (
          <div className="space-y-3">
            <h4 className="font-medium">Сгенерированное изображение:</h4>
            <div className="border rounded-lg overflow-hidden">
              <img 
                src={generatedImage} 
                alt="Сгенерированный интерьер"
                className="w-full h-auto"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = generatedImage
                  link.download = 'room-design.png'
                  link.click()
                }}
              >
                📥 Скачать
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setGeneratedImage(null)}
              >
                🗑️ Очистить
              </Button>
            </div>
          </div>
        )}

        {/* Информация об API */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700 text-sm">
            <strong>Используется:</strong> HuggingFace Stable Diffusion v1.5<br/>
            <strong>API Endpoint:</strong> https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5
          </p>
        </div>

        {/* Примеры промптов */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">💡 Примеры описаний:</h4>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <Button 
              variant="ghost" 
              size="sm" 
              className="justify-start h-auto p-2 text-left"
              onClick={() => setDescription('Уютная спальня с большой кроватью, прикроватными тумбочками и мягким освещением')}
            >
              "Уютная спальня с большой кроватью..."
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="justify-start h-auto p-2 text-left"
              onClick={() => setDescription('Современная кухня с островом, белыми шкафами и деревянными акцентами')}
            >
              "Современная кухня с островом..."
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="justify-start h-auto p-2 text-left"
              onClick={() => setDescription('Минималистичная гостиная с серым диваном, журнальным столиком и растениями')}
            >
              "Минималистичная гостиная..."
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}