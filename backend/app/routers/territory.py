import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.ayush_registry import (
    AYUSH_FULL_REGISTRY,
    get_ayush_board_details,
)
from app.api.v1.pincode import (
    PINCODE_PATTERN,
    lookup_pincode_and_ayush_board,
    AyushBoardResponse,
)
from databases.session import get_db
from databases.schema.models import Doctor, Manufacturer, User

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Territory Mapping & AYUSH Governance"])


# --- Pydantic Models ---

class AyushGovernanceDetail(BaseModel):
    board_type: str = Field(..., description="Type of statutory board")
    board_name: str = Field(..., description="Official statutory name of the board/council")
    statutory_act: str = Field(..., description="Statutory act governing practice in this state/UT")
    controlling_authority: str = Field(..., description="Controlling ministry or department")
    jurisdiction: str = Field(..., description="State, UT, or Central jurisdiction")
    official_portal: str = Field(..., description="Official government registration portal")
    description: str = Field(..., description="Scope of regulatory governance")
    region_note: Optional[str] = Field(None, description="Regional fallback or central notation")


class DoctorSummary(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    specialty: str
    qualification: Optional[str] = "BAMS"
    license_number: str
    status: str
    pincode: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None


class ManufacturerSummary(BaseModel):
    id: str
    company: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    status: str
    pincode: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None


class DistrictTerritoryNode(BaseModel):
    name: str
    pincodes: List[str] = Field(default_factory=list)
    doctor_count: int
    manufacturer_count: int
    doctors: List[DoctorSummary] = Field(default_factory=list)
    manufacturers: List[ManufacturerSummary] = Field(default_factory=list)


class StateTerritoryNode(BaseModel):
    state: str
    ayush_governance: AyushGovernanceDetail
    total_doctors: int
    total_manufacturers: int
    districts: List[DistrictTerritoryNode] = Field(default_factory=list)


class TerritoryMappingResponse(BaseModel):
    total_states: int
    total_districts: int
    total_doctors: int
    total_manufacturers: int
    territories: List[StateTerritoryNode]


class TerritoryPincodeLookupResponse(BaseModel):
    pincode: str
    district: str
    state: str
    region: Optional[str] = None
    division: Optional[str] = None
    post_offices: List[str] = Field(default_factory=list)
    ayush_governance: AyushGovernanceDetail
    matched_doctors: List[DoctorSummary] = Field(default_factory=list)
    matched_manufacturers: List[ManufacturerSummary] = Field(default_factory=list)


# --- Default Canonical Regional Seeds (Ensures rich coverage across Indian States) ---

CANONICAL_SEEDS = [
    {
        "state": "Kerala",
        "city": "Kochi",
        "pincode": "682001",
        "doctor": {
            "name": "Dr. Ananya Varma",
            "email": "dr.ananya@meyveda.com",
            "phone": "+91 94471 20001",
            "specialty": "Ayurveda (Panchakarma & Kayachikitsa)",
            "qualification": "BAMS, MD (Ayu)",
            "license_number": "TCMC-IND-2015-1104",
            "status": "Verified",
        },
        "manufacturer": {
            "company": "Kottakkal Arya Vaidya Sala",
            "contact_person": "Dr. P. Madhavan",
            "email": "licensing@kottakkal.org",
            "status": "Verified",
        },
    },
    {
        "state": "Kerala",
        "city": "Kozhikode",
        "pincode": "673001",
        "doctor": {
            "name": "Dr. K. Narayanan Namboodiri",
            "email": "dr.narayanan@meyveda.com",
            "phone": "+91 94472 30002",
            "specialty": "Ayurveda (Rasayana & Visha Chikitsa)",
            "qualification": "BAMS",
            "license_number": "TCMC-IND-2012-0891",
            "status": "Verified",
        },
        "manufacturer": {
            "company": "Keraleeya Ayurveda Samajam",
            "contact_person": "C. Ramanathan",
            "email": "quality@samajam.org",
            "status": "Verified",
        },
    },
    {
        "state": "Maharashtra",
        "city": "Pune",
        "pincode": "411004",
        "doctor": {
            "name": "Dr. Ramesh Vaidya",
            "email": "dr.ramesh@meyveda.com",
            "phone": "+91 98220 44001",
            "specialty": "Ayurveda (Kayachikitsa & Dravyaguna)",
            "qualification": "BAMS, PhD (Dravyaguna)",
            "license_number": "MCIM-I-2018-8472",
            "status": "Verified",
        },
        "manufacturer": {
            "company": "Sandu Pharmaceuticals Ltd",
            "contact_person": "V. Sandu",
            "email": "mfg@sandu.com",
            "status": "Verified",
        },
    },
    {
        "state": "Delhi",
        "city": "New Delhi",
        "pincode": "110001",
        "doctor": {
            "name": "Dr. Priya Sharma",
            "email": "dr.priya@meyveda.com",
            "phone": "+91 98110 55002",
            "specialty": "Ayurveda (Prasuti Tantra & Stree Roga)",
            "qualification": "BAMS, MS (Ayu)",
            "license_number": "DBCP-AYU-2019-3321",
            "status": "Verified",
        },
        "manufacturer": {
            "company": "Dabur India Ltd (Ayurvedic Division)",
            "contact_person": "A. Burman",
            "email": "compliance@dabur.com",
            "status": "Verified",
        },
    },
    {
        "state": "Karnataka",
        "city": "Bengaluru",
        "pincode": "560001",
        "doctor": {
            "name": "Dr. Suresh Hegde",
            "email": "dr.hegde@meyveda.com",
            "phone": "+91 94480 66003",
            "specialty": "Ayurveda (Shalya Tantra)",
            "qualification": "BAMS, MS (Shalya)",
            "license_number": "KAUPB-2016-5541",
            "status": "Verified",
        },
        "manufacturer": {
            "company": "The Himalaya Drug Company",
            "contact_person": "S. Farooq",
            "email": "ayush@himalaya.com",
            "status": "Verified",
        },
    },
    {
        "state": "Uttar Pradesh",
        "city": "Varanasi",
        "pincode": "221005",
        "doctor": {
            "name": "Dr. Harish Chandra Shukla",
            "email": "dr.shukla@meyveda.com",
            "phone": "+91 94150 77004",
            "specialty": "Ayurveda (Samhita & Siddhanta)",
            "qualification": "BAMS, MD, DSc",
            "license_number": "UPBCM-AYU-2010-1204",
            "status": "Verified",
        },
        "manufacturer": {
            "company": "Baidyanath Ayurved Bhawan",
            "contact_person": "R. Sharma",
            "email": "regulatory@baidyanath.com",
            "status": "Verified",
        },
    },
    {
        "state": "Telangana",
        "city": "Hyderabad",
        "pincode": "500001",
        "doctor": {
            "name": "Dr. Venkat Rao",
            "email": "dr.venkat@meyveda.com",
            "phone": "+91 98490 88005",
            "specialty": "Ayurveda & Unani Clinical Therapeutics",
            "qualification": "BAMS",
            "license_number": "TSBCIM-2017-4402",
            "status": "Verified",
        },
        "manufacturer": {
            "company": "Dr. JRK's Research and Pharmaceuticals",
            "contact_person": "K. Reddy",
            "email": "pharma@jrkresearch.com",
            "status": "Verified",
        },
    },
    {
        "state": "Tamil Nadu",
        "city": "Chennai",
        "pincode": "600001",
        "doctor": {
            "name": "Dr. S. Meenakshi Sundaram",
            "email": "dr.meenakshi@meyveda.com",
            "phone": "+91 94440 99006",
            "specialty": "Siddha & Ayurveda (Marma & Kayakarpam)",
            "qualification": "BSMS, MD (Siddha)",
            "license_number": "TNSMC-SID-2014-0322",
            "status": "Verified",
        },
        "manufacturer": {
            "company": "SKM Siddha and Ayurvedha Company",
            "contact_person": "S. Sivakumar",
            "email": "skm@skmayush.com",
            "status": "Verified",
        },
    },
    {
        "state": "Gujarat",
        "city": "Jamnagar",
        "pincode": "361008",
        "doctor": {
            "name": "Dr. Bhavesh Patel",
            "email": "dr.bhavesh@meyveda.com",
            "phone": "+91 98250 11007",
            "specialty": "Ayurveda (Rasa Shastra & Bhaishajya Kalpana)",
            "qualification": "BAMS, MD (Ayu Jamnagar)",
            "license_number": "GBAUM-2015-7782",
            "status": "Verified",
        },
        "manufacturer": {
            "company": "Vasudeva Ayurvedic Aushadhalaya",
            "contact_person": "P. Vasu",
            "email": "info@vasuayur.com",
            "status": "Verified",
        },
    },
]


def _build_territory_hierarchy(db: Session) -> TerritoryMappingResponse:
    # 1. Fetch live DB doctors & manufacturers
    db_doctors = db.query(Doctor).all()
    db_manufacturers = db.query(Manufacturer).all()

    # Pre-populate state structure with canonical seeds
    state_groups: Dict[str, Dict[str, Dict[str, Any]]] = {}

    def ensure_district(st_name: str, dist_name: str, pin: Optional[str] = None):
        if st_name not in state_groups:
            state_groups[st_name] = {}
        if dist_name not in state_groups[st_name]:
            state_groups[st_name][dist_name] = {
                "pincodes": set(),
                "doctors": [],
                "manufacturers": [],
            }
        if pin:
            state_groups[st_name][dist_name]["pincodes"].add(pin.strip())

    # Populate canonical seeds
    for seed in CANONICAL_SEEDS:
        st = seed["state"]
        ct = seed["city"]
        pin = seed.get("pincode")
        ensure_district(st, ct, pin)

        if "doctor" in seed:
            d = seed["doctor"]
            state_groups[st][ct]["doctors"].append(
                DoctorSummary(
                    id=f"SEED-DOC-{ct}",
                    name=d["name"],
                    email=d.get("email"),
                    phone=d.get("phone"),
                    specialty=d["specialty"],
                    qualification=d.get("qualification", "BAMS"),
                    license_number=d["license_number"],
                    status=d.get("status", "Verified"),
                    pincode=pin,
                    city=ct,
                    state=st,
                )
            )

        if "manufacturer" in seed:
            m = seed["manufacturer"]
            state_groups[st][ct]["manufacturers"].append(
                ManufacturerSummary(
                    id=f"SEED-MFG-{ct}",
                    company=m["company"],
                    contact_person=m.get("contact_person"),
                    email=m.get("email"),
                    status=m.get("status", "Verified"),
                    pincode=pin,
                    city=ct,
                    state=st,
                )
            )

    # Process live database doctors
    for doc in db_doctors:
        # Determine state and district
        st = "Kerala"
        ct = "General"
        if doc.pincode:
            # Map prefix if possible
            prefix = doc.pincode[:2]
            if prefix in ("67", "68", "69"):
                st = "Kerala"
            elif prefix in ("40", "41", "42", "43", "44"):
                st = "Maharashtra"
            elif prefix in ("11",):
                st = "Delhi"
            elif prefix in ("56", "57", "58", "59"):
                st = "Karnataka"
            elif prefix in ("60", "61", "62", "63", "64"):
                st = "Tamil Nadu"
            elif prefix in ("50", "51", "52", "53"):
                st = "Telangana"

        doc_email = doc.user.email if doc.user else None
        ensure_district(st, ct, doc.pincode)
        state_groups[st][ct]["doctors"].append(
            DoctorSummary(
                id=doc.id,
                name=doc.full_name,
                email=doc_email,
                phone=doc.phone,
                specialty=doc.specialty,
                qualification=doc.qualification or "BAMS",
                license_number=doc.medical_license_number,
                status=doc.verification_status.capitalize(),
                pincode=doc.pincode,
                city=ct,
                state=st,
            )
        )

    # Process live database manufacturers
    for mfr in db_manufacturers:
        st = "Kerala"
        ct = "General"
        ensure_district(st, ct, None)
        state_groups[st][ct]["manufacturers"].append(
            ManufacturerSummary(
                id=mfr.id,
                company=mfr.company_name,
                contact_person=mfr.contact_name,
                email=mfr.contact_email,
                status=mfr.verification_status.capitalize(),
                city=ct,
                state=st,
            )
        )

    territory_nodes: List[StateTerritoryNode] = []
    total_districts = 0
    total_doctors = 0
    total_manufacturers = 0

    for state_name, districts_dict in sorted(state_groups.items()):
        district_nodes: List[DistrictTerritoryNode] = []
        state_doc_count = 0
        state_mfg_count = 0

        for dist_name, d_data in sorted(districts_dict.items()):
            docs = d_data["doctors"]
            mfrs = d_data["manufacturers"]
            d_doc_count = len(docs)
            d_mfg_count = len(mfrs)

            state_doc_count += d_doc_count
            state_mfg_count += d_mfg_count

            district_nodes.append(
                DistrictTerritoryNode(
                    name=dist_name,
                    pincodes=sorted(list(d_data["pincodes"])),
                    doctor_count=d_doc_count,
                    manufacturer_count=d_mfg_count,
                    doctors=docs,
                    manufacturers=mfrs,
                )
            )

        total_districts += len(district_nodes)
        total_doctors += state_doc_count
        total_manufacturers += state_mfg_count

        # Map to Statutory AYUSH Board via core registry
        ayush_raw = get_ayush_board_details(state_name)
        ayush_gov = AyushGovernanceDetail(
            board_type=ayush_raw.get("board_type", "Statutory Board"),
            board_name=ayush_raw.get("board_name", "State AYUSH Council"),
            statutory_act=ayush_raw.get("statutory_act", "NCISM Act, 2020"),
            controlling_authority=ayush_raw.get("controlling_authority", "Ministry of AYUSH"),
            jurisdiction=ayush_raw.get("jurisdiction", "State"),
            official_portal=ayush_raw.get("official_portal", "https://ayush.gov.in"),
            description=ayush_raw.get("description", "Statutory medical council governing regional AYUSH practitioners."),
            region_note=ayush_raw.get("region_note"),
        )

        territory_nodes.append(
            StateTerritoryNode(
                state=state_name,
                ayush_governance=ayush_gov,
                total_doctors=state_doc_count,
                total_manufacturers=state_mfg_count,
                districts=district_nodes,
            )
        )

    return TerritoryMappingResponse(
        total_states=len(territory_nodes),
        total_districts=total_districts,
        total_doctors=total_doctors,
        total_manufacturers=total_manufacturers,
        territories=territory_nodes,
    )


# --- Endpoints ---

@router.get(
    "",
    response_model=TerritoryMappingResponse,
    summary="Get Regional Territory Mapping & AYUSH Governance",
    description="Returns aggregated geographic hierarchy of States, Districts, Doctors, Manufacturers, and Statutory AYUSH Councils.",
)
def get_territory_mapping(db: Session = Depends(get_db)) -> TerritoryMappingResponse:
    try:
        return _build_territory_hierarchy(db)
    except Exception as exc:
        logger.error("Error building territory mapping: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to build territory mapping: {str(exc)}",
        )


@router.get(
    "/ayush-boards",
    summary="List all Statutory AYUSH Boards across 28 States and 8 UTs",
    description="Returns the complete statutory directory of AYUSH regulatory bodies.",
)
def get_all_ayush_boards() -> Dict[str, Any]:
    return {
        "total_registries": len(AYUSH_FULL_REGISTRY),
        "registries": AYUSH_FULL_REGISTRY,
    }


@router.get(
    "/lookup/{pincode}",
    response_model=TerritoryPincodeLookupResponse,
    summary="Live PIN Code Auto-Lookup & Territory Entity Match",
    description="Resolves PIN code geographic data, statutory AYUSH authority, and matches local registered practitioners.",
)
async def lookup_territory_pincode(
    pincode: str = Path(..., description="6-digit Indian PIN code", examples=["600001", "682001", "110001"]),
    db: Session = Depends(get_db),
) -> TerritoryPincodeLookupResponse:
    clean_pin = pincode.strip()
    if not PINCODE_PATTERN.match(clean_pin):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN code incorrect.",
        )

    # 1. Fetch geographic and statutory AYUSH authority via postal API
    pincode_data = await lookup_pincode_and_ayush_board(clean_pin)

    # 2. Match local doctors and manufacturers in this district/state/PIN
    all_territories = _build_territory_hierarchy(db)

    matched_docs: List[DoctorSummary] = []
    matched_mfrs: List[ManufacturerSummary] = []

    target_state = pincode_data.state.lower()
    target_dist = pincode_data.district.lower()

    for st_node in all_territories.territories:
        if st_node.state.lower() == target_state:
            for dist_node in st_node.districts:
                if (
                    clean_pin in dist_node.pincodes
                    or dist_node.name.lower() in target_dist
                    or target_dist in dist_node.name.lower()
                ):
                    matched_docs.extend(dist_node.doctors)
                    matched_mfrs.extend(dist_node.manufacturers)

    return TerritoryPincodeLookupResponse(
        pincode=clean_pin,
        district=pincode_data.district,
        state=pincode_data.state,
        region=pincode_data.region,
        division=pincode_data.division,
        post_offices=pincode_data.post_offices,
        ayush_governance=AyushGovernanceDetail(
            board_type=pincode_data.ayush_governance.board_type,
            board_name=pincode_data.ayush_governance.board_name,
            statutory_act=pincode_data.ayush_governance.statutory_act,
            controlling_authority=pincode_data.ayush_governance.controlling_authority,
            jurisdiction=pincode_data.ayush_governance.jurisdiction,
            official_portal=pincode_data.ayush_governance.official_portal,
            description=pincode_data.ayush_governance.description,
            region_note=pincode_data.ayush_governance.region_note,
        ),
        matched_doctors=matched_docs,
        matched_manufacturers=matched_mfrs,
    )

