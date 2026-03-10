'use client'

import { Box } from '@react-three/drei'
import { FurnitureItem } from '@/types/room'

interface SimpleFurnitureItemProps {
  item: FurnitureItem
  onSelect?: (item: FurnitureItem) => void
}

export function SimpleFurnitureItem({ item, onSelect }: SimpleFurnitureItemProps) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(item)
    }
  }

  return (
    <Box
      args={[item.dimensions.width, item.dimensions.height, item.dimensions.depth]}
      position={[item.position.x, item.dimensions.height / 2, item.position.z]}
      onClick={handleClick}
    >
      <meshStandardMaterial color="#4dabf7" />
    </Box>
  )
}