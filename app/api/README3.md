# API Структура

Структура API для приложения "Создатель Уютных Комнат".

## Текущие API роуты

### Room API (`/api/room/`)

#### POST `/api/room/validate`
Валидация размеров комнаты на сервере.

**Запрос:**
```json
{
  "width": 4.5,
  "height": 3.0,
  "depth": 5.2
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "dimensions": { "width": 4.5, "height": 3.0, "depth": 5.2 },
    "calculations": {
      "floorArea": 23.4,
      "volume": 70.2,
      "wallArea": 46.2,
      "perimeter": 19.4
    }
  }
}
```

#### POST `/api/room/save`
Сохранение проекта комнаты.

**Запрос:** `RoomProject` объект

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "project_123",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET `/api/room/save?id=project_123`
Загрузка проекта комнаты.

**Ответ:** `RoomProject` объект или ошибка 404

### AI API (`/api/ai/`)

#### POST `/api/ai/recommendations`
Получение рекомендаций ИИ по мебели.

**Запрос:**
```json
{
  "roomDimensions": { "width": 4, "height": 3, "depth": 4 },
  "style": "modern",
  "budget": 100000,
  "existingFurniture": []
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "rec_1",
        "name": "Диван угловой",
        "category": "furniture",
        "price": 45000,
        "reason": "Подходит для выбранного стиля",
        "confidence": 0.9
      }
    ],
    "totalEstimatedCost": 45000,
    "budgetUtilization": 0.45
  }
}
```

#### POST `/api/ai/budget-optimization`
Оптимизация бюджета с предложениями замен.

**Запрос:**
```json
{
  "currentFurniture": [...],
  "targetBudget": 80000,
  "currentBudget": 95000
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "needsOptimization": true,
    "overspend": 15000,
    "optimizations": [
      {
        "originalItem": {...},
        "suggestedItem": {...},
        "savings": 10000,
        "reason": "Аналогичный предмет с лучшим соотношением цена-качество"
      }
    ],
    "totalPossibleSavings": 10000
  }
}
```

## Планируемые API роуты (Задача 9)

### RoomGPT Integration

Когда будет выполняться задача 9, эти API будут интегрированы с реальными сервисами:

- **OpenAI API** - для анализа стилей и генерации рекомендаций
- **Replicate API** - для генерации изображений интерьера
- **RoomGPT API** - основной ИИ сервис для дизайна

### Дополнительные роуты

```
POST /api/ai/style-analysis     - Анализ стиля по фото
POST /api/ai/generate-image     - Генерация изображения интерьера
POST /api/furniture/catalog     - Каталог мебели с фильтрами
POST /api/furniture/search      - Поиск мебели
GET  /api/styles/templates      - Готовые шаблоны стилей
```

## Сервисные классы

### RoomApiService
```typescript
import { RoomApiService } from '@/lib/services/room-api'

// Валидация комнаты
const result = await RoomApiService.validateRoom(dimensions)

// Сохранение проекта
const saved = await RoomApiService.saveProject(project)

// Загрузка проекта
const loaded = await RoomApiService.loadProject(projectId)
```

### AIApiService
```typescript
import { AIApiService } from '@/lib/services/ai-api'

// Получение рекомендаций
const recommendations = await AIApiService.getRecommendations({
  roomDimensions,
  style,
  budget,
  existingFurniture
})

// Оптимизация бюджета
const optimization = await AIApiService.optimizeBudget({
  currentFurniture,
  targetBudget,
  currentBudget
})
```

## Обработка ошибок

Все API роуты возвращают стандартизированные ответы:

**Успех:**
```json
{
  "success": true,
  "data": {...}
}
```

**Ошибка:**
```json
{
  "success": false,
  "error": "Описание ошибки",
  "errors": ["Список ошибок валидации"] // опционально
}
```

## Переменные окружения

Для задачи 9 потребуются:

```env
OPENAI_API_KEY=your_openai_key
REPLICATE_API_TOKEN=your_replicate_token
ROOMGPT_API_URL=https://api.roomgpt.io
ROOMGPT_API_KEY=your_roomgpt_key
```