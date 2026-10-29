export type JournalStatus = "Indexed" | "Pending Review" | "Syncing" | "Archived";

export type JournalRecord = {
  id: string;
  title: string;
  category: string;
  issn: string;
  source: string;
  status: JournalStatus;
  publicationDate: string;
  lastFetchedAt: string | null;
  syncStatus: "Success" | "Idle" | "Syncing" | "Error";
  syncError?: string | undefined;
  abstract: string;
  articleCount: number;
  authors: string[];
  externalUrl: string;
  sample: boolean;
};

export const journalCategories = [
  "Kayachikitsa",
  "Dravyaguna",
  "Panchakarma",
  "Shalya Tantra",
  "Pharmacognosy",
  "Formulation Science",
] as const;

export const seedJournals: JournalRecord[] = [
  {
    id: "JRN-801",
    title: "Monograph Analysis & Quality Assessment of Withania somnifera (Ashwagandha)",
    category: "Dravyaguna",
    issn: "0974-8520",
    source: "AYU Research Journal",
    status: "Indexed",
    publicationDate: "2026-08-15",
    lastFetchedAt: "2026-10-18 11:30",
    syncStatus: "Success",
    abstract:
      "A systematic evaluation of withanolide markers across cultivated and wild accessions. This entry provides indexed reference parameters for standardized extract formulations in clinical Ayurveda.",
    articleCount: 14,
    authors: ["Dr. Hari Prasad", "Dr. Meera Pillai"],
    externalUrl: "https://ayujournal.example/article/ashwagandha-monograph-2026",
    sample: true,
  },
  {
    id: "JRN-802",
    title: "Clinical Efficacy of Modified Vamana Karma in Metabolic Dysregulation",
    category: "Panchakarma",
    issn: "2249-9571",
    source: "International Journal of Ayurvedic Medicine",
    status: "Indexed",
    publicationDate: "2026-09-02",
    lastFetchedAt: "2026-10-17 14:15",
    syncStatus: "Success",
    abstract:
      "A 6-month prospective observational study analyzing lipid profile markers and systemic inflammation following standardized classical preparatory snehapana and supervised sodhana therapies.",
    articleCount: 8,
    authors: ["Dr. Arjun Deshmukh", "Dr. Lakshmi Rao"],
    externalUrl: "https://ijam.example/vamana-metabolic-study",
    sample: true,
  },
  {
    id: "JRN-803",
    title: "Microbiological Safety and Phytochemical Profiles of Standardized Asava-Arishta Preparations",
    category: "Formulation Science",
    issn: "0976-5921",
    source: "Journal of Ayurveda & Integrative Medical Sciences",
    status: "Pending Review",
    publicationDate: "2026-10-04",
    lastFetchedAt: "2026-10-19 09:20",
    syncStatus: "Idle",
    abstract:
      "A multi-batch chromatographic study verifying naturally generated self-fermentation ethanol concentrations against limits prescribed in the Ayurvedic Pharmacopoeia of India.",
    articleCount: 6,
    authors: ["Sahyadri Botanics R&D", "QA Technical Team"],
    externalUrl: "https://jaims.example/asava-arishta-quality-2026",
    sample: true,
  },
  {
    id: "JRN-804",
    title: "Kshara Sutra Management of Complex Fistula-in-Ano: Multi-Center Outcome Audit",
    category: "Shalya Tantra",
    issn: "2320-7329",
    source: "Indian Journal of Ancient Medicine and Yoga",
    status: "Indexed",
    publicationDate: "2026-07-20",
    lastFetchedAt: "2026-10-16 08:45",
    syncStatus: "Success",
    abstract:
      "A retrospective audit of 240 outpatient surgical cases evaluating primary healing rate, recurrence, and preservation of continence utilizing standardized Apamarga kshara threads.",
    articleCount: 22,
    authors: ["Dr. Lakshmi Rao", "All India Ayurveda Surgical Group"],
    externalUrl: "https://ijamy.example/kshara-sutra-audit-2026",
    sample: true,
  },
  {
    id: "JRN-805",
    title: "Automated Metadata Harvester for DHARA / NCISM Ayurveda Knowledge Repositories",
    category: "Kayachikitsa",
    issn: "2349-5006",
    source: "Digital Health & Ayurveda Index",
    status: "Syncing",
    publicationDate: "2026-10-12",
    lastFetchedAt: "2026-10-19 13:45",
    syncStatus: "Syncing",
    abstract:
      "Configured scheduled crawler pipeline connecting digital repositories of peer-reviewed classical clinical trials. Running in demonstration integration mode.",
    articleCount: 45,
    authors: ["Grantha Digital Systems", "Ananya Iyer"],
    externalUrl: "https://grantha.meyveda.example/sync/dhara-repo",
    sample: true,
  },
  {
    id: "JRN-806",
    title: "Comparative Study of Classical Ghrita Storage Vessels and Peroxide Value Shifts",
    category: "Formulation Science",
    issn: "0974-8520",
    source: "AYU Research Journal",
    status: "Archived",
    publicationDate: "2025-11-10",
    lastFetchedAt: "2026-05-10 10:00",
    syncStatus: "Error",
    syncError: "Upstream repository endpoint moved permanently (HTTP 301). Contact system administrator.",
    abstract:
      "Historical storage study investigating rancidity parameters in brass, stainless steel, and glazed clay containers across tropical ambient conditions.",
    articleCount: 4,
    authors: ["Kerala Herbals Quality Unit"],
    externalUrl: "https://ayujournal.example/archived/ghrita-storage",
    sample: true,
  },
];
