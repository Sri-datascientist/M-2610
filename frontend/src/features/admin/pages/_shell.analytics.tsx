import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, StatCard, StatusBadge } from "@/components/admin/ui";
import { useStore } from "@/lib/admin-store";

const RANGES = ["All activity", "Open work only"] as const;

export const Route = createFileRoute("/_shell/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics & Operations — Meyveda Admin" },
      { name: "description", content: "Operational queues and activity across the Meyveda admin portal." },
      { property: "og:title", content: "Analytics & Operations — Meyveda Admin" },
      { property: "og:description", content: "Operational queues and activity across the Meyveda admin portal." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const s = useStore();
  const [range, setRange] = useState<(typeof RANGES)[number]>("All activity");
  const openOnly = range === "Open work only";

  const verification = count(s.verifications.items.map((v) => v.status), openOnly ? ["Approved", "Rejected"] : []);
  const moderation = count(s.moderation.items.map((m) => m.status), openOnly ? ["Approved", "Rejected"] : []);
  const compliance = count(s.obligations.items.map((o) => o.status), openOnly ? ["Completed"] : []);
  const security = s.incidents.items.filter((i) => (openOnly ? i.status !== "Resolved" : true));

  const queues = useMemo(
    () => [
      { id: "ver", label: "Verification", href: "/verification" as const, open: s.verifications.items.filter((v) => !["Approved", "Rejected"].includes(v.status)).length, total: s.verifications.items.length },
      { id: "mod", label: "Content moderation", href: "/moderation" as const, open: s.moderation.items.filter((m) => ["Pending", "Reported", "Escalated"].includes(m.status)).length, total: s.moderation.items.length },
      { id: "cmp", label: "Compliance", href: "/compliance" as const, open: s.obligations.items.filter((o) => o.status !== "Completed").length, total: s.obligations.items.length },
      { id: "sec", label: "Security incidents", href: "/security" as const, open: s.incidents.items.filter((i) => i.status !== "Resolved").length, total: s.incidents.items.length },
      { id: "knw", label: "Knowledge", href: "/knowledge" as const, open: s.knowledge.items.filter((k) => k.status !== "Published" && k.status !== "Archived").length, total: s.knowledge.items.length },
    ],
    [s.verifications.items, s.moderation.items, s.obligations.items, s.incidents.items, s.knowledge.items],
  );
  const maxOpen = Math.max(1, ...queues.map((q) => q.open));

  return (
    <div>
      <PageHeader
        title="Analytics & Operations"
        description="Where work is waiting, and how recent administrator activity is distributed."
        actions={
          <select aria-label="Activity range" value={range} onChange={(e) => setRange(e.target.value as (typeof RANGES)[number])} className="h-10 rounded-md border border-input bg-card px-3 text-sm">
            {RANGES.map((r) => <option key={r}>{r}</option>)}
          </select>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open queues" value={queues.reduce((n, q) => n + q.open, 0)} />
        <StatCard label="Moderation reports" value={s.moderation.items.filter((m) => m.status === "Reported").length} />
        <StatCard label="Overdue obligations" value={s.obligations.items.filter((o) => o.status === "Overdue").length} />
        <StatCard label="Open incidents" value={s.incidents.items.filter((i) => i.status !== "Resolved").length} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Queue depth">
          <ul className="space-y-4 p-5">
            {queues.map((q) => (
              <li key={q.id}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <Link to={q.href as any} className="font-medium text-primary hover:underline">{q.label}</Link>
                  <span className="text-muted-foreground">{q.open} open · {q.total} total</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.round((q.open / maxOpen) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent activity">
          <ul className="divide-y">
            {s.audit.items.slice(0, 8).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.activity}</p>
                  <p className="text-xs text-muted-foreground">{e.module} · {e.actor} · {e.timestamp}</p>
                </div>
                <StatusBadge status={e.result} />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={openOnly ? "Open verification" : "Verification mix"}><Breakdown rows={verification} /></Panel>
        <Panel title={openOnly ? "Open moderation" : "Moderation mix"}><Breakdown rows={moderation} /></Panel>
        <Panel title={openOnly ? "Open compliance" : "Compliance mix"}><Breakdown rows={compliance} /></Panel>
        <Panel title="Security incidents">
          <ul className="divide-y">
            {security.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
                <div><p className="font-medium">{i.title}</p><p className="text-xs text-muted-foreground">{i.id} · {i.owner}</p></div>
                <StatusBadge status={i.status} />
              </li>
            ))}
            {!security.length && <li className="px-5 py-8 text-sm text-muted-foreground">No incidents in this view.</li>}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function count(values: string[], hide: string[]) {
  const map = new Map<string, number>();
  for (const v of values) {
    if (hide.includes(v)) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()].map(([label, value]) => ({ id: label, label, value })).sort((a, b) => b.value - a.value);
}

function Breakdown({ rows }: { rows: { id: string; label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="p-5 text-sm text-muted-foreground">Nothing to show for this filter.</p>;
  return (
    <ul className="space-y-3 p-5">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-3 text-sm">
          <span className="w-44 shrink-0 truncate">{r.label}</span>
          <span className="h-2 flex-1 rounded-full bg-muted"><span className="block h-2 rounded-full bg-primary" style={{ width: `${Math.round((r.value / max) * 100)}%` }} /></span>
          <span className="w-6 text-right font-medium">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}
