import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Factory,
  ShieldCheck,
  FileText,
  AlertTriangle,
  ExternalLink,
  Building2,
  Calendar,
  CheckCircle2,
  X,
  FileCheck,
  Clock,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Empty, EvidencePill, PageHeader, Pill } from "@/components/ui-kit";
import {
  batches,
  manufacturers,
  medicines,
  type Manufacturer,
  type ManufacturerDocument,
} from "@/lib/mock-data";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

type S = {
  id?: string | undefined;
  q?: string | undefined;
  state?: string | undefined;
  status?: string | undefined;
  sort?: string | undefined;
};

export const Route = createFileRoute("/_ws/manufacturers")({
  validateSearch: (s: Record<string, unknown>): S => ({
    id: typeof s["id"] === "string" ? s["id"] : undefined,
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    state: typeof s["state"] === "string" ? s["state"] : undefined,
    status: typeof s["status"] === "string" ? s["status"] : undefined,
    sort: typeof s["sort"] === "string" ? s["sort"] : undefined,
  }),
  head: () =>
    seo(
      "Manufacturers Directory",
      "Directory of Ayurvedic manufacturers with licences, facility standards, quality certifications and public batch evidence.",
    ),
  component: Manufacturers,
});

const isExpired = (d: string) => new Date(d).getTime() < new Date().getTime();

const STATES = [...new Set(manufacturers.map((m) => m.state))];

export function filterManufacturers(list: Manufacturer[], s: S) {
  const q = (s.q ?? "").trim().toLowerCase();
  let filtered = list.filter((m) => {
    if (s.state && m.state !== s.state) return false;
    if (s.status === "active" && isExpired(m.licenceValid)) return false;
    if (s.status === "expired" && !isExpired(m.licenceValid)) return false;
    if (!q) return true;

    const hay = [
      m.name,
      m.city,
      m.state,
      m.licence,
      m.licenceType,
      m.issuingAuthority,
      ...medicines.filter((med) => med.manufacturerId === m.id).map((med) => med.name),
    ]
      .join(" ")
      .toLowerCase();

    return hay.includes(q);
  });

  if (s.sort === "za") {
    filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name));
  } else if (s.sort === "products") {
    filtered = [...filtered].sort((a, b) => b.products - a.products);
  } else if (s.sort === "since") {
    filtered = [...filtered].sort((a, b) => a.since - b.since);
  } else {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }

  return filtered;
}

