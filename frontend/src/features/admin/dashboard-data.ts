import type { AdminRoute } from "@/features/admin/modules";

export type PillTone = "brand" | "sage" | "muted" | "danger";

export const summaryCards: {
  label: string;
  count: number;
  to: AdminRoute;
}[] = [
  {
    label: "Pending Doctor Verifications",
    count: 2,
    to: "/admin/doctors",
  },
  {
    label: "Manufacturer Applications",
    count: 3,
    to: "/admin/manufacturers",
  },
  {
    label: "Medicine Submissions",
    count: 3,
    to: "/admin/medicines",
  },
  {
    label: "Quality & Batch Alerts",
    count: 2,
    to: "/admin/quality",
  },
  {
    label: "Open Safety Reports",
    count: 4,
    to: "/admin/safety",
  },
];

export const actionQueue: {
  id: string;
  task: string;
  module: string;
  date: string;
  dateTime: string;
  status: string;
  tone: PillTone;
  to: AdminRoute;
}[] = [
  {
    id: "doc-meera",
    task: "Verify Dr. Meera Nair",
    module: "Doctor verification and management",
    date: "08 Oct 2026",
    dateTime: "2026-10-08",
    status: "Registered",
    tone: "brand",
    to: "/admin/doctors",
  },
  {
    id: "doc-anjali",
    task: "Verify Dr. Anjali Menon",
    module: "Doctor verification and management",
    date: "11 Oct 2026",
    dateTime: "2026-10-11",
    status: "Registered",
    tone: "brand",
    to: "/admin/doctors",
  },
  {
    id: "mfr-sahyadri",
    task: "Review Sahyadri Botanics",
    module: "Manufacturer verification",
    date: "12 Oct 2026",
    dateTime: "2026-10-12",
    status: "Pending Review",
    tone: "brand",
    to: "/admin/manufacturers",
  },
  {
    id: "med-triphala",
    task: "Review Triphala Guggulu",
    module: "Product management",
    date: "09 Oct 2026",
    dateTime: "2026-10-09",
    status: "Pending Review",
    tone: "brand",
    to: "/admin/medicines",
  },
  {
    id: "lib-draft",
    task: "Review classical text revision",
    module: "Library management",
    date: "14 Oct 2026",
    dateTime: "2026-10-14",
    status: "Under Review",
    tone: "brand",
    to: "/admin/library",
  },
  {
    id: "adr-2041",
    task: "Follow up ADR-2041",
    module: "ADR reports",
    date: "13 Oct 2026",
    dateTime: "2026-10-13",
    status: "Open",
    tone: "brand",
    to: "/admin/safety",
  },
];

export const visibleActionCount = 4;

export const recentActivity: {
  id: string;
  action: string;
  module: string;
  administrator: string;
  when: string;
  dateTime: string;
  to: AdminRoute;
}[] = [
  {
    id: "act-lakshmi",
    action: "Verified Dr. Lakshmi Rao",
    module: "Doctor verification and management",
    administrator: "Ananya Iyer",
    when: "14 Oct 2026, 09:40",
    dateTime: "2026-10-14T09:40",
    to: "/admin/doctors",
  },
  {
    id: "act-avp",
    action: "Approved Arya Vaidya Sala",
    module: "Manufacturer verification",
    administrator: "Ananya Iyer",
    when: "13 Oct 2026, 16:20",
    dateTime: "2026-10-13T16:20",
    to: "/admin/manufacturers",
  },
  {
    id: "act-med",
    action: "Approved Triphala Guggulu v2",
    module: "Product management",
    administrator: "Ananya Iyer",
    when: "13 Oct 2026, 11:05",
    dateTime: "2026-10-13T11:05",
    to: "/admin/medicines",
  },
  {
    id: "act-adr",
    action: "Opened ADR-2041 for follow-up",
    module: "ADR reports",
    administrator: "Meera Pillai",
    when: "12 Oct 2026, 15:48",
    dateTime: "2026-10-12T15:48",
    to: "/admin/safety",
  },
];

export const quickActions: { label: string; to: AdminRoute }[] = [
  { label: "Doctor verification and management", to: "/admin/doctors" },
  { label: "Manufacturer verification", to: "/admin/manufacturers" },
  { label: "Product management", to: "/admin/medicines" },
  { label: "ADR reports", to: "/admin/safety" },
];
