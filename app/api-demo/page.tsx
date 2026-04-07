'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const RoomSetup = dynamic(() => import('@/components/room/room-setup'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64">Р—Р°РіСЂСѓР·РєР°...</div>
})

const AIRecommendations = dynamic(() => import('@/components/ai/ai-recommendations'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-32">Р—Р°РіСЂСѓР·РєР° AI...</div>
})

const BudgetOptimizer = dynamic(() => import('@/components/ai/budget-optimizer'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-32">Р—Р°РіСЂСѓР·РєР° РѕРїС‚РёРјРёР·Р°С‚РѕСЂР°...</div>
})

const ImageGenerator = dynamic(() => import('@/components/ai/image-generator'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-32">Р—Р°РіСЂСѓР·РєР° РіРµРЅРµСЂР°С‚РѕСЂР°...</div>
})

export default function ApiDemoPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">API Р”РµРјРѕРЅСЃС‚СЂР°С†РёСЏ</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Р”РµРјРѕРЅСЃС‚СЂР°С†РёСЏ РІСЃРµС… API С„СѓРЅРєС†РёР№ РїСЂРёР»РѕР¶РµРЅРёСЏ &quot;РЎРѕР·РґР°С‚РµР»СЊ РЈСЋС‚РЅС‹С… РљРѕРјРЅР°С‚&quot;
          </p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>рџљЂ РЎС‚Р°С‚СѓСЃ API РёРЅС‚РµРіСЂР°С†РёРё</CardTitle>
            <CardDescription>
              РўРµРєСѓС‰РµРµ СЃРѕСЃС‚РѕСЏРЅРёРµ API С„СѓРЅРєС†РёР№ РІ РїСЂРёР»РѕР¶РµРЅРёРё
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">вњ… Р“РѕС‚РѕРІС‹Рµ API</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>вЂў Р’Р°Р»РёРґР°С†РёСЏ СЂР°Р·РјРµСЂРѕРІ РєРѕРјРЅР°С‚С‹</li>
                  <li>вЂў РЎРѕС…СЂР°РЅРµРЅРёРµ/Р·Р°РіСЂСѓР·РєР° РїСЂРѕРµРєС‚РѕРІ</li>
                  <li>вЂў Р—Р°РіР»СѓС€РєРё AI СЂРµРєРѕРјРµРЅРґР°С†РёР№</li>
                  <li>вЂў Р—Р°РіР»СѓС€РєРё РѕРїС‚РёРјРёР·Р°С†РёРё Р±СЋРґР¶РµС‚Р°</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-orange-600">рџ”„ Р’ СЂР°Р·СЂР°Р±РѕС‚РєРµ (Р—Р°РґР°С‡Р° 9)</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>вЂў RoomGPT API РёРЅС‚РµРіСЂР°С†РёСЏ</li>
                  <li>вЂў OpenAI РґР»СЏ Р°РЅР°Р»РёР·Р° СЃС‚РёР»РµР№</li>
                  <li>вЂў Replicate РґР»СЏ РіРµРЅРµСЂР°С†РёРё РёР·РѕР±СЂР°Р¶РµРЅРёР№</li>
                  <li>вЂў Р РµР°Р»СЊРЅС‹Р№ РєР°С‚Р°Р»РѕРі РјРµР±РµР»Рё</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <RoomSetup onComplete={(dimensions) => {
              console.log('РљРѕРјРЅР°С‚Р° СЃРѕР·РґР°РЅР°:', dimensions)
            }} />
          </div>

          <div className="space-y-6">
            <AIRecommendations />
            <BudgetOptimizer />
            <ImageGenerator />
          </div>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>рџ”§ РўРµС…РЅРёС‡РµСЃРєР°СЏ РёРЅС„РѕСЂРјР°С†РёСЏ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">API Endpoints:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-mono">
                <div>POST /api/room/validate</div>
                <div>POST /api/room/save</div>
                <div>POST /api/ai/recommendations</div>
                <div>POST /api/ai/budget-optimization</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">РЎРµСЂРІРёСЃРЅС‹Рµ РєР»Р°СЃСЃС‹:</h4>
              <div className="text-sm font-mono space-y-1">
                <div>RoomApiService - СЂР°Р±РѕС‚Р° СЃ РєРѕРјРЅР°С‚Р°РјРё</div>
                <div>AIApiService - AI С„СѓРЅРєС†РёРё</div>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-700 text-sm">
                <strong>РџСЂРёРјРµС‡Р°РЅРёРµ:</strong> AI С„СѓРЅРєС†РёРё СЃРµР№С‡Р°СЃ РІРѕР·РІСЂР°С‰Р°СЋС‚ С‚РµСЃС‚РѕРІС‹Рµ РґР°РЅРЅС‹Рµ.
                Р РµР°Р»СЊРЅР°СЏ РёРЅС‚РµРіСЂР°С†РёСЏ СЃ RoomGPT API Р±СѓРґРµС‚ РІС‹РїРѕР»РЅРµРЅР° РІ Р·Р°РґР°С‡Рµ 9.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
