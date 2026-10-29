import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/portal/brand";
import { Button } from "@/components/ui/button";
import { DataTable, Timeline, type Column } from "@/components/admin/ui";
import { useCatalog } from "@/features/admin/catalog-state";
import {
  dosageForms,
  latestVersion,
  medicineStatuses,
  type Medicine,
  type MedicineStatus,
} from "@/features/admin/catalog-data";
import {
  BackButton,
  DetailSection,
  MetaList,
  SearchField,
  SelectField,
  ViewTabs,
} from "@/features/admin/fields";
import { PlainTable, recorded, ReviewBadge, ReviewDecisions } from "@/features/admin/review-ui";
import { useStore } from "@/lib/admin-store";

import { ApprovalsQueue } from "@/features/admin/approvals-page";

const tabs = ["Overview", "Formulation", "Documents", "Submissions", "Version History"] as const;
type Tab = (typeof tabs)[number];

export function MedicinesDirectory() {
  const { medicines, manufacturers, decideMedicine } = useCatalog();
  const { can } = useStore();
  const [sectionMode, setSectionMode] = useState<"catalog" | "approvals">("catalog");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<MedicineStatus | "all">("all");
  const [form, setForm] = useState("all");
  const [manufacturer, setManufacturer] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = medicines.find((item) => item.id === selectedId) ?? null;

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return medicines.filter((item) => {
      const current = latestVersion(item);
      const haystack = `${item.name} ${item.brand} ${item.sku} ${item.manufacturer}`.toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (status !== "all" && current.status !== status) return false;
      if (form !== "all" && item.dosageForm !== form) return false;
      if (manufacturer !== "all" && item.manufacturerId !== manufacturer) return false;
      return true;
    });
  }, [medicines, query, status, form, manufacturer]);

  if (selected) {
    return (
      <MedicineDetail
        medicine={selected}
        enabled={can("manage")}
        onBack={() => setSelectedId(null)}
        onApprove={() => {
          const result = decideMedicine(selected.id, "approve", "");
          if (!result.ok) toast.error(result.message);
          else recorded(`Version ${latestVersion(selected).version} approved`);
        }}
        onRequest={(reason) => {
          const before = latestVersion(selected);
          const result = decideMedicine(selected.id, "request", reason);
          if (!result.ok) toast.error(result.message);
          else if (before.status === "Approved" || before.status === "Inactive") {
            recorded(`Version ${before.version} kept unchanged`);
          } else recorded("Change request recorded");
        }}
        onReject={(reason) => {
          const result = decideMedicine(selected.id, "reject", reason);
          if (!result.ok) toast.error(result.message);
          else recorded("Rejection recorded");
        }}
      />
    );
  }

  const columns: Column<Medicine>[] = [
    { header: "Medicine", cell: (row) => <span className="font-semibold">{row.name}</span> },
    { header: "Brand", cell: (row) => row.brand },
    { header: "Manufacturer", cell: (row) => row.manufacturer },
    { header: "Dosage Form", cell: (row) => row.dosageForm },
    { header: "Version", cell: (row) => `v${latestVersion(row).version}` },
    { header: "Status", cell: (row) => <ReviewBadge status={latestVersion(row).status} /> },
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
          View submission
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Product management"
        subtitle="Review medicine submissions, product approvals, and maintain the verified product catalogue."
      />

      <div className="mb-4">
        <ViewTabs
          label="Product management views"
          value={sectionMode === "catalog" ? "Product Catalogue" : "Approval Queue"}
          onChange={(val) => setSectionMode(val === "Approval Queue" ? "approvals" : "catalog")}
          options={[
            { id: "Product Catalogue", label: "Product Catalogue" },
            { id: "Approval Queue", label: "Approval Queue" },
          ]}
        />
      </div>

      {sectionMode === "approvals" ? (
        <ApprovalsQueue />
      ) : (
        <section className="card-surface">
          <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <SearchField
                label="Search"
                value={query}
                onChange={setQuery}
                placeholder="Medicine, brand, SKU, or manufacturer"
              />
            </div>
            <SelectField
              label="Dosage form"
              value={form}
              onChange={setForm}
              options={[
                { value: "all", label: "All dosage forms" },
                ...dosageForms.map((item) => ({ value: item, label: item })),
              ]}
            />
            <SelectField
              label="Manufacturer"
              value={manufacturer}
              onChange={setManufacturer}
              options={[
                { value: "all", label: "All manufacturers" },
                ...manufacturers.map((item) => ({ value: item.id, label: item.company })),
              ]}
            />
            <SelectField
              label="Status"
              value={status}
              onChange={(value) => setStatus(value as MedicineStatus | "all")}
              options={[
                { value: "all", label: "All statuses" },
                ...medicineStatuses.map((item) => ({ value: item, label: item })),
              ]}
            />
          </div>
          <DataTable
            key={`${query}|${status}|${form}|${manufacturer}`}
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

function MedicineDetail({
  medicine,
  enabled,
  onBack,
  onApprove,
  onRequest,
  onReject,
}: {
  medicine: Medicine;
  enabled: boolean;
  onBack: () => void;
  onApprove: () => void;
  onRequest: (reason: string) => void;
  onReject: (reason: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const current = latestVersion(medicine);
  const locked = current.status === "Approved" || current.status === "Inactive";
  return (
    <div>
      <PageHeader
        title="Product management"
        subtitle="Review medicine submissions, product approvals, and maintain the verified product catalogue."
      />
      <BackButton onClick={onBack} label="Back to products" />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="type-record">{medicine.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {medicine.brand} · {medicine.sku} · Version {current.version}
          </p>
        </div>
        <ReviewBadge status={current.status} />
      </div>
      <div className="mt-4">
        <ReviewDecisions
          enabled={enabled}
          actions={[
            {
              id: "approve",
              label: "Approve",
              title: "Approve submission",
              description: `Approve version ${current.version} of ${medicine.name}. Earlier versions stay as they are.`,
              confirmLabel: "Approve",
              onConfirm: () => onApprove(),
            },
            {
              id: "request",
              label: "Request corrections",
              title: "Request corrections",
              description: locked
                ? `Version ${current.version} stays ${current.status.toLowerCase()}. A new version will be added.`
                : `Record the corrections needed on version ${current.version}.`,
              confirmLabel: "Request corrections",
              requireReason: true,
              reasonLabel: "Changes required",
              onConfirm: onRequest,
            },
            {
              id: "reject",
              label: "Reject with Reason",
              title: "Reject submission",
              description: locked
                ? "Approved and inactive versions cannot be rejected in place."
                : `Reject version ${current.version} of ${medicine.name}.`,
              confirmLabel: "Reject",
              destructive: true,
              requireReason: true,
              reasonLabel: "Reason for rejection",
              onConfirm: onReject,
            },
          ]}
        />
      </div>
      <div className="mt-5">
        <ViewTabs
          label="Medicine sections"
          value={tab}
          onChange={setTab}
          options={tabs.map((item) => ({ id: item, label: item }))}
        />
      </div>
      <div className="mt-4 space-y-4">
        {tab === "Overview" ? (
          <DetailSection title="Product">
            <MetaList
              rows={[
                { label: "Brand", value: medicine.brand },
                { label: "Manufacturer", value: medicine.manufacturer },
                { label: "Dosage form", value: medicine.dosageForm },
                { label: "Pack size", value: current.packSize },
                { label: "Classification", value: current.classification },
                { label: "SKU", value: medicine.sku },
                { label: "Submitted", value: current.submitted },
                { label: "Labels", value: current.labels.join(" ") },
              ]}
            />
          </DetailSection>
        ) : null}
        {tab === "Formulation" ? (
          <DetailSection title={`Version ${current.version} formulation`}>
            <PlainTable
              headers={["Ingredient", "Part", "Quantity"]}
              rows={current.formulation.map((line) => [line.ingredient, line.part, line.quantity])}
            />
            <div className="mt-4">
              <p className="text-sm font-semibold">Formulation references</p>
              <ul className="mt-2 space-y-2">
                {current.labels.map((label) => (
                  <li key={label} className="text-sm leading-relaxed">
                    {label}
                  </li>
                ))}
                {current.note ? (
                  <li className="text-sm leading-relaxed text-muted-foreground">{current.note}</li>
                ) : null}
              </ul>
            </div>
          </DetailSection>
        ) : null}
        {tab === "Documents" ? (
          <DetailSection title="Supporting documents">
            <ul className="space-y-2">
              {medicine.documents.map((document) => (
                <li
                  key={`${document.name}-${document.version}`}
                  className="rounded-xl border border-border px-3 py-2"
                >
                  <p className="font-medium">{document.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Version {document.version} · submitted {document.submitted}
                  </p>
                </li>
              ))}
            </ul>
          </DetailSection>
        ) : null}
        {tab === "Submissions" ? (
          <DetailSection title="Product submissions">
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              Each submission is kept. A later decision does not replace an earlier formulation.
            </p>
            <PlainTable
              headers={["Version", "Submitted", "Status", "Note"]}
              rows={medicine.versions
                .slice()
                .reverse()
                .map((version) => [
                  `v${version.version}`,
                  version.submitted,
                  <ReviewBadge key={version.version} status={version.status} />,
                  version.note ?? "—",
                ])}
            />
          </DetailSection>
        ) : null}
        {tab === "Version History" ? (
          <div className="space-y-4">
            {medicine.versions
              .slice()
              .reverse()
              .map((version) => (
                <DetailSection key={version.version} title={`Version ${version.version}`}>
                  <div className="mb-3">
                    <ReviewBadge status={version.status} />
                  </div>
                  <MetaList
                    rows={[
                      { label: "Submitted", value: version.submitted },
                      { label: "Pack size", value: version.packSize },
                      { label: "Classification", value: version.classification },
                    ]}
                  />
                  <div className="mt-4">
                    <PlainTable
                      headers={["Ingredient", "Part", "Quantity"]}
                      rows={version.formulation.map((line) => [
                        line.ingredient,
                        line.part,
                        line.quantity,
                      ])}
                    />
                  </div>
                  {version.note ? (
                    <p className="mt-3 text-sm text-muted-foreground">{version.note}</p>
                  ) : null}
                </DetailSection>
              ))}
            <DetailSection title="Decision history">
              <Timeline items={medicine.history} />
            </DetailSection>
          </div>
        ) : null}
      </div>
    </div>
  );
}
