import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Inbox, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border bg-card shadow-soft", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <h2 className="text-[0.95rem] font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

const tone: Record<string, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  danger: "bg-danger-soft text-destructive",
  brand: "bg-primary-soft text-primary",
  neutral: "bg-muted text-muted-foreground",
};
const statusTone: Record<string, keyof typeof tone> = {
  Active: "success", Approved: "success", Completed: "success", Published: "success", Resolved: "success", Success: "success", Retained: "success", Enabled: "success",
  "Pending Review": "brand", Pending: "brand", Open: "brand", "Not Started": "neutral", Draft: "neutral", Scheduled: "info",
  "In Review": "info", "In Progress": "info", Investigating: "info", "Awaiting Review": "info",
  "Additional Information Required": "warning", "Changes Requested": "warning", Reported: "warning", Escalated: "warning", Medium: "warning", "Under Review": "warning",
  Rejected: "danger", Overdue: "danger", Failed: "danger", Denied: "danger", Suspended: "danger", Revoked: "danger", High: "danger", Disabled: "danger",
  Inactive: "neutral", Retired: "neutral", Archived: "neutral", Low: "neutral", Unassigned: "neutral",
};
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", tone[statusTone[status] ?? "neutral"])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

export function EmptyState({ title = "Nothing here", text = "No records match your filters." }: { title?: string; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-muted text-muted-foreground"><Inbox className="h-5 w-5" /></span>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10 bg-card pl-9" aria-label={placeholder} />
    </div>
  );
}

export interface Column<T> { header: string; cell: (row: T) => ReactNode; className?: string }
export function DataTable<T extends { id: string }>({ rows, columns, onRowClick, isSelected, pageSize = 8 }: { rows: T[]; columns: Column<T>[]; onRowClick?: (row: T) => void; isSelected?: (row: T) => boolean; pageSize?: number }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const p = Math.min(page, pages - 1);
  const slice = useMemo(() => rows.slice(p * pageSize, (p + 1) * pageSize), [rows, p, pageSize]);
  if (!rows.length) return <EmptyState />;
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              {columns.map((c) => <th key={c.header} className={cn("whitespace-nowrap px-5 py-3 font-medium", c.className)}>{c.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr
                key={r.id}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={() => onRowClick?.(r)}
                onKeyDown={(e) => { if (onRowClick && e.key === "Enter") onRowClick(r); }}
                className={cn("border-b last:border-0 transition-colors", onRowClick && "cursor-pointer hover:bg-muted focus-visible:bg-muted focus-visible:outline-none", isSelected?.(r) && "bg-primary-soft/70")}
              >
                {columns.map((c) => <td key={c.header} className={cn("px-5 py-3.5 align-middle", c.className)}>{c.cell(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-muted-foreground">
          <span>Page {p + 1} of {pages} · {rows.length} records</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={p === 0} onClick={() => setPage(p - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={p >= pages - 1} onClick={() => setPage(p + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Confirmation dialog; optionally requires a reason. */
export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = "Confirm", requireReason, reasonLabel = "Reason", destructive, onConfirm,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string | undefined; confirmLabel?: string;
  requireReason?: boolean | undefined; reasonLabel?: string; destructive?: boolean | undefined; onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  return (
    <AlertDialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setReason(""); setErr(""); } }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {requireReason && (
          <div className="space-y-2">
            <Label htmlFor="confirm-reason">{reasonLabel}</Label>
            <Textarea id="confirm-reason" value={reason} onChange={(e) => { setReason(e.target.value); setErr(""); }} rows={3} />
            {err && <p className="text-xs text-destructive">{err}</p>}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
            onClick={(e) => {
              if (requireReason && reason.trim().length < 5) { e.preventDefault(); setErr("Please enter a reason (at least 5 characters)."); return; }
              onConfirm(reason.trim());
              setReason("");
            }}
          >{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function FilterSelect({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: string[]; label: string }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <option value="all">{label}: All</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>;
}

export function Timeline({ items }: { items: { at: string; text: string; by?: string }[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">No history yet.</p>;
  return (
    <ol className="space-y-3">
      {items.map((h, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
          <div className="min-w-0"><p>{h.text}</p><p className="text-xs text-muted-foreground">{h.at}{h.by ? ` · ${h.by}` : ""}</p></div>
        </li>
      ))}
    </ol>
  );
}

export function NoPermission() {
  return <p className="text-xs text-muted-foreground">Your role has read-only access to this action.</p>;
}
