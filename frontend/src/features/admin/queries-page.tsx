import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { AlertCircle, ArrowUpDown, CheckCircle2, Clock, CornerDownRight, FileText, Send, User } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DataTable, EmptyState, type Column } from "@/components/admin/ui";
import { PageHeader, StatusPill, focusRing } from "@/components/portal/brand";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useAdministration } from "@/features/admin/administration-state";
import {
  BackButton,
  DetailSection,
  MetaList,
  SearchField,
  SelectField,
} from "@/features/admin/fields";
import {
  defaultQueryFilters,
  filterQueries,
  queryCategories,
  queryCounts,
  queryPriorities,
  queryStatuses,
  queryUserTypes,
  type CustomerQuery,
  type QueryCategory,
  type QueryFilters,
  type QueryPriority,
  type QuerySortOption,
  type QueryStatus,
  type QueryUserType,
} from "@/features/admin/queries-data";
import { useQueries } from "@/features/admin/queries-state";
import { ReviewBadge } from "@/features/admin/review-ui";
import { cn } from "@/lib/utils";

function PriorityBadge({ priority }: { priority: QueryPriority }) {
  const toneMap: Record<QueryPriority, "danger" | "brand" | "muted"> = {
    Urgent: "danger",
    High: "brand",
    Medium: "muted",
    Low: "muted",
  };
  return <StatusPill tone={toneMap[priority]}>{priority}</StatusPill>;
}

