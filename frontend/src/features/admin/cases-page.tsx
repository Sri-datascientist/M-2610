import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable, Timeline, type Column } from "@/components/admin/ui";
import {
  anonymizationStatuses,
  caseCategories,
  caseReviewStatuses,
  type AnonymizationStatus,
  type CaseReviewStatus,
  type ClinicalCase,
} from "@/features/admin/compliance-data";
import { useCompliance } from "@/features/admin/compliance-state";
import {
  CheckList,
  DetailShell,
  DirectoryShell,
  ProtectedNotice,
  openColumn,
} from "@/features/admin/compliance-ui";
import { DetailSection, MetaList, SearchField, SelectField } from "@/features/admin/fields";
import { NoteForm, recorded, ReviewBadge, ReviewDecisions } from "@/features/admin/review-ui";
import { useStore } from "@/lib/admin-store";

const tabs = ["Overview", "Authorized content", "Anonymization", "Notes", "History"] as const;
type Tab = (typeof tabs)[number];

export function CasesQueue() {
  const { cases, setCaseCheck, addCaseNote, decideCase } = useCompliance();
  const { can } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [anonymization, setAnonymization] = useState<AnonymizationStatus | "all">("all");
  const [status, setStatus] = useState<CaseReviewStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = cases.find((item) => item.id === selectedId) ?? null;

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return cases.filter((item) => {
      const haystack = `${item.id} ${item.title} ${item.category}`.toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (category !== "all" && item.category !== category) return false;
      if (anonymization !== "all" && item.anonymization !== anonymization) return false;
      if (status !== "all" && item.reviewStatus !== status) return false;
      return true;
    });
  }, [cases, query, category, anonymization, status]);

  if (selected) {
    return (
      <CaseDetail
        item={selected}
        enabled={can("manage")}
        onBack={() => setSelectedId(null)}
        onCheck={(index, done) => setCaseCheck(selected.id, index, done)}
        onNote={(text) => addCaseNote(selected.id, text)}
        onApprove={() => {
          const result = decideCase(selected.id, "approve", "");
          if (!result.ok) toast.error(result.message);
          else recorded("Case approved");
        }}
        onRequest={(reason) => {
          const result = decideCase(selected.id, "request", reason);
          if (!result.ok) toast.error(result.message);
          else recorded("Changes requested");
        }}
        onReject={(reason) => {
          const result = decideCase(selected.id, "reject", reason);
          if (!result.ok) toast.error(result.message);
          else recorded("Rejection recorded");
        }}
      />
    );
  }

  const columns: Column<ClinicalCase>[] = [
    { header: "Case ID", cell: (row) => <span className="font-semibold">{row.id}</span> },
    { header: "Category", cell: (row) => row.category },
    { header: "Submitted Date", cell: (row) => row.submittedDate },
    { header: "Anonymization Status", cell: (row) => <ReviewBadge status={row.anonymization} /> },
    { header: "Review Status", cell: (row) => <ReviewBadge status={row.reviewStatus} /> },
    openColumn<ClinicalCase>(setSelectedId),
  ];

  return (
    <DirectoryShell
      title="Clinical Cases"
      subtitle="Clinical case review with anonymization checks before approval."
      filters={
        <>
          <div className="sm:col-span-2 lg:col-span-3">
            <SearchField
              label="Search"
              value={query}
              onChange={setQuery}
              placeholder="Case, title, or category"
            />
          </div>
          <SelectField
            label="Category"
            value={category}
            onChange={setCategory}
            options={[
              { value: "all", label: "All categories" },
              ...caseCategories.map((item) => ({ value: item, label: item })),
            ]}
          />
          <SelectField
            label="Anonymization"
            value={anonymization}
            onChange={(value) => setAnonymization(value as AnonymizationStatus | "all")}
            options={[
              { value: "all", label: "All anonymization statuses" },
              ...anonymizationStatuses.map((item) => ({ value: item, label: item })),
            ]}
          />
          <SelectField
            label="Review status"
            value={status}
            onChange={(value) => setStatus(value as CaseReviewStatus | "all")}
            options={[
              { value: "all", label: "All review statuses" },
              ...caseReviewStatuses.map((item) => ({ value: item, label: item })),
            ]}
          />
        </>
      }
      table={
        <DataTable
          key={`${query}|${category}|${anonymization}|${status}`}
          rows={rows}
          columns={columns}
          onRowClick={(row) => setSelectedId(row.id)}
          pageSize={6}
        />
      }
    />
  );
}

