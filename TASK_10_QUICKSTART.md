# Task 10: Style Analysis Service - Quick Start Guide

## Installation Steps

### 1. Install Dependencies

The package.json has been updated with the Google Generative AI package. Install it:

```bash
bun install
```

If bun install hangs, try:
```bash
npm install @google/generative-ai
```

### 2. Configure API Key

Get your free Google Gemini API key:
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

Update `.env` file with your actual API key:
```env
GEMINI_API_KEY="your-actual-api-key-here"
```

### 3. Verify Database Schema

The Prisma schema already includes the `StyleAnalysis` model. No migration needed.

### 4. Test the Implementation

```bash
# Run the property-based test
bun test src/app/api/models/__tests__/style-analysis.property.test.ts

# Or run all tests
bun test
```

## Usage in Your Application

### Example: Add to Model Detail Page

```tsx
// src/app/projects/[id]/models/[modelId]/page.tsx
import { StyleAnalysisPanel } from '@/components/analysis';

export default function ModelDetailPage({ 
  params 
}: { 
  params: { id: string; modelId: string } 
}) {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Model Analysis</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3D Viewer on the left */}
        <div>
          <Model3DViewer modelId={params.modelId} />
        </div>
        
        {/* Style Analysis on the right */}
        <div>
          <StyleAnalysisPanel modelId={params.modelId} />
        </div>
      </div>
    </div>
  );
}
```

### Example: Trigger Analysis Programmatically

```typescript
async function analyzeModel(modelId: string) {
  try {
    const response = await fetch(`/api/models/${modelId}/analyze`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Analysis failed');
    }
    
    const { analysis } = await response.json();
    console.log('Style:', analysis.styleDescription);
    console.log('Colors:', analysis.dominantColors);
    console.log('Materials:', analysis.materials);
    console.log('Tags:', analysis.styleTags);
    
    return analysis;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## API Endpoints

### POST /api/models/[id]/analyze
Triggers style analysis for a model.

**Response:**
```json
{
  "message": "Style analysis completed",
  "analysis": {
    "id": "uuid",
    "modelId": "uuid",
    "styleDescription": "A modern minimalist chair...",
    "dominantColors": [
      {"hex": "#8B4513", "name": "Brown", "percentage": 65},
      {"hex": "#FFFFFF", "name": "White", "percentage": 35}
    ],
    "materials": [
      {"name": "Oak Wood", "type": "wood", "confidence": 0.95},
      {"name": "Leather", "type": "fabric", "confidence": 0.85}
    ],
    "styleTags": ["modern", "minimalist", "scandinavian"],
    "analyzedAt": "2026-04-10T12:38:40.127Z"
  }
}
```

### GET /api/models/[id]/analysis
Retrieves existing analysis results.

**Response:** Same as POST, but returns 404 if no analysis exists.

## Component Props

### StyleAnalysisPanel

```typescript
interface StyleAnalysisPanelProps {
  modelId: string;                                    // Required: Model ID to analyze
  onAnalysisLoad?: (analysis: StyleAnalysis) => void; // Optional: Callback when loaded
}
```

## Troubleshooting

### "Cannot find module '@google/generative-ai'"

Run: `npm install @google/generative-ai` or `bun install`

### "GEMINI_API_KEY is required"

Make sure you've added the API key to your `.env` file and restarted your dev server.

### "Failed to analyze style"

Check:
1. API key is valid
2. Image URL is accessible
3. Network connection is working
4. Check console for detailed error messages

### Analysis takes too long

The Gemini API typically responds in 2-5 seconds. If it's slower:
1. Check your internet connection
2. Verify the image URL is accessible
3. Consider using smaller images

## Features Implemented

✅ **Task 10.1**: StyleAnalysisService with Google Gemini integration
✅ **Task 10.2**: Property-based test for style analysis (100 iterations)
✅ **Task 10.3**: API routes for analysis (POST analyze, GET analysis)
✅ **Task 10.4**: StyleAnalysisPanel component with full UI

## Requirements Satisfied

✅ **2.1**: Analysis of visual characteristics
✅ **2.2**: Identification of materials and color palette  
✅ **2.3**: Text description of style
✅ **Property 4**: Complete structure validation

## Next Steps

1. **Install dependencies**: `bun install`
2. **Add API key**: Update `.env` with your Gemini API key
3. **Test**: Run `bun test` to verify everything works
4. **Integrate**: Add `StyleAnalysisPanel` to your model pages
5. **Customize**: Adjust the UI styling to match your design system

## File Structure

```
src/
├── lib/
│   └── ai/
│       └── style-analysis.ts          # Core service
├── app/
│   └── api/
│       └── models/
│           └── [id]/
│               ├── analyze/
│               │   └── route.ts       # POST analyze endpoint
│               └── analysis/
│                   └── route.ts       # GET analysis endpoint
├── components/
│   └── analysis/
│       ├── StyleAnalysisPanel.tsx     # UI component
│       └── index.ts                   # Exports
└── app/api/models/__tests__/
    └── style-analysis.property.test.ts # Property test
```

## Cost Considerations

Google Gemini 1.5 Flash free tier:
- 15 requests per minute
- 1,500 requests per day
- 1 million requests per month

This is sufficient for development and small-scale production use.

## Support & Documentation

- **Gemini API Docs**: https://ai.google.dev/docs
- **Implementation Details**: See `TASK_10_IMPLEMENTATION.md`
- **Architecture**: See `.kiro/specs/reality-digitizer-3d/design.md`
- **Requirements**: See `.kiro/specs/reality-digitizer-3d/requirements.md`