export function QueriesPage() {
  const { users } = useAdministration();
  const {
    items,
    sendReply,
    setQueryStatus,
    setQueryPriority,
    assignAdmin,
    closeQuery,
    removeQuery,
  } = useQueries();

  const [filters, setFilters] = useState<QueryFilters>(defaultQueryFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const replyInputRef = useRef<HTMLTextAreaElement | null>(null);

  const counts = useMemo(() => queryCounts(items), [items]);
  const rows = useMemo(() => filterQueries(items, filters), [items, filters]);
  const selected = useMemo(() => items.find((q) => q.id === selectedId) ?? null, [items, selectedId]);

  const filtersDirty =
    filters.query !== "" ||
    filters.status !== "all" ||
    filters.userType !== "all" ||
    filters.category !== "all" ||
    filters.priority !== "all" ||
    filters.sort !== "newest";

  const handleOpenDetails = (id: string, focusReply = false) => {
    setSelectedId(id);
    if (focusReply) {
      setTimeout(() => {
        replyInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        replyInputRef.current?.focus();
      }, 100);
    }
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteId) return;
    setBusy(true);
    const res = removeQuery(pendingDeleteId);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    toast.success("Query record removed and archived successfully.");
    if (selectedId === pendingDeleteId) {
      setSelectedId(null);
    }
    setPendingDeleteId(null);
  };

  if (selected) {
    return (
      <div className="space-y-4">
        <BackButton label="Back to queries" onClick={() => setSelectedId(null)} />
        <QueryDetailView
          query={selected}
          adminUsers={users}
          replyRef={replyInputRef}
          onSendReply={(content) => {
            const res = sendReply(selected.id, content);
            if (!res.ok) {
              toast.error(res.message);
            } else {
              toast.success("Response sent and recorded in conversation.");
            }
          }}
          onStatusChange={(status, resolutionNote) => {
            const res = setQueryStatus(selected.id, status, resolutionNote);
            if (!res.ok) {
              toast.error(res.message);
            } else {
              toast.success(`Query status updated to ${status}.`);
            }
          }}
          onPriorityChange={(priority) => {
            const res = setQueryPriority(selected.id, priority);
            if (!res.ok) {
              toast.error(res.message);
            } else {
              toast.success(`Priority updated to ${priority}.`);
            }
          }}
          onAssign={(adminId, adminName) => {
            const res = assignAdmin(selected.id, adminId, adminName);
            if (!res.ok) {
              toast.error(res.message);
            } else {
              toast.success(`Query assigned to ${adminName}.`);
            }
          }}
          onClose={() => {
            const res = closeQuery(selected.id);
            if (!res.ok) {
              toast.error(res.message);
            } else {
              toast.success("Query closed.");
            }
          }}
          onDelete={() => setPendingDeleteId(selected.id)}
        />
        <DeleteQueryDialog
          open={pendingDeleteId === selected.id}
          busy={busy}
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    );
  }

  const columns: Column<CustomerQuery>[] = [
    {
      header: "Query ID",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {row.priority === "Urgent" && (
            <span
              className="h-2 w-2 rounded-full bg-destructive shrink-0 animate-pulse"
              title="Urgent query requiring immediate response"
            />
          )}
          <span className="font-mono text-xs font-semibold text-foreground/80">{row.id}</span>
        </div>
      ),
    },
    {
      header: "Subject",
      cell: (row) => (
        <button
          type="button"
          onClick={() => handleOpenDetails(row.id)}
          className="text-left font-semibold text-foreground hover:text-primary transition-colors max-w-xs truncate block"
          title={row.subject}
        >
          {row.subject}
        </button>
      ),
    },
    {
      header: "Submitted By",
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.submitterName}</p>
          <p className="text-xs text-muted-foreground">{row.submitterEmail}</p>
        </div>
      ),
    },
    {
      header: "User Type",
      cell: (row) => (
        <span className="inline-flex items-center rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {row.userType}
        </span>
      ),
    },
    {
      header: "Category",
      cell: (row) => <span className="text-sm text-foreground/90">{row.category}</span>,
    },
    {
      header: "Submitted Date",
      cell: (row) => <span className="text-xs text-muted-foreground">{row.submittedAt}</span>,
    },
    {
      header: "Priority",
      cell: (row) => <PriorityBadge priority={row.priority} />,
    },
    {
      header: "Status",
      cell: (row) => <ReviewBadge status={row.status} />,
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDetails(row.id);
            }}
          >
            View Details
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDetails(row.id, true);
            }}
          >
            Respond
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Query Management"
        subtitle="Manage user questions, complaints, and platform support requests."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Queries"
          value={counts.total}
          active={filters.status === "all"}
          onClick={() => setFilters((current) => ({ ...current, status: "all" }))}
        />
        <SummaryCard
          label="Open Queries"
          value={counts.open}
          active={filters.status === "Open"}
          onClick={() => setFilters((current) => ({ ...current, status: "Open" }))}
        />
        <SummaryCard
          label="In Progress"
          value={counts.inProgress}
          active={filters.status === "In Progress"}
          onClick={() => setFilters((current) => ({ ...current, status: "In Progress" }))}
        />
        <SummaryCard
          label="Resolved"
          value={counts.resolved}
          active={filters.status === "Resolved"}
          onClick={() => setFilters((current) => ({ ...current, status: "Resolved" }))}
        />
      </div>

      <section className="card-surface">
        <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-2">
            <SearchField
              label="Search"
              value={filters.query}
              onChange={(query) => setFilters((prev) => ({ ...prev, query }))}
              placeholder="Query ID, subject, name, keyword"
            />
          </div>

          <SelectField
            label="Status"
            value={filters.status}
            onChange={(status) => setFilters((prev) => ({ ...prev, status: status as QueryStatus | "all" }))}
            options={[
              { value: "all", label: "All statuses" },
              ...queryStatuses.map((s) => ({ value: s, label: s })),
            ]}
          />

          <SelectField
            label="User Type"
            value={filters.userType}
            onChange={(userType) => setFilters((prev) => ({ ...prev, userType: userType as QueryUserType | "all" }))}
            options={[
              { value: "all", label: "All user types" },
              ...queryUserTypes.map((u) => ({ value: u, label: u })),
            ]}
          />

          <SelectField
            label="Category"
            value={filters.category}
            onChange={(category) => setFilters((prev) => ({ ...prev, category: category as QueryCategory | "all" }))}
            options={[
              { value: "all", label: "All categories" },
              ...queryCategories.map((c) => ({ value: c, label: c })),
            ]}
          />

          <SelectField
            label="Priority"
            value={filters.priority}
            onChange={(priority) => setFilters((prev) => ({ ...prev, priority: priority as QueryPriority | "all" }))}
            options={[
              { value: "all", label: "All priorities" },
              ...queryPriorities.map((p) => ({ value: p, label: p })),
            ]}
          />

          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-6 flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5" />
                Sort:
              </span>
              <div className="flex gap-1.5">
                {[
                  { id: "newest", label: "Newest" },
                  { id: "oldest", label: "Oldest" },
                  { id: "priority", label: "Highest Priority" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, sort: opt.id as QuerySortOption }))}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                      filters.sort === opt.id
                        ? "bg-accent text-accent-foreground font-semibold"
                        : "text-muted-foreground hover:bg-surface hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!filtersDirty}
              onClick={() => setFilters(defaultQueryFilters)}
            >
              Clear filters
            </Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No matching queries"
            text="No queries match your current search and filter combination."
          />
        ) : (
          <DataTable
            key={`${filters.query}|${filters.status}|${filters.userType}|${filters.category}|${filters.priority}|${filters.sort}`}
            rows={rows}
            columns={columns}
            onRowClick={(row) => handleOpenDetails(row.id)}
            pageSize={7}
          />
        )}
      </section>

      <DeleteQueryDialog
        open={pendingDeleteId !== null}
        busy={busy}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "card-surface px-4 py-3.5 text-left transition-all",
        active && "border-primary ring-1 ring-primary/20",
        focusRing,
      )}
    >
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="mt-1 block text-2xl font-bold tracking-tight text-foreground">{value}</span>
    </button>
  );
}

