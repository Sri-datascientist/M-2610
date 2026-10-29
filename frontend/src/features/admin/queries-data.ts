/**
 * Query Management Data and Utilities for Meyveda Admin
 * Handles platform user questions, complaints, support requests, and practitioner inquiries.
 */

export const queryUserTypes = [
  "Patient",
  "Doctor",
  "Pharmacy",
  "Pharmaceutical Company",
] as const;
export type QueryUserType = (typeof queryUserTypes)[number];

export const queryCategories = [
  "Complaint",
  "Technical Issue",
  "General Question",
  "Account Issue",
  "Payment",
  "Other",
] as const;
export type QueryCategory = (typeof queryCategories)[number];

export const queryPriorities = ["Low", "Medium", "High", "Urgent"] as const;
export type QueryPriority = (typeof queryPriorities)[number];

export const queryStatuses = [
  "Open",
  "In Progress",
  "Awaiting Response",
  "Resolved",
  "Closed",
] as const;
export type QueryStatus = (typeof queryStatuses)[number];

export type QueryMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderType: "user" | "admin";
  content: string;
  timestamp: string;
  deliveryStatus?: "Sent" | "Delivered" | "Read";
};

export type QueryAttachment = {
  name: string;
  size?: string;
  type?: string;
};

export type CustomerQuery = {
  id: string;
  subject: string;
  description: string;
  submitterId: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone?: string;
  userType: QueryUserType;
  category: QueryCategory;
  priority: QueryPriority;
  status: QueryStatus;
  assignedAdminId?: string;
  assignedAdminName?: string;
  submittedAt: string; // ISO date-time or YYYY-MM-DD HH:mm
  updatedAt: string;
  messages: QueryMessage[];
  resolutionDetails?: string;
  attachments?: QueryAttachment[];
  deleted?: boolean;
};

export type QuerySortOption = "newest" | "oldest" | "priority";

export type QueryFilters = {
  query: string;
  status: QueryStatus | "all";
  userType: QueryUserType | "all";
  category: QueryCategory | "all";
  priority: QueryPriority | "all";
  sort: QuerySortOption;
};

export const defaultQueryFilters: QueryFilters = {
  query: "",
  status: "all",
  userType: "all",
  category: "all",
  priority: "all",
  sort: "newest",
};

