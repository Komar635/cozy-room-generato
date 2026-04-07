import { create } from 'zustand'
import {
  RoomProject,
  RoomDimensions,
  FurnitureItem,
  FurnitureCategory,
  RoomStyle
} from '../types/room'
import { Notification, LoadingState } from '../types/api'
import { STYLE_TEMPLATES, StyleUtils } from '../lib/data/style-templates'
import { FURNITURE_DATABASE } from '../lib/data/furniture-database'
import { furniturePreloader, getDevicePerformanceLevel } from '../lib/three-utils'

type HistoryAction = 
  | { type: 'ADD'; item: FurnitureItem }
  | { type: 'REMOVE'; item: FurnitureItem }
  | { type: 'UPDATE'; itemId: string; before: FurnitureItem; after: FurnitureItem }

interface HistoryState {
  past: FurnitureItem[][]
  future: FurnitureItem[][]
}

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
  accentColor: string
  ambientIntensity: number
  directionalIntensity: number
  lightWarmth: number

  // Состояние бюджета
  budget: number
  spentAmount: number

  // Состояние UI
  selectedCategory: FurnitureCategory
  selectedStyle: RoomStyle
  loadingState: LoadingState
  notifications: Notification[]

  // История для Undo/Redo
  history: HistoryState

  // Действия для истории
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  pushToHistory: (action?: HistoryAction) => void
  clearHistory: () => void

  // Оптимизация производительности
  performanceLevel: 'low' | 'medium' | 'high'
  isPreloadingComplete: boolean

  // Действия для комнаты
  setRoomDimensions: (dimensions: RoomDimensions) => void
  setWallColor: (color: string) => void
  setFloorColor: (color: string) => void
  setAccentColor: (color: string) => void

  // Действия для мебели
  addFurniture: (item: FurnitureItem) => void
  removeFurniture: (itemId: string) => void
  updateFurniture: (itemId: string, updates: Partial<FurnitureItem>) => void
  selectFurniture: (item: FurnitureItem | null) => void
  copyFurniture: (itemId: string) => void

  // Действия для стилей
  applyStyleTemplate: (style: RoomStyle, options?: { keepExistingFurniture?: boolean; priorityOnly?: boolean }) => void
  analyzeStyleConsistency: () => { score: number; inconsistentItems: FurnitureItem[]; recommendations: string[] }

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
  getStyleRecommendations: () => { min: number; optimal: number }

  // Оптимизация производительности
  initPerformanceOptimization: () => void
  preloadPopularFurniture: () => Promise<void>
}

