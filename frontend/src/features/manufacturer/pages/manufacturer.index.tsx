import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/manufacturer/")({
  beforeLoad: () => {
    throw redirect({ to: "/manufacturer/overview", replace: true });
  },
});
