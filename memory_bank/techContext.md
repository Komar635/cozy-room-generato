# Tech Context

## Технологический стек

### Frontend
- **Framework:** Next.js 14.0.4 (App Router)
- **Language:** TypeScript 5.9.3
- **UI Library:** React 18.3.1
- **Styling:** Tailwind CSS 3.4.19
- **UI Components:** shadcn/ui
- **3D Graphics:** Three.js 0.158.0
- **3D React:** @react-three/fiber 8.15.0, @react-three/drei 9.88.0
- **State Management:** Zustand 4.5.7
- **Icons:** Lucide React 0.294.0

### Backend
- **API:** Next.js API Routes
- **Database:** Supabase (PostgreSQL) - в процессе настройки
- **Authentication:** NextAuth.js (планируется)

### Development Tools
- **Package Manager:** npm (с флагом --legacy-peer-deps для совместимости)
- **Linting:** ESLint
- **Type Checking:** TypeScript

### Hosting & Deployment
- **Platform:** Vercel (планируется)
- **Database:** Supabase Cloud

## Окружение разработки

### Системные требования
- Node.js (версия совместимая с Next.js 14)
- npm или yarn
- Git

### Переменные окружения (.env)
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Services (опционально)
OPENAI_API_KEY=
REPLICATE_API_TOKEN=
HUGGINGFACE_API_KEY=
```

### Порты
- **Dev Server:** 3001 (3000 занят)
- **Production:** 80/443

## Ограничения и особенности

### Технические ограничения
1. **npm проблемы:** Некоторые пакеты требуют `--legacy-peer-deps`
2. **React версия:** Используется React 18, некоторые пакеты требуют React 19
3. **3D производительность:** Отключены тени и антиалиасинг для слабых устройств

### Архитектурные решения
1. **Асинхронные функции:** Все функции работы с данными асинхронные для совместимости с Supabase
2. **Временные данные:** Используется локальный массив FURNITURE_DATABASE до настройки Supabase
3. **Client-side рендеринг:** 3D компоненты используют 'use client' директиву

### Зависимости от внешних сервисов
1. **Supabase:** База данных (не настроен)
2. **Маркетплейсы:** Wildberries, Ozon, Hoff (парсеры готовы)
3. **AI API:** OpenAI, Replicate, HuggingFace (опционально)

## CI/CD
**Статус:** Не настроен

**Планируется:**
- GitHub Actions для тестов
- Автоматический деплой на Vercel
- Проверка типов TypeScript
- Линтинг кода

## Известные проблемы

### 1. OrbitControls не работает
- **Статус:** В работе
- **Причина:** Возможно конфликт событий или неправильная настройка
- **Решение:** Добавлены настройки enableZoom, enableRotate, makeDefault

### 2. Отсутствие @react-three/fiber
- **Статус:** Решено
- **Решение:** Установлено через --legacy-peer-deps

### 3. Webpack cache warnings
- **Статус:** Не критично
- **Описание:** Предупреждения при запуске dev сервера
- **Влияние:** Не влияет на работу приложения

## Скрипты

### Основные команды
```bash
npm run dev          # Запуск dev сервера (порт 3001)
npm run build        # Сборка для production
npm run start        # Запуск production сервера
npm run lint         # Проверка кода
```

### Парсеры данных
```bash
# Supabase парсер
cd scripts/supabase-parser
npm install
npm start

# PostgreSQL парсер (legacy)
cd scripts/furniture-parser
npm install
npm start
```
