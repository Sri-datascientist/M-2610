import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  anonymizationFromChecks,
  canApproveCase,
  canCloseSafety,
  canReleaseBatch,
  seedBatches,
  seedCases,
  seedSafety,
  seedSubmissions,
  type ActionResult,
  type ApprovalStatus,
  type Batch,
  type ClinicalCase,
  type ComplianceEvent,
  type ComplianceNote,
  type SafetyCase,
  type SafetyStatus,
  type Severity,
  type Submission,
} from "@/features/admin/compliance-data";
import { useStore } from "@/lib/admin-store";

function stamp() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function note(actor: string, text: string): ComplianceNote {
  return { at: stamp(), by: actor, text };
}

function event(actor: string, text: string): ComplianceEvent {
  return { at: stamp(), by: actor, text };
}

type Compliance = {
  submissions: Submission[];
  batches: Batch[];
  safety: SafetyCase[];
  cases: ClinicalCase[];
  actor: string;
  addSubmissionNote: (id: string, text: string) => void;
  decideSubmission: (
    id: string,
    decision: "approve" | "request" | "reject",
    reason: string,
  ) => ActionResult;
  setBatchCheck: (id: string, index: number, done: boolean) => void;
  addBatchNote: (id: string, text: string) => void;
  flagBatch: (id: string, reason: string) => ActionResult;
  escalateBatch: (id: string, reason: string) => ActionResult;
  releaseBatch: (id: string) => ActionResult;
  recallBatch: (id: string, reason: string) => ActionResult;
  assignSafetyReviewer: (id: string, reviewer: string) => ActionResult;
  assessSafety: (id: string, severity: Severity, rationale: string) => ActionResult;
  addSafetyNote: (id: string, text: string) => void;
  requestSafetyFollowUp: (id: string, reason: string) => ActionResult;
  resolveSafety: (id: string, noteText: string) => ActionResult;
  closeSafety: (id: string, outcome: string) => ActionResult;
  setCaseCheck: (id: string, index: number, done: boolean) => void;
  addCaseNote: (id: string, text: string) => void;
  decideCase: (
    id: string,
    decision: "approve" | "request" | "reject",
    reason: string,
  ) => ActionResult;
};

const Ctx = createContext<Compliance | null>(null);

const closedApproval = new Set<ApprovalStatus>(["Approved", "Rejected"]);

