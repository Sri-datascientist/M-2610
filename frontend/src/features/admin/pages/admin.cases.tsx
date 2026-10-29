import { createFileRoute } from "@tanstack/react-router";
import { CasesQueue } from "@/features/admin/cases-page";

export const Route = createFileRoute("/admin/cases")({
  head: () => ({
    meta: [
      { title: "Clinical Cases — meyveda" },
      { name: "description", content: "Oversight of clinical cases." },
    ],
  }),
  component: CasesPage,
});

export function CasesPage() {
  return <CasesQueue />;
}
