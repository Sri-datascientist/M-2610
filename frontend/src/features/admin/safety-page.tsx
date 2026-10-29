import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable, Timeline, type Column } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import {
  complianceReviewers,
  reportedProductLabel,
  safetyStatuses,
  severities,
  type Batch,
  type SafetyCase,
  type SafetyStatus,
  type Severity,
} from "@/features/admin/compliance-data";
import { useCompliance } from "@/features/admin/compliance-state";
import {
  DetailShell,
  DirectoryShell,
  ProtectedNotice,
  openColumn,
} from "@/features/admin/compliance-ui";
import {
  DetailSection,
  MetaList,
  SearchField,
  SelectField,
  TextAreaField,
} from "@/features/admin/fields";
import { NoteForm, recorded, ReviewBadge, ReviewDecisions } from "@/features/admin/review-ui";
import { useStore } from "@/lib/admin-store";

const tabs = ["Overview", "Assessment", "Investigation", "Follow-up", "History"] as const;
type Tab = (typeof tabs)[number];

export function SafetyWorkspace() {
  const {
    safety,
    batches,
    assignSafetyReviewer,
    assessSafety,
    addSafetyNote,
    requestSafetyFollowUp,
    resolveSafety,
    closeSafety,
  } = useCompliance();
  const { can } = useStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SafetyStatus | "all">("all");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [manufacturer, setManufacturer] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = safety.find((item) => item.id === selectedId) ?? null;

  const manufacturersList = useMemo(() => {
    const list = new Set<string>();
    safety.forEach((item) => {
      if (item.manufacturer) list.add(item.manufacturer);
    });
    return Array.from(list).sort();
  }, [safety]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return safety.filter((item) => {
      const haystack = `${item.id} ${item.product} ${item.manufacturer} ${item.batchId ?? ""}`.toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (status !== "all" && item.status !== status) return false;
      if (severity !== "all" && item.reportedSeverity !== severity) return false;
      if (manufacturer !== "all" && item.manufacturer !== manufacturer) return false;
      return true;
    });
  }, [safety, query, status, severity, manufacturer]);

  if (selected) {
    return (
      <SafetyDetail
        item={selected}
        batches={batches}
        enabled={can("manage")}
        onBack={() => setSelectedId(null)}
        onAssign={(reviewer) => {
          const result = assignSafetyReviewer(selected.id, reviewer);
          if (!result.ok) toast.error(result.message);
          else recorded("Reviewer assigned");
        }}
        onAssess={(level, rationale) => {
          const result = assessSafety(selected.id, level, rationale);
          if (!result.ok) toast.error(result.message);
          else recorded("Severity assessment recorded");
        }}
        onNote={(text) => addSafetyNote(selected.id, text)}
        onFollowUp={(reason) => {
          const result = requestSafetyFollowUp(selected.id, reason);
          if (!result.ok) toast.error(result.message);
          else recorded("Follow-up requested");
        }}
        onResolve={(text) => {
          const result = resolveSafety(selected.id, text);
          if (!result.ok) toast.error(result.message);
          else recorded("Resolution recorded");
        }}
        onClose={(outcome) => {
          const result = closeSafety(selected.id, outcome);
          if (!result.ok) toast.error(result.message);
          else recorded("Case closed");
        }}
      />
    );
  }

  const columns: Column<SafetyCase>[] = [
    { header: "Case ID", cell: (row) => <span className="font-semibold">{row.id}</span> },
    { header: "Product", cell: (row) => row.product },
    { header: "Manufacturer", cell: (row) => <span className="text-muted-foreground">{row.manufacturer || "—"}</span> },
    { header: "Report Date", cell: (row) => row.reportDate },
    { header: "Severity", cell: (row) => <ReviewBadge status={row.reportedSeverity} /> },
    { header: "Status", cell: (row) => <ReviewBadge status={row.status} /> },
    {
      header: "Assigned Reviewer",
      cell: (row) =>
        row.reviewer === "Unassigned" ? (
          <span className="text-muted-foreground">Unassigned</span>
        ) : (
          row.reviewer
        ),
    },
    openColumn<SafetyCase>(setSelectedId),
  ];

  return (
    <DirectoryShell
      title="ADR reports"
      subtitle="De-identified adverse reaction reports and clinical safety oversight."
      filters={
        <>
          <div className="sm:col-span-2 lg:col-span-2">
            <SearchField
              label="Search"
              value={query}
              onChange={setQuery}
              placeholder="Case, product, manufacturer, or batch"
            />
          </div>
          <SelectField
            label="Manufacturer"
            value={manufacturer}
            onChange={setManufacturer}
            options={[
              { value: "all", label: "All manufacturers" },
              ...manufacturersList.map((item) => ({ value: item, label: item })),
            ]}
          />
          <SelectField
            label="Severity"
            value={severity}
            onChange={(value) => setSeverity(value as Severity | "all")}
            options={[
              { value: "all", label: "All severities" },
              ...severities.map((item) => ({ value: item, label: item })),
            ]}
          />
          <SelectField
            label="Status"
            value={status}
            onChange={(value) => setStatus(value as SafetyStatus | "all")}
            options={[
              { value: "all", label: "All statuses" },
              ...safetyStatuses.map((item) => ({ value: item, label: item })),
            ]}
          />
        </>
      }
      table={
        <DataTable
          key={`${query}|${status}|${severity}|${manufacturer}`}
          rows={rows}
          columns={columns}
          onRowClick={(row) => setSelectedId(row.id)}
          pageSize={6}
        />
      }
    />
  );
}

