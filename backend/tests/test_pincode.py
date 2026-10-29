import pytest
import asyncio
from fastapi import HTTPException
from app.api.v1.pincode import lookup_pincode_and_ayush_board, PINCODE_PATTERN
from app.core.ayush_registry import (
    AYUSH_FULL_REGISTRY,
    CENTRAL_JURISDICTION_DEFAULT,
    get_ayush_board_details,
)


def test_ayush_registry_coverage():
    """Verify registry covers 28 States and 8 UTs."""
    assert len(AYUSH_FULL_REGISTRY) >= 36
    # Sample state checks
    tn = get_ayush_board_details("Tamil Nadu")
    assert tn["jurisdiction"] == "State"
    assert "Tamil Nadu Board of Indian Medicine" in tn["board_name"]
    assert "official_portal" in tn

    # Normalization & alias checks
    orissa = get_ayush_board_details("Orissa")
    assert orissa["board_name"] == AYUSH_FULL_REGISTRY["Odisha"]["board_name"]

    delhi = get_ayush_board_details("NCT of Delhi")
    assert "Delhi Bharatiya Chikitsa Parishad" in delhi["board_name"]

    # Unknown region fallback to Central NCISM
    unknown = get_ayush_board_details("Unknown Oceanic Zone")
    assert unknown["jurisdiction"] == "Central"
    assert "NCISM" in unknown["board_name"]


def test_pincode_pattern_validation():
    """Verify 6-digit Indian PIN code regex validation."""
    valid_codes = ["600001", "110001", "560001", "700001", "400001"]
    for code in valid_codes:
        assert PINCODE_PATTERN.match(code) is not None

    invalid_codes = ["012345", "60000", "6000001", "ABC123", "600 01", "-60001"]
    for code in invalid_codes:
        assert PINCODE_PATTERN.match(code) is None


@pytest.mark.asyncio
async def test_invalid_pincode_raises_400():
    """Verify endpoint rejects malformed PIN codes with 400 Bad Request."""
    with pytest.raises(HTTPException) as exc_info:
        await lookup_pincode_and_ayush_board("12345")
    assert exc_info.value.status_code == 400

    with pytest.raises(HTTPException) as exc_info:
        await lookup_pincode_and_ayush_board("012345")
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_valid_pincode_lookup_live():
    """Verify live lookup for Tamil Nadu PIN code 600001."""
    res = await lookup_pincode_and_ayush_board("600001")
    assert res.pincode == "600001"
    assert res.district == "Chennai"
    assert res.state == "Tamil Nadu"
    assert res.ayush_governance.jurisdiction == "State"
    assert "Tamil Nadu Board of Indian Medicine" in res.ayush_governance.board_name
    assert "https://" in res.ayush_governance.official_portal
