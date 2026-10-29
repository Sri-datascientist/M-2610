/**
 * Practitioner publications are not stored by this portal.
 * The records below are development samples so the admin page can be reviewed.
 * They are not live articles, journals, or case studies.
 *
 * A content service would need to list records by doctor id, unpublish or
 * restore one record by id, and write the administrator, content id, action,
 * and time to the audit log. Removing content must not change the doctor.
 *
 * A record is on the public list only when its status is Published and the
 * linked doctor currently has status Verified.
 */

export const publishedContentTypes = ["Article", "Research Journal", "Case Study"] as const;
export type PublishedContentType = (typeof publishedContentTypes)[number];

export const publishedContentStatuses = ["Published", "Removed", "Pending Review"] as const;
export type PublishedContentStatus = (typeof publishedContentStatuses)[number];

export type PractitionerContent = {
  id: string;
  doctorId: string;
  type: PublishedContentType;
  title: string;
  category: string;
  tags: string[];
  publishedOn: string;
  updatedOn?: string;
  status: PublishedContentStatus;
  summary: string;
  body: string;
  references: string[];
  attachments: string[];
  sample: true;
};

export type ContentList = PublishedContentStatus;

export type ContentFilters = {
  query: string;
  type: PublishedContentType | "all";
  category: string;
  from: string;
  to: string;
  list: ContentList;
};

type DoctorRef = { id: string; status: string; name?: string };

export const samplePractitionerContent: PractitionerContent[] = [
  {
    id: "PC-1001",
    doctorId: "DOC-0774",
    type: "Article",
    title: "Sample article: notes on kshara karma wound care",
    category: "Shalya Tantra",
    tags: ["kshara", "wound care"],
    publishedOn: "2026-09-12",
    updatedOn: "2026-09-18",
    status: "Published",
    summary: "Development sample. A short note on routine wound observation after kshara karma.",
    body: "Development sample. This is not a published clinical article.\n\nThe note describes washing the area, watching for excess discharge, and arranging a follow-up visit. It does not name a patient or a hospital.",
    references: ["Sample citation: a classical Shalya Tantra chapter, not retrieved from a library record."],
    attachments: [],
    sample: true,
  },
  {
    id: "PC-1002",
    doctorId: "DOC-0810",
    type: "Research Journal",
    title: "Sample journal: ashwagandha monograph notes",
    category: "Dravyaguna",
    tags: ["ashwagandha", "monograph"],
    publishedOn: "2026-08-02",
    status: "Published",
    summary: "Development sample. A reading note about ashwagandha identification and common substitutes.",
    body: "Development sample. This is not a published research journal.\n\nThe note compares leaf shape, root colour, and the names used in two teaching handouts. No laboratory result is included.",
    references: ["Sample citation: a Dravyaguna teaching handout, not a retrieved paper."],
    attachments: ["Sample comparison table (name only; no file is stored)"],
    sample: true,
  },
  {
    id: "PC-1003",
    doctorId: "DOC-0774",
    type: "Case Study",
    title: "Sample case note: discomfort after a minor procedure, age band 40–49",
    category: "Shalya Tantra",
    tags: ["anonymised", "follow-up"],
    publishedOn: "2026-10-01",
    status: "Published",
    summary: "Development sample. An anonymised follow-up note for an adult in the 40–49 age band.",
    body: "Development sample. This is not a real clinical record.\n\nAn adult in the 40–49 age band reported discomfort after a minor procedure. No name, address, phone number, photograph, or hospital identifier is included. The discomfort eased over two weeks of routine follow-up.",
    references: [],
    attachments: [],
    sample: true,
  },
  {
    id: "PC-1004",
    doctorId: "DOC-0810",
    type: "Article",
    title: "Sample draft: guduchi identification notes",
    category: "Dravyaguna",
    tags: ["guduchi", "draft"],
    publishedOn: "2026-10-09",
    status: "Pending Review",
    summary: "Development sample. A draft waiting for review, not on the public list.",
    body: "Development sample. This draft is waiting for review and is not publicly published.",
    references: [],
    attachments: [],
    sample: true,
  },
  {
    id: "PC-1005",
    doctorId: "DOC-0774",
    type: "Research Journal",
    title: "Sample journal: surgical instrument checklist",
    category: "Shalya Tantra",
    tags: ["instruments"],
    publishedOn: "2026-07-15",
    status: "Removed",
    summary: "Development sample. Previously listed, now removed from public availability.",
    body: "Development sample. This journal note has been removed from the public list and kept for review.",
    references: ["Sample citation: an instrument checklist used in teaching."],
    attachments: [],
    sample: true,
  },
  {
    id: "PC-1006",
    doctorId: "DOC-1042",
    type: "Article",
    title: "Sample article from a practitioner who is not verified",
    category: "Kayachikitsa",
    tags: ["excluded"],
    publishedOn: "2026-10-08",
    status: "Published",
    summary: "Development sample. The author is not verified, so this stays off the published list.",
    body: "Development sample. Publication status alone does not make this public.",
    references: [],
    attachments: [],
    sample: true,
  },
  {
    id: "PC-1007",
    doctorId: "DOC-0904",
    type: "Case Study",
    title: "Sample case note from a suspended practitioner",
    category: "Kayachikitsa",
    tags: ["excluded"],
    publishedOn: "2026-06-20",
    status: "Published",
    summary: "Development sample. The author is suspended, so this stays off the published list.",
    body: "Development sample. No patient identifiers are included. The author is not currently verified.",
    references: [],
    attachments: [],
    sample: true,
  },
];

