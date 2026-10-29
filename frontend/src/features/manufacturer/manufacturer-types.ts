export type ProductStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Changes Requested"
  | "Rejected"
  | "Archived";

export interface RegulatoryDocument {
  id: string;
  name: string;
  documentNumber: string;
  documentType: "Form 25D" | "GMP Certificate" | "COA" | "AYUSH License" | "Lab Report" | "Other";
  uploadDate: string;
  fileSize: string;
  expiryDate?: string;
  status: "Verified" | "Pending Review" | "Changes Requested";
  fileUrl?: string;
}

export interface ProductSubmissionHistory {
  id: string;
  date: string;
  action: "Created" | "Submitted" | "Review Started" | "Changes Requested" | "Resubmitted" | "Approved" | "Revision Proposed";
  performedBy: string;
  notes?: string;
}

export interface Product {
  id: string;
  productCode: string;
  name: string;
  brandName?: string;
  category: "Classical Formulations" | "Patent & Proprietary" | "Herbal Supplements" | "Oils & Ghrithas" | "Asava & Arishta" | "Bhasma & Pishti";
  dosageForm: "Tablet" | "Syrup" | "Capsule" | "Churna" | "Thailam" | "Kashayam" | "Lehyam" | "Vati" | "Ghritham";
  description: string;
  intendedUse: string;
  ingredients: string; // composition & herbs
  strength: string;
  packaging: string;
  storageInstructions: string;
  licenseNumber: string;
  status: ProductStatus;
  submissionDate: string;
  lastUpdated: string;
  rejectionReason?: string;
  revisionNotes?: string;
  documents: RegulatoryDocument[];
  history: ProductSubmissionHistory[];
  isRevisionPending?: boolean;
  proposedChanges?: Partial<Product>;
  imageUrl?: string;
}

export type ResponseCategory =
  | "Clinical Efficacy"
  | "Dosage Inquiry"
  | "Prescription Adoption"
  | "Tolerance & Safety"
  | "Ingredient Clarification"
  | "Packaging Feedback";

export interface DoctorResponse {
  id: string;
  productId: string;
  productName: string;
  doctorDisplayName: string; // Authorized display e.g. "Dr. R. Sharma (BAMS, MD)"
  doctorSpecialty: string;
  state: string;
  district: string;
  responseDate: string;
  category: ResponseCategory;
  summary: string;
  clinicalObservations: string;
  adoptionLevel: "Regular Prescriber" | "Occasional Prescriber" | "Evaluating Clinical Trials";
  status: "New" | "Reviewed" | "Followed Up" | "Archived";
  internalNotes?: string;
}

export type FeedbackCategory =
  | "Formulation Texture/Taste"
  | "Packaging & Dispensing"
  | "Patient Acceptance"
  | "Price Point & Accessibility"
  | "Shelf Life / Sedimentation"
  | "Efficacy vs Classical Standard";

export type FeedbackPriority = "Low" | "Medium" | "High" | "Urgent";
export type FeedbackStatus = "Open" | "In Review" | "Manufacturer Responded" | "Resolved";

export interface DoctorFeedback {
  id: string;
  productId: string;
  productName: string;
  doctorDisplayName: string;
  doctorLocation: string;
  category: FeedbackCategory;
  feedbackDate: string;
  summary: string;
  details: string;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  manufacturerNotes?: string;
  responseHistory: {
    id: string;
    date: string;
    author: string;
    message: string;
  }[];
  resolutionTimestamp?: string;
}

export interface TerritoryInsight {
  id: string;
  state: string;
  district: string;
  interestedDoctorsCount: number;
  regularPrescribersCount: number;
  topProducts: {
    productName: string;
    doctorCount: number;
    interestScore: number; // 0-100
  }[];
  totalResponses: number;
  totalFeedbackCount: number;
  trendingDirection: "up" | "stable" | "down";
  reportingPeriod: string;
}

export type ADRSeverity = "Mild" | "Moderate" | "Severe" | "Life-Threatening";
export type ADRStatus = "Reported" | "Under Medical Evaluation" | "Manufacturer Review Requested" | "Closed / Assessed";

export interface ADRReport {
  id: string;
  productId: string;
  productName: string;
  batchNumber: string;
  reportDate: string;
  severity: ADRSeverity;
  status: ADRStatus;
  reportingRegion: string;
  followUpStatus: "Pending Manufacturer Response" | "Information Submitted" | "Medical Board Review" | "Resolved";
  reportedSymptoms: string[];
  reactionDescription: string;
  patientAgeGroup: string; // Anonymized demographic e.g. "Adult (35-45)"
  patientGender: string; // "Female"
  concurrentMedications?: string;
  dechallengeOutcome?: "Symptoms abated upon stopping" | "No change" | "Unknown";
  authorizedAssessmentInfo?: string;
  medicalBoardNotes?: string;
  manufacturerFollowUpNotes?: string;
  updatedAt: string;
}

export interface ManufacturerProfile {
  id: string;
  legalCompanyName: string;
  brandName: string;
  logoUrl?: string;
  registeredAddress: string;
  state: string;
  district: string;
  pinCode: string;
  contactPerson: string;
  designation: string;
  businessEmail: string;
  businessPhone: string;
  website: string;
  gstin: string;
  form25DNumber: string;
  form25DIssueDate: string;
  form25DExpiryDate: string;
  ayushLicenseNumber: string;
  gmpCertificateNumber: string;
  verificationStatus: "Verified" | "Under Review" | "Action Required" | "Re-verification Pending";
  profileCompletionPercentage: number;
  documents: RegulatoryDocument[];
  outstandingRequests: {
    id: string;
    title: string;
    description: string;
    dateRequested: string;
    status: "Pending" | "Submitted";
  }[];
}
