import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Plus,
  BookOpen,
  Filter,
  X,
  FileText,
  BookmarkCheck,
  Bookmark,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Eye,
  ThumbsUp,
  AlertCircle,
  ShieldCheck,
  Clock,
  Send,
  Edit3,
  Calendar,
  Layers,
  Sparkles,
  Link as LinkIcon,
  RotateCcw,
  Flag,
  ArrowLeft,
  User,
  Paperclip,
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
import {
  INITIAL_PUBLICATIONS,
  PUBLICATION_CATEGORIES,
  pubById,
  type Publication,
  type PublicationCategory,
  type PublicationStatus,
  type PublicationType,
} from "@/lib/mock-data";
import { actions, getState, setState, today, uid, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export interface CommunitySearchParams {
  id?: string | undefined;
  tab?: "feed" | "my-publications" | "new" | undefined;
  type?: string | undefined;
  cat?: string | undefined;
  status?: string | undefined;
  q?: string | undefined;
  sort?: "newest" | "useful" | "title" | undefined;
}

export const Route = createFileRoute("/_ws/community")({
  validateSearch: (s: Record<string, unknown>): CommunitySearchParams => ({
    id: typeof s["id"] === "string" ? s["id"] : undefined,
    tab:
      s["tab"] === "feed" || s["tab"] === "my-publications" || s["tab"] === "new"
        ? (s["tab"] as CommunitySearchParams["tab"])
        : undefined,
    type: typeof s["type"] === "string" ? s["type"] : undefined,
    cat: typeof s["cat"] === "string" ? s["cat"] : undefined,
    status: typeof s["status"] === "string" ? s["status"] : undefined,
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    sort:
      s["sort"] === "newest" || s["sort"] === "useful" || s["sort"] === "title"
        ? (s["sort"] as CommunitySearchParams["sort"])
        : undefined,
  }),
  head: () =>
    seo(
      "Doctor Community & Publications",
      "Peer knowledge platform for Ayurvedic physicians: clinical articles, journal reviews, and research insights.",
    ),
  component: CommunityPage,
});

export const PUBLICATION_TYPES: readonly PublicationType[] = [
  "Article",
  "Journal Reference",
  "Research Insight",
] as const;

export function filterCommunityFeed(
  list: Publication[],
  opts: {
    q?: string | undefined;
    type?: string | undefined;
    category?: string | undefined;
    sort?: "newest" | "useful" | "title" | undefined;
    includePrivateDraftsOfAuthor?: string | undefined;
  } = {},
): Publication[] {
  const { q = "", type, category, sort = "newest", includePrivateDraftsOfAuthor } = opts;
  const query = q.trim().toLowerCase();

  const filtered = list.filter((p) => {
    // Only published items appear in the public feed, unless explicitly requested for author sandbox
    if (p.status !== "Published") {
      if (!includePrivateDraftsOfAuthor || !p.author.isCurrentUser) {
        return false;
      }
    }

    if (type && type !== "All" && p.type !== type) return false;
    if (category && category !== "All" && p.category !== category) return false;

    if (!query) return true;

    const hay = [
      p.id,
      p.title,
      p.summary,
      p.category,
      p.author.name,
      p.author.institution ?? "",
      p.journalSource?.journalName ?? "",
      p.journalSource?.authors ?? "",
      ...(p.tags ?? []),
      ...(p.references ?? []),
    ]
      .join(" ")
      .toLowerCase();

    return hay.includes(query);
  });

  if (sort === "useful") {
    return [...filtered].sort((a, b) => b.usefulCount - a.usefulCount);
  }
  if (sort === "title") {
    return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
  }
  // Default newest
  return [...filtered].sort((a, b) => {
    const da = new Date(a.datePublished ?? a.dateCreated).getTime();
    const db = new Date(b.datePublished ?? b.dateCreated).getTime();
    return db - da;
  });
}

export function filterMyPublications(
  list: Publication[],
  opts: {
    status?: string | undefined;
    q?: string | undefined;
  } = {},
): Publication[] {
  const { status, q = "" } = opts;
  const query = q.trim().toLowerCase();

  return list.filter((p) => {
    // Only author's publications
    if (!p.author.isCurrentUser) return false;

    if (status && status !== "All" && p.status !== status) return false;

    if (!query) return true;
    const hay = `${p.id} ${p.title} ${p.summary} ${p.category} ${p.tags.join(" ")}`.toLowerCase();
    return hay.includes(query);
  });
}

interface AuthoringFormErrors {
  title?: string | undefined;
  summary?: string | undefined;
  content?: string | undefined;
  journalName?: string | undefined;
  journalAuthors?: string | undefined;
  privacy?: string | undefined;
}

export function CommunityPage() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate({ from: "/community" });
  const doctor = useStore((s) => s.doctor);
  const publications = useStore((s) => s.publications ?? INITIAL_PUBLICATIONS);
  const saved = useStore((s) => s.saved);

  // Active view: "feed" (default), "my-publications", or "new"
  const currentTab = searchParams.tab ?? "feed";
  const [q, setQ] = useState(searchParams.q ?? "");
  const [activeType, setActiveType] = useState<string>(searchParams.type ?? "All");
  const [activeCat, setActiveCat] = useState<string>(searchParams.cat ?? "All");
  const [activeSort, setActiveSort] = useState<CommunitySearchParams["sort"]>(
    searchParams.sort ?? "newest",
  );
  const [myStatusFilter, setMyStatusFilter] = useState<string>(searchParams.status ?? "All");
  const [filterDrawer, setFilterDrawer] = useState(false);
  const [reportModalPub, setReportModalPub] = useState<Publication | null>(null);

  // Sync internal state with URL query search
  useEffect(() => {
    setQ(searchParams.q ?? "");
    if (searchParams.type) setActiveType(searchParams.type);
    if (searchParams.cat) setActiveCat(searchParams.cat);
    if (searchParams.sort) setActiveSort(searchParams.sort);
    if (searchParams.status) setMyStatusFilter(searchParams.status);
  }, [searchParams.q, searchParams.type, searchParams.cat, searchParams.sort, searchParams.status]);

  const updateSearch = (patch: Partial<CommunitySearchParams>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...patch,
      }),
    });
  };

  // Selected publication for Detail View
  const selectedPub = useMemo(() => {
    if (!searchParams.id) return null;
    return publications.find((p) => p.id === searchParams.id) ?? null;
  }, [searchParams.id, publications]);

  // Feed list
  const feedList = useMemo(() => {
    return filterCommunityFeed(publications, {
      q,
      type: activeType === "All" ? undefined : activeType,
      category: activeCat === "All" ? undefined : activeCat,
      sort: activeSort,
    });
  }, [publications, q, activeType, activeCat, activeSort]);

  // My publications list
  const myList = useMemo(() => {
    return filterMyPublications(publications, {
      status: myStatusFilter === "All" ? undefined : myStatusFilter,
      q,
    });
  }, [publications, myStatusFilter, q]);

  // Authoring Form State for new or draft editing
  const [editingPubId, setEditingPubId] = useState<string | null>(null);
  const [formType, setFormType] = useState<PublicationType>("Article");
  const [formCategory, setFormCategory] = useState<Publication["category"]>("Formulations");
  const [formTitle, setFormTitle] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formReferences, setFormReferences] = useState("");
  const [formMethodology, setFormMethodology] = useState("");
  const [formLimitations, setFormLimitations] = useState("");
  const [formJournalName, setFormJournalName] = useState("");
  const [formJournalAuthors, setFormJournalAuthors] = useState("");
  const [formJournalYear, setFormJournalYear] = useState("2026");
  const [formJournalDoi, setFormJournalDoi] = useState("");
  const [formJournalUrl, setFormJournalUrl] = useState("");
  const [formErrors, setFormErrors] = useState<AuthoringFormErrors>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [acknowledgedPrivacy, setAcknowledgedPrivacy] = useState(false);

  const startNewPublication = (existing?: Publication) => {
    if (existing) {
      setEditingPubId(existing.id);
      setFormType(existing.type);
      setFormCategory(existing.category);
      setFormTitle(existing.title);
      setFormSummary(existing.summary);
      setFormContent(existing.content);
      setFormTags(existing.tags.join(", "));
      setFormReferences(existing.references.join("\n"));
      setFormMethodology(existing.methodology ?? "");
      setFormLimitations(existing.limitations ?? "");
      setFormJournalName(existing.journalSource?.journalName ?? "");
      setFormJournalAuthors(existing.journalSource?.authors ?? "");
      setFormJournalYear(String(existing.journalSource?.year ?? "2026"));
      setFormJournalDoi(existing.journalSource?.doi ?? "");
      setFormJournalUrl(existing.journalSource?.url ?? "");
    } else {
      setEditingPubId(null);
      setFormType("Article");
      setFormCategory("Formulations");
      setFormTitle("");
      setFormSummary("");
      setFormContent("");
      setFormTags("");
      setFormReferences("");
      setFormMethodology("");
      setFormLimitations("");
      setFormJournalName("");
      setFormJournalAuthors("");
      setFormJournalYear("2026");
      setFormJournalDoi("");
      setFormJournalUrl("");
    }
    setFormErrors({});
    setPreviewMode(false);
    setAcknowledgedPrivacy(false);
    updateSearch({ tab: "new", id: undefined });
  };

  const validateForm = () => {
    const errs: AuthoringFormErrors = {};
    if (!formTitle.trim()) errs.title = "Publication title is required.";
    else if (formTitle.trim().length < 10)
      errs.title = "Title should be at least 10 characters long.";

    if (!formSummary.trim()) errs.summary = "Executive summary is required.";
    else if (formSummary.trim().length < 20)
      errs.summary = "Provide a concise summary of at least 20 characters.";

    if (!formContent.trim()) errs.content = "Main content or review text is required.";
    else if (formContent.trim().length < 40)
      errs.content = "Body text must have sufficient context (minimum 40 characters).";

    if (formType === "Journal Reference") {
      if (!formJournalName.trim()) errs.journalName = "Journal / Publisher name is required.";
      if (!formJournalAuthors.trim()) errs.journalAuthors = "Primary authors citation is required.";
    }

    if (!acknowledgedPrivacy) {
      errs.privacy =
        "You must confirm that this text is completely de-identified and contains no patient data.";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveDraft = () => {
    if (!formTitle.trim()) {
      setFormErrors({ title: "Please provide a title before saving draft." });
      toast.error("Please provide a title to save draft.");
      return;
    }

    const pubId =
      editingPubId ?? `PUB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const parsedTags = formTags
      .split(/[,#]/)
      .map((t) => t.trim())
      .filter(Boolean);
    const parsedRefs = formReferences
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    const draftPub: Publication = {
      id: pubId,
      title: formTitle.trim(),
      summary: formSummary.trim() || "Draft in progress.",
      type: formType,
      status: "Draft",
      category: formCategory,
      tags: parsedTags.length > 0 ? parsedTags : [formCategory],
      author: {
        name: doctor.name,
        qualification: doctor.qualification,
        institution: doctor.institution,
        avatarInitials: doctor.initials,
        isCurrentUser: true,
      },
      dateCreated: today(),
      dateUpdated: today(),
      content: formContent.trim() || "## Draft Notes\nDraft content under author preparation.",
      references: parsedRefs,
      methodology:
        formType === "Research Insight" && formMethodology.trim()
          ? formMethodology.trim()
          : undefined,
      limitations:
        formType === "Research Insight" && formLimitations.trim()
          ? formLimitations.trim()
          : undefined,
      journalSource:
        formType === "Journal Reference" && formJournalName.trim()
          ? {
              journalName: formJournalName.trim(),
              authors: formJournalAuthors.trim() || doctor.name,
              year: parseInt(formJournalYear, 10) || 2026,
              doi: formJournalDoi.trim() || undefined,
              url: formJournalUrl.trim() || undefined,
              accessStatus: "External Citation Index",
            }
          : undefined,
      usefulCount: 0,
      viewsCount: 1,
      isPrototypeDemo: true,
    };

    actions.savePublication(draftPub);
    toast.success("Draft saved to your private publications workspace.");
    updateSearch({ tab: "my-publications", id: undefined });
  };

  const handleSubmitForReview = () => {
    if (!validateForm()) {
      toast.error("Please resolve highlighted validation errors.");
      return;
    }

    const pubId =
      editingPubId ?? `PUB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const parsedTags = formTags
      .split(/[,#]/)
      .map((t) => t.trim())
      .filter(Boolean);
    const parsedRefs = formReferences
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    const submittedPub: Publication = {
      id: pubId,
      title: formTitle.trim(),
      summary: formSummary.trim(),
      type: formType,
      status: "Submitted for Review",
      category: formCategory,
      tags: parsedTags.length > 0 ? parsedTags : [formCategory],
      author: {
        name: doctor.name,
        qualification: doctor.qualification,
        institution: doctor.institution,
        avatarInitials: doctor.initials,
        isCurrentUser: true,
      },
      dateCreated: today(),
      dateUpdated: today(),
      content: formContent.trim(),
      references: parsedRefs,
      methodology:
        formType === "Research Insight" && formMethodology.trim()
          ? formMethodology.trim()
          : undefined,
      limitations:
        formType === "Research Insight" && formLimitations.trim()
          ? formLimitations.trim()
          : undefined,
      journalSource:
        formType === "Journal Reference"
          ? {
              journalName: formJournalName.trim(),
              authors: formJournalAuthors.trim(),
              year: parseInt(formJournalYear, 10) || 2026,
              doi: formJournalDoi.trim() || undefined,
              url: formJournalUrl.trim() || undefined,
              accessStatus: "External Citation Index",
            }
          : undefined,
      usefulCount: 0,
      viewsCount: 1,
      isPrototypeDemo: true,
    };

    actions.savePublication(submittedPub);
    toast.success(
      "Publication submitted for editorial review. (Prototype simulation — remains in 'Submitted for Review' until peer assessment).",
    );
    updateSearch({ tab: "my-publications", id: undefined });
  };

  const copyPublicationLink = (pub: Publication) => {
    const url = `${window.location.origin}/community?id=${pub.id}`;
    navigator.clipboard?.writeText(url);
    toast.success("Publication link copied to clipboard");
  };

  // Count active author items
  const myDraftsCount = publications.filter(
    (p) => p.author.isCurrentUser && p.status === "Draft",
  ).length;
  const myReviewCount = publications.filter(
    (p) => p.author.isCurrentUser && p.status === "Submitted for Review",
  ).length;

  return (
    <div>
      <PageHeader
        eyebrow="Doctor-to-Doctor Knowledge Exchange"
        title="Doctor Community & Publications"
        desc="A shared professional knowledge platform to publish clinical articles, share journal citations, and discover observational insights contributed by fellow Ayurvedic doctors."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {currentTab !== "new" && (
              <Btn onClick={() => startNewPublication()}>
                <Plus className="h-4 w-4" />
                Share Your Knowledge
              </Btn>
            )}
          </div>
        }
      />

      {/* Main Container */}
      <div className="p-4 md:p-8 space-y-6">
        {/* Module Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateSearch({ tab: "feed", id: undefined })}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
                currentTab === "feed" && !selectedPub
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-card text-foreground hover:bg-muted border border-border",
              )}
            >
              <BookOpen className="h-4 w-4" />
              Community Feed
              <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-xs">
                {publications.filter((p) => p.status === "Published").length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => updateSearch({ tab: "my-publications", id: undefined })}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
                currentTab === "my-publications" && !selectedPub
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-card text-foreground hover:bg-muted border border-border",
              )}
            >
              <Edit3 className="h-4 w-4" />
              My Publications
              {(myDraftsCount > 0 || myReviewCount > 0) && (
                <span className="rounded-full bg-primary-soft text-primary-deep px-2 py-0.5 text-xs font-bold">
                  {myDraftsCount + myReviewCount}
                </span>
              )}
            </button>
          </div>

          {selectedPub && (
            <button
              type="button"
              onClick={() => updateSearch({ id: undefined })}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to {currentTab === "my-publications" ? "My Publications" : "Feed"}
            </button>
          )}
        </div>

        {/* ============================================================== */}
        {/* DETAIL VIEW (WHEN A PUBLICATION IS SELECTED)                   */}
        {/* ============================================================== */}
        {selectedPub ? (
          <div className="space-y-6">
            <div className="panel p-6 md:p-8 space-y-6">
              {/* Header Badges & Actions */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
                <div className="space-y-3 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill
                      t={
                        selectedPub.type === "Article"
                          ? "ink"
                          : selectedPub.type === "Journal Reference"
                            ? "orange"
                            : "warn"
                      }
                    >
                      {selectedPub.type}
                    </Pill>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {selectedPub.category}
                    </span>
                    {selectedPub.status !== "Published" && (
                      <Pill t="warn" className="border-amber-300">
                        {selectedPub.status}
                      </Pill>
                    )}
                    {selectedPub.isPrototypeDemo && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                        Demo Record
                      </span>
                    )}
                  </div>

                  <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight leading-snug">
                    {selectedPub.title}
                  </h1>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedPub.summary}
                  </p>
                </div>

                {/* Engagement & Save / Share Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <SaveButton id={selectedPub.id} kind="publication" />
                  <button
                    type="button"
                    onClick={() => {
                      actions.toggleUseful(selectedPub.id);
                      toast.success("Feedback recorded: Marked useful");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary/50 text-foreground"
                    title="Mark this publication as useful"
                  >
                    <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                    Useful ({selectedPub.usefulCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => copyPublicationLink(selectedPub)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary/50 text-foreground"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share Link
                  </button>
                  {selectedPub.author.isCurrentUser && selectedPub.status !== "Published" && (
                    <Btn variant="outline" onClick={() => startNewPublication(selectedPub)}>
                      <Edit3 className="h-3.5 w-3.5 mr-1" />
                      Edit Content
                    </Btn>
                  )}
                </div>
              </div>

              {/* Author & Journal Citation Meta */}
              <div className="grid gap-4 md:grid-cols-2 rounded-xl bg-surface/70 border border-border p-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-orange-gradient text-sm font-bold text-primary-foreground shadow-soft">
                    {selectedPub.author.avatarInitials}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      {selectedPub.author.name}
                      {selectedPub.author.isCurrentUser && (
                        <span className="text-[10px] font-semibold text-primary">(You)</span>
                      )}
                    </div>
                    <div className="text-muted-foreground">{selectedPub.author.qualification}</div>
                    {selectedPub.author.institution && (
                      <div className="text-[11px] text-muted-foreground font-medium">
                        {selectedPub.author.institution}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1 md:text-right flex flex-col justify-center">
                  <div className="text-muted-foreground">
                    Published:{" "}
                    <span className="font-semibold text-foreground">
                      {selectedPub.datePublished ?? selectedPub.dateCreated}
                    </span>
                  </div>
                  {selectedPub.dateUpdated !== selectedPub.dateCreated && (
                    <div className="text-[11px] text-muted-foreground">
                      Last revised: {selectedPub.dateUpdated}
                    </div>
                  )}
                  <div className="text-[11px] text-muted-foreground">
                    Visibility:{" "}
                    <span className="font-medium text-foreground">
                      {selectedPub.status === "Published"
                        ? "Registered Ayush Doctors Only"
                        : "Author Sandbox Only"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Journal Reference Banner if external */}
              {selectedPub.journalSource && (
                <div className="rounded-xl border border-primary/30 bg-primary-soft/40 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Original Journal Publication Details
                    </span>
                    <span className="rounded-full bg-primary/10 text-primary-deep font-semibold px-2.5 py-0.5 text-[11px]">
                      {selectedPub.journalSource.accessStatus}
                    </span>
                  </div>
                  <p className="text-foreground">
                    <span className="font-semibold">Citation: </span>
                    {selectedPub.journalSource.authors} ({selectedPub.journalSource.year}). "
                    {selectedPub.title}". <em>{selectedPub.journalSource.journalName}</em>.{" "}
                    {selectedPub.journalSource.volumeIssue}
                  </p>
                  {selectedPub.journalSource.doi && (
                    <p className="font-mono text-[11px] text-muted-foreground">
                      DOI: {selectedPub.journalSource.doi}
                    </p>
                  )}
                  {selectedPub.journalSource.url && (
                    <a
                      href={selectedPub.journalSource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline font-semibold pt-1"
                    >
                      Visit External Publisher Repository <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <p className="text-[11px] text-muted-foreground italic border-t border-primary/20 pt-1.5">
                    Notice: Mey Veda Grantha indexes open-access references and abstracts. Full text
                    rights remain with the respective journal publishers.
                  </p>
                </div>
              )}

              {/* Publication Body Content */}
              <div className="prose prose-sm max-w-none text-foreground leading-relaxed space-y-4">
                <div className="whitespace-pre-wrap font-sans text-sm md:text-base leading-relaxed bg-card p-4 rounded-xl border border-border">
                  {selectedPub.content}
                </div>
              </div>

              {/* Research Insight Methodology & Limitations if present */}
              {(selectedPub.methodology || selectedPub.limitations) && (
                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  {selectedPub.methodology && (
                    <div className="rounded-xl border border-primary/20 bg-primary-soft/30 p-4 space-y-1.5 text-xs">
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        Methodology & Observation Design
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedPub.methodology}
                      </p>
                    </div>
                  )}
                  {selectedPub.limitations && (
                    <div className="rounded-xl border border-amber-300/40 bg-amber-50/40 p-4 space-y-1.5 text-xs">
                      <div className="font-bold text-foreground flex items-center gap-1.5 text-amber-900">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                        Preliminary Boundaries & Limitations
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedPub.limitations}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* References Section */}
              {selectedPub.references && selectedPub.references.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Cited References & Classical Authorities
                  </h3>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground bg-surface/50 p-4 rounded-xl border border-border">
                    {selectedPub.references.map((ref, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <span className="text-foreground font-medium">{ref}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Tags & Taxonomy */}
              <div className="flex flex-wrap items-center gap-1.5 pt-4 border-t border-border">
                <span className="text-xs font-semibold text-muted-foreground mr-1">Tags:</span>
                {selectedPub.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-foreground border border-border"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Research Integrity & Non-Endorsement Disclaimer */}
              <div className="rounded-xl border border-border bg-surface p-4 text-xs text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Research Integrity & Clinical Safety Statement
                </div>
                <p>
                  Community contributions are authored by verified or credentialed Ayurvedic
                  physicians for peer clinical study. Publication within this portal does not
                  constitute statutory AYUSH validation, therapeutic endorsement, or evidence of
                  absolute clinical efficacy. Always apply personalized diagnostic reasoning (Yukti)
                  and institutional protocols.
                </p>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalPub(selectedPub)}
                  className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                >
                  <Flag className="h-3 w-3" /> Report Content or Misattribution
                </button>
                <Btn variant="outline" onClick={() => updateSearch({ id: undefined })}>
                  Close Detail
                </Btn>
              </div>
            </div>
          </div>
        ) : currentTab === "new" ? (
          /* ============================================================== */
          /* AUTHORING / CREATE PUBLICATION FORM                            */
          /* ============================================================== */
          <div className="panel p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
            <div className="border-b border-border pb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {editingPubId ? "Edit Publication" : "Create & Submit a Publication"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Share clinical knowledge, review an external journal citation, or publish an
                  observational insight.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="outline" onClick={() => setPreviewMode((prev) => !prev)}>
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  {previewMode ? "Edit Form" : "Preview"}
                </Btn>
                <Btn variant="ghost" onClick={() => updateSearch({ tab: "feed" })}>
                  <X className="h-4 w-4" />
                </Btn>
              </div>
            </div>

            {previewMode ? (
              /* LIVE PREVIEW SCREEN */
              <div className="space-y-4 border border-dashed border-primary/40 p-6 rounded-xl bg-surface/40">
                <div className="flex items-center gap-2">
                  <Pill t="orange">{formType}</Pill>
                  <span className="text-xs text-muted-foreground">{formCategory}</span>
                  <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[11px] font-bold">
                    Author Preview
                  </span>
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  {formTitle || "Untitled Publication"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {formSummary || "Summary will appear here."}
                </p>
                <div className="border-t border-border pt-3 whitespace-pre-wrap text-sm leading-relaxed">
                  {formContent || "Body text preview..."}
                </div>
                {formType === "Research Insight" && (formMethodology || formLimitations) && (
                  <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-border text-xs">
                    {formMethodology && (
                      <div className="bg-card p-3 rounded-lg border border-border">
                        <div className="font-bold text-foreground">Methodology</div>
                        <p className="text-muted-foreground mt-0.5">{formMethodology}</p>
                      </div>
                    )}
                    {formLimitations && (
                      <div className="bg-card p-3 rounded-lg border border-border">
                        <div className="font-bold text-foreground">Limitations</div>
                        <p className="text-muted-foreground mt-0.5">{formLimitations}</p>
                      </div>
                    )}
                  </div>
                )}
                <div className="text-xs text-muted-foreground pt-2">
                  Author attribution: <span className="font-semibold">{doctor.name}</span> (
                  {doctor.qualification})
                </div>
              </div>
            ) : (
              /* INPUT FORM */
              <div className="space-y-5">
                {/* Publication Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Publication Type *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PUBLICATION_TYPES.map((pt) => (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => setFormType(pt)}
                        className={cn(
                          "rounded-xl border p-3.5 text-left transition-all",
                          formType === pt
                            ? "border-primary bg-primary-soft/40 shadow-soft ring-1 ring-primary"
                            : "border-border bg-card hover:bg-surface",
                        )}
                      >
                        <div className="font-semibold text-sm text-foreground">{pt}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {pt === "Article" && "Original clinical review or practice paper"}
                          {pt === "Journal Reference" && "Indexed peer-reviewed citation & review"}
                          {pt === "Research Insight" &&
                            "Practical observation or formulation takeaway"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category & Topic */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Topic / Domain Category *">
                    <select
                      className={inputCls}
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as Publication["category"])}
                    >
                      {PUBLICATION_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Search Tags / Keywords (comma-separated)"
                    hint="e.g. Triphala, Kwatha, Rasayana"
                  >
                    <input
                      className={inputCls}
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      placeholder="Triphala, Standardization, Dravyaguna"
                    />
                  </Field>
                </div>

                {/* Title */}
                <Field label="Publication Title *" error={formErrors.title}>
                  <input
                    className={inputCls}
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Standardization Metrics and Posology of Classical Kwatha"
                  />
                </Field>

                {/* Summary */}
                <Field
                  label="Executive Summary / Abstract *"
                  hint="A concise 2–3 sentence overview displayed on feed cards"
                  error={formErrors.summary}
                >
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    placeholder="Provide the core clinical insight or question addressed..."
                  />
                </Field>

                {/* Journal Reference Details if applicable */}
                {formType === "Journal Reference" && (
                  <div className="rounded-xl border border-primary/30 bg-primary-soft/30 p-4 space-y-4">
                    <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-primary" />
                      External Journal & Citation Metadata
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Journal Name *" error={formErrors.journalName}>
                        <input
                          className={inputCls}
                          value={formJournalName}
                          onChange={(e) => setFormJournalName(e.target.value)}
                          placeholder="e.g. Journal of Ethnopharmacology"
                        />
                      </Field>
                      <Field label="Primary Authors *" error={formErrors.journalAuthors}>
                        <input
                          className={inputCls}
                          value={formJournalAuthors}
                          onChange={(e) => setFormJournalAuthors(e.target.value)}
                          placeholder="e.g. Shastri R. et al."
                        />
                      </Field>
                      <Field label="Publication Year">
                        <input
                          type="number"
                          className={inputCls}
                          value={formJournalYear}
                          onChange={(e) => setFormJournalYear(e.target.value)}
                        />
                      </Field>
                      <Field label="DOI (Digital Object Identifier)">
                        <input
                          className={inputCls}
                          value={formJournalDoi}
                          onChange={(e) => setFormJournalDoi(e.target.value)}
                          placeholder="10.1016/j.jep.2026.04..."
                        />
                      </Field>
                    </div>
                    <Field label="Source Link (URL)">
                      <input
                        className={inputCls}
                        value={formJournalUrl}
                        onChange={(e) => setFormJournalUrl(e.target.value)}
                        placeholder="https://doi.org/..."
                      />
                    </Field>
                  </div>
                )}

                {/* Main Body Content */}
                <Field
                  label="Main Publication Body (Structured Markdown or Clinical Prose) *"
                  hint="Supports headings (## Heading), bullet points, and numbered sections"
                  error={formErrors.content}
                >
                  <textarea
                    rows={8}
                    className={cn(inputCls, "font-sans leading-relaxed")}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="## Clinical Context & Method&#10;Describe your observation, protocol, or findings here..."
                  />
                </Field>

                {/* Research Insight Methodology and Limitations */}
                {formType === "Research Insight" && (
                  <div className="rounded-xl border border-primary/30 bg-primary-soft/30 p-4 space-y-4">
                    <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Research Insight Methodology & Context
                    </div>
                    <Field
                      label="Methodology / Observation Design"
                      hint="e.g. Ambulatory patient cohort, dosage adaptation protocol, or extraction method"
                    >
                      <textarea
                        rows={2}
                        className={inputCls}
                        value={formMethodology}
                        onChange={(e) => setFormMethodology(e.target.value)}
                        placeholder="Describe the clinical context, cohort size, or formulation preparation approach..."
                      />
                    </Field>
                    <Field
                      label="Known Limitations / Preliminary Boundaries"
                      hint="e.g. Observational only, unblinded, non-randomized, or self-reported outcomes"
                    >
                      <textarea
                        rows={2}
                        className={inputCls}
                        value={formLimitations}
                        onChange={(e) => setFormLimitations(e.target.value)}
                        placeholder="Describe key limitations, preliminary boundaries, or need for controlled replication..."
                      />
                    </Field>
                  </div>
                )}

                {/* References */}
                <Field
                  label="Classical Treatise Authorities & References (one per line)"
                  hint="e.g. Charaka Samhita Chikitsa 1.1"
                >
                  <textarea
                    rows={3}
                    className={inputCls}
                    value={formReferences}
                    onChange={(e) => setFormReferences(e.target.value)}
                    placeholder="Charaka Samhita, Chikitsa Sthana 1&#10;Ayurvedic Pharmacopoeia of India Part II"
                  />
                </Field>

                {/* Author attribution display */}
                <div className="rounded-xl border border-border bg-surface p-3.5 text-xs text-muted-foreground flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span>
                      Attributed Author: <b className="text-foreground">{doctor.name}</b> (
                      {doctor.qualification}, {doctor.institution})
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Signed-in credentials
                  </span>
                </div>

                {/* Privacy & Non-Patient Notice Checkbox */}
                <div className="rounded-xl border border-amber-300 bg-amber-50/40 p-4 space-y-2 text-xs">
                  <label className="flex items-start gap-2.5 cursor-pointer text-foreground font-medium">
                    <input
                      type="checkbox"
                      checked={acknowledgedPrivacy}
                      onChange={(e) => setAcknowledgedPrivacy(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span>
                      I verify that this publication contains NO identifiable patient information
                      (names, tokens, phone numbers, or unredacted hospital identifiers). This
                      information is safe for professional peer distribution.
                    </span>
                  </label>
                  {formErrors.privacy && (
                    <p className="text-destructive font-semibold text-xs pl-6">
                      {formErrors.privacy}
                    </p>
                  )}
                </div>

                {/* Form Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                  <Btn variant="outline" onClick={handleSaveDraft}>
                    Save Draft (Private to You)
                  </Btn>

                  <div className="flex items-center gap-2">
                    <Btn variant="ghost" onClick={() => updateSearch({ tab: "feed" })}>
                      Cancel
                    </Btn>
                    <Btn onClick={handleSubmitForReview}>
                      <Send className="h-4 w-4 mr-1.5" />
                      Submit for Editorial Review
                    </Btn>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : currentTab === "my-publications" ? (
          /* ============================================================== */
          /* MY PUBLICATIONS (AUTHOR WORKSPACE)                             */
          /* ============================================================== */
          <div className="space-y-6">
            {/* Status Tabs for My Publications */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-border">
              <div className="flex flex-wrap gap-1.5">
                {[
                  "All",
                  "Draft",
                  "Submitted for Review",
                  "Needs Changes",
                  "Published",
                  "Rejected",
                  "Withdrawn",
                ].map((st) => (
                  <Chip
                    key={st}
                    active={myStatusFilter === st}
                    onClick={() => {
                      setMyStatusFilter(st);
                      updateSearch({ status: st === "All" ? undefined : st });
                    }}
                  >
                    {st}
                  </Chip>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Btn onClick={() => startNewPublication()}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  New Publication
                </Btn>
              </div>
            </div>

            {/* List of Doctor's Publications */}
            {myList.length === 0 ? (
              <Empty
                title={
                  myStatusFilter === "All"
                    ? "No publications found in your account"
                    : `No publications with status "${myStatusFilter}"`
                }
                desc="Share clinical observations, formulate articles, or curate journal references with the doctor community."
                action={
                  <Btn onClick={() => startNewPublication()}>
                    <Plus className="h-4 w-4" /> Start a Publication
                  </Btn>
                }
              />
            ) : (
              <div className="grid gap-4">
                {myList.map((pub) => (
                  <div
                    key={pub.id}
                    className="panel p-5 space-y-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill
                            t={
                              pub.status === "Published"
                                ? "ink"
                                : pub.status === "Submitted for Review"
                                  ? "warn"
                                  : pub.status === "Draft"
                                    ? "muted"
                                    : "danger"
                            }
                          >
                            {pub.status}
                          </Pill>
                          <Pill t="outline">{pub.type}</Pill>
                          <span className="text-xs font-semibold text-muted-foreground">
                            {pub.category}
                          </span>
                        </div>
                        <h3
                          className="text-base font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
                          onClick={() => updateSearch({ id: pub.id })}
                        >
                          {pub.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{pub.summary}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {pub.status !== "Published" && (
                          <Btn variant="outline" onClick={() => startNewPublication(pub)}>
                            <Edit3 className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Btn>
                        )}
                        <Btn variant="ghost" onClick={() => updateSearch({ id: pub.id })}>
                          View Details
                        </Btn>
                      </div>
                    </div>

                    {/* Review Feedback if present */}
                    {pub.reviewFeedback && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900">
                        <span className="font-semibold">Reviewer Feedback: </span>
                        {pub.reviewFeedback}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border">
                      <div>
                        Created: {pub.dateCreated} · Last updated: {pub.dateUpdated}
                      </div>
                      <div className="flex items-center gap-3">
                        <span>Views: {pub.viewsCount}</span>
                        <span>Useful: {pub.usefulCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ============================================================== */
          /* COMMUNITY FEED (DISCOVERY VIEW)                                */
          /* ============================================================== */
          <div className="space-y-6">
            {/* Search, Filter & Sort Bar */}
            <div className="panel p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    className={cn(inputCls, "pl-10")}
                    placeholder="Search articles, journal references, topics, authors or keywords..."
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      updateSearch({ q: e.target.value || undefined });
                    }}
                    aria-label="Search community publications"
                  />
                  {q && (
                    <button
                      type="button"
                      onClick={() => {
                        setQ("");
                        updateSearch({ q: undefined });
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    className={cn(inputCls, "w-auto text-xs py-2 font-semibold")}
                    value={activeSort}
                    onChange={(e) => {
                      const s = e.target.value as CommunitySearchParams["sort"];
                      setActiveSort(s);
                      updateSearch({ sort: s });
                    }}
                    aria-label="Sort publications"
                  >
                    <option value="newest">Sort: Newest</option>
                    <option value="useful">Sort: Most Useful</option>
                    <option value="title">Sort: Alphabetical</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setFilterDrawer((f) => !f)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                      filterDrawer || activeType !== "All" || activeCat !== "All"
                        ? "border-primary bg-primary-soft text-primary-deep"
                        : "border-border bg-card hover:bg-muted",
                    )}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Filters
                    {(activeType !== "All" || activeCat !== "All") && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsible Filter Chips Bar */}
              <AnimatePresence>
                {(filterDrawer || activeType !== "All" || activeCat !== "All") && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-border pt-3 space-y-2.5 text-xs"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground w-24">Content Type:</span>
                      {["All", ...PUBLICATION_TYPES].map((type) => (
                        <Chip
                          key={type}
                          active={activeType === type}
                          onClick={() => {
                            setActiveType(type);
                            updateSearch({ type: type === "All" ? undefined : type });
                          }}
                        >
                          {type}
                        </Chip>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground w-24">Topic Domain:</span>
                      {["All", ...PUBLICATION_CATEGORIES].map((cat) => (
                        <Chip
                          key={cat}
                          active={activeCat === cat}
                          onClick={() => {
                            setActiveCat(cat);
                            updateSearch({ cat: cat === "All" ? undefined : cat });
                          }}
                        >
                          {cat}
                        </Chip>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Results Count & Disclaimers */}
            <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground px-1">
              <span>
                Showing <b>{feedList.length}</b> verified doctor publication(s)
              </span>
              <span className="font-mono text-[11px]">
                Phase 1 Prototype · Peer knowledge sharing only
              </span>
            </div>

            {/* Feed Cards Grid */}
            {feedList.length === 0 ? (
              <Empty
                title="No publications match your criteria"
                desc="Try clearing filters, searching for an ingredient (e.g. Triphala), or contribute the first article."
                action={
                  <Btn
                    variant="outline"
                    onClick={() => {
                      setQ("");
                      setActiveType("All");
                      setActiveCat("All");
                      updateSearch({ q: undefined, type: undefined, cat: undefined });
                    }}
                  >
                    Clear All Filters
                  </Btn>
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {feedList.map((pub) => {
                  return (
                    <div
                      key={pub.id}
                      className="panel p-5 flex flex-col justify-between hover:border-primary/50 transition-all card-hover group"
                    >
                      <div className="space-y-3">
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Pill
                              t={
                                pub.type === "Article"
                                  ? "ink"
                                  : pub.type === "Journal Reference"
                                    ? "orange"
                                    : "warn"
                              }
                            >
                              {pub.type}
                            </Pill>
                            <span className="text-[11px] font-semibold text-muted-foreground">
                              {pub.category}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {pub.datePublished}
                          </span>
                        </div>

                        {/* Title and Summary */}
                        <div className="space-y-1.5">
                          <h3
                            onClick={() => updateSearch({ id: pub.id })}
                            className="font-bold text-base text-foreground group-hover:text-primary transition-colors cursor-pointer line-clamp-2"
                          >
                            {pub.title}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                            {pub.summary}
                          </p>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {pub.tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Footer: Author Attribution & Action Buttons */}
                      <div className="pt-4 mt-3 border-t border-border flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-gradient text-[11px] font-bold text-primary-foreground">
                            {pub.author.avatarInitials}
                          </div>
                          <div className="truncate text-xs">
                            <div className="font-semibold text-foreground truncate">
                              {pub.author.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {pub.author.qualification}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <SaveButton id={pub.id} kind="publication" />
                          <Btn variant="ghost" onClick={() => updateSearch({ id: pub.id })}>
                            Open
                            <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                          </Btn>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Prototype Architecture & Privacy Notice */}
        <div className="rounded-xl border border-border bg-surface/70 p-4 space-y-1.5 text-xs text-muted-foreground">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Phase 1 Prototype Architecture & Authorization Disclosure
          </div>
          <p className="leading-relaxed">
            <strong>Local Storage & Isolation Boundary:</strong> In this frontend prototype, drafts
            and submissions are persisted within browser local storage. Client-side state filtering
            does not provide secure cryptographic multi-doctor isolation. In production, authoring,
            drafts, peer review workflows, and visibility enforcement require server-side
            authentication, role-based access control (RBAC), database persistence with audit
            logging, and editorial verification.
          </p>
          <p className="leading-relaxed text-[11px] text-muted-foreground/80">
            <strong>Clinical Safety:</strong> Submissions and articles shared on this platform are
            for peer Ayurvedic professional discussion only and are not clinically proven,
            certified, or endorsed by statutory regulatory bodies. Never post identifiable patient
            records.
          </p>
        </div>
      </div>

      {/* Report Content Prototype Modal */}
      {reportModalPub && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="panel max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Flag className="h-4 w-4 text-destructive" />
                Report Content or Misattribution
              </h3>
              <button
                type="button"
                onClick={() => setReportModalPub(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Reporting: <b>{reportModalPub.title}</b> ({reportModalPub.id})
            </p>
            <div className="space-y-2 text-xs">
              <label className="font-semibold text-foreground">Reason for report</label>
              <select className={inputCls}>
                <option>Potential patient privacy or identifying details</option>
                <option>Copyright or external journal misattribution</option>
                <option>Inaccurate classical treatise quotation</option>
                <option>Spam or unverified commercial solicitation</option>
              </select>
              <textarea
                rows={3}
                className={inputCls}
                placeholder="Optional clarification for medical editorial board..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="outline" onClick={() => setReportModalPub(null)}>
                Cancel
              </Btn>
              <Btn
                onClick={() => {
                  toast.success(
                    "Report received for editorial compliance review. (Prototype workflow).",
                  );
                  setReportModalPub(null);
                }}
              >
                Submit Report
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
