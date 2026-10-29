import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/portal/brand";
import { Button } from "@/components/ui/button";
import { DataTable, Timeline, type Column } from "@/components/admin/ui";
import { useCatalog } from "@/features/admin/catalog-state";
import {
  BackButton,
  DetailSection,
  SelectField,
  SearchField,
  TextAreaField,
  TextField,
  ViewTabs,
} from "@/features/admin/fields";
import {
  latestLibraryVersion,
  libraryCategories,
  libraryStatuses,
  type LibraryDraftInput,
  type LibraryEntry,
  type LibraryStatus,
} from "@/features/admin/library-data";
import { recorded, ReviewBadge, ReviewDecisions } from "@/features/admin/review-ui";
import { PublishedContentPage } from "@/features/admin/published-content-page";
import { useStore } from "@/lib/admin-store";

const emptyDraft: LibraryDraftInput = {
  title: "",
  source: "",
  category: "Samhita",
  chapter: "",
  verseNumber: "",
  verseText: "",
  references: "",
  editorialNote: "",
};

const detailTabs = ["Reading", "Editorial notes", "References", "Versions"] as const;
type DetailTab = (typeof detailTabs)[number];

export function LibraryWorkspace() {
  const { library, createLibraryDraft, updateLibraryDraft, startLibraryRevision, decideLibrary } =
    useCatalog();
  const { can } = useStore();
  const [sectionMode, setSectionMode] = useState<"library" | "published">("library");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LibraryStatus | "all">("all");
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const selected = library.find((entry) => entry.id === selectedId) ?? null;

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return library.filter((entry) => {
      const current = latestLibraryVersion(entry);
      const haystack = `${entry.title} ${entry.source} ${entry.category}`.toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (status !== "all" && current.status !== status) return false;
      if (category !== "all" && entry.category !== category) return false;
      return true;
    });
  }, [library, query, status, category]);

  if (editing) {
    return (
      <LibraryEditor
        entry={selected}
        enabled={can("manage")}
        onCancel={() => setEditing(false)}
        onSave={(input) => {
          if (selected) {
            const result = updateLibraryDraft(selected.id, input);
            if (!result.ok) {
              toast.error(result.message);
              return;
            }
            recorded("Draft updated");
          } else {
            const result = createLibraryDraft(input);
            if (!result.ok) {
              toast.error(result.message);
              return;
            }
            recorded("Draft created");
            setSelectedId(result.id);
          }
          setEditing(false);
        }}
      />
    );
  }

  if (selected) {
    return (
      <LibraryDetail
        entry={selected}
        enabled={can("manage")}
        onBack={() => setSelectedId(null)}
        onEdit={() => setEditing(true)}
        onRevise={() => {
          const result = startLibraryRevision(selected.id);
          if (!result.ok) toast.error(result.message);
          else {
            recorded(`Version ${latestLibraryVersion(selected).version} kept unchanged`);
            setEditing(true);
          }
        }}
        onSubmit={() => {
          const result = decideLibrary(selected.id, "submit");
          if (!result.ok) toast.error(result.message);
          else recorded("Submitted for review");
        }}
        onPublish={() => {
          const result = decideLibrary(selected.id, "publish");
          if (!result.ok) toast.error(result.message);
          else recorded("Entry published");
        }}
        onArchive={() => {
          const result = decideLibrary(selected.id, "archive");
          if (!result.ok) toast.error(result.message);
          else recorded("Entry archived");
        }}
      />
    );
  }

  const columns: Column<LibraryEntry>[] = [
    { header: "Title", cell: (row) => <span className="font-semibold">{row.title}</span> },
    { header: "Source", cell: (row) => row.source },
    { header: "Category", cell: (row) => row.category },
    { header: "Version", cell: (row) => `v${latestLibraryVersion(row).version}` },
    { header: "Status", cell: (row) => <ReviewBadge status={latestLibraryVersion(row).status} /> },
    { header: "Last Updated", cell: (row) => latestLibraryVersion(row).updated },
    {
      header: "Actions",
      cell: (row) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedId(row.id);
          }}
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Library management"
        subtitle="Classical texts, governed knowledge entries, and practitioner published content."
        action={
          sectionMode === "library" ? (
            <Button
              type="button"
              onClick={() => {
                setSelectedId(null);
                setEditing(true);
              }}
            >
              New draft
            </Button>
          ) : null
        }
      />

      <div className="mb-4">
        <ViewTabs
          label="Library management views"
          value={sectionMode === "library" ? "Classical Texts" : "Practitioner Publications"}
          onChange={(val) =>
            setSectionMode(val === "Practitioner Publications" ? "published" : "library")
          }
          options={[
            { id: "Classical Texts", label: "Classical Texts" },
            { id: "Practitioner Publications", label: "Practitioner Publications" },
          ]}
        />
      </div>

      {sectionMode === "published" ? (
        <PublishedContentPage />
      ) : (
        <section className="card-surface">
          <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <SearchField
                label="Search"
                value={query}
                onChange={setQuery}
                placeholder="Title, source, or category"
              />
            </div>
            <SelectField
              label="Category"
              value={category}
              onChange={setCategory}
              options={[
                { value: "all", label: "All categories" },
                ...libraryCategories.map((item) => ({ value: item, label: item })),
              ]}
            />
            <SelectField
              label="Status"
              value={status}
              onChange={(value) => setStatus(value as LibraryStatus | "all")}
              options={[
                { value: "all", label: "All statuses" },
                ...libraryStatuses.map((item) => ({ value: item, label: item })),
              ]}
            />
          </div>
          <DataTable
            key={`${query}|${status}|${category}`}
            rows={rows}
            columns={columns}
            onRowClick={(row) => setSelectedId(row.id)}
            pageSize={6}
          />
        </section>
      )}
    </div>
  );
}

