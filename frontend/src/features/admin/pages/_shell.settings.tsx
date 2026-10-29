import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader, Panel } from "@/components/admin/ui";
import { useStore } from "@/lib/admin-store";

const KEY = "meyveda-admin-prefs";
const ZONES = ["Asia/Kolkata", "Asia/Dubai", "Europe/London", "UTC"] as const;

type Prefs = {
  emailAlerts: boolean;
  securityAlerts: boolean;
  compactTables: boolean;
  timezone: (typeof ZONES)[number];
};

const DEFAULTS: Prefs = {
  emailAlerts: true,
  securityAlerts: true,
  compactTables: false,
  timezone: "Asia/Kolkata",
};

export const Route = createFileRoute("/_shell/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Meyveda Admin" },
      { name: "description", content: "Notification and display preferences for the Meyveda admin portal." },
      { property: "og:title", content: "Settings — Meyveda Admin" },
      { property: "og:description", content: "Notification and display preferences for the Meyveda admin portal." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { admin } = useStore();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [saved, setSaved] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return;
    try {
      const parsed = { ...DEFAULTS, ...JSON.parse(raw) } as Prefs;
      setPrefs(parsed);
      setSaved(parsed);
    } catch {
      sessionStorage.removeItem(KEY);
    }
  }, []);

  const dirty = JSON.stringify(prefs) !== JSON.stringify(saved);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="How this portal notifies you and how dates are shown."
        actions={<Button disabled={!dirty} onClick={() => {
          sessionStorage.setItem(KEY, JSON.stringify(prefs));
          setSaved(prefs);
          toast.success("Settings saved for this browser session");
        }}>Save changes</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Notifications">
          <ul className="divide-y">
            <PrefRow
              id="email-alerts"
              label="Email alerts"
              text="Verification, compliance, and moderation items that need a decision."
              checked={prefs.emailAlerts}
              onChange={(emailAlerts) => setPrefs((p) => ({ ...p, emailAlerts }))}
            />
            <PrefRow
              id="security-alerts"
              label="Security alerts"
              text="Failed sign-ins, new incidents, and access reviews."
              checked={prefs.securityAlerts}
              onChange={(securityAlerts) => setPrefs((p) => ({ ...p, securityAlerts }))}
            />
          </ul>
        </Panel>
        <Panel title="Display">
          <ul className="divide-y">
            <PrefRow
              id="compact"
              label="Compact tables"
              text="Remember a compact-table preference for this browser session."
              checked={prefs.compactTables}
              onChange={(compactTables) => setPrefs((p) => ({ ...p, compactTables }))}
            />
            <li className="space-y-2 px-5 py-4">
              <Label htmlFor="timezone">Timezone</Label>
              <p className="text-xs text-muted-foreground">Used when you read timestamps in this portal.</p>
              <select
                id="timezone"
                value={prefs.timezone}
                onChange={(e) => setPrefs((p) => ({ ...p, timezone: e.target.value as Prefs["timezone"] }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {ZONES.map((z) => <option key={z}>{z}</option>)}
              </select>
            </li>
          </ul>
        </Panel>
        <Panel title="Signed-in administrator" className="lg:col-span-2">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-muted-foreground">Name</dt><dd className="font-medium">{admin?.name}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Email</dt><dd className="font-medium">{admin?.email}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Role</dt><dd className="font-medium">{admin?.role}</dd></div>
            </dl>
            <Button asChild variant="outline"><Link to="/profile">Open profile</Link></Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function PrefRow({ id, label, text, checked, onChange }: { id: string; label: string; text: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <li className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
        <p className="mt-1 text-xs text-muted-foreground">{text}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </li>
  );
}
