import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DataTable, FilterSelect, NoPermission, PageHeader, Panel, SearchInput, StatCard, StatusBadge, Toolbar,
} from "@/components/admin/ui";
import type { ComplianceStatus } from "@/lib/admin-mock-data";
import { useStore } from "@/lib/admin-store";

const STATUSES: ComplianceStatus[] = ["Not Started", "In Progress", "Awaiting Review", "Completed", "Overdue"];

export const Route = createFileRoute("/_shell/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance Register — Meyveda Admin" },
      { name: "description", content: "Track regulatory obligations, owners, evidence, and due dates." },
      { property: "og:title", content: "Compliance Register — Meyveda Admin" },
      { property: "og:description", content: "Track regulatory obligations, owners, evidence, and due dates." },
    ],
  }),
  component: CompliancePage,
});

function CompliancePage() {
  const { obligations, can, log, admin, now } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(obligations.items[0]?.id ?? null);
  const [evidence, setEvidence] = useState("");
  const manage = can("manage");
  const categories = [...new Set(obligations.items.map((o) => o.category))];

  const rows = useMemo(
    () =>
      obligations.items.filter((o) => {
        const hay = `${o.name} ${o.owner} ${o.id}`.toLowerCase();
        if (q && !hay.includes(q.toLowerCase())) return false;
        if (status !== "all" && o.status !== status) return false;
        if (category !== "all" && o.category !== category) return false;
        return true;
      }),
    [obligations.items, q, status, category],
  );
  const selected = obligations.items.find((o) => o.id === selectedId) ?? null;

  return (
    <div>
      <PageHeader title="Compliance Register" description="Obligations, owners, evidence, and review status." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Open" value={obligations.items.filter((o) => o.status !== "Completed").length} />
        <StatCard label="Overdue" value={obligations.items.filter((o) => o.status === "Overdue").length} />
        <StatCard label="Awaiting review" value={obligations.items.filter((o) => o.status === "Awaiting Review").length} />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel>
          <Toolbar>
            <SearchInput value={q} onChange={setQ} placeholder="Search obligation or owner" />
            <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUSES} />
            <FilterSelect label="Category" value={category} onChange={setCategory} options={categories} />
          </Toolbar>
          <DataTable
            rows={rows}
            onRowClick={(o) => setSelectedId(o.id)}
            isSelected={(o) => o.id === selectedId}
            columns={[
              { header: "Obligation", cell: (o) => (<div><p className="font-medium">{o.name}</p><p className="text-xs text-muted-foreground">{o.id} · {o.category}</p></div>) },
              { header: "Owner", cell: (o) => o.owner },
              { header: "Due", cell: (o) => o.due },
              { header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
            ]}
          />
        </Panel>
        <Panel title={selected ? selected.id : "Obligation"}>
          {selected ? (
            <div className="space-y-4 p-5 text-sm">
              <div>
                <p className="font-semibold">{selected.name}</p>
                <p className="text-muted-foreground">{selected.category} · {selected.owner}</p>
                <p className="mt-1 text-xs text-muted-foreground">Due {selected.due}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cmp-status">Status</Label>
                <select
                  id="cmp-status"
                  disabled={!manage}
                  value={selected.status}
                  onChange={(e) => {
                    const next = e.target.value as ComplianceStatus;
                    obligations.update(selected.id, (o) => ({
                      ...o,
                      status: next,
                      approvals: next === "Completed" ? [...o.approvals, { by: admin?.name ?? "Administrator", at: now() }] : o.approvals,
                    }));
                    log(`Set ${selected.id} to ${next}`, "Compliance Register");
                    toast.success(`Status updated to ${next}`);
                  }}
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm disabled:opacity-60"
                >
                  {STATUSES.map((st) => <option key={st}>{st}</option>)}
                </select>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidence</p>
                {selected.evidence.length ? (
                  <ul className="mb-3 space-y-1">{selected.evidence.map((f) => <li key={f} className="rounded-lg border bg-background px-3 py-2">{f}</li>)}</ul>
                ) : <p className="mb-3 text-muted-foreground">No evidence attached yet.</p>}
                {manage ? (
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const name = evidence.trim();
                      if (name.length < 3) {
                        toast.error("Enter an evidence file name.");
                        return;
                      }
                      obligations.update(selected.id, (o) => ({ ...o, evidence: [...o.evidence, name] }));
                      log(`Attached evidence to ${selected.id}`, "Compliance Register", "Success", name);
                      setEvidence("");
                      toast.success("Evidence attached");
                    }}
                  >
                    <Input value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="evidence.pdf" aria-label="Evidence file name" className="bg-background" />
                    <Button type="submit" size="sm">Attach</Button>
                  </form>
                ) : <NoPermission />}
              </div>
              {selected.approvals.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Approvals</p>
                  <ul className="space-y-1">{selected.approvals.map((a, i) => <li key={i} className="text-xs text-muted-foreground">{a.at} · {a.by}</li>)}</ul>
                </div>
              )}
            </div>
          ) : <p className="p-5 text-sm text-muted-foreground">Select an obligation to update its status or attach evidence.</p>}
        </Panel>
      </div>
    </div>
  );
}
