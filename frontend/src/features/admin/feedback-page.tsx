import { useMemo, useState } from "react";
import { PageHeader } from "@/components/portal/brand";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/admin/ui";
import { useFeedback } from "@/features/admin/feedback-state";
import {
  type FeedbackRecord,
  type FeedbackStatus,
  type FeedbackPriority,
  type FeedbackCategory,
} from "@/features/admin/feedback-data";
import {
  BackButton,
  DetailSection,
  MetaList,
  SearchField,
  SelectField,
  SummaryRow,
} from "@/features/admin/fields";
import { ReviewBadge, recorded } from "@/features/admin/review-ui";
import { MessageSquare, Star, CheckCircle, Clock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export function FeedbackPage() {
  const { feedback, addInternalNote, updateStatus } = useFeedback();

  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus | "all">("all");
  const [selectedPriority, setSelectedPriority] = useState<FeedbackPriority | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = feedback.find((item) => item.id === selectedId) ?? null;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return feedback.filter((item) => {
      const haystack = `${item.id} ${item.submitterName} ${item.subject} ${item.category}`.toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (selectedStatus !== "all" && item.status !== selectedStatus) return false;
      if (selectedPriority !== "all" && item.priority !== selectedPriority) return false;
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      return true;
    });
  }, [feedback, query, selectedStatus, selectedPriority, selectedCategory]);

  const totalCount = feedback.length;
  const newCount = feedback.filter((f) => f.status === "New").length;
  const reviewCount = feedback.filter((f) => f.status === "Under Review").length;
  const resolvedCount = feedback.filter((f) => f.status === "Resolved").length;

  if (selected) {
    return (
      <FeedbackDetailView
        record={selected}
        onBack={() => setSelectedId(null)}
        onAddNote={(note) => {
          addInternalNote(selected.id, note);
          recorded("Internal note added");
        }}
        onStatusChange={(newStatus, resNote) => {
          updateStatus(selected.id, newStatus, resNote);
          recorded(`Status changed to ${newStatus}`);
        }}
      />
    );
  }

  const columns: Column<FeedbackRecord>[] = [
    {
      header: "Feedback",
      cell: (row) => (
        <div>
          <span className="font-semibold text-foreground line-clamp-1">{row.subject}</span>
          <span className="text-xs text-muted-foreground block">
            {row.id} · from {row.submitterName} ({row.submitterType})
          </span>
        </div>
      ),
    },
    { header: "Category", cell: (row) => row.category },
    {
      header: "Priority",
      cell: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            row.priority === "Urgent"
              ? "bg-rose-100 text-rose-800"
              : row.priority === "High"
                ? "bg-amber-100 text-amber-800"
                : row.priority === "Medium"
                  ? "bg-sky-100 text-sky-800"
                  : "bg-secondary text-muted-foreground"
          }`}
        >
          {row.priority}
        </span>
      ),
    },
    { header: "Status", cell: (row) => <ReviewBadge status={row.status} /> },
    { header: "Submitted", cell: (row) => <span className="text-xs text-muted-foreground">{row.submittedDate}</span> },
    {
      header: "Action",
      cell: (row) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(row.id);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Feedback management"
        subtitle="Review suggestions, complaints, operational insights, and user satisfaction records across practitioners and partners."
      />

      <SummaryRow
        items={[
          {
            label: "Total Feedback",
            value: totalCount,
            pressed: selectedStatus === "all",
            onClick: () => setSelectedStatus("all"),
          },
          {
            label: "New Feedback",
            value: newCount,
            pressed: selectedStatus === "New",
            onClick: () => setSelectedStatus((curr) => (curr === "New" ? "all" : "New")),
          },
          {
            label: "Under Review",
            value: reviewCount,
            pressed: selectedStatus === "Under Review",
            onClick: () =>
              setSelectedStatus((curr) => (curr === "Under Review" ? "all" : "Under Review")),
          },
          {
            label: "Resolved",
            value: resolvedCount,
            pressed: selectedStatus === "Resolved",
            onClick: () =>
              setSelectedStatus((curr) => (curr === "Resolved" ? "all" : "Resolved")),
          },
        ]}
      />

      <section className="card-surface mt-5">
        <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <SearchField
              label="Search Feedback"
              value={query}
              onChange={setQuery}
              placeholder="Search by submitter, subject, ID or description..."
            />
          </div>
          <SelectField
            label="Category"
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val as FeedbackCategory | "all")}
            options={[
              { value: "all", label: "All categories" },
              { value: "Doctor Portal", label: "Doctor Portal" },
              { value: "Formulation Guidelines", label: "Formulation Guidelines" },
              { value: "Prescription Workflow", label: "Prescription Workflow" },
              { value: "Verification Process", label: "Verification Process" },
              { value: "Product Catalog", label: "Product Catalog" },
              { value: "General Experience", label: "General Experience" },
            ]}
          />
          <SelectField
            label="Priority"
            value={selectedPriority}
            onChange={(val) => setSelectedPriority(val as FeedbackPriority | "all")}
            options={[
              { value: "all", label: "All priorities" },
              { value: "Urgent", label: "Urgent" },
              { value: "High", label: "High" },
              { value: "Medium", label: "Medium" },
              { value: "Low", label: "Low" },
            ]}
          />
          <SelectField
            label="Status"
            value={selectedStatus}
            onChange={(val) => setSelectedStatus(val as FeedbackStatus | "all")}
            options={[
              { value: "all", label: "All statuses" },
              { value: "New", label: "New" },
              { value: "Under Review", label: "Under Review" },
              { value: "Resolved", label: "Resolved" },
              { value: "Closed", label: "Closed" },
            ]}
          />
        </div>

        <DataTable
          key={`${query}|${selectedStatus}|${selectedPriority}|${selectedCategory}`}
          rows={rows}
          columns={columns}
          onRowClick={(row) => setSelectedId(row.id)}
          pageSize={6}
        />
      </section>
    </div>
  );
}

function FeedbackDetailView({
  record,
  onBack,
  onAddNote,
  onStatusChange,
}: {
  record: FeedbackRecord;
  onBack: () => void;
  onAddNote: (note: string) => void;
  onStatusChange: (status: FeedbackStatus, resolutionNotes?: string) => void;
}) {
  const [newNote, setNewNote] = useState("");
  const [resolutionText, setResolutionText] = useState(record.resolutionNotes || "");
  const [statusDraft, setStatusDraft] = useState<FeedbackStatus>(record.status);

  return (
    <div>
      <PageHeader
        title="Feedback Details"
        subtitle="Review stakeholder suggestions, internal evaluation notes, and resolution actions."
      />
      <div className="flex items-center justify-between gap-4 mt-2 mb-4">
        <BackButton onClick={onBack} label="Back to Feedback" />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            {record.id} · {record.category}
          </span>
          <h2 className="type-record mt-1">{record.subject}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Submitted by {record.submitterName} ({record.submitterType}) on {record.submittedDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReviewBadge status={record.status} />
          {record.rating && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              {record.rating} / 5
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <DetailSection title="Feedback Content">
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-line bg-secondary/30 p-4 rounded-xl border border-border">
            {record.description}
          </p>
        </DetailSection>

        <DetailSection title="Status Transition & Resolution">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                  Change Status
                </label>
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value as FeedbackStatus)}
                  className="w-full h-10 rounded-xl border border-input bg-card px-3 text-sm"
                >
                  <option value="New">New</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                  Resolution Notes (Required for Resolved/Closed)
                </label>
                <input
                  type="text"
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Summary of decision or action taken..."
                  className="w-full h-10 rounded-xl border border-input bg-card px-3 text-sm"
                />
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onStatusChange(statusDraft, resolutionText.trim());
              }}
            >
              Update Status
            </Button>
          </div>
        </DetailSection>

        <DetailSection title="Internal Administrator Notes">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Textarea
                rows={2}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add confidential review note for fellow administrators..."
                className="text-sm"
              />
              <Button
                type="button"
                className="shrink-0"
                onClick={() => {
                  if (newNote.trim()) {
                    onAddNote(newNote.trim());
                    setNewNote("");
                  }
                }}
              >
                Add Note
              </Button>
            </div>

            <ul className="space-y-2 mt-4">
              {record.internalNotes.length === 0 ? (
                <li className="text-sm text-muted-foreground">No internal notes recorded yet.</li>
              ) : (
                record.internalNotes.map((note, idx) => (
                  <li key={idx} className="p-3 rounded-lg border border-border bg-card text-xs">
                    <p className="text-foreground text-sm">{note.text}</p>
                    <span className="text-muted-foreground block mt-1">
                      {note.at} · by {note.by}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </DetailSection>
      </div>
    </div>
  );
}
