import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardCheck,
  FolderOpen,
  Home,
  Layers,
  Leaf,
  Library,
  MapPin,
  MessageCircle,
  MessageSquare,
  Newspaper,
  Pill,
  Settings,
  ShieldAlert,
  Stethoscope,
  Users,
} from "lucide-react";

export type AdminRoute =
  | "/admin/home"
  | "/admin/doctors"
  | "/admin/manufacturers"
  | "/admin/medicines"
  | "/admin/library"
  | "/admin/journals"
  | "/admin/published-content"
  | "/admin/ingredients"
  | "/admin/approvals"
  | "/admin/territory"
  | "/admin/feedback"
  | "/admin/referrals"
  | "/admin/quality"
  | "/admin/safety"
  | "/admin/cases"
  | "/admin/reports"
  | "/admin/queries"
  | "/admin/users"
  | "/admin/settings";

export type AdminGroup = "Operations";

export type AdminModule = {
  to: AdminRoute;
  label: string;
  title: string;
  summary: string;
  icon: LucideIcon;
  group?: AdminGroup;
  mobileLabel?: string;
};

export const adminGroups: AdminGroup[] = ["Operations"];

export const adminModules: AdminModule[] = [
  {
    to: "/admin/home",
    label: "Overview",
    title: "Overview",
    summary: "Your overview of Ayurveda platform operations and reviews.",
    icon: Home,
    mobileLabel: "Overview",
  },
  {
    to: "/admin/doctors",
    label: "Doctor verification and management",
    title: "Doctor verification and management",
    summary: "Review practitioner profiles and verification applications.",
    icon: Stethoscope,
    mobileLabel: "Doctors",
  },
  {
    to: "/admin/manufacturers",
    label: "Manufacturer verification",
    title: "Manufacturer verification",
    summary: "Manage pharmaceutical company applications and facility verification.",
    icon: Building2,
    mobileLabel: "Manufacturers",
  },
  {
    to: "/admin/medicines",
    label: "Product management",
    title: "Product management",
    summary: "Review medicine submissions, product approvals, and maintain the product catalogue.",
    icon: Pill,
    mobileLabel: "Products",
  },
  {
    to: "/admin/library",
    label: "Library management",
    title: "Library management",
    summary: "Classical texts, governed knowledge entries, and practitioner published content.",
    icon: Library,
    mobileLabel: "Library",
  },
  {
    to: "/admin/journals",
    label: "Journal management",
    title: "Journal management",
    summary: "Peer-reviewed research and academic journal archive governance.",
    icon: Newspaper,
    mobileLabel: "Journals",
  },
  {
    to: "/admin/territory",
    label: "Territory mapping",
    title: "Territory mapping",
    summary: "Geographical mapping and territorial distribution of doctors and manufacturers.",
    icon: MapPin,
    mobileLabel: "Territory",
  },
  {
    to: "/admin/feedback",
    label: "Feedback management",
    title: "Feedback management",
    summary: "Manage stakeholder suggestions, platform reviews, and feedback records.",
    icon: MessageSquare,
    mobileLabel: "Feedback",
  },
  {
    to: "/admin/safety",
    label: "ADR reports",
    title: "ADR reports",
    summary: "De-identified adverse drug reaction reports and clinical safety reviews.",
    icon: ShieldAlert,
    mobileLabel: "ADR",
  },
  {
    to: "/admin/referrals",
    label: "Referral scores",
    title: "Referral scores",
    summary: "Practitioner referral metrics, scoring formula, and ranking leaderboard.",
    icon: Award,
    mobileLabel: "Referrals",
  },
];

export const mobileNav = [
  "/admin/home",
  "/admin/doctors",
  "/admin/manufacturers",
  "/admin/medicines",
  "/admin/safety",
] as const;

export function moduleByPath(path: string) {
  return adminModules.find((item) => item.to === path);
}
