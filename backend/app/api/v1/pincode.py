import re
import logging
from typing import List, Optional
import httpx
from fastapi import APIRouter, HTTPException, Path, status
from pydantic import BaseModel, Field

from app.config import settings
from app.core.ayush_registry import get_ayush_board_details

logger = logging.getLogger(__name__)

router = APIRouter(tags=["PIN Code & AYUSH Governance"])

PINCODE_PATTERN = re.compile(r"^[1-9][0-9]{5}$")


class PostOfficeDetail(BaseModel):
    name: str = Field(..., description="Post Office Name")
    branch_type: Optional[str] = Field(None, description="Branch Type (e.g. Sub Post Office)")
    delivery_status: Optional[str] = Field(None, description="Delivery or Non-Delivery")
    circle: Optional[str] = Field(None, description="Postal Circle")
    district: Optional[str] = Field(None, description="District Name")
    division: Optional[str] = Field(None, description="Postal Division")
    region: Optional[str] = Field(None, description="Postal Region")
    state: Optional[str] = Field(None, description="State / UT Name")
    country: Optional[str] = Field("India", description="Country")
    pincode: str = Field(..., description="6-digit PIN code")


class AyushBoardResponse(BaseModel):
    board_type: str = Field(..., description="Type of statutory body (e.g. State Statutory Board, Central Regulatory Body)")
    board_name: str = Field(..., description="Official statutory name of the Board/Council")
    statutory_act: str = Field(..., description="Statutory Act governing AYUSH practice in this region")
    controlling_authority: str = Field(..., description="Government department or ministry overseeing the board")
    jurisdiction: str = Field(..., description="Jurisdiction type: 'State', 'UT', or 'Central'")
    official_portal: str = Field(..., description="Official URL for registration and licensing")
    description: str = Field(..., description="Summary of jurisdiction and regulatory oversight")
    region_note: Optional[str] = Field(None, description="Specific fallback or central oversight notation if applicable")


class PincodeLookupResponse(BaseModel):
    pincode: str = Field(..., description="The queried 6-digit PIN code")
    district: str = Field(..., description="District identified from postal records")
    state: str = Field(..., description="State or Union Territory identified")
    region: Optional[str] = Field(None, description="Postal region")
    division: Optional[str] = Field(None, description="Postal division")
    post_offices: List[str] = Field(default_factory=list, description="Names of post offices serving this PIN code")
    primary_post_office: Optional[PostOfficeDetail] = Field(None, description="Detailed record of primary post office")
    ayush_governance: AyushBoardResponse = Field(..., description="Mapped statutory AYUSH authority for this region")


@router.get(
    "/{pincode}",
    response_model=PincodeLookupResponse,
    summary="Auto-Lookup PIN Code & Map Statutory AYUSH Board",
    description=(
        "Accepts a 6-digit Indian postal PIN code, queries the postal directory to identify "
        "the District, State, Region, and Division, and maps the location to its statutory "
        "AYUSH Medical Board or Central NCISM regulatory authority."
    ),
    responses={
        200: {"description": "Geographic details and AYUSH board successfully resolved"},
        400: {"description": "Invalid PIN code format"},
        404: {"description": "PIN code not found in postal directory"},
        502: {"description": "External postal service unreachable"},
        504: {"description": "External postal service timed out"},
    },
)
async def lookup_pincode_and_ayush_board(
    pincode: str = Path(..., description="6-digit Indian PIN code", examples=["600001", "110001", "560001"])
) -> PincodeLookupResponse:
    cleaned_pincode = pincode.strip()

    if not PINCODE_PATTERN.match(cleaned_pincode):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PIN code format. Must be a valid 6-digit Indian postal code starting with digits 1-9.",
        )

    base_url = settings.POSTAL_API_BASE_URL.rstrip("/")
    api_url = f"{base_url}/pincode/{cleaned_pincode}"

    timeout = getattr(settings, "POSTAL_API_TIMEOUT_SECONDS", 5.0)

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(api_url, headers={"User-Agent": "Meyveda-Platform/1.0"})
    except httpx.TimeoutException as exc:
        logger.warning("Postal API timeout for PIN code %s: %s", cleaned_pincode, exc)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Postal PIN code verification service timed out. Please try again or enter details manually.",
        )
    except httpx.RequestError as exc:
        logger.error("Postal API request error for PIN code %s: %s", cleaned_pincode, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to reach external postal PIN code verification service. Please try again later.",
        )

    if response.status_code != 200:
        logger.warning("Postal API returned HTTP %s for PIN code %s", response.status_code, cleaned_pincode)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Postal PIN code service returned error status {response.status_code}.",
        )

    try:
        data = response.json()
    except Exception as exc:
        logger.error("Failed to parse JSON from postal API for %s: %s", cleaned_pincode, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid response format received from postal verification service.",
        )

    if not isinstance(data, list) or len(data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No geographic records found for PIN code '{cleaned_pincode}'.",
        )

    first_record = data[0]
    record_status = first_record.get("Status")
    post_offices = first_record.get("PostOffice") or []

    if record_status != "Success" or not post_offices:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PIN code '{cleaned_pincode}' was not found in the national postal directory.",
        )

    # Extract primary post office details
    primary_po_raw = post_offices[0]
    district = primary_po_raw.get("District") or "Unknown District"
    state = primary_po_raw.get("State") or "Unknown State"
    region = primary_po_raw.get("Region")
    division = primary_po_raw.get("Division")

    po_names = [po.get("Name") for po in post_offices if po.get("Name")]

    primary_po_detail = PostOfficeDetail(
        name=primary_po_raw.get("Name") or "",
        branch_type=primary_po_raw.get("BranchType"),
        delivery_status=primary_po_raw.get("DeliveryStatus"),
        circle=primary_po_raw.get("Circle"),
        district=primary_po_raw.get("District"),
        division=primary_po_raw.get("Division"),
        region=primary_po_raw.get("Region"),
        state=primary_po_raw.get("State"),
        country=primary_po_raw.get("Country") or "India",
        pincode=primary_po_raw.get("Pincode") or cleaned_pincode,
    )

    # Core Logic: Map to Statutory AYUSH Board
    ayush_board_data = get_ayush_board_details(state)
    ayush_governance = AyushBoardResponse(**ayush_board_data)

    return PincodeLookupResponse(
        pincode=cleaned_pincode,
        district=district,
        state=state,
        region=region,
        division=division,
        post_offices=po_names,
        primary_post_office=primary_po_detail,
        ayush_governance=ayush_governance,
    )
