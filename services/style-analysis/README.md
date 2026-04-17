# Style Analysis Service

Python microservice for analyzing furniture/decor style and generating modification suggestions using Google Gemini API.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
- `GEMINI_API_KEY`: Your Google Gemini API key
- `DATABASE_URL`: PostgreSQL connection string

## Running the Service

```bash
python run.py
```

The service will start on `http://localhost:8001`

## API Endpoints

### POST /analyze
Analyze the style of a 3D model from images.

**Request:**
```json
{
  "model_id": "uuid",
  "image_urls": ["url1", "url2", ...]
}
```

**Response:**
```json
{
  "id": "uuid",
  "model_id": "uuid",
  "style_description": "Detailed style description",
  "dominant_colors": ["color1", "color2"],
  "materials": ["material1", "material2"],
  "style_tags": ["tag1", "tag2"],
  "analyzed_at": "2026-04-10T12:34:05.491Z"
}
```

### POST /suggestions
Generate modification suggestions based on style analysis.

**Request:**
```json
{
  "model_id": "uuid",
  "style_analysis_id": "uuid",
  "modification_types": ["recolor", "restoration", "geometry"]
}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "model_id": "uuid",
    "modification_type": "recolor",
    "description": "Suggestion description",
    "parameters": {
      "color_map": {"#000": "#FFF"},
      "finish": "matte"
    },
    "created_at": "2026-04-10T12:34:05.491Z"
  }
]
```

## Testing

Run property-based tests:
```bash
pytest tests/test_suggestions_properties.py -v
```

## Architecture

- `app/main.py`: FastAPI application
- `app/style_analysis_service.py`: Core service logic
- `app/models.py`: Pydantic data models
- `app/config.py`: Configuration management
- `tests/`: Property-based tests using Hypothesis
