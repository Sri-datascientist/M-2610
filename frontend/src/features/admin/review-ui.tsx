import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ConfirmDialog, NoPermission } from "@/components/admin/ui";
import { StatusPill } from "@/components/portal/brand";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Tone = "brand" | "sage" | "muted" | "danger";

export function reviewTone(status: string): Tone {
  if (
    [
      "Verified",
      "Approved",
      "Valid",
      "Published",
      "Active",
      "Released",
      "Resolved",
      "Complete",
      "Within specification",
      "Success",
    ].includes(status)
  ) {
    return "sage";
  }
  if (
    [
      "Rejected",
      "Suspended",
      "Expired",
      "Restricted",
      "Recalled",
      "Quarantined",
      "On Hold",
      "Serious",
      "Outside specification",
      "Denied",
      "Failed",
    ].includes(status)
  ) {
    return "danger";
  }
  if (["Draft", "Inactive", "Archived", "Closed", "Not released", "Mild", "Removed"].includes(status))
    return "muted";
  return "brand";
}

export function ReviewBadge({ status }: { status: string }) {
  return <StatusPill tone={reviewTone(status)}>{status}</StatusPill>;
}

export type DecisionAction = {
  id: string;
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  onConfirm: (reason: string) => void;
};

export function ReviewDecisions({
  actions,
  enabled,
}: {
  actions: DecisionAction[];
  enabled: boolean;
}) {
  const [active, setActive] = useState<string | null>(null);
  const current = actions.find((action) => action.id === active);
  if (!enabled) return <NoPermission />;
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            type="button"
            size="sm"
            variant={
              action.destructive ? "destructive" : action.requireReason ? "outline" : "default"
            }
            onClick={() => setActive(action.id)}
          >
            {action.label}
          </Button>
        ))}
      </div>
      {current ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setActive(null);
          }}
          title={current.title}
          description={current.description}
          confirmLabel={current.confirmLabel}
          destructive={current.destructive}
          requireReason={current.requireReason}
          reasonLabel={current.reasonLabel ?? "Reason"}
          onConfirm={(reason) => {
            current.onConfirm(reason);
            setActive(null);
          }}
        />
      ) : null}
    </>
  );
}

export function NoteForm({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (text.trim().length < 5) {
          setError("Write a note of at least 5 characters.");
          return;
        }
        onAdd(text.trim());
        setText("");
        setError("");
        toast.success("Note recorded for this session.");
      }}
    >
      <Label htmlFor="reviewer-note">Reviewer note</Label>
      <Textarea
        id="reviewer-note"
        value={text}
        rows={3}
        onChange={(event) => {
          setText(event.target.value);
          setError("");
        }}
        className="mt-2 rounded-xl px-4 py-3 text-[15px]"
      />
      {error ? <p className="mt-1 text-sm font-medium text-destructive">{error}</p> : null}
      <Button type="submit" size="sm" variant="outline" className="mt-3">
        Add note
      </Button>
    </form>
  );
}

export function recorded(message: string) {
  toast.success(`${message}. Recorded for this session.`);
}

export function PlainTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            {headers.map((header) => (
              <th key={header} className="whitespace-nowrap px-3 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-3.5 align-middle">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
