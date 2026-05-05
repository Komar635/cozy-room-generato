"""
Property-based tests for the 3D model modification service.

Feature: reality-digitizer-3d
Property 6: Modification creates a new model version
Property 17: Modification execution time

Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 10.3
"""

from datetime import datetime

import pytest
from hypothesis import HealthCheck, given, settings, strategies as st
from unittest.mock import AsyncMock, patch

from app.models import ModificationRequest
from app.modification_service import ModificationService


hex_color = st.from_regex(r"#[0-9A-F]{6}", fullmatch=True)


@st.composite
def modification_request_strategy(draw):
    model_id = draw(st.uuids()).hex
    project_id = draw(st.uuids()).hex
    job_id = draw(st.uuids()).hex
    model_type = draw(st.sampled_from(["gaussian-splatting", "nerf"]))
    modification_type = draw(
        st.sampled_from(["recolor", "restoration", "geometry_change"])
    )

    if modification_type == "recolor":
        source_color = draw(hex_color)
        target_color = draw(hex_color)
        parameters = {
            "color_map": {source_color: target_color},
            "finish": draw(st.sampled_from(["matte", "glossy", "satin", None])),
        }
    elif modification_type == "restoration":
        parameters = {
            "damaged_regions": draw(
                st.lists(
                    st.text(min_size=1, max_size=32),
                    min_size=1,
                    max_size=5,
                )
            ),
            "restoration_style": draw(
                st.sampled_from(["original", "modern", "preserved"])
            ),
            "repair_method": draw(
                st.one_of(st.none(), st.text(min_size=1, max_size=32))
            ),
        }
    else:
        parameters = {
            "modification_description": draw(st.text(min_size=1, max_size=120)),
            "scale_factor": draw(st.floats(min_value=0.1, max_value=10.0)),
            "dimensions": draw(
                st.dictionaries(
                    st.sampled_from(["width", "height", "depth"]),
                    st.floats(min_value=1.0, max_value=1000.0),
                    min_size=1,
                    max_size=3,
                )
            ),
        }

    return ModificationRequest(
        job_id=job_id,
        project_id=project_id,
        model_id=model_id,
        model_type=model_type,
        modification_type=modification_type,
        parameters=parameters,
        preserve_original=True,
    )


class TestModificationProperties:
    """Property-based tests for ModificationService."""

    @pytest.mark.asyncio
    @given(modification_request_strategy())
    @settings(
        max_examples=100,
        deadline=1000,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
    )
    async def test_property_6_modification_creates_new_model_version(self, request):
        service = ModificationService()

        with patch("app.modification_service.asyncio.sleep", new_callable=AsyncMock):
            result = await service.apply_modification(request)

        assert result.status == "completed"
        assert result.job_id == request.job_id
        assert result.original_model_id == request.model_id
        assert result.new_model_id != request.model_id
        assert result.modification_id
        assert result.modification_type == request.modification_type
        assert result.model_type == request.model_type
        assert result.storage_path is not None
        assert result.url is not None
        assert result.storage_path.startswith(f"{request.project_id}/")
        assert request.modification_type in result.storage_path
        assert result.completed_at is not None
        assert result.completed_at >= result.created_at

        job = await service.get_job_status(request.job_id)
        assert job.status == "completed"
        assert job.progress == 100
        assert job.completed_at is not None

        saved_modification = await service.get_modification(result.modification_id)
        assert saved_modification == result

    @pytest.mark.asyncio
    @given(modification_request_strategy())
    @settings(
        max_examples=50,
        deadline=1000,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
    )
    async def test_property_17_modification_completes_with_valid_timestamps(
        self, request
    ):
        service = ModificationService()
        started_at = datetime.utcnow()

        with patch("app.modification_service.asyncio.sleep", new_callable=AsyncMock):
            result = await service.apply_modification(request)

        finished_at = datetime.utcnow()
        assert result.created_at >= started_at
        assert result.completed_at is not None
        assert result.completed_at >= result.created_at
        assert result.completed_at <= finished_at
        assert (result.completed_at - result.created_at).total_seconds() <= 5

        job = await service.get_job_status(request.job_id)
        assert job.created_at >= started_at
        assert job.completed_at is not None
        assert job.completed_at >= job.created_at
        assert job.completed_at <= finished_at
