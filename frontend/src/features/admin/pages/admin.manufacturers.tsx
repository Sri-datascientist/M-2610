import { createFileRoute } from "@tanstack/react-router";
import { ManufacturersDirectory } from "@/features/admin/manufacturers-page";

export const Route = createFileRoute("/admin/manufacturers")({
  head: () => ({
    meta: [
      { title: "Manufacturer verification — meyveda" },
      {
        name: "description",
        content: "Manage pharmaceutical company applications and facility verification.",
      },
    ],
  }),
  component: ManufacturersDirectory,
});
