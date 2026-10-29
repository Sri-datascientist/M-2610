import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ConfirmDialog, DataTable, FilterSelect, NoPermission, PageHeader, Panel, SearchInput, StatCard, StatusBadge, Timeline, Toolbar,
} from "@/components/admin/ui";
import type { ModerationItem, ModerationStatus } from "@/lib/admin-mock-data";
import { useStore } from "@/lib/admin-store";

const STATUSES: ModerationStatus[] = ["Pending", "Reported", "Approved", "Rejected", "Changes Requested", "Escalated"];

export const Route = createFileRoute("/_shell/moderation")({
  head: () => ({
    meta: [
      { title: "Content Moderation — Meyveda Admin" },
      { name: "description", content: "Review community posts, articles, and reported comments." },
      { property: "og:title", content: "Content Moderation — Meyveda Admin" },
      { property: "og:description", content: "Review community posts, articles, and reported comments." },
    ],
  }),
  component: ModerationPage,
});

function ModerationPage() {
  const { moderation, can, log, now } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(moderation.items[0]?.id ?? null);
  const [decision, setDecision] = useState<null | Extract<ModerationStatus, "Approved" | "Rejected" | "Changes Requested" | "Escalated">>(null);
  const manage = can("manage");

  const rows = useMemo(
    () =>
      moderation.items.filter((m) => {
        const hay = `${m.title} ${m.submitter} ${m.id}`.toLowerCase();
        if (q && !hay.includes(q.toLowerCase())) return false;
        if (status !== "all" && m.status !== status) return false;
        if (type !== "all" && m.type !== type) return false;
        return true;
      }),
    [moderation.items, q, status, type],
  );
  const selected = moderation.items.find((m) => m.id === selectedId) ?? null;
  const queue = moderation.items.filter((m) => m.status === "Pending" || m.status === "Reported").length;

  const apply = (item: ModerationItem, next: ModerationStatus, reason: string) => {
    moderation.update(item.id, (m) => ({
      ...m,
      status: next,
      history: [{ at: now(), text: reason ? `${next}: ${reason}` : next }, ...m.history],
    }));
    log(`${next} ${item.id}`, "Content Moderation", "Success", reason);
    toast.success(`${item.id} marked ${next.toLowerCase()}`);
  };

  return (
    <div>
      <PageHeader title="Content Moderation" description="Review posts, articles, and comments before they stay on the platform." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Awaiting review" value={queue} />
        <StatCard label="Reported" value={moderation.items.filter((m) => m.status === "Reported").length} />
        <StatCard label="Escalated" value={moderation.items.filter((m) => m.status === "Escalated").length} />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Panel>
          <Toolbar>
            <SearchInput value={q} onChange={setQ} placeholder="Search title, author, or ID" />
            <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUSES} />
            <FilterSelect label="Type" value={type} onChange={setType} options={["Community Post", "Article", "Comment"]} />
          </Toolbar>
          <DataTable
            rows={rows}
            onRowClick={(m) => setSelectedId(m.id)}
            isSelected={(m) => m.id === selectedId}
            columns={[
              { header: "Content", cell: (m) => (<div><p className="font-medium">{m.title}</p><p className="text-xs text-muted-foreground">{m.id} · {m.type}</p></div>) },
              { header: "Submitter", cell: (m) => m.submitter },
              { header: "Submitted", cell: (m) => m.submitted },
              { header: "Status", cell: (m) => <StatusBadge status={m.status} /> },
            ]}
          />
        </Panel>
        <Panel title={selected ? selected.id : "Item"}>
          {selected ? (
            <div className="space-y-4 p-5 text-sm">
              <div>
                <p className="font-semibold">{selected.title}</p>
                <p className="text-xs text-muted-foreground">{selected.type} · {selected.submitter} · {selected.submitted}</p>
                <div className="mt-2"><StatusBadge status={selected.status} /></div>
              </div>
              {selected.reason && <p className="rounded-lg bg-warning-soft px-3 py-2 text-warning">Report reason: {selected.reason}</p>}
              <p className="rounded-xl border bg-background p-3 leading-relaxed">{selected.body}</p>
              {manage ? (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setDecision("Approved")}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => setDecision("Changes Requested")}>Request changes</Button>
                  <Button size="sm" variant="outline" onClick={() => setDecision("Escalated")}>Escalate</Button>
                  <Button size="sm" variant="destructive" onClick={() => setDecision("Rejected")}>Reject</Button>
                </div>
              ) : <NoPermission />}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">History</p>
                <Timeline items={selected.history} />
              </div>
            </div>
          ) : <p className="p-5 text-sm text-muted-foreground">Select an item to read it and record a decision.</p>}
        </Panel>
      </div>
      <ConfirmDialog
        open={!!decision && !!selected}
        onOpenChange={(o) => { if (!o) setDecision(null); }}
        title={decision ? `${decision} content` : "Decision"}
        description={selected?.title}
        confirmLabel={decision ?? "Confirm"}
        destructive={decision === "Rejected"}
        requireReason={decision !== "Approved"}
        onConfirm={(reason) => {
          if (selected && decision) apply(selected, decision, reason);
          setDecision(null);
        }}
      />
    </div>
  );
}
