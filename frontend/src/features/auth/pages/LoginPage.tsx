import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, ArrowLeft, Home } from "lucide-react";
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
import { apiClient } from "@/services/apiClient";
import { setStoredToken } from "@/lib/api";

const ADMIN_SESSION_KEY = "meyveda-admin";

export const Route = createFileRoute("/login")({
  head: () =>
    seo(
      "Sign In | Meyveda",
      "Sign in to your Meyveda account. Access your Doctor Workspace, Administrator console, or Manufacturer portal.",
    ),
  component: Login,
});

export function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiClient.post<{
        access_token?: string;
        role?: string;
        user_id?: string;
        token_type?: string;
      }>("/auth/login", {
        email: cleanEmail,
        password,
      });

      const role = (res?.role || "doctor").toLowerCase();

      if (res?.access_token) {
        localStorage.setItem("meyveda_auth_token", res.access_token);
        localStorage.setItem("meyveda_user_role", role);
        setStoredToken(res.access_token);
      }

      // Automatically route according to account credentials/role
      if (role === "admin") {
        const session = {
          name: "Platform Administrator",
          email: cleanEmail,
          role: "Platform Administrator",
        };
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        toast.success("Administrator session verified. Redirecting to Admin Console...");
        navigate({ to: "/admin/home" });
        return;
      }

      if (role === "manufacturer") {
        const session = {
          brandName: "Registered Manufacturer",
          contactPerson: "Manufacturer Representative",
          email: cleanEmail,
          licenseNumber: "AYUSH/MFG/VERIFIED",
        };
        sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
        toast.success("Manufacturer session verified. Redirecting to Manufacturer Portal...");
        navigate({ to: "/manufacturer/overview" });
        return;
      }

      // Default: Doctor
      setState(() => ({ signedIn: true }));
      toast.success("Welcome back! Redirecting to Doctor Workspace...");
      navigate({ to: "/workspace" });
    } catch (err: any) {
      // Offline / fallback verification for local accounts if backend is unreachable
      const adminAcc = DEMO_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === cleanEmail && a.password === password,
      );
      if (adminAcc) {
        localStorage.setItem("meyveda_user_role", "admin");
        sessionStorage.setItem(
          ADMIN_SESSION_KEY,
          JSON.stringify({ name: adminAcc.name, email: adminAcc.email, role: adminAcc.role }),
        );
        toast.success("Administrator session verified. Redirecting to Admin Console...");
        navigate({ to: "/admin/home" });
        return;
      }

      const mfgAcc = DEMO_MANUFACTURERS.find(
        (m) => m.email.toLowerCase() === cleanEmail && m.password === password,
      );
      if (mfgAcc) {
        localStorage.setItem("meyveda_user_role", "manufacturer");
        sessionStorage.setItem(
          STORAGE_KEY_SESSION,
          JSON.stringify({
            brandName: mfgAcc.brandName,
            contactPerson: mfgAcc.contactPerson,
            email: mfgAcc.email,
            licenseNumber: mfgAcc.licenseNumber,
          }),
        );
        toast.success("Manufacturer session verified. Redirecting to Manufacturer Portal...");
        navigate({ to: "/manufacturer/overview" });
        return;
      }

      const message =
        err?.message ||
        "Authentication failed. Please verify your email and password, or ensure your account is active.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
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
            className="inline-flex items-center justify-center size-9 sm:size-10 rounded-full border border-[#EBE7DF] bg-white text-[#555555] hover:text-[#E67230] hover:border-[#E67230]/40 hover:bg-[#FAF9F6] transition-all shadow-2xs"
            title="Back to Home"
            aria-label="Back to Home"
          >
            <Home className="size-4 sm:size-5" />
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
                  label="Meyveda AYUSH Doctor Mascot"
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

          {/* RIGHT SIDE: Unified Intelligent Sign In Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto">
              <div className="mb-6 sm:mb-8">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E67230] mb-1">
                  MEYVEDA · SIGN IN
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
                  Welcome back
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-[#666666] leading-relaxed">
                  Sign in to access your Doctor Workspace, Administrator console, or Manufacturer portal.
                </p>
              </div>

              {/* Error Message if any */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-5 rounded-lg border border-[#E67230]/40 bg-[#FFFBF8] p-3.5 text-xs sm:text-sm text-[#111111] leading-relaxed"
                >
                  <span className="font-bold text-[#E67230]">Notice: </span>
                  {errorMessage}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                data-testid="doctor-login-form"
                className="space-y-4 sm:space-y-5"
              >
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#888888]">
                      <Mail className="size-4" />
                    </div>
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      aria-label="Doctor Email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@practice.com"
                      className="w-full rounded-md border border-[#EBE7DF] bg-[#FAF9F6]/40 pl-10 pr-4 py-2.5 sm:py-3 text-sm text-[#111111] placeholder:text-[#999999] focus:bg-white focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Password Field with Visibility Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
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
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-md border border-[#EBE7DF] bg-[#FAF9F6]/40 pl-10 pr-11 py-2.5 sm:py-3 text-sm text-[#111111] placeholder:text-[#999999] focus:bg-white focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#888888] hover:text-[#111111] transition-colors focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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
                  disabled={isSubmitting}
                  className="w-full h-12 sm:h-13 rounded-md bg-[#E67230] hover:bg-[#D15F1F] text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_4px_16px_-4px_rgba(230,114,48,0.4)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#E67230] focus-visible:ring-offset-2 cursor-pointer"
                >
                  {isSubmitting ? (
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
            </div>
          </div>
        </div>
      </div>

      {/* Footer Copyright */}
      <footer className="w-full py-4 sm:py-6 text-center text-xs text-[#888888] border-t border-[#EBE7DF] bg-white">
        <p>© {new Date().getFullYear()} meyveda. Built for <strong className="font-bold text-[#E65C24]">AYUSH</strong> physicians.</p>
      </footer>
    </main>
  );
}
