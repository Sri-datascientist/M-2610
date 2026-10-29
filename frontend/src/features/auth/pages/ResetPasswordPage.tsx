import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/AuthLayout";
import { Btn, Field, inputCls } from "@/components/ui-kit";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/reset-password")({
  head: () => seo("Choose a new password", "Set a new password for your doctor account."),
  component: Reset,
});

export function Reset() {
  const navigate = useNavigate();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const err = a && a.length < 8 ? "Use at least 8 characters." : b && a !== b ? "Passwords don't match." : "";
  return (
    <AuthLayout title="Choose a new password">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (err || !a) return; toast.success("Password updated"); navigate({ to: "/login" }); }}>
        <Field label="New password"><input type="password" className={inputCls} value={a} onChange={(e) => setA(e.target.value)} /></Field>
        <Field label="Confirm password" error={err}><input type="password" className={inputCls} value={b} onChange={(e) => setB(e.target.value)} /></Field>
        <Btn className="w-full">Update password</Btn>
      </form>
    </AuthLayout>
  );
}
