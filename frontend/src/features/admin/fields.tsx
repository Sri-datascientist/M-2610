import type { ReactNode } from "react";
import { focusRing } from "@/components/portal/brand";
import { cn } from "@/lib/utils";

export function SearchField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block min-w-0 flex-1">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-11 w-full rounded-xl border border-input bg-background px-4 text-[15px] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15",
          focusRing,
        )}
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className={cn(
          "h-11 w-full rounded-xl border border-input bg-background px-3 text-[15px] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15",
          focusRing,
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ViewTabs<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={value === option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-full px-3 py-2 text-sm font-semibold",
            value === option.id
              ? "bg-primary text-primary-foreground"
              : "bg-surface text-muted-foreground hover:text-foreground",
            focusRing,
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("text-sm font-semibold text-primary", focusRing)}
    >
      {label}
    </button>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "email";
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-11 w-full rounded-xl border border-input bg-background px-4 text-[15px] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15",
          focusRing,
        )}
      />
    </label>
  );
}

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-11 w-full rounded-xl border border-input bg-background px-4 text-[15px] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15",
          focusRing,
        )}
      />
    </label>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows = 6,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      {hint ? <span className="mb-2 block text-sm text-muted-foreground">{hint}</span> : null}
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "w-full rounded-xl border border-input bg-background px-4 py-3 text-[15px] leading-relaxed focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15",
          focusRing,
        )}
      />
    </label>
  );
}

export function MetaList({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label}>
          <dt className="text-sm text-muted-foreground">{row.label}</dt>
          <dd className="mt-1 font-medium">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card-surface p-5 sm:p-6">
      <h3 className="type-section">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SummaryRow({
  items,
}: {
  items: {
    label: string;
    value: number | string;
    pressed?: boolean | undefined;
    onClick?: (() => void) | undefined;
  }[];
}) {
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const isClickable = typeof item.onClick === "function";
        const content = (
          <>
            <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
            <span className="mt-1 block text-2xl font-semibold tracking-tight">{item.value}</span>
          </>
        );

        if (isClickable) {
          return (
            <button
              key={item.label}
              type="button"
              aria-pressed={item.pressed}
              onClick={item.onClick}
              className={cn(
                "card-surface px-4 py-3 text-left transition-colors",
                item.pressed && "border-primary ring-1 ring-primary/20",
                focusRing,
              )}
            >
              {content}
            </button>
          );
        }

        return (
          <div key={item.label} className="card-surface px-4 py-3 text-left">
            {content}
          </div>
        );
      })}
    </div>
  );
}
