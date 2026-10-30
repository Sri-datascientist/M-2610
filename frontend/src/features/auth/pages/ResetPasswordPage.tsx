import { createFileRoute, redirect } from "@tanstack/react-router";
import { Login } from "./LoginPage";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/reset-password")({
  head: () => seo("Set New Password | Meyveda", "Choose a new password for your Meyveda account."),
  beforeLoad: () => {
    throw redirect({ to: "/login", search: { mode: "forgot" }, replace: true });
  },
  component: () => <Login initialMode="forgot" />,
});

export function Reset() {
  return <Login initialMode="forgot" />;
}
