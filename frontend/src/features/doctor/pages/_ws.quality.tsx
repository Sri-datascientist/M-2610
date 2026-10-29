import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ScanSearch,
  FileText,
  AlertCircle,
  FileCheck2,
  Calendar,
  Building2,
  AlertTriangle,
  ArrowLeft,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Empty, EvidencePill, PageHeader, Pill } from "@/components/ui-kit";
import {
  batches,
  medById,
  mfrById,
  type Batch,
} from "@/lib/mock-data";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

type QualitySearch = {
  batch?: string | undefined;
  q?: string | undefined;
  status?: string | undefined;
};

export const Route = createFileRoute("/_ws/quality")({
  validateSearch: (s: Record<string, unknown>): QualitySearch => ({
    batch: typeof s["batch"] === "string" ? s["batch"] : undefined,
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    status: typeof s["status"] === "string" ? s["status"] : undefined,
  }),
  head: () =>
    seo(
      "Medicine Quality & Batch Registry",
      "Investigate batch analytical evidence, inspect Certificates of Analysis (CoA), verify testing parameters and track pharmacovigilance flags.",
    ),
  component: Quality,
});

const isPastDate = (d: string) => new Date(d).getTime() < new Date().getTime();

const REVIEW_STATUSES = [
  "All",
  "Reviewed",
  "Review pending",
  "Evidence unavailable",
] as const;

export function filterBatches(list: Batch[], query: string, statusFilter?: string) {
  const term = query.trim().toLowerCase();
  return list.filter((b) => {
    if (statusFilter && statusFilter !== "All" && b.review !== statusFilter) {
      return false;
    }
    if (!term) return true;

    const med = medById(b.medicineId);
    const mfr = mfrById(b.manufacturerId);

    const hay = [
      b.id,
      b.medicineId,
      med?.name ?? "",
      mfr?.name ?? "",
      b.mfg,
      b.exp,
      b.review,
      ...b.flags,
      ...b.tests,
    ]
      .join(" ")
      .toLowerCase();

    return hay.includes(term);
  });
}

