"""Property-based tests for modification suggestions generation."""
import pytest
from hypothesis import given, strategies as st, settings as hypothesis_settings
from app.style_analysis_service import StyleAnalysisService
from app.models import StyleAnalysis
from datetime import datetime
import uuid


# Strategies for generating test data
@st.composite
def style_analysis_strategy(draw):
    """Generate a valid StyleAnalysis object."""
    return StyleAnalysis(
        id=str(uuid.uuid4()),
        model_id=str(uuid.uuid4()),
        style_description=draw(st.text(min_size=20, max_size=200)),
        dominant_colors=draw(st.lists(st.text(min_size=3, max_size=20), min_size=1, max_size=5)),
        materials=draw(st.lists(st.text(min_size=3, max_size=20), min_size=1, max_size=5)),
        style_tags=draw(st.lists(st.text(min_size=3, max_size=20), min_size=1, max_size=5)),
        analyzed_at=datetime.utcnow()
    )


@st.composite
def modification_types_strategy(draw):
    """Generate a list of modification types."""
    all_types = ["recolor", "restoration", "geometry"]
    # Always include all three types for Property 5
    return all_types


class TestModificationSuggestionsProperties:
    """Property-based tests for modification suggestions generation."""
    
    @pytest.mark.asyncio
    @given(
        style_analysis=style_analysis_strategy(),
        modification_types=modification_types_strategy()
    )
    @hypothesis_settings(max_examples=100, deadline=None)
    async def test_property_5_generate_all_modification_types(
        self,
        style_analysis: StyleAnalysis,
        modification_types: list
    ):
        """
        Feature: reality-digitizer-3d, Property 5: Генерация всех типов предложений по модификации
        
        For any completed style analysis, the system must generate suggestions
        for all three types: recolor, restoration, and geometry modification.
        
        Checks: Requirements 3.1, 3.2, 3.3, 3.4
        """
        # Arrange
        service = StyleAnalysisService()
        
        # Act
        suggestions = await service.generate_suggestions(
            style_analysis=style_analysis,
            modification_types=modification_types
        )
        
        # Assert: All three types must be present
        assert len(suggestions) == 3, "Must generate exactly 3 suggestions"
        
        suggestion_types = {s.modification_type for s in suggestions}
        assert "recolor" in suggestion_types, "Must include recolor suggestion"
        assert "restoration" in suggestion_types, "Must include restoration suggestion"
        assert "geometry" in suggestion_types, "Must include geometry suggestion"
        
        # Assert: Each suggestion has required fields
        for suggestion in suggestions:
            assert suggestion.id is not None, "Suggestion must have ID"
            assert suggestion.model_id == style_analysis.model_id, "Suggestion must reference correct model"
            assert suggestion.description, "Suggestion must have description"
            assert suggestion.parameters, "Suggestion must have parameters"
            assert suggestion.created_at is not None, "Suggestion must have creation timestamp"
        
        # Assert: Type-specific validations
        for suggestion in suggestions:
            if suggestion.modification_type == "recolor":
                assert "color_map" in suggestion.parameters, "Recolor must have color_map"
                assert isinstance(suggestion.parameters["color_map"], dict), "color_map must be dict"
                assert len(suggestion.parameters["color_map"]) > 0, "color_map must not be empty"
            
            elif suggestion.modification_type == "restoration":
                assert "damaged_regions" in suggestion.parameters, "Restoration must have damaged_regions"
                assert isinstance(suggestion.parameters["damaged_regions"], list), "damaged_regions must be list"
                assert len(suggestion.parameters["damaged_regions"]) > 0, "damaged_regions must not be empty"
                assert "restoration_style" in suggestion.parameters, "Restoration must have restoration_style"
            
            elif suggestion.modification_type == "geometry":
                assert "modification_description" in suggestion.parameters, "Geometry must have modification_description"
                assert suggestion.parameters["modification_description"], "modification_description must not be empty"
    
    @pytest.mark.asyncio
    @given(style_analysis=style_analysis_strategy())
    @hypothesis_settings(max_examples=100, deadline=None)
    async def test_recolor_suggestion_structure(self, style_analysis: StyleAnalysis):
        """Test that recolor suggestions have valid structure."""
        # Arrange
        service = StyleAnalysisService()
        
        # Act
        suggestion = await service._generate_recolor_suggestion(style_analysis)
        
        # Assert
        assert suggestion.modification_type == "recolor"
        assert "color_map" in suggestion.parameters
        assert isinstance(suggestion.parameters["color_map"], dict)
        
        # Validate color_map has at least one mapping
        assert len(suggestion.parameters["color_map"]) > 0
        
        # Validate finish if present
        if "finish" in suggestion.parameters and suggestion.parameters["finish"]:
            assert suggestion.parameters["finish"] in ["matte", "glossy", "satin"]
    
    @pytest.mark.asyncio
    @given(style_analysis=style_analysis_strategy())
    @hypothesis_settings(max_examples=100, deadline=None)
    async def test_restoration_suggestion_structure(self, style_analysis: StyleAnalysis):
        """Test that restoration suggestions have valid structure."""
        # Arrange
        service = StyleAnalysisService()
        
        # Act
        suggestion = await service._generate_restoration_suggestion(style_analysis)
        
        # Assert
        assert suggestion.modification_type == "restoration"
        assert "damaged_regions" in suggestion.parameters
        assert isinstance(suggestion.parameters["damaged_regions"], list)
        assert len(suggestion.parameters["damaged_regions"]) > 0
        assert "restoration_style" in suggestion.parameters
        assert suggestion.parameters["restoration_style"]
    
    @pytest.mark.asyncio
    @given(style_analysis=style_analysis_strategy())
    @hypothesis_settings(max_examples=100, deadline=None)
    async def test_geometry_suggestion_structure(self, style_analysis: StyleAnalysis):
        """Test that geometry suggestions have valid structure."""
        # Arrange
        service = StyleAnalysisService()
        
        # Act
        suggestion = await service._generate_geometry_suggestion(style_analysis)
        
        # Assert
        assert suggestion.modification_type == "geometry"
        assert "modification_description" in suggestion.parameters
        assert suggestion.parameters["modification_description"]
        
        # Validate scale_factor if present
        if "scale_factor" in suggestion.parameters and suggestion.parameters["scale_factor"]:
            assert 0.1 <= suggestion.parameters["scale_factor"] <= 10.0
        
        # Validate dimensions if present
        if "dimensions" in suggestion.parameters and suggestion.parameters["dimensions"]:
            dims = suggestion.parameters["dimensions"]
            assert isinstance(dims, dict)
            for key in ["width", "height", "depth"]:
                if key in dims:
                    assert isinstance(dims[key], (int, float))
                    assert dims[key] > 0
