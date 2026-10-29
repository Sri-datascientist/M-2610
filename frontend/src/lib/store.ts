import { useSyncExternalStore } from "react";
import {
  defaultDoctor,
  type AdrStatus,
  type Publication,
  type LibraryContribution,
  type DoctorReferral,
  type DoctorReferralAccount,
  type ReferralStatus,
} from "./mock-data";

export type {
  Publication,
  LibraryContribution,
  DoctorReferral,
  DoctorReferralAccount,
  ReferralStatus,
};

// Local prototype store persisted to localStorage.
// ARCHITECTURAL SAFEGUARD & PRIVACY NOTICE:
// Browser localStorage is an unencrypted, client-side demonstration cache and does NOT provide
// secure multi-doctor data isolation, HIPAA/GDPR protection, or cryptographic access control.
// In this Phase 1 prototype, no real identifiable patient records or confidential clinical data
// should ever be stored. True authorization and multi-tenant isolation require server-side
// token validation and encrypted database storage.
const KEY = "mvg-live-v2";

export interface FormulationIngredient {
  name: string;
  quantity: string;
  unit: string;
  ratio: string;
  botanicalName?: string;
  partUsed?: string;
  classicalRole?: string;
}

export interface FormulationCaseStudy {
  ref: string;
  dose: string;
  duration: string;
  anupana: string;
  response: string;
  followUp?: string;
  condition?: string;
}

export interface FormulationVersion {
  v: number;
  at: string;
  note: string;
  author?: string;
}

export interface Formulation {
  id: string;
  localId: string;
  name: string;
  prepType: string;
  intendedUse: string;
  origin?: "Self-prepared in Clinic" | "Contract AYUSH GMP Unit" | "Academic / Pilot Dispensary";
  facility?: string;
  status: "Draft" | "In preparation" | "Under observation" | "Archived";
  ingredients: FormulationIngredient[];
  method: string;
  preparedBy: string;
  preparedOn: string;
  batch: string;
  batchYield?: string;
  sourcing: string;
  classicalReference?: string;
  ayurvedicAttributes?: {
    rasa?: string;
    virya?: string;
    vipaka?: string;
    karma?: string;
  };
  notes: string;
  safety: string;
  safetyObservations?: string;
  linkedAdrReportIds?: string[];
  cases: FormulationCaseStudy[];
  documents: string[];
  versions: FormulationVersion[];
  updatedAt: string;
  isPrivate?: boolean;
  ownerDoctorId?: string;
}

export interface AdrReport {
  id: string;
  medicine: string;
  batch: string;
  patientRef: string;
  ageBand: string;
  sex: string;
  dose: string;
  route: string;
  startDate: string;
  reaction: string;
  onset: string;
  seriousness: string;
  outcome: string;
  concomitant: string;
  action: string;
  attachments: string[];
  status: AdrStatus | "Draft";
  causality: string;
  regulatory: string;
  submittedAt: string;
  timeline: { at: string; text: string }[];
  messages: { from: "You" | "Review team"; at: string; text: string }[];
}

export interface Notification {
  id: string;
  kind: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  to: string;
}
export interface SupportRequest {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: "Open" | "Awaiting reply" | "Resolved";
  at: string;
  replies: string[];
}
export interface Saved {
  id: string;
  kind: "medicine" | "reference" | "ingredient" | "case" | "publication" | "journal";
  collection: string;
  note: string;
}

interface State {
  doctor: typeof defaultDoctor;
  saved: Saved[];
  compare: string[];
  recent: string[];
  formulations: Formulation[];
  adr: AdrReport[];
  notifications: Notification[];
  support: SupportRequest[];
  publications: Publication[];
  libraryContributions: LibraryContribution[];
  referrals: DoctorReferral[];
  referralAccount: DoctorReferralAccount;
  signedIn: boolean;
}

export const DEFAULT_EMPTY_REFERRAL_ACCOUNT: DoctorReferralAccount = {
  doctorId: "doc-1",
  referralCode: "",
  referralLink: "",
  isReferralActive: true,
  programStatus: "Pilot Active",
  referralPoints: 0,
  totalInvited: 0,
  eligibleCohorts: [
    "Registered BAMS / MD / MS (Ayurveda) Physicians",
    "State AYUSH Council Registration Certificate Holders",
    "Clinical Institutional Researchers & Faculty",
  ],
  termsNotice: "Referral records are verified against State AYUSH Council registries.",
};

