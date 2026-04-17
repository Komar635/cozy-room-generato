import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ModificationSuggestion {
  type: 'recolor' | 'restoration' | 'geometry_change';
  title: string;
  description: string;
  targetAreas?: string[];
  estimatedDifficulty: 'easy' | 'medium' | 'hard';
  priority: number;
}

export interface StyleAnalysisResult {
  styleDescription: string;
  dominantColors: Array<{
    hex: string;
    name: string;
    percentage: number;
  }>;
  materials: Array<{
    name: string;
    type: string;
    confidence: number;
  }>;
  styleTags: string[];
  modificationSuggestions?: ModificationSuggestion[];
}

export class StyleAnalysisService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async analyzeStyle(imageUrl: string): Promise<StyleAnalysisResult> {
    try {
      const prompt = `Analyze this furniture or decor object image and provide a detailed style analysis in JSON format.

Return ONLY valid JSON with this exact structure:
{
  "styleDescription": "A detailed description of the object's style, design era, and aesthetic characteristics",
  "dominantColors": [
    {"hex": "#RRGGBB", "name": "color name", "percentage": 0-100}
  ],
  "materials": [
    {"name": "material name", "type": "wood|metal|fabric|glass|plastic|ceramic|stone", "confidence": 0-1}
  ],
  "styleTags": ["tag1", "tag2", "tag3"]
}

Guidelines:
- Identify 3-5 dominant colors with hex codes
- List 2-4 materials with confidence scores
- Provide 5-8 style tags (e.g., "modern", "vintage", "minimalist", "rustic")
- Style description should be 2-3 sentences`;

      // Fetch image and convert to base64
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }
      jsonText = jsonText.trim();

      const analysis = JSON.parse(jsonText);

      // Validate structure
      if (!analysis.styleDescription || !Array.isArray(analysis.dominantColors) ||
          !Array.isArray(analysis.materials) || !Array.isArray(analysis.styleTags)) {
        throw new Error('Invalid analysis structure returned from AI');
      }

      return analysis;
    } catch (error) {
      console.error('Style analysis error:', error);
      throw new Error(`Failed to analyze style: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeModelStyle(modelId: string, renderUrl: string): Promise<StyleAnalysisResult> {
    return this.analyzeStyle(renderUrl);
  }

  async generateSuggestions(analysis: StyleAnalysisResult): Promise<ModificationSuggestion[]> {
    try {
      const prompt = `Based on this furniture analysis, generate modification suggestions in JSON format.

Current analysis:
- Style: ${analysis.styleDescription}
- Colors: ${analysis.dominantColors.map(c => c.name).join(', ')}
- Materials: ${analysis.materials.map(m => m.name).join(', ')}
- Tags: ${analysis.styleTags.join(', ')}

Return ONLY valid JSON with this exact structure:
{
  "suggestions": [
    {
      "type": "recolor|restoration|geometry_change",
      "title": "short title",
      "description": "detailed description",
      "targetAreas": ["area1", "area2"],
      "estimatedDifficulty": "easy|medium|hard",
      "priority": 1-5
    }
  ]
}

Generate 3-5 suggestions covering different modification types.`;

      const result = await this.model.generateContent([prompt]);
      const response = await result.response;
      const text = response.text();

      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }
      jsonText = jsonText.trim();

      const data = JSON.parse(jsonText);
      
      if (!data.suggestions || !Array.isArray(data.suggestions)) {
        throw new Error('Invalid suggestions structure returned from AI');
      }

      return data.suggestions;
    } catch (error) {
      console.error('Generate suggestions error:', error);
      throw new Error(`Failed to generate suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
let styleAnalysisService: StyleAnalysisService | null = null;

export function getStyleAnalysisService(): StyleAnalysisService {
  if (!styleAnalysisService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    styleAnalysisService = new StyleAnalysisService(apiKey);
  }
  return styleAnalysisService;
}
