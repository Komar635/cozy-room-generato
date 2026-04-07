# Техническая документация

## Архитектура

### Технологический стек

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **3D**: Three.js, React Three Fiber, React Three Drei
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **State Management**: Zustand
- **Testing**: Jest, React Testing Library

### Структура проекта

```
├── app/                    # Next.js App Router
│   ├── api/               # API роуты
│   ├── room/              # Страница создания комнаты
│   ├── search-demo/       # Демонстрация поиска
│   └── setup/             # Настройка API
├── components/
│   ├── 3d/               # 3D компоненты (Canvas, Room, Furniture)
│   ├── room/             # Компоненты комнаты
│   ├── ai/               # ИИ компоненты
│   └── ui/               # UI компоненты (Button, Input, etc.)
├── lib/
│   ├── services/          # API интеграции
│   ├── hooks/            # Custom hooks
│   ├── data/             # Статические данные (мебель, стили)
│   └── utils.ts          # Утилиты
├── store/                 # Zustand stores
└── types/                 # TypeScript типы
```

### Паттерны проектирования

#### Zustand Store
```typescript
// store/room-store.ts
interface RoomState {
  roomDimensions: { width: number; height: number; depth: number };
  furniture: PlacedFurniture[];
  budget: { total: number; spent: number };
  actions: {
    addFurniture: (item: Furniture) => void;
    removeFurniture: (id: string) => void;
    updateBudget: (amount: number) => void;
  };
}
```

#### Server Components / Client Components
- Страницы: Server Components
- 3D компоненты: Client Components ('use client')
- Интерактивные элементы: Client Components

#### API Services
```typescript
// lib/services/api-name.ts
class ApiService {
  private baseUrl: string;
  private apiKey?: string;

  async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // реализация
  }
}
```

## API Reference

### Локальные API сервисы

#### LocalAI
```typescript
// lib/services/local-ai.ts
getRecommendations(params: {
  roomSize: RoomDimensions;
  style: Style;
  budget: number;
}): Promise<Recommendation[]>
```

#### Furniture API
```typescript
// lib/services/furniture-api.ts
getCatalog(): Promise<FurnitureItem[]>
getByCategory(category: Category): Promise<FurnitureItem[]>
search(query: string, filters: SearchFilters): Promise<FurnitureItem[]>
```

### Store API

#### Room Store
```typescript
// store/room-store.ts
interface RoomStore {
  // State
  roomDimensions: RoomDimensions | null;
  placedItems: PlacedFurniture[];
  budget: BudgetState;
  selectedItem: string | null;
  
  // Actions
  setRoomDimensions: (dims: RoomDimensions) => void;
  addItem: (item: PlacedFurniture) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<PlacedFurniture>) => void;
  selectItem: (id: string | null) => void;
  setBudget: (total: number) => void;
  updateSpent: (amount: number) => void;
  clearRoom: () => void;
  loadProject: (project: ProjectData) => void;
  exportProject: () => ProjectData;
}
```

### 3D Компоненты

#### RoomCanvas
```typescript
// components/3d/room-canvas.tsx
interface RoomCanvasProps {
  width: number;
  height: number;
  depth: number;
  showFloor?: boolean;
  showWalls?: boolean;
  showCeiling?: boolean;
}
```

#### FurnitureItem3D
```typescript
// components/3d/furniture-item.tsx
interface FurnitureItemProps {
  item: PlacedFurniture;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onMove?: (position: Vector3) => void;
  lodLevel?: 'high' | 'medium' | 'low';
}
```

## Конфигурация

### Environment Variables
```
# Опционально - для расширенных функций
REPLICATE_API_TOKEN=...
OPENAI_API_KEY=...
HUGGINGFACE_API_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

### TypeScript Config
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## Оптимизация производительности

### 3D Оптимизации (Задача 14)
- **LOD (Level of Detail)**: 3 уровня - high/medium/low
- **Frustum Culling**: отключение объектов вне видимости
- **Lazy Loading**: загрузка 3D моделей по требованию
- **Texture Optimization**: сжатые форматы текстур
- **GPU Detection**: автодетекция производительности устройства

### Next.js Оптимизации
- Server Components по умолчанию
- Динамические импорты для 3D компонентов
- Static Generation для документации
- API Route handlers для внешних интеграций

## Тестирование

### Unit Tests
```bash
pnpm test
```

### Интеграция с CI/CD
- GitHub Actions для автоматического деплоя
- Lighthouse CI для проверки производительности
- Vercel для хостинга

## Мониторинг

### Интеграции
- Vercel Analytics (встроенный)
- Console logging для отладки
- Error boundary для React ошибок

### Метрики производительности
- Core Web Vitals (LCP, FID, CLS)
- 3D рендеринг FPS
- Bundle size