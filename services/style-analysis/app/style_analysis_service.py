"""Style Analysis Service using Google Gemini API."""
import google.generativeai as genai
from typing import List, Dict, Any
import json
import uuid
from datetime import datetime
import httpx
from .config import settings
from .models import (
    StyleAnalysis,
    ModificationSuggestion,
    RecolorParameters,
    RestorationParameters,
    GeometryParameters,
)


class StyleAnalysisService:
    """Service for analyzing style and generating modification suggestions."""
    
    def __init__(self):
        """Initialize the service with Gemini API."""
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel(settings.gemini_model)
    
    async def analyze_style(
        self,
        model_id: str,
        image_urls: List[str]
    ) -> StyleAnalysis:
        """
        Analyze the style of a 3D model from its images.
        
        Args:
            model_id: ID of the 3D model
            image_urls: List of image URLs to analyze
            
        Returns:
            StyleAnalysis with complete structure
            
        Raises:
            ValueError: If analysis fails or returns incomplete data
        """
        # Download images
        images = await self._download_images(image_urls)
        
        # Create prompt for style analysis
        prompt = """Analyze this furniture/decor object and provide a detailed style analysis.
        
Return your response as a JSON object with the following structure:
{
    "style_description": "Detailed description of the style (2-3 sentences)",
    "dominant_colors": ["color1", "color2", "color3"],
    "materials": ["material1", "material2"],
    "style_tags": ["tag1", "tag2", "tag3"]
}

Focus on:
- Overall design style (modern, vintage, rustic, etc.)
- Color palette and dominant colors
- Materials used (wood, metal, fabric, etc.)
- Condition and age indicators
- Decorative elements and patterns"""

        # Generate analysis
        response = self.model.generate_content([prompt] + images)
        
        # Parse response
        try:
            # Extract JSON from response
            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            analysis_data = json.loads(response_text)
            
            # Validate required fields
            required_fields = ["style_description", "dominant_colors", "materials", "style_tags"]
            for field in required_fields:
                if field not in analysis_data or not analysis_data[field]:
                    raise ValueError(f"Missing or empty required field: {field}")
            
            # Create StyleAnalysis object
            return StyleAnalysis(
                id=str(uuid.uuid4()),
                model_id=model_id,
                style_description=analysis_data["style_description"],
                dominant_colors=analysis_data["dominant_colors"],
                materials=analysis_data["materials"],
                style_tags=analysis_data["style_tags"],
                analyzed_at=datetime.utcnow()
            )
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            raise ValueError(f"Failed to parse style analysis response: {str(e)}")
    
    async def generate_suggestions(
        self,
        style_analysis: StyleAnalysis,
        modification_types: List[str]
    ) -> List[ModificationSuggestion]:
        """
        Generate modification suggestions based on style analysis.
        
        Args:
            style_analysis: The style analysis result
            modification_types: Types of modifications to generate
            
        Returns:
            List of modification suggestions (all requested types)
            
        Raises:
            ValueError: If suggestion generation fails
        """
        suggestions = []
        
        # Generate suggestions for each type
        for mod_type in modification_types:
            if mod_type == "recolor":
                suggestion = await self._generate_recolor_suggestion(style_analysis)
            elif mod_type == "restoration":
                suggestion = await self._generate_restoration_suggestion(style_analysis)
            elif mod_type == "geometry":
                suggestion = await self._generate_geometry_suggestion(style_analysis)
            else:
                raise ValueError(f"Unknown modification type: {mod_type}")
            
            suggestions.append(suggestion)
        
        return suggestions
    
    async def _generate_recolor_suggestion(
        self,
        style_analysis: StyleAnalysis
    ) -> ModificationSuggestion:
        """Generate a recolor modification suggestion."""
        prompt = f"""Based on this furniture/decor style analysis, suggest a recolor modification:

Style: {style_analysis.style_description}
Current Colors: {', '.join(style_analysis.dominant_colors)}
Materials: {', '.join(style_analysis.materials)}
Style Tags: {', '.join(style_analysis.style_tags)}

Provide a recolor suggestion that would modernize or refresh the piece while maintaining its character.

Return your response as a JSON object:
{{
    "description": "Brief description of the recolor suggestion",
    "color_map": {{"original_color1": "new_color1", "original_color2": "new_color2"}},
    "finish": "matte|glossy|satin"
}}"""

        response = self.model.generate_content(prompt)
        
        try:
            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            data = json.loads(response_text)
            
            return ModificationSuggestion(
                id=str(uuid.uuid4()),
                model_id=style_analysis.model_id,
                modification_type="recolor",
                description=data["description"],
                parameters=RecolorParameters(
                    color_map=data["color_map"],
                    finish=data.get("finish")
                ).model_dump(),
                created_at=datetime.utcnow()
            )
        except (json.JSONDecodeError, KeyError) as e:
            raise ValueError(f"Failed to parse recolor suggestion: {str(e)}")
    
    async def _generate_restoration_suggestion(
        self,
        style_analysis: StyleAnalysis
    ) -> ModificationSuggestion:
        """Generate a restoration modification suggestion."""
        prompt = f"""Based on this furniture/decor style analysis, suggest a restoration modification:

Style: {style_analysis.style_description}
Materials: {', '.join(style_analysis.materials)}
Style Tags: {', '.join(style_analysis.style_tags)}

Identify potential areas that might need restoration and suggest how to restore them.

Return your response as a JSON object:
{{
    "description": "Brief description of the restoration suggestion",
    "damaged_regions": ["region1", "region2"],
    "restoration_style": "original|modern|preserved"
}}"""

        response = self.model.generate_content(prompt)
        
        try:
            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            data = json.loads(response_text)
            
            return ModificationSuggestion(
                id=str(uuid.uuid4()),
                model_id=style_analysis.model_id,
                modification_type="restoration",
                description=data["description"],
                parameters=RestorationParameters(
                    damaged_regions=data["damaged_regions"],
                    restoration_style=data["restoration_style"]
                ).model_dump(),
                created_at=datetime.utcnow()
            )
        except (json.JSONDecodeError, KeyError) as e:
            raise ValueError(f"Failed to parse restoration suggestion: {str(e)}")
    
    async def _generate_geometry_suggestion(
        self,
        style_analysis: StyleAnalysis
    ) -> ModificationSuggestion:
        """Generate a geometry modification suggestion."""
        prompt = f"""Based on this furniture/decor style analysis, suggest a geometry modification:

Style: {style_analysis.style_description}
Materials: {', '.join(style_analysis.materials)}
Style Tags: {', '.join(style_analysis.style_tags)}

Suggest a subtle geometry change that would enhance the piece's functionality or aesthetics.

Return your response as a JSON object:
{{
    "description": "Brief description of the geometry modification",
    "modification_description": "Detailed description of the change",
    "scale_factor": 1.0,
    "dimensions": {{"width": 100, "height": 100, "depth": 50}}
}}"""

        response = self.model.generate_content(prompt)
        
        try:
            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            data = json.loads(response_text)
            
            return ModificationSuggestion(
                id=str(uuid.uuid4()),
                model_id=style_analysis.model_id,
                modification_type="geometry",
                description=data["description"],
                parameters=GeometryParameters(
                    modification_description=data["modification_description"],
                    scale_factor=data.get("scale_factor"),
                    dimensions=data.get("dimensions")
                ).model_dump(),
                created_at=datetime.utcnow()
            )
        except (json.JSONDecodeError, KeyError) as e:
            raise ValueError(f"Failed to parse geometry suggestion: {str(e)}")
    
    async def _download_images(self, image_urls: List[str]) -> List[Any]:
        """Download images from URLs."""
        images = []
        async with httpx.AsyncClient() as client:
            for url in image_urls:
                response = await client.get(url)
                response.raise_for_status()
                images.append(response.content)
        return images
