import { createFileRoute } from "@tanstack/react-router";
import { QueriesPage } from "@/features/admin/queries-page";

export const Route = createFileRoute("/admin/queries")({
  head: () => ({
    meta: [
      { title: "Query Management — meyveda" },
      {
        name: "description",
        content: "Manage user questions, complaints, and platform support requests.",
      },
    ],
  }),
  component: QueriesPage,
});
