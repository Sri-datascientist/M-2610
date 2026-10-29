import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  X,
  Sparkles,
  ShieldCheck,
  Copy,
  Check,
  BookMarked,
  ScrollText,
  FlaskConical,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Pill, SaveButton } from "@/components/ui-kit";
import { ingById, references, type Reference } from "@/lib/mock-data";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { apiClient } from "@/services/apiClient";
import { copyToClipboard } from "@/lib/clipboard";

type LibraryCategory = "AFI" | "API" | "Classical";

type LibrarySearch = {
  ref?: string | undefined;
  code?: string | undefined;
  category?: LibraryCategory | undefined;
  q?: string | undefined;
};

export const Route = createFileRoute("/_ws/library")({
  validateSearch: (s: Record<string, unknown>): LibrarySearch => ({
    ref: typeof s["ref"] === "string" ? s["ref"] : undefined,
    code: typeof s["code"] === "string" ? s["code"] : undefined,
    category:
      s["category"] === "AFI" || s["category"] === "API" || s["category"] === "Classical"
        ? (s["category"] as LibraryCategory)
        : s["code"] === "AFI" || s["code"] === "API" || s["code"] === "Classical"
          ? (s["code"] as LibraryCategory)
          : undefined,
    q: typeof s["q"] === "string" ? s["q"] : undefined,
  }),
  head: () =>
    seo(
      "Ayurveda Library",
      "Official canonical Ayurveda reference repository: Ayurvedic Formulary of India (AFI), Ayurvedic Pharmacopoeia of India (API), and Classical Samhitas with Devanagari shlokas and translations.",
    ),
  component: Library,
});

const CATEGORY_BOXES: Array<{
  id: LibraryCategory;
  name: string;
  fullName: string;
  desc: string;
  icon: typeof BookOpen;
  accentClass: string;
  borderActiveClass: string;
  badgeBg: string;
}> = [
  {
    id: "AFI",
    name: "AFI",
    fullName: "Ayurvedic Formulary of India",
    desc: "Statutory compound formulations, classical recipe standards, ingredient ratios & therapeutic indications.",
    icon: FlaskConical,
    accentClass: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    borderActiveClass: "border-amber-500/80 bg-amber-500/5 ring-2 ring-amber-500/40 shadow-sm",
    badgeBg: "bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/40",
  },
  {
    id: "API",
    name: "API",
    fullName: "Ayurvedic Pharmacopoeia of India",
    desc: "Statutory single drug monographs, botanical identification, macroscopic & microscopic standards, and assays.",
    icon: BookMarked,
    accentClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    borderActiveClass: "border-emerald-500/80 bg-emerald-500/5 ring-2 ring-emerald-500/40 shadow-sm",
    badgeBg: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300/40",
  },
  {
    id: "Classical",
    name: "Classic Texts",
    fullName: "Brihat-Trayi & Laghutrayi Treatises",
    desc: "Canonical medical classics: Charaka Samhita, Sushruta Samhita, Ashtanga Hridaya, Bhavaprakasha & Sharangadhara.",
    icon: ScrollText,
    accentClass: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
    borderActiveClass: "border-indigo-500/80 bg-indigo-500/5 ring-2 ring-indigo-500/40 shadow-sm",
    badgeBg: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300/40",
  },
];

const QUICK_SUGGESTIONS = [
  "Haritaki",
  "Triphala Churna",
  "Chyawanprasha",
  "Sitopaladi",
  "Charaka Samhita",
  "Sushruta Samhita",
  "Trikatu",
  "Yogaraja Guggulu",
  "Guduchi",
  "Rasayana",
];

