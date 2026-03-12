'use client'

import { useRoomStore } from '@/store/room-store'
import { RoomStyle } from '@/types/room'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STYLES = [
  {
    id: RoomStyle.SCANDINAVIAN,
    name: 'Скандинавский',
    description: 'Светлые тона, натуральное дерево и много света.',
    color: '#F5F5F5',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=120&fit=crop'
  },
  {
    id: RoomStyle.LOFT,
    name: 'Лофт',
    description: 'Индустриальный стиль, кирпич, металл и темные акценты.',
    color: '#4A4A4A',
    image: 'https://images.unsplash.com/photo-1505691722218-269e6353c573?w=200&h=120&fit=crop'
  },
  {
    id: RoomStyle.CLASSIC,
    name: 'Классика',
    description: 'Изысканность, симметрия и традиционные формы.',
    color: '#E3DAC9',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&h=120&fit=crop'
  },
  {
    id: RoomStyle.MODERN,
    name: 'Модерн',
    description: 'Современные формы, функциональность и лаконичность.',
    color: '#FFFFFF',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=120&fit=crop'
  },
  {
    id: RoomStyle.MINIMALIST,
    name: 'Минимализм',
    description: 'Ничего лишнего, чистое пространство и покой.',
    color: '#FAFAFA',
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=200&h=120&fit=crop'
  }
]

export default function StyleSelector() {
  const { selectedStyle, applyStyleTemplate } = useRoomStore()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Выберите стиль комнаты</h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {STYLES.map((style) => (
          <Card
            key={style.id}
            className={cn(
              "cursor-pointer transition-all hover:ring-2 hover:ring-primary/50",
              selectedStyle === style.id ? "ring-2 ring-primary border-primary" : ""
            )}
            onClick={() => applyStyleTemplate(style.id)}
          >
            <CardContent className="p-0 flex h-24 overflow-hidden">
              <div
                className="w-1/3 h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${style.image})` }}
              />
              <div className="flex-1 p-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm">{style.name}</h4>
                    {selectedStyle === style.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {style.description}
                  </p>
                </div>
                <div className="flex gap-1 mt-1">
                  <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: style.color }} />
                  <span className="text-[10px] text-muted-foreground italic">Применить шаблон</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
        <p className="text-xs text-blue-700">
          <strong>💡 Совет:</strong> Применение стиля заменит текущую мебель на базовый набор предметов, подходящий под выбранный дизайн и размеры вашей комнаты.
        </p>
      </div>
    </div>
  )
}
