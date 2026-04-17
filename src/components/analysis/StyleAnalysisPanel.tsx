'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface ColorInfo {
  hex: string;
  name: string;
  percentage: number;
}

interface MaterialInfo {
  name: string;
  type: string;
  confidence: number;
}

interface StyleAnalysis {
  id: string;
  modelId: string;
  styleDescription: string;
  dominantColors: ColorInfo[];
  materials: MaterialInfo[];
  styleTags: string[];
  analyzedAt: string;
}

interface StyleAnalysisPanelProps {
  modelId: string;
  onAnalysisLoad?: (analysis: StyleAnalysis) => void;
}

export function StyleAnalysisPanel({ modelId, onAnalysisLoad }: StyleAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<StyleAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const normalizeAnalysis = (data: unknown): StyleAnalysis => {
      const source = (data && typeof data === 'object' && 'analysis' in data
        ? (data as { analysis: StyleAnalysis }).analysis
        : data) as Partial<StyleAnalysis>;

      return {
        id: String(source.id ?? ''),
        modelId: String(source.modelId ?? ''),
        styleDescription: String(source.styleDescription ?? ''),
        dominantColors: Array.isArray(source.dominantColors) ? source.dominantColors : [],
        materials: Array.isArray(source.materials) ? source.materials : [],
        styleTags: Array.isArray(source.styleTags) ? source.styleTags : [],
        analyzedAt: String(source.analyzedAt ?? new Date().toISOString()),
      };
    };

    async function fetchAnalysis() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/models/${modelId}/analysis`);
        
        if (response.status === 404) {
          // No analysis exists yet, trigger one
          const analyzeResponse = await fetch(`/api/models/${modelId}/analyze`, {
            method: 'POST',
          });

          if (!analyzeResponse.ok) {
            const errorData = await analyzeResponse.json();
            throw new Error(errorData.error || 'Failed to analyze style');
          }

          const analyzeData = await analyzeResponse.json();
          const normalized = normalizeAnalysis(analyzeData);
          setAnalysis(normalized);
          onAnalysisLoad?.(normalized);
        } else if (response.ok) {
          const data = await response.json();
          const normalized = normalizeAnalysis(data);
          setAnalysis(normalized);
          onAnalysisLoad?.(normalized);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch analysis');
        }
      } catch (err) {
        console.error('Error loading style analysis:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    if (modelId) {
      fetchAnalysis();
    }
  }, [modelId, onAnalysisLoad]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Анализ стиля</CardTitle>
          <CardDescription>Загрузка результатов анализа...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Анализ стиля</CardTitle>
          <CardDescription>Ошибка при загрузке анализа</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Style Description */}
      <Card>
        <CardHeader>
          <CardTitle>Описание стиля</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{analysis.styleDescription}</p>
        </CardContent>
      </Card>

      {/* Style Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Стилевые теги</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysis.styleTags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color Palette */}
      <Card>
        <CardHeader>
          <CardTitle>Цветовая палитра</CardTitle>
          <CardDescription>Доминирующие цвета объекта</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.dominantColors.map((color, index) => (
              <div key={index} className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-md border shadow-sm"
                  style={{ backgroundColor: color.hex }}
                  title={color.hex}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{color.name}</p>
                  <p className="text-xs text-muted-foreground">{color.hex}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{Number(color.percentage ?? 0).toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Materials */}
      <Card>
        <CardHeader>
          <CardTitle>Материалы</CardTitle>
          <CardDescription>Определенные материалы объекта</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.materials.map((material, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{material.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{material.type}</p>
                </div>
                <div className="text-right">
                  <Badge variant={Number(material.confidence ?? 0) > 0.7 ? 'default' : 'outline'}>
                    {(Number(material.confidence ?? 0) * 100).toFixed(0)}% уверенность
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Metadata */}
      <div className="text-xs text-muted-foreground text-center">
        Анализ выполнен: {new Date(analysis.analyzedAt).toLocaleString('ru-RU')}
      </div>
    </div>
  );
}
