import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, CheckCircle2, FileText, Info, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Btn, Field, MockUpload, PageHeader, inputCls, Pill } from "@/components/ui-kit";
import { batches, medicines, medById } from "@/lib/mock-data";
import { setState, today, useStore, type AdrReport } from "@/lib/store";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { apiClient } from "@/services/apiClient";

export const Route = createFileRoute("/_ws/adr")({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    medicine?: string | undefined;
    id?: string | undefined;
    batch?: string | undefined;
  } => ({
    medicine: typeof s["medicine"] === "string" ? s["medicine"] : undefined,
    id: typeof s["id"] === "string" ? s["id"] : undefined,
    batch: typeof s["batch"] === "string" ? s["batch"] : undefined,
  }),
  head: () =>
    seo(
      "Report a Side Effect",
      "Guided suspected adverse drug reaction (ADR) report for Ayurvedic medicines and formulations.",
    ),
  component: Adr,
});

const STEPS = ["Medicine", "Patient", "Reaction", "Context", "Review"];

export const adrSchemas = [
  z.object({ medicine: z.string().min(1, "Select or enter the suspected medicine") }),
  z.object({
    patientRef: z.string().min(3),
    ageBand: z.string().min(1, "Select an age band"),
    sex: z.string().min(1, "Select sex"),
  }),
  z.object({
    dose: z.string().min(1, "Enter dose and frequency"),
    route: z.string().min(1),
    startDate: z.string().min(1, "Enter start date"),
    reaction: z.string().min(3, "Describe the suspected reaction"),
    onset: z.string().min(1, "Enter onset timeframe"),
    seriousness: z.string().min(1, "Select seriousness"),
    outcome: z.string().min(1, "Select outcome"),
  }),
  z.object({}),
];

type D = Omit<
  AdrReport,
  "id" | "status" | "causality" | "regulatory" | "submittedAt" | "timeline" | "messages"
>;

type AdrErrors = {
  medicine?: string | undefined;
  patientRef?: string | undefined;
  ageBand?: string | undefined;
  sex?: string | undefined;
  dose?: string | undefined;
  route?: string | undefined;
  startDate?: string | undefined;
  reaction?: string | undefined;
  onset?: string | undefined;
  seriousness?: string | undefined;
  outcome?: string | undefined;
  concomitant?: string | undefined;
  action?: string | undefined;
};

const POPULAR_MEDS = ["Triphala Churna", "Haritaki Churna", "Trikatu Churna", "Ashwagandha Churna"];

