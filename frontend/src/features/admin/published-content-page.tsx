import { Link } from "@tanstack/react-router";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DataTable, EmptyState, type Column } from "@/components/admin/ui";
import { PageHeader, focusRing } from "@/components/portal/brand";
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
import { formatIsoDate } from "@/features/admin/administration-data";
import { useCatalog } from "@/features/admin/catalog-state";
import { doctorSlugMap } from "@/features/admin/doctor-slug";
import { doctorStatusLabel, type Doctor } from "@/features/admin/catalog-data";
import {
  BackButton,
  DateField,
  DetailSection,
  MetaList,
  SearchField,
  SelectField,
} from "@/features/admin/fields";
import {
  contentCategories,
  filterPublishedContent,
  publishedContentStatuses,
  publishedContentTypes,
  publishedCounts,
  type ContentFilters,
  type ContentList,
  type PractitionerContent,
  type PublishedContentType,
} from "@/features/admin/published-content-data";
import { usePublishedContent } from "@/features/admin/published-content-state";
import { ReviewBadge } from "@/features/admin/review-ui";
import { cn } from "@/lib/utils";

const emptyFilters: ContentFilters = {
  query: "",
  type: "all",
  category: "all",
  from: "",
  to: "",
  list: "Published",
};

export function PublishedContentPage() {
  const { doctors } = useCatalog();
  const { items, removeFromPublication, restoreToPublication } = usePublishedContent();
  const [filters, setFilters] = useState<ContentFilters>(emptyFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const slugs = useMemo(() => doctorSlugMap(doctors), [doctors]);
  const counts = publishedCounts(items, doctors);
  const categories = contentCategories(items, doctors);
  const dateError = filters.from && filters.to && filters.from > filters.to;
  const rows = useMemo(() => {
    if (dateError) return [];
    return filterPublishedContent(items, doctors, filters);
  }, [dateError, items, doctors, filters]);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const selectedDoctor = doctors.find((doctor) => doctor.id === selected?.doctorId) ?? null;
  const filtersDirty =
    filters.query !== "" ||
    filters.type !== "all" ||
    filters.category !== "all" ||
    filters.from !== "" ||
    filters.to !== "" ||
    filters.list !== "Published";

  const closeDelete = () => {
    if (busyRef.current) return;
    setPendingId(null);
    triggerRef.current?.focus();
  };

  const confirmDelete = () => {
    if (busyRef.current) return;
    const id = pendingId;
    if (!id) {
      toast.error("That content record was not found.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    const result = removeFromPublication(id);
    busyRef.current = false;
    setBusy(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Content removed from public availability");
    setPendingId(null);
    if (selectedId === id) setSelectedId(null);
  };

  const askDelete = (id: string, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setPendingId(id);
  };

  const restore = (id: string) => {
    const doctor = doctors.find((item) => item.id === items.find((entry) => entry.id === id)?.doctorId);
    const result = restoreToPublication(id, doctor?.status === "Verified");
    if (!result.ok) toast.error(result.message);
    else toast.success("Content restored to the published list");
  };

  if (selected) {
    return (
      <div>
        <BackButton label="Back to published content" onClick={() => setSelectedId(null)} />
        <ContentDetail
          item={selected}
          doctor={selectedDoctor}
          doctorSlug={selectedDoctor ? slugs.get(selectedDoctor.id) : undefined}
          onDelete={(trigger) => askDelete(selected.id, trigger)}
          onRestore={() => restore(selected.id)}
        />
        <DeleteContentDialog
          open={pendingId === selected.id}
          busy={busy}
          onCancel={closeDelete}
          onConfirm={confirmDelete}
        />
      </div>
    );
  }

  const columns: Column<PractitionerContent>[] = [
    {
      header: "Title",
      cell: (row) => (
        <button
          type="button"
          className="text-left font-semibold hover:text-primary"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedId(row.id);
          }}
        >
          {row.title}
        </button>
      ),
    },
    {
      header: "Author",
      cell: (row) => doctors.find((doctor) => doctor.id === row.doctorId)?.name ?? "Not available",
    },
    { header: "Content Type", cell: (row) => row.type },
    { header: "Category", cell: (row) => row.category },
    { header: "Published Date", cell: (row) => formatIsoDate(row.publishedOn) },
    { header: "Status", cell: (row) => <ReviewBadge status={row.status} /> },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedId(row.id);
            }}
          >
            View Details
          </Button>
          {row.status === "Removed" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                restore(row.id);
              }}
            >
              Restore
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                askDelete(row.id, event.currentTarget);
              }}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Published Content"
        subtitle="Review and manage knowledge shared by verified practitioners."
      />
      <p className="mb-4 text-sm text-muted-foreground">
        Development samples only. This portal does not yet store practitioner publications.
      </p>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CountCard
          label="Total Published Content"
          value={counts.total}
          pressed={filters.list === "Published" && filters.type === "all"}
          onClick={() => setFilters((current) => ({ ...current, list: "Published", type: "all" }))}
        />
        <CountCard
          label="Articles"
          value={counts.articles}
          pressed={filters.list === "Published" && filters.type === "Article"}
          onClick={() => setFilters((current) => ({ ...current, list: "Published", type: "Article" }))}
        />
        <CountCard
          label="Research Journals"
          value={counts.journals}
          pressed={filters.list === "Published" && filters.type === "Research Journal"}
          onClick={() =>
            setFilters((current) => ({ ...current, list: "Published", type: "Research Journal" }))
          }
        />
        <CountCard
          label="Case Studies"
          value={counts.cases}
          pressed={filters.list === "Published" && filters.type === "Case Study"}
          onClick={() =>
            setFilters((current) => ({ ...current, list: "Published", type: "Case Study" }))
          }
        />
      </div>
      <section className="card-surface">
        <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SearchField
              label="Search"
              value={filters.query}
              onChange={(query) => setFilters((current) => ({ ...current, query }))}
              placeholder="Title, author, or keyword"
            />
          </div>
          <SelectField
            label="Content type"
            value={filters.type}
            onChange={(value) =>
              setFilters((current) => ({ ...current, type: value as PublishedContentType | "all" }))
            }
            options={[
              { value: "all", label: "All" },
              ...publishedContentTypes.map((item) => ({ value: item, label: item })),
            ]}
          />
          <SelectField
            label="Category"
            value={filters.category}
            onChange={(category) => setFilters((current) => ({ ...current, category }))}
            options={[
              { value: "all", label: "All categories" },
              ...categories.map((item) => ({ value: item, label: item })),
            ]}
          />
          <DateField
            label="Published from"
            value={filters.from}
            onChange={(from) => setFilters((current) => ({ ...current, from }))}
          />
          <DateField
            label="Published to"
            value={filters.to}
            onChange={(to) => setFilters((current) => ({ ...current, to }))}
          />
          <SelectField
            label="Status"
            value={filters.list}
            onChange={(value) => setFilters((current) => ({ ...current, list: value as ContentList }))}
            options={publishedContentStatuses.map((item) => ({ value: item, label: item }))}
          />
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              disabled={!filtersDirty}
              onClick={() => setFilters(emptyFilters)}
            >
              Clear filters
            </Button>
          </div>
        </div>
        {dateError ? (
          <EmptyState
            title="Check the publication dates"
            text="The start date is after the end date."
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No matching content"
            text={
              filters.list === "Published"
                ? "No published content from verified practitioners matches these filters."
                : "No content matches these filters."
            }
          />
        ) : (
          <DataTable
            key={`${filters.query}|${filters.type}|${filters.category}|${filters.from}|${filters.to}|${filters.list}`}
            rows={rows}
            columns={columns}
            onRowClick={(row) => setSelectedId(row.id)}
            pageSize={6}
          />
        )}
      </section>
      <DeleteContentDialog
        open={pendingId !== null}
        busy={busy}
        onCancel={closeDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function CountCard({
  label,
  value,
  pressed,
  onClick,
}: {
  label: string;
  value: number;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn("card-surface px-4 py-3 text-left", pressed && "border-primary", focusRing)}
    >
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="mt-1 block text-2xl font-semibold tracking-tight">{value}</span>
    </button>
  );
}