export const sampleQueries: CustomerQuery[] = [
  {
    id: "QRY-2041",
    subject: "Duplicate payment deducted during medicine order checkout",
    description:
      "I was placing an order for Ashwagandha Rasayana and the gateway timed out on the first attempt. I retried and the second payment went through, but my bank statement shows two deductions of ₹1,450. Please refund the duplicate transaction.",
    submitterId: "USR-PT-8092",
    submitterName: "Rohan Kulkarni",
    submitterEmail: "rohan.kulkarni@example.com",
    submitterPhone: "+91 98201 44820",
    userType: "Patient",
    category: "Payment",
    priority: "Urgent",
    status: "Open",
    submittedAt: "2026-10-15 09:14",
    updatedAt: "2026-10-15 09:14",
    attachments: [
      { name: "bank_statement_deduction.png", size: "240 KB", type: "image/png" },
      { name: "order_confirmation_INV-8821.pdf", size: "115 KB", type: "application/pdf" },
    ],
    messages: [
      {
        id: "MSG-101",
        senderId: "USR-PT-8092",
        senderName: "Rohan Kulkarni",
        senderType: "user",
        content:
          "I was placing an order for Ashwagandha Rasayana and the gateway timed out on the first attempt. I retried and the second payment went through, but my bank statement shows two deductions of ₹1,450. Please refund the duplicate transaction.",
        timestamp: "2026-10-15 09:14",
        deliveryStatus: "Delivered",
      },
    ],
  },
  {
    id: "QRY-2042",
    subject: "Unable to upload renewed NCISM registration certificate",
    description:
      "When attempting to update my practitioner credentials under Doctor Verification profile, the PDF upload fails with 'Validation timeout 504'. My renewed registration expires in 2029 and needs to be verified on the portal.",
    submitterId: "DOC-0810",
    submitterName: "Dr. Hari Prasad",
    submitterEmail: "hari.prasad@example.com",
    submitterPhone: "+91 94150 22880",
    userType: "Doctor",
    category: "Technical Issue",
    priority: "High",
    status: "In Progress",
    assignedAdminId: "USR-03",
    assignedAdminName: "Lakshmi Krishnan",
    submittedAt: "2026-10-14 14:22",
    updatedAt: "2026-10-14 16:05",
    attachments: [
      { name: "NCISM_Renewal_2026_2029.pdf", size: "1.2 MB", type: "application/pdf" },
      { name: "upload_error_screenshot.png", size: "320 KB", type: "image/png" },
    ],
    messages: [
      {
        id: "MSG-102",
        senderId: "DOC-0810",
        senderName: "Dr. Hari Prasad",
        senderType: "user",
        content:
          "When attempting to update my practitioner credentials under Doctor Verification profile, the PDF upload fails with 'Validation timeout 504'. My renewed registration expires in 2029 and needs to be verified on the portal.",
        timestamp: "2026-10-14 14:22",
        deliveryStatus: "Read",
      },
      {
        id: "MSG-103",
        senderId: "USR-03",
        senderName: "Lakshmi Krishnan",
        senderType: "admin",
        content:
          "Namaste Dr. Hari Prasad. Thank you for reporting this issue. Our engineering team identified an intermittent gateway buffer limit on file uploads exceeding 1MB. We are patching the upload handler and will manually verify your attached certificate in the meantime.",
        timestamp: "2026-10-14 16:05",
        deliveryStatus: "Delivered",
      },
    ],
  },
  {
    id: "QRY-2043",
    subject: "Batch reconciliation discrepancy for Chyawanprash 500g",
    description:
      "Batch BTH-4491 shipped by Sahyadri Botanics shows 120 units in portal dispatch, but only 114 units were received intact with 6 damaged jars during transit. A credit note or replacement request is needed.",
    submitterId: "USR-PH-3310",
    submitterName: "Sanjeevani Ayurvedic Pharmacy",
    submitterEmail: "orders@sanjeevani-ayur.in",
    submitterPhone: "+91 80 2345 6789",
    userType: "Pharmacy",
    category: "Complaint",
    priority: "High",
    status: "In Progress",
    assignedAdminId: "USR-01",
    assignedAdminName: "Ananya Iyer",
    submittedAt: "2026-10-14 11:30",
    updatedAt: "2026-10-14 13:45",
    attachments: [
      { name: "transit_damage_inspection.jpg", size: "850 KB", type: "image/jpeg" },
      { name: "delivery_challan_signed.pdf", size: "210 KB", type: "application/pdf" },
    ],
    messages: [
      {
        id: "MSG-104",
        senderId: "USR-PH-3310",
        senderName: "Sanjeevani Ayurvedic Pharmacy",
        senderType: "user",
        content:
          "Batch BTH-4491 shipped by Sahyadri Botanics shows 120 units in portal dispatch, but only 114 units were received intact with 6 damaged jars during transit. A credit note or replacement request is needed.",
        timestamp: "2026-10-14 11:30",
        deliveryStatus: "Read",
      },
      {
        id: "MSG-105",
        senderId: "USR-01",
        senderName: "Ananya Iyer",
        senderType: "admin",
        content:
          "Hello Sanjeevani Pharmacy team. We have flagged the damaged units with Sahyadri Botanics logistics and opened Transit Incident INC-2089. An adjusted credit note for 6 units is being generated.",
        timestamp: "2026-10-14 13:45",
        deliveryStatus: "Delivered",
      },
    ],
  },
  {
    id: "QRY-2044",
    subject: "Clarification on GMP audit schedule for Phase 2 manufacturing unit",
    description:
      "We submitted our facility expansion documentation for the Haridwar unit on 1st October. Could the compliance committee confirm the expected date for the virtual inspection review?",
    submitterId: "MFG-002",
    submitterName: "Dhootapapeshwar Labs",
    submitterEmail: "regulatory@dhootapapeshwar.example.com",
    submitterPhone: "+91 22 2430 5511",
    userType: "Pharmaceutical Company",
    category: "General Question",
    priority: "Medium",
    status: "Awaiting Response",
    assignedAdminId: "USR-01",
    assignedAdminName: "Ananya Iyer",
    submittedAt: "2026-10-13 16:50",
    updatedAt: "2026-10-14 10:15",
    messages: [
      {
        id: "MSG-106",
        senderId: "MFG-002",
        senderName: "Dhootapapeshwar Labs",
        senderType: "user",
        content:
          "We submitted our facility expansion documentation for the Haridwar unit on 1st October. Could the compliance committee confirm the expected date for the virtual inspection review?",
        timestamp: "2026-10-13 16:50",
        deliveryStatus: "Read",
      },
      {
        id: "MSG-107",
        senderId: "USR-01",
        senderName: "Ananya Iyer",
        senderType: "admin",
        content:
          "The compliance panel has scheduled slot reviews between 22nd and 24th October. We have requested your quality head to share preferred 2-hour time slots via the manufacturer portal.",
        timestamp: "2026-10-14 10:15",
        deliveryStatus: "Delivered",
      },
    ],
  },
  {
    id: "QRY-2045",
    subject: "Password reset link not received on registered mobile number",
    description:
      "I requested an SMS OTP to reset my patient login password, but no message arrived after 3 attempts. Email reset also did not show up in inbox or spam.",
    submitterId: "USR-PT-9104",
    submitterName: "Sunita Deshmukh",
    submitterEmail: "sunita.d@example.com",
    submitterPhone: "+91 98402 11984",
    userType: "Patient",
    category: "Account Issue",
    priority: "Low",
    status: "Resolved",
    assignedAdminId: "USR-01",
    assignedAdminName: "Ananya Iyer",
    submittedAt: "2026-10-12 11:05",
    updatedAt: "2026-10-12 14:30",
    resolutionDetails:
      "SMS gateway provider routing issue resolved. Account verification link regenerated and confirmed successful by user.",
    messages: [
      {
        id: "MSG-108",
        senderId: "USR-PT-9104",
        senderName: "Sunita Deshmukh",
        senderType: "user",
        content:
          "I requested an SMS OTP to reset my patient login password, but no message arrived after 3 attempts. Email reset also did not show up in inbox or spam.",
        timestamp: "2026-10-12 11:05",
        deliveryStatus: "Read",
      },
      {
        id: "MSG-109",
        senderId: "USR-01",
        senderName: "Ananya Iyer",
        senderType: "admin",
        content:
          "Hello Sunita, we identified a temporary DND carrier filtering on SMS traffic for your telecom circle. We have sent a direct one-time secure reset link to your verified email. Please complete your password setup.",
        timestamp: "2026-10-12 14:20",
        deliveryStatus: "Read",
      },
      {
        id: "MSG-110",
        senderId: "USR-PT-9104",
        senderName: "Sunita Deshmukh",
        senderType: "user",
        content: "Thank you so much! I was able to reset my password and access my consultation history.",
        timestamp: "2026-10-12 14:30",
        deliveryStatus: "Read",
      },
    ],
  },
  {
    id: "QRY-2046",
    subject: "Prescription digital signature validation error in portal",
    description:
      "When issuing e-prescriptions for Panchakarma follow-ups today, the portal returned error 'DSC token verification failed: algorithm RS256 expired cert'. This is blocking urgent outpatient prescriptions.",
    submitterId: "DOC-0774",
    submitterName: "Dr. Lakshmi Rao",
    submitterEmail: "lakshmi.rao@example.com",
    submitterPhone: "+91 98450 33012",
    userType: "Doctor",
    category: "Technical Issue",
    priority: "Urgent",
    status: "In Progress",
    assignedAdminId: "USR-01",
    assignedAdminName: "Ananya Iyer",
    submittedAt: "2026-10-15 10:45",
    updatedAt: "2026-10-15 11:10",
    attachments: [
      { name: "dsc_error_log.txt", size: "14 KB", type: "text/plain" },
    ],
    messages: [
      {
        id: "MSG-111",
        senderId: "DOC-0774",
        senderName: "Dr. Lakshmi Rao",
        senderType: "user",
        content:
          "When issuing e-prescriptions for Panchakarma follow-ups today, the portal returned error 'DSC token verification failed: algorithm RS256 expired cert'. This is blocking urgent outpatient prescriptions.",
        timestamp: "2026-10-15 10:45",
        deliveryStatus: "Read",
      },
      {
        id: "MSG-112",
        senderId: "USR-01",
        senderName: "Ananya Iyer",
        senderType: "admin",
        content:
          "Dr. Rao, our security team refreshed the intermediate CA certificate for the prescription signing bridge at 11:05. Please re-insert your USB crypto token or clear the browser signing cache. We are monitoring live signatures.",
        timestamp: "2026-10-15 11:10",
        deliveryStatus: "Delivered",
      },
    ],
  },
  {
    id: "QRY-2047",
    subject: "Query regarding GST invoice breakdown for bulk formulation purchase",
    description:
      "Invoice INV-2026-0918 shows an 18% GST rate on classical Triphala Churna instead of the 12% concessional rate applicable under AYUSH Notification 2024. Please issue an amended tax invoice.",
    submitterId: "USR-PH-4120",
    submitterName: "Arogya Kendra Pharmacy",
    submitterEmail: "accounts@arogyakendra.co.in",
    submitterPhone: "+91 44 2827 9100",
    userType: "Pharmacy",
    category: "Payment",
    priority: "Medium",
    status: "Resolved",
    assignedAdminId: "USR-02",
    assignedAdminName: "Meera Pillai",
    submittedAt: "2026-10-11 15:30",
    updatedAt: "2026-10-13 12:00",
    resolutionDetails:
      "HSN code revised from 30049011 to classical formulation rate 12%. Credit note CN-104 issued and updated invoice delivered.",
    messages: [
      {
        id: "MSG-113",
        senderId: "USR-PH-4120",
        senderName: "Arogya Kendra Pharmacy",
        senderType: "user",
        content:
          "Invoice INV-2026-0918 shows an 18% GST rate on classical Triphala Churna instead of the 12% concessional rate applicable under AYUSH Notification 2024. Please issue an amended tax invoice.",
        timestamp: "2026-10-11 15:30",
        deliveryStatus: "Read",
      },
      {
        id: "MSG-114",
        senderId: "USR-02",
        senderName: "Meera Pillai",
        senderType: "admin",
        content:
          "We reviewed the HSN classification with our accounts department. You are correct; the classical text formulation qualifies for the 12% slab. Credit note CN-104 has been issued to your ledger.",
        timestamp: "2026-10-13 12:00",
        deliveryStatus: "Delivered",
      },
    ],
  },
  {
    id: "QRY-2048",
    subject: "Guideline question on classical Sanskrit verse references in label claims",
    description:
      "We are finalizing labeling for our new Shirodhara taila. Does the Meyveda catalog require Charaka Samhita chapter-verse references on the primary carton or is the leaflet sufficient?",
    submitterId: "MFG-003",
    submitterName: "Kottakkal Arya Vaidya Sala Partner",
    submitterEmail: "compliance@kottakkal-partner.in",
    submitterPhone: "+91 483 274 2216",
    userType: "Pharmaceutical Company",
    category: "Other",
    priority: "Low",
    status: "Closed",
    assignedAdminId: "USR-01",
    assignedAdminName: "Ananya Iyer",
    submittedAt: "2026-10-09 10:00",
    updatedAt: "2026-10-10 16:20",
    resolutionDetails:
      "Provided standard packaging guideline v2.4. Secondary carton/leaflet reference is compliant.",
    messages: [
      {
        id: "MSG-115",
        senderId: "MFG-003",
        senderName: "Kottakkal Arya Vaidya Sala Partner",
        senderType: "user",
        content:
          "We are finalizing labeling for our new Shirodhara taila. Does the Meyveda catalog require Charaka Samhita chapter-verse references on the primary carton or is the leaflet sufficient?",
        timestamp: "2026-10-09 10:00",
        deliveryStatus: "Read",
      },
      {
        id: "MSG-116",
        senderId: "USR-01",
        senderName: "Ananya Iyer",
        senderType: "admin",
        content:
          "Under Meyveda Catalog Guideline section 4.2, Samhita citation on the package insert leaflet is sufficient, provided the Granthokta formulation name and licence number appear on the outer carton.",
        timestamp: "2026-10-10 16:20",
        deliveryStatus: "Read",
      },
    ],
  },
];

