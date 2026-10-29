import type { ReactNode } from "react";
import { PageHeader } from "@/components/portal/brand";
import { Button } from "@/components/ui/button";
import { BackButton, ViewTabs } from "@/features/admin/fields";
import { ReviewBadge } from "@/features/admin/review-ui";
import type { Column } from "@/components/admin/ui";

export function DirectoryShell({
  title,
  subtitle,
  action,
  filters,
  table,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  filters: ReactNode;
  table: ReactNode;
}) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} action={action} />
      <section className="card-surface">
        <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-2 lg:grid-cols-3">
          {filters}
        </div>
        {table}
      </section>
    </div>
  );
}

export function DetailShell<T extends string>({
  title,
  subtitle,
  backLabel,
  onBack,
  heading,
  meta,
  badge,
  decisions,
  tabLabel,
  tab,
  tabs,
  onTab,
  children,
}: {
  title: string;
  subtitle: string;
  backLabel: string;
  onBack: () => void;
  heading: string;
  meta: string;
  badge: ReactNode;
  decisions: ReactNode;
  tabLabel: string;
  tab: T;
  tabs: readonly T[];
  onTab: (tab: T) => void;
  children: ReactNode;
}) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <BackButton onClick={onBack} label={backLabel} />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="type-record">{heading}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{meta}</p>
        </div>
        <div className="flex flex-wrap gap-2">{badge}</div>
      </div>
      <div className="mt-4">{decisions}</div>
      <div className="mt-5">
        <ViewTabs
          label={tabLabel}
          value={tab}
          onChange={onTab}
          options={tabs.map((item) => ({ id: item, label: item }))}
        />
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

export function openColumn<T extends { id: string }>(onOpen: (id: string) => void): Column<T> {
  return {
    header: "Actions",
    cell: (row) => (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={(event) => {
          event.stopPropagation();
          onOpen(row.id);
        }}
      >
        Open
      </Button>
    ),
  };
}

export function CheckList({
  items,
  disabled,
  onToggle,
}: {
  items: { label: string; done: boolean; note?: string }[];
  disabled?: boolean;
  onToggle: (index: number, done: boolean) => void;
}) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={item.label}>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={item.done}
              disabled={disabled}
              onChange={() => onToggle(index, !item.done)}
            />
            <span>
              {item.label}
              {item.note ? (
                <span className="mt-0.5 block text-muted-foreground">{item.note}</span>
              ) : null}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}

export function DocumentList({
  documents,
}: {
  documents: { name: string; submitted: string; version?: number }[];
}) {
  if (!documents.length) {
    return <p className="text-sm text-muted-foreground">No documents are attached.</p>;
  }
  return (
    <ul className="space-y-2">
      {documents.map((document) => (
        <li
          key={`${document.name}-${document.submitted}`}
          className="rounded-xl border border-border px-3 py-2"
        >
          <p className="font-medium">{document.name}</p>
          <p className="text-sm text-muted-foreground">
            Submitted {document.submitted}
            {document.version ? ` · version ${document.version}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function ProtectedNotice({ items }: { items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm leading-relaxed">
      <p className="font-semibold">Protected information</p>
      <p className="mt-1 text-muted-foreground">
        Names, contact details, and exact locations are withheld. This view shows only the
        authorized, de-identified record.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function StatusMark({ status }: { status: string }) {
  return <ReviewBadge status={status} />;
}
