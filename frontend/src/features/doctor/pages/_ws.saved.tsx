import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bookmark,
  BookOpen,
  Check,
  ExternalLink,
  FlaskConical,
  Folder,
  Leaf,
  Newspaper,
  Pill as PillIcon,
  Search,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Chip, Empty, PageHeader, Pill, inputCls } from "@/components/ui-kit";
import { clinicalCases, ingById, medById, refById, journalById } from "@/lib/mock-data";
import { getState, setState, useStore, type Saved } from "@/lib/store";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_ws/saved")({
  head: () =>
    seo(
      "Saved Items & Bookmarks",
      "Your private repository of bookmarked Ayurvedic medicines, classical references, botanical ingredients and clinical cases.",
    ),
  component: SavedPage,
});

interface ItemMeta {
  title: string;
  subtitle: string;
  linkTo?: string;
  linkSearch?: Record<string, string>;
  icon: typeof PillIcon;
}

export function getItemMeta(s: Saved): ItemMeta {
  if (s.kind === "medicine") {
    const m = medById(s.id);
    return {
      title: m?.name ?? s.id,
      subtitle: m ? `${m.form} · ${m.category}` : "Commercial formulation",
      icon: PillIcon,
    };
  }

  if (s.kind === "reference") {
    const r = refById(s.id);
    return {
      title: r ? `${r.code} · ${r.entry}` : s.id,
      subtitle: r ? `${r.title} (${r.provenance})` : "Classical treatise monograph",
      linkTo: "/library",
      linkSearch: { ref: s.id },
      icon: BookOpen,
    };
  }

  if (s.kind === "ingredient") {
    const ing = ingById(s.id);
    return {
      title: ing?.name ?? s.id,
      subtitle: ing ? `${ing.latin} · ${ing.part}` : "Botanical single herb",
      icon: Leaf,
    };
  }

  if (s.kind === "publication") {
    const list = getState().publications;
    const pub = list.find((p) => p.id === s.id);
    return {
      title: pub ? pub.title : s.id,
      subtitle: pub ? `${pub.type} · ${pub.author.name}` : "Community publication",
      linkTo: "/community",
      linkSearch: { id: s.id },
      icon: BookOpen,
    };
  }

  if (s.kind === "journal") {
    const j = journalById(s.id);
    return {
      title: j ? j.title : s.id,
      subtitle: j ? `${j.journal} (${j.year}) · ${j.provider}` : "Scientific journal article",
      linkTo: "/journals",
      linkSearch: { id: s.id },
      icon: Newspaper,
    };
  }

  // Clinical Case
  const c = clinicalCases.find((x) => x.id === s.id);
  return {
    title: c ? c.title : s.id,
    subtitle: c ? `${c.condition} · Patient ${c.patientCode}` : "Clinical observational record",
    linkTo: "/cases",
    linkSearch: { id: s.id },
    icon: Stethoscope,
  };
}

