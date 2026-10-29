export type ActionResult = { ok: true } | { ok: false; message: string };

export type ComplianceEvent = { at: string; text: string; by: string };
export type ComplianceNote = { at: string; text: string; by: string };
export type ComplianceCheck = { label: string; done: boolean; required?: boolean };
export type ComplianceDocument = { name: string; submitted: string; version?: number };
export type FormulaLine = { ingredient: string; part: string; quantity: string };

export const approvalStatuses = [
  "Pending Review",
  "Under Review",
  "Changes Requested",
  "Approved",
  "Rejected",
] as const;
export type ApprovalStatus = (typeof approvalStatuses)[number];

export const qualityStatuses = [
  "Awaiting Review",
  "Under Review",
  "Released",
  "On Hold",
  "Quarantined",
  "Recalled",
] as const;
export type QualityStatus = (typeof qualityStatuses)[number];

export const releaseStatuses = ["Not released", "Released", "Recalled"] as const;
export type ReleaseStatus = (typeof releaseStatuses)[number];

export const safetyStatuses = [
  "New",
  "Under Triage",
  "Under Investigation",
  "Follow-up Required",
  "Resolved",
  "Closed",
] as const;
export type SafetyStatus = (typeof safetyStatuses)[number];

export const severities = ["Mild", "Moderate", "Serious"] as const;
export type Severity = (typeof severities)[number];

export const caseReviewStatuses = [
  "Pending Review",
  "Under Review",
  "Changes Requested",
  "Approved",
  "Rejected",
] as const;
export type CaseReviewStatus = (typeof caseReviewStatuses)[number];

export const anonymizationStatuses = ["Incomplete", "Complete"] as const;
export type AnonymizationStatus = (typeof anonymizationStatuses)[number];

export const complianceReviewers = ["Ananya Iyer", "Meera Pillai"] as const;

export type FormulaDiff = {
  ingredient: string;
  part: string;
  previous: string;
  submitted: string;
  change: "Unchanged" | "Changed" | "Added" | "Removed";
};

export type Submission = {
  id: string;
  product: string;
  brand: string;
  sku: string;
  manufacturer: string;
  dosageForm: string;
  submittedDate: string;
  reviewer: string;
  status: ApprovalStatus;
  version: number;
  previousVersion: number | null;
  packSize: string;
  previousPackSize: string | null;
  classification: string;
  labels: string[];
  previousLabels: string[];
  formulation: FormulaLine[];
  previousFormulation: FormulaLine[] | null;
  changeNote: string;
  documents: ComplianceDocument[];
  notes: ComplianceNote[];
  history: ComplianceEvent[];
  decidedAt: string | null;
};

export type BatchFlag = { label: string; detail: string };
export type AnalysisRow = {
  parameter: string;
  specification: string;
  result: string;
  disposition: "Within specification" | "Outside specification";
};
export type ManufacturingStep = { step: string; recorded: string; operator: string };
export type RecallRecord = { reason: string; initiated: string; scope: string };

export type Batch = {
  id: string;
  product: string;
  manufacturer: string;
  batchDate: string;
  qualityStatus: QualityStatus;
  releaseStatus: ReleaseStatus;
  quantity: string;
  expiry: string;
  site: string;
  documentsOnFile: string[];
  coa: AnalysisRow[];
  bmr: ManufacturingStep[];
  flags: BatchFlag[];
  checklist: ComplianceCheck[];
  releaseHistory: ComplianceEvent[];
  notes: ComplianceNote[];
  history: ComplianceEvent[];
  recall: RecallRecord | null;
};

export type SafetyCase = {
  id: string;
  product: string;
  manufacturer: string;
  batchId: string | null;
  reportDate: string;
  reportedSeverity: Severity;
  assessedSeverity: Severity | null;
  assessmentNote: string;
  status: SafetyStatus;
  reviewer: string;
  reference: string;
  ageBand: string;
  sex: string;
  region: string;
  summary: string;
  withheld: string[];
  followUp: string;
  outcome: string;
  notes: ComplianceNote[];
  history: ComplianceEvent[];
};

export type ClinicalCase = {
  id: string;
  title: string;
  category: string;
  submittedDate: string;
  anonymization: AnonymizationStatus;
  reviewStatus: CaseReviewStatus;
  setting: string;
  narrative: string;
  withheld: string[];
  checklist: ComplianceCheck[];
  notes: ComplianceNote[];
  history: ComplianceEvent[];
};

const releaseChecks = (done: boolean[]): ComplianceCheck[] => [
  { label: "Certificate of Analysis reviewed", done: done[0] ?? false },
  { label: "Batch manufacturing record reviewed", done: done[1] ?? false },
  { label: "Open quality flags addressed", done: done[2] ?? false },
];

