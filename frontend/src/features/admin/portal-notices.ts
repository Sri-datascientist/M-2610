import { seedDoctors } from "@/features/admin/catalog-data";
import { doctorSlugMap } from "@/features/admin/doctor-slug";
import type { AdminRoute } from "@/features/admin/modules";

/**
 * Session inbox for Meyveda Admin Phase 1.
 * There is no notification service. Each row points at a record that already
 * exists in the Phase 1 catalogs or the activity log.
 */
export type NoticeGroup = "Today" | "Yesterday" | "Earlier";

export type PortalNotice = {
  id: string;
  title: string;
  description: string;
  module: string;
  to: AdminRoute;
  doctorSlug?: string;
  when: string;
  group: NoticeGroup;
  read: boolean;
};

const noticeGroups: NoticeGroup[] = ["Today", "Yesterday", "Earlier"];

function doctorSlug(id: string): string {
  const slug = doctorSlugMap(seedDoctors).get(id);
  if (!slug) throw new Error(`No profile slug for ${id}`);
  return slug;
}

export const phaseNotices: PortalNotice[] = [
  {
    id: "notice-meera",
    title: "Dr. Meera Nair is awaiting verification",
    description: "Registration NCISM/KER/2014/1182 is still in Registered status.",
    module: "Doctors",
    to: "/admin/doctors",
    doctorSlug: doctorSlug("DOC-1042"),
    when: "08 Oct 2026",
    group: "Earlier",
    read: false,
  },
  {
    id: "notice-anjali",
    title: "Dr. Anjali Menon is awaiting verification",
    description: "Registration NCISM/KER/2019/5528 was submitted and is still Registered.",
    module: "Doctors",
    to: "/admin/doctors",
    doctorSlug: doctorSlug("DOC-1048"),
    when: "11 Oct 2026",
    group: "Earlier",
    read: false,
  },
  {
    id: "notice-sahyadri",
    title: "Sahyadri Botanics applied for verification",
    description: "The company application and AYUSH licence are pending review.",
    module: "Manufacturers",
    to: "/admin/manufacturers",
    when: "12 Oct 2026",
    group: "Earlier",
    read: false,
  },
  {
    id: "notice-yogaraja",
    title: "Yogaraja Guggulu was submitted",
    description: "Version 1 from Sahyadri Botanics is pending review.",
    module: "Medicines",
    to: "/admin/medicines",
    when: "05 Oct 2026",
    group: "Earlier",
    read: false,
  },
  {
    id: "notice-hridaya",
    title: "Ashtanga Hridaya, Sutrasthana is in review",
    description: "Version 1 was submitted and is waiting for a publication decision.",
    module: "Ayurveda Library",
    to: "/admin/library",
    when: "02 Oct 2026",
    group: "Earlier",
    read: false,
  },
  {
    id: "notice-brahmi",
    title: "Brahmi is still a draft",
    description: "The ingredient entry has not been activated.",
    module: "Ingredients",
    to: "/admin/ingredients",
    when: "03 Oct 2026",
    group: "Earlier",
    read: false,
  },
  {
    id: "notice-sub-310",
    title: "Triphala Guggulu version 3 needs a decision",
    description: "Submission SUB-310 changes the pack size and formula ratio.",
    module: "Product Approvals",
    to: "/admin/approvals",
    when: "09 Oct 2026",
    group: "Earlier",
    read: false,
  },
  {
    id: "notice-ash",
    title: "Batch ASH-24018 is on hold",
    description: "Loss on drying is outside specification for Ashwagandha Churna.",
    module: "Quality & Batches",
    to: "/admin/quality",
    when: "03 Oct 2026",
    group: "Earlier",
    read: false,
  },
  {
    id: "notice-adr",
    title: "ADR-2041 needs follow-up",
    description: "The Triphala Guggulu report is open and linked to batch TRP-1182.",
    module: "Safety & ADR Reports",
    to: "/admin/safety",
    when: "12 Oct 2026",
    group: "Earlier",
    read: false,
  },
  {
    id: "notice-case",
    title: "CASE-441 is awaiting review",
    description: "Anonymization is incomplete on the joint-stiffness case.",
    module: "Clinical Cases",
    to: "/admin/cases",
    when: "09 Oct 2026",
    group: "Earlier",
    read: false,
  },
  {
    id: "notice-hari",
    title: "An inactive account was refused sign-in",
    description: "Hari Prasad’s account is inactive. The attempt is in the activity log.",
    module: "Users & Permissions",
    to: "/admin/users",
    when: "10 Oct 2026",
    group: "Earlier",
    read: true,
  },
  {
    id: "notice-lakshmi",
    title: "Dr. Lakshmi Rao was verified",
    description: "Ananya Iyer recorded the verification in the activity log.",
    module: "Settings & Activity Logs",
    to: "/admin/settings",
    when: "14 Oct 2026",
    group: "Yesterday",
    read: true,
  },
];

export function noticesInGroup(items: readonly PortalNotice[], group: NoticeGroup) {
  return items.filter((item) => item.group === group);
}

export function orderedNoticeGroups(items: readonly PortalNotice[]) {
  return noticeGroups.filter((group) => items.some((item) => item.group === group));
}
