import { describe, expect, it } from "vitest";
import {
  canApproveCase,
  canCloseSafety,
  canReleaseBatch,
  compareFormulation,
  reportedProductLabel,
  seedBatches,
  seedCases,
  seedSafety,
} from "@/features/admin/compliance-data";

describe("compliance review rules", () => {
  it("keeps a documented batch unreleased until the checklist is complete", () => {
    const batch = seedBatches.find((item) => item.id === "DSH-0912");
    expect(batch?.documentsOnFile.length).toBeGreaterThan(0);
    expect(canReleaseBatch(batch!).ok).toBe(false);
  });

  it("allows release only after the checklist is complete and the batch is not quarantined", () => {
    const waiting = seedBatches.find((item) => item.id === "YOG-0771")!;
    expect(canReleaseBatch(waiting).ok).toBe(false);
    expect(
      canReleaseBatch({
        ...waiting,
        checklist: waiting.checklist.map((item) => ({ ...item, done: true })),
      }).ok,
    ).toBe(true);
    const quarantined = seedBatches.find((item) => item.id === "CHP-3304")!;
    expect(
      canReleaseBatch({
        ...quarantined,
        checklist: quarantined.checklist.map((item) => ({ ...item, done: true })),
      }).ok,
    ).toBe(false);
  });

  it("blocks case approval while a required anonymization check is open", () => {
    const item = seedCases.find((entry) => entry.id === "CASE-441")!;
    expect(canApproveCase(item).ok).toBe(false);
    const ready = seedCases.find((entry) => entry.id === "CASE-438")!;
    expect(canApproveCase(ready).ok).toBe(true);
  });

  it("shows the manufacturer from the reported batch, not from the product name", () => {
    const triphala = seedSafety.find((item) => item.id === "ADR-2041")!;
    const ashwagandha = seedSafety.find((item) => item.id === "ADR-1988")!;
    const withoutBatch = seedSafety.find((item) => item.id === "ADR-2055")!;
    expect(reportedProductLabel(triphala, seedBatches)).toBe(
      "Triphala Guggulu – Arya Vaidya Sala",
    );
    expect(reportedProductLabel(ashwagandha, seedBatches)).toBe(
      "Ashwagandha Churna – Himalaya Wellness",
    );
    expect(reportedProductLabel(withoutBatch, seedBatches)).toBe("Yogaraja Guggulu");
    expect(
      reportedProductLabel(
        { product: "Triphala Guggulu", batchId: "ASH-24018" },
        seedBatches,
      ),
    ).toBe("Triphala Guggulu – Himalaya Wellness");
    expect(
      reportedProductLabel({ product: "Triphala Guggulu", batchId: "MISSING" }, seedBatches),
    ).toBe("Triphala Guggulu");
  });

  it("requires a reviewer assessment before a safety case can close", () => {
    const open = seedSafety.find((item) => item.id === "ADR-2041")!;
    expect(canCloseSafety(open).ok).toBe(false);
    expect(
      canCloseSafety({
        ...open,
        assessedSeverity: "Serious",
        assessmentNote: "Reviewer note recorded.",
      }).ok,
    ).toBe(true);
  });

  it("marks quantity changes without dropping the previous formulation line", () => {
    const diffs = compareFormulation(
      [{ ingredient: "Haritaki", part: "Fruit rind", quantity: "1 part" }],
      [{ ingredient: "Haritaki", part: "Fruit rind", quantity: "1.2 parts" }],
    );
    expect(diffs).toEqual([
      {
        ingredient: "Haritaki",
        part: "Fruit rind",
        previous: "1 part",
        submitted: "1.2 parts",
        change: "Changed",
      },
    ]);
  });
});
