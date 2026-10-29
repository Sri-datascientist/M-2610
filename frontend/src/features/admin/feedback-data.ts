export type FeedbackCategory =
  | "Doctor Portal"
  | "Formulation Guidelines"
  | "Prescription Workflow"
  | "Verification Process"
  | "Product Catalog"
  | "General Experience";

export type FeedbackPriority = "Low" | "Medium" | "High" | "Urgent";
export type FeedbackStatus = "New" | "Under Review" | "Resolved" | "Closed";

export type FeedbackNote = {
  at: string;
  by: string;
  text: string;
};

export type FeedbackRecord = {
  id: string;
  submitterName: string;
  submitterType: "Doctor" | "Manufacturer" | "Pharmacist" | "Admin";
  submitterId?: string;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  submittedDate: string;
  subject: string;
  description: string;
  rating?: number | undefined;
  internalNotes: FeedbackNote[];
  resolutionNotes?: string | undefined;
  resolvedAt?: string | undefined;
  sample: boolean;
};

export const seedFeedback: FeedbackRecord[] = [
  {
    id: "FDB-501",
    submitterName: "Dr. Meera Nair",
    submitterType: "Doctor",
    submitterId: "DOC-1042",
    category: "Prescription Workflow",
    priority: "High",
    status: "Under Review",
    submittedDate: "2026-10-14",
    subject: "Dosage unit selection for classical taila formulations",
    description:
      "When prescribing taila drops or oral doses, the dropdown defaults to ml but frequently requires matra/tola units for traditional panchakarma therapies. Can we include traditional measurements in the picker?",
    rating: 4,
    internalNotes: [
      {
        at: "2026-10-15 10:30",
        by: "Ananya Iyer",
        text: "Forwarded requirement to Clinical Informatics working group.",
      },
    ],
    sample: true,
  },
  {
    id: "FDB-502",
    submitterName: "Joseph Mathew (Malabar Extracts)",
    submitterType: "Manufacturer",
    submitterId: "MFR-22",
    category: "Verification Process",
    priority: "Medium",
    status: "New",
    submittedDate: "2026-10-16",
    subject: "Form 25D renewal document upload format",
    description:
      "Our state licensing body issues digitally signed multi-page PDFs with embedded certificates that exceed the previous 5MB limit. Please consider expanding the attachment size to 15MB.",
    rating: 3,
    internalNotes: [],
    sample: true,
  },
  {
    id: "FDB-503",
    submitterName: "Dr. Hari Prasad",
    submitterType: "Doctor",
    submitterId: "DOC-0810",
    category: "Formulation Guidelines",
    priority: "Low",
    status: "Resolved",
    submittedDate: "2026-09-28",
    subject: "Bhavana Dravya clarity in classical Guggulu monographs",
    description:
      "Monograph notes for Yogaraja Guggulu would benefit from referencing the exact decoctions utilized for bhavana processing.",
    rating: 5,
    internalNotes: [
      {
        at: "2026-09-30 14:00",
        by: "Meera Pillai",
        text: "Updated reference monographs in Library version 2.",
      },
    ],
    resolutionNotes: "Updated the classical processing steps in Ayurveda Library monograph reference.",
    resolvedAt: "2026-09-30 14:15",
    sample: true,
  },
  {
    id: "FDB-504",
    submitterName: "Dr. Arjun Deshmukh",
    submitterType: "Doctor",
    submitterId: "DOC-0988",
    category: "Doctor Portal",
    priority: "Medium",
    status: "Closed",
    submittedDate: "2026-10-02",
    subject: "Dark mode support on mobile browser tablet view",
    description:
      "During evening clinic consultations, having high contrast dark mode helps reduce screen glare while checking patient records.",
    rating: 4,
    internalNotes: [
      {
        at: "2026-10-03 09:15",
        by: "Ananya Iyer",
        text: "Noted for platform UI roadmap phase 2.",
      },
    ],
    resolutionNotes: "Recorded in Phase 2 design system review.",
    resolvedAt: "2026-10-03 09:30",
    sample: true,
  },
  {
    id: "FDB-505",
    submitterName: "Asha Rao (Himalaya Wellness)",
    submitterType: "Manufacturer",
    submitterId: "MFR-07",
    category: "Product Catalog",
    priority: "Urgent",
    status: "Under Review",
    submittedDate: "2026-10-18",
    subject: "Batch expiry date validation format for multi-pack SKUs",
    description:
      "When filing batch releases for combo packs, the system currently expects a single expiry date. We need the ability to record component expiry dates if blister packs differ.",
    rating: 4,
    internalNotes: [
      {
        at: "2026-10-18 16:20",
        by: "Ananya Iyer",
        text: "Priority triage. Reviewed with Quality & Batches module lead.",
      },
    ],
    sample: true,
  },
];