export function ComplianceProvider({ children }: { children: ReactNode }) {
  const { admin } = useStore();
  const actor = admin?.name ?? "Ananya Iyer";
  const [submissions, setSubmissions] = useState(seedSubmissions);
  const [batches, setBatches] = useState(seedBatches);
  const [safety, setSafety] = useState(seedSafety);
  const [cases, setCases] = useState(seedCases);

  const addSubmissionNote = useCallback(
    (id: string, text: string) => {
      setSubmissions((rows) =>
        rows.map((row) =>
          row.id === id ? { ...row, notes: [note(actor, text), ...row.notes] } : row,
        ),
      );
    },
    [actor],
  );

  const decideSubmission = useCallback(
    (id: string, decision: "approve" | "request" | "reject", reason: string): ActionResult => {
      const current = submissions.find((row) => row.id === id);
      if (!current) return { ok: false, message: "That submission is not in this session." };
      if (closedApproval.has(current.status)) {
        return { ok: false, message: "This decision is already recorded." };
      }
      const status: ApprovalStatus =
        decision === "approve"
          ? "Approved"
          : decision === "request"
            ? "Changes Requested"
            : "Rejected";
      const label =
        decision === "approve"
          ? `Approved version ${current.version}. Earlier versions were not changed.`
          : decision === "request"
            ? `Changes requested: ${reason}`
            : `Rejected: ${reason}`;
      const at = stamp();
      setSubmissions((rows) =>
        rows.map((row) =>
          row.id === id
            ? {
                ...row,
                status,
                reviewer: actor,
                decidedAt: at,
                history: [event(actor, label), ...row.history],
                notes: reason ? [note(actor, reason), ...row.notes] : row.notes,
              }
            : row,
        ),
      );
      return { ok: true };
    },
    [actor, submissions],
  );

  const setBatchCheck = useCallback((id: string, index: number, done: boolean) => {
    setBatches((rows) =>
      rows.map((row) =>
        row.id === id
          ? {
              ...row,
              checklist: row.checklist.map((item, itemIndex) =>
                itemIndex === index ? { ...item, done } : item,
              ),
            }
          : row,
      ),
    );
  }, []);

  const addBatchNote = useCallback(
    (id: string, text: string) => {
      setBatches((rows) =>
        rows.map((row) =>
          row.id === id ? { ...row, notes: [note(actor, text), ...row.notes] } : row,
        ),
      );
    },
    [actor],
  );

  const flagBatch = useCallback(
    (id: string, reason: string): ActionResult => {
      const current = batches.find((row) => row.id === id);
      if (!current) return { ok: false, message: "That batch is not in this session." };
      if (current.qualityStatus === "Recalled") {
        return { ok: false, message: "This batch is already recalled." };
      }
      setBatches((rows) =>
        rows.map((row) =>
          row.id === id
            ? {
                ...row,
                qualityStatus: "On Hold",
                flags: [{ label: "Quality concern", detail: reason }, ...row.flags],
                history: [event(actor, `Quality concern flagged: ${reason}`), ...row.history],
                releaseHistory: [
                  event(actor, "Release was not changed by this quality flag."),
                  ...row.releaseHistory,
                ],
              }
            : row,
        ),
      );
      return { ok: true };
    },
    [actor, batches],
  );

  const escalateBatch = useCallback(
    (id: string, reason: string): ActionResult => {
      const current = batches.find((row) => row.id === id);
      if (!current) return { ok: false, message: "That batch is not in this session." };
      setBatches((rows) =>
        rows.map((row) =>
          row.id === id
            ? {
                ...row,
                qualityStatus:
                  row.qualityStatus === "Awaiting Review" ? "Under Review" : row.qualityStatus,
                history: [event(actor, `Escalated: ${reason}`), ...row.history],
              }
            : row,
        ),
      );
      return { ok: true };
    },
    [actor, batches],
  );

  const releaseBatch = useCallback(
    (id: string): ActionResult => {
      const current = batches.find((row) => row.id === id);
      if (!current) return { ok: false, message: "That batch is not in this session." };
      const guard = canReleaseBatch(current);
      if (!guard.ok) return guard;
      setBatches((rows) =>
        rows.map((row) =>
          row.id === id
            ? {
                ...row,
                qualityStatus: "Released",
                releaseStatus: "Released",
                history: [
                  event(
                    actor,
                    "Released after the checklist was complete. Documents alone did not release it.",
                  ),
                  ...row.history,
                ],
                releaseHistory: [event(actor, "Batch released"), ...row.releaseHistory],
              }
            : row,
        ),
      );
      return { ok: true };
    },
    [actor, batches],
  );

  const recallBatch = useCallback(
    (id: string, reason: string): ActionResult => {
      const current = batches.find((row) => row.id === id);
      if (!current) return { ok: false, message: "That batch is not in this session." };
      if (current.qualityStatus === "Recalled") {
        return { ok: false, message: "This recall is already recorded." };
      }
      const at = stamp();
      setBatches((rows) =>
        rows.map((row) =>
          row.id === id
            ? {
                ...row,
                qualityStatus: "Recalled",
                releaseStatus: "Recalled",
                recall: {
                  reason,
                  initiated: at,
                  scope: `Packs from batch ${row.id}.`,
                },
                history: [event(actor, `Recalled: ${reason}`), ...row.history],
                releaseHistory: [event(actor, `Recall recorded: ${reason}`), ...row.releaseHistory],
              }
            : row,
        ),
      );
      return { ok: true };
    },
    [actor, batches],
  );

  const assignSafetyReviewer = useCallback(
    (id: string, reviewer: string): ActionResult => {
      const current = safety.find((row) => row.id === id);
      if (!current) return { ok: false, message: "That report is not in this session." };
      if (current.status === "Closed")
        return { ok: false, message: "A closed report cannot be reassigned." };
      if (!reviewer.trim()) return { ok: false, message: "Choose a reviewer." };
      setSafety((rows) =>
        rows.map((row) =>
          row.id === id
            ? {
                ...row,
                reviewer,
                history: [event(actor, `Reviewer assigned: ${reviewer}`), ...row.history],
              }
            : row,
        ),
      );
      return { ok: true };
    },
    [actor, safety],
  );

  const assessSafety = useCallback(
    (id: string, severity: Severity, rationale: string): ActionResult => {
      const current = safety.find((row) => row.id === id);
      if (!current) return { ok: false, message: "That report is not in this session." };
      if (current.status === "Closed") {
        return { ok: false, message: "A closed report cannot be reassessed." };
      }
      if (rationale.trim().length < 5) {
        return { ok: false, message: "Write an assessment note of at least 5 characters." };
      }
      setSafety((rows) =>
        rows.map((row) =>
          row.id === id
            ? {
                ...row,
                assessedSeverity: severity,
                assessmentNote: rationale.trim(),
                history: [
                  event(
                    actor,
                    `Reviewer assessed severity as ${severity}. The reported severity was left unchanged.`,
                  ),
                  ...row.history,
                ],
              }
            : row,
        ),
      );
      return { ok: true };
    },
    [actor, safety],
  );

  const addSafetyNote = useCallback(
    (id: string, text: string) => {
      setSafety((rows) =>
        rows.map((row) =>
          row.id === id ? { ...row, notes: [note(actor, text), ...row.notes] } : row,
        ),
      );
    },
    [actor],
  );

  const requestSafetyFollowUp = useCallback(
    (id: string, reason: string): ActionResult => {
      const current = safety.find((row) => row.id === id);
      if (!current) return { ok: false, message: "That report is not in this session." };
      if (current.status === "Closed")
        return { ok: false, message: "A closed report cannot be reopened here." };
      const status: SafetyStatus = "Follow-up Required";
      setSafety((rows) =>
        rows.map((row) =>
          row.id === id
            ? {
                ...row,
                status,
                followUp: reason,
                history: [event(actor, `Follow-up requested: ${reason}`), ...row.history],
              }
            : row,
        ),
      );
      return { ok: true };
    },
    [actor, safety],
  );

  const resolveSafety = useCallback(
    (id: string, noteText: string): ActionResult => {
      const current = safety.find((row) => row.id === id);
      if (!current) return { ok: false, message: "That report is not in this session." };
      if (current.status === "Closed")
        return { ok: false, message: "A closed report stays closed." };
      setSafety((rows) =>
        rows.map((row) =>
          row.id === id
            ? {
                ...row,
                status: "Resolved",
                history: [event(actor, `Resolved: ${noteText}`), ...row.history],
                notes: [note(actor, noteText), ...row.notes],
              }
            : row,
        ),
      );
      return { ok: true };
    },
    [actor, safety],
  );

  const closeSafety = useCallback(
    (id: string, outcome: string): ActionResult => {
      const current = safety.find((row) => row.id === id);
      if (!current) return { ok: false, message: "That report is not in this session." };
      const guard = canCloseSafety(current);
      if (!guard.ok) return guard;
      setSafety((rows) =>
        rows.map((row) =>
          row.id === id
            ? {
                ...row,
                status: "Closed",
                outcome,
                history: [event(actor, `Closed: ${outcome}`), ...row.history],
              }
            : row,
        ),
      );
      return { ok: true };
    },
    [actor, safety],
  );

  const setCaseCheck = useCallback((id: string, index: number, done: boolean) => {
    setCases((rows) =>
      rows.map((row) => {
        if (row.id !== id || row.reviewStatus === "Approved" || row.reviewStatus === "Rejected")
          return row;
        const checklist = row.checklist.map((item, itemIndex) =>
          itemIndex === index ? { ...item, done } : item,
        );
        return { ...row, checklist, anonymization: anonymizationFromChecks(checklist) };
      }),
    );
  }, []);

  const addCaseNote = useCallback(
    (id: string, text: string) => {
      setCases((rows) =>
        rows.map((row) =>
          row.id === id ? { ...row, notes: [note(actor, text), ...row.notes] } : row,
        ),
      );
    },
    [actor],
  );

  const decideCase = useCallback(
    (id: string, decision: "approve" | "request" | "reject", reason: string): ActionResult => {
      const current = cases.find((row) => row.id === id);
      if (!current) return { ok: false, message: "That case is not in this session." };
      if (current.reviewStatus === "Approved" || current.reviewStatus === "Rejected") {
        return { ok: false, message: "This decision is already recorded." };
      }
      if (decision === "approve") {
        const guard = canApproveCase(current);
        if (!guard.ok) return guard;
      }
      const label =
        decision === "approve"
          ? "Approved after the required anonymization checks."
          : decision === "request"
            ? `Changes requested: ${reason}`
            : `Rejected: ${reason}`;
      setCases((rows) =>
        rows.map((row) =>
          row.id === id
            ? {
                ...row,
                reviewStatus:
                  decision === "approve"
                    ? "Approved"
                    : decision === "request"
                      ? "Changes Requested"
                      : "Rejected",
                history: [event(actor, label), ...row.history],
                notes: reason ? [note(actor, reason), ...row.notes] : row.notes,
              }
            : row,
        ),
      );
      return { ok: true };
    },
    [actor, cases],
  );

  const value = useMemo(
    () => ({
      submissions,
      batches,
      safety,
      cases,
      actor,
      addSubmissionNote,
      decideSubmission,
      setBatchCheck,
      addBatchNote,
      flagBatch,
      escalateBatch,
      releaseBatch,
      recallBatch,
      assignSafetyReviewer,
      assessSafety,
      addSafetyNote,
      requestSafetyFollowUp,
      resolveSafety,
      closeSafety,
      setCaseCheck,
      addCaseNote,
      decideCase,
    }),
    [
      submissions,
      batches,
      safety,
      cases,
      actor,
      addSubmissionNote,
      decideSubmission,
      setBatchCheck,
      addBatchNote,
      flagBatch,
      escalateBatch,
      releaseBatch,
      recallBatch,
      assignSafetyReviewer,
      assessSafety,
      addSafetyNote,
      requestSafetyFollowUp,
      resolveSafety,
      closeSafety,
      setCaseCheck,
      addCaseNote,
      decideCase,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompliance() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useCompliance must be used inside ComplianceProvider");
  return value;
}