export function Adr() {
  const { medicine, id, batch } = Route.useSearch();
  const allReports = useStore((s) => s.adr);
  const count = allReports.length;
  const existingDraft = id ? allReports.find((r) => r.id === id) : undefined;
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<AdrErrors>({});
  const [done, setDone] = useState<string | null>(null);
  const [d, setD] = useState<D>(() => {
    if (existingDraft) {
      return {
        medicine: existingDraft.medicine,
        batch: existingDraft.batch,
        patientRef: existingDraft.patientRef,
        ageBand: existingDraft.ageBand,
        sex: existingDraft.sex,
        dose: existingDraft.dose,
        route: existingDraft.route,
        startDate: existingDraft.startDate,
        reaction: existingDraft.reaction,
        onset: existingDraft.onset,
        seriousness: existingDraft.seriousness,
        outcome: existingDraft.outcome,
        concomitant: existingDraft.concomitant,
        action: existingDraft.action,
        attachments: existingDraft.attachments,
      };
    }
    return {
      medicine: medicine ?? "",
      batch: batch ?? "",
      patientRef: `PT-${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
      ageBand: "",
      sex: "",
      dose: "",
      route: "Oral",
      startDate: "",
      reaction: "",
      onset: "",
      seriousness: "",
      outcome: "",
      concomitant: "",
      action: "",
      attachments: [],
    };
  });

  const up =
    (k: keyof D) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setD({ ...d, [k]: e.target.value });
      if (k in errors) {
        setErrors((prev) => ({ ...prev, [k]: undefined }));
      }
    };

  const ref =
    existingDraft?.id ?? `ADR-${new Date().getFullYear()}-${String(312 + count).padStart(4, "0")}`;

  const matchingCatalogMed = medicines.find(
    (m) => m.name.toLowerCase() === d.medicine.trim().toLowerCase(),
  );

  const relevantBatches = matchingCatalogMed
    ? batches.filter((b) => b.medicineId === matchingCatalogMed.id)
    : batches;

  const next = () => {
    const r = adrSchemas[step]?.safeParse(d);
    if (r && !r.success) {
      const errMap: AdrErrors = {};
      for (const issue of r.error.issues) {
        const key = issue.path[0] as keyof AdrErrors;
        if (key) errMap[key] = issue.message;
      }
      setErrors(errMap);
      return;
    }
    setErrors({});
    setStep(step + 1);
  };

  const persist = async (status: AdrReport["status"]): Promise<string> => {
    const now = today();
    const eventText =
      status === "Draft"
        ? existingDraft
          ? "Draft updated by doctor"
          : "Draft saved in local workspace"
        : existingDraft?.status === "Draft"
          ? "Submitted by doctor from saved draft"
          : "Report submitted (Received)";

    const updatedTimeline = existingDraft?.timeline?.length
      ? [...existingDraft.timeline, { at: now, text: eventText }]
      : [{ at: now, text: eventText }];

    let finalRef = ref;
    let finalStatus = status;

    if (status === "Received") {
      try {
        const prodIdMap: Record<string, string> = {
          "triphala churna": "prod-triphala-001",
          "haritaki churna": "prod-haritaki-001",
          "ashwagandha churna": "prod-ashwa-001",
          "trikatu churna": "prod-trikatu-001",
          "chyawanprasha avaleha": "prod-chyawan-001",
        };
        const prodKey = d.medicine.trim().toLowerCase();
        const selectedProdId = matchingCatalogMed?.id?.startsWith("prod-")
          ? matchingCatalogMed.id
          : prodIdMap[prodKey] ?? "prod-triphala-001";

        const isSerious =
          d.seriousness.toLowerCase().includes("serious") &&
          !d.seriousness.toLowerCase().includes("non");
        const outcomeVal = d.outcome.toLowerCase().includes("recovering")
          ? "recovering"
          : d.outcome.toLowerCase().includes("not")
            ? "not_recovered"
            : d.outcome.toLowerCase().includes("fatal")
              ? "fatal"
              : d.outcome.toLowerCase().includes("unknown")
                ? "unknown"
                : "recovered";

        const res = await apiClient.post<{ id: string }>("/adr-reports", {
          product_id: selectedProdId,
          product_name: d.medicine.trim() || "Triphala Churna",
          reaction: d.reaction.trim() || "Suspected Adverse Reaction",
          occurred_on: d.startDate || new Date().toISOString().split("T")[0],
          outcome: outcomeVal,
          seriousness: isSerious ? "serious" : "non_serious",
          description: `${d.reaction}. Dose: ${d.dose || "N/A"}. Route: ${d.route || "Oral"}. Onset: ${d.onset || "N/A"}. Patient: ${d.patientRef || "PT-ANON"}`.slice(0, 2000),
        });

        if (res?.id) {
          finalRef = res.id;
          finalStatus = "Received";
        }
      } catch (err: unknown) {
        console.warn("Backend ADR sync:", err);
      }
    }

    const rec: AdrReport = {
      ...d,
      id: finalRef,
      status: finalStatus,
      causality: existingDraft?.causality ?? "Not yet assessed",
      regulatory: existingDraft?.regulatory ?? "Not determined",
      submittedAt: existingDraft?.submittedAt || now,
      timeline: updatedTimeline,
      messages: existingDraft?.messages ?? [],
    };

    setState((s) => ({ adr: [rec, ...s.adr.filter((x) => x.id !== finalRef && x.id !== ref)] }));
    return finalRef;
  };

  if (done) {
    return (
      <div className="grid min-h-[70vh] place-items-center p-6">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="panel max-w-lg p-8 text-center space-y-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring" }}
            className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-orange-gradient text-primary-foreground"
          >
            <CheckCircle2 className="h-7 w-7" />
          </motion.div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Suspected ADR Report Logged
          </h2>
          <div className="rounded-xl border bg-surface/60 p-4 text-xs text-left space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-sans">Report Reference:</span>
              <span className="font-bold text-foreground">{done}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-sans">Suspected Medicine:</span>
              <span className="text-foreground">{d.medicine}</span>
            </div>
            {d.batch && (
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Batch:</span>
                <span className="text-foreground">{d.batch}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground font-sans">Workflow Status:</span>
              <span className="font-bold text-primary">Received</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Report saved to your private reports list. Logging this report documents an
            observational suspected reaction for internal pharmacovigilance review. It does not
            establish medical causality or regulatory non-compliance.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              to="/reports"
              search={{ id: done }}
              className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-ink-foreground hover:bg-ink/90 transition-colors"
            >
              Track in My Reports
            </Link>
            <button
              type="button"
              onClick={() => {
                setDone(null);
                setStep(0);
                setD({
                  medicine: "",
                  batch: "",
                  patientRef: `PT-${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
                  ageBand: "",
                  sex: "",
                  dose: "",
                  route: "Oral",
                  startDate: "",
                  reaction: "",
                  onset: "",
                  seriousness: "",
                  outcome: "",
                  concomitant: "",
                  action: "",
                  attachments: [],
                });
              }}
              className="rounded-lg border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:border-primary/50 transition-colors"
            >
              File Another Report
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Pharmacovigilance & Safety"
        title="Report a Side Effect"
        desc="Guided documentation for suspected adverse drug reactions (ADR) associated with Ayurvedic medicines or formulations."
      />

      <div className="p-4 md:p-8 space-y-6 max-w-4xl">
        {/* Clinical Safety & Non-Emergency Notice */}
        <div className="rounded-xl border border-destructive/30 bg-destructive-soft p-4 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-destructive text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Clinical Pharmacovigilance Notice — Not an Emergency Service</span>
          </div>
          <p className="text-foreground/90 leading-relaxed">
            This guided interface documents <strong>suspected</strong> adverse drug reactions for
            clinical safety analysis. It is <strong>not</strong> an emergency triage service. If the
            patient presents acute, severe, or life-threatening symptoms, immediately arrange
            emergency medical intervention at a hospital facility.
          </p>
          <p className="text-muted-foreground text-[11px]">
            Privacy & Prototype Safeguard: All submissions in this Phase 1 prototype are saved to
            your local doctor workspace and simulated review queue. Do not enter patient names,
            phone numbers, or government identifiers.
          </p>
        </div>

        {/* Form Stepper Layout */}
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <ol className="flex gap-2 lg:flex-col" aria-label="ADR submission steps">
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={cn(
                  "flex items-center gap-3 text-sm p-1.5 rounded-lg transition-colors",
                  i === step
                    ? "font-bold text-foreground bg-primary-soft/40"
                    : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold transition",
                    i < step
                      ? "border-primary bg-primary text-primary-foreground"
                      : i === step
                        ? "border-ink bg-ink text-ink-foreground"
                        : "bg-card border-border",
                  )}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s}</span>
              </li>
            ))}
          </ol>

          <div className="panel p-6 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* STEP 0: MEDICINE & BATCH */}
                {step === 0 && (
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h2 className="text-sm font-bold text-foreground">
                        Step 1: Suspected Medicine & Formulation
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Specify the Ayurvedic medicine, classical compound or custom formulation.
                      </p>
                    </div>

                    <Field
                      label="Suspected medicine or formulation *"
                      error={errors.medicine}
                      hint="Type to search catalog medicines or enter a custom formulation name"
                    >
                      <input
                        list="meds"
                        className={inputCls}
                        value={d.medicine}
                        onChange={up("medicine")}
                        placeholder="e.g. Triphala Churna"
                        aria-label="Suspected medicine or formulation"
                      />
                      <datalist id="meds">
                        {medicines.map((m) => (
                          <option key={m.id} value={m.name} />
                        ))}
                      </datalist>
                    </Field>

                    {/* Quick suggestion chips */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground">Quick select:</span>
                      {POPULAR_MEDS.map((pm) => (
                        <button
                          key={pm}
                          type="button"
                          onClick={() => setD({ ...d, medicine: pm })}
                          className={cn(
                            "rounded border px-2 py-0.5 font-medium transition-colors",
                            d.medicine === pm
                              ? "border-primary bg-primary-soft text-accent-foreground"
                              : "bg-card text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {pm}
                        </button>
                      ))}
                    </div>

                    {matchingCatalogMed && (
                      <div className="rounded-xl border bg-surface/60 p-3 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-foreground">
                            {matchingCatalogMed.name}
                          </span>
                          <span className="text-muted-foreground ml-2">
                            {matchingCatalogMed.form} · {matchingCatalogMed.category}
                          </span>
                        </div>
                        <Pill t="outline">{matchingCatalogMed.evidence}</Pill>
                      </div>
                    )}

                    <Field
                      label="Manufacturing batch identifier"
                      hint="Optional — located on packaging, container, or blister strip"
                    >
                      <input
                        list="batches"
                        className={inputCls}
                        value={d.batch}
                        onChange={up("batch")}
                        placeholder="e.g. SA-TC-2409"
                        aria-label="Manufacturing batch identifier"
                      />
                      <datalist id="batches">
                        {relevantBatches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.id} — Mfg: {b.mfg}
                          </option>
                        ))}
                      </datalist>
                    </Field>
                  </div>
                )}

                {/* STEP 1: PATIENT DEMOGRAPHICS (DE-IDENTIFIED) */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h2 className="text-sm font-bold text-foreground">
                        Step 2: Patient Context (De-identified)
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Collect anonymous demographic ranges only. Strict privacy guidelines apply.
                      </p>
                    </div>

                    <div className="rounded-xl border border-primary/30 bg-primary-soft/30 p-3 text-xs text-accent-foreground">
                      <strong>De-identification Safeguard:</strong> A pseudonymous identifier has
                      been generated automatically. Never enter the patient's name, phone number,
                      address, or national identification numbers.
                    </div>

                    <Field
                      label="Pseudonymous patient reference"
                      hint="System generated token for longitudinal safety tracking"
                    >
                      <input
                        className={cn(inputCls, "bg-muted font-mono font-bold")}
                        value={d.patientRef}
                        readOnly
                        aria-label="Pseudonymous patient reference"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Age band *" error={errors.ageBand}>
                        <select
                          className={inputCls}
                          value={d.ageBand}
                          onChange={up("ageBand")}
                          aria-label="Age band"
                        >
                          <option value="">Select age band</option>
                          {["<18", "18–29", "30–39", "40–49", "50–59", "60+"].map((a) => (
                            <option key={a}>{a}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Sex *" error={errors.sex}>
                        <select
                          className={inputCls}
                          value={d.sex}
                          onChange={up("sex")}
                          aria-label="Sex"
                        >
                          <option value="">Select sex</option>
                          <option value="F">Female (F)</option>
                          <option value="M">Male (M)</option>
                          <option value="Other">Other / Non-disclosed</option>
                        </select>
                      </Field>
                    </div>
                  </div>
                )}

                {/* STEP 2: REACTION DETAILS & SEVERITY */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h2 className="text-sm font-bold text-foreground">
                        Step 3: Suspected Adverse Reaction
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Record clinical observations, time to onset, and patient outcome.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Prescribed dose *" error={errors.dose}>
                        <input
                          className={inputCls}
                          value={d.dose}
                          onChange={up("dose")}
                          placeholder="e.g. 3 g BD with warm water"
                          aria-label="Prescribed dose"
                        />
                      </Field>

                      <Field label="Route of administration">
                        <select
                          className={inputCls}
                          value={d.route}
                          onChange={up("route")}
                          aria-label="Route of administration"
                        >
                          {[
                            "Oral",
                            "Topical",
                            "Nasal (Nasya)",
                            "Rectal (Basti)",
                            "Ocular (Netra)",
                          ].map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Treatment start date *" error={errors.startDate}>
                        <input
                          type="date"
                          className={inputCls}
                          value={d.startDate}
                          onChange={up("startDate")}
                          aria-label="Treatment start date"
                        />
                      </Field>

                      <Field label="Onset timeframe *" error={errors.onset}>
                        <input
                          className={inputCls}
                          value={d.onset}
                          onChange={up("onset")}
                          placeholder="e.g. 2 days after first dose"
                          aria-label="Onset timeframe"
                        />
                      </Field>

                      <div className="sm:col-span-2">
                        <Field
                          label="Suspected adverse reaction description *"
                          error={errors.reaction}
                          hint="Detail symptoms (e.g. epigastric burning, urticaria, loose stools, nausea)"
                        >
                          <textarea
                            rows={3}
                            className={inputCls}
                            value={d.reaction}
                            onChange={up("reaction")}
                            placeholder="Describe clinical presentation and subjective symptoms..."
                            aria-label="Suspected adverse reaction description"
                          />
                        </Field>
                      </div>

                      <Field label="Seriousness evaluation *" error={errors.seriousness}>
                        <select
                          className={inputCls}
                          value={d.seriousness}
                          onChange={up("seriousness")}
                          aria-label="Seriousness evaluation"
                        >
                          <option value="">Select seriousness</option>
                          <option value="Non-serious">Non-serious (mild/moderate)</option>
                          <option value="Serious">
                            Serious (hospitalization/significant disability)
                          </option>
                        </select>
                      </Field>

                      <Field label="Clinical outcome *" error={errors.outcome}>
                        <select
                          className={inputCls}
                          value={d.outcome}
                          onChange={up("outcome")}
                          aria-label="Clinical outcome"
                        >
                          <option value="">Select outcome</option>
                          <option value="Recovered">Recovered / Resolved</option>
                          <option value="Recovering">Recovering / Improving</option>
                          <option value="Not recovered">Not recovered / Persistent</option>
                          <option value="Unknown">Unknown / Lost to follow-up</option>
                        </select>
                      </Field>
                    </div>
                  </div>
                )}

                {/* STEP 3: CLINICAL CONTEXT & ATTACHMENTS */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h2 className="text-sm font-bold text-foreground">
                        Step 4: Clinical Context & Supporting Documents
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Concomitant medications, de-challenge actions and de-identified lab slips.
                      </p>
                    </div>

                    <Field
                      label="Concomitant medicines or supplements"
                      hint="List any other concurrent modern or herbal therapies"
                    >
                      <textarea
                        rows={2}
                        className={inputCls}
                        value={d.concomitant}
                        onChange={up("concomitant")}
                        placeholder="e.g. Metformin 500mg OD; Ashwagandha capsule..."
                        aria-label="Concomitant medicines"
                      />
                    </Field>

                    <Field
                      label="Action taken & clinical management"
                      hint="e.g. Medicine stopped; dose halved; symptomatic treatment given"
                    >
                      <textarea
                        rows={2}
                        className={inputCls}
                        value={d.action}
                        onChange={up("action")}
                        placeholder="Detail de-challenge outcome or remedial protocol..."
                        aria-label="Action taken"
                      />
                    </Field>

                    <div>
                      <div className="eyebrow mb-1 text-foreground">Supporting Attachments</div>
                      <MockUpload
                        files={d.attachments}
                        onChange={(attachments) => setD({ ...d, attachments })}
                        label="Attach de-identified test results or lab report"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        File constraints: Mock upload accepts PDF, JPG, PNG up to 10 MB per file.
                        Files stay in the local browser prototype session.
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP 4: REVIEW & DECLARATION */}
                {step === 4 && (
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h2 className="text-sm font-bold text-foreground">
                        Step 5: Review & Submit Suspected ADR
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Verify your report details before logging. Drafts can also be saved for
                        later completion.
                      </p>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 rounded-xl border bg-surface/60 p-4 text-xs">
                      <div>
                        <dt className="eyebrow text-muted-foreground">Suspected Medicine</dt>
                        <dd className="font-bold text-foreground text-sm mt-0.5">{d.medicine}</dd>
                      </div>
                      <div>
                        <dt className="eyebrow text-muted-foreground">Batch Identifier</dt>
                        <dd className="font-mono font-semibold text-foreground mt-0.5">
                          {d.batch || "Not specified"}
                        </dd>
                      </div>
                      <div>
                        <dt className="eyebrow text-muted-foreground">Patient Identifier</dt>
                        <dd className="font-mono text-foreground mt-0.5">{d.patientRef}</dd>
                      </div>
                      <div>
                        <dt className="eyebrow text-muted-foreground">Age / Sex</dt>
                        <dd className="text-foreground mt-0.5">
                          {d.ageBand} / {d.sex}
                        </dd>
                      </div>
                      <div>
                        <dt className="eyebrow text-muted-foreground">Dose & Route</dt>
                        <dd className="text-foreground mt-0.5">
                          {d.dose} ({d.route})
                        </dd>
                      </div>
                      <div>
                        <dt className="eyebrow text-muted-foreground">Treatment Start</dt>
                        <dd className="text-foreground mt-0.5">{d.startDate}</dd>
                      </div>
                      <div className="col-span-2 border-t pt-2">
                        <dt className="eyebrow text-muted-foreground">
                          Suspected Reaction & Onset
                        </dt>
                        <dd className="font-medium text-foreground mt-0.5">
                          {d.reaction} (onset: {d.onset})
                        </dd>
                      </div>
                      <div>
                        <dt className="eyebrow text-muted-foreground">Seriousness</dt>
                        <dd className="text-foreground mt-0.5">
                          <Pill t={d.seriousness === "Serious" ? "danger" : "muted"}>
                            {d.seriousness}
                          </Pill>
                        </dd>
                      </div>
                      <div>
                        <dt className="eyebrow text-muted-foreground">Reported Outcome</dt>
                        <dd className="text-foreground mt-0.5">{d.outcome}</dd>
                      </div>
                      {d.concomitant && (
                        <div className="col-span-2 border-t pt-2">
                          <dt className="eyebrow text-muted-foreground">Concomitant Therapies</dt>
                          <dd className="text-muted-foreground mt-0.5">{d.concomitant}</dd>
                        </div>
                      )}
                      {d.attachments.length > 0 && (
                        <div className="col-span-2 border-t pt-2">
                          <dt className="eyebrow text-muted-foreground">Attachments</dt>
                          <dd className="text-muted-foreground mt-0.5">
                            {d.attachments.join(", ")}
                          </dd>
                        </div>
                      )}
                    </dl>

                    <div className="rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-primary" />
                        Clinical Reporting Statement (Local Prototype)
                      </div>
                      <p>
                        Submitting this report records an observational suspicion in your local doctor
                        workspace. It does not infer conclusive causality or fault, and is not transmitted
                        to a live external regulatory agency. Formal causality evaluation and WHO-UMC
                        scaling are carried out separately by the medical safety review desk.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Stepper Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-between border-t pt-4 gap-2">
              <Btn
                type="button"
                variant="ghost"
                disabled={step === 0}
                onClick={() => setStep(step - 1)}
              >
                Back
              </Btn>

              <div className="flex items-center gap-2">
                <Btn
                  type="button"
                  variant="outline"
                  onClick={() => {
                    persist("Draft");
                    toast.success("Draft report saved to workspace", { description: ref });
                  }}
                >
                  Save draft
                </Btn>

                {step < 4 ? (
                  <Btn type="button" variant="ink" onClick={next}>
                    Continue
                  </Btn>
                ) : (
                  <Btn
                    type="button"
                    onClick={async () => {
                      const finalId = await persist("Received");
                      setDone(finalId);
                    }}
                  >
                    Submit report
                  </Btn>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
