import { apiClient } from "@/services/apiClient";
import { seedDoctors, seedManufacturers, type Doctor, type Manufacturer } from "./catalog-data";

export type AyushGovernanceDetail = {
  board_type: string;
  board_name: string;
  statutory_act: string;
  controlling_authority: string;
  jurisdiction: string;
  official_portal: string;
  description: string;
  region_note?: string;
};

export type TerritoryDoctor = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  specialty: string;
  qualification?: string | null;
  license_number?: string;
  status: string;
  pincode?: string | null;
  city?: string | null;
  state?: string | null;
};

export type TerritoryManufacturer = {
  id: string;
  company: string;
  contact_person?: string | null;
  email?: string | null;
  status: string;
  pincode?: string | null;
  city?: string | null;
  state?: string | null;
};

export type TerritoryDistrict = {
  name: string;
  pincodes: string[];
  doctorCount: number;
  manufacturerCount: number;
  doctors: TerritoryDoctor[];
  manufacturers: TerritoryManufacturer[];
};

export type TerritoryNode = {
  state: string;
  ayushGovernance: AyushGovernanceDetail;
  districts: TerritoryDistrict[];
  totalDoctors: number;
  totalManufacturers: number;
};

export type TerritoryApiResponse = {
  total_states: number;
  total_districts: number;
  total_doctors: number;
  total_manufacturers: number;
  territories: {
    state: string;
    ayush_governance: AyushGovernanceDetail;
    total_doctors: number;
    total_manufacturers: number;
    districts: {
      name: string;
      pincodes: string[];
      doctor_count: number;
      manufacturer_count: number;
      doctors: TerritoryDoctor[];
      manufacturers: TerritoryManufacturer[];
    }[];
  }[];
};

export type TerritoryPincodeLookupResponse = {
  pincode: string;
  district: string;
  state: string;
  region?: string | null;
  division?: string | null;
  post_offices: string[];
  ayush_governance: AyushGovernanceDetail;
  matched_doctors: TerritoryDoctor[];
  matched_manufacturers: TerritoryManufacturer[];
};

