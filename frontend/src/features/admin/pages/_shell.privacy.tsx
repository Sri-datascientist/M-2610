import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DataTable, FilterSelect, NoPermission, PageHeader, Panel, SearchInput, StatCard, StatusBadge, Toolbar,
} from "@/components/admin/ui";
import { retentionPolicies as retentionSeed, type ConsentTemplate, type PrivacyRequest } from "@/lib/admin-mock-data";
import { useStore } from "@/lib/admin-store";

export const Route = createFileRoute("/_shell/privacy")({
  head: () => ({
    meta: [
      { title: "Consent & Privacy — Meyveda Admin" },
      { name: "description", content: "Consent templates, privacy requests, and retention policies." },
      { property: "og:title", content: "Consent & Privacy — Meyveda Admin" },
      { property: "og:description", content: "Consent templates, privacy requests, and retention policies." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { consents, privacy, can, log, now } = useStore();
  const [tab, setTab] = useState("requests");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(privacy.items[0]?.id ?? null);
  const [note, setNote] = useState("");
  const [retention, setRetention] = useState(retentionSeed);
  const manage = can("manage");

  const requests = useMemo(
    () =>
      privacy.items.filter((r) => {
        const hay = `${r.id} ${r.type} ${r.owner}`.toLowerCase();
        if (q && !hay.includes(q.toLowerCase())) return false;
        if (status !== "all" && r.status !== status) return false;
        return true;
      }),
    [privacy.items, q, status],
  );
  const selected = privacy.items.find((r) => r.id === selectedId) ?? null;

  const setTemplate = (t: ConsentTemplate, next: ConsentTemplate["status"]) => {
    consents.update(t.id, (item) => ({ ...item, status: next, updated: now().slice(0, 10) }));
    log(`Set ${t.name} to ${next}`, "Consent & Privacy");
    toast.success(`${t.name} is now ${next.toLowerCase()}`);
  };

  return (
    <div>
      <PageHeader title="Consent & Privacy" description="Templates people agree to, requests they file, and how long data is kept." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active templates" value={consents.items.filter((c) => c.status === "Active").length} />
        <StatCard label="Open requests" value={privacy.items.filter((r) => r.status !== "Completed").length} />
        <StatCard label="Retention policies" value={retention.length} />
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 h-10">
          <TabsTrigger value="requests">Privacy requests</TabsTrigger>
          <TabsTrigger value="templates">Consent templates</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
        </TabsList>
        <TabsContent value="requests">
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <Panel>
              <Toolbar>
                <SearchInput value={q} onChange={setQ} placeholder="Search request ID, type, or owner" />
                <FilterSelect label="Status" value={status} onChange={setStatus} options={["Open", "In Progress", "Completed"]} />
              </Toolbar>
              <DataTable
                rows={requests}
                onRowClick={(r) => setSelectedId(r.id)}
                isSelected={(r) => r.id === selectedId}
                columns={[
                  { header: "Request", cell: (r) => (<div><p className="font-medium">{r.type}</p><p className="text-xs text-muted-foreground">{r.id}</p></div>) },
                  { header: "Owner", cell: (r) => r.owner },
                  { header: "Deadline", cell: (r) => r.deadline },
                  { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
                ]}
              />
            </Panel>
            <Panel title={selected ? selected.id : "Request"}>
              {selected ? (
                <RequestDetail
                  request={selected}
                  note={note}
                  setNote={setNote}
                  manage={manage}
                  onStatus={(next) => {
                    privacy.update(selected.id, (r) => ({
                      ...r,
                      status: next,
                      log: [{ at: now(), text: `Status set to ${next}` }, ...r.log],
                    }));
                    log(`Updated ${selected.id} to ${next}`, "Consent & Privacy");
                    toast.success(`Request marked ${next.toLowerCase()}`);
                  }}
                  onNote={() => {
                    if (note.trim().length < 5) {
                      toast.error("Write a handling note of at least 5 characters.");
                      return;
                    }
                    privacy.update(selected.id, (r) => ({
                      ...r,
                      log: [{ at: now(), text: note.trim() }, ...r.log],
                    }));
                    log(`Noted ${selected.id}`, "Consent & Privacy", "Success", note.trim());
                    setNote("");
                    toast.success("Note added");
                  }}
                />
              ) : <p className="p-5 text-sm text-muted-foreground">Select a request to update its status.</p>}
            </Panel>
          </div>
        </TabsContent>
        <TabsContent value="templates">
          <Panel>
            <DataTable
              rows={consents.items}
              columns={[
                { header: "Template", cell: (t) => (<div><p className="font-medium">{t.name}</p><p className="text-xs text-muted-foreground">{t.id} · {t.version}</p></div>) },
                { header: "Effective", cell: (t) => t.effective },
                { header: "Updated", cell: (t) => t.updated },
                { header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
                {
                  header: "Action",
                  cell: (t) => manage ? (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {t.status !== "Active" && <Button size="sm" onClick={() => setTemplate(t, "Active")}>Activate</Button>}
                      {t.status === "Active" && <Button size="sm" variant="outline" onClick={() => setTemplate(t, "Retired")}>Retire</Button>}
                    </div>
                  ) : <span className="text-xs text-muted-foreground">Read only</span>,
                },
              ]}
            />
          </Panel>
        </TabsContent>
        <TabsContent value="retention">
          <Panel>
            <DataTable
              rows={retention}
              columns={[
                { header: "Data", cell: (r) => (<div><p className="font-medium">{r.data}</p><p className="text-xs text-muted-foreground">{r.id}</p></div>) },
                { header: "Period", cell: (r) => r.period },
                { header: "Basis", cell: (r) => r.basis },
                { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
                {
                  header: "Action",
                  cell: (r) => manage ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const next = r.status === "Active" ? "Under Review" : "Active";
                        setRetention((rows) => rows.map((row) => row.id === r.id ? { ...row, status: next } : row));
                        log(`Set retention ${r.id} to ${next}`, "Consent & Privacy");
                        toast.success(`${r.data} is now ${next.toLowerCase()}`);
                      }}
                    >{r.status === "Active" ? "Mark under review" : "Mark active"}</Button>
                  ) : <span className="text-xs text-muted-foreground">Read only</span>,
                },
              ]}
            />
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequestDetail({
  request, note, setNote, manage, onStatus, onNote,
}: {
  request: PrivacyRequest;
  note: string;
  setNote: (v: string) => void;
  manage: boolean;
  onStatus: (s: PrivacyRequest["status"]) => void;
  onNote: () => void;
}) {
  return (
    <div className="space-y-4 p-5 text-sm">
      <div>
        <p className="font-semibold">{request.type}</p>
        <p className="text-xs text-muted-foreground">Received {request.received} · due {request.deadline}</p>
        <p className="mt-1 text-muted-foreground">Owner: {request.owner}</p>
      </div>
      {manage ? (
        <div className="flex flex-wrap gap-2">
          {request.status !== "In Progress" && request.status !== "Completed" && <Button size="sm" variant="outline" onClick={() => onStatus("In Progress")}>Start</Button>}
          {request.status !== "Completed" && <Button size="sm" onClick={() => onStatus("Completed")}>Complete</Button>}
          {request.status === "Completed" && <Button size="sm" variant="outline" onClick={() => onStatus("Open")}>Reopen</Button>}
        </div>
      ) : <NoPermission />}
      <div className="space-y-2">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Handling note" aria-label="Handling note" disabled={!manage} />
        {manage && <Button size="sm" variant="outline" onClick={onNote}>Add note</Button>}
      </div>
      <ol className="space-y-2">
        {request.log.map((entry, i) => (
          <li key={i} className="rounded-lg border bg-background px-3 py-2">
            <p>{entry.text}</p>
            <p className="text-xs text-muted-foreground">{entry.at}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
