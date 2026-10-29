import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ConfirmDialog, DataTable, FilterSelect, NoPermission, PageHeader, Panel, SearchInput, StatCard, StatusBadge, Toolbar,
} from "@/components/admin/ui";
import { ROLES, type Role, type User } from "@/lib/admin-mock-data";
import { useStore } from "@/lib/admin-store";

export const Route = createFileRoute("/_shell/identity")({
  head: () => ({
    meta: [
      { title: "Identity & Roles — Meyveda Admin" },
      { name: "description", content: "Manage administrator accounts, roles, and access status." },
      { property: "og:title", content: "Identity & Roles — Meyveda Admin" },
      { property: "og:description", content: "Manage administrator accounts, roles, and access status." },
    ],
  }),
  component: IdentityPage,
});

function IdentityPage() {
  const { users, can, log, admin, now } = useStore();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pending, setPending] = useState<User["status"] | null>(null);
  const manage = can("manage");

  const rows = useMemo(
    () =>
      users.items.filter((u) => {
        const hay = `${u.name} ${u.email} ${u.id}`.toLowerCase();
        if (q && !hay.includes(q.toLowerCase())) return false;
        if (role !== "all" && u.role !== role) return false;
        if (status !== "all" && u.status !== status) return false;
        return true;
      }),
    [users.items, q, role, status],
  );
  const selected = users.items.find((u) => u.id === selectedId) ?? null;
  const isSelf = selected?.email === admin?.email;

  const applyStatus = (next: User["status"], reason: string) => {
    if (!selected) return;
    users.update(selected.id, (u) => ({ ...u, status: next }));
    log(`Set ${selected.id} to ${next}`, "Identity & Roles", "Success", reason);
    toast.success(`${selected.name} is now ${next.toLowerCase()}`);
  };

  return (
    <div>
      <PageHeader
        title="Identity & Roles"
        description="Administrator accounts, assigned roles, and sign-in status."
        actions={
          manage ? (
            <Button onClick={() => setInviteOpen((v) => !v)}>
              <UserPlus /> Invite administrator
            </Button>
          ) : undefined
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Administrators" value={users.items.length} />
        <StatCard label="Active" value={users.items.filter((u) => u.status === "Active").length} />
        <StatCard label="Suspended" value={users.items.filter((u) => u.status === "Suspended").length} />
        <StatCard label="MFA off" value={users.items.filter((u) => !u.mfa).length} hint="Needs a second factor" />
      </div>
      {inviteOpen && (
        <InviteForm
          onCancel={() => setInviteOpen(false)}
          onCreate={(draft) => {
            if (users.items.some((u) => u.email === draft.email)) {
              toast.error("An administrator with that email already exists.");
              return;
            }
            const id = `USR-${Date.now().toString().slice(-6)}`;
            users.add({
              ...draft,
              id,
              status: "Active",
              lastLogin: "—",
              mfa: false,
              joined: now().slice(0, 10),
            });
            log(`Invited administrator ${draft.email}`, "Identity & Roles");
            toast.success(`Invitation recorded for ${draft.name}`);
            setInviteOpen(false);
            setSelectedId(id);
          }}
        />
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel>
          <Toolbar>
            <SearchInput value={q} onChange={setQ} placeholder="Search name, email, or ID" />
            <FilterSelect label="Role" value={role} onChange={setRole} options={[...ROLES]} />
            <FilterSelect label="Status" value={status} onChange={setStatus} options={["Active", "Inactive", "Suspended"]} />
          </Toolbar>
          <DataTable
            rows={rows}
            onRowClick={(u) => setSelectedId(u.id)}
            isSelected={(u) => u.id === selectedId}
            columns={[
              { header: "Administrator", cell: (u) => (<div><p className="font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>) },
              { header: "Role", cell: (u) => u.role },
              { header: "Status", cell: (u) => <StatusBadge status={u.status} /> },
              { header: "MFA", cell: (u) => <StatusBadge status={u.mfa ? "Enabled" : "Disabled"} /> },
              { header: "Last login", cell: (u) => <span className="whitespace-nowrap text-muted-foreground">{u.lastLogin}</span> },
            ]}
          />
        </Panel>
        <Panel title={selected ? selected.name : "Account details"}>
          {selected ? (
            <div className="space-y-4 p-5 text-sm">
              <dl className="grid gap-3">
                <div><dt className="text-xs text-muted-foreground">ID</dt><dd className="font-medium">{selected.id}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Email</dt><dd className="font-medium">{selected.email}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Joined</dt><dd className="font-medium">{selected.joined}</dd></div>
              </dl>
              <div className="space-y-2">
                <Label htmlFor="role-select">Role</Label>
                <select
                  id="role-select"
                  aria-label="Assigned role"
                  disabled={!manage}
                  value={selected.role}
                  onChange={(e) => {
                    const next = e.target.value as Role;
                    users.update(selected.id, (u) => ({ ...u, role: next }));
                    log(`Updated role for ${selected.id} to ${next}`, "Identity & Roles");
                    toast.success(`Role updated to ${next}`);
                  }}
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {manage ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      users.update(selected.id, (u) => ({ ...u, mfa: !u.mfa }));
                      log(`${selected.mfa ? "Disabled" : "Enabled"} MFA for ${selected.id}`, "Identity & Roles");
                      toast.success(selected.mfa ? "MFA disabled" : "MFA enabled");
                    }}
                  >
                    {selected.mfa ? "Disable MFA" : "Enable MFA"}
                  </Button>
                  {selected.status === "Active" ? (
                    <Button variant="destructive" size="sm" disabled={isSelf} onClick={() => setPending("Suspended")}>Suspend</Button>
                  ) : (
                    <Button size="sm" onClick={() => setPending("Active")}>Reactivate</Button>
                  )}
                </div>
              ) : <NoPermission />}
              {isSelf && <p className="text-xs text-muted-foreground">You cannot suspend the account you are signed in with.</p>}
            </div>
          ) : (
            <p className="p-5 text-sm text-muted-foreground">Select an administrator to review their role and access.</p>
          )}
        </Panel>
      </div>
      <ConfirmDialog
        open={!!pending && !!selected}
        onOpenChange={(o) => { if (!o) setPending(null); }}
        title={pending === "Suspended" ? "Suspend administrator" : "Reactivate administrator"}
        description={selected ? `${selected.name} will be marked ${pending?.toLowerCase()}.` : undefined}
        confirmLabel={pending === "Suspended" ? "Suspend" : "Reactivate"}
        destructive={pending === "Suspended"}
        requireReason
        onConfirm={(reason) => { if (pending) applyStatus(pending, reason); setPending(null); }}
      />
    </div>
  );
}

function InviteForm({ onCreate, onCancel }: { onCreate: (draft: { name: string; email: string; role: Role }) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Operations Manager");
  const [err, setErr] = useState("");
  return (
    <Panel title="Invite administrator" className="mb-6">
      <form
        className="grid gap-4 p-5 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim().length < 2) return setErr("Enter the administrator's name.");
          if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter a valid email address.");
          setErr("");
          onCreate({ name: name.trim(), email: email.trim().toLowerCase(), role });
        }}
      >
        <div className="space-y-2"><Label htmlFor="invite-name">Name</Label><Input id="invite-name" value={name} onChange={(e) => setName(e.target.value)} className="bg-background" /></div>
        <div className="space-y-2"><Label htmlFor="invite-email">Email</Label><Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background" /></div>
        <div className="space-y-2">
          <Label htmlFor="invite-role">Role</Label>
          <select id="invite-role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit">Send invite</Button>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
        {err && <p className="text-xs text-destructive sm:col-span-4">{err}</p>}
      </form>
    </Panel>
  );
}
