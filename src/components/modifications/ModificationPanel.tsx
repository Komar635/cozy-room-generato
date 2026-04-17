import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ModificationSuggestion {
  id: string;
  modificationType: 'recolor' | 'restoration' | 'geometry';
  description: string;
  parameters: Record<string, any>;
  previewUrl?: string;
}

interface ModificationPanelProps {
  projectId: string;
  currentModelId: string;
  suggestions: ModificationSuggestion[];
  onApplyModification: (suggestion: ModificationSuggestion) => void;
  loading?: boolean;
}

const ModificationTypeLabels = {
  recolor: 'Перекраска',
  restoration: 'Реставрация',
  geometry: 'Изменение геометрии',
};

const ModificationTypeColors = {
  recolor: 'bg-blue-100 text-blue-800',
  restoration: 'bg-green-100 text-green-800',
  geometry: 'bg-purple-100 text-purple-800',
};

export function ModificationPanel({
  projectId,
  currentModelId,
  suggestions,
  onApplyModification,
  loading = false,
}: ModificationPanelProps) {
  const renderParameters = (type: string, parameters: Record<string, any>) => {
    switch (type) {
      case 'recolor':
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Цветовая схема:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(parameters.color_map || {}).map(([from, to]) => (
                <div key={from} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: from }}
                    title={from}
                  />
                  <span>→</span>
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: to as string }}
                    title={to as string}
                  />
                </div>
              ))}
            </div>
            {parameters.finish && (
              <p className="text-sm text-gray-600">
                Финиш: <span className="font-medium">{parameters.finish}</span>
              </p>
            )}
          </div>
        );

      case 'restoration':
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Области реставрации:</p>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {(parameters.damaged_regions || []).map((region: string, idx: number) => (
                <li key={idx}>{region}</li>
              ))}
            </ul>
            {parameters.restoration_style && (
              <p className="text-sm text-gray-600">
                Стиль: <span className="font-medium">{parameters.restoration_style}</span>
              </p>
            )}
          </div>
        );

      case 'geometry':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{parameters.modification_description}</p>
            {parameters.scale_factor && (
              <p className="text-sm text-gray-600">
                Масштаб: <span className="font-medium">{parameters.scale_factor}x</span>
              </p>
            )}
            {parameters.dimensions && (
              <div className="text-sm text-gray-600">
                <p className="font-medium">Размеры:</p>
                <ul className="list-disc list-inside ml-4">
                  {Object.entries(parameters.dimensions).map(([key, value]) => (
                    <li key={key}>
                      {key}: {value as number}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Предложения по модификации</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Предложения по модификации</h2>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">
              Нет доступных предложений. Запустите анализ стиля для генерации предложений.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Предложения по модификации</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">
                  {ModificationTypeLabels[suggestion.modificationType]}
                </CardTitle>
                <Badge
                  className={ModificationTypeColors[suggestion.modificationType]}
                  variant="secondary"
                >
                  {suggestion.modificationType}
                </Badge>
              </div>
              <CardDescription>{suggestion.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              {suggestion.previewUrl && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={suggestion.previewUrl}
                    alt="Preview"
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              {renderParameters(suggestion.modificationType, suggestion.parameters)}
              <Button
                onClick={() => onApplyModification(suggestion)}
                className="w-full"
                variant="default"
              >
                Применить модификацию
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
