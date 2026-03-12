import { create } from 'zustand'
import {
  RoomProject,
  RoomDimensions,
  FurnitureItem,
  FurnitureCategory,
  RoomStyle
} from '../types/room'
import { Notification, LoadingState } from '../types/api'
import { STYLE_TEMPLATES } from '../lib/data/style-templates'
import { FURNITURE_DATABASE } from '../lib/data/furniture-database'

// Состояние приложения
interface AppState {
  // Состояние проекта
  currentProject: RoomProject | null
  roomDimensions: RoomDimensions

  // Состояние мебели
  furniture: FurnitureItem[]
  selectedItem: FurnitureItem | null

  // Состояние визуализации
  wallColor: string
  floorColor: string
  ambientIntensity: number
  directionalIntensity: number

  // Состояние бюджета
  budget: number
  spentAmount: number

  // Состояние UI
  selectedCategory: FurnitureCategory
  selectedStyle: RoomStyle
  loadingState: LoadingState
  notifications: Notification[]

  // Действия для комнаты
  setRoomDimensions: (dimensions: RoomDimensions) => void
  setWallColor: (color: string) => void
  setFloorColor: (color: string) => void

  // Действия для мебели
  addFurniture: (item: FurnitureItem) => void
  removeFurniture: (itemId: string) => void
  updateFurniture: (itemId: string, updates: Partial<FurnitureItem>) => void
  selectFurniture: (item: FurnitureItem | null) => void

  // Действия для стилей
  applyStyleTemplate: (style: RoomStyle) => void

  // Действия для бюджета
  setBudget: (budget: number) => void
  calculateSpentAmount: () => void

  // Действия для UI
  setSelectedCategory: (category: FurnitureCategory) => void
  setSelectedStyle: (style: RoomStyle) => void
  setLoadingState: (state: Partial<LoadingState>) => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void

  // Действия для проектов
  saveProject: () => void
  loadProject: (project: RoomProject) => void
  createNewProject: (name: string) => void

  // Утилитарные функции
  getTotalCost: () => number
  getBudgetStatus: () => 'safe' | 'warning' | 'exceeded'
  canAddItem: (price: number) => boolean
}

