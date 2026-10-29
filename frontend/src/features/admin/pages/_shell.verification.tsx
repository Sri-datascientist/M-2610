import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ConfirmDialog, DataTable, FilterSelect, NoPermission, PageHeader, Panel, SearchInput, StatCard, StatusBadge, Timeline, Toolbar,
} from "@/components/admin/ui";
import type { VerificationCase, VerificationStatus } from "@/lib/admin-mock-data";
import { useStore } from "@/lib/admin-store";

const STATUSES: VerificationStatus[] = ["Pending Review", "In Review", "Additional Information Required", "Approved", "Rejected"];

export const Route = createFileRoute("/_shell/verification")({
  head: () => ({
    meta: [
      { title: "Verification — Meyveda Admin" },
      { name: "description", content: "Review practitioner and organization verification applications." },
      { property: "og:title", content: "Verification — Meyveda Admin" },
      { property: "og:description", content: "Review practitioner and organization verification applications." },
    ],
  }),
  component: VerificationPage,
});

function VerificationPage() {
  const { verifications, can, log, admin, now } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(verifications.items[0]?.id ?? null);
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState<null | "Approved" | "Rejected" | "Additional Information Required">(null);
  const manage = can("manage");

  const rows = useMemo(
    () =>
      verifications.items.filter((v) => {
        const hay = `${v.id} ${v.applicant} ${v.reviewer}`.toLowerCase();
        if (q && !hay.includes(q.toLowerCase())) return false;
        if (status !== "all" && v.status !== status) return false;
        if (type !== "all" && v.type !== type) return false;
        return true;
      }),
    [verifications.items, q, status, type],
  );
  const selected = verifications.items.find((v) => v.id === selectedId) ?? null;
  const open = verifications.items.filter((v) => !["Approved", "Rejected"].includes(v.status)).length;

  const stamp = (v: VerificationCase, text: string, next?: VerificationStatus) => {
    verifications.update(v.id, (item) => ({
      ...item,
      status: next ?? item.status,
      reviewer: admin?.name ?? item.reviewer,
      history: [{ at: now(), text }, ...item.history],
    }));
    log(`${text} (${v.id})`, "Verification");
  };

  return (
    <div>
      <PageHeader title="Verification" description="Practitioner and organization applications waiting for a decision." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Open cases" value={open} />
        <StatCard label="Approved" value={verifications.items.filter((v) => v.status === "Approved").length} />
        <StatCard label="Needs information" value={verifications.items.filter((v) => v.status === "Additional Information Required").length} />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Panel>
          <Toolbar>
            <SearchInput value={q} onChange={setQ} placeholder="Search applicant or case ID" />
            <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUSES} />
            <FilterSelect label="Type" value={type} onChange={setType} options={["Practitioner", "Organization"]} />
          </Toolbar>
          <DataTable
            rows={rows}
            onRowClick={(v) => setSelectedId(v.id)}
            isSelected={(v) => v.id === selectedId}
            columns={[
              { header: "Case", cell: (v) => (<div><p className="font-medium">{v.applicant}</p><p className="text-xs text-muted-foreground">{v.id} · {v.type}</p></div>) },
              { header: "Submitted", cell: (v) => v.submitted },
              { header: "Reviewer", cell: (v) => v.reviewer },
              { header: "Status", cell: (v) => <StatusBadge status={v.status} /> },
            ]}
          />
        </Panel>
        <Panel title={selected ? selected.id : "Case"}>
          {selected ? (
            <div className="space-y-5 p-5 text-sm">
              <div>
                <p className="font-semibold">{selected.applicant}</p>
                <p className="text-muted-foreground">{selected.detail}</p>
                <div className="mt-2"><StatusBadge status={selected.status} /></div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documents</p>
                <ul className="space-y-1">{selected.documents.map((d) => <li key={d} className="rounded-lg border bg-background px-3 py-2">{d}</li>)}</ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Checklist</p>
                <ul className="space-y-2">
                  {selected.checklist.map((c, i) => (
                    <li key={c.label}>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={c.done}
                          disabled={!manage}
                          onChange={() => verifications.update(selected.id, (v) => ({
                            ...v,
                            checklist: v.checklist.map((item, idx) => idx === i ? { ...item, done: !item.done } : item),
                          }))}
                        />
                        {c.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-note">Reviewer note</Label>
                <Textarea id="review-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
                {manage ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (note.trim().length < 5) {
                        toast.error("Write a note of at least 5 characters.");
                        return;
                      }
                      verifications.update(selected.id, (v) => ({
                        ...v,
                        notes: [{ by: admin?.name ?? "Reviewer", at: now(), text: note.trim() }, ...v.notes],
                      }));
                      log(`Added note on ${selected.id}`, "Verification");
                      setNote("");
                      toast.success("Note added");
                    }}
                  >Add note</Button>
                ) : <NoPermission />}
              </div>
              {selected.notes.length > 0 && (
                <ul className="space-y-2">
                  {selected.notes.map((n, i) => (
                    <li key={i} className="rounded-lg border bg-background px-3 py-2">
                      <p>{n.text}</p>
                      <p className="text-xs text-muted-foreground">{n.at} · {n.by}</p>
                    </li>
                  ))}
                </ul>
              )}
              {manage && !["Approved", "Rejected"].includes(selected.status) && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => { stamp(selected, `Assigned to ${admin?.name ?? "reviewer"}`, selected.status === "Pending Review" ? "In Review" : selected.status); toast.success("Case assigned to you"); }}>Assign to me</Button>
                  <Button size="sm" onClick={() => setDecision("Approved")}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => setDecision("Additional Information Required")}>Request info</Button>
                  <Button size="sm" variant="destructive" onClick={() => setDecision("Rejected")}>Reject</Button>
                </div>
              )}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">History</p>
                <Timeline items={selected.history} />
              </div>
            </div>
          ) : <p className="p-5 text-sm text-muted-foreground">Select a case to review documents and record a decision.</p>}
        </Panel>
      </div>
      <ConfirmDialog
        open={!!decision && !!selected}
        onOpenChange={(o) => { if (!o) setDecision(null); }}
        title={decision === "Approved" ? "Approve application" : decision === "Rejected" ? "Reject application" : "Request more information"}
        description={selected ? `${selected.applicant} · ${selected.id}` : undefined}
        confirmLabel={decision === "Approved" ? "Approve" : decision === "Rejected" ? "Reject" : "Request"}
        destructive={decision === "Rejected"}
        requireReason
        onConfirm={(reason) => {
          if (selected && decision) {
            stamp(selected, `${decision}: ${reason}`, decision);
            toast.success(`Case marked ${decision.toLowerCase()}`);
          }
          setDecision(null);
        }}
      />
    </div>
  );
}
