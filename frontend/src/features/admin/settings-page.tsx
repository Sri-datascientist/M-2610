import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog, DataTable, type Column } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/portal/brand";
import {
  settingError,
  toCsv,
  type AuditEvent,
  type PlatformSetting,
} from "@/features/admin/administration-data";
import { useAdministration } from "@/features/admin/administration-state";
import {
  BackButton,
  DateField,
  DetailSection,
  MetaList,
  SearchField,
  SelectField,
  TextField,
  ViewTabs,
} from "@/features/admin/fields";
import { recorded, ReviewBadge } from "@/features/admin/review-ui";

const tabs = ["Platform settings", "Activity", "Security events"] as const;
type Tab = (typeof tabs)[number];

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function SettingsWorkspace() {
  const { settings, audit, access, saveSettings, recordExport } = useAdministration();
  const [tab, setTab] = useState<Tab>("Platform settings");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = audit.find((event) => event.id === selectedId) ?? null;
  const events =
    tab === "Security events" ? audit.filter((event) => event.kind === "security") : audit;

  return (
    <div>
      <PageHeader
        title="Settings & Activity Logs"
        subtitle="Platform configuration and the administrative record. Historical events stay as recorded."
      />
      <ViewTabs
        label="Settings sections"
        value={tab}
        onChange={(next) => {
          setTab(next);
          setSelectedId(null);
        }}
        options={tabs.map((item) => ({ id: item, label: item }))}
      />
      <div className="mt-4">
        {tab === "Platform settings" ? (
          <SettingsForm settings={settings} enabled={access.manage} onSave={saveSettings} />
        ) : selected ? (
          <EventDetail event={selected} onBack={() => setSelectedId(null)} />
        ) : (
          <ActivityLog
            key={tab}
            events={events}
            canExport={access.export}
            onOpen={setSelectedId}
            onExport={(rows) => {
              const result = recordExport(
                tab === "Security events" ? "Security" : "Settings",
                `${rows.length} audit records.`,
              );
              if (!result.ok) {
                toast.error(result.message);
                return;
              }
              downloadCsv(
                tab === "Security events"
                  ? "meyveda-security-events.csv"
                  : "meyveda-activity-log.csv",
                toCsv(
                  ["Timestamp", "User", "Module", "Action", "Result", "Details"],
                  rows.map((row) => [
                    row.at,
                    row.user,
                    row.module,
                    row.action,
                    row.result,
                    row.detail,
                  ]),
                ),
              );
              recorded("Audit records exported");
            }}
          />
        )}
      </div>
    </div>
  );
}

function SettingsForm({
  settings,
  enabled,
  onSave,
}: {
  settings: PlatformSetting[];
  enabled: boolean;
  onSave: (next: PlatformSetting[]) => { ok: boolean; message?: string };
}) {
  const [draft, setDraft] = useState(settings);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => setDraft(settings), [settings]);
  const update = (id: string, value: string) => {
    setDraft((rows) => rows.map((row) => (row.id === id ? { ...row, value } : row)));
  };
  const sensitiveChanged = draft.some(
    (setting) =>
      setting.sensitive && setting.value !== settings.find((item) => item.id === setting.id)?.value,
  );
  const apply = () => {
    const result = onSave(draft);
    if (!result.ok) toast.error(result.message ?? "The change was not recorded.");
    else recorded("Settings saved");
  };
  return (
    <form
      className="card-surface p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!enabled) {
          toast.error("Your account cannot change these records.");
          return;
        }
        for (const setting of draft) {
          const message = settingError(setting, setting.value);
          if (message) {
            toast.error(message);
            return;
          }
        }
        if (sensitiveChanged) setConfirming(true);
        else apply();
      }}
    >
      <fieldset disabled={!enabled} className="space-y-5">
        {draft.map((setting) => (
          <div key={setting.id}>
            {setting.kind === "boolean" ? (
              <SelectField
                label={setting.label}
                value={setting.value}
                onChange={(value) => update(setting.id, value)}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
              />
            ) : (
              <TextField
                label={setting.label}
                type={
                  setting.kind === "number"
                    ? "number"
                    : setting.id === "support-email"
                      ? "email"
                      : "text"
                }
                value={setting.value}
                onChange={(value) => update(setting.id, value)}
              />
            )}
            <p className="mt-2 text-sm text-muted-foreground">{setting.description}</p>
          </div>
        ))}
      </fieldset>
      {enabled ? (
        <Button type="submit" className="mt-5">
          Save settings
        </Button>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          Your account can review these settings but cannot change them.
        </p>
      )}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Save sensitive settings"
        description="Session timeout, rejection reasons, and export limits affect how administrators work. Confirm before recording the change."
        confirmLabel="Save settings"
        onConfirm={apply}
      />
    </form>
  );
}

