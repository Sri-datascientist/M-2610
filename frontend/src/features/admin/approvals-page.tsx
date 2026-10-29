import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable, Timeline, type Column } from "@/components/admin/ui";
import {
  approvalStatuses,
  compareFormulation,
  type ApprovalStatus,
  type Submission,
} from "@/features/admin/compliance-data";
import { useCompliance } from "@/features/admin/compliance-state";
import {
  DetailShell,
  DirectoryShell,
  DocumentList,
  openColumn,
} from "@/features/admin/compliance-ui";
import { DetailSection, MetaList, SearchField, SelectField } from "@/features/admin/fields";
import {
  NoteForm,
  PlainTable,
  recorded,
  ReviewBadge,
  ReviewDecisions,
} from "@/features/admin/review-ui";
import { useCatalog } from "@/features/admin/catalog-state";
import { useStore } from "@/lib/admin-store";

const tabs = [
  "Submission Information",
  "Product Details",
  "Formulation",
  "Documents",
  "Review History",
] as const;
type Tab = (typeof tabs)[number];

export function ApprovalsQueue() {
  const { submissions, decideSubmission, addSubmissionNote } = useCompliance();
  const { can } = useStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ApprovalStatus | "all">("all");
  const [manufacturer, setManufacturer] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = submissions.find((item) => item.id === selectedId) ?? null;
  const manufacturers = useMemo(
    () => [...new Set(submissions.map((item) => item.manufacturer))],
    [submissions],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return submissions.filter((item) => {
      const haystack =
        `${item.id} ${item.product} ${item.manufacturer} ${item.brand}`.toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (status !== "all" && item.status !== status) return false;
      if (manufacturer !== "all" && item.manufacturer !== manufacturer) return false;
      return true;
    });
  }, [submissions, query, status, manufacturer]);

  if (selected) {
    return (
      <SubmissionDetail
        submission={selected}
        enabled={can("manage")}
        onBack={() => setSelectedId(null)}
        onApprove={() => {
          const result = decideSubmission(selected.id, "approve", "");
          if (!result.ok) toast.error(result.message);
          else recorded("Submission approved");
        }}
        onRequest={(reason) => {
          const result = decideSubmission(selected.id, "request", reason);
          if (!result.ok) toast.error(result.message);
          else recorded("Changes requested");
        }}
        onReject={(reason) => {
          const result = decideSubmission(selected.id, "reject", reason);
          if (!result.ok) toast.error(result.message);
          else recorded("Rejection recorded");
        }}
        onNote={(text) => addSubmissionNote(selected.id, text)}
      />
    );
  }

  const columns: Column<Submission>[] = [
    { header: "Submission ID", cell: (row) => <span className="font-semibold">{row.id}</span> },
    { header: "Product", cell: (row) => row.product },
    { header: "Manufacturer", cell: (row) => row.manufacturer },
    { header: "Submitted Date", cell: (row) => row.submittedDate },
    {
      header: "Reviewer",
      cell: (row) =>
        row.reviewer === "Unassigned" ? (
          <span className="text-muted-foreground">Unassigned</span>
        ) : (
          row.reviewer
        ),
    },
    { header: "Status", cell: (row) => <ReviewBadge status={row.status} /> },
    openColumn<Submission>(setSelectedId),
  ];

  return (
    <DirectoryShell
      title="Product Approvals"
      subtitle="Medicine and product submissions waiting for a decision."
      filters={
        <>
          <div className="sm:col-span-2 lg:col-span-3">
            <SearchField
              label="Search"
              value={query}
              onChange={setQuery}
              placeholder="Submission, product, or manufacturer"
            />
          </div>
          <SelectField
            label="Manufacturer"
            value={manufacturer}
            onChange={setManufacturer}
            options={[
              { value: "all", label: "All manufacturers" },
              ...manufacturers.map((item) => ({ value: item, label: item })),
            ]}
          />
          <SelectField
            label="Status"
            value={status}
            onChange={(value) => setStatus(value as ApprovalStatus | "all")}
            options={[
              { value: "all", label: "All statuses" },
              ...approvalStatuses.map((item) => ({ value: item, label: item })),
            ]}
          />
        </>
      }
      table={
        <DataTable
          key={`${query}|${status}|${manufacturer}`}
          rows={rows}
          columns={columns}
          onRowClick={(row) => setSelectedId(row.id)}
          pageSize={6}
        />
      }
    />
  );
}

