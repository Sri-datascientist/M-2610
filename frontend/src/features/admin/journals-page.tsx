import { useMemo, useState } from "react";
import { PageHeader } from "@/components/portal/brand";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/admin/ui";
import { useJournals } from "@/features/admin/journal-state";
import {
  journalCategories,
  type JournalRecord,
  type JournalStatus,
} from "@/features/admin/journal-data";
import {
  BackButton,
  DetailSection,
  MetaList,
  SearchField,
  SelectField,
  SummaryRow,
} from "@/features/admin/fields";
import { ReviewBadge, recorded } from "@/features/admin/review-ui";
import { RefreshCw, Plus, Trash2, ExternalLink, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function JournalsPage() {
  const {
    journals,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    addJournal,
    deleteJournal,
    triggerManualSync,
    syncAll,
    isSyncingAll,
  } = useJournals();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<JournalRecord | null>(null);

  // Form states for creating a new journal
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<string>(journalCategories[0]);
  const [formSource, setFormSource] = useState("");
  const [formIssn, setFormIssn] = useState("");
  const [formAbstract, setFormAbstract] = useState("");
  const [formAuthors, setFormAuthors] = useState("");
  const [formUrl, setFormUrl] = useState("");

  const selected = journals.find((j) => j.id === selectedId) ?? null;

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return journals.filter((item) => {
      const haystack = `${item.title} ${item.source} ${item.issn} ${item.category}`.toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (selectedStatus !== "all" && item.status !== selectedStatus) return false;
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      return true;
    });
  }, [journals, searchQuery, selectedStatus, selectedCategory]);

  const countByStatus = (status: JournalStatus) =>
    journals.filter((j) => j.status === status).length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    addJournal({
      title: formTitle.trim(),
      category: formCategory,
      source: formSource.trim() || "Ayurvedic Clinical Archive",
      issn: formIssn.trim() || "0974-8520",
      status: "Pending Review",
      publicationDate: new Date().toISOString().slice(0, 10),
      abstract: formAbstract.trim() || "Indexed journal metadata entry submitted for verification.",
      articleCount: 1,
      authors: formAuthors
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      externalUrl: formUrl.trim() || "https://meyveda.example/journal",
      sample: true,
    });

    recorded("Journal entry indexed");
    setShowAddModal(false);
    setFormTitle("");
    setFormSource("");
    setFormIssn("");
    setFormAbstract("");
    setFormAuthors("");
    setFormUrl("");
  };

  if (selected) {
    return (
      <JournalDetailView
        journal={selected}
        onBack={() => setSelectedId(null)}
        onSync={() => {
          void triggerManualSync(selected.id);
          recorded("Synchronizing journal metadata");
        }}
        onDelete={() => {
          deleteJournal(selected.id);
          setSelectedId(null);
          recorded("Journal record removed");
        }}
      />
    );
  }

  const columns: Column<JournalRecord>[] = [
    {
      header: "Journal Title",
      cell: (row) => (
        <div>
          <span className="font-semibold text-foreground line-clamp-1">{row.title}</span>
          <span className="text-xs text-muted-foreground block">
            {row.source} · ISSN {row.issn}
          </span>
        </div>
      ),
    },
    { header: "Category", cell: (row) => row.category },
    {
      header: "Sync Status",
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
            row.syncStatus === "Success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : row.syncStatus === "Syncing"
                ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                : row.syncStatus === "Error"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-secondary text-muted-foreground"
          }`}
        >
          {row.syncStatus === "Syncing" && <RefreshCw className="h-3 w-3 animate-spin" />}
          {row.syncStatus}
        </span>
      ),
    },
    { header: "Status", cell: (row) => <ReviewBadge status={row.status} /> },
    {
      header: "Last Run",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">{row.lastFetchedAt || "Never"}</span>
      ),
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(row.id);
            }}
          >
            Details
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-primary"
            title="Manual sync"
            disabled={row.syncStatus === "Syncing"}
            onClick={(e) => {
              e.stopPropagation();
              void triggerManualSync(row.id);
            }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${row.syncStatus === "Syncing" ? "animate-spin" : ""}`} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Journal management"
        subtitle="Governed repository of peer-reviewed clinical research and academic publications."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void syncAll()}
              disabled={isSyncingAll}
              className="gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncingAll ? "animate-spin" : ""}`} />
              {isSyncingAll ? "Syncing Repositories..." : "Fetch / Sync Repositories"}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Journal Record
            </Button>
          </div>
        }
      />

      <SummaryRow
        items={[
          {
            label: "Total Indexed",
            value: countByStatus("Indexed"),
            pressed: selectedStatus === "Indexed",
            onClick: () =>
              setSelectedStatus(selectedStatus === "Indexed" ? "all" : "Indexed"),
          },
          {
            label: "Pending Review",
            value: countByStatus("Pending Review"),
            pressed: selectedStatus === "Pending Review",
            onClick: () =>
              setSelectedStatus(selectedStatus === "Pending Review" ? "all" : "Pending Review"),
          },
          {
            label: "Syncing / In Progress",
            value: countByStatus("Syncing"),
            pressed: selectedStatus === "Syncing",
            onClick: () =>
              setSelectedStatus(selectedStatus === "Syncing" ? "all" : "Syncing"),
          },
          {
            label: "Archived",
            value: countByStatus("Archived"),
            pressed: selectedStatus === "Archived",
            onClick: () =>
              setSelectedStatus(selectedStatus === "Archived" ? "all" : "Archived"),
          },
        ]}
      />

      <section className="card-surface">
        <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SearchField
              label="Search Journals"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by title, ISSN, source or category..."
            />
          </div>
          <SelectField
            label="Category"
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={[
              { value: "all", label: "All categories" },
              ...journalCategories.map((c) => ({ value: c, label: c })),
            ]}
          />
          <SelectField
            label="Verification status"
            value={selectedStatus}
            onChange={(val) => setSelectedStatus(val as JournalStatus | "all")}
            options={[
              { value: "all", label: "All statuses" },
              { value: "Indexed", label: "Indexed" },
              { value: "Pending Review", label: "Pending Review" },
              { value: "Syncing", label: "Syncing" },
              { value: "Archived", label: "Archived" },
            ]}
          />
        </div>

        <DataTable
          key={`${searchQuery}|${selectedStatus}|${selectedCategory}`}
          rows={filteredRows}
          columns={columns}
          onRowClick={(row) => setSelectedId(row.id)}
          pageSize={6}
        />
      </section>

      {/* Add Journal Record Modal Dialog */}
      <AlertDialog open={showAddModal} onOpenChange={setShowAddModal}>
        <AlertDialogContent className="max-w-lg">
          <form onSubmit={handleCreate}>
            <AlertDialogHeader>
              <AlertDialogTitle>Add New Journal Record</AlertDialogTitle>
              <AlertDialogDescription>
                Index a peer-reviewed Ayurveda journal or clinical monograph into the Grantha research archive.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3.5 my-4">
              <div>
                <Label htmlFor="j-title">Journal Title *</Label>
                <Input
                  id="j-title"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Standardized Efficacy of Triphala Formulations"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="j-cat">Category</Label>
                  <select
                    id="j-cat"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1"
                  >
                    {journalCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="j-issn">ISSN Number</Label>
                  <Input
                    id="j-issn"
                    value={formIssn}
                    onChange={(e) => setFormIssn(e.target.value)}
                    placeholder="0974-8520"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="j-src">Publication / Journal Source</Label>
                <Input
                  id="j-src"
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  placeholder="e.g. International Journal of Ayurvedic Medicine"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="j-auth">Authors (comma separated)</Label>
                <Input
                  id="j-auth"
                  value={formAuthors}
                  onChange={(e) => setFormAuthors(e.target.value)}
                  placeholder="Dr. Hari Prasad, Dr. Meera Pillai"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="j-abstract">Abstract & Method Summary</Label>
                <Textarea
                  id="j-abstract"
                  rows={3}
                  value={formAbstract}
                  onChange={(e) => setFormAbstract(e.target.value)}
                  placeholder="Summary of research methodology and clinical findings..."
                  className="mt-1"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
              <AlertDialogAction type="submit">Index Record</AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Journal Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{deleteTarget?.title}&quot;? This record will be deleted from the indexed collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  deleteJournal(deleteTarget.id);
                  setDeleteTarget(null);
                  recorded("Journal record deleted");
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function JournalDetailView({
  journal,
  onBack,
  onSync,
  onDelete,
}: {
  journal: JournalRecord;
  onBack: () => void;
  onSync: () => void;
  onDelete: () => void;
}) {
  return (
    <div>
      <PageHeader
        title="Journal Details"
        subtitle="Detailed publication metadata, repository synchronization metrics, and article index."
      />
      <div className="flex items-center justify-between gap-4 mt-2 mb-4">
        <BackButton onClick={onBack} label="Back to Journals" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSync} className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Manual Fetch & Sync
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:bg-destructive/10 gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            Delete Record
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            {journal.id} · {journal.category}
          </span>
          <h2 className="type-record mt-1">{journal.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{journal.source} · ISSN: {journal.issn}</p>
        </div>
        <ReviewBadge status={journal.status} />
      </div>

      {journal.syncError && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="text-sm">
            <strong className="block font-semibold">Repository Synchronization Alert</strong>
            <span>{journal.syncError}</span>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-5">
        <DetailSection title="Publication & Ingestion Metadata">
          <MetaList
            rows={[
              { label: "Journal ID", value: journal.id },
              { label: "Source Publication", value: journal.source },
              { label: "ISSN", value: journal.issn },
              { label: "Category", value: journal.category },
              { label: "Publication Date", value: journal.publicationDate },
              { label: "Articles Indexed", value: `${journal.articleCount} articles` },
              { label: "Authors / Contributors", value: journal.authors.join(", ") },
              {
                label: "Digital Repository URL",
                value: (
                  <a
                    href={journal.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-xs"
                  >
                    {journal.externalUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ),
              },
            ]}
          />
        </DetailSection>

        <DetailSection title="Repository Ingestion Status">
          <MetaList
            rows={[
              {
                label: "Last Run Status",
                value: (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      journal.syncStatus === "Success"
                        ? "bg-emerald-100 text-emerald-800"
                        : journal.syncStatus === "Syncing"
                          ? "bg-amber-100 text-amber-800 animate-pulse"
                          : journal.syncStatus === "Error"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {journal.syncStatus}
                  </span>
                ),
              },
              { label: "Last Run Time", value: journal.lastFetchedAt || "No sync recorded" },
              {
                label: "Integration Driver",
                value: "DHARA & NCISM Ayurveda Research Metadata Harvester (v1.2.0-pre)",
              },
              {
                label: "Data Environment",
                value: "Development Integration Fixture (Clear Mock Boundary)",
              },
            ]}
          />
        </DetailSection>

        <DetailSection title="Abstract & Study Overview">
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
            {journal.abstract}
          </p>
        </DetailSection>
      </div>
    </div>
  );
}
