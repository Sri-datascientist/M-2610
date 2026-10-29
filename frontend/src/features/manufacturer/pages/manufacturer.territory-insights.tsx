import { createFileRoute } from "@tanstack/react-router";
import { TerritoryInsightsPage } from "@/features/manufacturer/TerritoryInsightsPage";

export const Route = createFileRoute("/manufacturer/territory-insights")({
  head: () => ({
    meta: [
      { title: "Territory Insights — meyveda" },
      { name: "description", content: "Ayurvedic doctor prescription density and regional clinical trends." },
    ],
  }),
  component: TerritoryInsightsPage,
});
