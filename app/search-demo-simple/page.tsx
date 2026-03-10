'use client'

import { useState, useEffect } from 'react'
import { FurnitureCategory } from '@/types/room'
import { 
  FURNITURE_DATABASE,
  getFurnitureByCategory,
  searchFurnitureAdvanced,
  sizeCategoryNames
} from '@/lib/data/furniture-database'

export default function SearchDemoSimplePage() {
  const [selectedCategory, setSelectedCategory] = useState<FurnitureCategory>(FurnitureCategory.FURNITURE)
  const [searchQuery, setSearchQuery] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Загрузка данных при изменении категории или поиска
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        if (searchQuery.trim()) {
          const results = await searchFurnitureAdvanced(searchQuery, {
            categories: [selectedCategory]
          })
          setItems(results)
        } else {
          const results = await getFurnitureByCategory(selectedCategory)
          setItems(results)
        }
      } catch (error) {
        console.error('Ошибка загрузки:', error)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedCategory, searchQuery])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Демо поиска и фильтрации мебели</h1>
      
      {/* Поиск */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Поиск мебели..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Категории */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Категории:</h3>
        <div className="flex flex-wrap gap-2">
          {Object.values(FurnitureCategory).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg border ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Результаты */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold">
          Найдено: {items.length} предметов
          {searchQuery && <span className="text-blue-600 ml-2">по запросу "{searchQuery}"</span>}
        </h3>
      </div>

      {/* Загрузка */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-gray-500">Загрузка...</div>
        </div>
      )}

      {/* Список товаров */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
            <img
              src={item.thumbnailUrl}
              alt={item.name}
              className="w-full h-48 object-cover rounded-lg mb-4"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image'
              }}
            />
            <h4 className="font-semibold text-lg mb-2">{item.name}</h4>
            <p className="text-gray-600 mb-2">Цвет: {item.color}</p>
            <p className="text-green-600 font-bold text-xl">
              {item.price.toLocaleString('ru-RU')} ₽
            </p>
            <div className="mt-2 text-sm text-gray-500">
              Размеры: {item.dimensions.width}×{item.dimensions.height}×{item.dimensions.depth} м
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Стили: {item.style.join(', ')}
            </div>
          </div>
        ))}
      </div>

      {/* Пустое состояние */}
      {!loading && items.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            {searchQuery 
              ? `Ничего не найдено по запросу "${searchQuery}"`
              : 'В этой категории пока нет товаров'
            }
          </div>
        </div>
      )}

      {/* Информация о базе данных */}
      <div className="mt-12 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Информация о каталоге:</h3>
        <p>Всего товаров в базе: {FURNITURE_DATABASE.length}</p>
        <p>Категории: {Object.values(FurnitureCategory).join(', ')}</p>
        <p>Размерные категории: {Object.values(sizeCategoryNames).join(', ')}</p>
      </div>
    </div>
  )
}