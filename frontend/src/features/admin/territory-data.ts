import { seedDoctors, seedManufacturers, type Doctor, type Manufacturer } from "./catalog-data";

export type TerritoryNode = {
  state: string;
  districts: {
    name: string;
    pincodes: string[];
    doctorCount: number;
    manufacturerCount: number;
    doctors: Doctor[];
    manufacturers: Manufacturer[];
  }[];
  totalDoctors: number;
  totalManufacturers: number;
};

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
          doctors: Doctor[];
          manufacturers: Manufacturer[];
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
    distEntry.doctors.push(doc);
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
    distEntry.manufacturers.push(mfr);
  });

  const result: TerritoryNode[] = [];
  stateMap.forEach((data, state) => {
    const districtList: TerritoryNode["districts"] = [];
    let stateDoctors = 0;
    let stateMfrs = 0;

    data.districts.forEach((dData, districtName) => {
      districtList.push({
        name: districtName,
        pincodes: Array.from(dData.pincodes),
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
      districts: districtList.sort((a, b) => a.name.localeCompare(b.name)),
      totalDoctors: stateDoctors,
      totalManufacturers: stateMfrs,
    });
  });

  return result.sort((a, b) => a.state.localeCompare(b.state));
}

export const initialTerritories = buildTerritoryData(seedDoctors, seedManufacturers);