export function filterSavedItems(
  saved: Saved[],
  opts: { q?: string; collection?: string | null; kind?: Saved["kind"] | null } = {},
) {
  const { q = "", collection = null, kind = null } = opts;
  return saved.filter((s) => {
    const meta = getItemMeta(s);
    const matchesCol = !collection || s.collection === collection;
    const matchesKind = !kind || s.kind === kind;
    if (!matchesCol || !matchesKind) return false;

    if (!q.trim()) return true;
    const hay = `${meta.title} ${meta.subtitle} ${s.collection} ${s.note}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });
}

export function SavedPage() {
  const saved = useStore((s) => s.saved);
  const [q, setQ] = useState("");
  const [col, setCol] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<Saved["kind"] | null>(null);

  const cols = useMemo(() => [...new Set(saved.map((s) => s.collection).filter(Boolean))], [saved]);

  const list = useMemo(() => {
    return filterSavedItems(saved, { q, collection: col, kind: kindFilter });
  }, [saved, col, kindFilter, q]);

  const upd = (id: string, patch: Partial<Saved>) => {
    setState((st) => ({
      saved: st.saved.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  };

  const removeSaved = (id: string, title: string) => {
    setState((st) => ({
      saved: st.saved.filter((x) => x.id !== id),
    }));
    toast.success(`Removed “${title}” from saved items`);
  };

  const clearAllFilters = () => {
    setQ("");
    setCol(null);
    setKindFilter(null);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Clinical Workspace"
        title="Saved Items"
        desc={`${saved.length} item${saved.length === 1 ? "" : "s"} bookmarked across ${cols.length || 1} collection${cols.length === 1 ? "" : "s"}.`}
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* Search and Category Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-surface/60 p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-1.5 shadow-xs focus-within:border-primary">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search saved items or notes…"
                className="bg-transparent text-xs outline-none w-48 sm:w-60"
                aria-label="Search saved items"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Type Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="eyebrow text-muted-foreground mr-1">Type:</span>
              <Chip active={!kindFilter} onClick={() => setKindFilter(null)}>
                All ({saved.length})
              </Chip>
              <Chip
                active={kindFilter === "medicine"}
                onClick={() => setKindFilter(kindFilter === "medicine" ? null : "medicine")}
              >
                Medicines ({saved.filter((s) => s.kind === "medicine").length})
              </Chip>
              <Chip
                active={kindFilter === "reference"}
                onClick={() => setKindFilter(kindFilter === "reference" ? null : "reference")}
              >
                References ({saved.filter((s) => s.kind === "reference").length})
              </Chip>
              <Chip
                active={kindFilter === "ingredient"}
                onClick={() => setKindFilter(kindFilter === "ingredient" ? null : "ingredient")}
              >
                Ingredients ({saved.filter((s) => s.kind === "ingredient").length})
              </Chip>
              <Chip
                active={kindFilter === "case"}
                onClick={() => setKindFilter(kindFilter === "case" ? null : "case")}
              >
                Cases ({saved.filter((s) => s.kind === "case").length})
              </Chip>
              <Chip
                active={kindFilter === "publication"}
                onClick={() => setKindFilter(kindFilter === "publication" ? null : "publication")}
              >
                Publications ({saved.filter((s) => s.kind === "publication").length})
              </Chip>
              <Chip
                active={kindFilter === "journal"}
                onClick={() => setKindFilter(kindFilter === "journal" ? null : "journal")}
              >
                Journals ({saved.filter((s) => s.kind === "journal").length})
              </Chip>
            </div>
          </div>

          {/* Collections Selector */}
          {cols.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="eyebrow text-muted-foreground mr-1 flex items-center gap-1">
                <Folder className="h-3 w-3" /> Collection:
              </span>
              <Chip active={!col} onClick={() => setCol(null)}>
                All
              </Chip>
              {cols.map((c) => (
                <Chip key={c} active={col === c} onClick={() => setCol(col === c ? null : c)}>
                  {c}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {/* Content List */}
        {list.length === 0 ? (
          <Empty
            title={saved.length === 0 ? "No items saved yet" : "No saved items match your filter"}
            desc={
              saved.length === 0
                ? "Click the 'Save' bookmark button on any Medicine, Classical Reference, Botanical Ingredient, or Clinical Case to save it here for fast clinical reference."
                : "Try clearing your search query or choosing another category or collection filter."
            }
            action={
              saved.length > 0 ? (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-semibold text-primary underline"
                >
                  Clear all filters
                </button>
              ) : (
                <Link
                  to="/library"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-ink-foreground hover:bg-ink/90 transition-colors"
                >
                  Explore Classical Library
                </Link>
              )
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((s) => {
              const meta = getItemMeta(s);
              const Icon = meta.icon;
              return (
                <li
                  key={s.id}
                  className="panel p-5 flex flex-col justify-between hover:border-primary/40 transition-colors group shadow-2xs"
                >
                  <div>
                    {/* Header: Kind Pill & Remove Button */}
                    <div className="flex items-start justify-between gap-2">
                      <Pill t="orange" className="capitalize text-[10px]">
                        <Icon className="h-3 w-3" />
                        {s.kind}
                      </Pill>
                      <button
                        type="button"
                        aria-label={`Remove ${meta.title} from saved items`}
                        onClick={() => removeSaved(s.id, meta.title)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                        title="Remove bookmark"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Title and Deep Link */}
                    <div className="mt-3">
                      {s.kind === "medicine" ? (
                        <div className="font-bold text-sm text-foreground">
                          <span className="line-clamp-1">{meta.title}</span>
                        </div>
                      ) : s.kind === "reference" ? (
                        <Link
                          to="/library"
                          search={{ ref: s.id }}
                          className="font-bold text-sm text-foreground hover:text-primary transition-colors flex items-center justify-between group-hover:underline"
                        >
                          <span className="line-clamp-1">{meta.title}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ) : s.kind === "ingredient" ? (
                        <div className="font-bold text-sm text-foreground">
                          <span className="line-clamp-1">{meta.title}</span>
                        </div>
                      ) : s.kind === "publication" ? (
                        <Link
                          to="/community"
                          search={{ id: s.id }}
                          className="font-bold text-sm text-foreground hover:text-primary transition-colors flex items-center justify-between group-hover:underline"
                        >
                          <span className="line-clamp-1">{meta.title}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ) : s.kind === "journal" ? (
                        <Link
                          to="/journals"
                          search={{ id: s.id }}
                          className="font-bold text-sm text-foreground hover:text-primary transition-colors flex items-center justify-between group-hover:underline"
                        >
                          <span className="line-clamp-1">{meta.title}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ) : (
                        <Link
                          to="/cases"
                          search={{ id: s.id }}
                          className="font-bold text-sm text-foreground hover:text-primary transition-colors flex items-center justify-between group-hover:underline"
                        >
                          <span className="line-clamp-1">{meta.title}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {meta.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Notes & Collection Controls */}
                  <div className="mt-4 border-t pt-3 space-y-2 text-xs">
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <div>
                        <label htmlFor={`col-${s.id}`} className="sr-only">
                          Collection
                        </label>
                        <input
                          id={`col-${s.id}`}
                          aria-label="Collection tag"
                          className={cn(inputCls, "text-xs py-1 px-2")}
                          value={s.collection}
                          onChange={(e) => upd(s.id, { collection: e.target.value })}
                          placeholder="Collection"
                        />
                      </div>
                      <div>
                        <label htmlFor={`note-${s.id}`} className="sr-only">
                          Clinical note
                        </label>
                        <input
                          id={`note-${s.id}`}
                          aria-label="Clinical note"
                          placeholder="Add clinical note…"
                          className={cn(inputCls, "text-xs py-1 px-2")}
                          value={s.note}
                          onChange={(e) => upd(s.id, { note: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
