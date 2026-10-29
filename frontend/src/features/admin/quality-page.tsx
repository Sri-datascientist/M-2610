import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable, Timeline, type Column } from "@/components/admin/ui";
import {
  qualityStatuses,
  releaseStatuses,
  type Batch,
  type QualityStatus,
  type ReleaseStatus,
} from "@/features/admin/compliance-data";
import { useCompliance } from "@/features/admin/compliance-state";
import { CheckList, DetailShell, DirectoryShell, openColumn } from "@/features/admin/compliance-ui";
import { DetailSection, MetaList, SearchField, SelectField } from "@/features/admin/fields";
import {
  NoteForm,
  PlainTable,
  recorded,
  ReviewBadge,
  ReviewDecisions,
} from "@/features/admin/review-ui";
import { useStore } from "@/lib/admin-store";

const tabs = [
  "Overview",
  "Quality Documents",
  "Review Checklist",
  "Release History",
  "Related Safety Cases",
] as const;
type Tab = (typeof tabs)[number];

export function QualityWorkspace() {
  const {
    batches,
    safety,
    setBatchCheck,
    addBatchNote,
    flagBatch,
    escalateBatch,
    releaseBatch,
    recallBatch,
  } = useCompliance();
  const { can } = useStore();
  const [query, setQuery] = useState("");
  const [quality, setQuality] = useState<QualityStatus | "all">("all");
  const [release, setRelease] = useState<ReleaseStatus | "all">("all");
  const [manufacturer, setManufacturer] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = batches.find((item) => item.id === selectedId) ?? null;
  const manufacturers = useMemo(
    () => [...new Set(batches.map((item) => item.manufacturer))],
    [batches],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return batches.filter((item) => {
      const haystack = `${item.id} ${item.product} ${item.manufacturer}`.toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (quality !== "all" && item.qualityStatus !== quality) return false;
      if (release !== "all" && item.releaseStatus !== release) return false;
      if (manufacturer !== "all" && item.manufacturer !== manufacturer) return false;
      return true;
    });
  }, [batches, query, quality, release, manufacturer]);

  if (selected) {
    const related = safety.filter(
      (item) => item.batchId === selected.id || item.product === selected.product,
    );
    return (
      <BatchDetail
        batch={selected}
        related={related.map((item) => ({
          id: item.id,
          severity: item.reportedSeverity,
          status: item.status,
          date: item.reportDate,
        }))}
        enabled={can("manage")}
        onBack={() => setSelectedId(null)}
        onCheck={(index, done) => setBatchCheck(selected.id, index, done)}
        onNote={(text) => addBatchNote(selected.id, text)}
        onFlag={(reason) => {
          const result = flagBatch(selected.id, reason);
          if (!result.ok) toast.error(result.message);
          else recorded("Quality concern flagged");
        }}
        onEscalate={(reason) => {
          const result = escalateBatch(selected.id, reason);
          if (!result.ok) toast.error(result.message);
          else recorded("Issue escalated");
        }}
        onRelease={() => {
          const result = releaseBatch(selected.id);
          if (!result.ok) toast.error(result.message);
          else recorded("Batch released");
        }}
        onRecall={(reason) => {
          const result = recallBatch(selected.id, reason);
          if (!result.ok) toast.error(result.message);
          else recorded("Recall recorded");
        }}
      />
    );
  }

  const columns: Column<Batch>[] = [
    { header: "Batch ID", cell: (row) => <span className="font-semibold">{row.id}</span> },
    { header: "Product", cell: (row) => row.product },
    { header: "Manufacturer", cell: (row) => row.manufacturer },
    { header: "Batch Date", cell: (row) => row.batchDate },
    { header: "Quality Status", cell: (row) => <ReviewBadge status={row.qualityStatus} /> },
    { header: "Release Status", cell: (row) => <ReviewBadge status={row.releaseStatus} /> },
    openColumn<Batch>(setSelectedId),
  ];

  return (
    <DirectoryShell
      title="Quality & Batches"
      subtitle="Batch records, quality documents, and release decisions."
      filters={
        <>
          <div className="sm:col-span-2 lg:col-span-3">
            <SearchField
              label="Search"
              value={query}
              onChange={setQuery}
              placeholder="Batch, product, or manufacturer"
            />
          </div>
          <SelectField
            label="Quality status"
            value={quality}
            onChange={(value) => setQuality(value as QualityStatus | "all")}
            options={[
              { value: "all", label: "All quality statuses" },
              ...qualityStatuses.map((item) => ({ value: item, label: item })),
            ]}
          />
          <SelectField
            label="Release status"
            value={release}
            onChange={(value) => setRelease(value as ReleaseStatus | "all")}
            options={[
              { value: "all", label: "All release statuses" },
              ...releaseStatuses.map((item) => ({ value: item, label: item })),
            ]}
          />
          <SelectField
            label="Manufacturer"
            value={manufacturer}
            onChange={setManufacturer}
            options={[
              { value: "all", label: "All manufacturers" },
              ...manufacturers.map((item) => ({ value: item, label: item })),
            ]}
          />
        </>
      }
      table={
        <DataTable
          key={`${query}|${quality}|${release}|${manufacturer}`}
          rows={rows}
          columns={columns}
          onRowClick={(row) => setSelectedId(row.id)}
          pageSize={6}
        />
      }
    />
  );
}

