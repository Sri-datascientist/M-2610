import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Btn, Empty, PageHeader, Pill } from "@/components/ui-kit";
import { setState, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_ws/notifications")({
  head: () => seo("Notifications", "Verification updates, ADR follow-ups, case reviews, support replies and quality alerts."),
  component: Notifications,
});

export function Notifications() {
  const list = useStore((s) => s.notifications);
  const navigate = useNavigate();
  const mark = (id: string) => setState((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
  return (
    <div>
      <PageHeader eyebrow="Updates" title="Notifications" desc={`${list.filter((n) => !n.read).length} unread`} actions={<Btn variant="outline" onClick={() => setState((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }))}>Mark all as read</Btn>} />
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        {list.length === 0 ? <Empty title="You're all caught up" /> : (
          <ul className="space-y-2">{list.map((n, i) => (
            <motion.li
              key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition hover:border-primary/50",
                  n.read ? "bg-card" : "border-primary/30 bg-primary-soft/50",
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    n.read ? "bg-border" : "bg-primary",
                  )}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => {
                    mark(n.id);
                    navigate({ to: n.to });
                  }}
                  className="flex-1 text-left focus:outline-none"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <Pill t="outline">{n.kind}</Pill>
                    <span className="text-xs text-muted-foreground">
                      {new Date(n.at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </span>
                  <span className="mt-1 block font-bold">{n.title}</span>
                  <span className="text-sm text-muted-foreground">{n.body}</span>
                </button>
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => mark(n.id)}
                    className="shrink-0 text-xs font-semibold text-primary hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </motion.li>
          ))}</ul>
        )}
      </div>
    </div>
  );
}
