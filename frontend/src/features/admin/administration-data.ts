import type { Doctor, Manufacturer } from "@/features/admin/catalog-data";
import type {
  ActionResult,
  Batch,
  ClinicalCase,
  SafetyCase,
  Submission,
} from "@/features/admin/compliance-data";

export const adminRoles = [
  "Platform Administrator",
  "Doctor Verification Reviewer",
  "Manufacturer Reviewer",
  "Medicine Approval Reviewer",
  "Quality Reviewer",
  "Safety Reviewer",
  "Knowledge Editor",
  "Auditor",
  "Read-Only User",
] as const;
export type AdminRole = (typeof adminRoles)[number];

export const permissions = [
  "View records",
  "Review doctors",
  "Review manufacturers",
  "Review medicines",
  "Review quality",
  "Review safety",
  "Edit knowledge",
  "Export reports",
  "Manage users",
  "Change settings",
  "Read the audit log",
] as const;
export type Permission = (typeof permissions)[number];

const view = ["View records"] as const;
const auditRead = ["Read the audit log"] as const;

export const rolePermissions: Record<AdminRole, readonly Permission[]> = {
  "Platform Administrator": permissions,
  "Doctor Verification Reviewer": [...view, "Review doctors", ...auditRead],
  "Manufacturer Reviewer": [...view, "Review manufacturers", ...auditRead],
  "Medicine Approval Reviewer": [...view, "Review medicines", ...auditRead],
  "Quality Reviewer": [...view, "Review quality", ...auditRead],
  "Safety Reviewer": [...view, "Review safety", ...auditRead],
  "Knowledge Editor": [...view, "Edit knowledge"],
  Auditor: [...view, "Export reports", ...auditRead],
  "Read-Only User": view,
};

export const reportCategories = [
  "Doctor Verification",
  "Manufacturer Verification",
  "Medicine Approvals",
  "Quality & Batches",
  "Safety & ADR",
  "Clinical Case Reviews",
  "Platform Activity",
] as const;
export type ReportCategory = (typeof reportCategories)[number];

export type ReportRow = {
  id: string;
  category: ReportCategory;
  subject: string;
  status: string;
  reviewer: string;
  date: string;
  dateLabel: string;
  detail: string;
};

export type AccountStatus = "Active" | "Inactive";

export type DirectoryUser = {
  id: string;
  name: string;
  email: string;
  roles: AdminRole[];
  status: AccountStatus;
  lastActivity: string;
  lastActivityLabel: string;
};

export type AuditResult = "Success" | "Denied" | "Failed";
export type AuditKind = "activity" | "security";

export type AuditEvent = {
  id: string;
  at: string;
  user: string;
  module: string;
  action: string;
  result: AuditResult;
  detail: string;
  kind: AuditKind;
};

export type PlatformSetting = {
  id: string;
  label: string;
  description: string;
  kind: "text" | "number" | "boolean";
  value: string;
  sensitive: boolean;
};

export type Access = { manage: boolean; export: boolean };

const months: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

export function displayToIso(value: string) {
  const [day, month, year] = value.split(" ");
  const mm = months[month ?? ""];
  if (!day || !mm || !year) return "";
  return `${year}-${mm}-${day.padStart(2, "0")}`;
}

export function formatIsoDate(iso: string) {
  const [year, month, day] = iso.split("-");
  const label = Object.entries(months).find(([, value]) => value === month)?.[0];
  if (!year || !label || !day) return iso;
  return `${Number(day)} ${label} ${year}`;
}

function reviewerFor(status: string, history: { by: string }[]) {
  if (["Pending Review", "New", "Awaiting Review", "Draft"].includes(status)) return "Unassigned";
  return history[0]?.by ?? "Unassigned";
}

function report(
  category: ReportCategory,
  id: string,
  subject: string,
  status: string,
  reviewer: string,
  dateLabel: string,
  detail: string,
): ReportRow {
  return {
    id: `${category}-${id}`,
    category,
    subject,
    status,
    reviewer,
    date: displayToIso(dateLabel),
    dateLabel,
    detail,
  };
}