const privacyChecks = (done: boolean[]): ComplianceCheck[] => [
  {
    label: "Direct identifiers removed from the narrative",
    required: true,
    done: done[0] ?? false,
  },
  { label: "Contact details removed", required: true, done: done[1] ?? false },
  { label: "Facility and clinician names removed", required: true, done: done[2] ?? false },
  { label: "Images checked for identifying marks", required: true, done: done[3] ?? false },
  { label: "Dates limited to month and year", required: false, done: done[4] ?? false },
];

export function anonymizationFromChecks(checks: ComplianceCheck[]): AnonymizationStatus {
  return checks.some((item) => item.required && !item.done) ? "Incomplete" : "Complete";
}

export function compareFormulation(
  previous: FormulaLine[] | null,
  submitted: FormulaLine[],
): FormulaDiff[] {
  if (!previous) {
    return submitted.map((line) => ({
      ingredient: line.ingredient,
      part: line.part,
      previous: "—",
      submitted: line.quantity,
      change: "Added",
    }));
  }
  const names = [
    ...previous.map((line) => line.ingredient),
    ...submitted
      .map((line) => line.ingredient)
      .filter((name) => !previous.some((line) => line.ingredient === name)),
  ];
  return names.map((name) => {
    const before = previous.find((line) => line.ingredient === name);
    const after = submitted.find((line) => line.ingredient === name);
    const change = !before
      ? "Added"
      : !after
        ? "Removed"
        : before.quantity === after.quantity
          ? "Unchanged"
          : "Changed";
    return {
      ingredient: name,
      part: after?.part ?? before?.part ?? "",
      previous: before?.quantity ?? "—",
      submitted: after?.quantity ?? "—",
      change,
    };
  });
}

export function canReleaseBatch(batch: Batch): ActionResult {
  if (batch.qualityStatus === "Recalled" || batch.releaseStatus === "Recalled") {
    return { ok: false, message: "A recalled batch cannot be released from this review." };
  }
  if (batch.releaseStatus === "Released" || batch.qualityStatus === "Released") {
    return { ok: false, message: "This batch is already released." };
  }
  if (batch.qualityStatus === "Quarantined") {
    return {
      ok: false,
      message: "A quarantined batch stays unreleased until that status is cleared by a reviewer.",
    };
  }
  if (batch.checklist.some((item) => !item.done)) {
    return {
      ok: false,
      message:
        "Complete the review checklist before releasing this batch. Documents on file do not release it.",
    };
  }
  return { ok: true };
}

export function canApproveCase(item: ClinicalCase): ActionResult {
  if (item.reviewStatus === "Approved" || item.reviewStatus === "Rejected") {
    return { ok: false, message: "This decision is already recorded." };
  }
  if (anonymizationFromChecks(item.checklist) === "Incomplete") {
    return {
      ok: false,
      message: "Complete the required anonymization checks before approving this case.",
    };
  }
  return { ok: true };
}

/** Product plus manufacturer. Uses linked batch or direct manufacturer when available. */
export function reportedProductLabel(
  item: Pick<SafetyCase, "product" | "batchId"> & { manufacturer?: string },
  batches: readonly Pick<Batch, "id" | "manufacturer">[],
): string {
  const product = item.product.trim();
  const batch = item.batchId ? batches.find((entry) => entry.id === item.batchId) : undefined;
  if (batch?.manufacturer.trim()) {
    return `${product} – ${batch.manufacturer.trim()}`;
  }
  return product;
}

export function canCloseSafety(item: SafetyCase): ActionResult {
  if (item.status === "Closed") return { ok: false, message: "This case is already closed." };
  if (!item.assessedSeverity || item.assessmentNote.trim().length < 5) {
    return {
      ok: false,
      message: "Record a reviewer severity assessment before closing this case.",
    };
  }
  return { ok: true };
}

