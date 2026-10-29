import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog, DataTable, type Column } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/portal/brand";
import {
  adminRoles,
  permissions,
  permissionsFor,
  rolePermissions,
  type AdminRole,
  type DirectoryUser,
} from "@/features/admin/administration-data";
import { useAdministration } from "@/features/admin/administration-state";
import { CheckList, DetailShell, openColumn } from "@/features/admin/compliance-ui";
import {
  DetailSection,
  MetaList,
  SearchField,
  SelectField,
  ViewTabs,
} from "@/features/admin/fields";
import { recorded, ReviewBadge } from "@/features/admin/review-ui";

const views = ["Directory", "Permission matrix"] as const;
type View = (typeof views)[number];
const tabs = ["Profile", "Roles", "Access history"] as const;
type Tab = (typeof tabs)[number];

export function UsersWorkspace() {
  const { users, audit, access, assignRoles, setAccountStatus } = useAdministration();
  const [view, setView] = useState<View>("Directory");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = users.find((user) => user.id === selectedId) ?? null;

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((user) => {
      const haystack = `${user.name} ${user.email}`.toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (role !== "all" && !user.roles.includes(role as AdminRole)) return false;
      if (status !== "all" && user.status !== status) return false;
      return true;
    });
  }, [users, query, role, status]);

  if (selected) {
    return (
      <UserDetail
        user={selected}
        enabled={access.manage}
        history={audit.filter((event) => event.user === selected.name)}
        onBack={() => setSelectedId(null)}
        onRoles={(roles) => {
          const result = assignRoles(selected.id, roles);
          if (!result.ok) toast.error(result.message);
          else recorded("Roles assigned");
          return result.ok;
        }}
        onStatus={(next) => {
          const result = setAccountStatus(selected.id, next);
          if (!result.ok) toast.error(result.message);
          else recorded(next === "Active" ? "Account activated" : "Account deactivated");
        }}
      />
    );
  }

  const columns: Column<DirectoryUser>[] = [
    { header: "User", cell: (row) => <span className="font-semibold">{row.name}</span> },
    { header: "Email", cell: (row) => row.email },
    { header: "Assigned Roles", cell: (row) => row.roles.join(", ") },
    { header: "Account Status", cell: (row) => <ReviewBadge status={row.status} /> },
    { header: "Last Activity", cell: (row) => row.lastActivityLabel },
    openColumn<DirectoryUser>(setSelectedId),
  ];

  return (
    <div>
      <PageHeader
        title="Users & Permissions"
        subtitle="Administrator accounts, approved roles, and the permissions those roles grant."
      />
      <ViewTabs
        label="User administration"
        value={view}
        onChange={setView}
        options={views.map((item) => ({ id: item, label: item }))}
      />
      {view === "Permission matrix" ? (
        <section className="card-surface mt-4 p-5 sm:p-6">
          <h2 className="type-section">Role permissions</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Changes are refused when the signed-in account is not allowed to make them. Hiding a
            control does not grant the action.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="whitespace-nowrap px-3 py-3 font-medium">Permission</th>
                  {adminRoles.map((item) => (
                    <th key={item} className="whitespace-nowrap px-3 py-3 font-medium">
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((permission) => (
                  <tr key={permission} className="border-b last:border-0">
                    <th className="whitespace-nowrap px-3 py-3 text-left font-medium">
                      {permission}
                    </th>
                    {adminRoles.map((item) => (
                      <td key={item} className="px-3 py-3 text-center">
                        {rolePermissions[item].includes(permission) ? "Yes" : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="card-surface mt-4">
          <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <SearchField
                label="Search"
                value={query}
                onChange={setQuery}
                placeholder="Name or email"
              />
            </div>
            <SelectField
              label="Role"
              value={role}
              onChange={setRole}
              options={[
                { value: "all", label: "All roles" },
                ...adminRoles.map((item) => ({ value: item, label: item })),
              ]}
            />
            <SelectField
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "All statuses" },
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
            />
          </div>
          <DataTable
            key={`${query}|${role}|${status}`}
            rows={rows}
            columns={columns}
            onRowClick={(row) => setSelectedId(row.id)}
            pageSize={8}
          />
        </section>
      )}
    </div>
  );
}

function UserDetail({
  user,
  enabled,
  history,
  onBack,
  onRoles,
  onStatus,
}: {
  user: DirectoryUser;
  enabled: boolean;
  history: {
    id: string;
    at: string;
    module: string;
    action: string;
    result: string;
    detail: string;
  }[];
  onBack: () => void;
  onRoles: (roles: AdminRole[]) => boolean;
  onStatus: (status: DirectoryUser["status"]) => void;
}) {
  const [tab, setTab] = useState<Tab>("Profile");
  const [roles, setRoles] = useState<AdminRole[]>(user.roles);
  const [confirmRoles, setConfirmRoles] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(false);
  const nextStatus = user.status === "Active" ? "Inactive" : "Active";
  const granted = new Set(permissionsFor(user.roles));
  return (
    <DetailShell
      title="Users & Permissions"
      subtitle="Administrator accounts, approved roles, and the permissions those roles grant."
      backLabel="Back to users"
      onBack={onBack}
      heading={user.name}
      meta={user.email}
      badge={<ReviewBadge status={user.status} />}
      tabLabel="Account sections"
      tab={tab}
      tabs={tabs}
      onTab={setTab}
      decisions={
        enabled ? (
          <Button
            type="button"
            size="sm"
            variant={nextStatus === "Inactive" ? "destructive" : "default"}
            onClick={() => setConfirmStatus(true)}
          >
            {nextStatus === "Inactive" ? "Deactivate account" : "Activate account"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your account can review these records but cannot change them.
          </p>
        )
      }
    >
      {tab === "Profile" ? (
        <DetailSection title="Account">
          <MetaList
            rows={[
              { label: "Email", value: user.email },
              { label: "Status", value: <ReviewBadge status={user.status} /> },
              { label: "Assigned roles", value: user.roles.join(", ") },
              { label: "Last activity", value: user.lastActivityLabel },
            ]}
          />
        </DetailSection>
      ) : null}
      {tab === "Roles" ? (
        <>
          <DetailSection title="Approved roles">
            {enabled ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!roles.length) {
                    toast.error("Assign at least one approved role.");
                    return;
                  }
                  setConfirmRoles(true);
                }}
              >
                <CheckList
                  items={adminRoles.map((role) => ({
                    label: role,
                    done: roles.includes(role),
                  }))}
                  onToggle={(index) => {
                    const role = adminRoles[index];
                    if (!role) return;
                    setRoles((current) =>
                      current.includes(role)
                        ? current.filter((item) => item !== role)
                        : [...current, role],
                    );
                  }}
                />
                <Button type="submit" size="sm" className="mt-4">
                  Save roles
                </Button>
              </form>
            ) : (
              <p className="text-sm">{user.roles.join(", ")}</p>
            )}
          </DetailSection>
          <DetailSection title="Permissions for these roles">
            <ul className="space-y-2">
              {permissions.map((permission) => (
                <li key={permission} className="flex items-center justify-between gap-3 text-sm">
                  <span>{permission}</span>
                  <span
                    className={granted.has(permission) ? "font-semibold" : "text-muted-foreground"}
                  >
                    {granted.has(permission) ? "Granted" : "Not granted"}
                  </span>
                </li>
              ))}
            </ul>
          </DetailSection>
        </>
      ) : null}
      {tab === "Access history" ? (
        <DetailSection title="Access history">
          {history.length ? (
            <ul className="space-y-3">
              {history.map((event) => (
                <li key={event.id}>
                  <p className="text-sm font-medium">
                    {event.action} · {event.module}
                  </p>
                  <p className="text-sm text-muted-foreground">{event.detail}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.at} · {event.result}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No access history is recorded for this account.
            </p>
          )}
        </DetailSection>
      ) : null}
      <ConfirmDialog
        open={confirmRoles}
        onOpenChange={setConfirmRoles}
        title="Assign roles"
        description={`Save these roles for ${user.name}: ${roles.join(", ")}.`}
        confirmLabel="Assign roles"
        onConfirm={() => {
          if (onRoles(roles)) setConfirmRoles(false);
        }}
      />
      <ConfirmDialog
        open={confirmStatus}
        onOpenChange={setConfirmStatus}
        title={nextStatus === "Inactive" ? "Deactivate account" : "Activate account"}
        description={
          nextStatus === "Inactive"
            ? `${user.name} will not be able to change or export records while the account is inactive.`
            : `${user.name} will be marked active.`
        }
        confirmLabel={nextStatus === "Inactive" ? "Deactivate" : "Activate"}
        destructive={nextStatus === "Inactive"}
        onConfirm={() => {
          onStatus(nextStatus);
          setConfirmStatus(false);
        }}
      />
    </DetailShell>
  );
}