export const useRoomStore = create<AppState>((set, get) => ({
  // Начальное состояние
  currentProject: null,
  roomDimensions: { width: 4, height: 3, depth: 4 },
  furniture: [],
  selectedItem: null,

  wallColor: '#ffffff',
  floorColor: '#f5f5f0',
  ambientIntensity: 0.6,
  directionalIntensity: 0.8,

  budget: 100000,
  spentAmount: 0,
  selectedCategory: FurnitureCategory.FURNITURE,
  selectedStyle: RoomStyle.MODERN,
  loadingState: { isLoading: false },
  notifications: [],

  // Действия для комнаты
  setRoomDimensions: (dimensions) => set({ roomDimensions: dimensions }),
  setWallColor: (color) => set({ wallColor: color }),
  setFloorColor: (color) => set({ floorColor: color }),

  // Действия для мебели
  addFurniture: (item) => set((state) => {
    if (!state.canAddItem(item.price)) {
      state.addNotification({
        type: 'error',
        title: 'Превышение бюджета',
        message: `Нельзя добавить "${item.name}". Превышение бюджета более чем на 10 000 ₽`
      })
      return state
    }

    const newFurniture = [...state.furniture, item]
    const newSpentAmount = newFurniture.reduce((sum, f) => sum + f.price, 0)

    const overspend = newSpentAmount - state.budget
    if (overspend > 0 && overspend <= 10000) {
      state.addNotification({
        type: 'warning',
        title: 'Предупреждение о бюджете',
        message: `Добавлен "${item.name}". Превышение бюджета на ${overspend.toLocaleString('ru-RU')} ₽`
      })
    }

    return {
      furniture: newFurniture,
      spentAmount: newSpentAmount
    }
  }),

  removeFurniture: (itemId) => set((state) => {
    const newFurniture = state.furniture.filter(item => item.id !== itemId)
    const newSpentAmount = newFurniture.reduce((sum, f) => sum + f.price, 0)

    return {
      furniture: newFurniture,
      spentAmount: newSpentAmount,
      selectedItem: state.selectedItem?.id === itemId ? null : state.selectedItem
    }
  }),

  updateFurniture: (itemId, updates) => set((state) => {
    const newFurniture = state.furniture.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    )
    const newSpentAmount = newFurniture.reduce((sum, f) => sum + f.price, 0)

    return {
      furniture: newFurniture,
      spentAmount: newSpentAmount,
      selectedItem: state.selectedItem?.id === itemId
        ? { ...state.selectedItem, ...updates }
        : state.selectedItem
    }
  }),

  selectFurniture: (item) => set({ selectedItem: item }),

  // Действия для стилей
  applyStyleTemplate: (style) => set((state) => {
    const template = STYLE_TEMPLATES[style];
    if (!template) return state;

    // Очищаем старую мебель при смене стиля (по логике шаблона)
    // В реальном приложении можно спрашивать пользователя
    const newFurniture: FurnitureItem[] = [];

    template.defaultFurniture.forEach((def, index) => {
      const baseItem = FURNITURE_DATABASE.find(f => f.id === def.id);
      if (baseItem) {
        // Рассчитываем позицию на основе размеров комнаты
        // Координаты в шаблоне от 0 до 1, где 0.5 это центр
        const pos = {
          x: (def.position.x - 0.5) * state.roomDimensions.width,
          y: def.position.y, // Высота обычно от пола
          z: (def.position.z - 0.5) * state.roomDimensions.depth
        };

        newFurniture.push({
          ...baseItem,
          id: `${baseItem.id}_tpl_${Date.now()}_${index}`,
          position: pos,
          rotation: def.rotation
        });
      }
    });

    return {
      selectedStyle: style,
      wallColor: template.wallColor,
      floorColor: template.floorColor,
      ambientIntensity: template.lighting.ambientIntensity,
      directionalIntensity: template.lighting.directionalIntensity,
      furniture: newFurniture,
      spentAmount: newFurniture.reduce((sum, f) => sum + f.price, 0)
    };
  }),

  // Действия для бюджета
  setBudget: (budget) => set({ budget }),

  calculateSpentAmount: () => set((state) => ({
    spentAmount: state.furniture.reduce((sum, item) => sum + item.price, 0)
  })),

  // Действия для UI
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedStyle: (style) => set({ selectedStyle: style }),
  setLoadingState: (newState) => set((state) => ({
    loadingState: { ...state.loadingState, ...newState }
  })),

  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }]
  })),

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  clearNotifications: () => set({ notifications: [] }),

  // Действия для проектов
  saveProject: async () => {
    const state = get()
    if (!state.currentProject) return

    const updatedProject: RoomProject = {
      ...state.currentProject,
      roomDimensions: state.roomDimensions,
      furniture: state.furniture,
      budget: state.budget,
      style: state.selectedStyle,
      updatedAt: new Date()
    }

    try {
      const { RoomApiService } = await import('../lib/services/room-api')
      const savedProject = await RoomApiService.saveProject(updatedProject)
      set({ currentProject: savedProject })
      localStorage.setItem(`project_${savedProject.id}`, JSON.stringify(savedProject))

      get().addNotification({
        type: 'success',
        title: 'Успешно',
        message: 'Проект успешно сохранен'
      })
    } catch (error) {
      console.error('Ошибка сохранения через API:', error)
      set({ currentProject: updatedProject })
      localStorage.setItem(`project_${updatedProject.id}`, JSON.stringify(updatedProject))

      get().addNotification({
        type: 'warning',
        title: 'Предупреждение',
        message: 'Проект сохранен локально (нет подключения к серверу)'
      })
    }
  },

  loadProject: (project) => set({
    currentProject: project,
    roomDimensions: project.roomDimensions,
    furniture: project.furniture,
    budget: project.budget,
    selectedStyle: project.style,
    spentAmount: project.furniture.reduce((sum, item) => sum + item.price, 0)
  }),

  createNewProject: (name) => {
    const newProject: RoomProject = {
      id: `project_${Date.now()}`,
      name,
      roomDimensions: { width: 4, height: 3, depth: 4 },
      furniture: [],
      budget: 100000,
      style: RoomStyle.MODERN,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    set({
      currentProject: newProject,
      roomDimensions: newProject.roomDimensions,
      furniture: [],
      budget: newProject.budget,
      selectedStyle: newProject.style,
      spentAmount: 0
    })
  },

  // Утилитарные функции
  getTotalCost: () => {
    const state = get()
    return state.furniture.reduce((sum, item) => sum + item.price, 0)
  },

  getBudgetStatus: () => {
    const state = get()
    const overspend = state.spentAmount - state.budget

    if (overspend <= 0) return 'safe'
    if (overspend <= 10000) return 'warning'
    return 'exceeded'
  },

  canAddItem: (price) => {
    const state = get()
    const newTotal = state.spentAmount + price
    const overspend = newTotal - state.budget

    return overspend <= 10000
  }
}))