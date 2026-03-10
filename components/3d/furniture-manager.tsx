'use client'

import { FurnitureItem3D } from './furniture-item'
import { useRoomStore } from '@/store/room-store'
import { FurnitureItem, Vector3 } from '@/types/room'

interface FurnitureManagerProps {
  onItemSelect?: (item: FurnitureItem | null) => void
  onItemMove?: (itemId: string, position: Vector3) => void
  onItemRotate?: (itemId: string, rotation: Vector3) => void
  onItemScale?: (itemId: string, scale: number) => void
}

export function FurnitureManager({
  onItemSelect,
  onItemMove,
  onItemRotate,
  onItemScale
}: FurnitureManagerProps) {
  const { furniture } = useRoomStore()

  return (
    <group>
      {furniture.map((item) => (
        <FurnitureItem3D
          key={item.id}
          item={item}
          onSelect={onItemSelect}
          onMove={onItemMove}
          onRotate={onItemRotate}
          onScale={onItemScale}
        />
      ))}
    </group>
  )
}