export const seedSubmissions: Submission[] = [
  {
    id: "SUB-310",
    product: "Triphala Guggulu",
    brand: "Kottakkal",
    sku: "MV-TRP-30T",
    manufacturer: "Arya Vaidya Sala",
    dosageForm: "Tablet",
    submittedDate: "09 Oct 2026",
    reviewer: "Unassigned",
    status: "Pending Review",
    version: 3,
    previousVersion: 2,
    packSize: "60 tablets",
    previousPackSize: "30 tablets",
    classification: "Classical guggulu preparation",
    labels: ["Take as directed by a registered Ayurveda practitioner"],
    previousLabels: ["For digestive support as directed by a practitioner"],
    formulation: [
      { ingredient: "Haritaki", part: "Fruit rind", quantity: "1.2 parts" },
      { ingredient: "Vibhitaki", part: "Fruit rind", quantity: "1.2 parts" },
      { ingredient: "Amalaki", part: "Fruit rind", quantity: "1.2 parts" },
      { ingredient: "Guggulu", part: "Oleo-gum-resin", quantity: "1 part" },
    ],
    previousFormulation: [
      { ingredient: "Haritaki", part: "Fruit rind", quantity: "1 part" },
      { ingredient: "Vibhitaki", part: "Fruit rind", quantity: "1 part" },
      { ingredient: "Amalaki", part: "Fruit rind", quantity: "1 part" },
      { ingredient: "Guggulu", part: "Oleo-gum-resin", quantity: "1 part" },
    ],
    changeNote: "Pack size and triphala ratio changed. Version 2 stays approved.",
    documents: [
      { name: "Label artwork revision", submitted: "09 Oct 2026", version: 3 },
      { name: "Stability summary", submitted: "09 Oct 2026", version: 3 },
    ],
    notes: [],
    history: [
      { at: "09 Oct 2026 10:12", text: "Version 3 submitted for review", by: "Priya Nambiar" },
    ],
    decidedAt: null,
  },
  {
    id: "SUB-304",
    product: "Dashamoola Kwath",
    brand: "Sahyadri",
    sku: "MV-DSH-200",
    manufacturer: "Sahyadri Botanics",
    dosageForm: "Kwath",
    submittedDate: "06 Oct 2026",
    reviewer: "Ananya Iyer",
    status: "Under Review",
    version: 1,
    previousVersion: null,
    packSize: "200 ml",
    previousPackSize: null,
    classification: "Classical kwath",
    labels: ["Decoction of the ten roots"],
    previousLabels: [],
    formulation: [
      { ingredient: "Bilva", part: "Root", quantity: "1 part" },
      { ingredient: "Agnimantha", part: "Root", quantity: "1 part" },
      { ingredient: "Shyonaka", part: "Root", quantity: "1 part" },
      { ingredient: "Patala", part: "Root", quantity: "1 part" },
      { ingredient: "Gambhari", part: "Root", quantity: "1 part" },
    ],
    previousFormulation: null,
    changeNote: "First catalog submission.",
    documents: [{ name: "Kwath process note", submitted: "06 Oct 2026", version: 1 }],
    notes: [],
    history: [
      { at: "07 Oct 2026 11:00", text: "Review started", by: "Ananya Iyer" },
      { at: "06 Oct 2026 17:22", text: "Version 1 submitted", by: "Neha Krishnan" },
    ],
    decidedAt: null,
  },
  {
    id: "SUB-298",
    product: "Yogaraja Guggulu",
    brand: "Sahyadri",
    sku: "MV-YOG-30T",
    manufacturer: "Sahyadri Botanics",
    dosageForm: "Tablet",
    submittedDate: "05 Oct 2026",
    reviewer: "Unassigned",
    status: "Pending Review",
    version: 1,
    previousVersion: null,
    packSize: "30 tablets",
    previousPackSize: null,
    classification: "Classical guggulu preparation",
    labels: ["Classical compound. Practitioner directed."],
    previousLabels: [],
    formulation: [
      { ingredient: "Guggulu", part: "Oleo-gum-resin", quantity: "1 part" },
      { ingredient: "Triphala", part: "Fruit rind", quantity: "1 part" },
      { ingredient: "Trikatu", part: "Fruit", quantity: "1 part" },
    ],
    previousFormulation: null,
    changeNote: "First catalog submission.",
    documents: [{ name: "Formula sheet", submitted: "05 Oct 2026", version: 1 }],
    notes: [],
    history: [{ at: "05 Oct 2026 13:40", text: "Version 1 submitted", by: "Neha Krishnan" }],
    decidedAt: null,
  },
  {
    id: "SUB-276",
    product: "Chandraprabha Vati",
    brand: "Dabur",
    sku: "MV-CHP-40T",
    manufacturer: "Dabur Ayurveda Unit",
    dosageForm: "Tablet",
    submittedDate: "19 Aug 2026",
    reviewer: "Ananya Iyer",
    status: "Changes Requested",
    version: 4,
    previousVersion: 3,
    packSize: "40 tablets",
    previousPackSize: "40 tablets",
    classification: "Classical vati",
    labels: ["Supports urinary comfort"],
    previousLabels: ["Classical compound tablet"],
    formulation: [
      { ingredient: "Shilajatu", part: "Purified exudate", quantity: "1 part" },
      { ingredient: "Guggulu", part: "Oleo-gum-resin", quantity: "1 part" },
    ],
    previousFormulation: [
      { ingredient: "Shilajatu", part: "Purified exudate", quantity: "1 part" },
      { ingredient: "Guggulu", part: "Oleo-gum-resin", quantity: "1 part" },
    ],
    changeNote: "Label wording changed. The approved formula in version 3 is unchanged.",
    documents: [{ name: "Label artwork", submitted: "19 Aug 2026", version: 4 }],
    notes: [
      {
        at: "22 Aug 2026 10:15",
        text: "Remove the disease claim from the label.",
        by: "Ananya Iyer",
      },
    ],
    history: [
      {
        at: "22 Aug 2026 10:15",
        text: "Changes requested: remove the disease claim from the label.",
        by: "Ananya Iyer",
      },
    ],
    decidedAt: "22 Aug 2026 10:15",
  },
  {
    id: "SUB-241",
    product: "Ksheerabala Taila",
    brand: "Kottakkal",
    sku: "MV-KSB-100",
    manufacturer: "Arya Vaidya Sala",
    dosageForm: "Taila",
    submittedDate: "03 Feb 2026",
    reviewer: "Ananya Iyer",
    status: "Rejected",
    version: 1,
    previousVersion: null,
    packSize: "100 ml",
    previousPackSize: null,
    classification: "Classical taila",
    labels: ["External and internal use"],
    previousLabels: [],
    formulation: [
      { ingredient: "Bala", part: "Root", quantity: "1 part" },
      { ingredient: "Ksheera", part: "Milk", quantity: "4 parts" },
      { ingredient: "Tila taila", part: "Sesame oil", quantity: "4 parts" },
    ],
    previousFormulation: null,
    changeNote: "First catalog submission.",
    documents: [{ name: "Label artwork", submitted: "03 Feb 2026", version: 1 }],
    notes: [
      {
        at: "10 Feb 2026 12:05",
        text: "Internal-use claim is not supported by the submitted label.",
        by: "Ananya Iyer",
      },
    ],
    history: [
      {
        at: "10 Feb 2026 12:05",
        text: "Rejected: internal-use claim is unsupported.",
        by: "Ananya Iyer",
      },
    ],
    decidedAt: "10 Feb 2026 12:05",
  },
  {
    id: "SUB-188",
    product: "Ashwagandha Churna",
    brand: "Himalaya",
    sku: "MV-ASH-100",
    manufacturer: "Himalaya Wellness",
    dosageForm: "Churna",
    submittedDate: "04 Mar 2026",
    reviewer: "Ananya Iyer",
    status: "Approved",
    version: 2,
    previousVersion: 1,
    packSize: "100 g",
    previousPackSize: "60 g",
    classification: "Single-herb churna",
    labels: ["Withania somnifera root powder"],
    previousLabels: ["Withania somnifera root powder"],
    formulation: [{ ingredient: "Ashwagandha", part: "Root", quantity: "100%" }],
    previousFormulation: [{ ingredient: "Ashwagandha", part: "Root", quantity: "100%" }],
    changeNote: "Pack size changed. The root powder formula is unchanged.",
    documents: [{ name: "Label artwork", submitted: "04 Mar 2026", version: 2 }],
    notes: [],
    history: [{ at: "06 Mar 2026 09:40", text: "Version 2 approved", by: "Ananya Iyer" }],
    decidedAt: "06 Mar 2026 09:40",
  },
];

