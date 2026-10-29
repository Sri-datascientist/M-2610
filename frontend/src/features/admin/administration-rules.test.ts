import { describe, expect, it } from "vitest";
import {
  authorize,
  canChangeRoles,
  canSetAccountStatus,
  filterReports,
  prependAudit,
  resolveAccess,
  seedAudit,
  seedDirectory,
  seedSettings,
  settingError,
  type ReportRow,
} from "@/features/admin/administration-data";

const sample: ReportRow = {
  id: "doctor-1",
  category: "Doctor Verification",
  subject: "Dr. Meera Nair",
  status: "Pending Review",
  reviewer: "Unassigned",
  date: "2026-10-08",
  dateLabel: "8 Oct 2026",
  detail: "Kayachikitsa",
};

describe("administration rules", () => {
  it("removes export and manage access when the directory account is inactive", () => {
    expect(
      resolveAccess({ sessionManage: true, sessionExport: true, accountStatus: "Inactive" }),
    ).toEqual({
      manage: false,
      export: false,
    });
    expect(authorize({ manage: false, export: true }, "manage").ok).toBe(false);
    expect(authorize({ manage: false, export: false }, "export").ok).toBe(false);
  });

  it("keeps at least one active platform administrator and blocks self-deactivation", () => {
    const onlyAdmin = seedDirectory.filter((user) => user.roles.includes("Platform Administrator"));
    expect(canChangeRoles(onlyAdmin, "USR-01", ["Auditor"]).ok).toBe(false);
    expect(canSetAccountStatus(seedDirectory, "USR-01", "Inactive", "admin@meyveda.com").ok).toBe(
      false,
    );
    expect(canSetAccountStatus(seedDirectory, "USR-09", "Active", "admin@meyveda.com").ok).toBe(
      true,
    );
  });

  it("appends audit events without changing earlier records", () => {
    const next = prependAudit(seedAudit, {
      id: "EVT-new",
      at: "2026-10-14 16:00",
      user: "Ananya Iyer",
      module: "Settings",
      action: "Updated settings",
      result: "Success",
      detail: "Session timeout",
      kind: "activity",
    });
    expect(next[0]?.id).toBe("EVT-new");
    expect(next.slice(1)).toEqual(seedAudit);
  });

  it("validates allowed setting values and filters reports by date", () => {
    const timeout = seedSettings.find((setting) => setting.id === "session-timeout")!;
    expect(settingError(timeout, "2")).toMatch(/between 5 and 240/);
    expect(settingError(timeout, "30")).toBe("");
    expect(
      filterReports([sample], {
        category: "Doctor Verification",
        status: "all",
        reviewer: "all",
        from: "2026-10-09",
        to: "2026-10-14",
      }),
    ).toEqual([]);
  });
});