export function queryCounts(items: readonly CustomerQuery[]) {
  const active = items.filter((q) => !q.deleted);
  return {
    total: active.length,
    open: active.filter((q) => q.status === "Open").length,
    inProgress: active.filter((q) => q.status === "In Progress").length,
    resolved: active.filter((q) => q.status === "Resolved").length,
    closed: active.filter((q) => q.status === "Closed").length,
    awaiting: active.filter((q) => q.status === "Awaiting Response").length,
  };
}

const priorityWeight: Record<QueryPriority, number> = {
  Urgent: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export function filterQueries(
  items: readonly CustomerQuery[],
  filters: QueryFilters,
): CustomerQuery[] {
  const needle = filters.query.trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (item.deleted) return false;
    if (filters.status !== "all" && item.status !== filters.status) return false;
    if (filters.userType !== "all" && item.userType !== filters.userType) return false;
    if (filters.category !== "all" && item.category !== filters.category) return false;
    if (filters.priority !== "all" && item.priority !== filters.priority) return false;
    if (!needle) return true;

    const haystack = [
      item.id,
      item.subject,
      item.submitterName,
      item.submitterEmail,
      item.description,
      item.category,
      item.userType,
      item.priority,
      item.status,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(needle);
  });

  return sortQueries(filtered, filters.sort);
}

