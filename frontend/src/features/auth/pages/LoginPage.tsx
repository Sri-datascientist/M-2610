import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { Btn, Field, inputCls } from "@/components/ui-kit";
import { setState } from "@/lib/store";
import { DEMO_ACCOUNTS } from "@/lib/admin-store";
import {
  DEMO_MANUFACTURERS,
  STORAGE_KEY_SESSION,
} from "@/features/manufacturer/manufacturer-context";
import { defaultDoctor } from "@/lib/mock-data";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { Shield, Stethoscope, Factory, ArrowRight } from "lucide-react";
import { apiClient } from "@/services/apiClient";

const DEMO_DOCTOR = {
  name: defaultDoctor.name,
  qualification: defaultDoctor.qualification,
  email: defaultDoctor.email,
  password: "Meyveda@2026",
};

interface LoginSearch {
  portal?: "doctor" | "admin" | "manufacturer";
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    const p = search["portal"];
    return {
      portal: p === "admin" ? "admin" : p === "manufacturer" ? "manufacturer" : "doctor",
    };
  },
  head: () => seo("Sign in", "Sign in to the Mey Veda Grantha portal."),
  component: Login,
});

const ADMIN_SESSION_KEY = "meyveda-admin";

export function Login() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const activePortal = search.portal ?? "doctor";

  // Doctor state
  const [docEmail, setDocEmail] = useState("");
  const [docPw, setDocPw] = useState("");
  const [docErr, setDocErr] = useState("");

  // Admin state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPw, setAdminPw] = useState("");
  const [adminErr, setAdminErr] = useState("");

  // Manufacturer state
  const [mfgEmail, setMfgEmail] = useState("");
  const [mfgPw, setMfgPw] = useState("");
  const [mfgErr, setMfgErr] = useState("");

  const switchPortal = (portal: "doctor" | "admin" | "manufacturer") => {
    setDocErr("");
    setAdminErr("");
    setMfgErr("");
    void navigate({
      to: "/login",
      search: { portal },
    });
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docEmail.includes("@") || docPw.length < 6) {
      return setDocErr("Enter a valid email and a password of 6+ characters.");
    }
    try {
      const res = await apiClient.post<{ access_token?: string; role?: string }>("/auth/login", {
        email: docEmail.trim().toLowerCase(),
        password: docPw,
      });
      if (res?.access_token) {
        localStorage.setItem("meyveda_auth_token", res.access_token);
        localStorage.setItem("meyveda_user_role", res.role || "doctor");
      }
      setState(() => ({ signedIn: true }));
      navigate({ to: "/workspace" });
    } catch (err: any) {
      setDocErr(err?.message || "Invalid doctor credentials.");
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.includes("@") || adminPw.length < 6) {
      return setAdminErr("Enter a valid email and a password of 6+ characters.");
    }
    try {
      const res = await apiClient.post<{ access_token?: string; role?: string; user?: any }>("/auth/login", {
        email: adminEmail.trim().toLowerCase(),
        password: adminPw,
      });
      if (res?.access_token) {
        localStorage.setItem("meyveda_auth_token", res.access_token);
        localStorage.setItem("meyveda_user_role", res.role || "admin");
        const session = { name: "Platform Administrator", email: adminEmail.trim(), role: "Platform Administrator" };
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        navigate({ to: "/admin/home" });
        return;
      }
    } catch {
      const acc = DEMO_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === adminEmail.trim().toLowerCase() && a.password === adminPw,
      );
      if (acc) {
        const session = { name: acc.name, email: acc.email, role: acc.role };
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        localStorage.setItem("meyveda_user_role", "admin");
        navigate({ to: "/admin/home" });
        return;
      }
      setAdminErr("Invalid administrator credentials.");
    }
  };

  const handleAdminDemoLogin = (email: string, password: string) => {
    const acc = DEMO_ACCOUNTS.find((a) => a.email === email && a.password === password);
    if (acc) {
      const session = { name: acc.name, email: acc.email, role: acc.role };
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      localStorage.setItem("meyveda_user_role", "admin");
      navigate({ to: "/admin/home" });
    }
  };

  const handleMfgDemoLogin = (email: string, password: string) => {
    const acc = DEMO_MANUFACTURERS.find((m) => m.email === email && m.password === password);
    if (acc) {
      const session = {
        brandName: acc.brandName,
        contactPerson: acc.contactPerson,
        email: acc.email,
        licenseNumber: acc.licenseNumber,
      };
      sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
      localStorage.setItem("meyveda_user_role", "manufacturer");
      navigate({ to: "/manufacturer/overview" });
    }
  };

  const handleMfgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfgEmail.includes("@") || mfgPw.length < 6) {
      return setMfgErr("Enter a valid business email and password.");
    }
    try {
      const res = await apiClient.post<{ access_token?: string; role?: string; user?: any }>("/auth/login", {
        email: mfgEmail.trim().toLowerCase(),
        password: mfgPw,
      });
      if (res?.access_token) {
        localStorage.setItem("meyveda_auth_token", res.access_token);
        localStorage.setItem("meyveda_user_role", res.role || "manufacturer");
        const session = {
          brandName: "Registered Manufacturer",
          contactPerson: "Manufacturer Representative",
          email: mfgEmail.trim(),
          licenseNumber: "AYUSH/MFG/VERIFIED",
        };
        sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
        navigate({ to: "/manufacturer/overview" });
        return;
      }
    } catch {
      const acc = DEMO_MANUFACTURERS.find(
        (m) => m.email.toLowerCase() === mfgEmail.trim().toLowerCase() && m.password === mfgPw,
      );
      if (acc) {
        const session = {
          brandName: acc.brandName,
          contactPerson: acc.contactPerson,
          email: acc.email,
          licenseNumber: acc.licenseNumber,
        };
        sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
        localStorage.setItem("meyveda_user_role", "manufacturer");
        navigate({ to: "/manufacturer/overview" });
        return;
      }
      setMfgErr("Invalid manufacturer credentials.");
    }
  };

  return (
    <AuthLayout
      title={
        activePortal === "doctor"
          ? "Welcome back"
          : activePortal === "admin"
            ? "Administrator Sign In"
            : "Manufacturer Sign In"
      }
      desc={
        activePortal === "doctor"
          ? "Sign in to your doctor workspace."
          : activePortal === "admin"
            ? "Access the Meyveda Grantha governance and administration console."
            : "Access the Meyveda Grantha manufacturer regulatory and formulation portal."
      }
    >
      {/* Portal Selection Tabs */}
      <div className="mb-6">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
          Select Portal
        </label>
        <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-border bg-muted/40 p-1.5">
          <button
            type="button"
            onClick={() => switchPortal("doctor")}
            className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
              activePortal === "doctor"
                ? "bg-white text-primary shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={activePortal === "doctor"}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Doctor</span>
          </button>
          <button
            type="button"
            onClick={() => switchPortal("admin")}
            className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
              activePortal === "admin"
                ? "bg-white text-primary shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={activePortal === "admin"}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Admin</span>
          </button>
          <button
            type="button"
            onClick={() => switchPortal("manufacturer")}
            className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
              activePortal === "manufacturer"
                ? "bg-white text-primary shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={activePortal === "manufacturer"}
          >
            <Factory className="h-3.5 w-3.5" />
            <span>Manufacturer</span>
          </button>
        </div>
      </div>

      {activePortal === "doctor" ? (
        <>
          <form className="space-y-4" onSubmit={handleDoctorSubmit} data-testid="doctor-login-form">
            <Field label="Email">
              <input
                type="email"
                className={inputCls}
                value={docEmail}
                onChange={(e) => setDocEmail(e.target.value)}
                placeholder="doctor@example.com"
                aria-label="Doctor Email"
              />
            </Field>
            <Field label="Password" error={docErr}>
              <input
                type="password"
                className={inputCls}
                value={docPw}
                onChange={(e) => setDocPw(e.target.value)}
                placeholder="••••••••"
                aria-label="Doctor Password"
              />
            </Field>
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Btn type="submit" className="w-full">
              Sign in
            </Btn>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to Mey Veda Grantha?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Register as a doctor
            </Link>
          </p>
        </>
      ) : activePortal === "admin" ? (
        <>
          <form className="space-y-4" onSubmit={handleAdminSubmit}>
            <Field label="Administrator Email">
              <input
                type="email"
                className={inputCls}
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@meyveda.com"
              />
            </Field>
            <Field label="Password" error={adminErr}>
              <input
                type="password"
                className={inputCls}
                value={adminPw}
                onChange={(e) => setAdminPw(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Btn className="w-full">Sign in as Administrator</Btn>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Demo Administrator Accounts
            </div>
            <div className="mt-3 space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleAdminDemoLogin(acc.email, acc.password)}
                  className="flex w-full items-center justify-between rounded-lg border border-border/80 bg-surface px-3 py-2 text-left text-xs transition-colors hover:border-primary/40 hover:bg-white"
                >
                  <div>
                    <span className="font-semibold text-foreground">{acc.name}</span>
                    <span className="ml-1.5 text-muted-foreground">({acc.role})</span>
                    <div className="font-mono text-[11px] text-muted-foreground">{acc.email}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <form className="space-y-4" onSubmit={handleMfgSubmit}>
            <Field label="Regulatory Business Email">
              <input
                type="email"
                className={inputCls}
                value={mfgEmail}
                onChange={(e) => setMfgEmail(e.target.value)}
                placeholder="regulatory@avnherbals.in"
              />
            </Field>
            <Field label="Password" error={mfgErr}>
              <input
                type="password"
                className={inputCls}
                value={mfgPw}
                onChange={(e) => setMfgPw(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Btn className="w-full">Sign in as Manufacturer</Btn>
          </form>

          {/* Quick Demo Manufacturer Account */}
          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Demo Manufacturer Account
            </div>
            <div className="mt-3 space-y-2">
              {DEMO_MANUFACTURERS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleMfgDemoLogin(acc.email, acc.password)}
                  className="flex w-full items-center justify-between rounded-lg border border-border/80 bg-surface px-3 py-2 text-left text-xs transition-colors hover:border-primary/40 hover:bg-white"
                >
                  <div>
                    <span className="font-semibold text-foreground">{acc.brandName}</span>
                    <span className="ml-1.5 text-muted-foreground">({acc.contactPerson})</span>
                    <div className="font-mono text-[11px] text-muted-foreground">{acc.email}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </AuthLayout>
  );
}