export function buildReports(source: {
  doctors: Doctor[];
  manufacturers: Manufacturer[];
  submissions: Submission[];
  batches: Batch[];
  safety: SafetyCase[];
  cases: ClinicalCase[];
  audit: AuditEvent[];
}): ReportRow[] {
  return [
    ...source.doctors.map((item) =>
      report(
        "Doctor Verification",
        item.id,
        `${item.name} · ${item.id}`,
        item.status,
        reviewerFor(item.status, item.history),
        item.submittedDate,
        item.specialization,
      ),
    ),
    ...source.manufacturers.map((item) =>
      report(
        "Manufacturer Verification",
        item.id,
        `${item.company} · ${item.id}`,
        item.status,
        reviewerFor(item.status, item.history),
        item.applicationDate,
        item.location,
      ),
    ),
    ...source.submissions.map((item) =>
      report(
        "Medicine Approvals",
        item.id,
        `${item.product} · ${item.id}`,
        item.status,
        item.reviewer,
        item.submittedDate,
        `Version ${item.version} · ${item.manufacturer}`,
      ),
    ),
    ...source.batches.map((item) =>
      report(
        "Quality & Batches",
        item.id,
        `${item.product} · ${item.id}`,
        item.qualityStatus,
        reviewerFor(item.qualityStatus, item.history),
        item.batchDate,
        item.releaseStatus,
      ),
    ),
    ...source.safety.map((item) =>
      report(
        "Safety & ADR",
        item.id,
        `${item.product} · ${item.id}`,
        item.status,
        item.reviewer,
        item.reportDate,
        item.reportedSeverity,
      ),
    ),
    ...source.cases.map((item) =>
      report(
        "Clinical Case Reviews",
        item.id,
        `${item.title} · ${item.id}`,
        item.reviewStatus,
        reviewerFor(item.reviewStatus, item.history),
        item.submittedDate,
        item.category,
      ),
    ),
    ...source.audit.map((item) =>
      report(
        "Platform Activity",
        item.id,
        item.action,
        item.result,
        item.user,
        formatIsoDate(item.at.slice(0, 10)),
        `${item.module} · ${item.detail}`,
      ),
    ),
  ];
}

export function filterReports(
  rows: ReportRow[],
  query: { category: ReportCategory; status: string; reviewer: string; from: string; to: string },
) {
  return rows.filter((row) => {
    if (row.category !== query.category) return false;
    if (query.status !== "all" && row.status !== query.status) return false;
    if (query.reviewer !== "all" && row.reviewer !== query.reviewer) return false;
    if (query.from && row.date < query.from) return false;
    if (query.to && row.date > query.to) return false;
    return true;
  });
}

export function resolveAccess(input: {
  sessionManage: boolean;
  sessionExport: boolean;
  accountStatus: AccountStatus | null;
}): Access {
  if (input.accountStatus === "Inactive") return { manage: false, export: false };
  return { manage: input.sessionManage, export: input.sessionExport };
}

export function authorize(access: Access, action: "manage" | "export"): ActionResult {
  if (action === "manage" && !access.manage) {
    return { ok: false, message: "Your account cannot change these records." };
  }
  if (action === "export" && !access.export) {
    return { ok: false, message: "Your account cannot export these records." };
  }
  return { ok: true };
}

export function permissionsFor(roles: readonly AdminRole[]) {
  const granted = new Set<Permission>();
  for (const role of roles) {
    for (const permission of rolePermissions[role]) granted.add(permission);
  }
  return permissions.filter((permission) => granted.has(permission));
}

export function activePlatformAdmins(users: DirectoryUser[], exceptId?: string) {
  return users.filter(
    (user) =>
      user.id !== exceptId &&
      user.status === "Active" &&
      user.roles.includes("Platform Administrator"),
  );
}

export function canChangeRoles(
  users: DirectoryUser[],
  id: string,
  nextRoles: readonly AdminRole[],
): ActionResult {
  const user = users.find((item) => item.id === id);
  if (!user) return { ok: false, message: "That account is not in this session." };
  if (!nextRoles.length) return { ok: false, message: "Assign at least one approved role." };
  if (nextRoles.some((role) => !adminRoles.includes(role))) {
    return { ok: false, message: "Choose a role from the approved list." };
  }
  const keepsAdmin = user.status === "Active" && nextRoles.includes("Platform Administrator");
  if (
    user.roles.includes("Platform Administrator") &&
    !keepsAdmin &&
    !activePlatformAdmins(users, id).length
  ) {
    return { ok: false, message: "Keep at least one active Platform Administrator." };
  }
  return { ok: true };
}

