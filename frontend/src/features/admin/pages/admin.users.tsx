import { createFileRoute } from "@tanstack/react-router";
import { UsersWorkspace } from "@/features/admin/users-page";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users & Permissions — meyveda" },
      { name: "description", content: "Administrator accounts and access." },
    ],
  }),
  component: UsersPage,
});

export function UsersPage() {
  return <UsersWorkspace />;
}
