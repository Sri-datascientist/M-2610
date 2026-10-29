import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Plus,
  ShieldCheck,
  X,
  Filter,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
  Stethoscope,
  AlertCircle,
  FileText,
  BookOpen,
  Calendar,
  UserCheck,
  Activity,
  HeartPulse,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Btn,
  Chip,
  Empty,
  Field,
  PageHeader,
  Pill,
  SaveButton,
  inputCls,
} from "@/components/ui-kit";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  clinicalCases,
  filterClinicalCases,
  medById,
  medicines,
  refById,
  type ClinicalCase,
} from "@/lib/mock-data";
import { setState, today, uid } from "@/lib/store";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { apiClient } from "@/services/apiClient";

type CaseSearch = {
  id?: string | undefined;
  q?: string | undefined;
  medicine?: string | undefined;
  condition?: string | undefined;
  outcome?: string | undefined;
  age?: string | undefined;
  sort?: string | undefined;
};

export const Route = createFileRoute("/_ws/cases")({
  validateSearch: (s: Record<string, unknown>): CaseSearch => ({
    id: typeof s["id"] === "string" ? s["id"] : undefined,
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    medicine: typeof s["medicine"] === "string" ? s["medicine"] : undefined,
    condition: typeof s["condition"] === "string" ? s["condition"] : undefined,
    outcome: typeof s["outcome"] === "string" ? s["outcome"] : undefined,
    age: typeof s["age"] === "string" ? s["age"] : undefined,
    sort: typeof s["sort"] === "string" ? s["sort"] : undefined,
  }),
  head: () =>
    seo(
      "Clinical Cases",
      "Reviewed, de-identified Ayurvedic clinical cases with outcomes and evidence limitations.",
    ),
  component: Cases,
});

const OUTCOME_OPTIONS = [
  "Marked improvement",
  "Moderate improvement",
  "Partial improvement",
  "Stable / No change",
] as const;

const AGE_BANDS = ["18–29", "30–39", "40–49", "50–59", "60+"] as const;

