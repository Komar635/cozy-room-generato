import { useRoomStore } from '@/store/room-store'
import { FurnitureCategory, FurnitureItem, RoomStyle } from '@/types/room'

const createFurnitureItem = (overrides: Partial<FurnitureItem> = {}): FurnitureItem => ({
  id: overrides.id || 'item-1',
  name: overrides.name || 'Test sofa',
  category: overrides.category || FurnitureCategory.FURNITURE,
  price: overrides.price ?? 30000,
  dimensions: overrides.dimensions || { width: 2, height: 1, depth: 1 },
  position: overrides.position || { x: 0, y: 0, z: 0 },
  rotation: overrides.rotation || { x: 0, y: 0, z: 0 },
  modelUrl: overrides.modelUrl || '/models/test.glb',
  thumbnailUrl: overrides.thumbnailUrl || '/images/test.jpg',
  style: overrides.style || [RoomStyle.MODERN],
  color: overrides.color || 'gray'
})

const resetStore = () => {
  useRoomStore.setState({
    currentProject: null,
    roomDimensions: { width: 4, height: 3, depth: 4 },
    furniture: [],
    selectedItem: null,
    wallColor: '#ffffff',
    floorColor: '#f5f5f0',
    accentColor: '#4169E1',
    ambientIntensity: 0.6,
    directionalIntensity: 0.8,
    lightWarmth: 0.5,
    budget: 100000,
    spentAmount: 0,
    selectedCategory: FurnitureCategory.FURNITURE,
    selectedStyle: RoomStyle.MODERN,
    loadingState: { isLoading: false },
    notifications: [],
    history: { past: [], future: [] },
    performanceLevel: 'high',
    isPreloadingComplete: false
  })
}

describe('room store budget logic', () => {
  beforeEach(() => {
    resetStore()
  })

  test('adds furniture inside budget and updates totals', () => {
    const item = createFurnitureItem({ price: 25000 })

    useRoomStore.getState().setBudget(50000)
    useRoomStore.getState().addFurniture(item)

    const state = useRoomStore.getState()
    expect(state.furniture).toHaveLength(1)
    expect(state.spentAmount).toBe(25000)
    expect(state.getTotalCost()).toBe(25000)
    expect(state.getBudgetStatus()).toBe('safe')
    expect(state.canAddItem(25000)).toBe(true)
  })

  test('allows overspend inside buffer zone and shows warning', () => {
    const item = createFurnitureItem({ id: 'buffer-item', price: 55000 })

    useRoomStore.getState().setBudget(50000)
    useRoomStore.getState().addFurniture(item)

    const state = useRoomStore.getState()
    expect(state.furniture).toHaveLength(1)
    expect(state.spentAmount).toBe(55000)
    expect(state.getBudgetStatus()).toBe('warning')
    expect(state.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'warning',
          title: 'Предупреждение о бюджете'
        })
      ])
    )
  })

  test('blocks furniture when overspend exceeds buffer zone', () => {
    const item = createFurnitureItem({ id: 'blocked-item', price: 70000 })

    useRoomStore.getState().setBudget(50000)
    useRoomStore.getState().addFurniture(item)

    const state = useRoomStore.getState()
    expect(state.furniture).toHaveLength(0)
    expect(state.spentAmount).toBe(0)
    expect(state.getBudgetStatus()).toBe('safe')
    expect(state.canAddItem(70000)).toBe(false)
  })

  test('copies furniture with offset and updates spent amount', () => {
    const item = createFurnitureItem({
      id: 'copy-source',
      price: 20000,
      position: { x: 1, y: 0, z: 1 }
    })

    useRoomStore.getState().setBudget(50000)
    useRoomStore.getState().addFurniture(item)
    useRoomStore.getState().copyFurniture(item.id)

    const state = useRoomStore.getState()
    expect(state.furniture).toHaveLength(2)
    expect(state.spentAmount).toBe(40000)
    expect(state.selectedItem).toEqual(
      expect.objectContaining({
        id: expect.stringContaining('copy-source_copy_'),
        position: { x: 1.3, y: 0, z: 1.3 }
      })
    )
  })
})
