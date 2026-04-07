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
        console.error('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё:', error)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedCategory, searchQuery])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Р”РµРјРѕ РїРѕРёСЃРєР° Рё С„РёР»СЊС‚СЂР°С†РёРё РјРµР±РµР»Рё</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="РџРѕРёСЃРє РјРµР±РµР»Рё..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">РљР°С‚РµРіРѕСЂРёРё:</h3>
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

      <div className="mb-4">
        <h3 className="text-lg font-semibold">
          РќР°Р№РґРµРЅРѕ: {items.length} РїСЂРµРґРјРµС‚РѕРІ
          {searchQuery && <span className="text-blue-600 ml-2">РїРѕ Р·Р°РїСЂРѕСЃСѓ &quot;{searchQuery}&quot;</span>}
        </h3>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="text-gray-500">Р—Р°РіСЂСѓР·РєР°...</div>
        </div>
      )}

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
            <p className="text-gray-600 mb-2">Р¦РІРµС‚: {item.color}</p>
            <p className="text-green-600 font-bold text-xl">
              {item.price.toLocaleString('ru-RU')} в‚Ѕ
            </p>
            <div className="mt-2 text-sm text-gray-500">
              Р Р°Р·РјРµСЂС‹: {item.dimensions.width}Г—{item.dimensions.height}Г—{item.dimensions.depth} Рј
            </div>
            <div className="mt-1 text-sm text-gray-500">
              РЎС‚РёР»Рё: {item.style.join(', ')}
            </div>
          </div>
        ))}
      </div>

      {!loading && items.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            {searchQuery
              ? `РќРёС‡РµРіРѕ РЅРµ РЅР°Р№РґРµРЅРѕ РїРѕ Р·Р°РїСЂРѕСЃСѓ "${searchQuery}"`
              : 'Р’ СЌС‚РѕР№ РєР°С‚РµРіРѕСЂРёРё РїРѕРєР° РЅРµС‚ С‚РѕРІР°СЂРѕРІ'}
          </div>
        </div>
      )}

      <div className="mt-12 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">РРЅС„РѕСЂРјР°С†РёСЏ Рѕ РєР°С‚Р°Р»РѕРіРµ:</h3>
        <p>Р’СЃРµРіРѕ С‚РѕРІР°СЂРѕРІ РІ Р±Р°Р·Рµ: {FURNITURE_DATABASE.length}</p>
        <p>РљР°С‚РµРіРѕСЂРёРё: {Object.values(FurnitureCategory).join(', ')}</p>
        <p>Р Р°Р·РјРµСЂРЅС‹Рµ РєР°С‚РµРіРѕСЂРёРё: {Object.values(sizeCategoryNames).join(', ')}</p>
      </div>
    </div>
  )
}
