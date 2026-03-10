import { create } from 'zustand'
import { 
  RoomProject, 
  RoomDimensions, 
  FurnitureItem, 
  FurnitureCategory, 
  RoomStyle 
} from '../types/room'
import { Notification, LoadingState } from '../types/api'

// Состояние приложения
interface AppState {
  // Состояние проекта
  currentProject: RoomProject | null
  roomDimensions: RoomDimensions
  
  // Состояние мебели
  furniture: FurnitureItem[]
  selectedItem: FurnitureItem | null
  
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
  
  // Действия для мебели
  addFurniture: (item: FurnitureItem) => void
  removeFurniture: (itemId: string) => void
  updateFurniture: (itemId: string, updates: Partial<FurnitureItem>) => void
  selectFurniture: (item: FurnitureItem | null) => void
  
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
  budget: 100000, // 100к рублей по умолчанию
  spentAmount: 0,
  selectedCategory: FurnitureCategory.FURNITURE,
  selectedStyle: RoomStyle.MODERN,
  loadingState: { isLoading: false },
  notifications: [],
  
  // Действия для комнаты
  setRoomDimensions: (dimensions) => set({ roomDimensions: dimensions }),
  
  // Действия для мебели
  addFurniture: (item) => set((state) => {
    // Проверяем, можно ли добавить предмет
    if (!state.canAddItem(item.price)) {
      // Добавляем уведомление о блокировке
      state.addNotification({
        type: 'error',
        title: 'Превышение бюджета',
        message: `Нельзя добавить "${item.name}". Превышение бюджета более чем на 10 000 ₽`
      })
      return state // Не добавляем предмет
    }
    
    const newFurniture = [...state.furniture, item]
    const newSpentAmount = newFurniture.reduce((sum, f) => sum + f.price, 0)
    
    // Проверяем статус бюджета после добавления
    const overspend = newSpentAmount - state.budget
    if (overspend > 0 && overspend <= 10000) {
      // Предупреждение о входе в буферную зону
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
      // Попытка сохранения через API
      const { RoomApiService } = await import('../lib/services/room-api')
      const savedProject = await RoomApiService.saveProject(updatedProject)
      set({ currentProject: savedProject })
      
      // Дублирование в localStorage как резерв
      localStorage.setItem(`project_${savedProject.id}`, JSON.stringify(savedProject))
      
      // Уведомление об успешном сохранении
      get().addNotification({
        type: 'success',
        title: 'Успешно',
        message: 'Проект успешно сохранен'
      })
    } catch (error) {
      console.error('Ошибка сохранения через API:', error)
      
      // Fallback: сохранение только в localStorage
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
    if (overspend <= 10000) return 'warning' // Буферная зона 1-10к рублей
    return 'exceeded'
  },
  
  canAddItem: (price) => {
    const state = get()
    const newTotal = state.spentAmount + price
    const overspend = newTotal - state.budget
    
    return overspend <= 10000 // Можно добавить если не превышает буферную зону
  }
}))