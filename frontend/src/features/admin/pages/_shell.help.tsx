import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, PageHeader, Panel, SearchInput, StatusBadge } from "@/components/admin/ui";

const FAQS = [
  { id: "faq-1", area: "Identity & Roles", q: "How do I suspend an administrator?", a: "Open Identity & Roles, select the account, and choose Suspend. A reason is required and is written to the audit log. You cannot suspend the account you are signed in with." },
  { id: "faq-2", area: "Verification", q: "What does Additional Information Required mean?", a: "The reviewer needs another document or a clarification before the application can be approved or rejected. The applicant stays in the queue until that arrives." },
  { id: "faq-3", area: "Content Moderation", q: "When should I escalate content?", a: "Escalate when a report involves a medical claim, personal contact details, or anything you are not authorised to decide alone. Escalated items stay visible in the moderation queue." },
  { id: "faq-4", area: "Commercial Rules", q: "Do rule edits apply immediately?", a: "Publishing a version records the new value, the reason, and who changed it. Retiring a rule stops it applying to new transactions." },
  { id: "faq-5", area: "Consent & Privacy", q: "How are privacy requests tracked?", a: "Each request has an owner, a deadline, and a handling log. Mark it in progress while you work, then complete it when the person has been answered." },
  { id: "faq-6", area: "Security & Access", q: "Can a read-only auditor change access?", a: "No. Read-only auditors can review records and export the audit log. Role changes, suspensions, and access decisions require a managing administrator." },
];

const AREAS = ["Identity & Roles", "Verification", "Content Moderation", "Commercial Rules", "Compliance", "Privacy", "Security", "Other"] as const;

type Ticket = { id: string; subject: string; area: string; message: string; status: "Open" };

export const Route = createFileRoute("/_shell/help")({
  head: () => ({
    meta: [
      { title: "Help & Support — Meyveda Admin" },
      { name: "description", content: "Guides and a way to record a support request for the admin portal." },
      { property: "og:title", content: "Help & Support — Meyveda Admin" },
      { property: "og:description", content: "Guides and a way to record a support request for the admin portal." },
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(FAQS[0]?.id ?? null);
  const [subject, setSubject] = useState("");
  const [area, setArea] = useState<(typeof AREAS)[number]>("Other");
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const faqs = useMemo(
    () => FAQS.filter((f) => `${f.q} ${f.a} ${f.area}`.toLowerCase().includes(q.toLowerCase())),
    [q],
  );

  return (
    <div>
      <PageHeader title="Help & Support" description="Short answers for common admin tasks, and a place to record a request." />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel title="Guides">
          <div className="border-b px-5 py-4">
            <SearchInput value={q} onChange={setQ} placeholder="Search guides" />
          </div>
          {faqs.length === 0 ? (
            <p className="px-5 py-10 text-sm text-muted-foreground">No guides match that search.</p>
          ) : (
            <ul className="divide-y">
              {faqs.map((f) => {
                const open = openId === f.id;
                return (
                  <li key={f.id}>
                    <button type="button" className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left" onClick={() => setOpenId(open ? null : f.id)} aria-expanded={open}>
                      <span>
                        <span className="block text-sm font-medium">{f.q}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{f.area}</span>
                      </span>
                      <span className="text-primary">{open ? "–" : "+"}</span>
                    </button>
                    {open && <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">{f.a}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        <Panel title="Contact support">
          <form
            className="space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (subject.trim().length < 4) return setErr("Enter a subject of at least 4 characters.");
              if (message.trim().length < 10) return setErr("Describe the issue in at least 10 characters.");
              const ticket: Ticket = { id: `SUP-${Date.now().toString().slice(-5)}`, subject: subject.trim(), area, message: message.trim(), status: "Open" };
              setTickets((items) => [ticket, ...items]);
              setSubject("");
              setMessage("");
              setErr("");
              toast.success(`Request ${ticket.id} recorded`);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="sup-subject">Subject</Label>
              <Input id="sup-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sup-area">Area</Label>
              <select id="sup-area" value={area} onChange={(e) => setArea(e.target.value as (typeof AREAS)[number])} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {AREAS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sup-message">Message</Label>
              <Textarea id="sup-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
            </div>
            {err && <p className="text-xs text-destructive">{err}</p>}
            <Button type="submit" className="w-full">Submit request</Button>
            <p className="text-xs text-muted-foreground">Prototype requests stay in this browser session. For account access, ask a platform administrator.</p>
          </form>
        </Panel>
      </div>
      {tickets.length > 0 && (
        <Panel title="Your requests" className="mt-6">
          <DataTable
            rows={tickets}
            columns={[
              { header: "Request", cell: (t) => (<div><p className="font-medium">{t.subject}</p><p className="text-xs text-muted-foreground">{t.id} · {t.area}</p></div>) },
              { header: "Message", cell: (t) => <span className="line-clamp-2 text-muted-foreground">{t.message}</span> },
              { header: "Status", cell: () => <StatusBadge status="Open" /> },
            ]}
          />
        </Panel>
      )}
      <p className="mt-6 text-sm text-muted-foreground">
        Account details live on your <Link to="/profile" className="font-medium text-primary hover:underline">administrator profile</Link>.
      </p>
    </div>
  );
}