export function sortQueries(
  items: CustomerQuery[],
  sortOption: QuerySortOption,
): CustomerQuery[] {
  return [...items].sort((a, b) => {
    if (sortOption === "priority") {
      const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (diff !== 0) return diff;
      return b.submittedAt.localeCompare(a.submittedAt);
    }
    if (sortOption === "oldest") {
      return a.submittedAt.localeCompare(b.submittedAt);
    }
    // newest (default)
    return b.submittedAt.localeCompare(a.submittedAt);
  });
}

export function addMessageToQuery(
  items: CustomerQuery[],
  queryId: string,
  message: Omit<QueryMessage, "id" | "timestamp">,
): { ok: true; items: CustomerQuery[]; messageId: string } | { ok: false; message: string } {
  const query = items.find((q) => q.id === queryId && !q.deleted);
  if (!query) return { ok: false, message: "Query not found." };
  if (!message.content.trim()) return { ok: false, message: "Response message cannot be empty." };

  const pad = (n: number) => String(n).padStart(2, "0");
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const messageId = `MSG-${Date.now().toString().slice(-4)}`;

  const newMessage: QueryMessage = {
    ...message,
    id: messageId,
    content: message.content.trim(),
    timestamp,
    deliveryStatus: "Sent",
  };

  const nextItems = items.map((q) =>
    q.id === queryId
      ? {
          ...q,
          updatedAt: timestamp,
          messages: [...q.messages, newMessage],
        }
      : q,
  );

  return { ok: true, items: nextItems, messageId };
}

