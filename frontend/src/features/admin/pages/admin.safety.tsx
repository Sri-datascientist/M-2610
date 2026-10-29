import { createFileRoute } from "@tanstack/react-router";
import { SafetyWorkspace } from "@/features/admin/safety-page";

export const Route = createFileRoute("/admin/safety")({
  head: () => ({
    meta: [
      { title: "ADR reports — meyveda" },
      { name: "description", content: "De-identified adverse drug reaction reports and clinical safety reviews." },
    ],
  }),
  component: SafetyPage,
});

export function SafetyPage() {
  return <SafetyWorkspace />;
}
