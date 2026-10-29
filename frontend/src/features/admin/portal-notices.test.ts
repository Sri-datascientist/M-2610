import { describe, expect, it } from "vitest";
import { phaseNotices } from "@/features/admin/portal-notices";

const retired = ["Verification", "Content Moderation", "Security & Access", "Compliance Register", "Knowledge Governance"];

describe("Phase 1 notification inbox", () => {
  it("uses current modules and admin routes", () => {
    expect(phaseNotices.length).toBeGreaterThan(0);
    for (const notice of phaseNotices) {
      expect(retired).not.toContain(notice.module);
      expect(notice.to.startsWith("/admin/")).toBe(true);
    }
    expect(phaseNotices.find((item) => item.id === "notice-meera")?.doctorSlug).toBe("meera-nair");
    expect(phaseNotices.find((item) => item.id === "notice-anjali")?.doctorSlug).toBe("anjali-menon");
  });
});