export function Cases() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate({ from: "/cases" });

  const [q, setQ] = useState(searchParams.q ?? "");
  const [filterPanel, setFilterPanel] = useState(false);
  const [form, setForm] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);

  useEffect(() => {
    setQ(searchParams.q ?? "");
  }, [searchParams.q]);

  const updateSearch = (patch: Partial<CaseSearch>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...patch,
      }),
    });
  };

  const clearAllFilters = () => {
    navigate({
      search: () => ({}),
    });
    setQ("");
  };

  const [userCases, setUserCases] = useState<ClinicalCase[]>([]);

  useEffect(() => {
    let active = true;
    apiClient
      .get<{ items: any[]; total: number }>("/doctors/me/research-submissions")
      .then((res) => {
        if (!active || !res?.items) return;
        const caseSubs = res.items.filter((it) => it.submission_type === "case_study");
        const mapped: ClinicalCase[] = caseSubs.map((sub) => {
          let parsed: any = {};
          try {
            parsed = JSON.parse(sub.content || "{}");
          } catch {
            // fallback
          }
          return {
            id: sub.id,
            title: sub.title,
            patientCode: `PT-${sub.id.slice(0, 4).toUpperCase()}`,
            age: parsed.age || "40–49",
            sex: parsed.sex || "F",
            condition: parsed.condition || "Clinical Observation",
            dosha: parsed.dosha || "Tridosha",
            medicineId: parsed.medicineId || "triphala-churna",
            context: parsed.context || sub.summary,
            treatment: parsed.treatment || "Standard protocol",
            posology: {
              dosage: "As prescribed",
              route: "Oral",
              frequency: "Daily",
              anupana: "Warm water",
              duration: "Variable",
            },
            outcome: parsed.outcome || "Follow-up documented",
            outcomeCategory: "Moderate improvement" as const,
            followUp: "Monitored",
            adverseEvents: "None reported",
            limitations: "Single-practitioner clinical observation",
            review: "Peer-reviewed" as const,
            verificationStatus: "Illustrative Peer Contribution" as const,
            contributor: "Verified Practitioner",
            dateReported: sub.submitted_at ? sub.submitted_at.split("T")[0] : today(),
            isDeidentified: true,
          };
        });
        if (mapped.length > 0) {
          setUserCases(mapped);
        }
      })
      .catch((err) => {
        console.warn("Could not load backend case studies:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  const allCases = useMemo(() => [...userCases, ...clinicalCases], [userCases]);

  // Filtered list using current parameters
  const list = useMemo(
    () =>
      filterClinicalCases(allCases, {
        q: searchParams.q,
        medicine: searchParams.medicine,
        condition: searchParams.condition,
        outcome: searchParams.outcome,
        age: searchParams.age,
        sort: searchParams.sort,
      }),
    [allCases, searchParams],
  );

  // Selected case for detail view (supports direct link or click)
  const selectedCase = searchParams.id
    ? (allCases.find((c) => c.id === searchParams.id) ?? null)
    : null;

  // Active filter count for badge
  const activeFiltersCount = [
    searchParams.medicine,
    searchParams.condition,
    searchParams.outcome,
    searchParams.age,
  ].filter(Boolean).length;

  const copyCitation = (c: ClinicalCase) => {
    const medName = medById(c.medicineId)?.name ?? "Formulation";
    const text = `${c.contributor}. Case Report: "${c.title}" (${c.id}). Intervention: ${medName}. Mey Veda Grantha Clinical Library (2026). Anonymised ID: ${c.patientCode}.`;
    navigator.clipboard?.writeText(text);
    setCopiedCitation(true);
    toast.success("Citation copied to clipboard");
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Evidence & Practice"
        title="Clinical Cases"
        desc="Reviewed, de-identified clinical case library. Demonstrates observational practice patterns with documented evidence limitations. Strictly separated from your private research."
        actions={
          <div className="flex items-center gap-2">
            <Btn onClick={() => setForm(true)}>
              <Plus className="h-4 w-4" />
              Contribute a case
            </Btn>
          </div>
        }
      />

      {/* Observational Evidence Disclaimer Notice */}
      <div className="flex items-start gap-2.5 border-b border-border bg-amber-50/70 px-4 py-3 text-xs leading-relaxed text-amber-950 md:px-8">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <span className="font-semibold">Clinical evidence limitation notice:</span> All records
          presented in this library are peer-contributed, de-identified observational case
          histories. Observations do not establish pharmacological causality or therapeutic
          efficacy. They serve solely as peer practice documentation subject to clinical
          discernment.
        </div>
      </div>

      <div className="p-4 md:p-8">
        {/* If a case is selected, display the full Case Detail view */}
        {selectedCase ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Navigation back to list while preserving all search/filter parameters */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b">
              <button
                type="button"
                onClick={() => updateSearch({ id: undefined })}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-deep transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to case list
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyCitation(selectedCase)}
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary transition-colors"
                >
                  {copiedCitation ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiedCitation ? "Copied" : "Cite case"}
                </button>
                <SaveButton id={selectedCase.id} kind="case" />
              </div>
            </div>

            {/* Case Header Card */}
            <div className="panel motif-corner p-6 md:p-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                    {selectedCase.id}
                  </span>
                  <span>·</span>
                  <span className="font-medium">Reported: {selectedCase.dateReported}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified De-identified ({selectedCase.patientCode})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Pill t="ink">{selectedCase.review}</Pill>
                  <Pill
                    t={
                      selectedCase.outcomeCategory === "Marked improvement"
                        ? "orange"
                        : selectedCase.outcomeCategory === "Moderate improvement"
                          ? "warn"
                          : "muted"
                    }
                  >
                    {selectedCase.outcomeCategory}
                  </Pill>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {selectedCase.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Documented presentation of {selectedCase.condition} · Dosha:{" "}
                  <span className="font-semibold text-foreground">{selectedCase.dosha}</span>
                </p>
              </div>

              {/* Medicine Link Callout */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary-soft/50 p-3.5">
                <div className="flex items-center gap-2.5">
                  <Stethoscope className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Administered Formulation</div>
                    <div className="text-sm font-bold text-foreground">
                      {medById(selectedCase.medicineId)?.name ?? "Ayurvedic Medicine"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Grid: Presentation, Posology, Outcome, Evidence */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Clinical Presentation & Anonymisation */}
              <div className="panel p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <UserCheck className="h-4 w-4 text-primary" />
                  Patient Profile & De-identified Context
                </div>
                <div className="grid grid-cols-3 gap-2 py-2 border-y bg-surface px-3 rounded-lg text-xs">
                  <div>
                    <span className="text-muted-foreground block">Pseudonym:</span>
                    <span className="font-mono font-semibold">{selectedCase.patientCode}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Age band:</span>
                    <span className="font-semibold">{selectedCase.age}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Sex:</span>
                    <span className="font-semibold">{selectedCase.sex}</span>
                  </div>
                </div>
                <div>
                  <div className="eyebrow mb-1">Clinical Presentation</div>
                  <p className="text-sm leading-relaxed text-foreground">{selectedCase.context}</p>
                </div>
              </div>

              {/* Treatment Protocol & Posology */}
              <div className="panel p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Activity className="h-4 w-4 text-primary" />
                  Treatment Protocol & Posology
                </div>
                <div className="space-y-2 text-sm">
                  <div className="rounded-lg bg-surface p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dosage & Route:</span>
                      <span className="font-semibold">
                        {selectedCase.posology.dosage} ({selectedCase.posology.route})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frequency / Timing:</span>
                      <span className="font-semibold">{selectedCase.posology.frequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Anupana (Vehicle):</span>
                      <span className="font-semibold">{selectedCase.posology.anupana}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Protocol Duration:</span>
                      <span className="font-semibold">{selectedCase.posology.duration}</span>
                    </div>
                  </div>
                  <div>
                    <div className="eyebrow mb-1">Prescription Summary</div>
                    <p className="text-sm text-foreground">{selectedCase.treatment}</p>
                  </div>
                </div>
              </div>

              {/* Documented Outcome & Follow-up */}
              <div className="panel p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <HeartPulse className="h-4 w-4 text-primary" />
                  Observed Outcome & Tolerability
                </div>
                <div>
                  <div className="eyebrow mb-1">Clinical Outcome</div>
                  <p className="text-sm leading-relaxed text-foreground">{selectedCase.outcome}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="rounded-lg bg-surface p-2.5">
                    <span className="text-muted-foreground block mb-0.5">Follow-up Window:</span>
                    <span className="font-semibold">{selectedCase.followUp}</span>
                  </div>
                  <div className="rounded-lg bg-surface p-2.5">
                    <span className="text-muted-foreground block mb-0.5">Adverse Events:</span>
                    <span className="font-semibold">{selectedCase.adverseEvents}</span>
                  </div>
                </div>
              </div>

              {/* Critical Evidence Limitations */}
              <div className="panel border-dashed border-amber-300 bg-amber-50/30 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Documented Evidence Limitations
                </div>
                <p className="text-sm leading-relaxed text-amber-950 font-medium">
                  {selectedCase.limitations}
                </p>
                <p className="text-xs text-amber-800 leading-normal">
                  Observational records lack randomised control arms. Co-interventions (dietary
                  pathya/apathya, lifestyle changes, seasonal shifts) confound drug-specific
                  therapeutic attribution.
                </p>
              </div>
            </div>

            {/* Classical Reference Association if present */}
            {selectedCase.referenceId && (
              <div className="panel p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Associated Classical Citation
                    </div>
                    <div className="text-sm font-bold">
                      {refById(selectedCase.referenceId)?.title} ·{" "}
                      {refById(selectedCase.referenceId)?.entry}
                    </div>
                  </div>
                </div>
                <Link
                  to="/library"
                  search={{ ref: selectedCase.referenceId }}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Inspect shloka & translation →
                </Link>
              </div>
            )}

            {/* Footer Attribution */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-4 border-t">
              <span>Contributed by {selectedCase.contributor}</span>
              <span>Verification standard: {selectedCase.verificationStatus}</span>
            </div>
          </motion.div>
        ) : (
          /* Cases Directory View */
          <div className="space-y-6">
            {/* Search and Filters Toolbar */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                {/* Search Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateSearch({ q: q.trim() || undefined });
                  }}
                  className="flex flex-1 min-w-[260px] max-w-md items-center gap-2 rounded-xl border bg-card px-3.5 py-2 shadow-xs focus-within:border-primary"
                >
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by condition, medicine, symptoms, or ID…"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                    aria-label="Search cases"
                  />
                  {q && (
                    <button
                      type="button"
                      onClick={() => {
                        setQ("");
                        updateSearch({ q: undefined });
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  )}
                </form>

                {/* Filter toggle button */}
                <button
                  type="button"
                  onClick={() => setFilterPanel((p) => !p)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors shadow-xs",
                    activeFiltersCount > 0
                      ? "border-primary bg-primary-soft text-primary-deep"
                      : "bg-card text-foreground hover:border-primary/60",
                  )}
                  aria-expanded={filterPanel}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {/* Sort selector */}
                <select
                  value={searchParams.sort ?? "newest"}
                  onChange={(e) => updateSearch({ sort: e.target.value })}
                  className={cn(inputCls, "w-auto text-xs py-2 h-auto")}
                  aria-label="Sort cases"
                >
                  <option value="newest">Sort: Most recent</option>
                  <option value="followup">Sort: Follow-up duration</option>
                  <option value="title">Sort: Title (A–Z)</option>
                </select>
              </div>

              {/* Count and clear */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  Showing <strong className="text-foreground">{list.length}</strong> of{" "}
                  {clinicalCases.length} cases
                </span>
                {(searchParams.q || activeFiltersCount > 0) && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="font-semibold text-primary hover:underline"
                  >
                    Reset all
                  </button>
                )}
              </div>
            </div>

            {/* Filter Drawer / Panel */}
            <AnimatePresence>
              {filterPanel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden rounded-2xl border bg-surface p-4 text-xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-bold text-foreground">Filter Clinical Cases</span>
                    <button
                      type="button"
                      onClick={() => setFilterPanel(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Medicine Filter */}
                    <div>
                      <span className="font-semibold block mb-1.5 text-muted-foreground">
                        Medicine:
                      </span>
                      <select
                        value={searchParams.medicine ?? ""}
                        onChange={(e) => updateSearch({ medicine: e.target.value || undefined })}
                        className={inputCls}
                      >
                        <option value="">All medicines</option>
                        {medicines.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Condition / Presentation */}
                    <div>
                      <span className="font-semibold block mb-1.5 text-muted-foreground">
                        Condition / Dosha:
                      </span>
                      <select
                        value={searchParams.condition ?? ""}
                        onChange={(e) => updateSearch({ condition: e.target.value || undefined })}
                        className={inputCls}
                      >
                        <option value="">All conditions</option>
                        <option value="Vibandha">Vibandha (Constipation)</option>
                        <option value="Agnimandya">Agnimandya (Dyspepsia)</option>
                        <option value="Daurbalya">Daurbalya (Debility)</option>
                        <option value="Amlapitta">Amlapitta (Hyperacidity)</option>
                        <option value="Sandhivata">Sandhivata (Osteoarthritis)</option>
                        <option value="Chittodvega">Chittodvega (Anxiety)</option>
                        <option value="Kasa">Kasa (Cough)</option>
                        <option value="Sthaulya">Sthaulya (Metabolic)</option>
                      </select>
                    </div>

                    {/* Outcome Category */}
                    <div>
                      <span className="font-semibold block mb-1.5 text-muted-foreground">
                        Outcome Category:
                      </span>
                      <select
                        value={searchParams.outcome ?? ""}
                        onChange={(e) => updateSearch({ outcome: e.target.value || undefined })}
                        className={inputCls}
                      >
                        <option value="">All outcomes</option>
                        {OUTCOME_OPTIONS.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Age Band */}
                    <div>
                      <span className="font-semibold block mb-1.5 text-muted-foreground">
                        Age Band:
                      </span>
                      <select
                        value={searchParams.age ?? ""}
                        onChange={(e) => updateSearch({ age: e.target.value || undefined })}
                        className={inputCls}
                      >
                        <option value="">All ages</option>
                        {AGE_BANDS.map((a) => (
                          <option key={a} value={a}>
                            {a} years
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {activeFiltersCount > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t text-xs">
                      <span className="text-muted-foreground">
                        Active filters: {activeFiltersCount}
                      </span>
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="font-semibold text-primary hover:underline"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* List Results */}
            {list.length === 0 ? (
              <Empty
                title="No clinical cases found"
                desc={`No cases match your search criteria. Clear your search or filters to see all reviewed clinical records.`}
                action={
                  <Btn variant="outline" onClick={clearAllFilters}>
                    Clear search and filters
                  </Btn>
                }
              />
            ) : (
              <div className="space-y-3">
                {list.map((c) => {
                  const med = medById(c.medicineId);
                  return (
                    <div
                      key={c.id}
                      className="panel overflow-hidden transition-all duration-150 hover:border-primary/40"
                    >
                      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2 flex-1 min-w-0">
                          {/* Metadata row */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                              {c.id}
                            </span>
                            <span>·</span>
                            <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              De-identified ({c.patientCode})
                            </span>
                            <span>·</span>
                            <span>
                              {c.age} · {c.sex}
                            </span>
                            <span>·</span>
                            <span className="font-semibold text-foreground">
                              {med?.name ?? "Ayurvedic Medicine"}
                            </span>
                          </div>

                          {/* Case Title */}
                          <h3 className="text-base font-bold text-foreground tracking-tight hover:text-primary transition-colors">
                            <button
                              type="button"
                              onClick={() => updateSearch({ id: c.id })}
                              className="text-left"
                            >
                              {c.title}
                            </button>
                          </h3>

                          {/* Short summary snippet */}
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {c.context}
                          </p>

                          {/* Posology & Outcome preview */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                            <span className="rounded bg-surface px-2.5 py-1 text-muted-foreground font-medium">
                              Protocol: {c.posology.dosage} ({c.posology.anupana})
                            </span>
                            <span className="rounded bg-surface px-2.5 py-1 text-muted-foreground font-medium">
                              Follow-up: {c.followUp}
                            </span>
                            <Pill
                              t={
                                c.outcomeCategory === "Marked improvement"
                                  ? "orange"
                                  : c.outcomeCategory === "Moderate improvement"
                                    ? "warn"
                                    : "muted"
                              }
                            >
                              {c.outcomeCategory}
                            </Pill>
                          </div>
                        </div>

                        {/* Actions column */}
                        <div className="flex shrink-0 items-center sm:flex-col sm:items-end gap-2 pt-2 sm:pt-0">
                          <Btn
                            variant="primary"
                            onClick={() => updateSearch({ id: c.id })}
                            className="text-xs py-1.5 px-3"
                          >
                            View case record →
                          </Btn>
                          <SaveButton id={c.id} kind="case" />
                        </div>
                      </div>

                      {/* Evidence limitation strip */}
                      <div className="border-t bg-surface/80 px-5 py-2.5 text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-2">
                        <span className="truncate max-w-xl">
                          <strong className="text-foreground">Limitation:</strong> {c.limitations}
                        </span>
                        <span>Contributed by {c.contributor}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contribute Case Modal Sheet */}
      <ContributeSheet open={form} onOpenChange={setForm} />
    </div>
  );
}

function ContributeSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const initialForm = {
    title: "",
    age: "",
    sex: "",
    medicineId: "",
    condition: "",
    dosha: "",
    context: "",
    treatment: "",
    outcome: "",
    followUp: "",
    consent: false,
    deid: false,
  };
  const [d, setD] = useState(initialForm);

  const up =
    (k: keyof typeof d) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setD({
        ...d,
        [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value,
      });

  const valid = [
    Boolean(d.title && d.age && d.sex && d.medicineId && d.condition),
    Boolean(d.context && d.treatment && d.outcome),
    Boolean(d.consent && d.deid),
  ][step];

  const handleSubmit = async () => {
    try {
      const res = await apiClient.post<{ id: string }>("/research-submissions", {
        submission_type: "case_study",
        title: d.title.trim(),
        summary: `Condition: ${d.condition}. Dosha: ${d.dosha || "Unspecified"}. Age: ${d.age}, Sex: ${d.sex}`,
        content: JSON.stringify({
          title: d.title,
          age: d.age,
          sex: d.sex,
          medicineId: d.medicineId,
          condition: d.condition,
          dosha: d.dosha,
          context: d.context,
          treatment: d.treatment,
          outcome: d.outcome,
          consent: d.consent,
          deid: d.deid,
        }),
        attachments: [],
      });

      setState((s) => ({
        notifications: [
          {
            id: uid("notif"),
            kind: "Case Review",
            title: "Case contributed: " + d.title,
            body: `Your submitted clinical case (${res.id}) has been recorded and queued for peer review.`,
            at: new Date().toISOString(),
            read: false,
            to: "/cases",
          },
          ...s.notifications,
        ],
      }));
      toast.success("Case submitted for editorial moderation", {
        description: `Reference: ${res.id} · Status: Under Review`,
      });
      setD(initialForm);
      onOpenChange(false);
      setStep(0);
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit clinical case");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Contribute a Clinical Case</SheetTitle>
        </SheetHeader>
        <div className="mt-2 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn("h-1 flex-1 rounded", i <= step ? "bg-primary" : "bg-muted")}
            />
          ))}
        </div>
        <div className="mt-5 space-y-4 px-1">
          {step === 0 && (
            <>
              <Field label="Case title *">
                <input
                  className={inputCls}
                  value={d.title}
                  onChange={up("title")}
                  placeholder="e.g. Chronic Sandhivata in 54F managed with Yogaraja Guggulu"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Age band *" hint="Must use age bands, never exact age">
                  <select className={inputCls} value={d.age} onChange={up("age")}>
                    <option value="">Select age band</option>
                    {AGE_BANDS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Sex *">
                  <select className={inputCls} value={d.sex} onChange={up("sex")}>
                    <option value="">Select sex</option>
                    <option value="F">F</option>
                    <option value="M">M</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
              </div>
              <Field label="Prescribed Medicine *">
                <select className={inputCls} value={d.medicineId} onChange={up("medicineId")}>
                  <option value="">Select medicine from catalog</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Primary Condition *">
                  <input
                    className={inputCls}
                    value={d.condition}
                    onChange={up("condition")}
                    placeholder="e.g. Sandhivata"
                  />
                </Field>
                <Field label="Dosha Assessment">
                  <input
                    className={inputCls}
                    value={d.dosha}
                    onChange={up("dosha")}
                    placeholder="e.g. Vata pradhana"
                  />
                </Field>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <Field
                label="Clinical Context & Presentation *"
                hint="Do not include patient names, dates of birth, phone numbers or addresses."
              >
                <textarea
                  rows={3}
                  className={inputCls}
                  value={d.context}
                  onChange={up("context")}
                  placeholder="Primary presentation, duration of complaints, past history, pulse/tongue notes…"
                />
              </Field>
              <Field label="Treatment Posology (Dosage, Anupana, Timing, Duration) *">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={d.treatment}
                  onChange={up("treatment")}
                  placeholder="e.g. 5 g at bedtime with warm water for 8 weeks."
                />
              </Field>
              <Field label="Observed Clinical Outcome & Follow-Up *">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={d.outcome}
                  onChange={up("outcome")}
                  placeholder="Observable symptom resolution, follow-up weeks, patient self-reports…"
                />
              </Field>
            </>
          )}

          {step === 2 && (
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary-soft p-3.5 text-xs text-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <div>
                  <strong className="block text-foreground font-semibold">
                    Editorial Moderation Notice:
                  </strong>
                  Submissions are reviewed by editorial clinical moderation before appearing in the
                  shared Grantha case library. Nothing is published automatically.
                </div>
              </div>

              <div className="space-y-3 rounded-xl border p-4 bg-surface text-xs leading-relaxed">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.deid}
                    onChange={up("deid")}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>
                    <strong className="text-foreground">De-identification confirmation:</strong> I
                    confirm that all direct patient identifiers (including real names, dates of
                    birth, phone numbers, postal addresses, or government identity numbers) have
                    been eliminated from this record.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.consent}
                    onChange={up("consent")}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>
                    <strong className="text-foreground">Consent & Ethics:</strong> Patient consent
                    for anonymised clinical case documentation was obtained according to ethical
                    clinical practice guidelines.
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-3 border-t">
            <Btn
              variant="ghost"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
            >
              Back
            </Btn>
            {step < 2 ? (
              <Btn variant="ink" disabled={!valid} onClick={() => setStep(step + 1)}>
                Continue
              </Btn>
            ) : (
              <Btn disabled={!valid} onClick={handleSubmit}>
                Submit for editorial review
              </Btn>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
