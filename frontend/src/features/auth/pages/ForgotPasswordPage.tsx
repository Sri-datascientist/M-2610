import { createFileRoute, redirect } from "@tanstack/react-router";
import { Login } from "./LoginPage";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/forgot-password")({
  head: () => seo("Reset Password | Meyveda", "Reset your Meyveda account password."),
  beforeLoad: () => {
    throw redirect({ to: "/login", search: { mode: "forgot" }, replace: true });
  },
  component: () => <Login initialMode="forgot" />,
});

export function Forgot() {
  return <Login initialMode="forgot" />;
}