// Fallback directory covering Indian States & UTs for offline / instant client resolution
const CLIENT_AYUSH_REGISTRY: Record<string, AyushGovernanceDetail> = {
  "Andhra Pradesh": {
    board_type: "State Statutory Board",
    board_name: "Andhra Pradesh Board of Indian Medicine",
    statutory_act: "Andhra Pradesh Ayurvedic and Homoeopathic Medical Practitioners Act, 1956",
    controlling_authority: "Department of Health, Medical & Family Welfare, Govt. of Andhra Pradesh",
    jurisdiction: "State",
    official_portal: "https://hmfw.ap.gov.in",
    description: "Governs registration and professional practice of Ayurveda, Unani, Siddha, and Yoga practitioners in Andhra Pradesh.",
  },
  "Assam": {
    board_type: "State Statutory Council",
    board_name: "Board of Ayurvedic and Unani Systems of Medicine, Assam",
    statutory_act: "Assam Ayurvedic and Unani Medical Practitioners Act, 1955",
    controlling_authority: "Directorate of AYUSH, Govt. of Assam",
    jurisdiction: "State",
    official_portal: "https://ayush.assam.gov.in",
    description: "Administers licensing, registry maintenance, and ethical compliance of Indian medicine doctors in Assam.",
  },
  "Bihar": {
    board_type: "State Statutory Council",
    board_name: "State Council of Ayurvedic and Unani Medicines, Bihar",
    statutory_act: "Bihar Development of Ayurvedic and Unani Systems of Medicine Act, 1951",
    controlling_authority: "Department of Health, Govt. of Bihar",
    jurisdiction: "State",
    official_portal: "https://state.bihar.gov.in/health",
    description: "Statutory body governing registration and institution oversight for Ayurveda and Unani in Bihar.",
  },
  "Delhi": {
    board_type: "State Statutory Council",
    board_name: "Delhi Bharatiya Chikitsa Parishad (DBCP)",
    statutory_act: "Delhi Bharatiya Chikitsa Parishad Act, 1998",
    controlling_authority: "Directorate of AYUSH, Govt. of NCT of Delhi",
    jurisdiction: "State",
    official_portal: "https://dbcp.delhi.gov.in",
    description: "Statutory council registering and regulating Ayurvedic, Unani, and Siddha medical professionals in Delhi.",
  },
  "Gujarat": {
    board_type: "State Statutory Board",
    board_name: "Gujarat Board of Ayurvedic and Unani Systems of Medicine",
    statutory_act: "Gujarat Medical Practitioners Act, 1963",
    controlling_authority: "Directorate of AYUSH, Health and Family Welfare Department, Govt. of Gujarat",
    jurisdiction: "State",
    official_portal: "https://gujhealth.gujarat.gov.in",
    description: "Regulates Ayurveda and Unani professional accreditations and state educational institutions in Gujarat.",
  },
  "Karnataka": {
    board_type: "State Statutory Board",
    board_name: "Karnataka Ayurvedic and Unani Practitioners' Board (KAUPB)",
    statutory_act: "Karnataka Ayurvedic, Naturopathy, Siddha, Unani and Yoga Practitioners Act, 1961",
    controlling_authority: "Directorate of AYUSH, Govt. of Karnataka",
    jurisdiction: "State",
    official_portal: "https://ayush.karnataka.gov.in",
    description: "Administers licensing, practitioner registries, and ethical standards for AYUSH practitioners in Karnataka.",
  },
  "Kerala": {
    board_type: "State Statutory Council",
    board_name: "Travancore-Cochin Medical Councils (TCMC) - Indigenous Medicine",
    statutory_act: "Travancore-Cochin Medical Practitioners Act, 1953",
    controlling_authority: "Department of AYUSH, Govt. of Kerala",
    jurisdiction: "State",
    official_portal: "https://tcmc.kerala.gov.in",
    description: "Statutory council responsible for clinical registration, ethics, and practice rights of Ayurveda and Siddha doctors in Kerala.",
  },
  "Maharashtra": {
    board_type: "State Statutory Council",
    board_name: "Maharashtra Council of Indian Medicine (MCIM)",
    statutory_act: "Maharashtra Medical Practitioners Act, 1961",
    controlling_authority: "Medical Education and Drugs Department, Govt. of Maharashtra",
    jurisdiction: "State",
    official_portal: "https://mcim.org.in",
    description: "Autonomous statutory council governing verification, state licensing, and institutional standards for Indian medicine in Maharashtra.",
  },
  "Rajasthan": {
    board_type: "State Statutory Board",
    board_name: "Board of Indian Medicine, Rajasthan",
    statutory_act: "Rajasthan Indian Medicine Act, 1953",
    controlling_authority: "Department of Ayurved & Indian Medical Systems, Govt. of Rajasthan",
    jurisdiction: "State",
    official_portal: "https://ayurved.rajasthan.gov.in",
    description: "Regulates institutional admissions, licensing, and professional registry of indigenous practitioners across Rajasthan.",
  },
  "Tamil Nadu": {
    board_type: "State Statutory Board",
    board_name: "Tamil Nadu Board of Indian Medicine",
    statutory_act: "Tamil Nadu Medical Practitioners Act & Siddha Medical Council Directives",
    controlling_authority: "Commissioner of Indian Medicine and Homoeopathy, Govt. of Tamil Nadu",
    jurisdiction: "State",
    official_portal: "https://tnhealth.tn.gov.in",
    description: "Pivotal authority for registration and institutional regulation of Siddha, Ayurveda, and Unani clinicians in Tamil Nadu.",
  },
  "Telangana": {
    board_type: "State Statutory Board",
    board_name: "Telangana Board of Indian Medicine",
    statutory_act: "Telangana Ayurvedic and Homoeopathic Medical Practitioners Act",
    controlling_authority: "Department of Health, Medical & Family Welfare, Govt. of Telangana",
    jurisdiction: "State",
    official_portal: "https://ayush.telangana.gov.in",
    description: "Autonomous state council for accreditation and registration of Ayurveda and Unani doctors in Telangana.",
  },
  "Uttar Pradesh": {
    board_type: "State Statutory Board",
    board_name: "Board of Ayurvedic and Unani Tibbi Systems of Medicine, Uttar Pradesh",
    statutory_act: "United Provinces Indian Medicine Act, 1939 (as adapted by UP)",
    controlling_authority: "Department of AYUSH, Govt. of Uttar Pradesh",
    jurisdiction: "State",
    official_portal: "https://ayush.up.gov.in",
    description: "Directs practitioner certifications, renewals, and educational clinic accreditations across Uttar Pradesh.",
  },
  "West Bengal": {
    board_type: "State Statutory Council",
    board_name: "Paschim Banga Ayurved Parishad",
    statutory_act: "Paschim Banga Ayurvedic System of Medicine Act, 1961",
    controlling_authority: "Department of Health and Family Welfare (AYUSH Branch), Govt. of West Bengal",
    jurisdiction: "State",
    official_portal: "https://wbhealth.gov.in",
    description: "Oversees registry, educational guidelines, and ethical conduct of Ayurvedic clinicians in West Bengal.",
  },
};