function LibraryEditor({
  entry,
  enabled,
  onCancel,
  onSave,
}: {
  entry: LibraryEntry | null;
  enabled: boolean;
  onCancel: () => void;
  onSave: (input: LibraryDraftInput) => void;
}) {
  const current = entry ? latestLibraryVersion(entry) : null;
  const chapter = current?.chapters[0];
  const verse = chapter?.verses[0];
  const [form, setForm] = useState<LibraryDraftInput>(
    entry && current
      ? {
          title: entry.title,
          source: entry.source,
          category: entry.category,
          chapter: chapter?.title ?? "",
          verseNumber: verse?.number ?? "",
          verseText: verse?.text ?? "",
          references: current.references.join("\n"),
          editorialNote: current.editorialNote,
        }
      : emptyDraft,
  );
  const set = (key: keyof LibraryDraftInput, value: string) =>
    setForm((currentForm) => ({ ...currentForm, [key]: value }));

  return (
    <div>
      <PageHeader
        title="Library management"
        subtitle="Classical texts, source references, and editorial notes."
      />
      <BackButton onClick={onCancel} label="Back to the catalog" />
      <form
        className="mt-4 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!enabled) return;
          onSave(form);
        }}
      >
        <DetailSection title={entry ? "Edit draft" : "New draft"}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Title" value={form.title} onChange={(value) => set("title", value)} />
            <TextField
              label="Source"
              value={form.source}
              onChange={(value) => set("source", value)}
            />
            <SelectField
              label="Category"
              value={form.category}
              onChange={(value) => set("category", value)}
              options={libraryCategories.map((item) => ({ value: item, label: item }))}
            />
            <TextField
              label="Chapter"
              value={form.chapter}
              onChange={(value) => set("chapter", value)}
            />
            <TextField
              label="Verse number"
              value={form.verseNumber}
              onChange={(value) => set("verseNumber", value)}
            />
          </div>
          <div className="mt-4">
            <TextAreaField
              label="Source text"
              hint="This is the source passage. It is stored apart from editorial notes."
              value={form.verseText}
              onChange={(value) => set("verseText", value)}
            />
          </div>
          <div className="mt-4">
            <TextAreaField
              label="Source references"
              hint="One reference on each line."
              rows={3}
              value={form.references}
              onChange={(value) => set("references", value)}
            />
          </div>
          <div className="mt-4">
            <TextAreaField
              label="Editorial note"
              hint="Questions and editor remarks stay here. They are not part of the source."
              rows={3}
              value={form.editorialNote}
              onChange={(value) => set("editorialNote", value)}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" disabled={!enabled}>
              Save draft
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </DetailSection>
      </form>
    </div>
  );
}

