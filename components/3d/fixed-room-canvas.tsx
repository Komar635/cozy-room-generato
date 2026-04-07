'use client'

export default function FixedRoomCanvas() {
  return (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center relative overflow-hidden">
      <div
        className="w-full h-full bg-gradient-to-b from-gray-700 to-gray-900"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #374151 25%, transparent 25%),
            linear-gradient(-45deg, #374151 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #374151 75%),
            linear-gradient(-45deg, transparent 75%, #374151 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}
      >
        <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-amber-100 to-amber-50 opacity-80"></div>
        <div className="absolute left-0 top-0 w-1/4 h-full bg-gradient-to-r from-gray-100 to-gray-200 opacity-60"></div>
        <div className="absolute top-0 w-full h-1/4 bg-gradient-to-b from-gray-100 to-gray-200 opacity-60"></div>

        <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2">
          <div className="w-16 h-16 bg-blue-500 shadow-lg transform rotate-12"></div>
        </div>

        <div className="absolute bottom-1/3 left-1/4">
          <div className="w-12 h-20 bg-green-500 shadow-lg transform -rotate-6"></div>
        </div>

        <div className="absolute bottom-1/3 right-1/4">
          <div className="w-20 h-12 bg-purple-500 shadow-lg transform rotate-3"></div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white bg-black bg-opacity-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-2">3D РљРѕРјРЅР°С‚Р°</h3>
            <p className="text-sm opacity-80">Р’СЂРµРјРµРЅРЅР°СЏ Р·Р°РјРµРЅР° 3D СЃС†РµРЅС‹</p>
            <p className="text-xs mt-2 opacity-60">РќР°Р¶РјРёС‚Рµ &quot;Р”РѕР±Р°РІРёС‚СЊ С‚РµСЃС‚&quot; РґР»СЏ РґРѕР±Р°РІР»РµРЅРёСЏ РјРµР±РµР»Рё</p>
          </div>
        </div>
      </div>
    </div>
  )
}
