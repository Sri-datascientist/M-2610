import { createFileRoute } from "@tanstack/react-router";
import { QualityWorkspace } from "@/features/admin/quality-page";

export const Route = createFileRoute("/admin/quality")({
  head: () => ({
    meta: [
      { title: "Quality & Batches — meyveda" },
      { name: "description", content: "Batch holds, releases, and quality alerts." },
    ],
  }),
  component: QualityPage,
});

export function QualityPage() {
  return <QualityWorkspace />;
}
