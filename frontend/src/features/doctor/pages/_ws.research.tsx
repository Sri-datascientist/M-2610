import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Lock,
  Plus,
  Trash2,
  Download,
  Search,
  History,
  FileText,
  AlertTriangle,
  Printer,
  Copy,
  Check,
  Building,
  Info,
  Calendar,
  Layers,
  FlaskConical,
  BookOpen,
  Eye,
  ShieldAlert,
  Share2,
  Sparkles,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Btn, Empty, Field, MockUpload, PageHeader, Pill, inputCls } from "@/components/ui-kit";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  actions,
  setState,
  today,
  uid,
  useStore,
  type Formulation,
  type FormulationIngredient,
  type FormulationCaseStudy,
  type Publication,
} from "@/lib/store";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_ws/research")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { id?: string | undefined; tab?: string | undefined } => ({
    id: typeof s["id"] === "string" ? s["id"] : undefined,
    tab: typeof s["tab"] === "string" ? s["tab"] : undefined,
  }),
  head: () =>
    seo(
      "My Medicine Research",
      "Private workspace for your own formulations, ingredients, preparation records and case notes.",
    ),
  component: Research,
});

const PREP_TYPES = [
  "Churna",
  "Vati",
  "Kwatha",
  "Avaleha",
  "Ghrita",
  "Taila",
  "Arishta",
  "Asava",
] as const;

const STATUS_OPTIONS = ["Draft", "In preparation", "Under observation", "Archived"] as const;

const ORIGIN_OPTIONS = [
  "Self-prepared in Clinic",
  "Contract AYUSH GMP Unit",
  "Academic / Pilot Dispensary",
] as const;