export const seedBatches: Batch[] = [
  {
    id: "ASH-24018",
    product: "Ashwagandha Churna",
    manufacturer: "Himalaya Wellness",
    batchDate: "02 Oct 2026",
    qualityStatus: "On Hold",
    releaseStatus: "Not released",
    quantity: "1,200 packs",
    expiry: "Sep 2028",
    site: "Makali plant",
    documentsOnFile: ["Certificate of Analysis", "Batch manufacturing record"],
    coa: [
      {
        parameter: "Description",
        specification: "Fine tan powder",
        result: "Fine tan powder",
        disposition: "Within specification",
      },
      {
        parameter: "Loss on drying",
        specification: "Not more than 6.0%",
        result: "8.4%",
        disposition: "Outside specification",
      },
      {
        parameter: "Total ash",
        specification: "Not more than 8.0%",
        result: "5.1%",
        disposition: "Within specification",
      },
    ],
    bmr: [
      { step: "Dispensing", recorded: "02 Oct 2026 08:10", operator: "Compounding operator" },
      { step: "Sifting", recorded: "02 Oct 2026 09:40", operator: "Compounding operator" },
      { step: "Packing", recorded: "02 Oct 2026 14:05", operator: "Packing operator" },
    ],
    flags: [
      {
        label: "Moisture above specification",
        detail: "Loss on drying is 8.4% against a limit of 6.0%.",
      },
    ],
    checklist: releaseChecks([false, false, false]),
    releaseHistory: [
      {
        at: "03 Oct 2026 11:20",
        text: "Release withheld after the moisture result",
        by: "Ananya Iyer",
      },
    ],
    notes: [],
    history: [
      { at: "03 Oct 2026 11:20", text: "Quality status set to On Hold", by: "Ananya Iyer" },
      { at: "02 Oct 2026 16:00", text: "Batch record filed", by: "QA reviewer" },
    ],
    recall: null,
  },
  {
    id: "TRP-1182",
    product: "Triphala Guggulu",
    manufacturer: "Arya Vaidya Sala",
    batchDate: "28 Sep 2026",
    qualityStatus: "Released",
    releaseStatus: "Released",
    quantity: "4,000 packs",
    expiry: "Aug 2028",
    site: "Kottakkal factory",
    documentsOnFile: ["Certificate of Analysis", "Batch manufacturing record"],
    coa: [
      {
        parameter: "Description",
        specification: "Dark brown tablets",
        result: "Dark brown tablets",
        disposition: "Within specification",
      },
      {
        parameter: "Average weight",
        specification: "500 mg ± 5%",
        result: "498 mg",
        disposition: "Within specification",
      },
      {
        parameter: "Disintegration",
        specification: "Not more than 30 minutes",
        result: "18 minutes",
        disposition: "Within specification",
      },
    ],
    bmr: [
      { step: "Dispensing", recorded: "28 Sep 2026 07:40", operator: "Compounding operator" },
      { step: "Compression", recorded: "28 Sep 2026 12:15", operator: "Compression operator" },
      { step: "Packing", recorded: "28 Sep 2026 16:30", operator: "Packing operator" },
    ],
    flags: [],
    checklist: releaseChecks([true, true, true]),
    releaseHistory: [
      { at: "13 Oct 2026 11:05", text: "Batch released after checklist review", by: "Ananya Iyer" },
    ],
    notes: [],
    history: [
      {
        at: "13 Oct 2026 11:05",
        text: "Released. Checklist was complete before the decision.",
        by: "Ananya Iyer",
      },
    ],
    recall: null,
  },
  {
    id: "DSH-0912",
    product: "Dashamoola Kwath",
    manufacturer: "Sahyadri Botanics",
    batchDate: "08 Oct 2026",
    qualityStatus: "Awaiting Review",
    releaseStatus: "Not released",
    quantity: "800 bottles",
    expiry: "Mar 2027",
    site: "Thrissur extraction unit",
    documentsOnFile: ["Certificate of Analysis", "Batch manufacturing record"],
    coa: [
      {
        parameter: "Description",
        specification: "Brown liquid",
        result: "Brown liquid",
        disposition: "Within specification",
      },
      {
        parameter: "pH",
        specification: "4.5 to 6.0",
        result: "5.2",
        disposition: "Within specification",
      },
    ],
    bmr: [
      { step: "Extraction", recorded: "08 Oct 2026 09:00", operator: "Extraction operator" },
      { step: "Filling", recorded: "08 Oct 2026 15:20", operator: "Packing operator" },
    ],
    flags: [],
    checklist: releaseChecks([false, false, false]),
    releaseHistory: [],
    notes: [],
    history: [
      {
        at: "08 Oct 2026 17:10",
        text: "Documents filed. Release has not been decided.",
        by: "QA reviewer",
      },
    ],
    recall: null,
  },
  {
    id: "YOG-0771",
    product: "Yogaraja Guggulu",
    manufacturer: "Sahyadri Botanics",
    batchDate: "04 Oct 2026",
    qualityStatus: "Under Review",
    releaseStatus: "Not released",
    quantity: "2,200 packs",
    expiry: "Sep 2028",
    site: "Thrissur extraction unit",
    documentsOnFile: ["Certificate of Analysis", "Batch manufacturing record"],
    coa: [
      {
        parameter: "Description",
        specification: "Dark tablets",
        result: "Dark tablets",
        disposition: "Within specification",
      },
      {
        parameter: "Average weight",
        specification: "450 mg ± 5%",
        result: "446 mg",
        disposition: "Within specification",
      },
    ],
    bmr: [
      { step: "Dispensing", recorded: "04 Oct 2026 08:20", operator: "Compounding operator" },
      { step: "Compression", recorded: "04 Oct 2026 13:00", operator: "Compression operator" },
    ],
    flags: [],
    checklist: releaseChecks([true, true, false]),
    releaseHistory: [],
    notes: [],
    history: [
      {
        at: "06 Oct 2026 10:30",
        text: "Review started. Batch remains unreleased.",
        by: "Meera Pillai",
      },
    ],
    recall: null,
  },
  {
    id: "CHP-3304",
    product: "Chandraprabha Vati",
    manufacturer: "Dabur Ayurveda Unit",
    batchDate: "18 Sep 2026",
    qualityStatus: "Quarantined",
    releaseStatus: "Not released",
    quantity: "3,000 packs",
    expiry: "Aug 2028",
    site: "Ghaziabad unit 2",
    documentsOnFile: ["Certificate of Analysis", "Batch manufacturing record"],
    coa: [
      {
        parameter: "Description",
        specification: "Dark tablets",
        result: "Dark tablets",
        disposition: "Within specification",
      },
      {
        parameter: "Microbial limit",
        specification: "Within pharmacopoeial limit",
        result: "Above limit",
        disposition: "Outside specification",
      },
    ],
    bmr: [
      { step: "Compression", recorded: "18 Sep 2026 11:40", operator: "Compression operator" },
      { step: "Packing", recorded: "18 Sep 2026 17:05", operator: "Packing operator" },
    ],
    flags: [
      {
        label: "Microbial result above limit",
        detail: "The batch is quarantined pending a repeat test.",
      },
    ],
    checklist: releaseChecks([true, false, false]),
    releaseHistory: [
      { at: "20 Sep 2026 09:15", text: "Moved to quarantine. Not released.", by: "Ananya Iyer" },
    ],
    notes: [],
    history: [
      {
        at: "20 Sep 2026 09:15",
        text: "Quarantined after the microbial result",
        by: "Ananya Iyer",
      },
    ],
    recall: null,
  },
  {
    id: "KSB-0144",
    product: "Ksheerabala Taila",
    manufacturer: "Arya Vaidya Sala",
    batchDate: "20 Jan 2026",
    qualityStatus: "Recalled",
    releaseStatus: "Recalled",
    quantity: "600 bottles",
    expiry: "Dec 2027",
    site: "Kottakkal factory",
    documentsOnFile: ["Certificate of Analysis", "Batch manufacturing record", "Recall notice"],
    coa: [
      {
        parameter: "Description",
        specification: "Reddish oil",
        result: "Reddish oil",
        disposition: "Within specification",
      },
      {
        parameter: "Specific gravity",
        specification: "0.90 to 0.95",
        result: "0.92",
        disposition: "Within specification",
      },
    ],
    bmr: [
      { step: "Taila paka", recorded: "20 Jan 2026 10:00", operator: "Extraction operator" },
      { step: "Filling", recorded: "21 Jan 2026 12:30", operator: "Packing operator" },
    ],
    flags: [],
    checklist: releaseChecks([true, true, true]),
    releaseHistory: [
      { at: "12 Feb 2026 15:00", text: "Recall recorded for distributed packs", by: "Ananya Iyer" },
      { at: "28 Jan 2026 11:10", text: "Batch released", by: "Ananya Iyer" },
    ],
    notes: [],
    history: [
      { at: "12 Feb 2026 15:00", text: "Recalled after the label review", by: "Ananya Iyer" },
    ],
    recall: {
      reason: "The label allowed an unsupported internal-use direction.",
      initiated: "12 Feb 2026",
      scope: "Trade packs from batch KSB-0144 that were still in distribution.",
    },
  },
];

