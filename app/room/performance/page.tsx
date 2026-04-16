import { Suspense } from 'react'
import RoomPerformanceLab from '@/components/room/room-performance-lab'

export default function RoomPerformancePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading 3D performance lab...</div>}>
      <RoomPerformanceLab />
    </Suspense>
  )
}
