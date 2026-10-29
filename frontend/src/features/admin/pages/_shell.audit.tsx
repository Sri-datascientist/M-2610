import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DataTable, FilterSelect, NoPermission, PageHeader, Panel, SearchInput, StatCard, StatusBadge, Toolbar,
} from "@/components/admin/ui";
import { auditFindings as findingSeed, scheduledAudits } from "@/lib/admin-mock-data";
import { useStore } from "@/lib/admin-store";

export const Route = createFileRoute("/_shell/audit")({
  head: () => ({
    meta: [
      { title: "Audit Management — Meyveda Admin" },
      { name: "description", content: "Review the audit log, scheduled audits, and findings." },
      { property: "og:title", content: "Audit Management — Meyveda Admin" },
      { property: "og:description", content: "Review the audit log, scheduled audits, and findings." },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const { audit, can, log } = useStore();
  const [q, setQ] = useState("");
  const [module, setModule] = useState("all");
  const [result, setResult] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [findings, setFindings] = useState(findingSeed);
  const allowExport = can("export");
  const modules = [...new Set(audit.items.map((e) => e.module))];

  const rows = useMemo(
    () =>
      audit.items.filter((e) => {
        const hay = `${e.activity} ${e.actor} ${e.id}`.toLowerCase();
        if (q && !hay.includes(q.toLowerCase())) return false;
        if (module !== "all" && e.module !== module) return false;
        if (result !== "all" && e.result !== result) return false;
        return true;
      }),
    [audit.items, q, module, result],
  );
  const selected = audit.items.find((e) => e.id === selectedId) ?? null;

  const exportLog = () => {
    if (!allowExport) return;
    const header = ["ID", "Timestamp", "Actor", "Module", "Activity", "Result", "Detail"];
    const body = rows.map((e) => [e.id, e.timestamp, e.actor, e.module, e.activity, e.result, e.detail ?? ""]);
    const csv = [header, ...body].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "meyveda-audit-log.csv";
    a.click();
    URL.revokeObjectURL(url);
    log("Exported audit log", "Audit Management");
    toast.success(`Exported ${rows.length} events`);
  };

  return (
    <div>
      <PageHeader
        title="Audit Management"
        description="A record of administrator actions, plus scheduled audits and open findings."
        actions={allowExport ? <Button onClick={exportLog}><Download /> Export CSV</Button> : undefined}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Events" value={audit.items.length} />
        <StatCard label="Denied or failed" value={audit.items.filter((e) => e.result !== "Success").length} />
        <StatCard label="Open findings" value={findings.filter((f) => f.status === "Open").length} />
      </div>
      {!allowExport && <div className="mb-4"><NoPermission /></div>}
      <Tabs defaultValue="log">
        <TabsList className="mb-4 h-10">
          <TabsTrigger value="log">Audit log</TabsTrigger>
          <TabsTrigger value="plan">Scheduled audits</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
        </TabsList>
        <TabsContent value="log">
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <Panel>
              <Toolbar>
                <SearchInput value={q} onChange={setQ} placeholder="Search activity, actor, or ID" />
                <FilterSelect label="Module" value={module} onChange={setModule} options={modules} />
                <FilterSelect label="Result" value={result} onChange={setResult} options={["Success", "Failed", "Denied"]} />
              </Toolbar>
              <DataTable
                rows={rows}
                onRowClick={(e) => setSelectedId(e.id)}
                isSelected={(e) => e.id === selectedId}
                columns={[
                  { header: "Activity", cell: (e) => (<div><p className="font-medium">{e.activity}</p><p className="text-xs text-muted-foreground">{e.id} · {e.module}</p></div>) },
                  { header: "Actor", cell: (e) => e.actor },
                  { header: "When", cell: (e) => <span className="whitespace-nowrap text-muted-foreground">{e.timestamp}</span> },
                  { header: "Result", cell: (e) => <StatusBadge status={e.result} /> },
                ]}
              />
            </Panel>
            <Panel title="Event detail">
              {selected ? (
                <dl className="space-y-3 p-5 text-sm">
                  <div><dt className="text-xs text-muted-foreground">Activity</dt><dd className="font-medium">{selected.activity}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Actor</dt><dd>{selected.actor}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Module</dt><dd>{selected.module}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">When</dt><dd>{selected.timestamp}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Result</dt><dd><StatusBadge status={selected.result} /></dd></div>
                  {selected.detail && <div><dt className="text-xs text-muted-foreground">Detail</dt><dd>{selected.detail}</dd></div>}
                </dl>
              ) : <p className="p-5 text-sm text-muted-foreground">Select an event to see its full record.</p>}
            </Panel>
          </div>
        </TabsContent>
        <TabsContent value="plan">
          <Panel>
            <DataTable
              rows={scheduledAudits}
              columns={[
                { header: "Audit", cell: (a) => (<div><p className="font-medium">{a.name}</p><p className="text-xs text-muted-foreground">{a.id}</p></div>) },
                { header: "Auditor", cell: (a) => a.auditor },
                { header: "Date", cell: (a) => a.date },
                { header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
              ]}
            />
          </Panel>
        </TabsContent>
        <TabsContent value="findings">
          <Panel>
            <DataTable
              rows={findings}
              columns={[
                { header: "Finding", cell: (f) => (<div><p className="font-medium">{f.title}</p><p className="text-xs text-muted-foreground">{f.id} · {f.evidence}</p></div>) },
                { header: "Severity", cell: (f) => <StatusBadge status={f.severity} /> },
                { header: "Resolution", cell: (f) => f.resolution },
                { header: "Status", cell: (f) => <StatusBadge status={f.status === "Open" ? "Open" : "Resolved"} /> },
                {
                  header: "Action",
                  cell: (f) => f.status === "Open" ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setFindings((items) => items.map((item) => item.id === f.id ? { ...item, status: "Resolved", resolution: "Marked resolved in this review" } : item));
                        log(`Resolved finding ${f.id}`, "Audit Management");
                        toast.success(`${f.id} resolved`);
                      }}
                    >Resolve</Button>
                  ) : <span className="text-xs text-muted-foreground">Closed</span>,
                },
              ]}
            />
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
