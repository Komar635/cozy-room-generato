'use client'

import { FurnitureLibrary } from '@/components/furniture/furniture-library'
import { SearchTest } from '@/components/furniture/search-test'

export default function SearchDemoPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Демонстрация поиска и фильтрации
        </h1>
        <p className="text-gray-600">
          Тестирование новой функциональности поиска по названию, фильтрации по цене, цвету и размеру предметов мебели.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        <div>
          <h2 className="text-xl font-semibold mb-4">Тестирование функций</h2>
          <SearchTest />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Каталог с фильтрами</h2>
          <FurnitureLibrary />
        </div>
      </div>
    </div>
  )
}