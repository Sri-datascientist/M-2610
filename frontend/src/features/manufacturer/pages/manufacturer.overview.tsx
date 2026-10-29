import { createFileRoute } from "@tanstack/react-router";
import { OverviewPage } from "@/features/manufacturer/OverviewPage";

export const Route = createFileRoute("/manufacturer/overview")({
  head: () => ({
    meta: [
      { title: "Manufacturer Overview — meyveda" },
      { name: "description", content: "Ayurveda manufacturer metrics, formulations and pharmacovigilance." },
    ],
  }),
  component: OverviewPage,
});
