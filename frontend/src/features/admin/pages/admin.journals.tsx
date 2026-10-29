import { createFileRoute } from "@tanstack/react-router";
import { JournalsPage } from "@/features/admin/journals-page";

export const Route = createFileRoute("/admin/journals")({
  head: () => ({
    meta: [
      { title: "Journal management — meyveda" },
      {
        name: "description",
        content: "Peer-reviewed research and academic journal archive governance.",
      },
    ],
  }),
  component: JournalsPage,
});
