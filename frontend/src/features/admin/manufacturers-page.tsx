import { useMemo, useState } from "react";
import { PageHeader } from "@/components/portal/brand";
import { Button } from "@/components/ui/button";
import { DataTable, Timeline, type Column } from "@/components/admin/ui";
import { useCatalog } from "@/features/admin/catalog-state";
import {
  licenceStatuses,
  manufacturerStatuses,
  type Manufacturer,
  type ManufacturerStatus,
} from "@/features/admin/catalog-data";
import {
  BackButton,
  DetailSection,
  MetaList,
  SearchField,
  SelectField,
  SummaryRow,
  ViewTabs,
} from "@/features/admin/fields";
import {
  NoteForm,
  PlainTable,
  recorded,
  ReviewBadge,
  ReviewDecisions,
} from "@/features/admin/review-ui";
import { latestVersion } from "@/features/admin/catalog-data";
import { useStore } from "@/lib/admin-store";

const tabs = ["Overview", "Facilities", "Licences", "Products", "Documents", "History"] as const;
type Tab = (typeof tabs)[number];

export function ManufacturersDirectory() {
  const { manufacturers, medicines, addManufacturerNote, decideManufacturer } = useCatalog();
  const { can } = useStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ManufacturerStatus | "all">("all");
  const [licence, setLicence] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = manufacturers.find((item) => item.id === selectedId) ?? null;

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return manufacturers.filter((item) => {
      const haystack = `${item.company} ${item.location}`.toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (status !== "all" && item.status !== status) return false;
      if (licence !== "all" && item.licenceStatus !== licence) return false;
      return true;
    });
  }, [manufacturers, query, status, licence]);

  const count = (value: ManufacturerStatus) =>
    manufacturers.filter((item) => item.status === value).length;

  if (selected) {
    const products = medicines.filter((item) => item.manufacturerId === selected.id);
    return (
      <ManufacturerDetail
        manufacturer={selected}
        products={products.map((item) => ({
          name: item.name,
          sku: item.sku,
          status: latestVersion(item).status,
        }))}
        enabled={can("manage")}
        onBack={() => setSelectedId(null)}
        onNote={(text) => addManufacturerNote(selected.id, text)}
        onApprove={() => {
          decideManufacturer(selected.id, "approve", "");
          recorded("Manufacturer approved");
        }}
        onCorrections={(reason) => {
          decideManufacturer(selected.id, "corrections", reason);
          recorded("Correction request recorded");
        }}
        onReject={(reason) => {
          decideManufacturer(selected.id, "reject", reason);
          recorded("Rejection recorded");
        }}
      />
    );
  }

  const columns: Column<Manufacturer>[] = [
    { header: "Company", cell: (row) => <span className="font-semibold">{row.company}</span> },
    { header: "Location", cell: (row) => row.location },
    { header: "Application Date", cell: (row) => row.applicationDate },
    { header: "Licence Status", cell: (row) => <ReviewBadge status={row.licenceStatus} /> },
    { header: "Verification Status", cell: (row) => <ReviewBadge status={row.status} /> },
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
          Review
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Manufacturer verification"
        subtitle="Manage pharmaceutical company applications and facility verification."
      />
      <SummaryRow
        items={[
          {
            label: "Pending Applications",
            value: count("Pending Review"),
            pressed: status === "Pending Review",
            onClick: () =>
              setStatus((current) => (current === "Pending Review" ? "all" : "Pending Review")),
          },
          {
            label: "Under Review",
            value: count("Under Review"),
            pressed: status === "Under Review",
            onClick: () =>
              setStatus((current) => (current === "Under Review" ? "all" : "Under Review")),
          },
          {
            label: "Verified Manufacturers",
            value: count("Verified"),
            pressed: status === "Verified",
            onClick: () => setStatus((current) => (current === "Verified" ? "all" : "Verified")),
          },
        ]}
      />
      <section className="card-surface">
        <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SearchField
              label="Search"
              value={query}
              onChange={setQuery}
              placeholder="Company or location"
            />
          </div>
          <SelectField
            label="Verification status"
            value={status}
            onChange={(value) => setStatus(value as ManufacturerStatus | "all")}
            options={[
              { value: "all", label: "All verification statuses" },
              ...manufacturerStatuses.map((item) => ({ value: item, label: item })),
            ]}
          />
          <SelectField
            label="Licence status"
            value={licence}
            onChange={setLicence}
            options={[
              { value: "all", label: "All licence statuses" },
              ...licenceStatuses.map((item) => ({ value: item, label: item })),
            ]}
          />
        </div>
        <DataTable
          key={`${query}|${status}|${licence}`}
          rows={rows}
          columns={columns}
          onRowClick={(row) => setSelectedId(row.id)}
          pageSize={6}
        />
      </section>
    </div>
  );
}