const blankFormulation = (count: number): Formulation => ({
  id: `f-${Date.now()}`,
  localId: `MVG-LOCAL-${String(count).padStart(4, "0")}`,
  name: "",
  prepType: "Churna",
  intendedUse: "",
  origin: "Self-prepared in Clinic",
  facility: "Personal Clinic Dispensary, Pune",
  status: "Draft",
  ingredients: [
    {
      name: "",
      quantity: "100",
      unit: "g",
      ratio: "1",
      botanicalName: "",
      partUsed: "",
      classicalRole: "",
    },
  ],
  method: "",
  preparedBy: "Dr. Ananya Kulkarni",
  preparedOn: today(),
  batch: `LOT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
  batchYield: "",
  sourcing: "",
  classicalReference: "",
  ayurvedicAttributes: {
    rasa: "",
    virya: "",
    vipaka: "",
    karma: "",
  },
  notes: "",
  safety: "",
  safetyObservations: "",
  linkedAdrReportIds: [],
  cases: [],
  documents: [],
  versions: [
    {
      v: 1,
      at: today(),
      note: "Initial research formulation draft created",
      author: "Dr. Ananya Kulkarni",
    },
  ],
  updatedAt: today(),
  isPrivate: true,
  ownerDoctorId: "doc-ak-1",
});

export function Research() {
  const { id: routeId, tab: routeTab } = Route.useSearch();
  const navigate = useNavigate();
  const doctor = useStore((s) => s.doctor);
  const list = useStore((s) => s.formulations);
  const [selId, setSelId] = useState<string | null>(routeId ?? list[0]?.id ?? null);
  const [draft, setDraft] = useState<Formulation | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"updated" | "name" | "id">("updated");
  const [activeTab, setActiveTab] = useState<string>(routeTab ?? "overview");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [privacyModal, setPrivacyModal] = useState(false);
  const [publishModal, setPublishModal] = useState(false);
  const [createdPubDraftId, setCreatedPubDraftId] = useState<string | null>(null);
  const [copiedDossier, setCopiedDossier] = useState(false);

  // Sync route param with selection
  useEffect(() => {
    if (routeId) {
      setSelId(routeId);
      setDraft(null);
    }
  }, [routeId]);

  // Filtered and sorted formulation list
  // Architectural Privacy Boundary: Only the authenticated doctor's own private formulations
  // or records safely bound to this practitioner session are displayed.
  // Records with missing or unknown ownership are conservatively attributed to the current
  // session or isolated, never exposed in shared public directories.
  const filteredList = useMemo(() => {
    const res = list.filter((f) => {
      // Identity check: current doctor or default demo doctor "doc-ak-1"
      const isOwner =
        !f.ownerDoctorId ||
        f.ownerDoctorId === "doc-ak-1" ||
        (doctor.name && f.preparedBy?.toLowerCase().includes("kulkarni"));
      if (!isOwner) return false;

      if (statusFilter && f.status !== statusFilter) return false;
      if (!q.trim()) return true;
      const term = q.trim().toLowerCase();
      const inIng = f.ingredients.some(
        (i) =>
          i.name.toLowerCase().includes(term) ||
          (i.botanicalName ?? "").toLowerCase().includes(term),
      );
      return (
        f.name.toLowerCase().includes(term) ||
        f.localId.toLowerCase().includes(term) ||
        f.prepType.toLowerCase().includes(term) ||
        (f.batch && f.batch.toLowerCase().includes(term)) ||
        inIng
      );
    });

    if (sortOrder === "name") {
      res.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === "id") {
      res.sort((a, b) => a.localId.localeCompare(b.localId));
    } else {
      res.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    return res;
  }, [list, doctor.name, q, statusFilter, sortOrder]);

  const sel = draft ?? list.find((f) => f.id === selId) ?? filteredList[0] ?? list[0] ?? null;

  // Save handler with validation
  const handleSave = (asDraft: boolean) => {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error("Medicine name is required", {
        description: "Please enter a formulation title before saving.",
      });
      return;
    }

    if (draft.ingredients.length === 0 || !draft.ingredients.some((i) => i.name.trim())) {
      toast.error("At least one ingredient name is required", {
        description: "Please specify ingredients for this formulation.",
      });
      return;
    }

    const exists = list.some((f) => f.id === draft.id);
    const newVersionNum = exists ? draft.versions.length + 1 : 1;
    const v = {
      v: newVersionNum,
      at: today(),
      note: asDraft
        ? "Draft updated"
        : exists
          ? `Specification revision v${newVersionNum}`
          : "Formulation established",
      author: "Dr. Ananya Kulkarni",
    };

    const finalRecord: Formulation = {
      ...draft,
      status: asDraft ? "Draft" : draft.status === "Draft" ? "In preparation" : draft.status,
      versions: exists ? [...draft.versions, v] : [v],
      updatedAt: today(),
      isPrivate: true,
      ownerDoctorId: "doc-ak-1",
    };

    setState((s) => ({
      formulations: exists
        ? s.formulations.map((f) => (f.id === finalRecord.id ? finalRecord : f))
        : [finalRecord, ...s.formulations],
    }));

    setSelId(finalRecord.id);
    setDraft(null);
    toast.success(asDraft ? "Draft saved successfully" : `Formulation version ${v.v} recorded`, {
      description: `Local ID: ${finalRecord.localId} · Stored in local session`,
    });
  };

  const handleDelete = (targetId: string) => {
    setState((s) => ({
      formulations: s.formulations.filter((f) => f.id !== targetId),
    }));
    setConfirmDelete(false);
    const remaining = list.filter((f) => f.id !== targetId);
    setSelId(remaining[0]?.id ?? null);
    setDraft(null);
    toast.success("Formulation deleted from local workspace");
  };

  /**
   * Explicit User-Triggered Handoff: Research -> Publication Draft
   * Copies ONLY permitted, non-sensitive, sanitized fields into a new independent Publication draft.
   * STRICT PRIVACY GUARANTEES:
   * 1. Status is strictly "Draft" (never auto-submitted or auto-published).
   * 2. Raw patient cases, internal batch codes (LOT numbers), proprietary facility addresses,
   *    and internal quality documents/attachments are NEVER copied.
   * 3. The resulting publication draft is completely decoupled: edits/deletions in either
   *    direction do not mutate the other record.
   */
  const handleCreatePublicationDraft = (f: Formulation) => {
    const pubId = `PUB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const herbNames = f.ingredients.map((i) => i.name.trim()).filter(Boolean);
    const primaryHerb = herbNames[0] ?? "Classical Herbs";

    // Non-sensitive classical synthesis for publication
    const contentSections = [
      `## Research Insight: Clinical Experience with ${f.name || f.prepType}`,
      `This practitioner research insight outlines clinical observations and preparation rationale for an observational ${f.prepType} formulation.`,
      `### Composition Overview (Non-Proprietary Rationale)`,
      `The formulation incorporates: ${herbNames.slice(0, 4).join(", ")}${herbNames.length > 4 ? " and companion herbs" : ""}. Key classical attributes include Rasa (${f.ayurvedicAttributes?.rasa || "N/A"}), Virya (${f.ayurvedicAttributes?.virya || "N/A"}), and Karma (${f.ayurvedicAttributes?.karma || "N/A"}).`,
      `### Preparation Approach`,
      f.method
        ? `Traditional processing adhering to classical ${f.prepType} methods: ${f.method.slice(0, 300)}...`
        : `Prepared according to classical ${f.prepType} standards.`,
      `### General Posology & Administration Context`,
      f.cases.length > 0
        ? `Observed in clinical practice with dosage: ${f.cases[0]?.dose || "Standard dose"} with ${f.cases[0]?.anupana || "warm water"} over ${f.cases[0]?.duration || "an observational period"}.`
        : `Posology follows standard classical posology for ${f.prepType}.`,
    ].join("\n\n");

    const newPublicationDraft: Publication = {
      id: pubId,
      title: `Clinical Insight: Formulation Experience with ${f.name || f.prepType}`,
      summary:
        f.intendedUse ||
        `Observational practitioner insights and preparation considerations for ${f.name || f.prepType}.`,
      type: "Research Insight",
      status: "Draft",
      category: "Formulations",
      tags: [f.prepType, primaryHerb, "Practitioner Research"].filter(Boolean),
      author: {
        name: doctor.name || f.preparedBy || "Dr. Ananya Kulkarni",
        qualification: doctor.qualification || "BAMS, MD",
        institution: doctor.institution || "Personal Clinic Dispensary",
        avatarInitials: doctor.initials || "AK",
        isCurrentUser: true,
      },
      dateCreated: today(),
      dateUpdated: today(),
      content: contentSections,
      references: f.classicalReference ? [f.classicalReference] : [],
      methodology: `Observational practitioner study conducted in ambulatory clinical setting. Evaluated ${f.prepType} preparation tolerability and adherence.`,
      limitations:
        "Single-centre observational records. Non-randomized pilot study without a blinded control group. Intended for peer practitioner discussion only.",
      supportingLinks: [],
      // SENSITIVE DATA REDACTED BY DESIGN:
      // - No internal batch lot numbers (f.batch)
      // - No patient identifiers or case codes (f.cases.ref)
      // - No private internal documents or supplier invoices (f.documents)
      attachments: [],
      usefulCount: 0,
      viewsCount: 1,
      isPrototypeDemo: true,
    };

    actions.savePublication(newPublicationDraft);
    setCreatedPubDraftId(pubId);
    setPublishModal(false);

    toast.success("Publication draft created in Doctor Community", {
      description: `Draft ID: ${pubId} · Status: Draft (Private to your author profile)`,
      action: {
        label: "Open in Community",
        onClick: () => {
          navigate({
            to: "/community",
            search: { tab: "my-publications", id: pubId },
          });
        },
      },
    });
  };

  const exportDossierJson = (f: Formulation) => {
    const payload = {
      dossierMetadata: {
        system: "Mey Veda Grantha Doctor Research Portal (Phase 1)",
        owner: "Dr. Ananya Kulkarni",
        exportDate: new Date().toISOString(),
        disclaimer:
          "PRELIMINARY INVESTIGATIONAL DOSSIER. This document is an internal private clinical research record. It does NOT constitute a drug manufacturing license (Form 25-D), Certificate of Pharmaceutical Product (CoPP), or government marketing authorization. No therapeutic causality or safety guarantee is implied.",
      },
      formulation: f,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${f.localId}-research-dossier.json`;
    a.click();
    toast.success("Structured dossier JSON exported", {
      description: `Downloaded ${f.localId}-research-dossier.json`,
    });
  };

  const copyDossierText = (f: Formulation) => {
    const text = `=====================================================
MEY VEDA GRANTHA — CONFIDENTIAL RESEARCH DOSSIER
=====================================================
LOCAL RECORD ID: ${f.localId} (Internal Research Identifier Only)
FORMULATION NAME: ${f.name}
PREPARATION TYPE: ${f.prepType}
CURRENT STATUS: ${f.status}
ORIGIN: ${f.origin ?? "Self-prepared"} (${f.facility ?? "Dispensary"})
INTENDED CLINICAL USE: ${f.intendedUse || "Not specified"}
CLASSICAL REFERENCE: ${f.classicalReference || "None documented"}

AYURVEDIC ATTRIBUTES:
- Rasa: ${f.ayurvedicAttributes?.rasa || "—"}
- Virya: ${f.ayurvedicAttributes?.virya || "—"}
- Vipaka: ${f.ayurvedicAttributes?.vipaka || "—"}
- Karma: ${f.ayurvedicAttributes?.karma || "—"}

COMPOSITION & INGREDIENTS:
${f.ingredients
  .map(
    (i, idx) =>
      `  ${idx + 1}. ${i.name} ${i.botanicalName ? `(${i.botanicalName})` : ""} — ${i.quantity} ${i.unit} (Ratio: ${i.ratio}) [${i.classicalRole || ""}]`,
  )
  .join("\n")}

MANUFACTURING & BATCH SPECIFICATION:
- Preparation Method: ${f.method || "—"}
- Batch / Lot ID: ${f.batch || "—"}
- Batch Yield: ${f.batchYield || "—"}
- Prepared By / On: ${f.preparedBy} on ${f.preparedOn}
- Sourcing: ${f.sourcing || "—"}

LINKED CASE STUDIES (${f.cases.length}):
${
  f.cases.length === 0
    ? "  None linked."
    : f.cases
        .map(
          (c) =>
            `  - Ref: ${c.ref} | Posology: ${c.dose} (${c.anupana}) for ${c.duration} | Response: ${c.response}`,
        )
        .join("\n")
}

SAFETY & TOLERABILITY OBSERVATIONS:
${f.safety || f.safetyObservations || "No adverse observations recorded."}

VERSION HISTORY:
${f.versions.map((v) => `  v${v.v} [${v.at}]: ${v.note} (${v.author || "Owner"})`).join("\n")}

REGULATORY NOTICE:
This dossier is an internal research record and preparation aid. It does not replace official statutory approvals, pharmacopoeial monographs or clinical trials.
=====================================================`;

    navigator.clipboard?.writeText(text);
    setCopiedDossier(true);
    toast.success("Dossier text copied to clipboard");
    setTimeout(() => setCopiedDossier(false), 2000);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Private Research Workspace"
        title="My Medicine Research"
        desc="Confidential practitioner workspace for proprietary formulations, ingredient ratios, batch preparation logs and linked pseudonymous case observations."
        actions={
          <div className="flex items-center gap-2">
            <Btn
              onClick={() => {
                setDraft(blankFormulation(list.length + 1));
                setActiveTab("edit");
              }}
            >
              <Plus className="h-4 w-4" />
              New formulation
            </Btn>
          </div>
        }
      />

      {/* Critical Privacy & Data Isolation Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 bg-primary-soft/60 px-4 py-2.5 text-xs text-foreground md:px-8">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-semibold text-primary-deep">Private by default:</span>
          <span>
            Doctor-owner access only (Dr. Ananya Kulkarni). Research records never appear in public
            search, classical library, or shared case directories.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setPrivacyModal(true)}
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline shrink-0"
        >
          <Info className="h-3.5 w-3.5" />
          Privacy & limitations note
        </button>
      </div>

      {/* Main Research Workspace Grid */}
      <div className="grid lg:grid-cols-[330px_1fr] min-h-[calc(100vh-180px)]">
        {/* Left Column: Formulations Listing & Filters */}
        <div className="border-r border-border bg-card/40 p-4 space-y-3">
          {/* Search bar */}
          <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-xs focus-within:border-primary">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search formulations, ingredients, batch…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              aria-label="Search research"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status and Sort Controls */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={inputCls}
              aria-label="Filter status"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "updated" | "name" | "id")}
              className={inputCls}
              aria-label="Sort research"
            >
              <option value="updated">Recently updated</option>
              <option value="name">Name (A–Z)</option>
              <option value="id">Local ID</option>
            </select>
          </div>

          {/* Formulations Count Header */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pt-1">
            <span>
              <strong className="text-foreground">{filteredList.length}</strong> private records
            </span>
            {(q || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setStatusFilter("");
                }}
                className="font-medium text-primary hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Formulation Items List */}
          {filteredList.length === 0 ? (
            <Empty
              title="No formulations found"
              desc={
                q || statusFilter
                  ? "No private records match your search query."
                  : "Start documenting your first Ayurvedic formulation."
              }
              action={
                <Btn
                  variant="outline"
                  onClick={() => {
                    setQ("");
                    setStatusFilter("");
                  }}
                  className="text-xs"
                >
                  Clear filters
                </Btn>
              }
            />
          ) : (
            <ul className="space-y-2 pt-1" role="list">
              {filteredList.map((f) => {
                const isSelected = sel?.id === f.id && !draft;
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setDraft(null);
                        setSelId(f.id);
                        setActiveTab("overview");
                      }}
                      className={cn(
                        "w-full rounded-xl border p-3.5 text-left transition-all duration-150 shadow-xs",
                        isSelected
                          ? "border-primary bg-primary-soft/80 ring-1 ring-primary/30"
                          : "bg-card hover:border-primary/40",
                      )}
                      aria-current={isSelected ? "true" : undefined}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-sm text-foreground line-clamp-1">
                          {f.name || "Untitled formulation"}
                        </span>
                        <Pill
                          t={
                            f.status === "Under observation"
                              ? "orange"
                              : f.status === "In preparation"
                                ? "warn"
                                : f.status === "Archived"
                                  ? "muted"
                                  : "outline"
                          }
                          className="text-[10px] py-0.5 px-2"
                        >
                          {f.status}
                        </Pill>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-mono font-medium">{f.localId}</span>
                        <span className="text-primary font-medium">{f.prepType}</span>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground/80">
                        <span>
                          {f.ingredients.length} ing · {f.cases.length} cases
                        </span>
                        <span>Updated {f.updatedAt}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right Column: Active Formulation Workspace */}
        <div className="p-4 md:p-8 overflow-y-auto">
          {!sel ? (
            <Empty
              title="No formulation selected"
              desc="Select a formulation from the list or establish a new research draft."
              action={
                <Btn
                  onClick={() => {
                    setDraft(blankFormulation(list.length + 1));
                    setActiveTab("edit");
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Establish new formulation
                </Btn>
              }
            />
          ) : draft ? (
            /* Formulation Editor Screen */
            <FormulationEditor
              d={draft}
              set={setDraft}
              onSave={handleSave}
              onCancel={() => {
                setDraft(null);
                setActiveTab("overview");
              }}
            />
          ) : (
            /* Formulation Detail & Tabs Screen */
            <motion.div
              key={sel.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header Bar */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                      {sel.localId}
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 text-primary-deep font-semibold">
                      <Lock className="h-3 w-3" /> Private Formulation
                    </span>
                    <span>·</span>
                    <span>Last updated: {sel.updatedAt}</span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">{sel.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Pill t="orange">{sel.prepType}</Pill>
                    <Pill
                      t={
                        sel.status === "Under observation"
                          ? "orange"
                          : sel.status === "In preparation"
                            ? "warn"
                            : sel.status === "Archived"
                              ? "muted"
                              : "outline"
                      }
                    >
                      {sel.status}
                    </Pill>
                    {sel.origin && <Pill t="outline">{sel.origin}</Pill>}
                    <span className="text-xs text-muted-foreground ml-1">
                      Batch:{" "}
                      <strong className="text-foreground">{sel.batch || "LOT-Pending"}</strong>
                    </span>
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Btn
                    variant="outline"
                    onClick={() => {
                      setDraft(structuredClone(sel));
                      setActiveTab("edit");
                    }}
                  >
                    Edit formulation
                  </Btn>
                  <Btn
                    variant="outline"
                    onClick={() => setPublishModal(true)}
                    className="border-primary/40 text-primary hover:bg-primary-soft"
                    title="Copy sanitized insight into Doctor Community & Publications draft"
                  >
                    <Share2 className="h-4 w-4" />
                    Create publication draft
                  </Btn>
                  <Btn variant="ink" onClick={() => exportDossierJson(sel)}>
                    <Download className="h-4 w-4" />
                    Export JSON
                  </Btn>
                  <Btn
                    variant="ghost"
                    onClick={() => setConfirmDelete(true)}
                    className="text-destructive hover:bg-destructive/10"
                    aria-label="Delete formulation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Btn>
                </div>
              </div>

              {/* Confirm Deletion Alert Box */}
              {confirmDelete && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm space-y-2">
                  <div className="flex items-center gap-2 text-destructive font-bold">
                    <AlertTriangle className="h-4 w-4" />
                    Delete “{sel.name}”?
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This private formulation, all ingredient specifications, linked cases, and
                    version history will be permanently removed from this browser session.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <Btn
                      variant="ghost"
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Btn>
                    <button
                      type="button"
                      onClick={() => handleDelete(sel.id)}
                      className="rounded-lg bg-destructive px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-destructive/90 transition-colors"
                    >
                      Confirm permanent deletion
                    </button>
                  </div>
                </div>
              )}

              {/* Detail Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-1 border-b pb-2 text-xs font-semibold">
                {[
                  { id: "overview", label: "Overview & Specs" },
                  { id: "ingredients", label: `Ingredients (${sel.ingredients.length})` },
                  { id: "preparation", label: "Preparation & Batches" },
                  { id: "cases", label: `Linked Cases (${sel.cases.length})` },
                  { id: "safety", label: "Safety & Tolerability" },
                  { id: "documents", label: `Documents (${sel.documents.length})` },
                  { id: "dossier", label: "Dossier Preview" },
                  { id: "history", label: `History (v${sel.versions.length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 transition-colors",
                      activeTab === t.id
                        ? "bg-primary text-white shadow-xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Overview & Specs */}
              {activeTab === "overview" && (
                <div className="space-y-6 text-sm">
                  <div className="panel p-5 space-y-3">
                    <div className="eyebrow">Intended Clinical Use & Rationale</div>
                    <p className="text-foreground leading-relaxed">
                      {sel.intendedUse || "No specific indication documented."}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="panel p-4 space-y-2">
                      <div className="eyebrow">Preparation Origin & Site</div>
                      <div className="text-foreground font-semibold">
                        {sel.origin ?? "Self-prepared"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sel.facility || "Local Dispensary"}
                      </div>
                    </div>

                    <div className="panel p-4 space-y-2">
                      <div className="eyebrow">Classical Reference Adaptation</div>
                      <div className="text-foreground font-medium">
                        {sel.classicalReference || "Proprietary clinical innovation"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Documented classical source or shloka background
                      </div>
                    </div>
                  </div>

                  {/* Ayurvedic Attributes */}
                  <div className="panel p-5 space-y-3">
                    <div className="eyebrow">Ayurvedic Pharmacological Attributes</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="rounded-lg bg-surface p-3">
                        <span className="text-muted-foreground block mb-1">Rasa (Taste):</span>
                        <span className="font-semibold">
                          {sel.ayurvedicAttributes?.rasa || "—"}
                        </span>
                      </div>
                      <div className="rounded-lg bg-surface p-3">
                        <span className="text-muted-foreground block mb-1">Virya (Potency):</span>
                        <span className="font-semibold">
                          {sel.ayurvedicAttributes?.virya || "—"}
                        </span>
                      </div>
                      <div className="rounded-lg bg-surface p-3">
                        <span className="text-muted-foreground block mb-1">
                          Vipaka (Post-digestive):
                        </span>
                        <span className="font-semibold">
                          {sel.ayurvedicAttributes?.vipaka || "—"}
                        </span>
                      </div>
                      <div className="rounded-lg bg-surface p-3">
                        <span className="text-muted-foreground block mb-1">Karma (Action):</span>
                        <span className="font-semibold">
                          {sel.ayurvedicAttributes?.karma || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Research Notes */}
                  {sel.notes && (
                    <div className="panel p-5 space-y-2">
                      <div className="eyebrow">Practitioner Research Notes</div>
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                        {sel.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Ingredients & Composition */}
              {activeTab === "ingredients" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        Formulation Master Ingredients
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Quantitative proportions and botanical specifications
                      </p>
                    </div>
                    <Btn
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        setDraft(structuredClone(sel));
                        setActiveTab("edit");
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Edit ingredients
                    </Btn>
                  </div>

                  <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground border-b">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">Ingredient</th>
                          <th className="p-3">Botanical / Source</th>
                          <th className="p-3">Quantity</th>
                          <th className="p-3">Unit</th>
                          <th className="p-3">Proportion</th>
                          <th className="p-3">Classical Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-xs">
                        {sel.ingredients.map((ing, idx) => (
                          <tr key={idx} className="hover:bg-muted/40 transition-colors">
                            <td className="p-3 text-muted-foreground font-mono">{idx + 1}</td>
                            <td className="p-3 font-bold text-foreground">{ing.name}</td>
                            <td className="p-3 italic text-muted-foreground">
                              {ing.botanicalName || "—"}
                            </td>
                            <td className="p-3 font-semibold">{ing.quantity}</td>
                            <td className="p-3">{ing.unit}</td>
                            <td className="p-3 font-mono">{ing.ratio || "1"}</td>
                            <td className="p-3 text-muted-foreground">
                              {ing.classicalRole || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Preparation & Batches */}
              {activeTab === "preparation" && (
                <div className="space-y-6 text-sm">
                  <div className="panel p-5 space-y-2">
                    <div className="eyebrow">Standard Preparation Method (SOP)</div>
                    <p className="leading-relaxed text-foreground whitespace-pre-line">
                      {sel.method || "No specific preparation method documented yet."}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="panel p-4 space-y-1.5 text-xs">
                      <span className="eyebrow block">Batch & Lot Reference</span>
                      <div className="text-sm font-bold font-mono">{sel.batch || "LOT-A1"}</div>
                      <div className="text-muted-foreground">
                        Finished Batch Yield: <strong>{sel.batchYield || "Not recorded"}</strong>
                      </div>
                    </div>

                    <div className="panel p-4 space-y-1.5 text-xs">
                      <span className="eyebrow block">Operator & Date</span>
                      <div className="text-sm font-semibold">{sel.preparedBy}</div>
                      <div className="text-muted-foreground">Prepared on: {sel.preparedOn}</div>
                    </div>

                    <div className="panel p-4 space-y-1.5 text-xs md:col-span-2">
                      <span className="eyebrow block">Raw Material Sourcing Provenance</span>
                      <p className="text-sm leading-relaxed text-foreground">
                        {sel.sourcing || "Local botanical market sample."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Linked Case Studies */}
              {activeTab === "cases" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        Linked Pseudonymous Case Observations
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Private clinical observations for this specific formulation (strictly
                        non-identifiable)
                      </p>
                    </div>
                    <Btn
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        const copy = structuredClone(sel);
                        copy.cases.push({
                          ref: `PT-${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
                          dose: "5 g BD",
                          duration: "4 weeks",
                          anupana: "Warm water",
                          response: "Observational improvement recorded",
                          followUp: "6 weeks",
                        });
                        setDraft(copy);
                        setActiveTab("edit");
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add case observation
                    </Btn>
                  </div>

                  {sel.cases.length === 0 ? (
                    <Empty
                      title="No linked clinical cases"
                      desc="Link private observational records using pseudonymous codes (e.g. PT-XXXX) to build formulation evidence."
                    />
                  ) : (
                    <div className="space-y-3">
                      {sel.cases.map((c, idx) => (
                        <div key={idx} className="panel p-4 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                              {c.ref}
                            </span>
                            {c.condition && (
                              <span className="font-semibold text-primary">{c.condition}</span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-1 text-muted-foreground">
                            <div>
                              Dose: <strong className="text-foreground">{c.dose}</strong>
                            </div>
                            <div>
                              Anupana: <strong className="text-foreground">{c.anupana}</strong>
                            </div>
                            <div>
                              Duration: <strong className="text-foreground">{c.duration}</strong>
                            </div>
                          </div>
                          <div className="pt-1 border-t text-foreground">
                            <strong>Response:</strong> {c.response}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Safety & Tolerability */}
              {activeTab === "safety" && (
                <div className="space-y-6 text-sm">
                  <div className="panel p-5 space-y-3">
                    <div className="eyebrow">Documented Safety & Tolerability Observations</div>
                    <p className="text-foreground leading-relaxed whitespace-pre-line">
                      {sel.safety ||
                        sel.safetyObservations ||
                        "No adverse observations reported during observation."}
                    </p>
                  </div>

                  <div className="panel border-dashed bg-surface p-4 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <ShieldAlert className="h-4 w-4 text-primary" />
                      ADR Surveillance & Pharmacovigilance Note
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      If any adverse reactions are suspected during private observational use,
                      record them via the “Report a Side Effect” module. Linking an ADR report to an
                      investigational batch does not constitute proof of pharmacological causality.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 6: Documents & Lab Records */}
              {activeTab === "documents" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        Quality Documents & Lab Reports
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Certificates of Analysis, botanical sourcing invoices, and preparation
                        photographs
                      </p>
                    </div>
                  </div>

                  <div className="panel p-5 space-y-4">
                    <MockUpload
                      files={sel.documents}
                      onChange={(documents) => {
                        const updated = { ...sel, documents, updatedAt: today() };
                        setState((s) => ({
                          formulations: s.formulations.map((f) =>
                            f.id === updated.id ? updated : f,
                          ),
                        }));
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Tab 7: Dossier Preview & Export */}
              {activeTab === "dossier" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4 rounded-xl border">
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        Confidential Research Dossier Preview
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Structured summary ready for clinical compilation or export
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyDossierText(sel)}
                        className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary transition-colors"
                      >
                        {copiedDossier ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {copiedDossier ? "Copied" : "Copy text"}
                      </button>
                      <Btn
                        variant="ink"
                        onClick={() => exportDossierJson(sel)}
                        className="text-xs py-1.5 px-3"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download JSON
                      </Btn>
                    </div>
                  </div>

                  {/* Formatted Dossier Document Paper */}
                  <div className="rounded-2xl border bg-white p-6 md:p-10 shadow-soft space-y-6 text-sm text-foreground">
                    {/* Header */}
                    <div className="border-b-2 border-primary pb-4 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-xs uppercase tracking-widest font-bold text-primary">
                          Mey Veda Grantha
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">
                          Confidential Research Dossier
                        </h1>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div>Local ID: {sel.localId}</div>
                        <div>Date: {today()}</div>
                      </div>
                    </div>

                    {/* Prominent Regulatory Disclaimer */}
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        PRELIMINARY INVESTIGATIONAL DOSSIER · REGULATORY NOTICE
                      </div>
                      <p className="leading-relaxed">
                        This dossier is an internal research record prepared solely for academic,
                        clinical documentation and preparation purposes. It does{" "}
                        <strong>NOT</strong> constitute a drug manufacturing license (Form 25-D),
                        Certificate of Pharmaceutical Product (CoPP), or government marketing
                        authorization. It does not guarantee clinical efficacy, safety, or
                        regulatory approval.
                      </p>
                    </div>

                    {/* Section 1: Product Master */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
                        1. Product Identification & Specifications
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Formulation Name:</span>
                          <span className="font-bold">{sel.name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Preparation Type:</span>
                          <span className="font-semibold">{sel.prepType}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Research Status:</span>
                          <span className="font-semibold">{sel.status}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Batch Reference:</span>
                          <span className="font-mono font-semibold">{sel.batch || "LOT-A1"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Composition */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
                        2. Active Ingredients & Composition
                      </h4>
                      <table className="w-full text-left text-xs border">
                        <thead className="bg-surface border-b">
                          <tr>
                            <th className="p-2">Ingredient</th>
                            <th className="p-2">Botanical Name</th>
                            <th className="p-2">Quantity</th>
                            <th className="p-2">Ratio</th>
                            <th className="p-2">Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {sel.ingredients.map((i, k) => (
                            <tr key={k}>
                              <td className="p-2 font-semibold">{i.name}</td>
                              <td className="p-2 italic">{i.botanicalName || "—"}</td>
                              <td className="p-2">
                                {i.quantity} {i.unit}
                              </td>
                              <td className="p-2">{i.ratio || "1"}</td>
                              <td className="p-2">{i.classicalRole || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Section 3: Preparation SOP */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
                        3. Method of Preparation (SOP)
                      </h4>
                      <p className="text-xs leading-relaxed whitespace-pre-line bg-surface p-3 rounded-lg border">
                        {sel.method || "Standard classical kalpana protocol applied."}
                      </p>
                    </div>

                    {/* Section 4: Clinical Observations */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
                        4. Observational Clinical Studies ({sel.cases.length} linked)
                      </h4>
                      {sel.cases.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          No observational cases linked to this formulation version.
                        </p>
                      ) : (
                        <div className="space-y-2 text-xs">
                          {sel.cases.map((c, i) => (
                            <div key={i} className="p-2.5 rounded border bg-surface space-y-1">
                              <span className="font-mono font-bold">{c.ref}</span> · {c.dose} with{" "}
                              {c.anupana} ({c.duration}) — <em>{c.response}</em>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section 5: Safety */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
                        5. Safety, Tolerability & Version History
                      </h4>
                      <p className="text-xs leading-relaxed">
                        {sel.safety ||
                          sel.safetyObservations ||
                          "Tolerability monitored without adverse observations."}
                      </p>
                      <div className="pt-2 text-[11px] text-muted-foreground">
                        Documented by Dr. Ananya Kulkarni · Current Version: v{sel.versions.length}{" "}
                        ({sel.updatedAt})
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 8: Audit & Version History */}
              {activeTab === "history" && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-foreground">
                    Specification Version History
                  </h3>
                  <ol className="relative ml-3 border-l border-primary/30 pl-5 space-y-4 text-xs">
                    {sel.versions.map((v) => (
                      <li key={v.v} className="relative">
                        <span className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-primary shadow-xs" />
                        <div className="panel p-3.5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-foreground">Version {v.v}</span>
                            <span className="text-muted-foreground font-medium">{v.at}</span>
                          </div>
                          <p className="text-sm text-foreground">{v.note}</p>
                          <div className="text-[11px] text-muted-foreground">
                            Author: {v.author || "Dr. Ananya Kulkarni"}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Privacy & Ownership Limitations Dialog */}
      <Dialog open={privacyModal} onOpenChange={setPrivacyModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Private Research Privacy & Boundaries
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed pt-2">
              Review how research data isolation, practitioner privacy boundaries, and production
              security requirements are managed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs leading-relaxed max-h-[65vh] overflow-y-auto pr-1">
            <div className="rounded-lg bg-primary-soft p-3 space-y-1">
              <strong className="text-foreground block flex items-center gap-1.5 font-bold">
                <Lock className="h-3.5 w-3.5 text-primary" />
                Confidential Workspace By Default:
              </strong>
              <p className="text-muted-foreground">
                Your private formulations, ingredient ratios, SOP batch logs, private documents, and
                linked case observations are strictly isolated to your practitioner workspace. They
                never appear in the public Doctor Community feed, Scientific Journals, global
                medicine search, or other practitioners' portals.
              </p>
            </div>

            <div className="rounded-lg bg-surface border p-3 space-y-1.5">
              <strong className="text-foreground block font-bold">
                Prototype Identity & Storage Disclosure:
              </strong>
              <p className="text-muted-foreground">
                In this Phase 1 demonstration environment, data is stored locally in your browser’s{" "}
                <code>localStorage</code> (<code>mvg-demo-v1</code>) and tied to session
                practitioner ID <code>doc-ak-1</code>.{" "}
                <strong>
                  Client-side filtering and localStorage do NOT provide secure multi-user tenant
                  isolation or cryptographic security.
                </strong>{" "}
                The frontend alone cannot guarantee privacy.
              </p>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-1.5 text-amber-950">
              <strong className="block font-semibold">
                Production Backend Security Requirements:
              </strong>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li>
                  <strong className="text-amber-900">Authenticated Identity:</strong>{" "}
                  Cryptographically verified JWT sessions with server-side record ownership
                  validation.
                </li>
                <li>
                  <strong className="text-amber-900">Server-Side Authorization:</strong> Strict
                  Row-Level Security (RLS) on every read, write, export, and publication-creation
                  request.
                </li>
                <li>
                  <strong className="text-amber-900">Secure Document Vault:</strong> Zero-knowledge
                  encrypted blob storage with access-controlled, time-limited presigned URLs.
                </li>
                <li>
                  <strong className="text-amber-900">Immutable Audit Trail:</strong> Tamper-evident
                  logging of all formulation revisions, dossier exports, and publication handoffs.
                </li>
                <li>
                  <strong className="text-amber-900">Explicit Consent & Ethics Review:</strong>{" "}
                  Verification of ethical clearance and anonymization before any clinical insight
                  sharing.
                </li>
              </ul>
            </div>

            <div className="rounded-lg bg-surface border p-3 space-y-1">
              <strong className="block font-semibold text-foreground">
                Regulatory Integrity Notice:
              </strong>
              <p className="text-muted-foreground">
                Dossier previews and JSON exports are observational research documentation tools.
                Generating a dossier does not grant a government manufacturing license (AYUSH Form
                25-D), nor does it establish clinical efficacy or regulatory approval.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Explicit Publication Handoff Confirmation Dialog */}
      <Dialog open={publishModal} onOpenChange={setPublishModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Create Publication Draft from Research
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed pt-2">
              Convert high-level clinical insights from this private formulation into an independent
              draft in Doctor Community & Publications.
            </DialogDescription>
          </DialogHeader>

          {sel && (
            <div className="space-y-4 text-xs">
              <div className="rounded-lg bg-primary-soft/50 p-3 space-y-1 border border-primary/20">
                <span className="font-semibold text-foreground block">Source Formulation:</span>
                <div className="font-bold text-primary-deep text-sm">{sel.name}</div>
                <div className="text-muted-foreground font-mono text-[11px]">
                  Local ID: {sel.localId} · Type: {sel.prepType}
                </div>
              </div>

              {/* Data boundary explanation */}
              <div className="space-y-2 border-y py-3">
                <div className="font-semibold text-foreground">
                  Privacy & Field Boundary Review:
                </div>
                <div className="grid gap-2 sm:grid-cols-2 text-[11px]">
                  <div className="rounded-lg bg-emerald-50/60 border border-emerald-200 p-2.5 text-emerald-900 space-y-1">
                    <span className="font-bold flex items-center gap-1">
                      <Check className="h-3 w-3 text-emerald-600" /> Permitted Copied Fields:
                    </span>
                    <ul className="list-disc pl-3.5 space-y-0.5 text-emerald-800">
                      <li>Formulation Title & Summary</li>
                      <li>Preparation Type & Classical Rationale</li>
                      <li>Ayurvedic Attributes (Rasa, Virya, Karma)</li>
                      <li>Sanitized Posology Context</li>
                    </ul>
                  </div>

                  <div className="rounded-lg bg-rose-50/60 border border-rose-200 p-2.5 text-rose-900 space-y-1">
                    <span className="font-bold flex items-center gap-1">
                      <Lock className="h-3 w-3 text-rose-600" /> Redacted Sensitive Fields:
                    </span>
                    <ul className="list-disc pl-3.5 space-y-0.5 text-rose-800">
                      <li>Internal batch/lot codes ({sel.batch || "LOT-..."})</li>
                      <li>Raw patient identifiers & case references</li>
                      <li>Internal documents & lab attachments</li>
                      <li>Facility & supplier agreements</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Independence and non-auto publish note */}
              <div className="rounded-lg bg-muted p-2.5 text-[11px] text-muted-foreground space-y-1">
                <span className="font-semibold text-foreground block">
                  Draft Lifecycle Independence:
                </span>
                <p>
                  This creates an independent, decoupled publication draft in{" "}
                  <strong>My Publications</strong> (status: <code>Draft</code>). It will{" "}
                  <strong>NOT</strong> be auto-submitted or visible to other doctors until you
                  review, edit, and deliberately submit it. Subsequent edits to either record will
                  not affect the other.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Btn variant="ghost" onClick={() => setPublishModal(false)}>
                  Cancel
                </Btn>
                <Btn onClick={() => handleCreatePublicationDraft(sel)} className="gap-1.5">
                  <Share2 className="h-3.5 w-3.5" />
                  Confirm & Create Draft
                </Btn>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ========================================================================= */
/* FORMULATION EDITOR COMPONENT                                              */
/* ========================================================================= */

function FormulationEditor({
  d,
  set,
  onSave,
  onCancel,
}: {
  d: Formulation;
  set: (f: Formulation) => void;
  onSave: (asDraft: boolean) => void;
  onCancel: () => void;
}) {
  const [nameError, setNameError] = useState("");

  const updateField =
    (k: keyof Formulation) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      if (k === "name" && e.target.value.trim()) setNameError("");
      set({ ...d, [k]: e.target.value });
    };

  const updateAttr = (k: string, v: string) => {
    set({
      ...d,
      ayurvedicAttributes: {
        ...(d.ayurvedicAttributes ?? {}),
        [k]: v,
      },
    });
  };

  const updateIngredient = (idx: number, patch: Partial<FormulationIngredient>) => {
    set({
      ...d,
      ingredients: d.ingredients.map((ing, i) => (i === idx ? { ...ing, ...patch } : ing)),
    });
  };

  const addIngredientRow = () => {
    set({
      ...d,
      ingredients: [
        ...d.ingredients,
        {
          name: "",
          quantity: "100",
          unit: "g",
          ratio: "1",
          botanicalName: "",
          partUsed: "",
          classicalRole: "",
        },
      ],
    });
  };

  const removeIngredientRow = (idx: number) => {
    if (d.ingredients.length <= 1) {
      toast.error("Formulation requires at least one ingredient row");
      return;
    }
    set({
      ...d,
      ingredients: d.ingredients.filter((_, i) => i !== idx),
    });
  };

  const addCaseObservation = () => {
    const newCase: FormulationCaseStudy = {
      ref: `PT-${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
      dose: "5 g BD",
      duration: "4 weeks",
      anupana: "Warm water (Ushnodaka)",
      response: "Self-reported symptom relief",
      followUp: "6 weeks",
      condition: d.intendedUse || "Clinical observation",
    };
    set({
      ...d,
      cases: [...d.cases, newCase],
    });
  };

  const removeCase = (idx: number) => {
    set({
      ...d,
      cases: d.cases.filter((_, i) => i !== idx),
    });
  };

  const updateCase = (idx: number, patch: Partial<FormulationCaseStudy>) => {
    set({
      ...d,
      cases: d.cases.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    });
  };

  return (
    <div className="space-y-6">
      {/* Editor Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <span className="eyebrow">Formulation Specification Editor</span>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {d.name ? `Editing: ${d.name}` : "Establish New Formulation"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="ghost" onClick={onCancel}>
            Cancel
          </Btn>
          <Btn variant="outline" onClick={() => onSave(true)}>
            Save as Draft
          </Btn>
          <Btn onClick={() => onSave(false)}>Save Version</Btn>
        </div>
      </div>

      {/* Section 1: Basic Information */}
      <div className="panel p-5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground border-b pb-2">
          1. Basic Formulation Identity
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Medicine Name *" error={nameError}>
              <input
                className={cn(inputCls, nameError && "border-destructive")}
                value={d.name}
                onChange={updateField("name")}
                placeholder="e.g. Modified Triphala Avaleha"
              />
            </Field>
          </div>

          <Field
            label="Local Research Identifier"
            hint="Internal tracking ID — not an AYUSH license"
          >
            <input className={cn(inputCls, "bg-muted font-mono")} value={d.localId} readOnly />
          </Field>

          <Field label="Preparation Type">
            <select className={inputCls} value={d.prepType} onChange={updateField("prepType")}>
              {PREP_TYPES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Research Workflow Status">
            <select className={inputCls} value={d.status} onChange={updateField("status")}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Formulation Origin">
            <select className={inputCls} value={d.origin} onChange={updateField("origin")}>
              {ORIGIN_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label="Preparation Facility / Clinic Site">
              <input
                className={inputCls}
                value={d.facility ?? ""}
                onChange={updateField("facility")}
                placeholder="e.g. Personal Clinic Dispensary, Pune"
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Intended Clinical Use & Indication">
              <textarea
                rows={2}
                className={inputCls}
                value={d.intendedUse}
                onChange={updateField("intendedUse")}
                placeholder="Primary therapeutic intent, target dosha imbalance, and clinical indication…"
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field
              label="Classical Reference Adaptation"
              hint="E.g. Sharangadhara Samhita, Madhyama Khanda 7/12-14"
            >
              <input
                className={inputCls}
                value={d.classicalReference ?? ""}
                onChange={updateField("classicalReference")}
                placeholder="Reference classical text, chapter, or monograph citation…"
              />
            </Field>
          </div>
        </div>

        {/* Ayurvedic Pharmacology */}
        <div className="pt-3 border-t">
          <span className="text-xs font-semibold block mb-2 text-muted-foreground">
            Ayurvedic Attributes (Dravyaguna):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <Field label="Rasa">
              <input
                className={inputCls}
                value={d.ayurvedicAttributes?.rasa ?? ""}
                onChange={(e) => updateAttr("rasa", e.target.value)}
                placeholder="e.g. Kashaya, Madhura"
              />
            </Field>
            <Field label="Virya">
              <input
                className={inputCls}
                value={d.ayurvedicAttributes?.virya ?? ""}
                onChange={(e) => updateAttr("virya", e.target.value)}
                placeholder="e.g. Ushna / Sheeta"
              />
            </Field>
            <Field label="Vipaka">
              <input
                className={inputCls}
                value={d.ayurvedicAttributes?.vipaka ?? ""}
                onChange={(e) => updateAttr("vipaka", e.target.value)}
                placeholder="e.g. Madhura / Katu"
              />
            </Field>
            <Field label="Karma">
              <input
                className={inputCls}
                value={d.ayurvedicAttributes?.karma ?? ""}
                onChange={(e) => updateAttr("karma", e.target.value)}
                placeholder="e.g. Deepana, Pachana"
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Section 2: Ingredients Editor */}
      <div className="panel p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              2. Ingredients & Composition
            </h3>
            <p className="text-xs text-muted-foreground">
              Specify active raw materials, quantities, units and proportion ratios
            </p>
          </div>
          <Btn variant="outline" type="button" onClick={addIngredientRow} className="text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add ingredient row
          </Btn>
        </div>

        <div className="space-y-3">
          {d.ingredients.map((ing, idx) => (
            <motion.div
              key={idx}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_80px_70px_70px_36px] gap-2 p-3 rounded-xl border bg-surface/50 items-center text-xs"
            >
              <input
                aria-label="Ingredient name"
                placeholder="Ingredient (e.g. Haritaki) *"
                className={inputCls}
                value={ing.name}
                onChange={(e) => updateIngredient(idx, { name: e.target.value })}
              />
              <input
                aria-label="Botanical / Latin name"
                placeholder="Botanical (e.g. Terminalia chebula)"
                className={inputCls}
                value={ing.botanicalName ?? ""}
                onChange={(e) => updateIngredient(idx, { botanicalName: e.target.value })}
              />
              <input
                aria-label="Quantity"
                placeholder="Qty"
                className={inputCls}
                value={ing.quantity}
                onChange={(e) => updateIngredient(idx, { quantity: e.target.value })}
              />
              <select
                aria-label="Unit"
                className={inputCls}
                value={ing.unit}
                onChange={(e) => updateIngredient(idx, { unit: e.target.value })}
              >
                {["g", "mg", "ml", "part"].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <input
                aria-label="Ratio"
                placeholder="Ratio"
                className={inputCls}
                value={ing.ratio}
                onChange={(e) => updateIngredient(idx, { ratio: e.target.value })}
              />
              <button
                type="button"
                onClick={() => removeIngredientRow(idx)}
                aria-label="Remove ingredient"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Section 3: Preparation SOP & Batches */}
      <div className="panel p-5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground border-b pb-2">
          3. Preparation SOP & Batch Records
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Standard Operating Procedure (SOP) / Method">
              <textarea
                rows={4}
                className={inputCls}
                value={d.method}
                onChange={updateField("method")}
                placeholder="Detail stages of preparation, boiling temperature, shodhana, reduction ratios, prakshepa additions…"
              />
            </Field>
          </div>

          <Field label="Prepared By">
            <input className={inputCls} value={d.preparedBy} onChange={updateField("preparedBy")} />
          </Field>

          <Field label="Prepared On">
            <input
              type="date"
              className={inputCls}
              value={d.preparedOn}
              onChange={updateField("preparedOn")}
            />
          </Field>

          <Field label="Batch / Lot ID">
            <input className={inputCls} value={d.batch} onChange={updateField("batch")} />
          </Field>

          <Field label="Finished Batch Yield">
            <input
              className={inputCls}
              value={d.batchYield ?? ""}
              onChange={updateField("batchYield")}
              placeholder="e.g. 500 g or 1000 tablets"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Raw Material Sourcing & Verification">
              <input
                className={inputCls}
                value={d.sourcing}
                onChange={updateField("sourcing")}
                placeholder="Herb supplier, collection region, harvest year, botanical authenticity memo…"
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Section 4: Pseudonymous Clinical Cases */}
      <div className="panel p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              4. Linked Pseudonymous Case Observations
            </h3>
            <p className="text-xs text-muted-foreground">
              De-identified patient observation records (never include direct patient names or IDs)
            </p>
          </div>
          <Btn variant="outline" type="button" onClick={addCaseObservation} className="text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add observational case
          </Btn>
        </div>

        {d.cases.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            No case observations linked yet. Click “Add observational case” to document pilot
            patient tolerability.
          </p>
        ) : (
          <div className="space-y-3">
            {d.cases.map((c, idx) => (
              <div
                key={idx}
                className="grid gap-2 rounded-xl border bg-surface p-3.5 sm:grid-cols-5 text-xs items-center"
              >
                <div>
                  <span className="text-[10px] text-muted-foreground block">Patient Ref</span>
                  <input
                    aria-label="Patient code"
                    className={cn(inputCls, "bg-muted font-mono")}
                    value={c.ref}
                    readOnly
                  />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Dose</span>
                  <input
                    aria-label="Dose"
                    className={inputCls}
                    value={c.dose}
                    onChange={(e) => updateCase(idx, { dose: e.target.value })}
                    placeholder="e.g. 5 g BD"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Anupana</span>
                  <input
                    aria-label="Anupana"
                    className={inputCls}
                    value={c.anupana}
                    onChange={(e) => updateCase(idx, { anupana: e.target.value })}
                    placeholder="e.g. Warm water"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Clinical Response</span>
                  <input
                    aria-label="Response"
                    className={inputCls}
                    value={c.response}
                    onChange={(e) => updateCase(idx, { response: e.target.value })}
                    placeholder="Observation summary"
                  />
                </div>
                <div className="flex items-center gap-2 pt-3 sm:pt-0">
                  <div className="flex-1">
                    <span className="text-[10px] text-muted-foreground block">Duration</span>
                    <input
                      aria-label="Duration"
                      className={inputCls}
                      value={c.duration}
                      onChange={(e) => updateCase(idx, { duration: e.target.value })}
                      placeholder="e.g. 4 weeks"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCase(idx)}
                    aria-label="Remove case"
                    className="mt-3 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 5: Safety & Research Notes */}
      <div className="panel p-5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground border-b pb-2">
          5. Research Observations & Tolerability Notes
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Clinical Research Notes">
            <textarea
              rows={3}
              className={inputCls}
              value={d.notes}
              onChange={updateField("notes")}
              placeholder="Observed palatability, shelf-life notes, physical characteristics…"
            />
          </Field>
          <Field label="Safety & Tolerability Observations">
            <textarea
              rows={3}
              className={inputCls}
              value={d.safety}
              onChange={updateField("safety")}
              placeholder="Tolerability observations, absence/presence of GI discomfort, contraindications…"
            />
          </Field>
        </div>
      </div>

      {/* Section 6: Quality Documents */}
      <div className="panel p-5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground border-b pb-2">
          6. Attach Quality Documents & Photographs
        </h3>
        <MockUpload files={d.documents} onChange={(documents) => set({ ...d, documents })} />
      </div>

      {/* Sticky Bottom Actions */}
      <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t bg-background/95 p-4 backdrop-blur shadow-lift rounded-t-xl">
        <div className="text-xs text-muted-foreground">
          Local draft · Changes stored on this device upon saving
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="ghost" onClick={onCancel}>
            Cancel
          </Btn>
          <Btn variant="outline" onClick={() => onSave(true)}>
            Save as Draft
          </Btn>
          <Btn onClick={() => onSave(false)}>Save Version</Btn>
        </div>
      </div>
    </div>
  );
}
