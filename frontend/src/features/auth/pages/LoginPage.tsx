import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  ArrowLeft,
  Stethoscope,
  Shield,
  Factory,
} from "lucide-react";
import meyvedaLogo from "@/assets/meyvedalogo.png";
import { Mascot } from "@/components/ui/mascot";
import { toast } from "sonner";
import { setState } from "@/lib/store";
import { DEMO_ACCOUNTS } from "@/lib/admin-store";
import {
  DEMO_MANUFACTURERS,
  STORAGE_KEY_SESSION,
} from "@/features/manufacturer/manufacturer-context";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { apiClient } from "@/services/apiClient";

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
  head: () =>
    seo(
      "Doctor Sign In | Mey Veda Grantha",
      "Sign in to your Mey Veda Grantha workspace for classical Ayurveda knowledge, medicine intelligence, and clinical research.",
    ),
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
  const [showDocPw, setShowDocPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [docErr, setDocErr] = useState("");
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);

  // Admin state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPw, setAdminPw] = useState("");
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [adminErr, setAdminErr] = useState("");
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  // Manufacturer state
  const [mfgEmail, setMfgEmail] = useState("");
  const [mfgPw, setMfgPw] = useState("");
  const [showMfgPw, setShowMfgPw] = useState(false);
  const [mfgErr, setMfgErr] = useState("");
  const [isSubmittingMfg, setIsSubmittingMfg] = useState(false);

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
    setDocErr("");

    if (!docEmail.trim()) {
      setDocErr("Please enter your registered email address.");
      return;
    }
    if (!docPw) {
      setDocErr("Please enter your password.");
      return;
    }

    setIsSubmittingDoc(true);

    try {
      const res = await apiClient.post<{ access_token?: string; role?: string; user?: any }>(
        "/auth/login",
        {
          email: docEmail.trim().toLowerCase(),
          password: docPw,
        },
      );

      if (res?.access_token) {
        localStorage.setItem("meyveda_auth_token", res.access_token);
        localStorage.setItem("meyveda_user_role", res.role || "doctor");
      }

      setState(() => ({ signedIn: true }));
      toast.success("Welcome back! Signed in to Mey Veda Grantha.", { duration: 4000 });
      navigate({ to: "/workspace" });
    } catch (err: any) {
      const message =
        err?.message ||
        "Authentication failed. Please verify your email and password, or ensure your account is active.";
      setDocErr(message);
      toast.error(message);
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminErr("");

    if (!adminEmail.includes("@") || adminPw.length < 6) {
      return setAdminErr("Enter a valid email and a password of 6+ characters.");
    }

    setIsSubmittingAdmin(true);

    try {
      const res = await apiClient.post<{ access_token?: string; role?: string; user?: any }>(
        "/auth/login",
        {
          email: adminEmail.trim().toLowerCase(),
          password: adminPw,
        },
      );

      if (res?.access_token) {
        localStorage.setItem("meyveda_auth_token", res.access_token);
        localStorage.setItem("meyveda_user_role", res.role || "admin");
        const session = {
          name: "Platform Administrator",
          email: adminEmail.trim(),
          role: "Platform Administrator",
        };
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
    } finally {
      setIsSubmittingAdmin(false);
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
    setMfgErr("");

    if (!mfgEmail.includes("@") || mfgPw.length < 6) {
      return setMfgErr("Enter a valid business email and password.");
    }

    setIsSubmittingMfg(true);

    try {
      const res = await apiClient.post<{ access_token?: string; role?: string; user?: any }>(
        "/auth/login",
        {
          email: mfgEmail.trim().toLowerCase(),
          password: mfgPw,
        },
      );

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
    } finally {
      setIsSubmittingMfg(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#FAF9F6] text-[#111111] flex flex-col justify-between selection:bg-[#E67230]/20 selection:text-[#111111]">
      {/* Top Bar / Simple Navigation */}
      <header className="w-full border-b border-[#EBE7DF] bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex h-16 sm:h-20 max-w-[1320px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link
            to="/doctor"
            className="inline-flex items-center gap-2 group transition-opacity hover:opacity-90"
            aria-label="Back to Meyveda Home"
          >
            <img
              src={meyvedaLogo}
              alt="Meyveda Logo"
              width={1755}
              height={492}
              className="h-8 sm:h-9 lg:h-10 w-auto object-contain"
            />
          </Link>

          <Link
            to="/doctor"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#555555] hover:text-[#E67230] transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 my-4 sm:my-8">
        <div className="w-full max-w-[1080px] bg-white rounded-3xl border border-[#EBE7DF] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT SIDE: Interactive Doctor Mascot & Welcoming Presentation */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#FFFBF8] to-[#FAF9F6] border-b lg:border-b-0 lg:border-r border-[#EBE7DF] p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-between text-center relative overflow-hidden">
            {/* Ambient subtle glow */}
            <div
              className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(230, 114, 48, 0.12) 0%, rgba(250, 249, 246, 0) 70%)",
              }}
            />

            {/* Mascot Heading & Eyebrow */}
            <div className="relative z-10 w-full">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E67230]/10 text-xs font-bold text-[#E67230] mb-3">
                <ShieldCheck className="size-3.5" />
                <span>PRACTITIONER PORTAL</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#111111]">
                Namaste, Vaidya
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#666666] max-w-xs mx-auto leading-relaxed">
                Your classical knowledge, formulary access, and clinical notes in one serene space.
              </p>
            </div>

            {/* Interactive Cursor-Tracking Mascot */}
            <div className="relative z-10 my-4 sm:my-6 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center p-2 rounded-full bg-white shadow-xs border border-[#EBE7DF]/80">
                <Mascot
                  directions="/mascots/meyveda-doctor-directions.webp"
                  reactions="/mascots/meyveda-doctor-reactions.webp"
                  size={160}
                  label="Meyveda Ayurveda Doctor Mascot"
                  className="select-none"
                />
              </div>
              <p className="mt-2.5 font-mono text-[11px] text-[#888888]">
                Hover around · Click mascot to interact
              </p>
            </div>

            {/* Subtle Credibility Badges */}
            <div className="relative z-10 w-full pt-4 border-t border-[#EBE7DF]/60 flex items-center justify-center gap-4 text-xs text-[#555555]">
              <span className="font-semibold text-[#111111]">Verified AYUSH Doctor Platform</span>
              <span>·</span>
              <span>256-bit SSL</span>
            </div>
          </div>

          {/* RIGHT SIDE: Clean, Professional Login Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto">
              {/* Portal Selection Tabs */}
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-1.5">
                  <button
                    type="button"
                    onClick={() => switchPortal("doctor")}
                    className={cn(
                      "flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer",
                      activePortal === "doctor"
                        ? "bg-white text-[#E67230] shadow-sm font-bold border border-[#EBE7DF]"
                        : "text-[#666666] hover:text-[#111111]",
                    )}
                    aria-pressed={activePortal === "doctor"}
                  >
                    <Stethoscope className="size-3.5" />
                    <span>Doctor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchPortal("admin")}
                    className={cn(
                      "flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer",
                      activePortal === "admin"
                        ? "bg-white text-[#E67230] shadow-sm font-bold border border-[#EBE7DF]"
                        : "text-[#666666] hover:text-[#111111]",
                    )}
                    aria-pressed={activePortal === "admin"}
                  >
                    <Shield className="size-3.5" />
                    <span>Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchPortal("manufacturer")}
                    className={cn(
                      "flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer",
                      activePortal === "manufacturer"
                        ? "bg-white text-[#E67230] shadow-sm font-bold border border-[#EBE7DF]"
                        : "text-[#666666] hover:text-[#111111]",
                    )}
                    aria-pressed={activePortal === "manufacturer"}
                  >
                    <Factory className="size-3.5" />
                    <span>Manufacturer</span>
                  </button>
                </div>
              </div>

              {/* DOCTOR PORTAL TAB */}
              {activePortal === "doctor" && (
                <>
                  <div className="mb-6 sm:mb-8">
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E67230] mb-1">
                      MEY VEDA GRANTHA · SIGN IN
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
                      Welcome back
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-[#666666] leading-relaxed">
                      Sign in to your doctor workspace.
                    </p>
                  </div>

                  {/* Error Message if any */}
                  {docErr && (
                    <div
                      role="alert"
                      className="mb-5 rounded-lg border border-[#E67230]/40 bg-[#FFFBF8] p-3.5 text-xs sm:text-sm text-[#111111] leading-relaxed"
                    >
                      <span className="font-bold text-[#E67230]">Notice: </span>
                      {docErr}
                    </div>
                  )}

                  <form
                    onSubmit={handleDoctorSubmit}
                    data-testid="doctor-login-form"
                    className="space-y-4 sm:space-y-5"
                  >
                    {/* Email Field */}
                    <div>
                      <label
                        htmlFor="doctor-email"
                        className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5"
                      >
                        Email
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#888888]">
                          <Mail className="size-4" />
                        </div>
                        <input
                          id="doctor-email"
                          name="email"
                          type="email"
                          autoComplete="username"
                          aria-label="Doctor Email"
                          required
                          value={docEmail}
                          onChange={(e) => setDocEmail(e.target.value)}
                          placeholder="doctor@practice.com"
                          className="w-full rounded-md border border-[#EBE7DF] bg-[#FAF9F6]/40 pl-10 pr-4 py-2.5 sm:py-3 text-sm text-[#111111] placeholder:text-[#999999] focus:bg-white focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="doctor-password"
                          className="block text-xs sm:text-sm font-bold text-[#111111]"
                        >
                          Password
                        </label>
                        <Link
                          to="/forgot-password"
                          className="text-xs font-semibold text-[#E67230] hover:underline focus:outline-none"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#888888]">
                          <Lock className="size-4" />
                        </div>
                        <input
                          id="doctor-password"
                          name="password"
                          type={showDocPw ? "text" : "password"}
                          autoComplete="current-password"
                          required
                          value={docPw}
                          onChange={(e) => setDocPw(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full rounded-md border border-[#EBE7DF] bg-[#FAF9F6]/40 pl-10 pr-11 py-2.5 sm:py-3 text-sm text-[#111111] placeholder:text-[#999999] focus:bg-white focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDocPw(!showDocPw)}
                          aria-label={showDocPw ? "Hide password" : "Show password"}
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#888888] hover:text-[#111111] transition-colors focus:outline-none cursor-pointer"
                        >
                          {showDocPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Keep me signed in */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="size-4 rounded border-[#EBE7DF] text-[#E67230] focus:ring-[#E67230] accent-[#E67230]"
                        />
                        <span className="text-xs sm:text-sm text-[#555555]">Keep me signed in</span>
                      </label>
                    </div>

                    {/* Single Primary Sign In Button */}
                    <button
                      type="submit"
                      disabled={isSubmittingDoc}
                      className="w-full h-12 sm:h-13 rounded-md bg-[#E67230] hover:bg-[#D15F1F] text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_4px_16px_-4px_rgba(230,114,48,0.4)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#E67230] focus-visible:ring-offset-2 cursor-pointer"
                    >
                      {isSubmittingDoc ? (
                        <span>Authenticating with Backend...</span>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight className="size-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Registration Link Footer */}
                  <div className="mt-8 pt-6 border-t border-[#EBE7DF] text-center">
                    <p className="text-xs sm:text-sm text-[#555555]">
                      Don't have a doctor account yet?{" "}
                      <Link
                        to="/register"
                        className="font-bold text-[#E67230] hover:underline"
                      >
                        Register as Doctor
                      </Link>
                    </p>
                  </div>
                </>
              )}

              {/* ADMIN PORTAL TAB */}
              {activePortal === "admin" && (
                <>
                  <div className="mb-6 sm:mb-8">
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E67230] mb-1">
                      MEY VEDA GRANTHA · GOVERNANCE
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
                      Administrator Sign In
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-[#666666] leading-relaxed">
                      Access the Meyveda Grantha governance and administration console.
                    </p>
                  </div>

                  {adminErr && (
                    <div
                      role="alert"
                      className="mb-5 rounded-lg border border-[#E67230]/40 bg-[#FFFBF8] p-3.5 text-xs sm:text-sm text-[#111111] leading-relaxed"
                    >
                      <span className="font-bold text-[#E67230]">Notice: </span>
                      {adminErr}
                    </div>
                  )}

                  <form onSubmit={handleAdminSubmit} className="space-y-4 sm:space-y-5">
                    <div>
                      <label
                        htmlFor="admin-email"
                        className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5"
                      >
                        Administrator Email
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#888888]">
                          <Mail className="size-4" />
                        </div>
                        <input
                          id="admin-email"
                          type="email"
                          required
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          placeholder="admin@meyveda.com"
                          className="w-full rounded-md border border-[#EBE7DF] bg-[#FAF9F6]/40 pl-10 pr-4 py-2.5 sm:py-3 text-sm text-[#111111] placeholder:text-[#999999] focus:bg-white focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="admin-password"
                        className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#888888]">
                          <Lock className="size-4" />
                        </div>
                        <input
                          id="admin-password"
                          type={showAdminPw ? "text" : "password"}
                          required
                          value={adminPw}
                          onChange={(e) => setAdminPw(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full rounded-md border border-[#EBE7DF] bg-[#FAF9F6]/40 pl-10 pr-11 py-2.5 sm:py-3 text-sm text-[#111111] placeholder:text-[#999999] focus:bg-white focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPw(!showAdminPw)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#888888] hover:text-[#111111] cursor-pointer"
                        >
                          {showAdminPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingAdmin}
                      className="w-full h-12 rounded-md bg-[#E67230] hover:bg-[#D15F1F] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      {isSubmittingAdmin ? "Authenticating..." : "Sign In as Administrator"}
                    </button>
                  </form>

                  {/* Demo Accounts Card for test compliance */}
                  <div className="mt-6 rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4 text-xs">
                    <p className="font-bold text-[#111111] mb-2">Demo Administrator Accounts</p>
                    <div className="space-y-1.5">
                      {DEMO_ACCOUNTS.map((acc) => (
                        <div
                          key={acc.email}
                          className="flex items-center justify-between rounded-lg bg-white p-2 border border-[#EBE7DF]/80"
                        >
                          <div>
                            <span className="font-semibold text-[#111111]">{acc.name}</span>
                            <span className="text-[11px] text-[#666666] block">{acc.email}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAdminDemoLogin(acc.email, acc.password)}
                            className="rounded bg-[#E67230]/10 px-2.5 py-1 text-[11px] font-bold text-[#E67230] hover:bg-[#E67230]/20 transition-colors cursor-pointer"
                          >
                            Fill & Login
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* MANUFACTURER PORTAL TAB */}
              {activePortal === "manufacturer" && (
                <>
                  <div className="mb-6 sm:mb-8">
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E67230] mb-1">
                      MEY VEDA GRANTHA · INDUSTRY
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
                      Manufacturer Sign In
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-[#666666] leading-relaxed">
                      Access the Meyveda Grantha manufacturer regulatory and formulation portal.
                    </p>
                  </div>

                  {mfgErr && (
                    <div
                      role="alert"
                      className="mb-5 rounded-lg border border-[#E67230]/40 bg-[#FFFBF8] p-3.5 text-xs sm:text-sm text-[#111111] leading-relaxed"
                    >
                      <span className="font-bold text-[#E67230]">Notice: </span>
                      {mfgErr}
                    </div>
                  )}

                  <form onSubmit={handleMfgSubmit} className="space-y-4 sm:space-y-5">
                    <div>
                      <label
                        htmlFor="mfg-email"
                        className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5"
                      >
                        Business Email
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#888888]">
                          <Mail className="size-4" />
                        </div>
                        <input
                          id="mfg-email"
                          type="email"
                          required
                          value={mfgEmail}
                          onChange={(e) => setMfgEmail(e.target.value)}
                          placeholder="regulatory@avnherbals.com"
                          className="w-full rounded-md border border-[#EBE7DF] bg-[#FAF9F6]/40 pl-10 pr-4 py-2.5 sm:py-3 text-sm text-[#111111] placeholder:text-[#999999] focus:bg-white focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="mfg-password"
                        className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#888888]">
                          <Lock className="size-4" />
                        </div>
                        <input
                          id="mfg-password"
                          type={showMfgPw ? "text" : "password"}
                          required
                          value={mfgPw}
                          onChange={(e) => setMfgPw(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full rounded-md border border-[#EBE7DF] bg-[#FAF9F6]/40 pl-10 pr-11 py-2.5 sm:py-3 text-sm text-[#111111] placeholder:text-[#999999] focus:bg-white focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowMfgPw(!showMfgPw)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#888888] hover:text-[#111111] cursor-pointer"
                        >
                          {showMfgPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingMfg}
                      className="w-full h-12 rounded-md bg-[#E67230] hover:bg-[#D15F1F] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      {isSubmittingMfg ? "Authenticating..." : "Sign In as Manufacturer"}
                    </button>
                  </form>

                  {/* Demo Manufacturer Accounts for test compliance */}
                  <div className="mt-6 rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4 text-xs">
                    <p className="font-bold text-[#111111] mb-2">Preset Manufacturer Accounts</p>
                    <div className="space-y-1.5">
                      {DEMO_MANUFACTURERS.map((mfg) => (
                        <div
                          key={mfg.email}
                          className="flex items-center justify-between rounded-lg bg-white p-2 border border-[#EBE7DF]/80"
                        >
                          <div>
                            <span className="font-semibold text-[#111111]">{mfg.brandName}</span>
                            <span className="text-[11px] text-[#666666] block">{mfg.email}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleMfgDemoLogin(mfg.email, mfg.password)}
                            className="rounded bg-[#E67230]/10 px-2.5 py-1 text-[11px] font-bold text-[#E67230] hover:bg-[#E67230]/20 transition-colors cursor-pointer"
                          >
                            Fill & Login
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Copyright */}
      <footer className="w-full py-4 sm:py-6 text-center text-xs text-[#888888] border-t border-[#EBE7DF] bg-white">
        <p>© {new Date().getFullYear()} Meyveda Grantha. Built for Ayurveda physicians.</p>
      </footer>
    </main>
  );
}