function LibraryDetail({
  entry,
  enabled,
  onBack,
  onEdit,
  onRevise,
  onSubmit,
  onPublish,
  onArchive,
}: {
  entry: LibraryEntry;
  enabled: boolean;
  onBack: () => void;
  onEdit: () => void;
  onRevise: () => void;
  onSubmit: () => void;
  onPublish: () => void;
  onArchive: () => void;
}) {
  const current = latestLibraryVersion(entry);
  const [tab, setTab] = useState<DetailTab>("Reading");
  const [left, setLeft] = useState(String(entry.versions[0]?.version ?? 1));
  const [right, setRight] = useState(String(current.version));
  const leftVersion =
    entry.versions.find((item) => String(item.version) === left) ?? entry.versions[0];
  const rightVersion = entry.versions.find((item) => String(item.version) === right) ?? current;
  const actions = [
    current.status === "Draft"
      ? {
          id: "submit",
          label: "Submit for review",
          title: "Submit for review",
          description: `${entry.title} will move to review. The source text stays as written.`,
          confirmLabel: "Submit",
          onConfirm: () => onSubmit(),
        }
      : null,
    current.status === "In Review"
      ? {
          id: "publish",
          label: "Approve and publish",
          title: "Publish entry",
          description: `Version ${current.version} will be published. Earlier versions stay unchanged.`,
          confirmLabel: "Publish",
          onConfirm: () => onPublish(),
        }
      : null,
    current.status !== "Archived"
      ? {
          id: "archive",
          label: "Archive",
          title: "Archive entry",
          description: "The source text and its references remain available to read.",
          confirmLabel: "Archive",
          onConfirm: () => onArchive(),
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div>
      <PageHeader
        title="Library management"
        subtitle="Classical texts, source references, and editorial notes."
      />
      <BackButton onClick={onBack} label="Back to the catalog" />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="type-record">{entry.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {entry.source} · {entry.category} · Version {current.version}
          </p>
        </div>
        <ReviewBadge status={current.status} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {current.status === "Draft" ? (
          <Button type="button" variant="outline" size="sm" disabled={!enabled} onClick={onEdit}>
            Edit draft
          </Button>
        ) : null}
        {current.status === "Published" ? (
          <Button type="button" variant="outline" size="sm" disabled={!enabled} onClick={onRevise}>
            Start new version
          </Button>
        ) : null}
        {actions.length > 0 ? <ReviewDecisions enabled={enabled} actions={actions} /> : null}
      </div>
      <div className="mt-5">
        <ViewTabs
          label="Library sections"
          value={tab}
          onChange={setTab}
          options={detailTabs.map((item) => ({ id: item, label: item }))}
        />
      </div>
      <div className="mt-4 space-y-4">
        {tab === "Reading" ? (
          <article className="rounded-2xl border border-border bg-secondary px-5 py-6 sm:px-8">
            {current.chapters.map((chapter) => (
              <section key={chapter.title}>
                <h3 className="type-section">{chapter.title}</h3>
                <ol className="mt-4 space-y-4">
                  {chapter.verses.map((line) => (
                    <li key={line.number} className="leading-relaxed">
                      <span className="mr-2 text-sm font-semibold text-primary">{line.number}</span>
                      {line.text}
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </article>
        ) : null}
        {tab === "Editorial notes" ? (
          <DetailSection title="Editorial notes">
            <p className="text-sm leading-relaxed text-muted-foreground">
              These remarks belong to the editor. They are not part of the source passage.
            </p>
            <p className="mt-3 leading-relaxed">
              {current.editorialNote || "No editorial note on this version."}
            </p>
          </DetailSection>
        ) : null}
        {tab === "References" ? (
          <DetailSection title="Source references">
            {current.references.length === 0 ? (
              <p className="text-sm text-muted-foreground">No references recorded.</p>
            ) : (
              <ul className="space-y-2">
                {current.references.map((reference) => (
                  <li key={reference} className="rounded-xl border border-border px-3 py-2">
                    {reference}
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>
        ) : null}
        {tab === "Versions" ? (
          <DetailSection title="Compare versions">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Earlier version"
                value={left}
                onChange={setLeft}
                options={entry.versions.map((item) => ({
                  value: String(item.version),
                  label: `Version ${item.version} · ${item.status}`,
                }))}
              />
              <SelectField
                label="Later version"
                value={right}
                onChange={setRight}
                options={entry.versions.map((item) => ({
                  value: String(item.version),
                  label: `Version ${item.version} · ${item.status}`,
                }))}
              />
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {[leftVersion, rightVersion].map((version) =>
                version ? (
                  <article key={version.version} className="rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold">Version {version.version}</h3>
                      <ReviewBadge status={version.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{version.updated}</p>
                    {version.chapters.map((chapter) => (
                      <div key={chapter.title} className="mt-3">
                        <p className="text-sm font-semibold">{chapter.title}</p>
                        {chapter.verses.map((line) => (
                          <p key={line.number} className="mt-2 text-sm leading-relaxed">
                            <span className="font-semibold">{line.number} </span>
                            {line.text}
                          </p>
                        ))}
                      </div>
                    ))}
                  </article>
                ) : null,
              )}
            </div>
            <div className="mt-4">
              <Timeline items={entry.history} />
            </div>
          </DetailSection>
        ) : null}
      </div>
    </div>
  );
}
