import { describe, expect, it } from "vitest";
import { seedDoctors } from "@/features/admin/catalog-data";
import { doctorSlugMap, findDoctorBySlug } from "@/features/admin/doctor-slug";

describe("doctor profile slugs", () => {
  const slugs = doctorSlugMap(seedDoctors);

  it("builds a readable slug from each doctor's name", () => {
    expect(slugs.get("DOC-1042")).toBe("meera-nair");
    expect(slugs.get("DOC-1048")).toBe("anjali-menon");
    expect(slugs.get("DOC-0988")).toBe("arjun-deshmukh");
    expect(slugs.get("DOC-1011")).toBe("suniti-sharma");
    expect(slugs.get("DOC-0774")).toBe("lakshmi-rao");
    expect(slugs.get("DOC-0810")).toBe("hari-prasad");
    expect(slugs.get("DOC-1102")).toBe("fatima-qureshi");
    expect(slugs.get("DOC-0904")).toBe("vikram-joshi");
  });

  it("keeps every slug unique", () => {
    expect(new Set(slugs.values()).size).toBe(seedDoctors.length);
  });

  it("adds the doctor id when two doctors share a name", () => {
    const shared = [
      { id: "DOC-1042", name: "Dr. Meera Nair" },
      { id: "DOC-2201", name: "Dr. Meera Nair" },
    ];
    const map = doctorSlugMap(shared);
    expect(map.get("DOC-1042")).toBe("meera-nair-doc-1042");
    expect(map.get("DOC-2201")).toBe("meera-nair-doc-2201");
    expect(findDoctorBySlug(shared, "meera-nair")).toBeUndefined();
    expect(findDoctorBySlug(shared, "meera-nair-doc-2201")?.id).toBe("DOC-2201");
  });

  it("finds the seed doctor for a direct profile URL", () => {
    expect(findDoctorBySlug(seedDoctors, "meera-nair")?.id).toBe("DOC-1042");
    expect(findDoctorBySlug(seedDoctors, "missing-doctor")).toBeUndefined();
  });
});