function SubmissionDetail({
  submission,
  enabled,
  onBack,
  onApprove,
  onRequest,
  onReject,
  onNote,
}: {
  submission: Submission;
  enabled: boolean;
  onBack: () => void;
  onApprove: () => void;
  onRequest: (reason: string) => void;
  onReject: (reason: string) => void;
  onNote: (text: string) => void;
}) {
  const { ingredients } = useCatalog();
  const [tab, setTab] = useState<Tab>("Submission Information");
  const closed = submission.status === "Approved" || submission.status === "Rejected";
  const diffs = compareFormulation(submission.previousFormulation, submission.formulation);
  return (
    <DetailShell
      title="Product Approvals"
      subtitle="Medicine and product submissions waiting for a decision."
      backLabel="Back to submissions"
      onBack={onBack}
      heading={submission.product}
      meta={`${submission.id} · Version ${submission.version} · ${submission.manufacturer}`}
      badge={<ReviewBadge status={submission.status} />}
      tabLabel="Submission sections"
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
                title: "Approve submission",
                description: `Approve version ${submission.version} of ${submission.product}. Earlier versions stay as they are.`,
                confirmLabel: "Approve",
                onConfirm: () => onApprove(),
              },
              {
                id: "request",
                label: "Request changes",
                title: "Request changes",
                description: `Record the changes required on version ${submission.version}.`,
                confirmLabel: "Request changes",
                requireReason: true,
                reasonLabel: "Changes required",
                onConfirm: onRequest,
              },
              {
                id: "reject",
                label: "Reject with Reason",
                title: "Reject submission",
                description: `${submission.id} · ${submission.product}`,
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
      {tab === "Submission Information" ? (
        <DetailSection title="Submission">
          <MetaList
            rows={[
              { label: "Submission ID", value: submission.id },
              { label: "Submitted", value: submission.submittedDate },
              { label: "Reviewer", value: submission.reviewer },
              { label: "Decision recorded", value: submission.decidedAt ?? "Not recorded" },
              { label: "Version", value: String(submission.version) },
              {
                label: "Previous version",
                value: submission.previousVersion ? String(submission.previousVersion) : "None",
              },
              { label: "Status", value: <ReviewBadge status={submission.status} /> },
              { label: "Change summary", value: submission.changeNote },
            ]}
          />
        </DetailSection>
      ) : null}
      {tab === "Product Details" ? (
        <DetailSection title="Product">
          <MetaList
            rows={[
              { label: "Brand", value: submission.brand },
              { label: "SKU", value: submission.sku },
              { label: "Manufacturer", value: submission.manufacturer },
              { label: "Dosage form", value: submission.dosageForm },
              { label: "Classification", value: submission.classification },
              { label: "Pack size", value: submission.packSize },
              { label: "Previous pack size", value: submission.previousPackSize ?? "None" },
              { label: "Labels", value: submission.labels.join(" ") },
              {
                label: "Previous labels",
                value: submission.previousLabels.join(" ") || "None",
              },
            ]}
          />
        </DetailSection>
      ) : null}
      {tab === "Formulation" ? (
        <DetailSection title="Formulation comparison">
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            {submission.previousFormulation
              ? `Version ${submission.version} is compared with version ${submission.previousVersion}. The earlier formulation stays in the catalog.`
              : "This is the first submission. There is no previous formulation to compare."}
          </p>
          <PlainTable
            headers={["Ingredient", "Master entry", "Previous", "Submitted", "Change"]}
            rows={diffs.map((line) => [
              line.ingredient,
              masterLabel(ingredients, line.ingredient),
              line.previous,
              line.submitted,
              line.change,
            ])}
          />
        </DetailSection>
      ) : null}
      {tab === "Documents" ? (
        <DetailSection title="Submitted documents">
          <DocumentList documents={submission.documents} />
        </DetailSection>
      ) : null}
      {tab === "Review History" ? (
        <>
          <DetailSection title="Reviewer notes">
            {enabled ? <NoteForm onAdd={onNote} /> : null}
            <ul className="mt-4 space-y-3">
              {submission.notes.length ? (
                submission.notes.map((item) => (
                  <li key={`${item.at}-${item.text}`}>
                    <p className="text-sm">{item.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.at} · {item.by}
                    </p>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">No reviewer notes yet.</li>
              )}
            </ul>
          </DetailSection>
          <DetailSection title="Decision history">
            <Timeline items={submission.history} />
          </DetailSection>
        </>
      ) : null}
    </DetailShell>
  );
}

function masterLabel(
  ingredients: { name: string; standardName: string; synonyms: string[]; status: string }[],
  name: string,
) {
  const needle = name.toLowerCase();
  const match = ingredients.find((item) =>
    [item.name, item.standardName, ...item.synonyms].some(
      (value) => value.toLowerCase() === needle,
    ),
  );
  return match ? `${match.standardName} · ${match.status}` : "No master entry";
}
