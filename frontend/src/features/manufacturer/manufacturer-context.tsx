import React, { createContext, useContext, useState, useEffect } from "react";
import type {
  Product,
  DoctorResponse,
  DoctorFeedback,
  TerritoryInsight,
  ADRReport,
  ManufacturerProfile,
  ProductStatus,
  RegulatoryDocument,
} from "./manufacturer-types";
import {
  initialProducts,
  initialDoctorResponses,
  initialDoctorFeedback,
  initialTerritoryInsights,
  initialADRReports,
  initialProfile,
} from "./manufacturer-mock-data";

export interface ManufacturerSession {
  brandName: string;
  contactPerson: string;
  email: string;
  licenseNumber: string;
}

export const DEMO_MANUFACTURERS: (ManufacturerSession & { password: string })[] = [
  {
    brandName: "AVN Herbals",
    contactPerson: "Dr. K. S. Ramanathan",
    email: "regulatory@avnherbals.in",
    password: "Meyveda@2026",
    licenseNumber: "TN/AYU/25D/2018-0912",
  },
];

interface ManufacturerContextType {
  products: Product[];
  doctorResponses: DoctorResponse[];
  doctorFeedback: DoctorFeedback[];
  territoryInsights: TerritoryInsight[];
  adrReports: ADRReport[];
  profile: ManufacturerProfile;
  session: ManufacturerSession | null;
  ready: boolean;
  signIn: (email: string, password: string) => ManufacturerSession | null;
  signOut: () => void;
  // Product actions
  addProduct: (productData: Omit<Product, "id" | "submissionDate" | "lastUpdated" | "history">, asDraft: boolean) => Product;
  updateProductDraft: (productId: string, updates: Partial<Product>) => void;
  submitProductForReview: (productId: string, notes?: string) => void;
  resubmitAfterChanges: (productId: string, updates: Partial<Product>, notes: string) => void;
  proposeProductRevision: (productId: string, proposedChanges: Partial<Product>, revisionNotes: string) => void;
  archiveProduct: (productId: string) => void;
  // Feedback actions
  respondToFeedback: (feedbackId: string, replyMessage: string) => void;
  updateFeedbackStatus: (feedbackId: string, status: DoctorFeedback["status"], internalNotes?: string) => void;
  // ADR actions
  submitADRFollowUp: (reportId: string, followUpNotes: string) => void;
  // Profile actions
  updateProfile: (updated: Partial<ManufacturerProfile>) => { requiresReverification: boolean };
  uploadProfileDocument: (doc: RegulatoryDocument) => void;
}

const ManufacturerContext = createContext<ManufacturerContextType | undefined>(undefined);

const STORAGE_KEY_PRODUCTS = "meyveda_mfg_products";
const STORAGE_KEY_FEEDBACK = "meyveda_mfg_feedback";
const STORAGE_KEY_ADR = "meyveda_mfg_adr";
const STORAGE_KEY_PROFILE = "meyveda_mfg_profile";
export const STORAGE_KEY_SESSION = "meyveda_mfg_session";

