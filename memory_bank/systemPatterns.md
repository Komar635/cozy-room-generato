# System Patterns

## Архитектура приложения

### Frontend Architecture
- **Framework**: Next.js 14 (App Router)
- **State Management**: Zustand (глобальный стор в `store/room-store.ts`)
- **3D Engine**: Three.js с обертками `@react-three/fiber` и `@react-three/drei`
- **UI System**: Tailwind CSS + shadcn/ui

### Ключевые паттерны

#### 1. Управление состоянием (Zustand)
- Централизованное хранение параметров комнаты, мебели и бюджета.
- Асинхронные действия для работы с внешними данными.

#### 2. Компонентный 3D-дизайн
- Разделение визуальных элементов (RoomCanvas, FurnitureModels) и бизнес-логики.
- Использование 'use client' для всех компонентов, взаимодействующих с Three.js.

#### 3. Сервисный слой (lib/services)
- Инкапсуляция логики работы с API (Supabase, маркетплейсы, AI) в отдельные сервисы.
- Поддержка "Free Forever" режима с локальными алгоритмами в качестве фолбэка.

#### 4. Адаптивность и UI
- Использование Radix UI через shadcn для обеспечения доступности.
- Responsive-дизайн для работы 3D-сцены на мобильных устройствах.
