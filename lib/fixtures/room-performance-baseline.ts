import { FURNITURE_DATABASE } from '@/lib/data/furniture-database'
import { RoomProject, RoomStyle } from '@/types/room'

const getFixtureItem = (id: string, position: { x: number; y: number; z: number }, rotationY = 0) => {
  const item = FURNITURE_DATABASE.find((candidate) => candidate.id === id)

  if (!item) {
    throw new Error(`Performance fixture item not found: ${id}`)
  }

  return {
    ...item,
    id: `${item.id}-perf-${position.x}-${position.z}`,
    position,
    rotation: {
      ...item.rotation,
      y: rotationY
    }
  }
}

export const createRoomPerformanceBaselineProject = (): RoomProject => ({
  id: 'project_3d_performance_baseline',
  name: '3D Performance Baseline',
  roomDimensions: { width: 6, height: 3, depth: 5 },
  furniture: [
    getFixtureItem('sofa-scandinavian-1', { x: 0.6, y: 0, z: 0.6 }, Math.PI / 2),
    getFixtureItem('coffee-table-modern-1', { x: 2.3, y: 0, z: 1.4 }, 0),
    getFixtureItem('armchair-classic-1', { x: 3.7, y: 0, z: 0.8 }, -Math.PI / 3),
    getFixtureItem('bookshelf-loft-1', { x: 4.7, y: 0, z: 0.4 }, 0),
    getFixtureItem('dining-table-classic-1', { x: 1.3, y: 0, z: 3.1 }, 0),
    getFixtureItem('rug-scandinavian-1', { x: 2.1, y: 0, z: 1.1 }, 0),
    getFixtureItem('painting-abstract-1', { x: 5.1, y: 1.2, z: 2.2 }, Math.PI / 2),
    getFixtureItem('floor-lamp-loft-1', { x: 4.9, y: 0, z: 3.7 }, 0),
    getFixtureItem('plant-monstera-1', { x: 0.5, y: 0, z: 3.7 }, 0),
    getFixtureItem('tv-modern-55-1', { x: 5.1, y: 0, z: 1.5 }, Math.PI / 2)
  ],
  budget: 300000,
  style: RoomStyle.MODERN,
  createdAt: new Date('2026-04-16T00:00:00.000Z'),
  updatedAt: new Date('2026-04-16T00:00:00.000Z'),
  wallColor: '#f4efe7',
  floorColor: '#ddd0c2',
  accentColor: '#6e4b3a',
  ambientIntensity: 0.65,
  directionalIntensity: 0.85,
  lightWarmth: 0.55
})
