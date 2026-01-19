# 🏠 Создатель Уютных Комнат

> 3D дизайнер интерьера с локальным ИИ для планирования комнат, управления бюджетом и генерации дизайна

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-Latest-green)](https://threejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ Особенности

### 🎯 Основной функционал (работает БЕЗ внешних API)
- 🏠 **3D создание комнат** с настраиваемыми размерами
- 📐 **Валидация размеров** в реальном времени
- 💾 **Сохранение проектов** локально
- 🎨 **3D предпросмотр** с интерактивной камерой
- 📱 **Адаптивный дизайн** для всех устройств

### 🤖 Локальный ИИ (без интернета!)
- 🪑 **Умные рекомендации мебели** на основе правил дизайна
- 💰 **Оптимизация бюджета** с математическими алгоритмами
- 🏠 **Автоматическая планировка** комнаты
- 🎨 **Подбор стилей** интерьера

### 💡 Дополнительно (опционально)
- 🔌 **Поддержка внешних API** (Replicate, OpenAI)
- 🖼️ **Генерация изображений** интерьера
- ☁️ **Облачное сохранение** проектов

## 🚀 Быстрый старт

### Установка

```bash
# Клонируйте репозиторий
git clone https://github.com/YOUR_USERNAME/room-designer.git
cd room-designer

# Установите зависимости
pnpm install
# или
npm install
```

### Запуск

```bash
# Режим разработки
pnpm dev

# Откройте http://localhost:3000
```

### Сборка для продакшена

```bash
# Сборка
pnpm build

# Запуск продакшен версии
pnpm start
```

## 📋 Требования

- Node.js 18+ 
- pnpm 8+ (или npm 9+)
- Современный браузер с поддержкой WebGL

## 🛠️ Технологии

- **Frontend**: Next.js 14, React 18, TypeScript
- **3D**: Three.js, React Three Fiber, React Three Drei
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **Состояние**: Zustand
- **Иконки**: Lucide React

## 📁 Структура проекта

```
├── app/                    # Next.js App Router
│   ├── api/               # API роуты
│   ├── room/              # Страница создания комнаты
│   ├── setup/             # Настройка API
│   └── api-demo/          # Демонстрация функций
├── components/            # React компоненты
│   ├── 3d/               # 3D компоненты
│   ├── room/             # Компоненты комнаты
│   ├── ai/               # ИИ компоненты
│   └── ui/               # UI компоненты
├── lib/                  # Утилиты и сервисы
│   ├── services/         # API сервисы
│   │   ├── local-ai.ts   # Локальный ИИ
│   │   ├── room-api.ts   # API комнат
│   │   └── free-apis.ts  # Бесплатные API
│   └── constants.ts      # Константы
├── store/                # Zustand store
├── types/                # TypeScript типы
└── docs/                 # Документация
```

## 🎮 Использование

### 1. Создание комнаты
1. Откройте http://localhost:3000
2. Нажмите "Создать комнату"
3. Введите размеры (ширина, высота, глубина)
4. Посмотрите 3D предпросмотр

### 2. Получение рекомендаций
1. Перейдите в "Демо функций"
2. Нажмите "Получить рекомендации"
3. Локальный ИИ предложит подходящую мебель

### 3. Оптимизация бюджета
1. Добавьте мебель в комнату
2. Нажмите "Оптимизировать бюджет"
3. Получите предложения по экономии

## 🆓 Бесплатное использование

Приложение работает **полностью бесплатно** без внешних API:
- ✅ Локальные алгоритмы ИИ
- ✅ Сохранение в браузере
- ✅ Все функции доступны
- ✅ Никаких ограничений

### Опциональные API (для расширенных функций)

Если нужны дополнительные возможности:

1. **Replicate API** (генерация изображений)
   - Бесплатно: $10 кредитов
   - https://replicate.com/

2. **OpenAI API** (продвинутые рекомендации)
   - Бесплатно: $5 кредитов
   - https://platform.openai.com/

Подробнее: [docs/API_KEYS_GUIDE.md](docs/API_KEYS_GUIDE.md)

## 🚀 Развертывание

### Vercel (рекомендуется)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/room-designer)

1. Нажмите кнопку выше
2. Подключите GitHub репозиторий
3. Готово! Приложение развернуто

### Netlify

1. Подключите репозиторий к Netlify
2. Build command: `pnpm build`
3. Publish directory: `.next`

### Docker

```bash
# Сборка образа
docker build -t room-designer .

# Запуск контейнера
docker run -p 3000:3000 room-designer
```

## 📚 Документация

- [API Setup Guide](docs/API_KEYS_GUIDE.md) - Настройка API ключей
- [Free Forever Solution](docs/FREE_FOREVER_SOLUTION.md) - Бесплатное решение
- [Component Documentation](components/room/README.md) - Документация компонентов

## 🤝 Вклад в проект

Приветствуются любые вклады! 

1. Fork репозитория
2. Создайте ветку (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📝 Лицензия

MIT License - используйте свободно для любых целей.

## 🆘 Поддержка

Если возникли вопросы:
- 📧 Создайте [Issue](https://github.com/YOUR_USERNAME/room-designer/issues)
- 💬 Обсудите в [Discussions](https://github.com/YOUR_USERNAME/room-designer/discussions)

## 🎯 Roadmap

- [x] Создание 3D комнат
- [x] Локальный ИИ для рекомендаций
- [x] Оптимизация бюджета
- [ ] Каталог мебели
- [ ] Drag & Drop мебели в 3D
- [ ] Экспорт в PDF
- [ ] Мобильное приложение

## 🌟 Благодарности

- [Next.js](https://nextjs.org/) - React фреймворк
- [Three.js](https://threejs.org/) - 3D библиотека
- [shadcn/ui](https://ui.shadcn.com/) - UI компоненты
- [Zustand](https://zustand-demo.pmnd.rs/) - Управление состоянием

---

Сделано с ❤️ для создания уютных комнат