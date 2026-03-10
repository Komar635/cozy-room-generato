'use client'

import { useState } from 'react'
import { 
  searchFurnitureAdvanced, 
  getFurnitureByCategory,
  getItemSizeCategory,
  sizeCategoryNames
} from '../../lib/data/furniture-database'
import { FurnitureCategory, RoomStyle, SizeCategory } from '../../types/room'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export function SearchTest() {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [testResults, setTestResults] = useState<string[]>([])

  const runTests = () => {
    const tests: string[] = []

    // Тест 1: Поиск по названию
    const searchResults = searchFurnitureAdvanced('диван', {})
    tests.push(`✅ Поиск "диван": найдено ${searchResults.length} предметов`)

    // Тест 2: Фильтр по цене
    const priceResults = searchFurnitureAdvanced('', { minPrice: 10000, maxPrice: 30000 })
    tests.push(`✅ Фильтр по цене 10000-30000: найдено ${priceResults.length} предметов`)

    // Тест 3: Фильтр по цвету
    const colorResults = searchFurnitureAdvanced('', { colors: ['Белый'] })
    tests.push(`✅ Фильтр по цвету "Белый": найдено ${colorResults.length} предметов`)

    // Тест 4: Фильтр по стилю
    const styleResults = searchFurnitureAdvanced('', { styles: [RoomStyle.SCANDINAVIAN] })
    tests.push(`✅ Фильтр по стилю "Скандинавский": найдено ${styleResults.length} предметов`)

    // Тест 5: Фильтр по размеру
    const sizeResults = searchFurnitureAdvanced('', { sizeCategories: [SizeCategory.LARGE] })
    tests.push(`✅ Фильтр по размеру "Большой": найдено ${sizeResults.length} предметов`)

    // Тест 6: Комбинированный фильтр
    const combinedResults = searchFurnitureAdvanced('', {
      categories: [FurnitureCategory.FURNITURE],
      maxPrice: 50000,
      styles: [RoomStyle.MODERN]
    })
    tests.push(`✅ Комбинированный фильтр: найдено ${combinedResults.length} предметов`)

    // Тест размерных категорий
    const furnitureItems = getFurnitureByCategory(FurnitureCategory.FURNITURE)
    const sizeStats = furnitureItems.reduce((acc, item) => {
      const size = getItemSizeCategory(item)
      acc[size] = (acc[size] || 0) + 1
      return acc
    }, {} as Record<SizeCategory, number>)

    tests.push(`📊 Статистика размеров мебели:`)
    Object.entries(sizeStats).forEach(([size, count]) => {
      tests.push(`   ${sizeCategoryNames[size as SizeCategory]}: ${count} предметов`)
    })

    setTestResults(tests)
  }

  const handleSearch = () => {
    const results = searchFurnitureAdvanced(searchQuery, {})
    setResults(results)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Тестирование поиска и фильтрации</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Введите поисковый запрос..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button onClick={handleSearch}>Поиск</Button>
            <Button onClick={runTests} variant="outline">Запустить тесты</Button>
          </div>

          {results.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Результаты поиска ({results.length}):</h3>
              <div className="space-y-2">
                {results.map((item) => (
                  <div key={item.id} className="p-2 border rounded text-sm">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-gray-600">
                      Цена: {item.price.toLocaleString('ru-RU')} ₽ | 
                      Цвет: {item.color} | 
                      Размер: {sizeCategoryNames[getItemSizeCategory(item)]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {testResults.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Результаты тестов:</h3>
              <div className="space-y-1 font-mono text-sm">
                {testResults.map((result, index) => (
                  <div key={index} className="text-gray-700">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}