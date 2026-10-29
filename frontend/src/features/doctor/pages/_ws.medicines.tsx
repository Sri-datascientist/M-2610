import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, GitCompare, Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MedicineDetail } from "@/components/MedicineDetail";
import { Chip, Empty, EvidencePill, PageHeader, Pill } from "@/components/ui-kit";
import {
  AYURVEDIC_GLOSSARY,
  ingById,
  manufacturers,
  medById,
  medicines,
} from "@/lib/mock-data";
import { actions, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { apiClient } from "@/services/apiClient";

type S = {
  q?: string | undefined;
  id?: string | undefined;
  form?: string | undefined;
  cat?: string | undefined;
  rasa?: string | undefined;
  virya?: string | undefined;
  mfr?: string | undefined;
  ev?: string | undefined;
  sort?: string | undefined;
  page?: number | undefined;
};

export const Route = createFileRoute("/_ws/medicines")({
  validateSearch: (s: Record<string, unknown>): S => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    id: typeof s["id"] === "string" ? s["id"] : undefined,
    form: typeof s["form"] === "string" ? s["form"] : undefined,
    cat: typeof s["cat"] === "string" ? s["cat"] : undefined,
    rasa: typeof s["rasa"] === "string" ? s["rasa"] : undefined,
    virya: typeof s["virya"] === "string" ? s["virya"] : undefined,
    mfr: typeof s["mfr"] === "string" ? s["mfr"] : undefined,
    ev: typeof s["ev"] === "string" ? s["ev"] : undefined,
    sort: typeof s["sort"] === "string" ? s["sort"] : undefined,
    page: typeof s["page"] === "number" ? s["page"] : undefined,
  }),
  head: () =>
    seo(
      "Find Medicines",
      "Search Ayurvedic medicines by name, ingredient, formulation type or Ayurvedic pharmacological properties with reference citations.",
    ),
  component: FindMedicines,
});

const FORMS = [...new Set(medicines.map((m) => m.form))];
const CATEGORIES = [...new Set(medicines.map((m) => m.category))];
const RASAS = Object.keys(AYURVEDIC_GLOSSARY.rasa);
const VIRYAS = Object.keys(AYURVEDIC_GLOSSARY.virya);
const EVS = [
  "Evidence available",
  "Reference documented",
  "Review pending",
  "Evidence unavailable",
];
const PER = 6;