export function canSetAccountStatus(
  users: DirectoryUser[],
  id: string,
  status: AccountStatus,
  actorEmail: string,
): ActionResult {
  const user = users.find((item) => item.id === id);
  if (!user) return { ok: false, message: "That account is not in this session." };
  if (status === "Active" || user.status === "Inactive") return { ok: true };
  if (user.email.toLowerCase() === actorEmail.toLowerCase()) {
    return { ok: false, message: "You cannot deactivate the account you are using." };
  }
  if (user.roles.includes("Platform Administrator") && !activePlatformAdmins(users, id).length) {
    return { ok: false, message: "Keep at least one active Platform Administrator." };
  }
  return { ok: true };
}

export function settingError(setting: PlatformSetting, value: string) {
  const trimmed = value.trim();
  if (setting.kind === "text") {
    if (setting.id === "support-email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return "Enter a valid support email address.";
    }
    if (trimmed.length < 3)
      return `Enter a ${setting.label.toLowerCase()} of at least 3 characters.`;
  }
  if (setting.kind === "number") {
    const amount = Number(trimmed);
    if (!Number.isInteger(amount)) return `${setting.label} must be a whole number.`;
    if (setting.id === "review-window" && (amount < 1 || amount > 30)) {
      return "The review window must be between 1 and 30 days.";
    }
    if (setting.id === "session-timeout" && (amount < 5 || amount > 240)) {
      return "The session timeout must be between 5 and 240 minutes.";
    }
  }
  if (setting.kind === "boolean" && trimmed !== "yes" && trimmed !== "no") {
    return `Choose yes or no for ${setting.label}.`;
  }
  return "";
}

export function prependAudit(events: AuditEvent[], event: AuditEvent) {
  return [event, ...events];
}

export function toCsv(headers: string[], rows: string[][]) {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}

export const seedDirectory: DirectoryUser[] = [
  {
    id: "USR-01",
    name: "Ananya Iyer",
    email: "admin@meyveda.com",
    roles: ["Platform Administrator"],
    status: "Active",
    lastActivity: "2026-10-14 09:40",
    lastActivityLabel: "14 Oct 2026, 09:40",
  },
  {
    id: "USR-02",
    name: "Meera Pillai",
    email: "auditor@meyveda.com",
    roles: ["Auditor"],
    status: "Active",
    lastActivity: "2026-10-12 15:48",
    lastActivityLabel: "12 Oct 2026, 15:48",
  },
  {
    id: "USR-03",
    name: "Lakshmi Krishnan",
    email: "lakshmi.krishnan@meyveda.com",
    roles: ["Doctor Verification Reviewer"],
    status: "Active",
    lastActivity: "2026-10-14 09:40",
    lastActivityLabel: "14 Oct 2026, 09:40",
  },
  {
    id: "USR-04",
    name: "Rahul Verma",
    email: "rahul.verma@meyveda.com",
    roles: ["Manufacturer Reviewer"],
    status: "Active",
    lastActivity: "2026-10-13 16:20",
    lastActivityLabel: "13 Oct 2026, 16:20",
  },
  {
    id: "USR-05",
    name: "Priya Nambiar",
    email: "priya.nambiar@meyveda.com",
    roles: ["Medicine Approval Reviewer"],
    status: "Active",
    lastActivity: "2026-10-09 10:12",
    lastActivityLabel: "9 Oct 2026, 10:12",
  },
  {
    id: "USR-06",
    name: "Devika Sharma",
    email: "devika.sharma@meyveda.com",
    roles: ["Quality Reviewer"],
    status: "Active",
    lastActivity: "2026-10-13 11:05",
    lastActivityLabel: "13 Oct 2026, 11:05",
  },
  {
    id: "USR-07",
    name: "Arun Menon",
    email: "arun.menon@meyveda.com",
    roles: ["Safety Reviewer"],
    status: "Active",
    lastActivity: "2026-10-12 15:48",
    lastActivityLabel: "12 Oct 2026, 15:48",
  },
  {
    id: "USR-08",
    name: "Nandini Rao",
    email: "nandini.rao@meyveda.com",
    roles: ["Knowledge Editor"],
    status: "Active",
    lastActivity: "2026-10-08 14:15",
    lastActivityLabel: "8 Oct 2026, 14:15",
  },
  {
    id: "USR-09",
    name: "Hari Prasad",
    email: "hari.prasad@meyveda.com",
    roles: ["Read-Only User"],
    status: "Inactive",
    lastActivity: "2026-07-03 11:20",
    lastActivityLabel: "3 Jul 2026, 11:20",
  },
];

