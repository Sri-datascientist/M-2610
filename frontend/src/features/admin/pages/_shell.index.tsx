import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_shell/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/home", replace: true });
  },
});