export const seedSafety: SafetyCase[] = [
  {
    id: "ADR-2041",
    product: "Triphala Guggulu",
    manufacturer: "Arya Vaidya Sala",
    batchId: "TRP-1182",
    reportDate: "12 Oct 2026",
    reportedSeverity: "Serious",
    assessedSeverity: null,
    assessmentNote: "",
    status: "Follow-up Required",
    reviewer: "Meera Pillai",
    reference: "ADR-2041-P",
    ageBand: "60–69",
    sex: "Female",
    region: "Kerala",
    summary:
      "A reporter described abdominal pain and reduced urine output starting two days after a classical tablet. The report asks whether the batch and other medicines should be checked. No diagnosis is recorded here.",
    withheld: ["Name", "Contact number", "Street address", "Clinician name"],
    followUp:
      "Ask the reporter for the start date of other medicines and whether treatment was sought.",
    outcome: "",
    notes: [],
    history: [
      { at: "12 Oct 2026 15:48", text: "Opened for follow-up", by: "Meera Pillai" },
      { at: "12 Oct 2026 14:10", text: "Report received", by: "Safety desk" },
    ],
  },
  {
    id: "ADR-1988",
    product: "Ashwagandha Churna",
    manufacturer: "Himalaya Wellness",
    batchId: "ASH-24018",
    reportDate: "04 Oct 2026",
    reportedSeverity: "Moderate",
    assessedSeverity: null,
    assessmentNote: "",
    status: "Under Investigation",
    reviewer: "Ananya Iyer",
    reference: "ADR-1988-P",
    ageBand: "40–49",
    sex: "Male",
    region: "Karnataka",
    summary:
      "The report describes gastric discomfort after a root powder. The batch is already on quality hold for moisture. This record does not decide whether the powder caused the discomfort.",
    withheld: ["Name", "Contact number", "Exact clinic"],
    followUp: "",
    outcome: "",
    notes: [
      {
        at: "05 Oct 2026 09:30",
        text: "Linked to batch ASH-24018 because the pack code matches.",
        by: "Ananya Iyer",
      },
    ],
    history: [
      { at: "05 Oct 2026 09:30", text: "Investigation opened", by: "Ananya Iyer" },
      { at: "04 Oct 2026 18:05", text: "Report received", by: "Safety desk" },
    ],
  },
  {
    id: "ADR-2102",
    product: "Dashamoola Kwath",
    manufacturer: "Sahyadri Botanics",
    batchId: "DSH-0912",
    reportDate: "11 Oct 2026",
    reportedSeverity: "Mild",
    assessedSeverity: null,
    assessmentNote: "",
    status: "New",
    reviewer: "Unassigned",
    reference: "ADR-2102-P",
    ageBand: "30–39",
    sex: "Female",
    region: "Tamil Nadu",
    summary:
      "A reporter noted a brief bitter aftertaste and nausea. No other symptoms are described. The report is waiting for triage.",
    withheld: ["Name", "Contact number", "Street address"],
    followUp: "",
    outcome: "",
    notes: [],
    history: [{ at: "11 Oct 2026 12:22", text: "Report received", by: "Safety desk" }],
  },
  {
    id: "ADR-2055",
    product: "Yogaraja Guggulu",
    manufacturer: "Sahyadri Botanics",
    batchId: null,
    reportDate: "10 Oct 2026",
    reportedSeverity: "Moderate",
    assessedSeverity: null,
    assessmentNote: "",
    status: "Under Triage",
    reviewer: "Unassigned",
    reference: "ADR-2055-P",
    ageBand: "50–59",
    sex: "Male",
    region: "Maharashtra",
    summary:
      "The report mentions skin itching during the first week of use. A batch code was not included. Triage has started and a reviewer is not yet assigned.",
    withheld: ["Name", "Contact number", "Photograph"],
    followUp: "",
    outcome: "",
    notes: [],
    history: [{ at: "10 Oct 2026 16:40", text: "Moved to triage", by: "Safety desk" }],
  },
  {
    id: "ADR-1870",
    product: "Chandraprabha Vati",
    manufacturer: "Dabur Ayurveda Unit",
    batchId: null,
    reportDate: "02 Sep 2026",
    reportedSeverity: "Moderate",
    assessedSeverity: "Moderate",
    assessmentNote:
      "The described gastric symptoms match the reported moderate severity. No further event was described.",
    status: "Resolved",
    reviewer: "Ananya Iyer",
    reference: "ADR-1870-P",
    ageBand: "70–79",
    sex: "Female",
    region: "Delhi",
    summary:
      "Gastric burning was reported and then settled after the preparation was stopped. The reviewer assessment is stored separately from this description.",
    withheld: ["Name", "Contact number", "Hospital number"],
    followUp: "",
    outcome: "",
    notes: [],
    history: [
      {
        at: "09 Sep 2026 11:00",
        text: "Marked resolved after follow-up was completed",
        by: "Ananya Iyer",
      },
      { at: "04 Sep 2026 10:12", text: "Severity assessed as Moderate", by: "Ananya Iyer" },
    ],
  },
  {
    id: "ADR-1766",
    product: "Ksheerabala Taila",
    manufacturer: "Arya Vaidya Sala",
    batchId: "KSB-0144",
    reportDate: "08 Feb 2026",
    reportedSeverity: "Serious",
    assessedSeverity: "Serious",
    assessmentNote:
      "The report describes hospital care after internal use. The assessment records that seriousness. It does not assign a cause.",
    status: "Closed",
    reviewer: "Meera Pillai",
    reference: "ADR-1766-P",
    ageBand: "50–59",
    sex: "Male",
    region: "Kerala",
    summary:
      "The de-identified report says the oil was taken internally and that hospital care followed. Batch KSB-0144 was later recalled for the label direction.",
    withheld: ["Name", "Contact number", "Hospital name", "Admission number"],
    followUp: "",
    outcome: "Closed after the recall was recorded. No further reporter contact was pending.",
    notes: [],
    history: [
      {
        at: "14 Feb 2026 09:20",
        text: "Closed: recall recorded and no follow-up remained",
        by: "Meera Pillai",
      },
    ],
  },
];