export function Manufacturers() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/manufacturers" });

  const [q, setQ] = useState(s.q ?? "");
  const [activeDoc, setActiveDoc] = useState<{
    doc: ManufacturerDocument;
    mfr: Manufacturer;
  } | null>(null);

  useEffect(() => {
    setQ(s.q ?? "");
  }, [s.q]);

  useEffect(() => {
    if (!activeDoc) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDoc(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDoc]);

  const updateSearch = (patch: Partial<S>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...patch,
      }),
    });
  };

  const filteredList = useMemo(() => filterManufacturers(manufacturers, s), [s]);

  // Selection priority: URL id if present; else first in filtered list
  const sel = (s.id ? manufacturers.find((m) => m.id === s.id) : null) ?? filteredList[0] ?? null;

  const prods = sel ? medicines.filter((m) => m.manufacturerId === sel.id) : [];
  const mfrBatches = sel ? batches.filter((b) => b.manufacturerId === sel.id) : [];

  const activeFilters = [
    s.q && { k: "q" as const, label: `“${s.q}”` },
    s.state && { k: "state" as const, label: `State: ${s.state}` },
    s.status && {
      k: "status" as const,
      label: s.status === "active" ? "Licence: Current" : "Licence: Renewal Overdue",
    },
  ].filter(Boolean) as { k: keyof S; label: string }[];

  return (
    <div>
      <PageHeader
        eyebrow="Supply & Standards"
        title="Manufacturers"
        desc="Directory of classical and commercial Ayurvedic pharmaceutical manufacturers with statutory licences, Schedule T GMP status and batch evidence records."
      />

      {/* Temporary visibility notice and illustrative prototype disclaimer */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/60 px-4 py-2.5 text-xs text-muted-foreground md:px-8">
        <span className="font-semibold text-foreground">Notice:</span>
        <span>
          The Manufacturers directory is temporarily hidden from primary navigation pending official
          state manufacturing dataset integration. All company profiles, statutory licences, Schedule T
          standards, and verification statuses displayed are illustrative prototype records only and
          do not constitute regulatory verification or endorsement. Existing direct links and batch
          records remain functional.
        </span>
      </div>

      {/* Search and Filters Bar */}
      <div className="border-b bg-surface px-4 py-4 md:px-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateSearch({ q: q.trim() || undefined });
          }}
          className="flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2.5 focus-within:border-primary shadow-xs"
        >
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by company name, state, licence number or formulation…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            aria-label="Search manufacturers"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                updateSearch({ q: undefined });
              }}
              className="text-xs text-muted-foreground hover:text-foreground mr-1"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-ink-foreground hover:bg-ink/90 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="eyebrow mr-1 text-muted-foreground">State:</span>
          <button
            type="button"
            onClick={() => updateSearch({ state: undefined })}
            className={cn(
              "rounded-full border px-3 py-1 font-semibold transition-colors",
              !s.state
                ? "border-ink bg-ink text-ink-foreground"
                : "bg-card text-foreground hover:border-primary/50",
            )}
          >
            All states
          </button>
          {STATES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => updateSearch({ state: s.state === st ? undefined : st })}
              className={cn(
                "rounded-full border px-3 py-1 font-semibold transition-colors",
                s.state === st
                  ? "border-ink bg-ink text-ink-foreground"
                  : "bg-card text-foreground hover:border-primary/50",
              )}
            >
              {st}
            </button>
          ))}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              value={s.status ?? ""}
              onChange={(e) => updateSearch({ status: e.target.value || undefined })}
              className="rounded-lg border bg-card px-2.5 py-1 font-medium outline-none focus:border-primary"
              aria-label="Licence status"
            >
              <option value="">All licence statuses</option>
              <option value="active">Current / Valid</option>
              <option value="expired">Renewal Overdue</option>
            </select>

            <select
              value={s.sort ?? "az"}
              onChange={(e) => updateSearch({ sort: e.target.value || undefined })}
              className="rounded-lg border bg-card px-2.5 py-1 font-medium outline-none focus:border-primary"
              aria-label="Sort manufacturers"
            >
              <option value="az">Name A–Z</option>
              <option value="za">Name Z–A</option>
              <option value="products">Most products</option>
              <option value="since">Oldest established</option>
            </select>
          </div>
        </div>

        {/* Active Filters Bar */}
        <AnimatePresence>
          {activeFilters.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 flex flex-wrap items-center gap-1.5 overflow-hidden pt-1"
            >
              <span className="text-xs text-muted-foreground mr-1">Active filters:</span>
              {activeFilters.map((a) => (
                <button
                  key={a.k}
                  type="button"
                  onClick={() => updateSearch({ [a.k]: undefined })}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-accent-foreground hover:bg-primary/20 transition-colors"
                >
                  {a.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  navigate({ search: {} });
                }}
                className="text-xs font-semibold text-muted-foreground underline hover:text-foreground ml-1"
              >
                Clear all filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Split Layout */}
      <div className="grid lg:grid-cols-[380px_1fr]">
        {/* Left Column: Manufacturer List */}
        <div className="border-b p-4 lg:min-h-[70vh] lg:border-b-0 lg:border-r md:px-6">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {filteredList.length} manufacturer{filteredList.length === 1 ? "" : "s"} found
            </span>
            <span>Click to inspect details</span>
          </div>

          {filteredList.length === 0 ? (
            <div className="rounded-xl border border-dashed py-12 px-4 text-center text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">No manufacturers match your query</p>
              <p>Try clearing active filters or searching for another company or city.</p>
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  navigate({ search: {} });
                }}
                className="mt-2 font-semibold text-primary underline"
              >
                Reset search
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredList.map((m) => {
                const isSelected = sel?.id === m.id;
                const expired = isExpired(m.licenceValid);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => updateSearch({ id: m.id })}
                      className={cn(
                        "w-full rounded-xl border p-3.5 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary-soft/60 shadow-soft"
                          : "bg-card hover:border-primary/40",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-foreground text-sm leading-snug">
                          {m.name}
                        </span>
                        <Pill t="outline" className="text-[10px]">
                          {m.state}
                        </Pill>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{m.city}</span>
                        <span>·</span>
                        <span>Est. {m.since}</span>
                        <span>·</span>
                        <span>{m.products} products</span>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground truncate max-w-[190px]">
                          {m.gmp}
                        </span>
                        {expired ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-destructive">
                            <Clock className="h-3 w-3" /> Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-primary">
                            <CheckCircle2 className="h-3 w-3" /> Current
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

        {/* Right Column: Manufacturer Profile Details */}
        {sel ? (
          <motion.div
            key={sel.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 md:p-8 space-y-6"
          >
            {/* Header Identity Card */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ink text-primary shadow-xs">
                  <Factory className="h-7 w-7" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      {sel.name}
                    </h2>
                    <Pill
                      t="orange"
                      title="Illustrative sample database status — not an official state regulatory certification"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Sample: {sel.verificationStatus}
                    </Pill>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {sel.address} · Established {sel.since} ({new Date().getFullYear() - sel.since}{" "}
                    years of operation)
                  </p>
                </div>
              </div>
            </div>

            {/* Statutory Licence & Facility Quality Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Licence Panel */}
              <div className="panel p-5 space-y-3">
                <div className="eyebrow flex items-center justify-between text-primary">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> Statutory AYUSH Licence
                  </span>
                  {isExpired(sel.licenceValid) ? (
                    <Pill t="danger">Renewal Notice Issued</Pill>
                  ) : (
                    <Pill t="ink">Active & Current</Pill>
                  )}
                </div>

                <div>
                  <div className="text-sm font-bold text-foreground">{sel.licence}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{sel.licenceType}</div>
                </div>

                <div className="border-t pt-2.5 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issuing Authority:</span>
                    <span className="font-medium text-foreground text-right">
                      {sel.issuingAuthority}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Licence Validity:</span>
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      Until {sel.licenceValid}
                    </span>
                  </div>
                </div>
              </div>

              {/* Manufacturing Facilities & Quality Standards */}
              <div className="panel p-5 space-y-3">
                <div className="eyebrow flex items-center justify-between text-primary">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Quality Standards & Facility
                  </span>
                  <Pill t="outline">{sel.gmp}</Pill>
                </div>

                <div>
                  <div className="text-xs font-semibold text-foreground">
                    Analytical Laboratory Facilities
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {sel.labFacilities}
                  </p>
                </div>

                <div className="border-t pt-2.5">
                  <div className="text-xs font-semibold text-foreground mb-1.5">
                    Accreditations & Certifications
                  </div>
                  {sel.certifications.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No optional certifications on file.
                    </p>
                  ) : (
                    <ul className="space-y-1 text-xs">
                      {sel.certifications.map((c) => (
                        <li key={c} className="flex items-center gap-1.5 text-foreground/90">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Document Preview Vault */}
            <div className="panel p-5 space-y-3">
              <div className="eyebrow flex items-center justify-between text-primary">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Inspectable Certification Documents (
                  {sel.documents.length})
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Click document to preview certificate
                </span>
              </div>

              {sel.documents.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No documents submitted by this manufacturer.
                </p>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                  {sel.documents.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setActiveDoc({ doc, mfr: sel })}
                      className="rounded-xl border bg-card p-3 text-left hover:border-primary/50 transition-colors group shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <FileCheck className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {doc.fileSize}
                        </span>
                      </div>
                      <div className="mt-2 font-bold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {doc.title}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {doc.type} · {doc.status}
                      </div>
                      <div className="mt-2 text-[10px] font-semibold text-primary flex items-center gap-1">
                        Preview document <ExternalLink className="h-2.5 w-2.5" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground pt-1">
                Document previews are provided for clinical reference. Restricted formulation master
                formulas and trade secrets remain protected.
              </p>
            </div>

            {/* Associated Commercial Formulations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">
                  Associated Commercial Formulations ({prods.length})
                </h3>
                <span className="text-xs text-muted-foreground">
                  Click formulation to view Ayurvedic properties and monograph
                </span>
              </div>

              {prods.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground">
                  No public commercial formulations are linked to this manufacturer in the current
                  catalogue.
                </div>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {prods.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border bg-card p-3.5 shadow-2xs"
                    >
                      <div>
                        <span className="font-bold text-sm text-foreground">
                          {p.name}
                        </span>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {p.form} · {p.category}
                        </div>
                      </div>
                      <EvidencePill s={p.evidence} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Public Batch Evidence */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">
                  Public Batch Records & Analytical Evidence ({mfrBatches.length})
                </h3>
                <span className="text-xs text-muted-foreground">
                  Click batch to inspect Certificate of Analysis (CoA)
                </span>
              </div>

              {mfrBatches.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground">
                  No batch evidence reports are currently logged for this manufacturer.
                </div>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {mfrBatches.map((b) => (
                    <Link
                      key={b.id}
                      to="/quality"
                      search={{ batch: b.id }}
                      className="flex items-center justify-between rounded-xl border bg-card p-3.5 hover:border-primary/50 transition-colors shadow-2xs group"
                    >
                      <div>
                        <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors font-mono">
                          {b.id}
                        </span>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Mfg: {b.mfg} · Exp: {b.exp}
                        </div>
                        {b.flags.length > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-destructive">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span>{b.flags[0]}</span>
                          </div>
                        )}
                      </div>
                      <EvidencePill s={b.review} />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Legal and Verification Disclaimers */}
            <div className="rounded-xl border bg-surface/60 p-4 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Regulatory & Directory Notice</p>
              <p className="leading-relaxed">
                Manufacturer directory listings, licences, and Schedule T certifications displayed
                here represent sample database records. Official verification should be corroborated
                with the relevant State Licensing Authority (AYUSH) before contractual procurement.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="p-8">
            <Empty
              title="No manufacturer selected"
              desc="Select a manufacturer from the directory list or clear search filters to view company details."
            />
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      <AnimatePresence>
        {activeDoc && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Document Preview"
            onClick={() => setActiveDoc(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl border bg-card shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between border-b px-6 py-4 bg-surface">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-primary" />
                    {activeDoc.doc.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Issued to {activeDoc.mfr.name} · {activeDoc.doc.type}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDoc(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Close document preview"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="rounded-xl border border-dashed border-primary/40 bg-primary-soft/30 p-4 text-xs text-accent-foreground text-center">
                  <strong>PROTOTYPE DOCUMENT INSPECTION PREVIEW:</strong> This is a structured
                  demonstration preview of the manufacturer's verified file on record.
                </div>

                <div className="rounded-xl border bg-surface p-5 space-y-3 font-serif">
                  <div className="text-center border-b pb-3 space-y-1">
                    <div className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
                      Government of India / State AYUSH Authority
                    </div>
                    <div className="text-lg font-bold text-foreground font-sans">
                      {activeDoc.doc.title}
                    </div>
                    <div className="text-xs text-muted-foreground font-sans">
                      Document Ref: {activeDoc.doc.id.toUpperCase()}
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-xs font-sans py-2">
                    <div>
                      <dt className="text-muted-foreground">Licensee Entity:</dt>
                      <dd className="font-semibold text-foreground">{activeDoc.mfr.name}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Facility Location:</dt>
                      <dd className="font-semibold text-foreground">{activeDoc.mfr.city}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Issue / Grant Date:</dt>
                      <dd className="font-semibold text-foreground">{activeDoc.doc.date}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Verification Status:</dt>
                      <dd className="font-semibold text-primary">{activeDoc.doc.status}</dd>
                    </div>
                  </dl>

                  <div className="border-t pt-3 text-xs font-sans text-muted-foreground leading-relaxed">
                    Certified that the manufacturing facility and quality control systems of the
                    mentioned establishment have been inspected and found to comply with the
                    requirements of Schedule T (Good Manufacturing Practices) of the Drugs and
                    Cosmetics Act, 1940.
                  </div>
                </div>
              </div>

              <div className="border-t px-6 py-3 bg-surface flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveDoc(null)}
                  className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-ink-foreground hover:bg-ink/90 transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
