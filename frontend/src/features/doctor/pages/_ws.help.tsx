import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Btn, Field, MockUpload, PageHeader, Pill, inputCls } from "@/components/ui-kit";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { setState, today, uid, useStore, type SupportRequest } from "@/lib/store";
import { seo } from "@/lib/seo";
import { apiClient } from "@/services/apiClient";

export const Route = createFileRoute("/_ws/help")({
  head: () => seo("Help & Support", "FAQs and support requests for the Meyveda doctor workspace."),
  component: Help,
});

const FAQ: readonly (readonly [string, string])[] = [
  ["How is my registration verified?", "A platform team member manually reviews your council registration. The app never auto-verifies against any registry."],
  ["Who can see My Medicine Research?", "Only you. Private records never appear in search, listings, or to other doctors, manufacturers or administrators."],
  ["Does submitting an ADR mean the medicine is unsafe?", "No. Reports are reviewed; workflow status, causality and regulatory status are assessed separately."],
  ["Why don't library entries show verses?", "Verse text and page references are shown only after verified source data is imported."],
  ["What does 'Evidence available' mean?", "That documents are on file. It is not a safety or efficacy declaration."],
] as const;

export function Help() {
  const reqs = useStore((s) => s.support);
  const [q, setQ] = useState("");
  const [d, setD] = useState({ category: "General", subject: "", description: "", files: [] as string[] });
  const [errors, setErrors] = useState<{
    subject?: string | undefined;
    description?: string | undefined;
  }>({});

  useEffect(() => {
    let active = true;
    apiClient
      .get<{ items: any[]; total: number }>("/doctors/me/feedback")
      .then((res) => {
        if (!active || !res?.items) return;
        const mapped: SupportRequest[] = res.items.map((fb) => ({
          id: fb.id,
          category: fb.category.charAt(0).toUpperCase() + fb.category.slice(1),
          subject: fb.subject,
          description: fb.message,
          status: fb.status === "resolved" ? "Resolved" : "Open",
          at: fb.submitted_at ? fb.submitted_at.split("T")[0] : today(),
          replies: fb.admin_notes ? [fb.admin_notes] : [],
        }));
        if (mapped.length > 0) {
          setState((s) => {
            const existing = new Set(mapped.map((m) => m.id));
            return {
              support: [...mapped, ...s.support.filter((x) => !existing.has(x.id))],
            };
          });
        }
      })
      .catch((err) => {
        console.warn("Could not load backend feedback:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  const submit = async () => {
    const errs: { subject?: string | undefined; description?: string | undefined } = {};
    if (!d.subject.trim()) errs.subject = "Subject is required";
    if (!d.description.trim()) errs.description = "Description is required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error("Please fill in required fields");
      return;
    }
    setErrors({});

    const cat = ["product", "service", "website"].includes(d.category.toLowerCase())
      ? (d.category.toLowerCase() as "product" | "service" | "website")
      : "other";

    try {
      const res = await apiClient.post<any>("/feedback", {
        category: cat,
        subject: d.subject.trim(),
        message: d.description.trim(),
      });

      setState((s) => ({
        support: [
          {
            id: res.id,
            category: d.category,
            subject: res.subject,
            description: res.message,
            status: "Open",
            at: res.submitted_at ? res.submitted_at.split("T")[0] : today(),
            replies: [],
          },
          ...s.support.filter((x) => x.id !== res.id),
        ],
      }));
      setD({ category: "General", subject: "", description: "", files: [] });
      toast.success("Request sent to the platform team", {
        description: `Ticket ID: ${res.id}`,
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit request");
    }
  };

  const filteredFaq = FAQ.filter(
    ([a, b]) => `${a} ${b}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <PageHeader eyebrow="Account" title="Help & Support" />
      <div className="grid gap-6 p-4 md:p-8 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search FAQs"
              className="flex-1 bg-transparent text-sm outline-none"
              aria-label="Search FAQs"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          {filteredFaq.length === 0 ? (
            <div className="rounded-lg border bg-card p-6 text-center text-xs text-muted-foreground">
              No FAQ answers match &ldquo;{q}&rdquo;.
            </div>
          ) : (
            <Accordion type="single" collapsible className="panel px-5">
              {filteredFaq.map(([a, b]) => (
                <AccordionItem key={a} value={a}>
                  <AccordionTrigger className="text-sm font-semibold">{a}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{b}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          <h2 className="mb-2 mt-6 text-sm font-bold">Your requests</h2>
          {reqs.length === 0 ? (
            <div className="panel p-6 text-center text-xs text-muted-foreground">
              No previous support requests.
            </div>
          ) : (
            <ul className="space-y-2">
              {reqs.map((r) => (
                <li key={r.id} className="panel p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="font-bold">{r.subject}</span>
                    <Pill t={r.status === "Resolved" ? "ink" : "warn"}>{r.status}</Pill>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.id} · {r.category} · {r.at}
                  </div>
                  {r.replies.map((x) => (
                    <p key={x} className="mt-2 rounded bg-surface p-2 text-xs">
                      Support: {x}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel h-fit space-y-4 p-6">
          <h2 className="font-bold">Contact the platform team</h2>
          <div className="rounded-lg border border-border bg-surface p-3 text-xs space-y-1">
            <p className="font-medium text-foreground">Direct Support Helpline:</p>
            <p className="text-muted-foreground">
              Email: <a href="mailto:meyvedalife@gmail.com" className="font-semibold text-primary hover:underline">meyvedalife@gmail.com</a>
            </p>
            <p className="text-muted-foreground">
              Phone / WhatsApp: <a href="tel:+919986398332" className="font-semibold text-primary hover:underline">998-MEYVEDA</a>
            </p>
          </div>
          <Field label="Category">
            <select
              className={inputCls}
              value={d.category}
              onChange={(e) => setD({ ...d, category: e.target.value })}
            >
              {[
                "General",
                "Verification",
                "Library",
                "Quality data",
                "ADR reports",
                "Technical",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Subject" error={errors.subject}>
            <input
              className={inputCls}
              value={d.subject}
              onChange={(e) => {
                setD({ ...d, subject: e.target.value });
                if (errors.subject) setErrors({ ...errors, subject: undefined });
              }}
              placeholder="Brief summary of your question or issue"
            />
          </Field>
          <Field label="Description" error={errors.description}>
            <textarea
              rows={4}
              className={inputCls}
              value={d.description}
              onChange={(e) => {
                setD({ ...d, description: e.target.value });
                if (errors.description) setErrors({ ...errors, description: undefined });
              }}
              placeholder="Provide details so our team can assist you effectively"
            />
          </Field>
          <MockUpload
            files={d.files}
            onChange={(files) => setD({ ...d, files })}
            label="Optional attachment"
          />
          <Btn onClick={submit} className="w-full">
            Send request
          </Btn>
        </section>
      </div>
    </div>
  );
}
