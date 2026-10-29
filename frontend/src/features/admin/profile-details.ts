import {
  adminRoles,
  rolePermissions,
  type AdminRole,
  type Permission,
} from "@/features/admin/administration-data";

export type ProfileDetails = {
  phone: string;
  department: string;
  jobTitle: string;
  language: string;
  timeZone: string;
};

const STORAGE_KEY = "meyveda-profile-details";

export const emptyProfileDetails = (): ProfileDetails => ({
  phone: "",
  department: "",
  jobTitle: "",
  language: "",
  timeZone: "",
});

export const profilePermissionGroups: { title: string; permissions: readonly Permission[] }[] = [
  { title: "Practitioner verification", permissions: ["Review doctors"] },
  { title: "Manufacturer management", permissions: ["Review manufacturers"] },
  { title: "Medicine and product approvals", permissions: ["Review medicines"] },
  { title: "Ayurveda Library management", permissions: ["Edit knowledge"] },
  { title: "Quality, batches and safety reports", permissions: ["Review quality", "Review safety"] },
  { title: "Clinical case review", permissions: [] },
  { title: "Reports and analytics", permissions: ["View records", "Export reports"] },
  { title: "User and role management", permissions: ["Manage users"] },
  { title: "Settings and activity logs", permissions: ["Change settings", "Read the audit log"] },
];

export function profileFieldError(input: { name: string; email: string }): string | null {
  if (!input.name.trim()) return "Enter a full name.";
  const email = input.email.trim();
  if (!email) return "Enter an email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  return null;
}

export function rolesFromAccount(directoryRoles: readonly string[] | undefined, sessionRole: string): AdminRole[] {
  const known = new Set<string>(adminRoles);
  const fromDirectory = (directoryRoles ?? []).filter((role): role is AdminRole => known.has(role));
  if (fromDirectory.length > 0) return fromDirectory;
  return known.has(sessionRole) ? [sessionRole as AdminRole] : [];
}

export function grantedPermissions(roles: readonly AdminRole[]): Set<Permission> {
  const granted = new Set<Permission>();
  for (const role of roles) {
    for (const permission of rolePermissions[role]) granted.add(permission);
  }
  return granted;
}

export function readProfileDetails(email: string): ProfileDetails {
  if (typeof sessionStorage === "undefined") return emptyProfileDetails();
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, Partial<ProfileDetails>>;
    const row = parsed[email.trim().toLowerCase()];
    if (!row) return emptyProfileDetails();
    return {
      phone: typeof row.phone === "string" ? row.phone : "",
      department: typeof row.department === "string" ? row.department : "",
      jobTitle: typeof row.jobTitle === "string" ? row.jobTitle : "",
      language: typeof row.language === "string" ? row.language : "",
      timeZone: typeof row.timeZone === "string" ? row.timeZone : "",
    };
  } catch {
    return emptyProfileDetails();
  }
}

export function writeProfileDetails(previousEmail: string, email: string, details: ProfileDetails) {
  const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, ProfileDetails>;
  delete parsed[previousEmail.trim().toLowerCase()];
  parsed[email.trim().toLowerCase()] = details;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
}

export function displayProfileValue(value: string): string {
  return value.trim() ? value.trim() : "Not recorded";
}
