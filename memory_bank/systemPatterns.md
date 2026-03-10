# System Patterns

## Архитектура приложения

### Frontend Architecture
```
Next.js App Router
├── app/                    # Страницы и API routes
│   ├── api/               # Backend API endpoints
│   ├── room/              # Страница создания комнаты
│   ├── furniture-demo/    # Демо размещения мебели
│   └── search-demo/       # Демо поиска
├── components/            # React компоненты
│   ├── 3d/               # Three.js компоненты
│   ├── furniture/        # Каталог мебели
│   ├── budget/           # Управление бюджетом
│   ├── ai/               # AI рекомендации
│   └── ui/               # UI компоненты (shadcn)
├── lib/                   # Утилиты и сервисы
│   ├── services/         # API клиенты
│   └── data/             # Локальные данные
├── store/                 # Zustand state management
└── types/                 # TypeScript типы
```

### Ключевые паттерны

#### 1. State Management (Zustand)
- Глобальное состояние комнаты в `store/room-store.ts`
- Хранит размеры комнаты, размещенную мебель, бюджет
- Простой API без boilerplate

#### 2. 3D Rendering (React Three Fiber)
- Декларативный подход к Three.js
- Компонентная структура 3D сцены
- OrbitControls для управления камерой
- Suspense для ленивой загрузки

#### 3. API Layer
- Next.js API Routes для backend
- Сервисные классы в `lib/services/`
- Асинхронные функции для совместимости с Supabase

#### 4. Component Composition
- Atomic Design: ui → components → pages
- Переиспользуемые UI компоненты (shadcn/ui)
- Специализированные компоненты для доменов

#### 5. Data Flow
```
User Action → Component → Store/API → Update State → Re-render
```

## Технические решения

### 3D Визуализация
- **Three.js** через React Three Fiber
- **@react-three/drei** для хелперов (OrbitControls, Grid, Environment)
- Оптимизация: отключены тени, низкий dpr для производительности

### Управление состоянием
- **Zustand** для глобального состояния
- Локальный state для UI компонентов
- Мемоизация через useMemo для производительности

### Стилизация
- **Tailwind CSS** для утилитарных классов
- **shadcn/ui** для готовых компонентов
- CSS-in-JS через Tailwind

### База данных (планируется)
- **Supabase** (PostgreSQL)
- RLS политики для безопасности
- Полнотекстовый поиск
- Автоматический пересчет цен через триггеры

## Связи подсистем

### 1. Room Creation Flow
```
RoomCreator → Validation → Store → RoomCanvas → 3D Scene
```

### 2. Furniture Placement Flow
```
FurnitureLibrary → Drag → DropZone → Store → FurnitureManager → 3D Render
```

### 3. Budget Management Flow
```
Item Added → Price Calculation → Budget Check → Warning/Block → Update UI
```

### 4. Search & Filter Flow
```
SearchFilters → Query Building → Database/Local → Results → FurnitureGrid
```

## Паттерны безопасности
- Валидация на клиенте и сервере
- Санитизация пользовательского ввода
- RLS в Supabase для защиты данных
- Environment variables для API ключей
