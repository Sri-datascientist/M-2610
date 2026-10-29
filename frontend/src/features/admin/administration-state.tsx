import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  authorize,
  canChangeRoles,
  canSetAccountStatus,
  formatIsoDate,
  prependAudit,
  resolveAccess,
  seedAudit,
  seedDirectory,
  seedSettings,
  settingError,
  type Access,
  type AdminRole,
  type AuditEvent,
  type DirectoryUser,
  type PlatformSetting,
} from "@/features/admin/administration-data";
import type { ActionResult } from "@/features/admin/compliance-data";
import { useStore } from "@/lib/admin-store";

function stamp() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type Administration = {
  users: DirectoryUser[];
  settings: PlatformSetting[];
  audit: AuditEvent[];
  access: Access;
  actor: string;
  actorEmail: string;
  assignRoles: (id: string, roles: AdminRole[]) => ActionResult;
  setAccountStatus: (id: string, status: DirectoryUser["status"]) => ActionResult;
  updateOwnAccount: (name: string, email: string) => ActionResult;
  saveSettings: (next: PlatformSetting[]) => ActionResult;
  recordExport: (module: string, detail: string) => ActionResult;
  recordActivity: (module: string, action: string, detail: string) => ActionResult;
};

const Ctx = createContext<Administration | null>(null);

