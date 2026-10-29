import { Link, createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader, focusRing } from "@/components/portal/brand";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  orderedNoticeGroups,
  noticesInGroup,
  type PortalNotice,
} from "@/features/admin/portal-notices";
import type { AdminRoute } from "@/features/admin/modules";
import { useStore } from "@/lib/admin-store";
import { cn } from "@/lib/utils";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — meyveda" },
      {
        name: "description",
        content: "Review items from the meyveda admin modules.",
      },
    ],
  }),
  component: NotificationsPage,
});

type Filter = "all" | "unread" | "read";

export function NotificationsPage() {
  const { notifications } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const items = notifications.items.filter((item) => {
    if (filter === "unread") return !item.read;
    if (filter === "read") return item.read;
    return true;
  });
  const unread = notifications.items.filter((item) => !item.read).length;
  const groups = orderedNoticeGroups(items);

  const markRead = (id: string) => {
    notifications.update(id, (item) => ({ ...item, read: true }));
  };

  const closeDelete = () => {
    if (busyRef.current) return;
    setPendingId(null);
    triggerRef.current?.focus();
  };

  const confirmDelete = () => {
    if (busyRef.current || pendingId === null) return;
    const id = pendingId;
    if (!notifications.items.some((item) => item.id === id)) {
      toast.error("That notification could not be deleted.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      notifications.remove(id);
      toast.success("Notification deleted successfully");
      setPendingId(null);
    } catch {
      toast.error("That notification could not be deleted.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Items drawn from the current doctor, product, safety, and administration records."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={unread === 0}
            onClick={() => {
              for (const item of notifications.items) {
                if (!item.read) markRead(item.id);
              }
            }}
          >
            Mark all as read
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Notification filter">
        {(
          [
            ["all", "All"],
            ["unread", "Unread"],
            ["read", "Read"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-semibold",
              focusRing,
              filter === id
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-surface",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {groups.length === 0 ? (
        <section className="card-surface px-6 py-12 text-center">
          <h2 className="text-lg font-semibold">No notifications</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {filter === "all"
              ? "Nothing is waiting in this session."
              : `Nothing in ${filter} notifications.`}
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group}>
              <h2 className="type-section">{group}</h2>
              <ul className="mt-3 space-y-3">
                {noticesInGroup(items, group).map((item) => (
                  <li key={item.id}>
                    <article
                      className={cn(
                        "card-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between",
                        !item.read && "border-primary/30 bg-secondary",
                      )}
                    >
                      <NoticeLink item={item} onOpen={() => markRead(item.id)} />
                      <div className="flex shrink-0 items-center gap-1 self-start">
                        {item.read ? null : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => markRead(item.id)}
                          >
                            Mark read
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={(event) => {
                            triggerRef.current = event.currentTarget;
                            setPendingId(item.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      <AlertDialog
        open={pendingId !== null}
        onOpenChange={(open) => {
          if (!open) closeDelete();
        }}
      >
        <AlertDialogPortal>
          <AlertDialogOverlay className="bg-foreground/20 backdrop-blur-[1px]" />
          <AlertDialogPrimitive.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft duration-200",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            )}
            onEscapeKeyDown={(event) => {
              if (busyRef.current) event.preventDefault();
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Delete notification?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this notification? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <Button type="button" variant="destructive" disabled={busy} onClick={confirmDelete}>
                Delete notification
              </Button>
            </AlertDialogFooter>
          </AlertDialogPrimitive.Content>
        </AlertDialogPortal>
      </AlertDialog>
    </div>
  );
}

function NoticeLink({ item, onOpen }: { item: PortalNotice; onOpen: () => void }) {
  const className = cn("min-w-0 flex-1 rounded-xl", focusRing);
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{item.module}</p>
      <p className={cn("mt-1 text-[15px]", item.read ? "text-muted-foreground" : "font-semibold")}>
        {item.title}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
      <p className="mt-2 text-xs text-muted-foreground">{item.when}</p>
    </>
  );
  if (item.doctorSlug) {
    return (
      <Link
        to="/admin/doctors/$doctorSlug"
        params={{ doctorSlug: item.doctorSlug }}
        className={className}
        onClick={onOpen}
      >
        {body}
      </Link>
    );
  }
  return (
    <Link to={item.to as AdminRoute} className={className} onClick={onOpen}>
      {body}
    </Link>
  );
}
