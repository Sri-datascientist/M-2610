import { Link, createFileRoute } from "@tanstack/react-router";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader, StatusPill, focusRing } from "@/components/portal/brand";
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
import { formatIsoDate } from "@/features/admin/administration-data";
import { useAdministration } from "@/features/admin/administration-state";
import { MetaList, TextField } from "@/features/admin/fields";
import {
  displayProfileValue,
  emptyProfileDetails,
  grantedPermissions,
  profileFieldError,
  profilePermissionGroups,
  readProfileDetails,
  rolesFromAccount,
  writeProfileDetails,
  type ProfileDetails,
} from "@/features/admin/profile-details";
import { useStore } from "@/lib/admin-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({
    meta: [
      { title: "Administrator Profile — Meyveda Grantha" },
      {
        name: "description",
        content: "The administrator signed in to Meyveda Grantha.",
      },
    ],
  }),
  component: ProfilePage,
});

export function ProfilePage() {
  const { admin, updateSession } = useStore();
  const { users, audit, updateOwnAccount } = useAdministration();
  const directory = users.find((user) => user.email.toLowerCase() === admin?.email.toLowerCase());
  const [details, setDetails] = useState<ProfileDetails>(emptyProfileDetails);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!admin) return;
    setDetails(readProfileDetails(admin.email));
  }, [admin]);

  if (!admin) {
    return (
      <div>
        <PageHeader
          title="Administrator Profile"
          subtitle="The account signed in for this Meyveda Grantha session."
        />
        <section className="card-surface px-6 py-12 text-center">
          <h2 className="text-lg font-semibold">No administrator is signed in</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Sign in with a Meyveda Grantha administrator account to see this profile.
          </p>
        </section>
      </div>
    );
  }

  const roles = rolesFromAccount(directory?.roles, admin.role);
  const granted = grantedPermissions(roles);
  const activity = audit.filter((event) => event.kind === "activity" && event.user === admin.name).slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Administrator Profile"
        subtitle="The account signed in for this Meyveda Grantha session."
        action={
          <Button type="button" variant="outline" onClick={() => setEditing(true)}>
            Edit Profile
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-surface p-5 sm:p-6">
          <h2 className="type-section">Personal Information</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Name and email come from the signed-in account. Blank fields are not on the account record.
          </p>
          <div className="mt-4">
            <MetaList
              rows={[
                { label: "Full name", value: admin.name },
                { label: "Email address", value: admin.email },
                { label: "Phone number", value: <OptionalValue value={details.phone} /> },
                { label: "Department", value: <OptionalValue value={details.department} /> },
                { label: "Job title", value: <OptionalValue value={details.jobTitle} /> },
                { label: "Employee ID", value: directory?.id ?? "Not available" },
                { label: "Preferred language", value: <OptionalValue value={details.language} /> },
                { label: "Time zone", value: <OptionalValue value={details.timeZone} /> },
              ]}
            />
          </div>
        </section>

        <section className="card-surface p-5 sm:p-6">
          <h2 className="type-section">Account Information</h2>
          <div className="mt-4">
            <MetaList
              rows={[
                { label: "Administrator name", value: admin.name },
                { label: "Email address", value: admin.email },
                { label: "Assigned role", value: directory?.roles.join(", ") || admin.role },
                {
                  label: "Account status",
                  value: directory ? (
                    <StatusPill tone={directory.status === "Active" ? "sage" : "muted"}>
                      {directory.status}
                    </StatusPill>
                  ) : (
                    "Not available"
                  ),
                },
                { label: "Account creation date", value: "Not available" },
                { label: "Last login", value: "Not available" },
                { label: "Last activity", value: directory?.lastActivityLabel ?? "Not available" },
                { label: "Authentication method", value: "Not available" },
              ]}
            />
          </div>
        </section>

        <section className="card-surface p-5 sm:p-6 lg:col-span-2">
          <h2 className="type-section">Permissions & Access</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Permissions configured for {roles.join(", ") || admin.role}.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {profilePermissionGroups.map((group) => {
              const allowed = group.permissions.filter((permission) => granted.has(permission));
              return (
                <li key={group.title} className="rounded-xl border border-border bg-card px-4 py-3">
                  <p className="text-sm font-semibold">{group.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {allowed.length > 0 ? (
                      allowed.map((permission) => (
                        <span
                          key={permission}
                          className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground"
                        >
                          {permission}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Not assigned</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card-surface p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="type-section">Recent Activity</h2>
            <Link to="/admin/settings" className={cn("text-sm font-semibold text-primary hover:underline", focusRing)}>
              View All Activity
            </Link>
          </div>
          {activity.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No activity is recorded for this account.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {activity.map((event) => (
                <li key={event.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="font-semibold leading-snug">{event.detail || event.action}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.module}
                    <span aria-hidden="true"> · </span>
                    <time dateTime={event.at.replace(" ", "T")}>{formatWhen(event.at)}</time>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-surface p-5 sm:p-6">
          <h2 className="type-section">Security & Preferences</h2>
          <div className="mt-4">
            <MetaList
              rows={[
                { label: "Change password", value: "Not available" },
                { label: "Two-factor authentication", value: "Not available" },
                { label: "Notification preferences", value: "Not available" },
                { label: "Preferred language", value: <OptionalValue value={details.language} /> },
                { label: "Time zone", value: <OptionalValue value={details.timeZone} /> },
                { label: "Session", value: "Signed in for this browser session" },
              ]}
            />
          </div>
        </section>
      </div>
      <EditProfileDialog
        open={editing}
        adminName={admin.name}
        adminEmail={admin.email}
        employeeId={directory?.id ?? "Not available"}
        details={details}
        onClose={() => setEditing(false)}
        onSave={(next) => {
          const directoryResult = directory
            ? updateOwnAccount(next.name, next.email)
            : ({ ok: true } as const);
          if (!directoryResult.ok) return directoryResult;
          try {
            writeProfileDetails(admin.email, next.email, next.details);
            updateSession({ name: next.name, email: next.email, role: admin.role });
            setDetails(next.details);
          } catch {
            return { ok: false as const, message: "The profile could not be saved in this browser." };
          }
          return { ok: true as const };
        }}
      />
    </div>
  );
}

function OptionalValue({ value }: { value: string }) {
  const recorded = value.trim();
  if (!recorded) return <span className="text-muted-foreground">Not recorded</span>;
  return recorded;
}

function formatWhen(at: string) {
  const [date, time] = at.split(" ");
  if (!date || !time) return at;
  return `${formatIsoDate(date)}, ${time}`;
}

function EditProfileDialog({
  open,
  adminName,
  adminEmail,
  employeeId,
  details,
  onClose,
  onSave,
}: {
  open: boolean;
  adminName: string;
  adminEmail: string;
  employeeId: string;
  details: ProfileDetails;
  onClose: () => void;
  onSave: (next: { name: string; email: string; details: ProfileDetails }) => { ok: true } | { ok: false; message: string };
}) {
  const [name, setName] = useState(adminName);
  const [email, setEmail] = useState(adminEmail);
  const [draft, setDraft] = useState(details);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setName(adminName);
    setEmail(adminEmail);
    setDraft(details);
    setError("");
  }, [open, adminName, adminEmail, details]);

  const close = () => {
    if (busyRef.current) return;
    onClose();
    triggerRef.current?.focus();
  };

  const save = () => {
    if (busyRef.current) return;
    const message = profileFieldError({ name, email });
    if (message) {
      setError(message);
      return;
    }
    busyRef.current = true;
    setBusy(true);
    const result = onSave({
      name: name.trim(),
      email: email.trim(),
      details: {
        phone: draft.phone.trim(),
        department: draft.department.trim(),
        jobTitle: draft.jobTitle.trim(),
        language: draft.language.trim(),
        timeZone: draft.timeZone.trim(),
      },
    });
    busyRef.current = false;
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    toast.success("Profile saved");
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!next) close(); }}>
      <AlertDialogPortal>
        <AlertDialogOverlay className="bg-foreground/20 backdrop-blur-[1px]" />
        <AlertDialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 grid max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-soft",
          )}
          onEscapeKeyDown={(event) => {
            if (busyRef.current) event.preventDefault();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Name and email update the signed-in account. The other fields are saved in this browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Full name" value={name} onChange={setName} />
            <TextField label="Email address" value={email} onChange={setEmail} type="email" />
            <TextField label="Phone number" value={draft.phone} onChange={(phone) => setDraft((current) => ({ ...current, phone }))} placeholder="Add a phone number" />
            <TextField label="Department" value={draft.department} onChange={(department) => setDraft((current) => ({ ...current, department }))} placeholder="Add a department" />
            <TextField label="Job title" value={draft.jobTitle} onChange={(jobTitle) => setDraft((current) => ({ ...current, jobTitle }))} placeholder="Add a job title" />
            <label className="block min-w-0">
              <span className="mb-2 block text-sm font-semibold">Employee ID</span>
              <input
                value={employeeId}
                readOnly
                aria-label="Employee ID"
                className="h-11 w-full rounded-xl border border-input bg-surface px-4 text-[15px] text-muted-foreground"
              />
            </label>
            <TextField label="Preferred language" value={draft.language} onChange={(language) => setDraft((current) => ({ ...current, language }))} placeholder="Add a language" />
            <TextField label="Time zone" value={draft.timeZone} onChange={(timeZone) => setDraft((current) => ({ ...current, timeZone }))} placeholder="Add a time zone" />
          </div>
          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <Button type="button" disabled={busy} onClick={save}>
              Save Changes
            </Button>
          </AlertDialogFooter>
        </AlertDialogPrimitive.Content>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
