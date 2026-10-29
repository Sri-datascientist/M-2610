// @ts-nocheck -- prototype seed data
// PROTOTYPE MOCK DATA — not live platform data. Replace with API calls when the backend is available.

export type Role =
  | "Platform Administrator"
  | "Compliance Administrator"
  | "Operations Manager"
  | "Support Administrator"
  | "Read-Only Auditor";
export const ROLES: Role[] = [
  "Platform Administrator",
  "Compliance Administrator",
  "Operations Manager",
  "Support Administrator",
  "Read-Only Auditor",
];

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "Active" | "Inactive" | "Suspended";
  lastLogin: string;
  mfa: boolean;
  joined: string;
}

const names = [
  "Ananya Iyer", "Rohan Mehta", "Priya Nair", "Arjun Kapoor", "Meera Pillai", "Vikram Rao",
  "Kavya Menon", "Siddharth Joshi", "Lakshmi Krishnan", "Aditya Sharma", "Neha Gupta", "Karthik Reddy",
  "Divya Bhat", "Rahul Verma", "Sneha Kulkarni", "Imran Khan",
];
export const users: User[] = names.map((n, i) => ({
  id: `USR-${1001 + i}`,
  name: n,
  email: n.toLowerCase().replace(" ", ".") + "@meyveda.com",
  role: ROLES[i % ROLES.length],
  status: i % 7 === 5 ? "Inactive" : i % 11 === 9 ? "Suspended" : "Active",
  lastLogin: `2026-10-${String(10 - (i % 9)).padStart(2, "0")} ${String(8 + (i % 10)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
  mfa: i % 4 !== 3,
  joined: `2025-${String((i % 12) + 1).padStart(2, "0")}-14`,
}));

export type VerificationStatus =
  | "Pending Review" | "In Review" | "Additional Information Required" | "Approved" | "Rejected";
export interface VerificationCase {
  id: string;
  applicant: string;
  type: "Practitioner" | "Organization";
  submitted: string;
  documents: string[];
  status: VerificationStatus;
  reviewer: string;
  detail: string;
  checklist: { label: string; done: boolean }[];
  notes: { by: string; at: string; text: string }[];
  history: { at: string; text: string }[];
}
const vApplicants: [string, "Practitioner" | "Organization", string][] = [
  ["Dr. Sushma Vaidya", "Practitioner", "BAMS, 12 years · Kerala"],
  ["Ayurveda Wellness Centre", "Organization", "Clinic · Bengaluru"],
  ["Dr. Harish Panicker", "Practitioner", "MD (Ayu), 8 years · Kochi"],
  ["Sattva Health Pvt Ltd", "Organization", "Hospital network · Pune"],
  ["Dr. Revathi Shenoy", "Practitioner", "BAMS, 5 years · Mangaluru"],
  ["Dhanvantari Clinic", "Organization", "Clinic · Mysuru"],
  ["Dr. Manoj Kumar", "Practitioner", "BAMS, 15 years · Delhi"],
  ["Prakriti Retreats", "Organization", "Wellness retreat · Rishikesh"],
];
const vStatuses: VerificationStatus[] = ["Pending Review", "In Review", "Additional Information Required", "Pending Review", "Approved", "In Review", "Rejected", "Pending Review"];
export const verifications: VerificationCase[] = vApplicants.map(([a, t, d], i) => ({
  id: `VER-${2401 + i}`,
  applicant: a,
  type: t,
  submitted: `2026-10-${String(9 - i).padStart(2, "0")}`,
  documents: t === "Practitioner" ? ["Degree certificate.pdf", "Council registration.pdf", "Government ID.pdf"] : ["Registration certificate.pdf", "Licence.pdf"],
  status: vStatuses[i],
  reviewer: i % 3 === 0 ? "Unassigned" : names[i % 5],
  detail: d,
  checklist: [
    { label: "Identity verified", done: i % 2 === 0 },
    { label: "Qualification documents valid", done: i % 3 === 0 },
    { label: "Registration number confirmed", done: false },
  ],
  notes: i % 2 ? [{ by: names[1], at: "2026-10-08 14:20", text: "Registration number needs cross-check with state council." }] : [],
  history: [{ at: `2026-10-${String(9 - i).padStart(2, "0")} 09:00`, text: "Application submitted" }],
}));

export type ModerationStatus = "Pending" | "Reported" | "Approved" | "Rejected" | "Changes Requested" | "Escalated";
export interface ModerationItem {
  id: string;
  title: string;
  type: "Community Post" | "Article" | "Comment";
  submitter: string;
  submitted: string;
  reason?: string;
  status: ModerationStatus;
  body: string;
  history: { at: string; text: string }[];
}
export const moderation: ModerationItem[] = [
  ["Morning routines for Vata balance", "Article", "Pending", undefined],
  ["Is triphala safe daily?", "Community Post", "Reported", "Possible medical claim"],
  ["My experience with Panchakarma", "Community Post", "Pending", undefined],
  ["Turmeric cures everything", "Comment", "Reported", "Unverified medical claim"],
  ["Seasonal diet guide: Sharad Ritu", "Article", "Approved", undefined],
  ["Buy my herbal mix here", "Comment", "Rejected", "Spam / promotion"],
  ["Yoga and Pitta dosha", "Article", "Pending", undefined],
  ["Practitioner recommendation thread", "Community Post", "Reported", "Personal contact details shared"],
].map(([title, type, status, reason], i) => ({
  id: `MOD-${3101 + i}`,
  title: title as string,
  type: type as ModerationItem["type"],
  submitter: names[(i + 4) % names.length],
  submitted: `2026-10-${String(10 - i).padStart(2, "0")}`,
  reason: reason as string | undefined,
  status: status as ModerationStatus,
  body: "This is sample content submitted for moderation review. In production, the full text of the post or article appears here along with any attached media and the thread context.",
  history: [{ at: `2026-10-${String(10 - i).padStart(2, "0")} 10:12`, text: "Submitted" }],
}));

export interface CommercialRule {
  id: string;
  name: string;
  category: "Service Fee" | "Platform Charge" | "Transaction Rule" | "Configuration";
  value: string;
  effective: string;
  status: "Active" | "Scheduled" | "Retired";
  versions: { version: number; value: string; by: string; at: string; reason: string }[];
}
export const commercialRules: CommercialRule[] = [
  ["Consultation service fee", "Service Fee", "12%"],
  ["Organization listing charge", "Platform Charge", "₹2,500 / month"],
  ["Minimum payout threshold", "Transaction Rule", "₹1,000"],
  ["Refund window", "Transaction Rule", "7 days"],
  ["Payment gateway surcharge", "Platform Charge", "2%"],
  ["Default currency", "Configuration", "INR"],
].map(([name, category, value], i) => ({
  id: `RUL-${501 + i}`,
  name,
  category: category as CommercialRule["category"],
  value,
  effective: `2026-0${(i % 8) + 1}-01`,
  status: i === 4 ? "Scheduled" : "Active",
  versions: [{ version: 1, value, by: names[0], at: `2026-0${(i % 8) + 1}-01 10:00`, reason: "Initial configuration" }],
}));

export type ComplianceStatus = "Not Started" | "In Progress" | "Awaiting Review" | "Completed" | "Overdue";
export interface Obligation {
  id: string;
  name: string;
  category: string;
  owner: string;
  due: string;
  status: ComplianceStatus;
  evidence: string[];
  approvals: { by: string; at: string }[];
}
export const obligations: Obligation[] = [
  ["DPDP Act data processing register", "Data Protection", "In Progress", "2026-10-18"],
  ["AYUSH practitioner listing guidelines", "Regulatory", "Awaiting Review", "2026-10-14"],
  ["Quarterly access review", "Security", "Not Started", "2026-10-30"],
  ["Telemedicine practice guidelines review", "Regulatory", "Overdue", "2026-10-05"],
  ["Vendor security assessment", "Security", "Completed", "2026-09-28"],
  ["Consent template annual review", "Data Protection", "In Progress", "2026-11-12"],
  ["Advertising claims policy", "Content", "Not Started", "2026-11-20"],
].map(([name, category, status, due], i) => ({
  id: `CMP-${701 + i}`,
  name, category, due,
  owner: names[(i + 1) % 6],
  status: status as ComplianceStatus,
  evidence: i % 2 === 0 ? ["evidence-summary.pdf"] : [],
  approvals: status === "Completed" ? [{ by: names[1], at: "2026-09-28 16:00" }] : [],
}));

export interface ConsentTemplate { id: string; name: string; version: string; status: "Active" | "Draft" | "Retired"; updated: string; effective: string }
export const consentTemplates: ConsentTemplate[] = [
  { id: "CON-1", name: "Teleconsultation consent", version: "v3.2", status: "Active", updated: "2026-09-12", effective: "2026-09-15" },
  { id: "CON-2", name: "Health record sharing", version: "v2.0", status: "Active", updated: "2026-07-02", effective: "2026-07-10" },
  { id: "CON-3", name: "Marketing communications", version: "v1.4", status: "Draft", updated: "2026-10-06", effective: "—" },
  { id: "CON-4", name: "Research data use", version: "v1.0", status: "Retired", updated: "2025-12-01", effective: "2026-01-01" },
];
export interface PrivacyRequest { id: string; type: "Access" | "Correction" | "Erasure" | "Consent Withdrawal"; received: string; status: "Open" | "In Progress" | "Completed"; owner: string; deadline: string; log: { at: string; text: string }[] }
export const privacyRequests: PrivacyRequest[] = [
  ["Access", "2026-10-08", "Open", "2026-11-07"],
  ["Erasure", "2026-10-03", "In Progress", "2026-11-02"],
  ["Correction", "2026-09-28", "Completed", "2026-10-28"],
  ["Consent Withdrawal", "2026-10-09", "Open", "2026-10-16"],
].map(([type, received, status, deadline], i) => ({
  id: `PRQ-${9001 + i}`, type: type as PrivacyRequest["type"], received, status: status as PrivacyRequest["status"],
  owner: names[(i + 2) % 5], deadline, log: [{ at: `${received} 09:30`, text: "Request received" }],
}));
export const retentionPolicies = [
  { id: "RET-1", data: "Consultation records", period: "7 years", basis: "Clinical record-keeping obligation", status: "Active" },
  { id: "RET-2", data: "Login & session logs", period: "180 days", basis: "Security monitoring", status: "Active" },
  { id: "RET-3", data: "Marketing preferences", period: "Until withdrawn", basis: "Consent", status: "Active" },
  { id: "RET-4", data: "Deactivated accounts", period: "90 days", basis: "Account recovery window", status: "Under Review" },
];

export interface AuditEvent { id: string; activity: string; actor: string; module: string; timestamp: string; result: "Success" | "Failed" | "Denied"; detail?: string | undefined }
export const auditSeed: AuditEvent[] = [
  ["Signed in", "Ananya Iyer", "Security", "Success"],
  ["Updated role for USR-1004", "Ananya Iyer", "Identity & Roles", "Success"],
  ["Approved verification VER-2405", "Rohan Mehta", "Verification", "Success"],
  ["Attempted rule publish", "Divya Bhat", "Commercial Rules", "Denied"],
  ["Rejected content MOD-3106", "Priya Nair", "Content Moderation", "Success"],
  ["Exported audit log", "Meera Pillai", "Audit Management", "Success"],
  ["Failed sign-in", "unknown", "Security", "Failed"],
  ["Published article KNW-804", "Kavya Menon", "Knowledge Governance", "Success"],
].map(([activity, actor, module, result], i) => ({
  id: `EVT-${80021 - i}`, activity, actor, module,
  timestamp: `2026-10-${String(10 - Math.floor(i / 3)).padStart(2, "0")} ${String(11 - i).padStart(2, "0")}:${String((i * 13) % 60).padStart(2, "0")}`,
  result: result as AuditEvent["result"],
}));
export const scheduledAudits = [
  { id: "AUD-31", name: "Q4 access control audit", auditor: "Meera Pillai", date: "2026-11-05", status: "Scheduled" },
  { id: "AUD-30", name: "Consent records sample audit", auditor: "Sneha Kulkarni", date: "2026-10-20", status: "Scheduled" },
  { id: "AUD-29", name: "Verification process audit", auditor: "Meera Pillai", date: "2026-09-15", status: "Completed" },
];
export const auditFindings = [
  { id: "FND-12", title: "Two dormant admin accounts without MFA", severity: "Medium", status: "Open", resolution: "Pending owner action", evidence: "AUD-29 / access-export.csv" },
  { id: "FND-11", title: "Reviewer notes missing on 3 rejections", severity: "Low", status: "Resolved", resolution: "Rejection reason made mandatory", evidence: "AUD-29 / sample-set.pdf" },
];

export interface AccessReview { id: string; user: string; role: Role; reason: string; status: "Pending" | "Retained" | "Revoked" }
export const accessReviews: AccessReview[] = users.slice(0, 5).map((u, i) => ({
  id: `ACR-${41 + i}`, user: u.name, role: u.role,
  reason: ["No sign-in for 60 days", "Role change pending confirmation", "Quarterly review", "MFA not enabled", "Quarterly review"][i],
  status: "Pending",
}));
export interface Incident { id: string; title: string; severity: "Low" | "Medium" | "High"; owner: string; status: "Open" | "Investigating" | "Resolved"; opened: string }
export const incidents: Incident[] = [
  { id: "INC-207", title: "Repeated failed sign-ins from one network", severity: "Medium", owner: "Unassigned", status: "Open", opened: "2026-10-09" },
  { id: "INC-206", title: "Unexpected export volume", severity: "Low", owner: "Vikram Rao", status: "Investigating", opened: "2026-10-06" },
  { id: "INC-204", title: "Phishing email reported by staff", severity: "Low", owner: "Vikram Rao", status: "Resolved", opened: "2026-09-29" },
];
export const vulnerabilities = [
  { id: "VUL-58", title: "Outdated dependency in image service", severity: "Medium", status: "Open", found: "2026-10-02" },
  { id: "VUL-57", title: "Missing security header on legacy page", severity: "Low", status: "Open", found: "2026-09-25" },
  { id: "VUL-55", title: "Weak session timeout setting", severity: "Medium", status: "Resolved", found: "2026-09-10" },
];
export interface Session { id: string; user: string; device: string; location: string; started: string }
export const sessions: Session[] = [
  { id: "SES-1", user: "Ananya Iyer", device: "Chrome · macOS", location: "Bengaluru, IN", started: "2026-10-10 09:12" },
  { id: "SES-2", user: "Rohan Mehta", device: "Safari · iPadOS", location: "Mumbai, IN", started: "2026-10-10 08:40" },
  { id: "SES-3", user: "Priya Nair", device: "Edge · Windows", location: "Kochi, IN", started: "2026-10-09 18:03" },
];

export type KnowledgeStatus = "Draft" | "In Review" | "Approved" | "Published" | "Archived";
export interface KnowledgeItem { id: string; title: string; category: "Knowledge Article" | "Reference Data"; version: number; owner: string; status: KnowledgeStatus; updated: string; source: string; body: string; history: { version: number; at: string; by: string; text: string }[] }
export const knowledge: KnowledgeItem[] = [
  ["Understanding the three doshas", "Knowledge Article", "Published", "Charaka Samhita, Sutrasthana"],
  ["Herb monograph: Ashwagandha", "Reference Data", "In Review", "Ayurvedic Pharmacopoeia of India, Vol. I"],
  ["Dinacharya: daily routine basics", "Knowledge Article", "Approved", "Ashtanga Hridayam, Sutrasthana 2"],
  ["Herb monograph: Brahmi", "Reference Data", "Draft", "Ayurvedic Pharmacopoeia of India, Vol. II"],
  ["Seasonal regimen overview", "Knowledge Article", "Archived", "Charaka Samhita, Sutrasthana 6"],
].map(([title, category, status, source], i) => ({
  id: `KNW-${801 + i}`, title, category: category as KnowledgeItem["category"], version: (i % 3) + 1,
  owner: names[(i + 6) % names.length], status: status as KnowledgeStatus, updated: `2026-10-0${(i % 9) + 1}`, source,
  body: "Educational reference content. Clinical statements must cite the listed source and pass practitioner review before publication.",
  history: [{ version: 1, at: "2026-08-01 10:00", by: names[6], text: "Initial draft" }],
}));

