import { describe, expect, it } from "vitest";
import {
  contentForList,
  filterPublishedContent,
  publishedCounts,
  removePublication,
  restorePublication,
  samplePractitionerContent,
} from "@/features/admin/published-content-data";

const doctors = [
  { id: "DOC-0774", status: "Verified", name: "Dr. Lakshmi Rao" },
  { id: "DOC-0810", status: "Verified", name: "Dr. Hari Prasad" },
  { id: "DOC-1042", status: "Pending Review", name: "Dr. Meera Nair" },
  { id: "DOC-0904", status: "Suspended", name: "Dr. Vikram Joshi" },
];

const publishedFilters = {
  query: "",
  type: "all" as const,
  category: "all",
  from: "",
  to: "",
  list: "Published" as const,
};

describe("published practitioner content", () => {
  it("lists only published records from doctors who are verified now", () => {
    const ids = contentForList(samplePractitionerContent, doctors, "Published").map((item) => item.id);
    expect(ids).toEqual(["PC-1001", "PC-1002", "PC-1003"]);
    expect(publishedCounts(samplePractitionerContent, doctors)).toEqual({
      total: 3,
      articles: 1,
      journals: 1,
      cases: 1,
    });
  });

  it("drops a verified doctor's content when that doctor is no longer verified", () => {
    const suspended = doctors.map((doctor) =>
      doctor.id === "DOC-0774" ? { ...doctor, status: "Suspended" } : doctor,
    );
    const ids = contentForList(samplePractitionerContent, suspended, "Published").map((item) => item.id);
    expect(ids).toEqual(["PC-1002"]);
  });

  it("applies search, type, category, and date together", () => {
    const rows = filterPublishedContent(samplePractitionerContent, doctors, {
      ...publishedFilters,
      query: "lakshmi",
      type: "Article",
      category: "Shalya Tantra",
      from: "2026-09-01",
      to: "2026-09-30",
    });
    expect(rows.map((item) => item.id)).toEqual(["PC-1001"]);
    expect(
      filterPublishedContent(samplePractitionerContent, doctors, {
        ...publishedFilters,
        query: "ashwagandha",
        type: "Case Study",
      }),
    ).toEqual([]);
  });

  it("unpublishes one record and can restore it without removing the others", () => {
    const removed = removePublication(samplePractitionerContent, "PC-1001");
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.items).toHaveLength(samplePractitionerContent.length);
    expect(removed.items.find((item) => item.id === "PC-1001")?.status).toBe("Removed");
    expect(removed.items.find((item) => item.id === "PC-1002")?.status).toBe("Published");
    expect(publishedCounts(removed.items, doctors).total).toBe(2);

    const restored = restorePublication(removed.items, "PC-1001", true);
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(restored.items.find((item) => item.id === "PC-1001")?.status).toBe("Published");
    expect(removePublication(samplePractitionerContent, "missing").ok).toBe(false);
  });
});