export const useRoomStore = create<AppState>((set, get) => ({
  // Начальное состояние
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

  // Оптимизация производительности
  performanceLevel: 'high',
  isPreloadingComplete: false,

  // Действия для комнаты
  setRoomDimensions: (dimensions) => set({ roomDimensions: dimensions }),
  setWallColor: (color) => set({ wallColor: color }),
  setFloorColor: (color) => set({ floorColor: color }),
  setAccentColor: (color) => set({ accentColor: color }),

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
      spentAmount: newSpentAmount,
      history: {
        past: [...state.history.past, [...state.furniture]].slice(-50),
        future: []
      }
    }
  }),

  removeFurniture: (itemId) => set((state) => {
    const removedItem = state.furniture.find(item => item.id === itemId)
    if (!removedItem) return state

    const newFurniture = state.furniture.filter(item => item.id !== itemId)
    const newSpentAmount = newFurniture.reduce((sum, f) => sum + f.price, 0)

    return {
      furniture: newFurniture,
      spentAmount: newSpentAmount,
      selectedItem: state.selectedItem?.id === itemId ? null : state.selectedItem,
      history: {
        past: [...state.history.past, [...state.furniture]].slice(-50),
        future: []
      }
    }
  }),

  updateFurniture: (itemId, updates) => set((state) => {
    const oldItem = state.furniture.find(item => item.id === itemId)
    if (!oldItem) return state

    const newFurniture = state.furniture.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    )
    const newSpentAmount = newFurniture.reduce((sum, f) => sum + f.price, 0)

    return {
      furniture: newFurniture,
      spentAmount: newSpentAmount,
      selectedItem: state.selectedItem?.id === itemId
        ? { ...state.selectedItem, ...updates }
        : state.selectedItem,
      history: {
        past: [...state.history.past, [...state.furniture]].slice(-50),
        future: []
      }
    }
  }),

  selectFurniture: (item) => set({ selectedItem: item }),

  copyFurniture: (itemId) => set((state) => {
    const itemToCopy = state.furniture.find(item => item.id === itemId)
    if (!itemToCopy) return state

    if (!state.canAddItem(itemToCopy.price)) {
      state.addNotification({
        type: 'error',
        title: 'Превышение бюджета',
        message: `Нельзя скопировать "${itemToCopy.name}". Превышение бюджета более чем на 10 000 ₽`
      })
      return state
    }

    const copiedItem: FurnitureItem = {
      ...itemToCopy,
      id: `${itemToCopy.id}_copy_${Date.now()}`,
      position: {
        x: itemToCopy.position.x + 0.3,
        y: itemToCopy.position.y,
        z: itemToCopy.position.z + 0.3
      }
    }

    const newFurniture = [...state.furniture, copiedItem]
    const newSpentAmount = newFurniture.reduce((sum, f) => sum + f.price, 0)

    return {
      furniture: newFurniture,
      spentAmount: newSpentAmount,
      selectedItem: copiedItem,
      history: {
        past: [...state.history.past, [...state.furniture]].slice(-50),
        future: []
      }
    }
  }),

  // Действия для стилей
  applyStyleTemplate: (style, options = {}) => set((state) => {
    const template = STYLE_TEMPLATES[style];
    if (!template) return state;

    const { keepExistingFurniture = false, priorityOnly = false } = options;

    let newFurniture: FurnitureItem[] = keepExistingFurniture ? [...state.furniture] : [];

    // Определяем какую мебель добавлять
    const furnitureToAdd = priorityOnly 
      ? StyleUtils.getPriorityFurniture(style, 3)
      : template.defaultFurniture;

    furnitureToAdd.forEach((def, index) => {
      const baseItem = FURNITURE_DATABASE.find(f => f.id === def.id);
      if (baseItem) {
        // Рассчитываем позицию на основе размеров комнаты
        const pos = {
          x: (def.position.x - 0.5) * state.roomDimensions.width,
          y: def.position.y,
          z: (def.position.z - 0.5) * state.roomDimensions.depth
        };

        // Проверяем, не превысим ли бюджет
        const currentCost = newFurniture.reduce((sum, f) => sum + f.price, 0);
        if (currentCost + baseItem.price <= state.budget + 10000) { // Учитываем буферную зону
          newFurniture.push({
            ...baseItem,
            id: `${baseItem.id}_tpl_${Date.now()}_${index}`,
            position: pos,
            rotation: def.rotation,
            style: [style] // Помечаем как соответствующий стилю
          });
        }
      }
    });

return {
      selectedStyle: style,
      wallColor: template.wallColor,
      floorColor: template.floorColor,
      accentColor: template.accentColor,
      ambientIntensity: template.lighting.ambientIntensity,
      directionalIntensity: template.lighting.directionalIntensity,
      lightWarmth: template.lighting.warmth,
      furniture: newFurniture,
      spentAmount: newFurniture.reduce((sum, f) => sum + f.price, 0),
      history: {
        past: [...state.history.past, [...state.furniture]].slice(-50),
        future: []
      }
    };
  }),

  analyzeStyleConsistency: () => {
    const state = get();
    const { selectedStyle, furniture } = state;
    
    const inconsistentItems = furniture.filter(item => {
      if (item.style && Array.isArray(item.style)) {
        return !item.style.includes(selectedStyle);
      }
      return false;
    });

    const score = furniture.length > 0 
      ? (furniture.length - inconsistentItems.length) / furniture.length 
      : 1;

    const recommendations = inconsistentItems.map(item => 
      `Замените "${item.name}" на предмет в стиле ${selectedStyle}`
    );

    return { score, inconsistentItems, recommendations };
  },

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

    const baseProject: RoomProject = state.currentProject || {
      id: `project_${Date.now()}`,
      name: 'Мой проект',
      roomDimensions: state.roomDimensions,
      furniture: state.furniture,
      budget: state.budget,
      style: state.selectedStyle,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const updatedProject: RoomProject = {
      ...baseProject,
      roomDimensions: state.roomDimensions,
      furniture: state.furniture,
      budget: state.budget,
      style: state.selectedStyle,
      updatedAt: new Date()
    }

    try {
      set((current) => ({
        loadingState: {
          ...current.loadingState,
          isLoading: true,
          message: 'Сохраняем проект...'
        }
      }))

      const { RoomApiService } = await import('../lib/services/room-api')
      const savedProject = await RoomApiService.saveProject(updatedProject)
      set((current) => ({
        currentProject: savedProject,
        loadingState: {
          ...current.loadingState,
          isLoading: false,
          message: undefined
        }
      }))
      localStorage.setItem(`project_${savedProject.id}`, JSON.stringify(savedProject))

      get().addNotification({
        type: 'success',
        title: 'Успешно',
        message: 'Проект успешно сохранен'
      })
    } catch (error) {
      console.error('Ошибка сохранения через API:', error)
      set((current) => ({
        currentProject: updatedProject,
        loadingState: {
          ...current.loadingState,
          isLoading: false,
          message: undefined
        }
      }))
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
    spentAmount: project.furniture.reduce((sum, item) => sum + item.price, 0),
    wallColor: project.wallColor || '#ffffff',
    floorColor: project.floorColor || '#f5f5f0',
    accentColor: project.accentColor || '#4169E1',
    ambientIntensity: project.ambientIntensity ?? 0.6,
    directionalIntensity: project.directionalIntensity ?? 0.8,
    lightWarmth: project.lightWarmth ?? 0.5
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
      spentAmount: 0,
      history: { past: [], future: [] }
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
  },

  getStyleRecommendations: () => {
    const state = get()
    const area = state.roomDimensions.width * state.roomDimensions.depth
    return StyleUtils.getRecommendedBudget(state.selectedStyle, area)
  },

  // Оптимизация производительности
  initPerformanceOptimization: () => {
    const level = getDevicePerformanceLevel()
    set({ performanceLevel: level })
  },

  preloadPopularFurniture: async () => {
    set({ loadingState: { isLoading: true, message: 'Загрузка популярных предметов...' } })
    
    try {
      await furniturePreloader.preload()
      set({ 
        isPreloadingComplete: true,
        loadingState: { isLoading: false }
      })
    } catch (error) {
      console.error('Failed to preload furniture:', error)
      set({ 
        isPreloadingComplete: true,
        loadingState: { isLoading: false }
      })
    }
  },

  // История для Undo/Redo
  history: {
    past: [],
    future: []
  },

  pushToHistory: (action) => set((state) => {
    const currentFurniture = [...state.furniture]
    const newPast = [...state.history.past, currentFurniture]
    
    return {
      history: {
        past: newPast.slice(-50), // Максимум 50 шагов назад
        future: [] // Очищаем future при новом действии
      }
    }
  }),

  undo: () => set((state) => {
    if (state.history.past.length === 0) return state

    const previous = state.history.past[state.history.past.length - 1]
    const newPast = state.history.past.slice(0, -1)
    const newFuture = [[...state.furniture], ...state.history.future]

    return {
      furniture: previous,
      spentAmount: previous.reduce((sum, item) => sum + item.price, 0),
      selectedItem: null,
      history: {
        past: newPast,
        future: newFuture.slice(0, 50)
      }
    }
  }),

  redo: () => set((state) => {
    if (state.history.future.length === 0) return state

    const next = state.history.future[0]
    const newFuture = state.history.future.slice(1)
    const newPast = [...state.history.past, [...state.furniture]]

    return {
      furniture: next,
      spentAmount: next.reduce((sum, item) => sum + item.price, 0),
      selectedItem: null,
      history: {
        past: newPast.slice(0, 50),
        future: newFuture
      }
    }
  }),

  canUndo: () => get().history.past.length > 0,

  canRedo: () => get().history.future.length > 0,

  clearHistory: () => set({
    history: { past: [], future: [] }
  })
}))