export function isVerifiedAuthor(doctors: readonly DoctorRef[], doctorId: string) {
  return doctors.some((doctor) => doctor.id === doctorId && doctor.status === "Verified");
}

export function contentForList<T extends { doctorId: string; status: PublishedContentStatus }>(
  items: readonly T[],
  doctors: readonly DoctorRef[],
  list: ContentList,
) {
  return items.filter((item) => item.status === list && isVerifiedAuthor(doctors, item.doctorId));
}

export function publishedCounts(
  items: readonly PractitionerContent[],
  doctors: readonly DoctorRef[],
) {
  const published = contentForList(items, doctors, "Published");
  return {
    total: published.length,
    articles: published.filter((item) => item.type === "Article").length,
    journals: published.filter((item) => item.type === "Research Journal").length,
    cases: published.filter((item) => item.type === "Case Study").length,
  };
}

export function contentCategories(
  items: readonly PractitionerContent[],
  doctors: readonly DoctorRef[],
) {
  const names = items
    .filter((item) => isVerifiedAuthor(doctors, item.doctorId))
    .map((item) => item.category);
  return [...new Set(names)].sort((left, right) => left.localeCompare(right));
}

export function filterPublishedContent(
  items: readonly PractitionerContent[],
  doctors: readonly DoctorRef[],
  filters: ContentFilters,
) {
  const needle = filters.query.trim().toLowerCase();
  return contentForList(items, doctors, filters.list).filter((item) => {
    if (filters.type !== "all" && item.type !== filters.type) return false;
    if (filters.category !== "all" && item.category !== filters.category) return false;
    if (filters.from && item.publishedOn < filters.from) return false;
    if (filters.to && item.publishedOn > filters.to) return false;
    if (!needle) return true;
    const author = doctors.find((doctor) => doctor.id === item.doctorId)?.name ?? "";
    const haystack = [item.title, author, item.summary, item.category, ...item.tags]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function removePublication<T extends { id: string; status: PublishedContentStatus }>(
  items: readonly T[],
  id: string,
): { ok: true; items: T[] } | { ok: false; message: string } {
  const current = items.find((item) => item.id === id);
  if (!current) return { ok: false, message: "That content record was not found." };
  if (current.status === "Removed") return { ok: false, message: "This content is already removed." };
  return {
    ok: true,
    items: items.map((item) => (item.id === id ? { ...item, status: "Removed" } : item)),
  };
}

export function restorePublication<T extends { id: string; status: PublishedContentStatus }>(
  items: readonly T[],
  id: string,
  authorVerified: boolean,
): { ok: true; items: T[] } | { ok: false; message: string } {
  const current = items.find((item) => item.id === id);
  if (!current) return { ok: false, message: "That content record was not found." };
  if (current.status !== "Removed") return { ok: false, message: "Only removed content can be restored." };
  if (!authorVerified) {
    return { ok: false, message: "Only a verified practitioner's content can return to the published list." };
  }
  return {
    ok: true,
    items: items.map((item) => (item.id === id ? { ...item, status: "Published" } : item)),
  };
}