function QueryDetailView({
  query,
  adminUsers,
  replyRef,
  onSendReply,
  onStatusChange,
  onPriorityChange,
  onAssign,
  onClose,
  onDelete,
}: {
  query: CustomerQuery;
  adminUsers: { id: string; name: string }[];
  replyRef: React.RefObject<HTMLTextAreaElement | null>;
  onSendReply: (content: string) => void;
  onStatusChange: (status: QueryStatus, note?: string) => void;
  onPriorityChange: (priority: QueryPriority) => void;
  onAssign: (adminId: string, adminName: string) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error("Please enter a response before sending.");
      return;
    }
    setSubmitting(true);
    onSendReply(replyText);
    setReplyText("");
    setSubmitting(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left Column: Query Info, Classification, Controls */}
      <div className="space-y-5 lg:col-span-5">
        <section className="card-surface p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <span className="font-mono text-xs font-bold text-muted-foreground">{query.id}</span>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={query.priority} />
              <ReviewBadge status={query.status} />
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold text-foreground leading-snug">{query.subject}</h1>
            <p className="mt-1 text-xs text-muted-foreground">Submitted on {query.submittedAt}</p>
          </div>

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <SelectField
              label="Update Status"
              value={query.status}
              onChange={(value) => onStatusChange(value as QueryStatus)}
              options={queryStatuses.map((s) => ({ value: s, label: s }))}
            />

            <SelectField
              label="Update Priority"
              value={query.priority}
              onChange={(value) => onPriorityChange(value as QueryPriority)}
              options={queryPriorities.map((p) => ({ value: p, label: p }))}
            />
          </div>

          <div className="pt-1">
            <SelectField
              label="Assign Administrator"
              value={query.assignedAdminId || "unassigned"}
              onChange={(value) => {
                if (value === "unassigned") {
                  onAssign("", "Unassigned");
                } else {
                  const admin = adminUsers.find((u) => u.id === value);
                  if (admin) onAssign(admin.id, admin.name);
                }
              }}
              options={[
                { value: "unassigned", label: "Unassigned" },
                ...adminUsers.map((u) => ({ value: u.id, label: u.name })),
              ]}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
            {query.status !== "Closed" && (
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Close Query
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
            >
              Delete
            </Button>
          </div>
        </section>

        <DetailSection title="Submitter Details">
          <MetaList
            rows={[
              { label: "Name", value: query.submitterName },
              { label: "User Type", value: query.userType },
              { label: "Email", value: query.submitterEmail },
              { label: "Phone", value: query.submitterPhone || "Not provided" },
              { label: "User ID", value: <span className="font-mono text-xs">{query.submitterId}</span> },
              { label: "Category", value: query.category },
            ]}
          />
        </DetailSection>

        {query.attachments && query.attachments.length > 0 && (
          <DetailSection title="Attachments">
            <ul className="space-y-2">
              {query.attachments.map((att) => (
                <li
                  key={att.name}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-background p-3 text-sm"
                >
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground truncate flex-1">{att.name}</span>
                  {att.size && <span className="text-xs text-muted-foreground shrink-0">{att.size}</span>}
                </li>
              ))}
            </ul>
          </DetailSection>
        )}

        {query.resolutionDetails && (
          <DetailSection title="Resolution Details">
            <p className="text-sm text-foreground/90 leading-relaxed bg-surface rounded-xl p-4 border border-border">
              {query.resolutionDetails}
            </p>
          </DetailSection>
        )}
      </div>

      {/* Right Column: Conversation History & Reply Box */}
      <div className="space-y-5 lg:col-span-7">
        <section className="card-surface p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Conversation Thread</h2>
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                {query.messages.length} {query.messages.length === 1 ? "message" : "messages"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Last activity {query.updatedAt}
            </span>
          </div>

          {/* Conversation history messages */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {query.messages.map((msg) => {
              const isAdmin = msg.senderType === "admin";
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "rounded-2xl p-4 text-[14.5px] transition-all",
                    isAdmin
                      ? "ml-4 bg-primary/5 border border-primary/20 text-foreground"
                      : "mr-4 bg-background border border-border text-foreground",
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-full text-xs font-bold shrink-0",
                          isAdmin ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {isAdmin ? "A" : <User className="h-3.5 w-3.5" />}
                      </span>
                      <span className="font-semibold text-sm">
                        {msg.senderName}
                        {isAdmin && (
                          <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                            Support Team
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{msg.timestamp}</span>
                      {isAdmin && msg.deliveryStatus && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-sage">
                          <CheckCircle2 className="h-3 w-3" />
                          {msg.deliveryStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="whitespace-pre-wrap leading-relaxed text-foreground/90 pl-8">{msg.content}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Reply to User Section */}
        <section className="card-surface p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CornerDownRight className="h-4 w-4 text-primary" />
              Reply to User
            </h2>
            <span className="text-xs text-muted-foreground">Direct response to {query.submitterName}</span>
          </div>

          <p className="text-xs text-muted-foreground">
            Enter an answer, proposed solution, or request for additional details. Sending will notify the user and
            record the response in this query's conversation.
          </p>

          <form onSubmit={handleSubmitReply} className="space-y-4">
            <label className="block">
              <span className="sr-only">Response message</span>
              <textarea
                ref={replyRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response or solution here..."
                rows={5}
                disabled={submitting}
                className={cn(
                  "w-full rounded-xl border border-input bg-background px-4 py-3 text-[14.5px] leading-relaxed",
                  "focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15",
                  focusRing,
                )}
              />
            </label>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {replyText.trim().length} characters
              </p>
              <Button
                type="submit"
                disabled={submitting || !replyText.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-medium"
              >
                <Send className="h-4 w-4" />
                Send Response
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function DeleteQueryDialog({
  open,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogPortal>
        <AlertDialogOverlay className="bg-foreground/20 backdrop-blur-[1px]" />
        <AlertDialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft"
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Delete query?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this query record? This will archive the query from the active list
              while preserving audit history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={busy} onClick={onConfirm}>
              Delete Query
            </Button>
          </AlertDialogFooter>
        </AlertDialogPrimitive.Content>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