function SafetyDetail({
  item,
  batches,
  enabled,
  onBack,
  onAssign,
  onAssess,
  onNote,
  onFollowUp,
  onResolve,
  onClose,
}: {
  item: SafetyCase;
  batches: readonly Pick<Batch, "id" | "manufacturer">[];
  enabled: boolean;
  onBack: () => void;
  onAssign: (reviewer: string) => void;
  onAssess: (severity: Severity, rationale: string) => void;
  onNote: (text: string) => void;
  onFollowUp: (reason: string) => void;
  onResolve: (text: string) => void;
  onClose: (outcome: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [reviewer, setReviewer] = useState(item.reviewer === "Unassigned" ? "" : item.reviewer);
  const [severity, setSeverity] = useState<Severity | "">(item.assessedSeverity ?? "");
  const [rationale, setRationale] = useState(item.assessmentNote);
  const closed = item.status === "Closed";
  return (
    <DetailShell
      title="ADR reports"
      subtitle="De-identified adverse reaction reports and clinical safety oversight."
      backLabel="Back to reports"
      onBack={onBack}
      heading={item.id}
      meta={`${item.product}${item.batchId ? ` · ${item.batchId}` : ""}`}
      badge={
        <>
          <ReviewBadge status={item.reportedSeverity} />
          <ReviewBadge status={item.status} />
        </>
      }
      tabLabel="Safety sections"
      tab={tab}
      tabs={tabs}
      onTab={setTab}
      decisions={
        closed ? (
          <p className="text-sm text-muted-foreground">This case is closed.</p>
        ) : (
          <ReviewDecisions
            enabled={enabled}
            actions={[
              {
                id: "follow-up",
                label: "Request follow-up",
                title: "Request follow-up",
                description: `Record the information still needed for ${item.id}.`,
                confirmLabel: "Request follow-up",
                requireReason: true,
                reasonLabel: "Follow-up requested",
                onConfirm: onFollowUp,
              },
              {
                id: "resolve",
                label: "Mark resolved",
                title: "Mark resolved",
                description: `Record how ${item.id} was resolved. This does not close the case.`,
                confirmLabel: "Mark resolved",
                requireReason: true,
                reasonLabel: "Resolution note",
                onConfirm: onResolve,
              },
              {
                id: "close",
                label: "Close case",
                title: "Close case",
                description: `Close ${item.id} with an outcome. A reviewer assessment is required first.`,
                confirmLabel: "Close case",
                requireReason: true,
                reasonLabel: "Outcome",
                onConfirm: onClose,
              },
            ]}
          />
        )
      }
    >
      {tab === "Overview" ? (
        <>
          <ProtectedNotice items={item.withheld} />
          <DetailSection title="Report">
            <MetaList
              rows={[
                { label: "Case ID", value: item.id },
                { label: "Product", value: reportedProductLabel(item, batches) },
                { label: "Batch", value: item.batchId ?? "Not supplied" },
                { label: "Report date", value: item.reportDate },
                {
                  label: "Reported severity",
                  value: <ReviewBadge status={item.reportedSeverity} />,
                },
                { label: "Reference", value: item.reference },
                { label: "Age band", value: item.ageBand },
                { label: "Sex", value: item.sex },
                { label: "Region", value: item.region },
                { label: "Assigned reviewer", value: item.reviewer },
              ]}
            />
            <p className="mt-4 text-sm leading-relaxed">{item.summary}</p>
          </DetailSection>
          {enabled && !closed ? (
            <DetailSection title="Assign a reviewer">
              <form
                className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!reviewer) {
                    toast.error("Choose a reviewer.");
                    return;
                  }
                  onAssign(reviewer);
                }}
              >
                <SelectField
                  label="Reviewer"
                  value={reviewer}
                  onChange={setReviewer}
                  options={[
                    { value: "", label: "Select a reviewer" },
                    ...complianceReviewers.map((name) => ({ value: name, label: name })),
                  ]}
                />
                <Button type="submit" size="sm">
                  Assign reviewer
                </Button>
              </form>
            </DetailSection>
          ) : null}
        </>
      ) : null}
      {tab === "Assessment" ? (
        <DetailSection title="Severity assessment">
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            Record the reviewer’s assessment here. The reported severity stays as submitted, and
            this page does not produce a medical conclusion.
          </p>
          <MetaList
            rows={[
              { label: "Reported severity", value: <ReviewBadge status={item.reportedSeverity} /> },
              {
                label: "Assessed severity",
                value: item.assessedSeverity ? (
                  <ReviewBadge status={item.assessedSeverity} />
                ) : (
                  "Not recorded"
                ),
              },
            ]}
          />
          {item.assessmentNote ? (
            <p className="mt-4 text-sm leading-relaxed">{item.assessmentNote}</p>
          ) : null}
          {enabled && !closed ? (
            <form
              className="mt-5 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!severity) {
                  toast.error("Select an assessed severity.");
                  return;
                }
                onAssess(severity, rationale);
              }}
            >
              <SelectField
                label="Assessed severity"
                value={severity}
                onChange={(value) => setSeverity(value as Severity | "")}
                options={[
                  { value: "", label: "Select a severity" },
                  ...severities.map((level) => ({ value: level, label: level })),
                ]}
              />
              <TextAreaField
                label="Assessment note"
                value={rationale}
                onChange={setRationale}
                rows={4}
                hint="Describe what the reviewer concluded from the report. This is not an automatic finding."
              />
              <Button type="submit" size="sm">
                Save assessment
              </Button>
            </form>
          ) : null}
        </DetailSection>
      ) : null}
      {tab === "Investigation" ? (
        <DetailSection title="Investigation notes">
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
              <li className="text-sm text-muted-foreground">No investigation notes yet.</li>
            )}
          </ul>
        </DetailSection>
      ) : null}
      {tab === "Follow-up" ? (
        <DetailSection title="Follow-up and outcome">
          <MetaList
            rows={[
              { label: "Status", value: <ReviewBadge status={item.status} /> },
              { label: "Follow-up", value: item.followUp || "None requested" },
              { label: "Outcome", value: item.outcome || "Not closed" },
            ]}
          />
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