const seed = (): State => ({
  doctor: { ...defaultDoctor },
  publications: [],
  libraryContributions: [],
  referrals: [],
  referralAccount: { ...DEFAULT_EMPTY_REFERRAL_ACCOUNT },
  saved: [],
  compare: [],
  recent: [],
  formulations: [],
  adr: [],
  notifications: [],
  support: [],
  signedIn: false,
});

let state: State = seed();
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    const token = localStorage.getItem("meyveda_auth_token");
    if (raw) {
      state = { ...seed(), ...JSON.parse(raw) };
    }
    // Strict authentication guard: signedIn requires valid auth token
    if (!token) {
      state.signedIn = false;
    }
  } catch {
    /* ignore */
  }
}

function emit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function setState(fn: (s: State) => Partial<State>) {
  hydrate();
  state = { ...state, ...fn(state) };
  emit();
}

const serverSnapshot = seed();
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (cb) => {
      if (!hydrated) {
        hydrate();
        queueMicrotask(cb);
      }
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => sel(state),
    () => sel(serverSnapshot),
  );
}
useStore.getState = getState;

export function getState(): State {
  hydrate();
  return state;
}

export function resetDemo() {
  state = seed();
  emit();
}

export const actions = {
  toggleSave(id: string, kind: Saved["kind"]) {
    setState((s) => ({
      saved: s.saved.some((x) => x.id === id)
        ? s.saved.filter((x) => x.id !== id)
        : [...s.saved, { id, kind, collection: "General", note: "" }],
    }));
  },
  toggleCompare(id: string) {
    setState((s) => ({
      compare: s.compare.includes(id)
        ? s.compare.filter((x) => x !== id)
        : [...s.compare, id].slice(-3),
    }));
  },
  visit(id: string) {
    setState((s) => ({ recent: [id, ...s.recent.filter((x) => x !== id)].slice(0, 6) }));
  },
  savePublication(pub: Publication) {
    setState((s) => {
      const idx = s.publications.findIndex((p) => p.id === pub.id);
      if (idx >= 0) {
        const copy = [...s.publications];
        copy[idx] = pub;
        return { publications: copy };
      }
      return { publications: [pub, ...s.publications] };
    });
  },
  updatePublicationStatus(id: string, status: Publication["status"], feedback?: string) {
    setState((s) => ({
      publications: s.publications.map((p) =>
        p.id === id
          ? {
              ...p,
              status,
              ...(feedback !== undefined ? { reviewFeedback: feedback } : {}),
              dateUpdated: new Date().toISOString().slice(0, 10),
              ...(status === "Published" && !p.datePublished
                ? { datePublished: new Date().toISOString().slice(0, 10) }
                : {}),
            }
          : p,
      ),
    }));
  },
  toggleUseful(id: string) {
    setState((s) => ({
      publications: s.publications.map((p) =>
        p.id === id ? { ...p, usefulCount: p.usefulCount + 1 } : p,
      ),
    }));
  },
  saveLibraryContribution(contrib: LibraryContribution) {
    setState((s) => {
      const idx = s.libraryContributions.findIndex((c) => c.id === contrib.id);
      if (idx >= 0) {
        const copy = [...s.libraryContributions];
        copy[idx] = contrib;
        return { libraryContributions: copy };
      }
      return { libraryContributions: [contrib, ...s.libraryContributions] };
    });
  },
  removeLibraryContribution(id: string) {
    setState((s) => ({
      libraryContributions: s.libraryContributions.filter((c) => c.id !== id),
    }));
  },
  sendReferralInvite(invite: {
    invitedEmail: string;
    invitedName?: string | undefined;
    invitedSpecialty?: string | undefined;
    invitedCouncil?: string | undefined;
    notes?: string | undefined;
  }) {
    const newRecord: DoctorReferral = {
      id: uid("REF"),
      invitedEmail: invite.invitedEmail.trim().toLowerCase(),
      invitedName: invite.invitedName?.trim(),
      invitedSpecialty: invite.invitedSpecialty?.trim(),
      invitedCouncil: invite.invitedCouncil?.trim(),
      dateInvited: today(),
      status: "Invitation Sent",
      statusUpdatedDate: today(),
      notes: invite.notes?.trim() || "Peer invitation dispatched via doctor portal demo",
      isDemoSample: false,
    };
    setState((s) => ({
      referrals: [newRecord, ...s.referrals],
    }));
    return newRecord;
  },
  updateReferralAccount(patch: Partial<DoctorReferralAccount>) {
    setState((s) => ({
      referralAccount: { ...s.referralAccount, ...patch },
    }));
  },
};

export const today = () => new Date().toISOString().slice(0, 10);
export const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
