'use client'

import RoomCanvas from './room-canvas'
import { FurnitureItem, Vector3 } from '@/types/room'

interface SceneProps {
  onItemSelect?: (item: FurnitureItem | null) => void
  onItemMove?: (itemId: string, position: Vector3) => void
  className?: string
}

export default function Scene({ 
  onItemSelect, 
  onItemMove, 
  className = "w-full h-full min-h-[400px]" 
}: SceneProps) {
  return (
    <div className={className} style={{ minHeight: '400px' }}>
      <RoomCanvas 
        onItemSelect={onItemSelect}
        onItemMove={onItemMove}
        className="w-full h-full"
      />
    </div>
  )
}