const DEFAULT_CENTRAL_GOVERNANCE: AyushGovernanceDetail = {
  board_type: "Central Regulatory Body",
  board_name: "National Commission for Indian System of Medicine (NCISM) & Ministry of AYUSH",
  statutory_act: "National Commission for Indian System of Medicine Act, 2020",
  controlling_authority: "Ministry of AYUSH, Government of India",
  jurisdiction: "Central",
  official_portal: "https://ayush.gov.in",
  description: "Governed under central regulatory oversight and National AYUSH Mission (NAM) statutory directives.",
};

export function getClientAyushBoard(stateName: string): AyushGovernanceDetail {
  const clean = stateName.trim();
  const directMatch = CLIENT_AYUSH_REGISTRY[clean];
  if (directMatch) return directMatch;

  for (const [key, val] of Object.entries(CLIENT_AYUSH_REGISTRY)) {
    if (key.toLowerCase() === clean.toLowerCase()) {
      return val;
    }
  }

  return {
    ...DEFAULT_CENTRAL_GOVERNANCE,
    region_note: `Region '${stateName}' operates under Central oversight governed by the NCISM Act, 2020.`,
  };
}

export function buildTerritoryData(
  doctors: Doctor[],
  manufacturers: Manufacturer[],
): TerritoryNode[] {
  const stateMap = new Map<
    string,
    {
      districts: Map<
        string,
        {
          pincodes: Set<string>;
          doctors: TerritoryDoctor[];
          manufacturers: TerritoryManufacturer[];
        }
      >;
    }
  >();

  // Process doctors
  doctors.forEach((doc) => {
    const state = doc.state || "Kerala";
    const district = doc.city || "General";
    if (!stateMap.has(state)) {
      stateMap.set(state, { districts: new Map() });
    }
    const distMap = stateMap.get(state)!.districts;
    if (!distMap.has(district)) {
      distMap.set(district, { pincodes: new Set(), doctors: [], manufacturers: [] });
    }
    const distEntry = distMap.get(district)!;
    if (doc.pincode) distEntry.pincodes.add(doc.pincode);

    distEntry.doctors.push({
      id: doc.id,
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      specialty: doc.specialization || "Ayurveda",
      qualification: doc.qualification || "BAMS",
      license_number: doc.registrationNumber,
      status: doc.status,
      pincode: doc.pincode,
      city: doc.city,
      state: doc.state,
    });
  });

  // Process manufacturers
  manufacturers.forEach((mfr) => {
    const state = mfr.state || "Kerala";
    const district = mfr.city || "General";
    if (!stateMap.has(state)) {
      stateMap.set(state, { districts: new Map() });
    }
    const distMap = stateMap.get(state)!.districts;
    if (!distMap.has(district)) {
      distMap.set(district, { pincodes: new Set(), doctors: [], manufacturers: [] });
    }
    const distEntry = distMap.get(district)!;
    if (mfr.pincode) distEntry.pincodes.add(mfr.pincode);

    distEntry.manufacturers.push({
      id: mfr.id,
      company: mfr.company,
      contact_person: (mfr as any).contactPerson || mfr.contact,
      email: mfr.email,
      status: mfr.status,
      pincode: mfr.pincode,
      city: mfr.city,
      state: mfr.state,
    });
  });

  const result: TerritoryNode[] = [];
  stateMap.forEach((data, state) => {
    const districtList: TerritoryDistrict[] = [];
    let stateDoctors = 0;
    let stateMfrs = 0;

    data.districts.forEach((dData, districtName) => {
      districtList.push({
        name: districtName,
        pincodes: Array.from(dData.pincodes).sort(),
        doctorCount: dData.doctors.length,
        manufacturerCount: dData.manufacturers.length,
        doctors: dData.doctors,
        manufacturers: dData.manufacturers,
      });
      stateDoctors += dData.doctors.length;
      stateMfrs += dData.manufacturers.length;
    });

    result.push({
      state,
      ayushGovernance: getClientAyushBoard(state),
      districts: districtList.sort((a, b) => a.name.localeCompare(b.name)),
      totalDoctors: stateDoctors,
      totalManufacturers: stateMfrs,
    });
  });

  return result.sort((a, b) => a.state.localeCompare(b.state));
}