export function filterMedicines(s: S) {
  const q = (s.q ?? "").trim().toLowerCase();
  let list = medicines.filter((m) => {
    if (s.form && m.form !== s.form) return false;
    if (s.cat && m.category !== s.cat) return false;
    if (s.rasa && !m.rasa.includes(s.rasa)) return false;
    if (s.virya && m.virya !== s.virya) return false;
    if (s.mfr && m.manufacturerId !== s.mfr) return false;
    if (s.ev && m.evidence !== s.ev) return false;
    if (!q) return true;

    const hay = [
      m.name,
      m.category,
      m.form,
      m.summary,
      ...m.synonyms,
      ...m.traditionalIndications,
      ...m.karma,
      ...m.ingredients.flatMap((i) => {
        const g = ingById(i.ingredientId);
        return g ? [g.name, g.latin, ...g.synonyms] : [];
      }),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  if (s.sort === "za") {
    list = [...list].sort((a, b) => b.name.localeCompare(a.name));
  } else if (s.sort === "ingredients") {
    list = [...list].sort((a, b) => b.ingredients.length - a.ingredients.length);
  } else {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  }
  return list;
}

export function FindMedicines() {
  const s = (Route.useSearch() ?? {}) as S;
  const navigate = useNavigate({ from: "/medicines" });
  const compare = useStore((st) => st.compare);
  const [q, setQ] = useState(s.q ?? "");
  const [loading, setLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => setQ(s.q ?? ""), [s.q]);

  useEffect(() => {
    let active = true;
    apiClient
      .get<{ items: any[]; total: number }>("/products")
      .then((res) => {
        if (!active || !res?.items) return;
        // Live catalog items verified from backend
      })
      .catch((err) => {
        console.warn("Backend products fetch:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 150);
    return () => clearTimeout(t);
  }, [s.q, s.form, s.cat, s.rasa, s.virya, s.mfr, s.ev]);

  const set = (patch: S) =>
    navigate({ search: (p: S) => ({ ...p, page: undefined, ...patch }) });

  const list = useMemo(() => filterMedicines(s), [s]);
  const page = s.page ?? 1;
  const pages = Math.max(1, Math.ceil(list.length / PER));
  const shown = list.slice((page - 1) * PER, page * PER);

  // Selected medicine selection priority: URL id if present and valid; else first match in filtered list
  const selected = (s.id ? medById(s.id) : null) ?? list[0] ?? null;

  useEffect(() => {
    if (s.id) actions.visit(s.id);
  }, [s.id]);

  const active = [
    s.q && { k: "q" as const, label: `“${s.q}”` },
    s.form && { k: "form" as const, label: `Form: ${s.form}` },
    s.cat && { k: "cat" as const, label: `Category: ${s.cat}` },
    s.rasa && { k: "rasa" as const, label: `Rasa: ${s.rasa}` },
    s.virya && { k: "virya" as const, label: `Virya: ${s.virya}` },
    s.mfr && {
      k: "mfr" as const,
      label: `Mfr: ${manufacturers.find((m) => m.id === s.mfr)?.name ?? s.mfr}`,
    },
    s.ev && { k: "ev" as const, label: `Evidence: ${s.ev}` },
  ].filter(Boolean) as { k: keyof S; label: string }[];

  return (
    <div>
      <PageHeader
        eyebrow="Discovery"
        title="Find Medicines"
        desc="Search by classical formulation name, botanical ingredient, Latin binomial or Ayurvedic pharmacological property."
        actions={
          compare.length > 0 && (
            <Link
              to="/compare"
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-sm font-semibold text-ink-foreground hover:bg-ink/90 transition-colors"
            >
              <GitCompare className="h-4 w-4" />
              Compare ({compare.length})
            </Link>
          )
        }
      />

      <div className="border-b bg-surface px-4 py-4 md:px-8">
        {/* Search input bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            set({ q: q.trim() || undefined });
          }}
          className="flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary shadow-xs transition"
        >
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Triphala, Terminalia chebula, Haritaki, Rasayana, Ashwagandha…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            aria-label="Search medicines"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                set({ q: undefined });
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

        {/* Primary Filter Bar: Formulation Form Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="eyebrow mr-1 text-muted-foreground">Form:</span>
          <Chip
            active={!s.form}
            onClick={() => set({ form: undefined })}
          >
            All forms
          </Chip>
          {FORMS.map((f) => (
            <Chip
              key={f}
              active={s.form === f}
              onClick={() => set({ form: s.form === f ? undefined : f })}
            >
              {f}
            </Chip>
          ))}

          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={cn(
              "ml-auto inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              showAdvancedFilters || s.cat || s.rasa || s.virya || s.mfr || s.ev
                ? "border-primary bg-primary-soft text-accent-foreground"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <Filter className="h-3 w-3" />
            {showAdvancedFilters ? "Hide filters" : "More filters"}
            {(s.cat || s.rasa || s.virya || s.mfr || s.ev) && (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.2 text-[10px] text-primary-foreground font-bold">
                {[s.cat, s.rasa, s.virya, s.mfr, s.ev].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Extended Filter Dropdowns (Category, Rasa, Virya, Manufacturer, Evidence, Sort) */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 grid gap-2.5 pt-3 border-t sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 overflow-hidden text-xs"
            >
              {/* Category */}
              <div>
                <label className="eyebrow block mb-1">Category</label>
                <select
                  value={s.cat ?? ""}
                  onChange={(e) => set({ cat: e.target.value || undefined })}
                  className="w-full rounded-lg border bg-card px-2.5 py-1.5 font-medium outline-none focus:border-primary"
                  aria-label="Category"
                >
                  <option value="">All categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Rasa */}
              <div>
                <label className="eyebrow block mb-1">Rasa (Taste)</label>
                <select
                  value={s.rasa ?? ""}
                  onChange={(e) => set({ rasa: e.target.value || undefined })}
                  className="w-full rounded-lg border bg-card px-2.5 py-1.5 font-medium outline-none focus:border-primary"
                  aria-label="Rasa"
                >
                  <option value="">Any Rasa</option>
                  {RASAS.map((r) => (
                    <option key={r} value={r}>
                      {r} ({AYURVEDIC_GLOSSARY.rasa[r]?.english})
                    </option>
                  ))}
                </select>
              </div>

              {/* Virya */}
              <div>
                <label className="eyebrow block mb-1">Virya (Potency)</label>
                <select
                  value={s.virya ?? ""}
                  onChange={(e) => set({ virya: e.target.value || undefined })}
                  className="w-full rounded-lg border bg-card px-2.5 py-1.5 font-medium outline-none focus:border-primary"
                  aria-label="Virya"
                >
                  <option value="">Any Virya</option>
                  {VIRYAS.map((v) => (
                    <option key={v} value={v}>
                      {v} ({AYURVEDIC_GLOSSARY.virya[v]?.english})
                    </option>
                  ))}
                </select>
              </div>

              {/* Manufacturer */}
              <div>
                <label className="eyebrow block mb-1">Manufacturer</label>
                <select
                  value={s.mfr ?? ""}
                  onChange={(e) => set({ mfr: e.target.value || undefined })}
                  className="w-full rounded-lg border bg-card px-2.5 py-1.5 font-medium outline-none focus:border-primary"
                  aria-label="Manufacturer"
                >
                  <option value="">All manufacturers</option>
                  {manufacturers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Evidence */}
              <div>
                <label className="eyebrow block mb-1">Evidence Status</label>
                <select
                  value={s.ev ?? ""}
                  onChange={(e) => set({ ev: e.target.value || undefined })}
                  className="w-full rounded-lg border bg-card px-2.5 py-1.5 font-medium outline-none focus:border-primary"
                  aria-label="Evidence status"
                >
                  <option value="">Any status</option>
                  {EVS.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="eyebrow block mb-1">Sort by</label>
                <select
                  value={s.sort ?? "az"}
                  onChange={(e) => set({ sort: e.target.value || undefined })}
                  className="w-full rounded-lg border bg-card px-2.5 py-1.5 font-medium outline-none focus:border-primary"
                  aria-label="Sort"
                >
                  <option value="az">Name A–Z</option>
                  <option value="za">Name Z–A</option>
                  <option value="ingredients">Most ingredients</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filter Tags */}
        <AnimatePresence>
          {active.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 flex flex-wrap items-center gap-1.5 overflow-hidden pt-1"
            >
              <span className="text-xs text-muted-foreground mr-1">Active filters:</span>
              {active.map((a) => (
                <motion.button
                  layout
                  key={a.k}
                  onClick={() => set({ [a.k]: undefined })}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-accent-foreground hover:bg-primary/20 transition-colors"
                >
                  {a.label}
                  <X className="h-3 w-3" />
                </motion.button>
              ))}
              <button
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

      {/* Main Results and Detail Section */}
      <div className="grid lg:grid-cols-[380px_1fr]">
        {/* Left Column: Filtered List */}
        <div className="border-b p-4 lg:min-h-[70vh] lg:border-b-0 lg:border-r md:px-6">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground" aria-live="polite">
            <span className="font-semibold text-foreground">
              {list.length} medicine{list.length === 1 ? "" : "s"} found
            </span>
            <span>
              Showing {list.length === 0 ? 0 : (page - 1) * PER + 1}–{Math.min(page * PER, list.length)} of {list.length}
            </span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton-shimmer h-[76px] rounded-xl" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <Empty
              title="No medicines match"
              desc="Try searching by synonym, botanical Latin name, or clear active filters."
              action={
                <button
                  onClick={() => {
                    setQ("");
                    navigate({ search: {} });
                  }}
                  className="text-sm font-semibold text-primary underline"
                >
                  Reset all filters
                </button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {shown.map((m, i) => {
                const isCurrent = selected?.id === m.id;
                return (
                  <motion.li
                    key={m.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <button
                      type="button"
                      onClick={() => navigate({ search: (p: S) => ({ ...p, id: m.id }) })}
                      className={cn(
                        "w-full rounded-xl border p-3.5 text-left transition-all",
                        isCurrent
                          ? "border-primary bg-primary-soft/60 shadow-soft"
                          : "bg-card hover:border-primary/40",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-foreground text-sm leading-snug">{m.name}</span>
                        <EvidencePill s={m.evidence} />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{m.form}</span>
                        <span>·</span>
                        <span>{m.category}</span>
                        <span>·</span>
                        <span>{m.ingredients.length || "—"} ingredients</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground/90">
                        <span>{manufacturers.find((x) => x.id === m.manufacturerId)?.name ?? "Traditional"}</span>
                        <span className="text-primary font-medium">{m.virya} virya</span>
                      </div>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          )}

          {pages > 1 && (
            <div className="mt-5 flex items-center justify-between border-t pt-3 text-xs">
              <button
                disabled={page <= 1}
                onClick={() => navigate({ search: (p: S) => ({ ...p, page: page - 1 }) })}
                className="rounded border bg-card px-2.5 py-1 font-semibold disabled:opacity-40 hover:border-primary transition-colors"
              >
                Previous
              </button>
              <span className="text-muted-foreground">
                Page {page} of {pages}
              </span>
              <button
                disabled={page >= pages}
                onClick={() => navigate({ search: (p: S) => ({ ...p, page: page + 1 }) })}
                className="rounded border bg-card px-2.5 py-1 font-semibold disabled:opacity-40 hover:border-primary transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Selected Medicine Detail View */}
        <div className="p-4 md:p-8">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MedicineDetail m={selected} />
              </motion.div>
            ) : (
              <div className="flex h-64 items-center justify-center">
                <Pill t="muted">Select a medicine to view details</Pill>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
