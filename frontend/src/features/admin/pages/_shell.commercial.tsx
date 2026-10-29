import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ConfirmDialog, DataTable, FilterSelect, NoPermission, PageHeader, Panel, SearchInput, StatCard, StatusBadge, Toolbar,
} from "@/components/admin/ui";
import type { CommercialRule } from "@/lib/admin-mock-data";
import { useStore } from "@/lib/admin-store";

export const Route = createFileRoute("/_shell/commercial")({
  head: () => ({
    meta: [
      { title: "Commercial Rules — Meyveda Admin" },
      { name: "description", content: "Service fees, platform charges, and transaction rules." },
      { property: "og:title", content: "Commercial Rules — Meyveda Admin" },
      { property: "og:description", content: "Service fees, platform charges, and transaction rules." },
    ],
  }),
  component: CommercialPage,
});

function CommercialPage() {
  const { rules, can, log, admin, now } = useStore();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(rules.items[0]?.id ?? null);
  const [value, setValue] = useState(rules.items[0]?.value ?? "");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [retire, setRetire] = useState(false);
  const manage = can("manage");

  const rows = useMemo(
    () =>
      rules.items.filter((r) => {
        const hay = `${r.name} ${r.id} ${r.value}`.toLowerCase();
        if (q && !hay.includes(q.toLowerCase())) return false;
        if (category !== "all" && r.category !== category) return false;
        if (status !== "all" && r.status !== status) return false;
        return true;
      }),
    [rules.items, q, category, status],
  );
  const selected = rules.items.find((r) => r.id === selectedId) ?? null;

  const select = (r: CommercialRule) => {
    setSelectedId(r.id);
    setValue(r.value);
    setReason("");
    setErr("");
  };

  return (
    <div>
      <PageHeader title="Commercial Rules" description="Fees, charges, and transaction settings that govern the marketplace." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active rules" value={rules.items.filter((r) => r.status === "Active").length} />
        <StatCard label="Scheduled" value={rules.items.filter((r) => r.status === "Scheduled").length} />
        <StatCard label="Retired" value={rules.items.filter((r) => r.status === "Retired").length} />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Panel>
          <Toolbar>
            <SearchInput value={q} onChange={setQ} placeholder="Search rule name or value" />
            <FilterSelect label="Category" value={category} onChange={setCategory} options={["Service Fee", "Platform Charge", "Transaction Rule", "Configuration"]} />
            <FilterSelect label="Status" value={status} onChange={setStatus} options={["Active", "Scheduled", "Retired"]} />
          </Toolbar>
          <DataTable
            rows={rows}
            onRowClick={select}
            isSelected={(r) => r.id === selectedId}
            columns={[
              { header: "Rule", cell: (r) => (<div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.id} · {r.category}</p></div>) },
              { header: "Value", cell: (r) => <span className="font-medium">{r.value}</span> },
              { header: "Effective", cell: (r) => r.effective },
              { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        </Panel>
        <Panel title={selected ? selected.name : "Rule"}>
          {selected ? (
            <form
              className="space-y-4 p-5 text-sm"
              onSubmit={(e) => {
                e.preventDefault();
                if (!manage) return;
                if (!value.trim()) return setErr("Enter a value.");
                if (reason.trim().length < 5) return setErr("Enter a reason of at least 5 characters.");
                const next = value.trim();
                rules.update(selected.id, (r) => ({
                  ...r,
                  value: next,
                  status: r.status === "Retired" ? "Active" : r.status,
                  versions: [{ version: (r.versions[0]?.version ?? 0) + 1, value: next, by: admin?.name ?? "Administrator", at: now(), reason: reason.trim() }, ...r.versions],
                }));
                log(`Updated ${selected.id} to ${next}`, "Commercial Rules", "Success", reason.trim());
                setReason("");
                setErr("");
                toast.success("Rule version published");
              }}
            >
              <p className="text-muted-foreground">{selected.category} · effective {selected.effective}</p>
              <div className="space-y-2">
                <Label htmlFor="rule-value">Value</Label>
                <Input id="rule-value" value={value} onChange={(e) => setValue(e.target.value)} disabled={!manage} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rule-reason">Change reason</Label>
                <Textarea id="rule-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} disabled={!manage} />
              </div>
              {err && <p className="text-xs text-destructive">{err}</p>}
              {manage ? (
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" size="sm">Publish version</Button>
                  {selected.status !== "Retired" && (
                    <Button type="button" size="sm" variant="outline" onClick={() => setRetire(true)}>Retire</Button>
                  )}
                </div>
              ) : <NoPermission />}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Versions</p>
                <ol className="space-y-3">
                  {selected.versions.map((v) => (
                    <li key={v.version} className="rounded-lg border bg-background px-3 py-2">
                      <p className="font-medium">v{v.version} · {v.value}</p>
                      <p className="text-xs text-muted-foreground">{v.at} · {v.by}</p>
                      <p className="mt-1 text-xs">{v.reason}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </form>
          ) : <p className="p-5 text-sm text-muted-foreground">Select a rule to edit its value and review prior versions.</p>}
        </Panel>
      </div>
      <ConfirmDialog
        open={retire && !!selected}
        onOpenChange={setRetire}
        title="Retire this rule"
        description={selected ? `${selected.name} will no longer apply to new transactions.` : undefined}
        confirmLabel="Retire rule"
        destructive
        requireReason
        onConfirm={(why) => {
          if (!selected) return;
          rules.update(selected.id, (r) => ({ ...r, status: "Retired" }));
          log(`Retired ${selected.id}`, "Commercial Rules", "Success", why);
          toast.success("Rule retired");
          setRetire(false);
        }}
      />
    </div>
  );
}
