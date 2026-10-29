import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Upload } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { actions, useStore, type Saved } from "@/lib/store";
import type { VerificationStatus } from "@/lib/mock-data";

export function PageHeader({
  eyebrow,
  title,
  desc,
  actions: act,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-4 pt-7 pb-6 md:px-8">
      <div className="max-w-2xl">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="type-page text-foreground">{title}</h1>
        {desc && (
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">{desc}</p>
        )}
      </div>
      {act && <div className="flex flex-wrap gap-2">{act}</div>}
    </div>
  );
}

const tone: Record<string, string> = {
  orange: "bg-primary-soft text-accent-foreground border-primary/20",
  ink: "bg-ink text-ink-foreground border-ink",
  muted: "bg-muted text-muted-foreground border-border",
  warn: "bg-primary-soft text-primary-deep border-primary/40",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
  outline: "bg-card text-foreground border-border",
};

export function Pill({
  children,
  t = "muted",
  className,
  title,
}: {
  children: ReactNode;
  t?: keyof typeof tone;
  className?: string;
  title?: string | undefined;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold",
        tone[t],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const t =
    status === "Verified"
      ? "ink"
      : status === "Rejected" || status === "Suspended"
        ? "danger"
        : status === "Not Submitted"
          ? "muted"
          : "warn";
  return (
    <Pill t={t}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "Verified" ? "bg-primary" : "bg-current",
        )}
      />
      {status}
    </Pill>
  );
}

export function EvidencePill({ s }: { s: string }) {
  const t =
    s === "Evidence available" || s === "Reviewed"
      ? "ink"
      : s === "Review pending"
        ? "warn"
        : s === "Reference documented"
          ? "orange"
          : "muted";
  return <Pill t={t}>{s}</Pill>;
}

export function SaveButton({
  id,
  kind,
  className,
}: {
  id: string;
  kind: Saved["kind"];
  className?: string;
}) {
  const saved = useStore((s) => s.saved);
  const on = saved.some((x) => x.id === id);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        actions.toggleSave(id, kind);
        toast(on ? "Removed from Saved Items" : "Saved to Saved Items");
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors",
        on
          ? "border-primary bg-primary-soft text-accent-foreground"
          : "bg-card hover:border-primary/50",
        className,
      )}
      aria-pressed={on}
    >
      <motion.span key={String(on)} initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
        {on ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
      </motion.span>
      {on ? "Saved" : "Save"}
    </button>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
        active
          ? "border-ink text-ink-foreground"
          : "bg-card text-foreground hover:border-primary/60",
      )}
    >
      {active && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 -z-0 rounded-full bg-ink"
        />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="h"
      animate="s"
      variants={{ s: { transition: { staggerChildren: 0.05 } } }}
    >
      {children}
    </motion.div>
  );
}
export const item = {
  h: { opacity: 0, y: 10 },
  s: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

export function Empty({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed px-6 py-14 text-center">
      <div className="mb-3 h-10 w-10 rounded-full bg-primary-soft" />
      <div className="font-semibold">{title}</div>
      {desc && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: ReactNode;
  hint?: string | undefined;
  error?: string | undefined;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-destructive">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

export function MockUpload({
  files,
  onChange,
  label = "Attach documents",
}: {
  files: string[];
  onChange: (f: string[]) => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed bg-surface px-3 py-4 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-foreground"
      >
        <Upload className="h-4 w-4" /> {label}{" "}
        <span className="font-normal">(mock — stays on this device as a file name only)</span>
      </button>
      <input
        ref={ref}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const n = Array.from(e.target.files ?? []).map((f) => f.name);
          onChange([...files, ...n]);
          toast.success(`${n.length} file(s) attached`);
        }}
      />
      {files.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5 min-w-0 max-w-full">
          {files.map((f, i) => (
            <li key={f + i} className="min-w-0 max-w-full">
              <Pill t="outline" className="max-w-full truncate" title={f}>
                <span className="truncate break-all min-w-0 flex-1">{f}</span>
                <button
                  type="button"
                  aria-label={`Remove ${f}`}
                  onClick={() => onChange(files.filter((_, j) => j !== i))}
                  className="ml-1 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  ×
                </button>
              </Pill>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Btn({
  children,
  variant = "primary",
  className,
  ...p
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ink" | "ghost" | "outline";
}) {
  const v = {
    primary:
      "bg-orange-gradient text-primary-foreground shadow-soft hover:bg-primary-deep hover:shadow-lift hover:[background-image:none]",
    ink: "bg-ink text-ink-foreground hover:bg-ink/90",
    outline: "border bg-card hover:border-primary/60",
    ghost: "hover:bg-muted",
  }[variant];
  return (
    <button
      {...p}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-[background-color,box-shadow,border-color] duration-150 disabled:opacity-50",
        v,
        className,
      )}
    >
      {children}
    </button>
  );
}