export function AdministrationProvider({ children }: { children: ReactNode }) {
  const { admin, can } = useStore();
  const actor = admin?.name ?? "Ananya Iyer";
  const actorEmail = admin?.email ?? "";
  const [users, setUsers] = useState(seedDirectory);
  const [settings, setSettings] = useState(seedSettings);
  const [audit, setAudit] = useState(seedAudit);

  const access = useMemo(() => {
    const account = users.find((user) => user.email.toLowerCase() === actorEmail.toLowerCase());
    return resolveAccess({
      sessionManage: can("manage"),
      sessionExport: can("export"),
      accountStatus: account?.status ?? null,
    });
  }, [users, actorEmail, can]);

  const writeAudit = useCallback(
    (event: Omit<AuditEvent, "id" | "at" | "user"> & { user?: string }) => {
      setAudit((rows) =>
        prependAudit(rows, {
          id: `EVT-${81000 + rows.length}`,
          at: stamp(),
          user: event.user ?? actor,
          module: event.module,
          action: event.action,
          result: event.result,
          detail: event.detail,
          kind: event.kind,
        }),
      );
    },
    [actor],
  );

  const refuse = useCallback(
    (action: "manage" | "export", detail: string): ActionResult => {
      const result = authorize(access, action);
      if (result.ok) return result;
      writeAudit({
        module: "Security",
        action: action === "manage" ? "Change refused" : "Export refused",
        result: "Denied",
        detail,
        kind: "security",
      });
      return result;
    },
    [access, writeAudit],
  );

  const assignRoles = useCallback(
    (id: string, roles: AdminRole[]): ActionResult => {
      const allowed = refuse("manage", "A role change was refused.");
      if (!allowed.ok) return allowed;
      const guard = canChangeRoles(users, id, roles);
      if (!guard.ok) return guard;
      const current = users.find((user) => user.id === id);
      setUsers((rows) =>
        rows.map((user) => (user.id === id ? { ...user, roles: [...roles] } : user)),
      );
      writeAudit({
        module: "Users & Permissions",
        action: "Assigned roles",
        result: "Success",
        detail: `${current?.name ?? id}: ${roles.join(", ")}.`,
        kind: "activity",
      });
      return { ok: true };
    },
    [refuse, users, writeAudit],
  );

  const setAccountStatus = useCallback(
    (id: string, status: DirectoryUser["status"]): ActionResult => {
      const allowed = refuse("manage", "An account status change was refused.");
      if (!allowed.ok) return allowed;
      const guard = canSetAccountStatus(users, id, status, actorEmail);
      if (!guard.ok) return guard;
      const current = users.find((user) => user.id === id);
      const at = stamp();
      setUsers((rows) =>
        rows.map((user) =>
          user.id === id
            ? {
                ...user,
                status,
                lastActivity: at,
                lastActivityLabel: `${formatIsoDate(at.slice(0, 10))}, ${at.slice(11)}`,
              }
            : user,
        ),
      );
      writeAudit({
        module: "Users & Permissions",
        action: status === "Active" ? "Activated account" : "Deactivated account",
        result: "Success",
        detail: `${current?.name ?? id} is now ${status.toLowerCase()}.`,
        kind: "activity",
      });
      return { ok: true };
    },
    [actorEmail, refuse, users, writeAudit],
  );

  const saveSettings = useCallback(
    (next: PlatformSetting[]): ActionResult => {
      const allowed = refuse("manage", "A settings change was refused.");
      if (!allowed.ok) return allowed;
      for (const setting of next) {
        const message = settingError(setting, setting.value);
        if (message) return { ok: false, message };
      }
      const changed = next.filter(
        (setting) => settings.find((item) => item.id === setting.id)?.value !== setting.value,
      );
      if (!changed.length) return { ok: false, message: "There are no setting changes to record." };
      setSettings(next.map((setting) => ({ ...setting, value: setting.value.trim() })));
      writeAudit({
        module: "Settings",
        action: "Updated settings",
        result: "Success",
        detail: changed.map((setting) => setting.label).join(", "),
        kind: "activity",
      });
      return { ok: true };
    },
    [refuse, settings, writeAudit],
  );

  const updateOwnAccount = useCallback(
    (name: string, email: string): ActionResult => {
      const current = users.find((user) => user.email.toLowerCase() === actorEmail.toLowerCase());
      if (!current) return { ok: false, message: "This account is not in the directory." };
      const nextEmail = email.trim();
      const taken = users.some(
        (user) => user.id !== current.id && user.email.toLowerCase() === nextEmail.toLowerCase(),
      );
      if (taken) return { ok: false, message: "That email is already used by another account." };
      if (current.name === name.trim() && current.email === nextEmail) return { ok: true };
      setUsers((rows) =>
        rows.map((user) =>
          user.id === current.id ? { ...user, name: name.trim(), email: nextEmail } : user,
        ),
      );
      writeAudit({
        user: current.name,
        module: "Settings",
        action: "Updated profile",
        result: "Success",
        detail: `Saved the profile for ${current.id}.`,
        kind: "activity",
      });
      return { ok: true };
    },
    [actorEmail, users, writeAudit],
  );

  const recordExport = useCallback(
    (module: string, detail: string): ActionResult => {
      const allowed = refuse("export", `An export of ${module} was refused.`);
      if (!allowed.ok) return allowed;
      if (!detail.trim()) return { ok: false, message: "There are no rows to export." };
      writeAudit({
        module,
        action: "Exported records",
        result: "Success",
        detail,
        kind: "activity",
      });
      return { ok: true };
    },
    [refuse, writeAudit],
  );

  const recordActivity = useCallback(
    (module: string, action: string, detail: string): ActionResult => {
      const allowed = refuse("manage", `A change in ${module} was refused.`);
      if (!allowed.ok) return allowed;
      if (!detail.trim()) return { ok: false, message: "The record could not be identified." };
      writeAudit({
        module,
        action,
        result: "Success",
        detail,
        kind: "activity",
      });
      return { ok: true };
    },
    [refuse, writeAudit],
  );

  const value = useMemo(
    () => ({
      users,
      settings,
      audit,
      access,
      actor,
      actorEmail,
      assignRoles,
      setAccountStatus,
      updateOwnAccount,
      saveSettings,
      recordExport,
      recordActivity,
    }),
    [
      users,
      settings,
      audit,
      access,
      actor,
      actorEmail,
      assignRoles,
      setAccountStatus,
      updateOwnAccount,
      saveSettings,
      recordExport,
      recordActivity,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdministration() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useAdministration must be used inside AdministrationProvider");
  return value;
}