export function Quality() {
  const { batch, q: searchQ, status: searchStatus } = (Route.useSearch() ?? {}) as QualitySearch;
  const navigate = useNavigate({ from: "/quality" });

  const [inputVal, setInputVal] = useState<string>(batch ?? searchQ ?? "");
  const [coaModalOpen, setCoaModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>(searchStatus ?? "All");

  useEffect(() => {
    setInputVal(batch ?? searchQ ?? "");
    setStatusFilter(searchStatus ?? "All");
  }, [batch, searchQ, searchStatus]);

  useEffect(() => {
    if (!coaModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCoaModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [coaModalOpen]);

  const updateSearch = (patch: Partial<QualitySearch>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...patch,
      }),
    });
  };

  const selectedBatch = batch
    ? batches.find((x) => x.id.toLowerCase() === batch.toLowerCase())
    : undefined;

  const filteredBatches = filterBatches(batches, searchQ ?? "", statusFilter);

  const showAllBatches = () => {
    setInputVal("");
    updateSearch({ batch: undefined, q: undefined });
  };

  const med = selectedBatch ? medById(selectedBatch.medicineId) : undefined;
  const mfr = selectedBatch ? mfrById(selectedBatch.manufacturerId) : undefined;
  const isBatchExpired = selectedBatch ? isPastDate(selectedBatch.exp) : false;

  return (
    <div>
      <PageHeader
        eyebrow="Safety & Quality Intelligence"
        title="Medicine Quality"
        desc="Search and inspect batch manufacturing evidence, laboratory certificates of analysis (CoA), and pharmacovigilance flags across commercial Ayurvedic medicines."
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* Lookup and Search Bar */}
        <div className="max-w-2xl space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const term = inputVal.trim();
              if (!term) {
                updateSearch({ batch: undefined, q: undefined });
              } else {
                // If it looks like a specific batch ID in the catalogue, go directly to batch view; otherwise search
                const exactMatch = batches.find(
                  (b) => b.id.toLowerCase() === term.toLowerCase(),
                );
                if (exactMatch) {
                  updateSearch({ batch: exactMatch.id, q: undefined });
                } else {
                  updateSearch({ q: term, batch: undefined });
                }
              }
            }}
            className="flex items-center gap-2 rounded-xl border bg-card p-1.5 pl-3.5 shadow-soft focus-within:border-primary transition"
          >
            <ScanSearch className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Enter batch identifier (e.g. SA-TC-2409) or medicine name…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              aria-label="Batch identifier or medicine query"
            />
            {inputVal && (
              <button
                type="button"
                onClick={() => {
                  setInputVal("");
                  updateSearch({ batch: undefined, q: undefined });
                }}
                className="text-xs text-muted-foreground hover:text-foreground mr-1"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-ink-foreground hover:bg-ink/90 transition-colors"
            >
              Look up
            </button>
          </form>

          {/* Quick-try chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Quick samples:</span>
            {batches.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => {
                  setInputVal(x.id);
                  updateSearch({ batch: x.id, q: undefined });
                }}
                className={cn(
                  "font-mono font-semibold transition-colors px-2 py-0.5 rounded border",
                  batch?.toLowerCase() === x.id.toLowerCase()
                    ? "border-primary bg-primary-soft text-accent-foreground"
                    : "bg-card text-foreground hover:border-primary/50",
                )}
              >
                {x.id}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section: Registry View vs Detail View */}
        {!batch ? (
          /* ALL BATCHES REGISTRY VIEW */
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Batch Registry & Quality Records</h2>
                <p className="text-xs text-muted-foreground">
                  Showing {filteredBatches.length} of {batches.length} registered manufacturing batches
                </p>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="eyebrow text-muted-foreground mr-1">Review status:</span>
                {REVIEW_STATUSES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setStatusFilter(st);
                      updateSearch({ status: st === "All" ? undefined : st });
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1 font-semibold transition-colors",
                      statusFilter === st
                        ? "border-ink bg-ink text-ink-foreground"
                        : "bg-card text-foreground hover:border-primary/50",
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredBatches.length === 0 ? (
              <Empty
                title="No batches found"
                desc={`No batch matches your search criteria or review filter.`}
                action={
                  <button
                    type="button"
                    onClick={showAllBatches}
                    className="text-sm font-semibold text-primary underline"
                  >
                    Reset batch filter
                  </button>
                }
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
                <table className="w-full min-w-[700px] text-sm border-collapse">
                  <thead className="bg-surface text-left border-b">
                    <tr>
                      <th className="p-3.5"><span className="eyebrow">Batch Identifier</span></th>
                      <th className="p-3.5"><span className="eyebrow">Medicine Name</span></th>
                      <th className="p-3.5"><span className="eyebrow">Manufacturer</span></th>
                      <th className="p-3.5"><span className="eyebrow">Manufactured / Expiry</span></th>
                      <th className="p-3.5"><span className="eyebrow">CoA Report</span></th>
                      <th className="p-3.5"><span className="eyebrow">Safety Flags</span></th>
                      <th className="p-3.5 text-right"><span className="eyebrow">Review Status</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatches.map((x) => {
                      const m = medById(x.medicineId);
                      const mf = mfrById(x.manufacturerId);
                      const isExp = isPastDate(x.exp);
                      return (
                        <tr
                          key={x.id}
                          onClick={() => {
                            setInputVal(x.id);
                            updateSearch({ batch: x.id, q: undefined });
                          }}
                          className="cursor-pointer border-t hover:bg-primary-soft/30 transition-colors"
                        >
                          <td className="p-3.5 font-mono font-bold text-foreground">
                            {x.id}
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold text-foreground">{m?.name ?? x.medicineId}</span>
                            {m && <span className="block text-xs text-muted-foreground">{m.form}</span>}
                          </td>
                          <td className="p-3.5 text-xs text-muted-foreground">
                            {mf?.name ?? x.manufacturerId}
                          </td>
                          <td className="p-3.5 text-xs">
                            <span className="text-foreground">{x.mfg}</span>
                            <span className="text-muted-foreground"> → </span>
                            <span className={cn(isExp ? "text-destructive font-semibold" : "text-foreground")}>
                              {x.exp}
                            </span>
                          </td>
                          <td className="p-3.5 text-xs">
                            {x.coa ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-primary">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Available
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">Unavailable</span>
                            )}
                          </td>
                          <td className="p-3.5 text-xs">
                            {x.flags.length > 0 ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-destructive">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                {x.flags[0]}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">Clear</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <EvidencePill s={x.review} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : !selectedBatch ? (
          /* BATCH NOT FOUND */
          <div className="pt-4">
            <Empty
              title="Batch record not found"
              desc={`No public quality record matches identifier “${batch}”. Check the batch number printed on the pharmaceutical packaging or return to the full registry.`}
              action={
                <button
                  type="button"
                  onClick={showAllBatches}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-ink-foreground hover:bg-ink/90 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Return to all batches
                </button>
              }
            />
          </div>
        ) : (
          /* SELECTED BATCH DETAIL INVESTIGATION VIEW */
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pt-2"
          >
            {/* Back action */}
            <div className="flex items-center justify-between border-b pb-3">
              <button
                type="button"
                onClick={showAllBatches}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Return to Batch Registry
              </button>
              <div className="flex items-center gap-2">
                <EvidencePill s={selectedBatch.review} />
                {isBatchExpired ? (
                  <Pill t="danger">Expiry Date Passed</Pill>
                ) : (
                  <Pill t="ink">Shelf-Life Active</Pill>
                )}
              </div>
            </div>

            {/* Batch Identity Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="eyebrow text-muted-foreground">Batch Identifier</div>
                <h2 className="text-3xl font-bold font-mono text-foreground tracking-tight">
                  {selectedBatch.id}
                </h2>
                {med && (
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span className="font-bold text-foreground">
                      {med.name}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{med.form}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{med.category}</span>
                  </div>
                )}
              </div>

              {/* Action: Report Side Effect for this Batch */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/adr"
                  search={{
                    medicine: med?.name ?? selectedBatch.medicineId,
                    batch: selectedBatch.id,
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-card px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive-soft transition-colors"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Report a Side Effect for this Batch
                </Link>
              </div>
            </div>

            {/* Safety & Pharmacovigilance Flags (if present) */}
            {selectedBatch.flags.length > 0 && (
              <div className="rounded-xl border border-destructive/40 bg-destructive-soft p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Safety & Vigilance Alert On File
                </div>
                {selectedBatch.flags.map((f) => (
                  <p key={f} className="text-foreground/90 font-medium">
                    Flag: {f}
                  </p>
                ))}
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Notice: A pharmacovigilance notice does not constitute an official recall or regulatory prohibition. It alerts clinicians to report any adverse events observed in patients taking this specific batch.
                </p>
              </div>
            )}

            {/* Core Details Grid */}
            <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
              {/* Left Panel: Manufacturing and Timeline Metadata */}
              <div className="panel p-6 space-y-4">
                <div className="eyebrow flex items-center gap-1.5 text-primary">
                  <Calendar className="h-3.5 w-3.5" /> Batch Timeline & Traceability
                </div>

                <dl className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <dt className="eyebrow text-muted-foreground">Manufacturer</dt>
                    <dd className="mt-1 font-semibold text-foreground">
                      {mfr ? (
                        <Link
                          to="/manufacturers"
                          search={{ id: mfr.id }}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {mfr.name} <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        "Pending"
                      )}
                    </dd>
                    {mfr && <span className="text-[11px] text-muted-foreground">{mfr.city}</span>}
                  </div>

                  <div>
                    <dt className="eyebrow text-muted-foreground">Pack Format</dt>
                    <dd className="mt-1 font-semibold text-foreground">
                      {selectedBatch.packSize ?? "Standard commercial container"}
                    </dd>
                  </div>

                  <div className="border-t pt-3">
                    <dt className="eyebrow text-muted-foreground">Manufacturing Date</dt>
                    <dd className="mt-1 font-semibold text-foreground">{selectedBatch.mfg}</dd>
                  </div>

                  <div className="border-t pt-3">
                    <dt className="eyebrow text-muted-foreground">Expiry Date</dt>
                    <dd className={cn("mt-1 font-semibold", isBatchExpired ? "text-destructive" : "text-foreground")}>
                      {selectedBatch.exp}
                    </dd>
                  </div>
                </dl>

                <div className="border-t pt-3">
                  <div className="eyebrow mb-1 text-muted-foreground">Documentation Status</div>
                  <div className="text-xs font-semibold text-foreground">
                    {selectedBatch.sampleStatus ?? "Routine batch record on file"}
                  </div>
                </div>
              </div>

              {/* Right Panel: Quality Evidence & Tests */}
              <div className="panel p-6 space-y-4">
                <div className="eyebrow flex items-center justify-between text-primary">
                  <span className="flex items-center gap-1.5">
                    <FileCheck2 className="h-3.5 w-3.5" /> Certificate of Analysis
                  </span>
                  <EvidencePill s={selectedBatch.review} />
                </div>

                {selectedBatch.coa ? (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-surface p-3.5 text-xs space-y-1.5 border">
                      <div className="flex items-center justify-between font-semibold text-foreground">
                        <span className="flex items-center gap-1.5 text-primary">
                          <CheckCircle2 className="h-4 w-4" /> Analytical CoA Document On File
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">Verified format</span>
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        Laboratory assay for heavy metals, microbial limits and extractive standards verified against Pharmacopoeial requirements.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCoaModalOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-ink-foreground hover:bg-ink/90 transition-colors shadow-xs"
                    >
                      <FileText className="h-4 w-4 text-primary" />
                      Inspect Certificate of Analysis (CoA)
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground space-y-2">
                    <p className="font-semibold text-foreground">
                      Analytical CoA not yet provided by manufacturer
                    </p>
                    <p className="leading-relaxed">
                      This batch record exists in the manufacturing catalogue, but an independent analytical certificate has not been uploaded to the public registry.
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Note: Absence of a public document does not confirm defectiveness; clinicians should verify compliance for sensitive protocols.
                    </p>
                  </div>
                )}

                {/* Test parameters list */}
                <div className="border-t pt-3">
                  <div className="eyebrow mb-2">Logged Tests in Registry</div>
                  {selectedBatch.tests.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No individual test parameters indexed.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {selectedBatch.tests.map((t) => (
                        <li key={t} className="flex items-center gap-2 rounded-lg border bg-surface/40 p-2.5 text-xs text-foreground/90">
                          <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Evidentiary Notice */}
            <div className="rounded-xl border bg-surface/60 p-4 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Clinical Vigilance Notice</p>
              <p className="leading-relaxed">
                A Certificate of Analysis on file reflects testing of representative samples according to Schedule T and AYUSH Pharmacopoeial guidelines. It does not replace clinical pharmacovigilance or post-marketing vigilance by treating doctors.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Certificate of Analysis (CoA) Inspection Modal */}
      <AnimatePresence>
        {coaModalOpen && selectedBatch?.coaDetails && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Certificate of Analysis"
            onClick={() => setCoaModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl overflow-hidden rounded-2xl border bg-card shadow-2xl flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b px-6 py-4 bg-surface">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-primary" />
                    Certificate of Analysis (CoA) — Batch {selectedBatch.id}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {med?.name} · Issued by {selectedBatch.coaDetails.labName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCoaModalOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Close Certificate of Analysis"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto p-6 space-y-4">
                <div className="rounded-xl border border-dashed border-primary/40 bg-primary-soft/30 p-3 text-xs text-accent-foreground text-center">
                  <strong>PROTOTYPE ANALYTICAL EVIDENCE INSPECTION:</strong> Structured representative sample test results for clinical evaluation.
                </div>

                {/* CoA Header Metadata Table */}
                <div className="rounded-xl border bg-surface/60 p-4 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Product:</span>
                    <span className="font-bold text-foreground">{med?.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Batch Number:</span>
                    <span className="font-mono font-bold text-foreground">{selectedBatch.id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Date of Testing:</span>
                    <span className="font-semibold text-foreground">{selectedBatch.coaDetails.testingDate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">QC Analyst:</span>
                    <span className="font-semibold text-foreground">{selectedBatch.coaDetails.analyst}</span>
                  </div>
                </div>

                {/* Analytical Test Parameters Table */}
                <div className="overflow-x-auto rounded-xl border bg-card">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-surface text-left border-b">
                      <tr>
                        <th className="p-3"><span className="eyebrow">Parameter Tested</span></th>
                        <th className="p-3"><span className="eyebrow">Pharmacopoeial Specification</span></th>
                        <th className="p-3"><span className="eyebrow">Analytical Result</span></th>
                        <th className="p-3 text-right"><span className="eyebrow">Compliance</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedBatch.coaDetails.parameters.map((p, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-card" : "bg-surface/20"}>
                          <td className="p-3 font-medium text-foreground">{p.parameter}</td>
                          <td className="p-3 text-muted-foreground">{p.specification}</td>
                          <td className="p-3 font-semibold text-foreground">{p.result}</td>
                          <td className="p-3 text-right">
                            <span className="inline-flex items-center gap-1 font-semibold text-primary">
                              <CheckCircle2 className="h-3 w-3" /> {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Testing conducted strictly under official methods specified in the Ayurvedic Pharmacopoeia of India (API) Part II. Results correspond to the submitted representative batch sample.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="border-t px-6 py-3 bg-surface flex justify-end">
                <button
                  type="button"
                  onClick={() => setCoaModalOpen(false)}
                  className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-ink-foreground hover:bg-ink/90 transition-colors"
                >
                  Close Certificate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
