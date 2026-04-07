'use client'

import { FurnitureItem } from '@/types/room'
import { FurnitureCard } from './furniture-card'
import { CardSkeleton } from '@/components/ui/loading'

interface FurnitureGridProps {
  items: FurnitureItem[]
  loading?: boolean
  emptyMessage?: string
  onItemSelect?: (item: FurnitureItem) => void
}

export function FurnitureGrid({
  items,
  loading = false,
  emptyMessage = 'Нет предметов для отображения',
  onItemSelect
}: FurnitureGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-gray-400 mb-2">
          <svg
            className="h-12 w-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
      {items.map((item) => (
        <div key={item.id} className="h-full min-h-[16rem] stagger-item">
          <FurnitureCard
            item={item}
            onSelect={onItemSelect}
            showAddButton={true}
            className="h-full w-full"
          />
        </div>
      ))}
    </div>
  )
}
