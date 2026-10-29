// Prototype in-memory store. Every mutation appends an audit event.
// Swap these actions for server calls when the backend exists; permission checks must then live on the server.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { phaseNotices } from "@/features/admin/portal-notices";
import * as M from "./admin-mock-data";

export interface Admin { name: string; email: string; role: M.Role }

export const DEMO_ACCOUNTS: (Admin & { password: string })[] = [
  { name: "Ananya Iyer", email: "admin@meyveda.com", password: "Meyveda@2026", role: "Platform Administrator" },
  { name: "Meera Pillai", email: "auditor@meyveda.com", password: "Meyveda@2026", role: "Read-Only Auditor" },
];

type Perm = "manage" | "export";
const PERMS: Record<M.Role, Perm[]> = {
  "Platform Administrator": ["manage", "export"],
  "Compliance Administrator": ["manage", "export"],
  "Operations Manager": ["manage"],
  "Support Administrator": ["manage"],
  "Read-Only Auditor": ["export"],
};

function nowStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function useCollection<T extends { id: string }>(seed: T[]) {
  const [items, setItems] = useState<T[]>(seed);
  const update = useCallback((id: string, fn: (t: T) => T) => setItems((xs) => xs.map((x) => (x.id === id ? fn(x) : x))), []);
  const add = useCallback((t: T) => setItems((xs) => [t, ...xs]), []);
  const remove = useCallback((id: string) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  return { items, update, add, remove };
}

const SESSION_KEY = "meyveda-admin";

function demoAdmin(): Admin | null {
  const acc = DEMO_ACCOUNTS.find((a) => a.role === "Platform Administrator");
  if (!acc) return null;
  return { name: acc.name, email: acc.email, role: acc.role };
}

function readStoredAdmin(): Admin | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Admin>;
    if (!parsed.name || !parsed.email || !parsed.role) return null;
    return { name: parsed.name, email: parsed.email, role: parsed.role };
  } catch {
    return null;
  }
}

function useStoreValue() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [ready, setReady] = useState(false);

  const ensureDemoSession = useCallback(() => {
    if (!import.meta.env.DEV) return null;
    const next = readStoredAdmin() ?? demoAdmin();
    if (!next) return null;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setAdmin(next);
    return next;
  }, []);

  useEffect(() => {
    const existing = readStoredAdmin();
    if (existing) {
      setAdmin(existing);
    }
    setReady(true);
  }, []);

  const users = useCollection(M.users);
  const verifications = useCollection(M.verifications);
  const moderation = useCollection(M.moderation);
  const rules = useCollection(M.commercialRules);
  const obligations = useCollection(M.obligations);
  const consents = useCollection(M.consentTemplates);
  const privacy = useCollection(M.privacyRequests);
  const audit = useCollection(M.auditSeed);
  const accessReviews = useCollection(M.accessReviews);
  const incidents = useCollection(M.incidents);
  const sessions = useCollection(M.sessions);
  const knowledge = useCollection(M.knowledge);
  const notifications = useCollection(phaseNotices);
  const [sessionList, setSessionList] = useState(M.sessions);

  const log = useCallback(
    (activity: string, module: string, result: M.AuditEvent["result"] = "Success", detail?: string) => {
      audit.add({ id: `EVT-${80022 + Math.floor(Math.random() * 90000)}`, activity, actor: admin?.name ?? "unknown", module, timestamp: nowStamp(), result, detail });
    },
    [audit, admin],
  );

  const can = useCallback((p: Perm) => (admin ? PERMS[admin.role].includes(p) : false), [admin]);

  const signIn = (email: string, password: string): Admin | null => {
    const acc = DEMO_ACCOUNTS.find((a) => a.email === email.trim().toLowerCase() && a.password === password);
    if (!acc) return null;
    const a = { name: acc.name, email: acc.email, role: acc.role };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(a));
    setAdmin(a);
    return a;
  };
  const signOut = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAdmin(null);
  };
  const updateSession = (next: Admin) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setAdmin(next);
  };

  return {
    admin, ready, signIn, signOut, updateSession, ensureDemoSession, can, log, now: nowStamp,
    users, verifications, moderation, rules, obligations, consents, privacy, audit,
    accessReviews, incidents, sessions: { ...sessions, items: sessionList, remove: (id: string) => setSessionList((s) => s.filter((x) => x.id !== id)) },
    knowledge, notifications,
  };
}

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={useMemo(() => value, [value])}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}
