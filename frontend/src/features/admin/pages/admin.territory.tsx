import { createFileRoute } from "@tanstack/react-router";
import { TerritoryPage } from "@/features/admin/territory-page";

export const Route = createFileRoute("/admin/territory")({
  head: () => ({
    meta: [
      { title: "Territory mapping — Meyveda Grantha" },
      {
        name: "description",
        content: "Geographical mapping and territorial distribution of registered doctors and manufacturers.",
      },
    ],
  }),
  component: TerritoryPage,
});
