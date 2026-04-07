'use client'

import { useEffect, useState } from 'react'

interface WebGLInfo {
  supported: boolean
  version: string
  vendor: string
  renderer: string
  maxTextureSize: number
  error?: string
}

export default function WebGLDiagnostics() {
  const [webglInfo, setWebglInfo] = useState<WebGLInfo | null>(null)

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl =
        (canvas.getContext('webgl') as WebGLRenderingContext | null) ||
        (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)
      
      if (!gl) {
        setWebglInfo({
          supported: false,
          version: 'Не поддерживается',
          vendor: 'Неизвестно',
          renderer: 'Неизвестно',
          maxTextureSize: 0,
          error: 'WebGL не поддерживается браузером'
        })
        return
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      
      setWebglInfo({
        supported: true,
        version: gl.getParameter(gl.VERSION),
        vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE)
      })
    } catch (error) {
      setWebglInfo({
        supported: false,
        version: 'Ошибка',
        vendor: 'Ошибка',
        renderer: 'Ошибка',
        maxTextureSize: 0,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      })
    }
  }, [])

  if (!webglInfo) {
    return <div>Проверка WebGL...</div>
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-3">🔍 Диагностика WebGL</h3>
      
      <div className="space-y-2 text-sm">
        <div className={`p-2 rounded ${webglInfo.supported ? 'bg-green-100' : 'bg-red-100'}`}>
          <strong>WebGL поддержка:</strong> {webglInfo.supported ? '✅ Да' : '❌ Нет'}
        </div>
        
        <div><strong>Версия:</strong> {webglInfo.version}</div>
        <div><strong>Производитель:</strong> {webglInfo.vendor}</div>
        <div><strong>Рендерер:</strong> {webglInfo.renderer}</div>
        <div><strong>Макс. размер текстуры:</strong> {webglInfo.maxTextureSize}</div>
        
        {webglInfo.error && (
          <div className="p-2 bg-red-100 rounded">
            <strong>Ошибка:</strong> {webglInfo.error}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
        <h4 className="font-semibold mb-2">💡 Возможные решения:</h4>
        <ul className="space-y-1 text-xs">
          <li>• Обновите драйверы видеокарты</li>
          <li>• Включите аппаратное ускорение в браузере</li>
          <li>• Попробуйте другой браузер (Chrome, Firefox, Edge)</li>
          <li>• Перезагрузите браузер</li>
          <li>• Отключите расширения браузера</li>
        </ul>
      </div>
    </div>
  )
}
