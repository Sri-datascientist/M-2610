import { createFileRoute } from "@tanstack/react-router";
import { ReportsWorkspace } from "@/features/admin/reports-page";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Meyveda Grantha" },
      { name: "description", content: "Operational reports and exports." },
    ],
  }),
  component: ReportsPage,
});

export function ReportsPage() {
  return <ReportsWorkspace />;
}