function ContentDetail({
  item,
  doctor,
  doctorSlug,
  onDelete,
  onRestore,
}: {
  item: PractitionerContent;
  doctor: Doctor | null;
  doctorSlug: string | undefined;
  onDelete: (trigger: HTMLElement) => void;
  onRestore: () => void;
}) {
  return (
    <div className="mt-4 space-y-4">
      <section className="card-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{item.type}</p>
            <h1 className="type-page mt-1">{item.title}</h1>
          </div>
          <ReviewBadge status={item.status} />
        </div>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">{item.summary}</p>
        <div className="mt-5">
          {item.status === "Removed" ? (
            <Button type="button" onClick={onRestore}>
              Restore
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={(event) => onDelete(event.currentTarget)}
            >
              Delete
            </Button>
          )}
        </div>
      </section>

      <DetailSection title="Author">
        <MetaList
          rows={[
            {
              label: "Doctor",
              value: doctor ? (
                doctorSlug ? (
                  <Link
                    to="/admin/doctors/$doctorSlug"
                    params={{ doctorSlug }}
                    className="font-semibold text-primary hover:underline"
                  >
                    {doctor.name}
                  </Link>
                ) : (
                  doctor.name
                )
              ) : (
                "Doctor record not found"
              ),
            },
            { label: "Registration", value: doctor?.registrationNumber ?? "Not available" },
            { label: "Council", value: doctor?.council ?? "Not available" },
            {
              label: "Verification status",
              value: doctor ? (
                <ReviewBadge status={doctorStatusLabel(doctor.status)} />
              ) : (
                "Not available"
              ),
            },
          ]}
        />
      </DetailSection>

      <DetailSection title={item.type === "Case Study" ? "Case note" : "Content"}>
        {item.type === "Case Study" ? (
          <p className="mb-4 text-sm text-muted-foreground">
            Patient name, contact details, and location are not shown.
          </p>
        ) : null}
        <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed">
          {item.body.split("\n\n").map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </DetailSection>

      <DetailSection title="Classification">
        <MetaList
          rows={[
            { label: "Category", value: item.category },
            {
              label: "Tags",
              value:
                item.tags.length > 0 ? (
                  <span className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                ) : (
                  "Not available"
                ),
            },
            { label: "Publication date", value: formatIsoDate(item.publishedOn) },
            {
              label: "Last updated",
              value: item.updatedOn ? formatIsoDate(item.updatedOn) : "Not available",
            },
            { label: "Publication status", value: <ReviewBadge status={item.status} /> },
          ]}
        />
      </DetailSection>

      <DetailSection title="References">
        {item.references.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not available</p>
        ) : (
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed">
            {item.references.map((reference) => (
              <li key={reference}>{reference}</li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Attachments">
        {item.attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not available</p>
        ) : (
          <ul className="space-y-2 text-[15px]">
            {item.attachments.map((attachment) => (
              <li key={attachment}>{attachment}</li>
            ))}
          </ul>
        )}
      </DetailSection>
    </div>
  );
}

function DeleteContentDialog({
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
    <AlertDialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <AlertDialogPortal>
        <AlertDialogOverlay className="bg-foreground/20 backdrop-blur-[1px]" />
        <AlertDialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft"
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete published content?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this content from Meyveda? This action may affect its public availability.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={busy} onClick={onConfirm}>
              Delete Content
            </Button>
          </AlertDialogFooter>
        </AlertDialogPrimitive.Content>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
