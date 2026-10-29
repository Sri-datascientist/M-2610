import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_shell/profile")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/profile", replace: true });
  },
});