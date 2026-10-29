import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DataTable, FilterSelect, NoPermission, PageHeader, Panel, SearchInput, StatCard, StatusBadge, Toolbar,
} from "@/components/admin/ui";
import type { KnowledgeItem, KnowledgeStatus } from "@/lib/admin-mock-data";
import { useStore } from "@/lib/admin-store";

const STATUSES: KnowledgeStatus[] = ["Draft", "In Review", "Approved", "Published", "Archived"];

export const Route = createFileRoute("/_shell/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge Governance — Meyveda Admin" },
      { name: "description", content: "Review and publish knowledge articles and reference data." },
      { property: "og:title", content: "Knowledge Governance — Meyveda Admin" },
      { property: "og:description", content: "Review and publish knowledge articles and reference data." },
    ],
  }),
  component: KnowledgePage,
});

function KnowledgePage() {
  const { knowledge, can, log, admin, now } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(knowledge.items[0]?.id ?? null);
  const manage = can("manage");

  const rows = useMemo(
    () =>
      knowledge.items.filter((k) => {
        const hay = `${k.title} ${k.owner} ${k.id} ${k.source}`.toLowerCase();
        if (q && !hay.includes(q.toLowerCase())) return false;
        if (status !== "all" && k.status !== status) return false;
        if (category !== "all" && k.category !== category) return false;
        return true;
      }),
    [knowledge.items, q, status, category],
  );
  const selected = knowledge.items.find((k) => k.id === selectedId) ?? null;

  const move = (item: KnowledgeItem, next: KnowledgeStatus, text: string, bump = false) => {
    const version = bump ? item.version + 1 : item.version;
    knowledge.update(item.id, (k) => ({
      ...k,
      status: next,
      version,
      updated: now().slice(0, 10),
      history: [{ version, at: now(), by: admin?.name ?? "Administrator", text }, ...k.history],
    }));
    log(`${text} ${item.id}`, "Knowledge Governance");
    toast.success(`${item.title} is now ${next.toLowerCase()}`);
  };

  return (
    <div>
      <PageHeader title="Knowledge Governance" description="Drafts, reviews, and published reference material for the Meyveda knowledge base." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="In review" value={knowledge.items.filter((k) => k.status === "In Review").length} />
        <StatCard label="Approved" value={knowledge.items.filter((k) => k.status === "Approved").length} />
        <StatCard label="Published" value={knowledge.items.filter((k) => k.status === "Published").length} />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Panel>
          <Toolbar>
            <SearchInput value={q} onChange={setQ} placeholder="Search title, owner, or source" />
            <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUSES} />
            <FilterSelect label="Category" value={category} onChange={setCategory} options={["Knowledge Article", "Reference Data"]} />
          </Toolbar>
          <DataTable
            rows={rows}
            onRowClick={(k) => setSelectedId(k.id)}
            isSelected={(k) => k.id === selectedId}
            columns={[
              { header: "Title", cell: (k) => (<div><p className="font-medium">{k.title}</p><p className="text-xs text-muted-foreground">{k.id} · v{k.version}</p></div>) },
              { header: "Category", cell: (k) => k.category },
              { header: "Owner", cell: (k) => k.owner },
              { header: "Status", cell: (k) => <StatusBadge status={k.status} /> },
            ]}
          />
        </Panel>
        <Panel title={selected ? selected.id : "Article"}>
          {selected ? (
            <div className="space-y-4 p-5 text-sm">
              <div>
                <p className="font-semibold">{selected.title}</p>
                <p className="text-xs text-muted-foreground">{selected.category} · v{selected.version} · {selected.owner}</p>
                <div className="mt-2"><StatusBadge status={selected.status} /></div>
              </div>
              <p className="rounded-xl border bg-background p-3 leading-relaxed">{selected.body}</p>
              <p className="text-xs text-muted-foreground">Source: {selected.source}</p>
              {manage ? (
                <div className="flex flex-wrap gap-2">
                  {selected.status === "Draft" && <Button size="sm" onClick={() => move(selected, "In Review", "Submitted for review")}>Submit for review</Button>}
                  {selected.status === "In Review" && <Button size="sm" onClick={() => move(selected, "Approved", "Approved for publication")}>Approve</Button>}
                  {selected.status === "In Review" && <Button size="sm" variant="outline" onClick={() => move(selected, "Draft", "Returned to draft")}>Return to draft</Button>}
                  {selected.status === "Approved" && <Button size="sm" onClick={() => move(selected, "Published", "Published", true)}>Publish</Button>}
                  {selected.status === "Published" && <Button size="sm" variant="outline" onClick={() => move(selected, "Archived", "Archived")}>Archive</Button>}
                  {selected.status === "Archived" && <Button size="sm" variant="outline" onClick={() => move(selected, "Draft", "Restored to draft")}>Restore</Button>}
                </div>
              ) : <NoPermission />}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Version history</p>
                <ol className="space-y-2">
                  {selected.history.map((h, i) => (
                    <li key={i} className="rounded-lg border bg-background px-3 py-2">
                      <p>v{h.version} · {h.text}</p>
                      <p className="text-xs text-muted-foreground">{h.at} · {h.by}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : <p className="p-5 text-sm text-muted-foreground">Select an article to review its source and move it through publication.</p>}
        </Panel>
      </div>
    </div>
  );
}
