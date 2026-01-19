'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ModelStatus {
  name: string
  endpoint: string
  status: 'checking' | 'available' | 'unavailable' | 'error'
  error?: string
}

export default function ModelTester() {
  const [models, setModels] = useState<ModelStatus[]>([
    {
      name: 'CompVis/stable-diffusion-v1-4',
      endpoint: 'https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4',
      status: 'checking'
    },
    {
      name: 'stabilityai/stable-diffusion-2-1',
      endpoint: 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
      status: 'checking'
    },
    {
      name: 'dreamlike-art/dreamlike-diffusion-1.0',
      endpoint: 'https://api-inference.huggingface.co/models/dreamlike-art/dreamlike-diffusion-1.0',
      status: 'checking'
    },
    {
      name: 'Lykon/DreamShaper',
      endpoint: 'https://api-inference.huggingface.co/models/Lykon/DreamShaper',
      status: 'checking'
    }
  ])

  const testModel = async (model: ModelStatus, index: number) => {
    const apiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || 'hf_test'
    
    try {
      setModels(prev => prev.map((m, i) => 
        i === index ? { ...m, status: 'checking' } : m
      ))

      const response = await fetch(model.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: "test room interior",
          parameters: {
            num_inference_steps: 1
          }
        }),
      })

      const newStatus: ModelStatus['status'] = 
        response.status === 200 ? 'available' :
        response.status === 401 || response.status === 403 ? 'unavailable' :
        'error'

      setModels(prev => prev.map((m, i) => 
        i === index ? { 
          ...m, 
          status: newStatus,
          error: newStatus === 'error' ? `HTTP ${response.status}` : undefined
        } : m
      ))
    } catch (error) {
      setModels(prev => prev.map((m, i) => 
        i === index ? { 
          ...m, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Network error'
        } : m
      ))
    }
  }

  const testAllModels = () => {
    models.forEach((model, index) => {
      testModel(model, index)
    })
  }

  const getStatusIcon = (status: ModelStatus['status']) => {
    switch (status) {
      case 'checking': return '🔄'
      case 'available': return '✅'
      case 'unavailable': return '🔒'
      case 'error': return '❌'
      default: return '⚪'
    }
  }

  const getStatusColor = (status: ModelStatus['status']) => {
    switch (status) {
      case 'available': return 'text-green-600'
      case 'unavailable': return 'text-orange-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>🧪 Тестер HuggingFace моделей</CardTitle>
        <CardDescription>
          Проверьте доступность моделей Stable Diffusion на HuggingFace
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button onClick={testAllModels} className="w-full">
          Проверить все модели
        </Button>

        <div className="space-y-3">
          {models.map((model, index) => (
            <div key={model.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getStatusIcon(model.status)}</span>
                  <span className="font-medium">{model.name}</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {model.endpoint}
                </p>
                {model.error && (
                  <p className="text-xs text-red-600 mt-1">
                    Ошибка: {model.error}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-sm ${getStatusColor(model.status)}`}>
                  {model.status === 'checking' && 'Проверка...'}
                  {model.status === 'available' && 'Доступна'}
                  {model.status === 'unavailable' && 'Нет доступа'}
                  {model.status === 'error' && 'Ошибка'}
                </span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => testModel(model, index)}
                  disabled={model.status === 'checking'}
                >
                  Тест
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-medium text-blue-900 mb-2">💡 Как интерпретировать результаты:</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>✅ Доступна:</strong> Модель работает и готова к использованию</p>
            <p><strong>🔒 Нет доступа:</strong> Нужен API ключ HuggingFace</p>
            <p><strong>❌ Ошибка:</strong> Модель недоступна или перемещена</p>
          </div>
        </div>

        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            <strong>Примечание:</strong> Для полного тестирования добавьте HUGGINGFACE_API_KEY в .env.local
          </p>
        </div>
      </CardContent>
    </Card>
  )
}