function BatchDetail({
  batch,
  related,
  enabled,
  onBack,
  onCheck,
  onNote,
  onFlag,
  onEscalate,
  onRelease,
  onRecall,
}: {
  batch: Batch;
  related: { id: string; severity: string; status: string; date: string }[];
  enabled: boolean;
  onBack: () => void;
  onCheck: (index: number, done: boolean) => void;
  onNote: (text: string) => void;
  onFlag: (reason: string) => void;
  onEscalate: (reason: string) => void;
  onRelease: () => void;
  onRecall: (reason: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const recalled = batch.qualityStatus === "Recalled";
  const released = batch.releaseStatus === "Released" && !recalled;
  const actions = [
    ...(released || recalled || batch.qualityStatus === "Quarantined"
      ? []
      : [
          {
            id: "release",
            label: "Release batch",
            title: "Release batch",
            description: `Release ${batch.id} only if the checklist is complete. Documents on file do not release it.`,
            confirmLabel: "Release",
            onConfirm: () => onRelease(),
          },
        ]),
    ...(recalled
      ? []
      : [
          {
            id: "flag",
            label: "Flag a quality concern",
            title: "Flag a quality concern",
            description: `Place ${batch.id} on hold. The existing release record is not rewritten.`,
            confirmLabel: "Flag concern",
            requireReason: true,
            reasonLabel: "Quality concern",
            onConfirm: onFlag,
          },
          {
            id: "escalate",
            label: "Escalate",
            title: "Escalate issue",
            description: `Record an escalation for ${batch.id}.`,
            confirmLabel: "Escalate",
            requireReason: true,
            reasonLabel: "Escalation note",
            onConfirm: onEscalate,
          },
          {
            id: "recall",
            label: "Record recall",
            title: "Record a recall",
            description: `Mark ${batch.id} recalled and keep the reason with the release history.`,
            confirmLabel: "Record recall",
            destructive: true,
            requireReason: true,
            reasonLabel: "Reason for recall",
            onConfirm: onRecall,
          },
        ]),
  ];
  return (
    <DetailShell
      title="Quality & Batches"
      subtitle="Batch records, quality documents, and release decisions."
      backLabel="Back to batches"
      onBack={onBack}
      heading={batch.id}
      meta={`${batch.product} · ${batch.manufacturer}`}
      badge={
        <>
          <ReviewBadge status={batch.qualityStatus} />
          <ReviewBadge status={batch.releaseStatus} />
        </>
      }
      tabLabel="Batch sections"
      tab={tab}
      tabs={tabs}
      onTab={setTab}
      decisions={
        actions.length ? (
          <ReviewDecisions enabled={enabled} actions={actions} />
        ) : (
          <p className="text-sm text-muted-foreground">This recall is already recorded.</p>
        )
      }
    >
      {tab === "Overview" ? (
        <>
          <DetailSection title="Batch">
            <MetaList
              rows={[
                { label: "Batch ID", value: batch.id },
                { label: "Product", value: batch.product },
                { label: "Manufacturer", value: batch.manufacturer },
                { label: "Batch date", value: batch.batchDate },
                { label: "Quantity", value: batch.quantity },
                { label: "Expiry", value: batch.expiry },
                { label: "Site", value: batch.site },
                { label: "Documents on file", value: batch.documentsOnFile.join(", ") },
              ]}
            />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Release status stays separate from the documents on file. A batch is released only
              when a reviewer confirms it.
            </p>
          </DetailSection>
          <DetailSection title="Quality flags">
            {batch.flags.length ? (
              <ul className="space-y-3">
                {batch.flags.map((flag) => (
                  <li key={`${flag.label}-${flag.detail}`}>
                    <p className="font-medium">{flag.label}</p>
                    <p className="text-sm text-muted-foreground">{flag.detail}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No quality flags are open.</p>
            )}
          </DetailSection>
          {batch.recall ? (
            <DetailSection title="Recall">
              <MetaList
                rows={[
                  { label: "Initiated", value: batch.recall.initiated },
                  { label: "Reason", value: batch.recall.reason },
                  { label: "Scope", value: batch.recall.scope },
                ]}
              />
            </DetailSection>
          ) : null}
        </>
      ) : null}
      {tab === "Quality Documents" ? (
        <>
          <DetailSection title="Certificate of Analysis">
            {batch.coa.length ? (
              <PlainTable
                headers={["Parameter", "Specification", "Result", "Disposition"]}
                rows={batch.coa.map((row) => [
                  row.parameter,
                  row.specification,
                  row.result,
                  <ReviewBadge key={row.parameter} status={row.disposition} />,
                ])}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No certificate of analysis is on file.
              </p>
            )}
          </DetailSection>
          <DetailSection title="Batch manufacturing record">
            {batch.bmr.length ? (
              <PlainTable
                headers={["Step", "Recorded", "Operator"]}
                rows={batch.bmr.map((row) => [row.step, row.recorded, row.operator])}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No batch manufacturing record is on file.
              </p>
            )}
            <p className="mt-4 text-sm text-muted-foreground">
              These documents can be reviewed here. Filing them does not release the batch.
            </p>
          </DetailSection>
        </>
      ) : null}
      {tab === "Review Checklist" ? (
        <DetailSection title="Release checklist">
          <CheckList
            items={batch.checklist}
            disabled={!enabled || released || recalled}
            onToggle={onCheck}
          />
          {enabled ? (
            <div className="mt-5">
              <NoteForm onAdd={onNote} />
            </div>
          ) : null}
        </DetailSection>
      ) : null}
      {tab === "Release History" ? (
        <DetailSection title="Release history">
          <Timeline items={batch.releaseHistory} />
          <div className="mt-5 border-t border-border pt-5">
            <h4 className="mb-3 text-sm font-semibold">Review notes</h4>
            {batch.notes.length ? (
              <ul className="space-y-3">
                {batch.notes.map((item) => (
                  <li key={`${item.at}-${item.text}`}>
                    <p className="text-sm">{item.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.at} · {item.by}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No review notes yet.</p>
            )}
          </div>
          <div className="mt-5 border-t border-border pt-5">
            <h4 className="mb-3 text-sm font-semibold">Review history</h4>
            <Timeline items={batch.history} />
          </div>
        </DetailSection>
      ) : null}
      {tab === "Related Safety Cases" ? (
        <DetailSection title="Related safety cases">
          {related.length ? (
            <PlainTable
              headers={["Case", "Report date", "Reported severity", "Status"]}
              rows={related.map((item) => [
                item.id,
                item.date,
                <ReviewBadge key={`${item.id}-severity`} status={item.severity} />,
                <ReviewBadge key={`${item.id}-status`} status={item.status} />,
              ])}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No safety cases are linked to this batch.
            </p>
          )}
        </DetailSection>
      ) : null}
    </DetailShell>
  );
}