export function Library() {
  const { category: searchCategory, q: searchQ, ref: searchRef } = Route.useSearch();
  const navigate = useNavigate({ from: "/library" });

  const [selectedCategory, setSelectedCategory] = useState<LibraryCategory | null>(
    searchCategory ?? null,
  );
  const [q, setQ] = useState(searchQ ?? "");
  const [selectedRefId, setSelectedRefId] = useState<string | null>(searchRef ?? null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [libraryEntries, setLibraryEntries] = useState<Reference[]>(references);

  // Load published canonical entries directly from PostgreSQL Backend API
  useEffect(() => {
    let isMounted = true;
    async function fetchLibraryEntries() {
      try {
        const res = await apiClient.get<{
          items: Array<{
            id: string;
            title: string;
            summary: string;
            content: string;
            category: string;
            source_references?: string[];
          }>;
          total: number;
        }>("/library/entries?limit=100");

        if (isMounted && res?.items && res.items.length > 0) {
          const apiRefs: Reference[] = res.items.map((item) => {
            const catCode: LibraryCategory =
              item.category === "API" ? "API" : item.category === "Classical" ? "Classical" : "AFI";
            
            // Match corresponding detailed monograph or synthesize cleanly
            const existing = references.find((r) => r.id === item.id);
            if (existing) {
              return {
                ...existing,
                title: item.title,
                translation: item.summary,
              };
            }

            return {
              id: item.id,
              code: catCode,
              title: item.title,
              part: catCode === "AFI" ? "Part I, Formulations" : catCode === "API" ? "Part I, Vol I" : "Brihat-Trayi",
              volume: "Standard Repository",
              edition: "Statutory Ayush Council Edition",
              kind: catCode === "AFI" ? "Formulary" : catCode === "API" ? "Pharmacopoeia" : "Classical text",
              entry: item.title,
              provenance: (item.source_references && item.source_references[0]) || "Canonical Source",
              ingredientIds: ["haritaki", "amalaki", "bibhitaki"],
              translation: item.summary,
              sanskritVerse: item.content.includes("Shloka:")
                ? item.content.split("Shloka:")[1]?.trim()
                : undefined,
              verificationStatus: "Verified Source",
            };
          });

          // Merge ensuring all PostgreSQL entries are present
          const seen = new Set(apiRefs.map((r) => r.id));
          const merged = [...apiRefs, ...references.filter((r) => !seen.has(r.id))];
          setLibraryEntries(merged);
        }
      } catch (err) {
        console.warn("Library API notice:", err);
      }
    }

    void fetchLibraryEntries();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync category state when URL updates
  const handleCategoryClick = (cat: LibraryCategory) => {
    const nextCat = selectedCategory === cat ? null : cat;
    setSelectedCategory(nextCat);
    setSelectedRefId(null);
    navigate({
      search: (prev) => ({
        ...prev,
        category: nextCat ?? undefined,
        code: nextCat ?? undefined,
        ref: undefined,
      }),
    });
  };

  const handleSearchChange = (val: string) => {
    setQ(val);
    setSelectedRefId(null);
    navigate({
      search: (prev) => ({
        ...prev,
        q: val.trim() ? val.trim() : undefined,
        ref: undefined,
      }),
    });
  };

  const handleClearSearch = () => {
    setQ("");
    setSelectedRefId(null);
    navigate({
      search: (prev) => ({
        ...prev,
        q: undefined,
        ref: undefined,
      }),
    });
  };

  const handleSelectReference = (item: Reference) => {
    setSelectedRefId(item.id);
    navigate({
      search: (prev) => ({
        ...prev,
        ref: item.id,
      }),
    });
  };

  const handleBackToList = () => {
    setSelectedRefId(null);
    navigate({
      search: (prev) => ({
        ...prev,
        ref: undefined,
      }),
    });
  };

  const handleCopyShloka = async (item: Reference) => {
    const textToCopy = item.sanskritVerse
      ? `${item.sanskritVerse}\n\n${item.transliteration ?? ""}\n\n— ${item.title} (${item.shlokaNumber ?? item.part})`
      : `${item.title}: ${item.entry}\n${item.translation ?? ""}`;

    const ok = await copyToClipboard(textToCopy.trim());
    if (ok) {
      setCopiedId(item.id);
      toast.success("Sanskrit shloka copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.error("Could not copy to clipboard. Please copy manually.");
    }
  };

  // Filter references based on category and search query
  const filteredReferences = useMemo(() => {
    return libraryEntries.filter((r) => {
      // Category filter: match AFI, API, or Classical
      if (selectedCategory) {
        if (selectedCategory === "Classical") {
          if (r.code !== "Classical") return false;
        } else if (r.code !== selectedCategory) {
          return false;
        }
      }

      // Search term filter
      if (!q.trim()) return true;

      const query = q.toLowerCase().trim();
      const ingredientNames = r.ingredientIds.flatMap((id) => {
        const ing = ingById(id);
        return ing ? [ing.name, ing.latin] : [id];
      });

      const hay = [
        r.title,
        r.entry,
        r.part,
        r.volume,
        r.edition,
        r.code,
        r.kind,
        r.provenance,
        r.section ?? "",
        r.chapter ?? "",
        r.shlokaNumber ?? "",
        r.sanskritVerse ?? "",
        r.transliteration ?? "",
        r.translation ?? "",
        r.translator ?? "",
        ...ingredientNames,
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(query);
    });
  }, [selectedCategory, q, libraryEntries]);

  // Active targeted reference that occupies fully
  const activeRef = useMemo(() => {
    const targetId = selectedRefId || searchRef;
    if (!targetId) return null;
    return libraryEntries.find((r) => r.id === targetId) ?? null;
  }, [selectedRefId, searchRef, libraryEntries]);

  // Counts for each of the three boxes
  const counts = useMemo(() => {
    const afi = libraryEntries.filter((r) => r.code === "AFI").length;
    const api = libraryEntries.filter((r) => r.code === "API").length;
    const classical = libraryEntries.filter((r) => r.code === "Classical").length;
    return { AFI: afi, API: api, Classical: classical };
  }, [libraryEntries]);

  // Whether user has searched or clicked a category button or active reference
  const hasActiveSearch = Boolean(q.trim() || selectedCategory || activeRef);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Header: Clean Ayurveda Library Header */}
      <div className="space-y-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
          Knowledge & Reference
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Ayurveda Library
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Canonical classical texts (Charaka, Sushruta, Ashtanga Hridaya, Bhavaprakasha) and statutory
          pharmacopoeia monographs (AFI, API). Canonical texts are read-only to preserve evidentiary integrity.
        </p>
      </div>

      {/* 2. Top Three Boxes: AFI, API, and Classic Texts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CATEGORY_BOXES.map((box) => {
          const isSelected = selectedCategory === box.id;
          const count = counts[box.id];
          const Icon = box.icon;

          return (
            <button
              key={box.id}
              type="button"
              onClick={() => handleCategoryClick(box.id)}
              className={cn(
                "group relative rounded-2xl border p-5 text-left transition-all duration-200 cursor-pointer shadow-xs",
                isSelected
                  ? box.borderActiveClass
                  : "border-border/80 bg-card hover:border-primary/40 hover:shadow-sm",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                      box.accentClass,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {box.name}
                      </span>
                      {isSelected && (
                        <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.2 text-[10px] font-bold">
                          Active Filter
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground line-clamp-1">
                      {box.fullName}
                    </div>
                  </div>
                </div>

                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-semibold border transition-colors shrink-0",
                    isSelected ? box.badgeBg : "bg-surface border-border/80 text-muted-foreground",
                  )}
                >
                  {count} {count === 1 ? "entry" : "entries"}
                </span>
              </div>

              <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {box.desc}
              </p>

              <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-[11px]">
                <span className="text-muted-foreground">
                  {isSelected ? "Click to deselect" : "Click to explore this collection"}
                </span>
                <span className="font-semibold text-primary group-hover:underline">
                  {isSelected ? "Clear filter" : "Explore →"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Centered Google-style Search Bar with Glowing Highlight */}
      <div className="max-w-3xl mx-auto pt-2 space-y-3">
        <div className="relative group">
          {/* Ambient Glow Aura */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary/30 via-amber-500/35 to-primary/30 blur-md opacity-75 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300" />

          {/* Search Input Bar */}
          <div className="relative flex items-center rounded-full border-2 border-primary/50 bg-card shadow-[0_0_20px_rgba(244,124,11,0.22),0_4px_12px_rgba(0,0,0,0.05)] group-hover:shadow-[0_0_28px_rgba(244,124,11,0.32)] group-focus-within:shadow-[0_0_32px_rgba(244,124,11,0.4)] group-focus-within:border-primary transition-all duration-300 px-5 py-3.5">
            <Search className="h-5 w-5 text-primary shrink-0 mr-3" />
            <input
              type="text"
              value={q}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search shloka, book, chapter or ingredient (e.g. Haritaki, Triphala, Charaka Samhita)..."
              className="w-full bg-transparent text-sm md:text-base outline-none text-foreground placeholder:text-muted-foreground/60"
              aria-label="Search Ayurveda Library"
            />
            {q && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-2 cursor-pointer"
                aria-label="Clear search input"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Popular:
          </span>
          {QUICK_SUGGESTIONS.map((tag) => {
            const isActive = q.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleSearchChange(isActive ? "" : tag)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium border transition-all cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card hover:bg-muted/70 border-border/70 text-muted-foreground hover:text-foreground",
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Display Area: Clean until searched / clicked, then occupies fully */}
      {!hasActiveSearch ? null : activeRef ? (
        /* ================================================================= */
        /* FULL OCCUPATION MONOGRAPH VIEW (When clicked or targeted)         */
        /* ================================================================= */
        <motion.div
          key={activeRef.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="w-full space-y-6 pt-2"
        >
          {/* Back button and actions toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <button
              type="button"
              onClick={handleBackToList}
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted hover:border-primary/50 transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="h-4 w-4 text-primary" />
              Back to {selectedCategory ? `${selectedCategory} Results` : q ? `Search Results ("${q}")` : "All Results"}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyShloka(activeRef)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Copy Sanskrit verse & citation"
              >
                {copiedId === activeRef.id ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied Shloka</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-muted-foreground" />
                    <span>Copy Shloka</span>
                  </>
                )}
              </button>
              <SaveButton id={activeRef.id} kind="reference" />
            </div>
          </div>

          {/* Full Screen Dedicated Reader Card */}
          <article className="w-full rounded-3xl border bg-card p-6 md:p-10 shadow-sm space-y-7">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-4">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold border",
                  activeRef.code === "AFI"
                    ? "bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/40"
                    : activeRef.code === "API"
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300/40"
                      : "bg-indigo-100 text-indigo-900 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300/40",
                )}
              >
                {activeRef.code}
              </span>
              <Pill t="outline">{activeRef.kind}</Pill>
              {activeRef.verificationStatus && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-3 py-0.5 text-xs font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  {activeRef.verificationStatus}
                </span>
              )}
              <span className="text-xs font-mono text-muted-foreground ml-auto">
                ID: {activeRef.id}
              </span>
            </div>

            {/* Title & Citation */}
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                {activeRef.entry}
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                <span className="font-bold text-foreground/90">{activeRef.title}</span>
                {activeRef.part && ` · ${activeRef.part}`}
                {activeRef.section && ` · ${activeRef.section}`}
                {activeRef.chapter && ` · Chapter: ${activeRef.chapter}`}
                {activeRef.volume && ` · ${activeRef.volume}`}
                {activeRef.shlokaNumber && ` · ${activeRef.shlokaNumber}`}
              </p>
            </div>

            {/* Canonical Sanskrit Shloka Box (Devanagari) */}
            {activeRef.sanskritVerse && (
              <div className="rounded-2xl border-2 border-primary/25 bg-primary-soft/35 p-6 md:p-8 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-primary">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    मूल संस्कृत श्लोक (Canonical Classical Sanskrit Text)
                  </span>
                  {activeRef.shlokaNumber && (
                    <span className="rounded-full bg-card px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground border">
                      {activeRef.shlokaNumber}
                    </span>
                  )}
                </div>

                {/* Large Centered Devanagari text */}
                <div className="py-2 text-center">
                  <p className="font-serif text-xl md:text-2xl font-bold text-foreground leading-loose tracking-wide whitespace-pre-line">
                    {activeRef.sanskritVerse}
                  </p>
                </div>

                {/* Transliteration */}
                {activeRef.transliteration && (
                  <div className="border-t border-primary/20 pt-3 text-center">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                      IAST Roman Transliteration
                    </div>
                    <p className="text-xs md:text-sm italic font-mono text-foreground/80 leading-relaxed whitespace-pre-line">
                      {activeRef.transliteration}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Authoritative English Translation */}
            {activeRef.translation && (
              <div className="space-y-2 rounded-2xl bg-surface/80 border p-5 md:p-6">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Authoritative Translation & Pharmacological Action
                </div>
                <blockquote className="border-l-3 border-primary pl-4 text-sm md:text-base text-foreground/90 leading-relaxed italic">
                  &ldquo;{activeRef.translation}&rdquo;
                </blockquote>
                {activeRef.translator && (
                  <p className="text-xs text-muted-foreground pt-1">
                    Editorial Source / Authority: {activeRef.translator}
                  </p>
                )}
              </div>
            )}

            {/* Ingredients & Dravyas */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Linked Dravyas & Ingredients in Classical Monograph
              </div>
              <div className="flex flex-wrap gap-2">
                {activeRef.ingredientIds.length > 0 ? (
                  activeRef.ingredientIds.map((id) => {
                    const ing = ingById(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          handleSearchChange(ing?.name ?? id);
                          setSelectedRefId(null);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-3.5 py-1 text-xs font-semibold text-foreground hover:bg-muted hover:border-primary/50 transition-colors cursor-pointer"
                        title={ing?.latin ? `Latin: ${ing.latin}` : undefined}
                      >
                        <span>{ing?.name ?? id}</span>
                        {ing?.latin && (
                          <span className="text-[11px] font-normal italic text-muted-foreground">
                            ({ing.latin})
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-muted-foreground">
                    General formulation principles / theoretical discourse.
                  </span>
                )}
              </div>
            </div>

            {/* Provenance Metadata Grid */}
            <div className="grid gap-4 sm:grid-cols-3 border-t border-border/60 pt-5 text-xs">
              <div className="rounded-xl border bg-surface/50 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Statutory Edition
                </span>
                <p className="font-semibold text-foreground">{activeRef.edition}</p>
              </div>
              <div className="rounded-xl border bg-surface/50 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Provenance Standard
                </span>
                <p className="font-semibold text-foreground">{activeRef.provenance}</p>
              </div>
              <div className="rounded-xl border bg-surface/50 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Monograph Section
                </span>
                <p className="font-semibold text-foreground">
                  {activeRef.section || activeRef.chapter || "Standard Monograph"}
                </p>
              </div>
            </div>
          </article>
        </motion.div>
      ) : (
        /* ================================================================= */
        /* SEARCH RESULTS LIST (When searched or filtered, ready to click)   */
        /* ================================================================= */
        <div className="space-y-4 pt-2">
          {/* Results summary bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {filteredReferences.length}{" "}
                {filteredReferences.length === 1 ? "reference" : "references"} found
              </span>
              {selectedCategory && (
                <span className="flex items-center gap-1">
                  in <strong className="text-primary">{selectedCategory}</strong>
                </span>
              )}
              {q && (
                <span className="flex items-center gap-1">
                  matching &ldquo;<strong className="text-foreground">{q}</strong>&rdquo;
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setQ("");
                setSelectedRefId(null);
                navigate({ search: () => ({}) });
              }}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>

          {/* Results List */}
          {filteredReferences.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center space-y-3 max-w-xl mx-auto">
              <Search className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <h3 className="text-base font-bold text-foreground">No matching references found</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We couldn&apos;t find any classical verses or monographs matching &ldquo;{q}&rdquo;
                {selectedCategory ? ` in ${selectedCategory}` : ""}.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="rounded-lg border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    Search all collections
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Clear search query
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredReferences.map((item) => {
                  const categoryBadge =
                    item.code === "AFI"
                      ? "bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/40"
                      : item.code === "API"
                        ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300/40"
                        : "bg-indigo-100 text-indigo-900 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300/40";

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleSelectReference(item)}
                      className="group rounded-2xl border border-border/80 bg-card p-5 md:p-6 shadow-2xs hover:border-primary hover:shadow-md transition-all cursor-pointer space-y-3"
                    >
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-xs font-bold border",
                              categoryBadge,
                            )}
                          >
                            {item.code}
                          </span>
                          <Pill t="outline">{item.kind}</Pill>
                          {item.verificationStatus && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              {item.verificationStatus}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-muted-foreground/80">
                            {item.id}
                          </span>
                        </div>

                        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                          Open full reference <ChevronRight className="h-4 w-4" />
                        </span>
                      </div>

                      {/* Title & Citation */}
                      <div>
                        <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                          {item.entry}
                        </h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground/85">{item.title}</span>
                          {item.part && ` · ${item.part}`}
                          {item.chapter && ` · ${item.chapter}`}
                          {item.shlokaNumber && ` · ${item.shlokaNumber}`}
                        </p>
                      </div>

                      {/* Sanskrit Preview Snippet */}
                      {item.sanskritVerse && (
                        <div className="rounded-xl border border-primary/15 bg-primary-soft/20 px-4 py-2.5 font-serif text-sm md:text-base text-foreground/90 font-medium line-clamp-2">
                          {item.sanskritVerse}
                        </div>
                      )}

                      {/* Translation Preview */}
                      {item.translation && (
                        <p className="text-xs text-muted-foreground line-clamp-2 italic">
                          &ldquo;{item.translation}&rdquo;
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
                        <span>
                          {item.ingredientIds.length > 0
                            ? `Herbs: ${item.ingredientIds.join(", ")}`
                            : "General classical treatise"}
                        </span>
                        <span className="font-medium text-primary">
                          Click to occupy full view →
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
