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
            detail="PIN code incorrect.",
        )

    base_url = settings.POSTAL_API_BASE_URL.rstrip("/")
    api_url = f"{base_url}/pincode/{cleaned_pincode}"

    timeout = getattr(settings, "POSTAL_API_TIMEOUT_SECONDS", 5.0)

    # Prefix fallback map for offline / resilient lookup across India
    prefix_2 = cleaned_pincode[:2]
    PIN_PREFIX_FALLBACK: dict[str, tuple[str, str]] = {
        "11": ("New Delhi", "Delhi"),
        "12": ("Gurugram", "Haryana"),
        "13": ("Ambala", "Haryana"),
        "14": ("Amritsar", "Punjab"),
        "15": ("Bathinda", "Punjab"),
        "16": ("Chandigarh", "Chandigarh"),
        "17": ("Shimla", "Himachal Pradesh"),
        "18": ("Jammu", "Jammu and Kashmir"),
        "19": ("Srinagar", "Jammu and Kashmir"),
        "20": ("Aligarh", "Uttar Pradesh"),
        "21": ("Prayagraj", "Uttar Pradesh"),
        "22": ("Lucknow", "Uttar Pradesh"),
        "23": ("Varanasi", "Uttar Pradesh"),
        "24": ("Dehradun", "Uttarakhand"),
        "25": ("Meerut", "Uttar Pradesh"),
        "26": ("Bareilly", "Uttar Pradesh"),
        "27": ("Gorakhpur", "Uttar Pradesh"),
        "28": ("Agra", "Uttar Pradesh"),
        "30": ("Jaipur", "Rajasthan"),
        "31": ("Udaipur", "Rajasthan"),
        "32": ("Kota", "Rajasthan"),
        "33": ("Bikaner", "Rajasthan"),
        "34": ("Jodhpur", "Rajasthan"),
        "36": ("Rajkot", "Gujarat"),
        "37": ("Jamnagar", "Gujarat"),
        "38": ("Ahmedabad", "Gujarat"),
        "39": ("Surat", "Gujarat"),
        "40": ("Mumbai", "Maharashtra"),
        "41": ("Pune", "Maharashtra"),
        "42": ("Nashik", "Maharashtra"),
        "43": ("Chhatrapati Sambhaji Nagar", "Maharashtra"),
        "44": ("Nagpur", "Maharashtra"),
        "45": ("Indore", "Madhya Pradesh"),
        "46": ("Bhopal", "Madhya Pradesh"),
        "47": ("Gwalior", "Madhya Pradesh"),
        "48": ("Jabalpur", "Madhya Pradesh"),
        "49": ("Raipur", "Chhattisgarh"),
        "50": ("Hyderabad", "Telangana"),
        "51": ("Tirupati", "Andhra Pradesh"),
        "52": ("Vijayawada", "Andhra Pradesh"),
        "53": ("Visakhapatnam", "Andhra Pradesh"),
        "56": ("Bengaluru", "Karnataka"),
        "57": ("Mangaluru", "Karnataka"),
        "58": ("Hubballi", "Karnataka"),
        "59": ("Belagavi", "Karnataka"),
        "60": ("Chennai", "Tamil Nadu"),
        "61": ("Thanjavur", "Tamil Nadu"),
        "62": ("Madurai", "Tamil Nadu"),
        "63": ("Salem", "Tamil Nadu"),
        "64": ("Coimbatore", "Tamil Nadu"),
        "67": ("Kozhikode", "Kerala"),
        "68": ("Kochi", "Kerala"),
        "69": ("Thiruvananthapuram", "Kerala"),
        "70": ("Kolkata", "West Bengal"),
        "71": ("Howrah", "West Bengal"),
        "72": ("Midnapore", "West Bengal"),
        "73": ("Siliguri", "West Bengal"),
        "74": ("Nadia", "West Bengal"),
        "75": ("Bhubaneswar", "Odisha"),
        "76": ("Berhampur", "Odisha"),
        "77": ("Sambalpur", "Odisha"),
        "78": ("Guwahati", "Assam"),
        "79": ("Shillong", "Meghalaya"),
        "80": ("Patna", "Bihar"),
        "81": ("Bhagalpur", "Bihar"),
        "82": ("Gaya", "Bihar"),
        "83": ("Ranchi", "Jharkhand"),
        "84": ("Muzaffarpur", "Bihar"),
        "85": ("Purnia", "Bihar"),
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(api_url, headers={"User-Agent": "Meyveda-Platform/1.0"})
    except (httpx.TimeoutException, httpx.RequestError) as exc:
        logger.warning("Postal API error for PIN %s: %s; attempting regional fallback", cleaned_pincode, exc)
        if prefix_2 in PIN_PREFIX_FALLBACK:
            fb_city, fb_state = PIN_PREFIX_FALLBACK[prefix_2]
            ayush_board_data = get_ayush_board_details(fb_state)
            return PincodeLookupResponse(
                pincode=cleaned_pincode,
                district=fb_city,
                state=fb_state,
                region=fb_state,
                division=fb_city,
                post_offices=[f"{fb_city} Head Post Office"],
                primary_post_office=PostOfficeDetail(
                    name=f"{fb_city} H.O",
                    district=fb_city,
                    state=fb_state,
                    pincode=cleaned_pincode,
                ),
                ayush_governance=AyushBoardResponse(**ayush_board_data),
            )
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Postal PIN code verification service timed out.",
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
            detail="PIN code incorrect.",
        )

    first_record = data[0]
    record_status = first_record.get("Status")
    post_offices = first_record.get("PostOffice") or []

    if record_status != "Success" or not post_offices:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PIN code incorrect.",
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