export const ManufacturerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
    }
  });

  const [doctorResponses] = useState<DoctorResponse[]>(initialDoctorResponses);

  const [doctorFeedback, setDoctorFeedback] = useState<DoctorFeedback[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FEEDBACK);
      return saved ? JSON.parse(saved) : initialDoctorFeedback;
    } catch {
      return initialDoctorFeedback;
    }
  });

  const [territoryInsights] = useState<TerritoryInsight[]>(initialTerritoryInsights);

  const [adrReports, setAdrReports] = useState<ADRReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ADR);
      return saved ? JSON.parse(saved) : initialADRReports;
    } catch {
      return initialADRReports;
    }
  });

  const [profile, setProfile] = useState<ManufacturerProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      return saved ? JSON.parse(saved) : initialProfile;
    } catch {
      return initialProfile;
    }
  });

  const [session, setSession] = useState<ManufacturerSession | null>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_SESSION);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_SESSION);
      if (saved) setSession(JSON.parse(saved));
    } catch (_e) {
      // ignore storage access errors
    }
    setReady(true);
  }, []);

  const signIn = (email: string, password: string): ManufacturerSession | null => {
    const acc = DEMO_MANUFACTURERS.find(
      (m) => m.email.toLowerCase() === email.trim().toLowerCase() && m.password === password,
    );
    if (!acc) return null;
    const s: ManufacturerSession = {
      brandName: acc.brandName,
      contactPerson: acc.contactPerson,
      email: acc.email,
      licenseNumber: acc.licenseNumber,
    };
    try {
      sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(s));
    } catch (_e) {
      // ignore storage access errors
    }
    setSession(s);
    return s;
  };

  const signOut = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY_SESSION);
    } catch (_e) {
      // ignore storage access errors
    }
    setSession(null);
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FEEDBACK, JSON.stringify(doctorFeedback));
    } catch (_e) {
      // ignore storage access errors
    }
  }, [doctorFeedback]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ADR, JSON.stringify(adrReports));
    } catch (_e) {
      // ignore storage access errors
    }
  }, [adrReports]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch (_e) {
      // ignore storage access errors
    }
  }, [profile]);

  const getTodayDate = (): string => new Date().toISOString().split("T")[0] ?? "2026-03-31";

  const addProduct = (
    productData: Omit<Product, "id" | "submissionDate" | "lastUpdated" | "history">,
    asDraft: boolean
  ): Product => {
    const today = getTodayDate();
    const newId = `AYU-PRD-${Math.floor(100 + Math.random() * 900)}`;
    const status: ProductStatus = asDraft ? "Draft" : "Submitted";

    const newProduct: Product = {
      ...productData,
      id: newId,
      status,
      submissionDate: today,
      lastUpdated: today,
      history: [
        {
          id: `H-${Date.now()}`,
          date: today,
          action: asDraft ? "Created" : "Submitted",
          performedBy: profile.contactPerson || "Manufacturer",
          notes: asDraft ? "Saved as draft by manufacturer" : "Submitted for central admin approval",
        },
      ],
    };

    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProductDraft = (productId: string, updates: Partial<Product>) => {
    const today = getTodayDate();
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        // Only drafts or changes-requested items can be edited directly
        if (p.status !== "Draft" && p.status !== "Changes Requested") return p;
        return {
          ...p,
          ...updates,
          lastUpdated: today,
        };
      })
    );
  };

  const submitProductForReview = (productId: string, notes?: string) => {
    const today = getTodayDate();
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          status: "Submitted",
          lastUpdated: today,
          history: [
            ...p.history,
            {
              id: `H-${Date.now()}`,
              date: today,
              action: "Submitted",
              performedBy: profile.contactPerson,
              notes: notes || "Submitted to Central Meyveda Admin for approval",
            },
          ],
        };
      })
    );
  };

  const resubmitAfterChanges = (productId: string, updates: Partial<Product>, notes: string) => {
    const today = getTodayDate();
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const { rejectionReason: _removed, ...restProduct } = p;
        return {
          ...restProduct,
          ...updates,
          status: "Submitted",
          lastUpdated: today,
          history: [
            ...p.history,
            {
              id: `H-${Date.now()}`,
              date: today,
              action: "Resubmitted",
              performedBy: profile.contactPerson,
              notes: `Resubmitted with corrections: ${notes}`,
            },
          ],
        };
      })
    );
  };

  const proposeProductRevision = (
    productId: string,
    proposedChanges: Partial<Product>,
    revisionNotes: string
  ) => {
    const today = getTodayDate();
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        // IMPORTANT: NEVER overwrite approved product directly!
        return {
          ...p,
          isRevisionPending: true,
          proposedChanges,
          revisionNotes,
          lastUpdated: today,
          history: [
            ...p.history,
            {
              id: `H-${Date.now()}`,
              date: today,
              action: "Revision Proposed",
              performedBy: profile.contactPerson,
              notes: `Proposed revision submitted for admin review: ${revisionNotes}`,
            },
          ],
        };
      })
    );
  };

  const archiveProduct = (productId: string) => {
    const today = getTodayDate();
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          status: "Archived",
          lastUpdated: today,
        };
      })
    );
  };

  const respondToFeedback = (feedbackId: string, replyMessage: string) => {
    const today = getTodayDate();
    setDoctorFeedback((prev) =>
      prev.map((fb) => {
        if (fb.id !== feedbackId) return fb;
        return {
          ...fb,
          status: "Manufacturer Responded",
          responseHistory: [
            ...fb.responseHistory,
            {
              id: `RH-${Date.now()}`,
              date: today,
              author: `${profile.brandName} QC / Medical Desk`,
              message: replyMessage,
            },
          ],
        };
      })
    );
  };

  const updateFeedbackStatus = (
    feedbackId: string,
    status: DoctorFeedback["status"],
    internalNotes?: string
  ) => {
    setDoctorFeedback((prev) =>
      prev.map((fb) => {
        if (fb.id !== feedbackId) return fb;
        return {
          ...fb,
          status,
          ...(internalNotes !== undefined ? { manufacturerNotes: internalNotes } : {}),
          ...(status === "Resolved"
            ? { resolutionTimestamp: new Date().toISOString().replace("T", " ").substring(0, 16) }
            : {}),
        };
      })
    );
  };

  const submitADRFollowUp = (reportId: string, followUpNotes: string) => {
    const today = getTodayDate();
    setAdrReports((prev) =>
      prev.map((rep) => {
        if (rep.id !== reportId) return rep;
        return {
          ...rep,
          manufacturerFollowUpNotes: followUpNotes,
          followUpStatus: "Information Submitted",
          updatedAt: today,
        };
      })
    );
  };

  const updateProfile = (updated: Partial<ManufacturerProfile>) => {
    // Check if legal/regulatory fields changed that trigger re-verification
    const criticalFields: (keyof ManufacturerProfile)[] = [
      "legalCompanyName",
      "gstin",
      "form25DNumber",
      "ayushLicenseNumber",
    ];
    let requiresReverification = false;

    for (const key of criticalFields) {
      if (key in updated && updated[key] !== profile[key]) {
        requiresReverification = true;
        break;
      }
    }

    setProfile((prev) => ({
      ...prev,
      ...updated,
      verificationStatus: requiresReverification ? "Re-verification Pending" : prev.verificationStatus,
    }));

    return { requiresReverification };
  };

  const uploadProfileDocument = (doc: RegulatoryDocument) => {
    setProfile((prev) => ({
      ...prev,
      documents: [doc, ...prev.documents],
    }));
  };

  return (
    <ManufacturerContext.Provider
      value={{
        products,
        doctorResponses,
        doctorFeedback,
        territoryInsights,
        adrReports,
        profile,
        session,
        ready,
        signIn,
        signOut,
        addProduct,
        updateProductDraft,
        submitProductForReview,
        resubmitAfterChanges,
        proposeProductRevision,
        archiveProduct,
        respondToFeedback,
        updateFeedbackStatus,
        submitADRFollowUp,
        updateProfile,
        uploadProfileDocument,
      }}
    >
      {children}
    </ManufacturerContext.Provider>
  );
};

export const useManufacturer = () => {
  const context = useContext(ManufacturerContext);
  if (!context) {
    throw new Error("useManufacturer must be used within a ManufacturerProvider");
  }
  return context;
};
