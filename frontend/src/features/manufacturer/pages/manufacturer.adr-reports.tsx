import { createFileRoute } from "@tanstack/react-router";
import { ADRReportsPage } from "@/features/manufacturer/ADRReportsPage";

export const Route = createFileRoute("/manufacturer/adr-reports")({
  head: () => ({
    meta: [
      { title: "ADR Reports — Meyveda Grantha" },
      { name: "description", content: "Pharmacovigilance adverse reaction surveillance and QC batch inquiries." },
    ],
  }),
  component: ADRReportsPage,
});