export const seedCases: ClinicalCase[] = [
  {
    id: "CASE-441",
    title: "Joint stiffness in outpatient care",
    category: "Kayachikitsa",
    submittedDate: "09 Oct 2026",
    anonymization: "Incomplete",
    reviewStatus: "Pending Review",
    setting: "Outpatient clinic, southern India",
    narrative:
      "An adult in the 40–49 age band attended in September 2026 with joint stiffness of about three months. The note describes diet, bowel habit, and a classical preparation discussed with the practitioner. A clinic photograph is still attached.",
    withheld: ["Name", "Phone number", "Clinic name", "Practitioner name"],
    checklist: privacyChecks([true, true, false, false, true]),
    notes: [],
    history: [{ at: "09 Oct 2026 13:10", text: "Case submitted for review", by: "Records desk" }],
  },
  {
    id: "CASE-452",
    title: "Childhood digestive complaint",
    category: "Kaumarbhritya",
    submittedDate: "12 Oct 2026",
    anonymization: "Incomplete",
    reviewStatus: "Pending Review",
    setting: "Outpatient clinic",
    narrative:
      "A child in the 5–9 age band was seen in October 2026 for irregular appetite. The note records diet advice and a classical preparation. The guardian's name is still present in the source file and must stay out of this view.",
    withheld: ["Child name", "Guardian name", "School", "Contact number"],
    checklist: privacyChecks([false, false, true, true, false]),
    notes: [],
    history: [{ at: "12 Oct 2026 09:05", text: "Case submitted for review", by: "Records desk" }],
  },
  {
    id: "CASE-438",
    title: "Panchakarma course summary",
    category: "Panchakarma",
    submittedDate: "03 Oct 2026",
    anonymization: "Complete",
    reviewStatus: "Under Review",
    setting: "Day-care therapy unit",
    narrative:
      "An adult in the 50–59 age band completed a short therapy course in August 2026. The note lists the procedures by classical name and the person's reported comfort at discharge. Dates are limited to the month.",
    withheld: ["Name", "Address", "Therapist names"],
    checklist: privacyChecks([true, true, true, true, true]),
    notes: [],
    history: [
      { at: "04 Oct 2026 11:40", text: "Anonymization checks completed", by: "Meera Pillai" },
      { at: "03 Oct 2026 15:25", text: "Case submitted for review", by: "Records desk" },
    ],
  },
  {
    id: "CASE-412",
    title: "Wound care follow-up",
    category: "Shalya Tantra",
    submittedDate: "18 Sep 2026",
    anonymization: "Incomplete",
    reviewStatus: "Changes Requested",
    setting: "Procedure room",
    narrative:
      "The note describes dressing of a limb wound over two visits in August 2026. A photograph still shows a hospital wrist label. The narrative itself does not include a name.",
    withheld: ["Name", "Hospital number", "Surgeon name"],
    checklist: privacyChecks([true, true, true, false, true]),
    notes: [
      {
        at: "21 Sep 2026 10:05",
        text: "Remove the photograph that shows the wrist label.",
        by: "Ananya Iyer",
      },
    ],
    history: [
      {
        at: "21 Sep 2026 10:05",
        text: "Changes requested: remove the identifying photograph.",
        by: "Ananya Iyer",
      },
    ],
  },
  {
    id: "CASE-390",
    title: "Seasonal respiratory note",
    category: "Kayachikitsa",
    submittedDate: "14 Aug 2026",
    anonymization: "Complete",
    reviewStatus: "Approved",
    setting: "Outpatient clinic",
    narrative:
      "An adult in the 30–39 age band reported cough and disturbed sleep in July 2026. The note records diet advice and a classical churna discussed in clinic. Identifiers were removed before approval.",
    withheld: ["Name", "Contact number", "Clinic name"],
    checklist: privacyChecks([true, true, true, true, true]),
    notes: [],
    history: [
      { at: "16 Aug 2026 12:30", text: "Approved after anonymization checks", by: "Ananya Iyer" },
    ],
  },
  {
    id: "CASE-355",
    title: "Therapy response note",
    category: "Panchakarma",
    submittedDate: "02 Jul 2026",
    anonymization: "Complete",
    reviewStatus: "Rejected",
    setting: "Residential therapy unit",
    narrative:
      "The submitted note described a therapy course but also included a claim of cure. The de-identified clinical description remains available for the record.",
    withheld: ["Name", "Room number", "Therapist names"],
    checklist: privacyChecks([true, true, true, true, true]),
    notes: [
      {
        at: "06 Jul 2026 09:50",
        text: "The cure claim is not accepted for publication.",
        by: "Meera Pillai",
      },
    ],
    history: [
      {
        at: "06 Jul 2026 09:50",
        text: "Rejected: the cure claim is not accepted.",
        by: "Meera Pillai",
      },
    ],
  },
];

export const caseCategories = [
  "Kayachikitsa",
  "Panchakarma",
  "Kaumarbhritya",
  "Shalya Tantra",
] as const;
