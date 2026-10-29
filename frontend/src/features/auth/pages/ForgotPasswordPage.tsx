import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { Btn, Field, inputCls } from "@/components/ui-kit";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/forgot-password")({
  head: () => seo("Forgot password", "Request a password reset link for your doctor account."),
  component: Forgot,
});

export function Forgot() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  return (
    <AuthLayout title="Reset your password" desc="We'll send a reset link to your registered email.">
      {sent ? (
        <div className="rounded-xl bg-primary-soft p-4 text-sm">If an account exists for <b>{email}</b>, a reset link has been sent (mock). <Link to="/reset-password" className="font-semibold text-primary">Open reset screen</Link></div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (email.includes("@")) setSent(true); }}>
          <Field label="Email"><input type="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Btn className="w-full">Send reset link</Btn>
        </form>
      )}
      <p className="mt-6 text-center text-sm"><Link to="/login" className="font-semibold text-primary">Back to sign in</Link></p>
    </AuthLayout>
  );
}