export function updateQueryStatus(
  items: CustomerQuery[],
  queryId: string,
  status: QueryStatus,
  resolutionNote?: string,
): { ok: true; items: CustomerQuery[] } | { ok: false; message: string } {
  const query = items.find((q) => q.id === queryId && !q.deleted);
  if (!query) return { ok: false, message: "Query not found." };

  const pad = (n: number) => String(n).padStart(2, "0");
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const nextItems = items.map((q) =>
    q.id === queryId
      ? {
          ...q,
          status,
          updatedAt: timestamp,
          ...(resolutionNote ? { resolutionDetails: resolutionNote } : {}),
        }
      : q,
  );

  return { ok: true, items: nextItems };
}

export function updateQueryPriority(
  items: CustomerQuery[],
  queryId: string,
  priority: QueryPriority,
): { ok: true; items: CustomerQuery[] } | { ok: false; message: string } {
  const query = items.find((q) => q.id === queryId && !q.deleted);
  if (!query) return { ok: false, message: "Query not found." };

  const pad = (n: number) => String(n).padStart(2, "0");
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const nextItems = items.map((q) =>
    q.id === queryId
      ? {
          ...q,
          priority,
          updatedAt: timestamp,
        }
      : q,
  );

  return { ok: true, items: nextItems };
}

export function assignQueryAdmin(
  items: CustomerQuery[],
  queryId: string,
  adminId: string,
  adminName: string,
): { ok: true; items: CustomerQuery[] } | { ok: false; message: string } {
  const query = items.find((q) => q.id === queryId && !q.deleted);
  if (!query) return { ok: false, message: "Query not found." };

  const pad = (n: number) => String(n).padStart(2, "0");
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const nextItems = items.map((q) =>
    q.id === queryId
      ? {
          ...q,
          assignedAdminId: adminId,
          assignedAdminName: adminName,
          updatedAt: timestamp,
        }
      : q,
  );

  return { ok: true, items: nextItems };
}

export function deleteQuery(
  items: CustomerQuery[],
  queryId: string,
): { ok: true; items: CustomerQuery[] } | { ok: false; message: string } {
  const query = items.find((q) => q.id === queryId && !q.deleted);
  if (!query) return { ok: false, message: "Query not found." };

  const nextItems = items.map((q) =>
    q.id === queryId ? { ...q, deleted: true, status: "Closed" as QueryStatus } : q,
  );

  return { ok: true, items: nextItems };
}