function ActivityLog({
  events,
  canExport,
  onOpen,
  onExport,
}: {
  events: AuditEvent[];
  canExport: boolean;
  onOpen: (id: string) => void;
  onExport: (rows: AuditEvent[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [user, setUser] = useState("all");
  const [module, setModule] = useState("all");
  const [action, setAction] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const users = useMemo(() => [...new Set(events.map((event) => event.user))], [events]);
  const modules = useMemo(() => [...new Set(events.map((event) => event.module))], [events]);
  const actions = useMemo(() => [...new Set(events.map((event) => event.action))], [events]);
  const rangeError = Boolean(from && to && from > to);
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (rangeError) return [];
    return events.filter((event) => {
      const haystack =
        `${event.user} ${event.module} ${event.action} ${event.detail} ${event.result}`.toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (user !== "all" && event.user !== user) return false;
      if (module !== "all" && event.module !== module) return false;
      if (action !== "all" && event.action !== action) return false;
      const day = event.at.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  }, [events, query, user, module, action, from, to, rangeError]);

  const columns: Column<AuditEvent>[] = [
    { header: "Timestamp", cell: (row) => row.at },
    { header: "User", cell: (row) => row.user },
    { header: "Module", cell: (row) => row.module },
    { header: "Action", cell: (row) => <span className="font-semibold">{row.action}</span> },
    { header: "Result", cell: (row) => <ReviewBadge status={row.result} /> },
    {
      header: "Details",
      cell: (row) => <span className="line-clamp-2 max-w-xs">{row.detail}</span>,
    },
  ];

  return (
    <section className="card-surface">
      <div className="flex justify-end border-b border-border px-5 py-4">
        {canExport ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (!rows.length) {
                toast.error("There are no rows to export.");
                return;
              }
              onExport(rows);
            }}
          >
            Export
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Your account cannot export these records.</p>
        )}
      </div>
      <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          <SearchField
            label="Search"
            value={query}
            onChange={setQuery}
            placeholder="User, module, action, or detail"
          />
        </div>
        <SelectField
          label="User"
          value={user}
          onChange={setUser}
          options={[
            { value: "all", label: "All users" },
            ...users.map((item) => ({ value: item, label: item })),
          ]}
        />
        <SelectField
          label="Module"
          value={module}
          onChange={setModule}
          options={[
            { value: "all", label: "All modules" },
            ...modules.map((item) => ({ value: item, label: item })),
          ]}
        />
        <SelectField
          label="Action"
          value={action}
          onChange={setAction}
          options={[
            { value: "all", label: "All actions" },
            ...actions.map((item) => ({ value: item, label: item })),
          ]}
        />
        <DateField label="From" value={from} onChange={setFrom} />
        <DateField label="To" value={to} onChange={setTo} />
      </div>
      {rangeError ? (
        <p className="px-5 pt-4 text-sm text-muted-foreground">
          The start date is after the end date.
        </p>
      ) : null}
      <DataTable
        key={`${query}|${user}|${module}|${action}|${from}|${to}`}
        rows={rows}
        columns={columns}
        onRowClick={(row) => onOpen(row.id)}
        pageSize={8}
      />
    </section>
  );
}

function EventDetail({ event, onBack }: { event: AuditEvent; onBack: () => void }) {
  return (
    <div>
      <BackButton onClick={onBack} label="Back to the log" />
      <div className="mt-4">
        <DetailSection title={event.action}>
          <MetaList
            rows={[
              { label: "Timestamp", value: event.at },
              { label: "User", value: event.user },
              { label: "Module", value: event.module },
              { label: "Result", value: <ReviewBadge status={event.result} /> },
              { label: "Details", value: event.detail },
            ]}
          />
          <p className="mt-4 text-sm text-muted-foreground">Historical events stay as recorded.</p>
        </DetailSection>
      </div>
    </div>
  );
}