export async function fetchTerritoryFromApi(): Promise<{
  totalStates: number;
  totalDistricts: number;
  totalDoctors: number;
  totalManufacturers: number;
  territories: TerritoryNode[];
}> {
  try {
    const res = await apiClient.get<TerritoryApiResponse>("/territory");
    if (res && Array.isArray(res.territories) && res.territories.length > 0) {
      const formatted: TerritoryNode[] = res.territories.map((t) => ({
        state: t.state,
        ayushGovernance: t.ayush_governance,
        totalDoctors: t.total_doctors,
        totalManufacturers: t.total_manufacturers,
        districts: (t.districts || []).map((d) => ({
          name: d.name,
          pincodes: d.pincodes || [],
          doctorCount: d.doctor_count,
          manufacturerCount: d.manufacturer_count,
          doctors: d.doctors || [],
          manufacturers: d.manufacturers || [],
        })),
      }));

      return {
        totalStates: res.total_states,
        totalDistricts: res.total_districts,
        totalDoctors: res.total_doctors,
        totalManufacturers: res.total_manufacturers,
        territories: formatted,
      };
    }
  } catch (err) {
    console.warn("Backend /territory API unreachable, falling back to local dataset:", err);
  }

  // Resilient fallback
  const fallbackNodes = buildTerritoryData(seedDoctors, seedManufacturers);
  return {
    totalStates: fallbackNodes.length,
    totalDistricts: fallbackNodes.reduce((sum, s) => sum + s.districts.length, 0),
    totalDoctors: fallbackNodes.reduce((sum, s) => sum + s.totalDoctors, 0),
    totalManufacturers: fallbackNodes.reduce((sum, s) => sum + s.totalManufacturers, 0),
    territories: fallbackNodes,
  };
}

export async function lookupPincodeTerritory(pincode: string): Promise<TerritoryPincodeLookupResponse> {
  const clean = pincode.trim();
  try {
    const res = await apiClient.get<TerritoryPincodeLookupResponse>(`/territory/lookup/${clean}`);
    if (res && res.pincode) return res;
  } catch (err) {
    console.warn("API /territory/lookup error, attempting direct /pincode fallback:", err);
  }

  // Fallback direct /pincode endpoint
  const direct = await apiClient.get<any>(`/pincode/${clean}`);
  return {
    pincode: direct.pincode,
    district: direct.district,
    state: direct.state,
    region: direct.region,
    division: direct.division,
    post_offices: direct.post_offices || [],
    ayush_governance: direct.ayush_governance || getClientAyushBoard(direct.state || ""),
    matched_doctors: [],
    matched_manufacturers: [],
  };
}

export const initialTerritories = buildTerritoryData(seedDoctors, seedManufacturers);
