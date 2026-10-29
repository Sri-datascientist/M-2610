import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  ExternalLink,
  FileEdit,
  FileText,
  FlaskConical,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Btn, Chip, Empty, PageHeader, Pill, inputCls } from "@/components/ui-kit";
import { ADR_STATUSES, batches, medicines } from "@/lib/mock-data";
import { setState, today, useStore, type AdrReport } from "@/lib/store";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { apiClient } from "@/services/apiClient";

export const Route = createFileRoute("/_ws/reports")({
  validateSearch: (s: Record<string, unknown>): { id?: string | undefined } => ({
    id: typeof s["id"] === "string" ? s["id"] : undefined,
  }),
  head: () =>
    seo(
      "My Reports",
      "Track your submitted adverse drug reaction reports, review status, and follow-up communications.",
    ),
  component: Reports,
});

export type SortOption = "newest" | "oldest" | "medicine";

export function filterReports(
  all: AdrReport[],
  opts: { q?: string; status?: string | null; sortBy?: SortOption } = {},
) {
  const { q = "", status = null, sortBy = "newest" } = opts;
  let list = all.filter((r) => {
    if (status && r.status !== status) return false;
    if (!q.trim()) return true;
    const hay =
      `${r.id} ${r.medicine} ${r.batch ?? ""} ${r.patientRef} ${r.reaction} ${r.seriousness}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  if (sortBy === "oldest") {
    list = [...list].sort(
      (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
    );
  } else if (sortBy === "medicine") {
    list = [...list].sort((a, b) => a.medicine.localeCompare(b.medicine));
  } else {
    // newest first
    list = [...list].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
  }

  return list;
}

export function Reports() {
  const { id } = Route.useSearch();
  const navigate = useNavigate({ from: "/reports" });
  const all = useStore((s) => s.adr);
  const formulations = useStore((s) => s.formulations);

  const [q, setQ] = useState("");
  const [st, setSt] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [msg, setMsg] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiClient
      .get<{ items: any[]; total: number }>("/doctors/me/adr-reports")
      .then((res) => {
        if (!active || !res?.items) return;
        const mappedReports: AdrReport[] = res.items.map((item) => ({
          id: item.id,
          medicine: item.product_name,
          batch: "",
          patientRef: `PT-${item.id.slice(0, 6).toUpperCase()}`,
          ageBand: "Adult",
          sex: "Not specified",
          dose: "As prescribed",
          route: "Oral",
          startDate: item.occurred_on,
          reaction: item.reaction,
          onset: "Acute",
          seriousness: item.seriousness === "serious" ? "Serious" : "Non-serious",
          outcome: item.outcome,
          concomitant: "",
          action: "Monitored",
          status: item.status === "submitted" ? "Received" : item.status === "under_review" ? "Being Reviewed" : "Review Completed",
          causality: "Under Review",
          regulatory: "Internal Pharmacovigilance",
          submittedAt: item.created_at,
          timeline: [
            { at: item.created_at, text: "Report submitted to pharmacovigilance desk" },
          ],
          messages: [],
          attachments: [],
        }));

        if (mappedReports.length > 0) {
          setState((s) => {
            const existingIds = new Set(mappedReports.map((m) => m.id));
            return {
              adr: [...mappedReports, ...s.adr.filter((x) => !existingIds.has(x.id))],
            };
          });
        }
      })
      .catch((err) => {
        console.warn("Could not load backend ADR reports:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredList = useMemo(() => {
    return filterReports(all, { q, status: st, sortBy });
  }, [all, q, st, sortBy]);

  const sel = (id ? all.find((r) => r.id === id) : null) ?? filteredList[0] ?? null;
  const statusIdx = sel ? ADR_STATUSES.indexOf(sel.status as never) : -1;

  // Cross-module link lookups
  const linkedCatalogMed = useMemo(() => {
    if (!sel) return undefined;
    return medicines.find(
      (m) =>
        m.name.toLowerCase() === sel.medicine.trim().toLowerCase() ||
        m.id === sel.medicine.trim().toLowerCase(),
    );
  }, [sel]);

  const linkedBatch = useMemo(() => {
    if (!sel || !sel.batch) return undefined;
    return batches.find((b) => b.id.toLowerCase() === sel.batch.toLowerCase());
  }, [sel]);

  const linkedPrivateFormulation = useMemo(() => {
    if (!sel) return undefined;
    return formulations.find(
      (f) =>
        f.linkedAdrReportIds?.includes(sel.id) ||
        f.name.toLowerCase() === sel.medicine.trim().toLowerCase(),
    );
  }, [sel, formulations]);

  const reply = () => {
    if (!sel || !msg.trim()) return;
    const trimmed = msg.trim();
    const now = today();

    setState((s) => ({
      adr: s.adr.map((r) =>
        r.id === sel.id
          ? {
              ...r,
              messages: [...r.messages, { from: "You" as const, at: now, text: trimmed }],
              status: r.status === "More Details Needed" ? "Being Reviewed" : r.status,
              timeline: [
                ...r.timeline,
                {
                  at: now,
                  text: "Doctor provided follow-up details",
                },
                ...(r.status === "More Details Needed"
                  ? [{ at: now, text: "Status updated to Being Reviewed" }]
                  : []),
              ],
            }
          : r,
      ),
    }));

    setMsg("");
    toast.success("Follow-up response recorded");
  };

  const deleteDraft = (draftId: string) => {
    setState((s) => ({
      adr: s.adr.filter((x) => x.id !== draftId),
    }));
    setDeleteConfirmId(null);
    toast.success("Draft report removed");
    if (sel?.id === draftId) {
      navigate({ search: {} });
    }
  };

  const clearAllFilters = () => {
    setQ("");
    setSt(null);
    setSortBy("newest");
    navigate({ search: {} });
  };

  const statusTone = (status: AdrReport["status"]) => {
    if (status === "Draft") return "muted";
    if (status === "More Details Needed") return "warn";
    if (status === "Case Closed" || status === "Review Completed") return "ink";
    return "orange";
  };

  return (
    <div>
      <PageHeader
        eyebrow="Safety & Vigilance"
        title="My Reports"
        desc={`${all.length} total ADR report${all.length === 1 ? "" : "s"} logged in your private workspace.`}
        actions={
          <Link
            to="/adr"
            className="rounded-lg bg-orange-gradient px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-soft hover:bg-primary-deep"
          >
            File New Report
          </Link>
        }
      />

      {/* Filter and Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-surface px-4 py-3 md:px-8">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="eyebrow text-muted-foreground mr-1">Status:</span>
          <Chip active={!st} onClick={() => setSt(null)}>
            All ({all.length})
          </Chip>
          <Chip active={st === "Draft"} onClick={() => setSt(st === "Draft" ? null : "Draft")}>
            Drafts ({all.filter((r) => r.status === "Draft").length})
          </Chip>
          {ADR_STATUSES.map((s) => {
            const num = all.filter((r) => r.status === s).length;
            if (num === 0 && st !== s) return null;
            return (
              <Chip key={s} active={st === s} onClick={() => setSt(st === s ? null : s)}>
                {s} ({num})
              </Chip>
            );
          })}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border bg-card px-2.5 py-1 text-xs outline-none focus:border-primary"
            aria-label="Sort reports"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="medicine">Medicine name (A–Z)</option>
          </select>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid lg:grid-cols-[360px_1fr]">
        {/* Left List Pane */}
        <div className="border-b p-4 lg:min-h-[70vh] lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-xs focus-within:border-primary">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by ID, medicine, batch or reaction…"
              className="flex-1 bg-transparent text-xs outline-none"
              aria-label="Search reports"
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

          {filteredList.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-xs space-y-2">
              <p className="font-semibold text-foreground">No reports found</p>
              <p className="text-muted-foreground">
                No side-effect reports match your current filter or search criteria.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-primary underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredList.map((r) => {
                const isSelected = sel?.id === r.id;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => navigate({ search: { id: r.id } })}
                      className={cn(
                        "w-full rounded-xl border p-3.5 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary-soft/60 shadow-soft"
                          : "bg-card hover:border-primary/40",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono font-bold text-sm text-foreground">{r.id}</span>
                        <Pill t={statusTone(r.status)} className="text-[10px]">
                          {r.status}
                        </Pill>
                      </div>
                      <div className="mt-1 font-semibold text-xs text-foreground line-clamp-1">
                        {r.medicine}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
                        Reaction: {r.reaction || "Draft in progress"}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t pt-1.5">
                        <span>{r.submittedAt}</span>
                        {r.batch && (
                          <span className="font-mono bg-surface px-1.5 py-0.5 rounded border">
                            {r.batch}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right Detail Pane */}
        {!sel ? (
          <div className="p-8">
            <Empty
              title="No report selected"
              desc="Choose an adverse event report from the list to view clinical investigation details."
              action={
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-semibold text-primary underline"
                >
                  Clear all filters
                </button>
              }
            />
          </div>
        ) : (
          <motion.div
            key={sel.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 md:p-8 space-y-6"
          >
            {/* Header Card */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="eyebrow text-muted-foreground">ADR Report Reference</span>
                  <Pill t={statusTone(sel.status)}>{sel.status}</Pill>
                </div>
                <h2 className="text-2xl font-bold font-mono text-foreground mt-1 tracking-tight">
                  {sel.id}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>Logged: {sel.submittedAt}</span>
                  <span>·</span>
                  <span>Patient Token: {sel.patientRef}</span>
                  {sel.batch && (
                    <>
                      <span>·</span>
                      <span>Batch: {sel.batch}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Related Navigation Cross-Links */}
              <div className="flex flex-wrap items-center gap-2">

                {linkedBatch && (
                  <Link
                    to="/quality"
                    search={{ batch: linkedBatch.id }}
                    className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/50 transition-colors shadow-2xs"
                  >
                    <ShieldCheck className="h-3 w-3 text-primary" />
                    Inspect Batch CoA
                  </Link>
                )}

                {linkedPrivateFormulation && (
                  <Link
                    to="/research"
                    search={{ id: linkedPrivateFormulation.id }}
                    className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/50 transition-colors shadow-2xs"
                  >
                    <FlaskConical className="h-3 w-3 text-primary" />
                    My Research Formulation
                  </Link>
                )}
              </div>
            </div>

            {/* Workflow Stepper (Only for submitted reports) */}
            {sel.status !== "Draft" && (
              <div className="panel p-4 space-y-2">
                <div className="eyebrow flex items-center justify-between text-muted-foreground mb-3">
                  <span>Pharmacovigilance Review Stages</span>
                  <span className="text-[11px] font-sans">
                    Current: <strong>{sel.status}</strong>
                  </span>
                </div>
                <div className="overflow-x-auto pb-1">
                  <ol className="flex min-w-[620px] items-center">
                    {ADR_STATUSES.map((s, i) => (
                      <li key={s} className="flex flex-1 flex-col items-center text-center">
                        <div className="flex w-full items-center">
                          <div
                            className={cn(
                              "h-0.5 flex-1",
                              i === 0 ? "invisible" : i <= statusIdx ? "bg-primary" : "bg-border",
                            )}
                          />
                          <span
                            className={cn(
                              "h-3.5 w-3.5 rounded-full border-2 transition-all",
                              i < statusIdx
                                ? "border-primary bg-primary"
                                : i === statusIdx
                                  ? "border-primary bg-card ring-4 ring-primary/20 scale-110"
                                  : "bg-card border-border",
                            )}
                          />
                          <div
                            className={cn(
                              "h-0.5 flex-1",
                              i === ADR_STATUSES.length - 1
                                ? "invisible"
                                : i < statusIdx
                                  ? "bg-primary"
                                  : "bg-border",
                            )}
                          />
                        </div>
                        <span
                          className={cn(
                            "mt-2 text-[11px] max-w-[85px] leading-tight",
                            i === statusIdx ? "font-bold text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {s}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {/* Draft Resumption / Deletion Notice */}
            {sel.status === "Draft" && (
              <div className="rounded-xl border border-dashed border-primary/40 bg-primary-soft/30 p-5 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-accent-foreground text-sm">
                  <FileEdit className="h-4 w-4 text-primary" />
                  <span>Draft Report in Local Workspace</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  This report has been saved as an in-progress draft on this device. It has not been
                  submitted to the review queue. You can resume editing all fields or remove the
                  draft.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    to="/adr"
                    search={{ id: sel.id }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-orange-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft hover:bg-primary-deep"
                  >
                    Resume Draft in Form <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  {deleteConfirmId === sel.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-destructive font-semibold">Delete permanently?</span>
                      <button
                        type="button"
                        onClick={() => deleteDraft(sel.id)}
                        className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes, delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="rounded-lg border bg-card px-2.5 py-1.5 text-xs text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(sel.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Discard Draft
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Clinical Report Information Grid */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="panel p-4 space-y-1">
                <div className="eyebrow text-muted-foreground">Workflow Assessment</div>
                <div className="text-sm font-semibold text-foreground">{sel.status}</div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Assigned by internal clinical review desk.
                </p>
              </div>

              <div className="panel p-4 space-y-1">
                <div className="eyebrow text-muted-foreground">WHO-UMC Causality</div>
                <div className="text-sm font-semibold text-foreground">{sel.causality}</div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Evaluated post de-challenge observation.
                </p>
              </div>

              <div className="panel p-4 space-y-1">
                <div className="eyebrow text-muted-foreground">Regulatory Reporting</div>
                <div className="text-sm font-semibold text-foreground">{sel.regulatory}</div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  PvPI / State AYUSH triage protocol.
                </p>
              </div>
            </div>

            {/* Clinical Evidence & Details Card */}
            <div className="panel p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Reported Clinical Observations
              </h3>

              <dl className="grid gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <dt className="eyebrow text-muted-foreground">Suspected Medicine</dt>
                  <dd className="font-semibold text-foreground text-sm mt-0.5">{sel.medicine}</dd>
                </div>

                <div>
                  <dt className="eyebrow text-muted-foreground">Manufacturing Batch</dt>
                  <dd className="font-mono text-foreground mt-0.5">
                    {sel.batch || "None recorded"}
                  </dd>
                </div>

                <div>
                  <dt className="eyebrow text-muted-foreground">Dose & Route</dt>
                  <dd className="text-foreground mt-0.5">
                    {sel.dose || "—"} ({sel.route})
                  </dd>
                </div>

                <div>
                  <dt className="eyebrow text-muted-foreground">Treatment Start & Onset</dt>
                  <dd className="text-foreground mt-0.5">
                    Started {sel.startDate || "—"} · Onset in {sel.onset || "—"}
                  </dd>
                </div>

                <div className="sm:col-span-2 border-t pt-3">
                  <dt className="eyebrow text-muted-foreground">Suspected Adverse Reaction</dt>
                  <dd className="text-foreground font-medium text-sm mt-1 leading-relaxed">
                    {sel.reaction || "No description provided."}
                  </dd>
                </div>

                <div>
                  <dt className="eyebrow text-muted-foreground">Severity Level</dt>
                  <dd className="mt-1">
                    <Pill t={sel.seriousness === "Serious" ? "danger" : "muted"}>
                      {sel.seriousness || "Unspecified"}
                    </Pill>
                  </dd>
                </div>

                <div>
                  <dt className="eyebrow text-muted-foreground">Reported Clinical Outcome</dt>
                  <dd className="font-medium text-foreground mt-1">{sel.outcome || "Pending"}</dd>
                </div>

                {sel.concomitant && (
                  <div className="sm:col-span-2 border-t pt-2">
                    <dt className="eyebrow text-muted-foreground">Concomitant Therapies</dt>
                    <dd className="text-muted-foreground mt-0.5">{sel.concomitant}</dd>
                  </div>
                )}

                {sel.action && (
                  <div className="sm:col-span-2 border-t pt-2">
                    <dt className="eyebrow text-muted-foreground">De-challenge / Action Taken</dt>
                    <dd className="text-muted-foreground mt-0.5">{sel.action}</dd>
                  </div>
                )}

                {sel.attachments?.length > 0 && (
                  <div className="sm:col-span-2 border-t pt-2">
                    <dt className="eyebrow text-muted-foreground">Attached Documents</dt>
                    <dd className="mt-1 flex flex-wrap gap-1.5">
                      {sel.attachments.map((a) => (
                        <Pill key={a} t="outline">
                          {a}
                        </Pill>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Audit Timeline */}
            <div className="panel p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                Audit Trail & Status History
              </h3>
              <ol className="space-y-2 text-xs">
                {sel.timeline.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <span className="font-mono text-muted-foreground w-24 shrink-0">{item.at}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span className="font-medium text-foreground">{item.text}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Follow-up Communication Section (Only for submitted reports) */}
            {sel.status !== "Draft" && (
              <div className="panel p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      Follow-up Communications & Clinical Queries
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Direct queries between treating physician and medical review team (simulated locally in prototype).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                      Simulation Mode
                    </span>
                    {sel.status === "More Details Needed" && <Pill t="warn">Response Required</Pill>}
                  </div>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {sel.messages.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-3 text-center">
                      No follow-up inquiries have been requested for this report.
                    </p>
                  ) : (
                    sel.messages.map((m, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "max-w-[85%] rounded-xl p-3.5 text-xs space-y-1 shadow-2xs",
                          m.from === "You"
                            ? "ml-auto bg-ink text-ink-foreground"
                            : "border bg-surface text-foreground",
                        )}
                      >
                        <div className="flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-wider opacity-70">
                          <span>{m.from}</span>
                          <span>{m.at}</span>
                        </div>
                        <p className="leading-relaxed">{m.text}</p>
                      </motion.div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <input
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    placeholder="Provide additional clinical notes, patient follow-up or de-challenge findings…"
                    className={inputCls}
                    onKeyDown={(e) => e.key === "Enter" && reply()}
                    aria-label="Follow-up message"
                  />
                  <Btn type="button" variant="ink" onClick={reply} disabled={!msg.trim()}>
                    <Send className="h-4 w-4" />
                  </Btn>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
