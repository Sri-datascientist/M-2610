import { createFileRoute } from "@tanstack/react-router";
import { PublishedContentPage } from "@/features/admin/published-content-page";

export const Route = createFileRoute("/admin/published-content")({
  head: () => ({
    meta: [
      { title: "Published Content — meyveda" },
      {
        name: "description",
        content: "Review and manage knowledge shared by verified practitioners.",
      },
    ],
  }),
  component: PublishedContentPage,
});
