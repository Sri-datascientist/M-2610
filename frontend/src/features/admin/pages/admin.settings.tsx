import { createFileRoute } from "@tanstack/react-router";
import { SettingsWorkspace } from "@/features/admin/settings-page";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings & Activity Logs — Meyveda Grantha" },
      { name: "description", content: "Portal preferences and the activity log." },
    ],
  }),
  component: SettingsPage,
});

export function SettingsPage() {
  return <SettingsWorkspace />;
}