function ManufacturerDetail({
  manufacturer,
  products,
  enabled,
  onBack,
  onNote,
  onApprove,
  onCorrections,
  onReject,
}: {
  manufacturer: Manufacturer;
  products: { name: string; sku: string; status: string }[];
  enabled: boolean;
  onBack: () => void;
  onNote: (text: string) => void;
  onApprove: () => void;
  onCorrections: (reason: string) => void;
  onReject: (reason: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const closed = manufacturer.status === "Rejected" || manufacturer.status === "Suspended";
  return (
    <div>
      <PageHeader
        title="Manufacturer verification"
        subtitle="Manage pharmaceutical company applications and facility verification."
      />
      <BackButton onClick={onBack} label="Back to manufacturers" />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="type-record">{manufacturer.company}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{manufacturer.location}</p>
        </div>
        <ReviewBadge status={manufacturer.status} />
      </div>
      <div className="mt-4">
        {closed ? (
          <p className="text-sm text-muted-foreground">This decision is already recorded.</p>
        ) : (
          <ReviewDecisions
            enabled={enabled}
            actions={[
              {
                id: "approve",
                label: "Approve",
                title: "Approve manufacturer",
                description: `${manufacturer.company} will be marked verified for this session.`,
                confirmLabel: "Approve",
                onConfirm: () => onApprove(),
              },
              {
                id: "corrections",
                label: "Request Corrections",
                title: "Request corrections",
                description: `Describe what ${manufacturer.company} must correct.`,
                confirmLabel: "Request corrections",
                requireReason: true,
                reasonLabel: "Corrections required",
                onConfirm: onCorrections,
              },
              {
                id: "reject",
                label: "Reject with Reason",
                title: "Reject application",
                description: `${manufacturer.company} · ${manufacturer.location}`,
                confirmLabel: "Reject",
                destructive: true,
                requireReason: true,
                reasonLabel: "Reason for rejection",
                onConfirm: onReject,
              },
            ]}
          />
        )}
      </div>
      <div className="mt-5">
        <ViewTabs
          label="Manufacturer sections"
          value={tab}
          onChange={setTab}
          options={tabs.map((item) => ({ id: item, label: item }))}
        />
      </div>
      <div className="mt-4">
        {tab === "Overview" ? (
          <DetailSection title="Company">
            <MetaList
              rows={[
                { label: "Contact", value: manufacturer.contact },
                { label: "Email", value: manufacturer.email },
                { label: "Phone", value: manufacturer.phone || "—" },
                { label: "Registered address", value: manufacturer.registeredAddress || manufacturer.location },
                { label: "State", value: manufacturer.state },
                { label: "PIN Code", value: manufacturer.pincode },
                { label: "GSTIN", value: manufacturer.gstin },
                { label: "Established", value: manufacturer.yearEstablished },
                { label: "Application date", value: manufacturer.applicationDate },
                {
                  label: "Licence status",
                  value: <ReviewBadge status={manufacturer.licenceStatus} />,
                },
                {
                  label: "Form 25D status",
                  value: (
                    <span className="inline-flex items-center gap-2">
                      <ReviewBadge status={manufacturer.form25d.status} />
                      <span className="text-xs text-muted-foreground font-mono">
                        {manufacturer.form25d.number}
                      </span>
                    </span>
                  ),
                },
              ]}
            />
          </DetailSection>
        ) : null}
        {tab === "Facilities" ? (
          <DetailSection title="Manufacturing facilities">
            <PlainTable
              headers={["Facility", "Address", "Type", "Status"]}
              rows={manufacturer.facilities.map((item) => [
                item.name,
                item.address,
                item.kind,
                item.status,
              ])}
            />
          </DetailSection>
        ) : null}
        {tab === "Licences" ? (
          <div className="space-y-4">
            <DetailSection title="Form 25D Details (Ayurvedic Manufacturing Endorsement)">
              <div className="rounded-xl border border-border p-4 bg-surface/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-base">{manufacturer.form25d.number}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Official Form 25D Document / Licence Number</p>
                  </div>
                  <ReviewBadge status={manufacturer.form25d.status} />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-border text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">Issue Date</span>
                    <span className="font-medium">{manufacturer.form25d.issued}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Expiry Date</span>
                    <span className="font-medium">{manufacturer.form25d.expires}</span>
                  </div>
                </div>
              </div>
            </DetailSection>
            <DetailSection title="Manufacturing Licences & Certificates">
              <PlainTable
                headers={["Licence", "Number", "Issued", "Expires", "Status"]}
                rows={manufacturer.licences.map((item) => [
                  item.name,
                  item.number,
                  item.issued,
                  item.expires,
                  <ReviewBadge key={item.number} status={item.status} />,
                ])}
              />
            </DetailSection>
          </div>
        ) : null}
        {tab === "Products" ? (
          <DetailSection title="Linked products">
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No medicines are linked to this company yet.
              </p>
            ) : (
              <PlainTable
                headers={["Medicine", "SKU", "Status"]}
                rows={products.map((item) => [
                  item.name,
                  item.sku,
                  <ReviewBadge key={item.sku} status={item.status} />,
                ])}
              />
            )}
          </DetailSection>
        ) : null}
        {tab === "Documents" ? (
          <DetailSection title="Submitted documents">
            <ul className="space-y-2">
              {manufacturer.documents.map((document) => (
                <li key={document.name} className="rounded-xl border border-border px-3 py-2">
                  <p className="font-medium">{document.name}</p>
                  <p className="text-sm text-muted-foreground">Submitted {document.submitted}</p>
                </li>
              ))}
            </ul>
          </DetailSection>
        ) : null}
        {tab === "History" ? (
          <div className="space-y-4">
            <DetailSection title="Review notes">
              <NoteForm onAdd={onNote} />
              <ul className="mt-4 space-y-2">
                {manufacturer.notes.length === 0 ? (
                  <li className="text-sm text-muted-foreground">No notes yet.</li>
                ) : (
                  manufacturer.notes.map((item, index) => (
                    <li
                      key={`${item.at}-${index}`}
                      className="rounded-xl border border-border px-3 py-2"
                    >
                      <p>{item.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.at} · {item.by}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </DetailSection>
            <DetailSection title="Review history">
              <Timeline items={manufacturer.history} />
            </DetailSection>
          </div>
        ) : null}
      </div>
    </div>
  );
}
