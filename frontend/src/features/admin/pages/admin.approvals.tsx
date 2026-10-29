import { createFileRoute } from "@tanstack/react-router";
import { ApprovalsQueue } from "@/features/admin/approvals-page";

export const Route = createFileRoute("/admin/approvals")({
  head: () => ({
    meta: [
      { title: "Product Approvals — Meyveda Grantha" },
      { name: "description", content: "Medicine submissions waiting for a decision." },
    ],
  }),
  component: ApprovalsPage,
});

export function ApprovalsPage() {
  return <ApprovalsQueue />;
}
