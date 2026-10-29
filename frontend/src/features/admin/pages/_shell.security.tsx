import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ConfirmDialog, DataTable, NoPermission, PageHeader, Panel, StatCard, StatusBadge,
} from "@/components/admin/ui";
import { vulnerabilities as vulnerabilitySeed, type AccessReview, type Incident } from "@/lib/admin-mock-data";
import { useStore } from "@/lib/admin-store";

export const Route = createFileRoute("/_shell/security")({
  head: () => ({
    meta: [
      { title: "Security & Access — Meyveda Admin" },
      { name: "description", content: "Access reviews, incidents, sessions, and vulnerabilities." },
      { property: "og:title", content: "Security & Access — Meyveda Admin" },
      { property: "og:description", content: "Access reviews, incidents, sessions, and vulnerabilities." },
    ],
  }),
  component: SecurityPage,
});

function SecurityPage() {
  const { accessReviews, incidents, sessions, can, log, admin } = useStore();
  const [vulns, setVulns] = useState(vulnerabilitySeed);
  const [decision, setDecision] = useState<null | { id: string; user: string; status: "Retained" | "Revoked" }>(null);
  const manage = can("manage");

  const decide = (review: AccessReview, status: "Retained" | "Revoked") => setDecision({ id: review.id, user: review.user, status });

  return (
    <div>
      <PageHeader title="Security & Access" description="Who still needs access, what is under investigation, and which sessions are live." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending reviews" value={accessReviews.items.filter((a) => a.status === "Pending").length} />
        <StatCard label="Open incidents" value={incidents.items.filter((i) => i.status !== "Resolved").length} />
        <StatCard label="Live sessions" value={sessions.items.length} />
        <StatCard label="Open vulnerabilities" value={vulns.filter((v) => v.status === "Open").length} />
      </div>
      <Tabs defaultValue="reviews">
        <TabsList className="mb-4 h-10">
          <TabsTrigger value="reviews">Access reviews</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="vulns">Vulnerabilities</TabsTrigger>
        </TabsList>
        <TabsContent value="reviews">
          <Panel>
            {!manage && <div className="border-b px-5 py-3"><NoPermission /></div>}
            <DataTable
              rows={accessReviews.items}
              columns={[
                { header: "User", cell: (a) => (<div><p className="font-medium">{a.user}</p><p className="text-xs text-muted-foreground">{a.id} · {a.role}</p></div>) },
                { header: "Reason", cell: (a) => a.reason },
                { header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
                {
                  header: "Decision",
                  cell: (a) => manage && a.status === "Pending" ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => decide(a, "Retained")}>Retain</Button>
                      <Button size="sm" variant="destructive" onClick={() => decide(a, "Revoked")}>Revoke</Button>
                    </div>
                  ) : <span className="text-xs text-muted-foreground">{a.status === "Pending" ? "Read only" : "Recorded"}</span>,
                },
              ]}
            />
          </Panel>
        </TabsContent>
        <TabsContent value="incidents">
          <Panel>
            <DataTable
              rows={incidents.items}
              columns={[
                { header: "Incident", cell: (i) => (<div><p className="font-medium">{i.title}</p><p className="text-xs text-muted-foreground">{i.id} · opened {i.opened}</p></div>) },
                { header: "Severity", cell: (i) => <StatusBadge status={i.severity} /> },
                { header: "Owner", cell: (i) => i.owner },
                { header: "Status", cell: (i) => <StatusBadge status={i.status} /> },
                {
                  header: "Action",
                  cell: (i) => manage ? <IncidentActions incident={i} onChange={(patch, message) => {
                    incidents.update(i.id, (item) => ({ ...item, ...patch }));
                    log(message, "Security & Access");
                    toast.success(message);
                  }} me={admin?.name ?? "Administrator"} /> : <span className="text-xs text-muted-foreground">Read only</span>,
                },
              ]}
            />
          </Panel>
        </TabsContent>
        <TabsContent value="sessions">
          <Panel>
            <DataTable
              rows={sessions.items}
              columns={[
                { header: "User", cell: (s) => (<div><p className="font-medium">{s.user}</p><p className="text-xs text-muted-foreground">{s.id}</p></div>) },
                { header: "Device", cell: (s) => s.device },
                { header: "Location", cell: (s) => s.location },
                { header: "Started", cell: (s) => s.started },
                {
                  header: "Action",
                  cell: (s) => manage ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        sessions.remove(s.id);
                        log(`Ended session ${s.id} for ${s.user}`, "Security & Access");
                        toast.success(`Ended ${s.user}'s session`);
                      }}
                    >End session</Button>
                  ) : <span className="text-xs text-muted-foreground">Read only</span>,
                },
              ]}
            />
          </Panel>
        </TabsContent>
        <TabsContent value="vulns">
          <Panel>
            <DataTable
              rows={vulns}
              columns={[
                { header: "Finding", cell: (v) => (<div><p className="font-medium">{v.title}</p><p className="text-xs text-muted-foreground">{v.id} · found {v.found}</p></div>) },
                { header: "Severity", cell: (v) => <StatusBadge status={v.severity} /> },
                { header: "Status", cell: (v) => <StatusBadge status={v.status === "Open" ? "Open" : "Resolved"} /> },
                {
                  header: "Action",
                  cell: (v) => manage && v.status === "Open" ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setVulns((items) => items.map((item) => item.id === v.id ? { ...item, status: "Resolved" } : item));
                        log(`Resolved vulnerability ${v.id}`, "Security & Access");
                        toast.success(`${v.id} marked resolved`);
                      }}
                    >Resolve</Button>
                  ) : <span className="text-xs text-muted-foreground">{v.status === "Open" ? "Read only" : "Closed"}</span>,
                },
              ]}
            />
          </Panel>
        </TabsContent>
      </Tabs>
      <ConfirmDialog
        open={!!decision}
        onOpenChange={(o) => { if (!o) setDecision(null); }}
        title={decision?.status === "Revoked" ? "Revoke access" : "Retain access"}
        description={decision ? `${decision.user} · ${decision.id}` : undefined}
        confirmLabel={decision?.status === "Revoked" ? "Revoke" : "Retain"}
        destructive={decision?.status === "Revoked"}
        requireReason
        onConfirm={(reason) => {
          if (!decision) return;
          accessReviews.update(decision.id, (a) => ({ ...a, status: decision.status }));
          log(`${decision.status} access for ${decision.user}`, "Security & Access", "Success", reason);
          toast.success(`${decision.user} marked ${decision.status.toLowerCase()}`);
          setDecision(null);
        }}
      />
    </div>
  );
}

function IncidentActions({
  incident, onChange, me,
}: {
  incident: Incident;
  me: string;
  onChange: (patch: Partial<Incident>, message: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {incident.owner === "Unassigned" && (
        <Button size="sm" variant="outline" onClick={() => onChange({ owner: me, status: incident.status === "Open" ? "Investigating" : incident.status }, `Assigned ${incident.id} to ${me}`)}>Assign to me</Button>
      )}
      {incident.status !== "Resolved" && (
        <Button size="sm" onClick={() => onChange({ status: "Resolved" }, `Resolved ${incident.id}`)}>Resolve</Button>
      )}
      {incident.status === "Resolved" && (
        <Button size="sm" variant="outline" onClick={() => onChange({ status: "Open" }, `Reopened ${incident.id}`)}>Reopen</Button>
      )}
    </div>
  );
}
