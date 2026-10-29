import { createFileRoute } from "@tanstack/react-router";
import { LibraryWorkspace } from "@/features/admin/library-page";

export const Route = createFileRoute("/admin/library")({
  head: () => ({
    meta: [
      { title: "Library management — Meyveda Grantha" },
      {
        name: "description",
        content: "Classical texts, governed knowledge entries, and practitioner published content.",
      },
    ],
  }),
  component: LibraryWorkspace,
});