export const seedSettings: PlatformSetting[] = [
  {
    id: "platform-name",
    label: "Platform name",
    description: "The name shown to administrators in this portal.",
    kind: "text",
    value: "meyveda",
    sensitive: false,
  },
  {
    id: "support-email",
    label: "Support email",
    description: "Where operational notices are sent.",
    kind: "text",
    value: "support@meyveda.com",
    sensitive: false,
  },
  {
    id: "review-window",
    label: "Review window",
    description: "Days a new submission stays in the active review queue.",
    kind: "number",
    value: "5",
    sensitive: false,
  },
  {
    id: "session-timeout",
    label: "Session timeout",
    description: "Minutes before an idle administrator session ends.",
    kind: "number",
    value: "30",
    sensitive: true,
  },
  {
    id: "rejection-reason",
    label: "Rejection reason required",
    description: "A rejection or correction request must include a reason.",
    kind: "boolean",
    value: "yes",
    sensitive: true,
  },
  {
    id: "export-limit",
    label: "Limit exports",
    description: "Only roles with export permission can download reports and audit records.",
    kind: "boolean",
    value: "yes",
    sensitive: true,
  },
];

export const seedAudit: AuditEvent[] = [
  {
    id: "EVT-8001",
    at: "2026-10-14 09:40",
    user: "Ananya Iyer",
    module: "Doctors",
    action: "Verified practitioner",
    result: "Success",
    detail: "Verified Dr. Lakshmi Rao.",
    kind: "activity",
  },
  {
    id: "EVT-8002",
    at: "2026-10-13 16:20",
    user: "Ananya Iyer",
    module: "Manufacturers",
    action: "Approved manufacturer",
    result: "Success",
    detail: "Approved Arya Vaidya Sala.",
    kind: "activity",
  },
  {
    id: "EVT-8003",
    at: "2026-10-13 11:05",
    user: "Ananya Iyer",
    module: "Quality & Batches",
    action: "Released batch",
    result: "Success",
    detail: "Released batch TRP-1182 after the checklist was complete.",
    kind: "activity",
  },
  {
    id: "EVT-8004",
    at: "2026-10-12 15:48",
    user: "Meera Pillai",
    module: "Safety & ADR",
    action: "Opened follow-up",
    result: "Success",
    detail: "Opened ADR-2041 for follow-up.",
    kind: "activity",
  },
  {
    id: "EVT-8005",
    at: "2026-10-11 18:12",
    user: "Unknown",
    module: "Security",
    action: "Sign-in failed",
    result: "Denied",
    detail: "The password did not match an active account.",
    kind: "security",
  },
  {
    id: "EVT-8006",
    at: "2026-10-10 08:05",
    user: "Hari Prasad",
    module: "Security",
    action: "Sign-in refused",
    result: "Denied",
    detail: "The account is inactive.",
    kind: "security",
  },
  {
    id: "EVT-8007",
    at: "2026-10-09 10:12",
    user: "Priya Nambiar",
    module: "Medicines",
    action: "Submitted version",
    result: "Success",
    detail: "Submitted Triphala Guggulu version 3.",
    kind: "activity",
  },
  {
    id: "EVT-8008",
    at: "2026-10-08 14:15",
    user: "Nandini Rao",
    module: "Ayurveda Library",
    action: "Published entry",
    result: "Success",
    detail: "Published a library revision.",
    kind: "activity",
  },
  {
    id: "EVT-8009",
    at: "2026-10-06 17:22",
    user: "Neha Krishnan",
    module: "Medicines",
    action: "Submitted product",
    result: "Success",
    detail: "Submitted Dashamoola Kwath version 1.",
    kind: "activity",
  },
  {
    id: "EVT-8010",
    at: "2026-09-20 09:15",
    user: "Devika Sharma",
    module: "Quality & Batches",
    action: "Quarantined batch",
    result: "Success",
    detail: "Quarantined batch CHP-3304 after the microbial result.",
    kind: "activity",
  },
];