function CaseDetail({
  item,
  enabled,
  onBack,
  onCheck,
  onNote,
  onApprove,
  onRequest,
  onReject,
}: {
  item: ClinicalCase;
  enabled: boolean;
  onBack: () => void;
  onCheck: (index: number, done: boolean) => void;
  onNote: (text: string) => void;
  onApprove: () => void;
  onRequest: (reason: string) => void;
  onReject: (reason: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const closed = item.reviewStatus === "Approved" || item.reviewStatus === "Rejected";
  return (
    <DetailShell
      title="Clinical Cases"
      subtitle="Clinical case review with anonymization checks before approval."
      backLabel="Back to cases"
      onBack={onBack}
      heading={item.id}
      meta={`${item.category} · ${item.title}`}
      badge={
        <>
          <ReviewBadge status={item.anonymization} />
          <ReviewBadge status={item.reviewStatus} />
        </>
      }
      tabLabel="Case sections"
      tab={tab}
      tabs={tabs}
      onTab={setTab}
      decisions={
        closed ? (
          <p className="text-sm text-muted-foreground">This decision is already recorded.</p>
        ) : (
          <ReviewDecisions
            enabled={enabled}
            actions={[
              {
                id: "approve",
                label: "Approve",
                title: "Approve case",
                description:
                  item.anonymization === "Complete"
                    ? `Approve ${item.id} for the clinical record.`
                    : "Required anonymization checks are still open. Approval will not be recorded until they are complete.",
                confirmLabel: "Approve",
                onConfirm: () => onApprove(),
              },
              {
                id: "request",
                label: "Request changes",
                title: "Request changes",
                description: `Tell the submitter what must change in ${item.id}.`,
                confirmLabel: "Request changes",
                requireReason: true,
                reasonLabel: "Changes required",
                onConfirm: onRequest,
              },
              {
                id: "reject",
                label: "Reject with Reason",
                title: "Reject case",
                description: `${item.id} · ${item.category}`,
                confirmLabel: "Reject",
                destructive: true,
                requireReason: true,
                reasonLabel: "Reason for rejection",
                onConfirm: onReject,
              },
            ]}
          />
        )
      }
    >
      {tab === "Overview" ? (
        <>
          <ProtectedNotice items={item.withheld} />
          <DetailSection title="Case">
            <MetaList
              rows={[
                { label: "Case ID", value: item.id },
                { label: "Title", value: item.title },
                { label: "Category", value: item.category },
                { label: "Submitted", value: item.submittedDate },
                { label: "Setting", value: item.setting },
                { label: "Anonymization", value: <ReviewBadge status={item.anonymization} /> },
                { label: "Review status", value: <ReviewBadge status={item.reviewStatus} /> },
              ]}
            />
          </DetailSection>
        </>
      ) : null}
      {tab === "Authorized content" ? (
        <DetailSection title="Authorized narrative">
          <div className="rounded-2xl bg-secondary px-5 py-5 text-[15px] leading-relaxed">
            {item.narrative}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            This is the authorized case content. Identifiers listed above are not shown in this
            narrative.
          </p>
        </DetailSection>
      ) : null}
      {tab === "Anonymization" ? (
        <DetailSection title="Anonymization checklist">
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            Required checks must be complete before this case can be approved.
          </p>
          <CheckList
            items={item.checklist.map((check) => ({
              ...check,
              note: check.required ? "Required before approval" : "Optional",
            }))}
            disabled={!enabled || closed}
            onToggle={onCheck}
          />
        </DetailSection>
      ) : null}
      {tab === "Notes" ? (
        <DetailSection title="Reviewer notes">
          {enabled && !closed ? <NoteForm onAdd={onNote} /> : null}
          <ul className="mt-4 space-y-3">
            {item.notes.length ? (
              item.notes.map((entry) => (
                <li key={`${entry.at}-${entry.text}`}>
                  <p className="text-sm">{entry.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.at} · {entry.by}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-muted-foreground">No reviewer notes yet.</li>
            )}
          </ul>
        </DetailSection>
      ) : null}
      {tab === "History" ? (
        <DetailSection title="Review history">
          <Timeline items={item.history} />
        </DetailSection>
      ) : null}
    </DetailShell>
  );
}
