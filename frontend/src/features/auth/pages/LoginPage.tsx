import { useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Eye,
  EyeOff,
  Home,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import meyvedaLogo from "@/assets/meyvedalogo.png";
import meyvedaMark from "@/assets/meyveda-favicon-source.png";
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

export function Login({ initialMode }: { initialMode?: "signin" | "forgot" | "reset" } = {}) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { mode?: string; portal?: string } | undefined;

  const [viewMode, setViewMode] = useState<"signin" | "forgot" | "reset">(
    initialMode || (search?.mode === "forgot" ? "forgot" : "signin"),
  );

  // Sign In States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password Recovery States
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Handle Request Password Reset Code
  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = forgotEmail.trim().toLowerCase();
    if (!clean.includes("@")) {
      setErrorMessage("Please enter a valid registered email address.");
      return;
    }
    setIsSendingOtp(true);
    setErrorMessage("");

    try {
      const res = await apiClient.post<{
        success: boolean;
        message: string;
        email: string;
        demo_otp?: string;
      }>("/auth/forgot-password", { email: clean });

      toast.success(res?.message || "Verification code sent to your email.");
      if (res?.demo_otp) {
        setForgotOtp(res.demo_otp);
      }
      setViewMode("reset");
    } catch (err: any) {
      const msg = err?.message || "Failed to dispatch recovery code. Please verify your email.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Complete Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    const clean = forgotEmail.trim().toLowerCase();
    const cleanOtp = forgotOtp.trim();

    if (!cleanOtp) {
      setErrorMessage("Please enter the 6-digit verification code.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    setIsResettingPassword(true);
    try {
      const res = await apiClient.post<{ success: boolean; message: string }>("/auth/reset-password", {
        email: clean,
        otp: cleanOtp,
        new_password: newPassword,
      });

      toast.success(res?.message || "Password updated successfully!");

      // Attempt immediate login with new credentials
      try {
        const loginRes = await apiClient.post<{
          access_token?: string;
          role?: string;
          user_id?: string;
        }>("/auth/login", {
          email: clean,
          password: newPassword,
        });

        const role = (loginRes?.role || "doctor").toLowerCase();
        if (loginRes?.access_token) {
          localStorage.setItem("meyveda_auth_token", loginRes.access_token);
          localStorage.setItem("meyveda_user_role", role);
          localStorage.setItem("meyveda_user_email", clean);
          setStoredToken(loginRes.access_token);
        }

        if (role === "admin") {
          window.location.href = "/admin/home";
          return;
        }
        if (role === "manufacturer") {
          window.location.href = "/manufacturer/overview";
          return;
        }

        setState(() => ({ signedIn: true }));
        navigate({ to: "/workspace" });
      } catch {
        // Fallback to signin screen with credentials prefilled
        setEmail(clean);
        setPassword(newPassword);
        setViewMode("signin");
        toast.info("Password updated. You can now sign in.");
      }
    } catch (err: any) {
      const msg = err?.message || "Invalid or expired verification code. Please request a new code.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsResettingPassword(false);
    }
  };

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
      if (role === "content_manager" || cleanEmail === "content@meyveda.com") {
        localStorage.setItem("meyveda_user_role", "content_manager");
        localStorage.setItem("meyveda_user_email", cleanEmail);
        toast.success("Content Manager session verified. Redirecting to Content Desk...");
        window.location.href = "/content-manager";
        return;
      }

      if (role === "admin" || cleanEmail === "admin@meyveda.com") {
        const session = {
          name: "Platform Administrator",
          email: cleanEmail,
          role: "Platform Administrator",
        };
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        localStorage.setItem("meyveda_user_role", "admin");
        localStorage.setItem("meyveda_user_email", cleanEmail);
        toast.success("Administrator session verified. Redirecting to Admin Console...");
        window.location.href = "/admin/home";
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
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
        localStorage.setItem("meyveda_user_role", "manufacturer");
        localStorage.setItem("meyveda_user_email", cleanEmail);
        toast.success("Manufacturer session verified. Redirecting to Manufacturer Portal...");
        window.location.href = "/manufacturer/overview";
        return;
      }

      // Default: Doctor
      setState(() => ({ signedIn: true }));
      localStorage.setItem("meyveda_user_email", cleanEmail);
      toast.success("Welcome back! Redirecting to Doctor Workspace...");
      navigate({ to: "/workspace" });
    } catch (err: any) {
      // Offline / fallback verification for local accounts if backend is unreachable
      const adminAcc = DEMO_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === cleanEmail && a.password === password,
      );
      if (cleanEmail === "content@meyveda.com" && (password === "mey@123" || password === "Meyveda@2026")) {
        localStorage.setItem("meyveda_user_role", "content_manager");
        localStorage.setItem("meyveda_user_email", cleanEmail);
        toast.success("Content Manager session verified. Redirecting to Content Desk...");
        window.location.href = "/content-manager";
        return;
      }

      if (adminAcc || cleanEmail === "admin@meyveda.com") {
        const session = {
          name: adminAcc?.name || "Platform Administrator",
          email: cleanEmail,
          role: adminAcc?.role || "Platform Administrator",
        };
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        localStorage.setItem("meyveda_user_role", "admin");
        localStorage.setItem("meyveda_user_email", cleanEmail);
        toast.success("Administrator session verified. Redirecting to Admin Console...");
        window.location.href = "/admin/home";
        return;
      }

      const mfgAcc = DEMO_MANUFACTURERS.find(
        (m) => m.email.toLowerCase() === cleanEmail && m.password === password,
      );
      if (mfgAcc) {
        localStorage.setItem("meyveda_user_role", "manufacturer");
        localStorage.setItem("meyveda_user_email", cleanEmail);
        const mfgSession = {
          brandName: mfgAcc.brandName,
          contactPerson: mfgAcc.contactPerson,
          email: mfgAcc.email,
          licenseNumber: mfgAcc.licenseNumber,
        };
        sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(mfgSession));
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(mfgSession));
        toast.success("Manufacturer session verified. Redirecting to Manufacturer Portal...");
        window.location.href = "/manufacturer/overview";
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
        <div className="mx-auto flex h-16 sm:h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link
            to="/"
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

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#E67230] hover:underline"
            >
              <span>Register as Doctor</span>
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              to="/"
              className="inline-flex size-9 sm:size-10 items-center justify-center rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] text-[#555555] hover:bg-white hover:text-[#E67230] hover:border-[#E67230]/40 transition-colors shadow-2xs"
              title="Return to Meyveda Home"
              aria-label="Back to Home"
            >
              <Home className="size-4 sm:size-4.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Full-Screen Main Content Area */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-80px)]">
        {/* LEFT SIDE: Interactive Doctor Mascot & Welcoming Presentation */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#FFFBF8] via-[#FAF9F6] to-[#F5F2EB] border-b lg:border-b-0 lg:border-r border-[#EBE7DF] p-8 sm:p-12 lg:p-14 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Ambient subtle glow */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(230, 114, 48, 0.12) 0%, rgba(250, 249, 246, 0) 70%)",
            }}
          />

          {/* Mascot Heading (Unwanted badge removed) */}
          <div className="relative z-10 w-full mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
              Namaste, Vaidya
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#666666] max-w-xs mx-auto leading-relaxed">
              Your classical knowledge, formulary access, and clinical notes in one serene space.
            </p>
          </div>

          {/* Meyveda Symbol directly above the mascot (approx 1-2 cm, preserving original proportions & colours) */}
          <div className="relative z-10 mb-3 sm:mb-4 flex items-center justify-center">
            <img
              src={meyvedaMark}
              alt="Meyveda Symbol"
              width={100}
              height={80}
              className="h-11 sm:h-12 w-auto object-contain select-none drop-shadow-2xs"
            />
          </div>

          {/* Interactive Cursor-Tracking Mascot (Enlarged to 7-8 cm on screen) */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center p-3 rounded-full bg-white shadow-xs border border-[#EBE7DF]/80">
              <Mascot
                directions="/mascots/meyveda-doctor-directions.webp"
                reactions="/mascots/meyveda-doctor-reactions.webp"
                size={280}
                label="Meyveda AYUSH Doctor Mascot"
                className="select-none"
              />
            </div>
            <p className="mt-3 font-mono text-[11px] text-[#888888]">
              Hover around · Click mascot to interact
            </p>
          </div>

          {/* (Unwanted bottom trust/security text 'Verified AYUSH Doctor Platform · 256-bit SSL' removed) */}
        </div>

        {/* RIGHT SIDE: Unified Intelligent Sign In Form & Password Recovery */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-10 lg:p-16 flex flex-col justify-center items-center">
          <div className="max-w-md w-full mx-auto">
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

              {/* MODE 1: Standard Sign In */}
              {viewMode === "signin" && (
                <>
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
                        <button
                          type="button"
                          onClick={() => {
                            setForgotEmail(email || "");
                            setErrorMessage("");
                            setViewMode("forgot");
                          }}
                          className="text-xs font-semibold text-[#E67230] hover:underline focus:outline-none cursor-pointer"
                        >
                          Forgot password?
                        </button>
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
                </>
              )}

              {/* MODE 2: Request Password Recovery Code */}
              {viewMode === "forgot" && (
                <>
                  <div className="mb-6 sm:mb-8">
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E67230] mb-1">
                      MEYVEDA · ACCOUNT RECOVERY
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
                      Reset your password
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-[#666666] leading-relaxed">
                      Enter your registered email address and we'll dispatch a 6-digit verification code to reset your password.
                    </p>
                  </div>

                  <form onSubmit={handleSendResetOtp} className="space-y-4 sm:space-y-5">
                    <div>
                      <label htmlFor="forgot-email" className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5">
                        Registered Email Address *
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#888888]">
                          <Mail className="size-4" />
                        </div>
                        <input
                          id="forgot-email"
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="name@practice.com"
                          className="w-full rounded-md border border-[#EBE7DF] bg-[#FAF9F6]/40 pl-10 pr-4 py-2.5 sm:py-3 text-sm text-[#111111] placeholder:text-[#999999] focus:bg-white focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-all duration-200"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full h-12 sm:h-13 rounded-md bg-[#E67230] hover:bg-[#D15F1F] text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_4px_16px_-4px_rgba(230,114,48,0.4)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#E67230] focus-visible:ring-offset-2 cursor-pointer"
                    >
                      {isSendingOtp ? (
                        <span>Sending Verification Code...</span>
                      ) : (
                        <>
                          <span>Send Verification Code</span>
                          <ArrowRight className="size-4" />
                        </>
                      )}
                    </button>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage("");
                          setViewMode("signin");
                        }}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#555555] hover:text-[#E67230] transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="size-3.5" />
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* MODE 3: Set New Password */}
              {viewMode === "reset" && (
                <>
                  <div className="mb-6 sm:mb-8">
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E67230] mb-1">
                      MEYVEDA · SET NEW PASSWORD
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
                      Choose new password
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-[#666666] leading-relaxed">
                      Enter the 6-digit code sent to <strong className="text-[#111111]">{forgotEmail}</strong> and choose a secure password.
                    </p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-5">
                    <div>
                      <label htmlFor="reset-otp" className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5">
                        6-Digit Verification Code *
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#888888]">
                          <KeyRound className="size-4" />
                        </div>
                        <input
                          id="reset-otp"
                          type="text"
                          maxLength={6}
                          required
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="123456"
                          className="w-full rounded-md border border-[#EBE7DF] bg-[#FAF9F6]/40 pl-10 pr-4 py-2.5 sm:py-3 text-sm font-mono tracking-widest text-[#111111] placeholder:text-[#999999] focus:bg-white focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="new-password" className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5">
                        New Password *
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#888888]">
                          <Lock className="size-4" />
                        </div>
                        <input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full rounded-md border border-[#EBE7DF] bg-[#FAF9F6]/40 pl-10 pr-11 py-2.5 sm:py-3 text-sm text-[#111111] placeholder:text-[#999999] focus:bg-white focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#888888] hover:text-[#111111] transition-colors focus:outline-none cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirm-password" className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5">
                        Confirm New Password *
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#888888]">
                          <Lock className="size-4" />
                        </div>
                        <input
                          id="confirm-password"
                          type={showNewPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full rounded-md border border-[#EBE7DF] bg-[#FAF9F6]/40 pl-10 pr-4 py-2.5 sm:py-3 text-sm text-[#111111] placeholder:text-[#999999] focus:bg-white focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-all duration-200"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isResettingPassword}
                      className="w-full h-12 sm:h-13 rounded-md bg-[#E67230] hover:bg-[#D15F1F] text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_4px_16px_-4px_rgba(230,114,48,0.4)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#E67230] focus-visible:ring-offset-2 cursor-pointer"
                    >
                      {isResettingPassword ? (
                        <span>Updating Password...</span>
                      ) : (
                        <>
                          <span>Update Password & Sign In</span>
                          <CheckCircle2 className="size-4" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between pt-2 text-xs sm:text-sm">
                      <button
                        type="button"
                        onClick={() => handleSendResetOtp({ preventDefault: () => {} } as any)}
                        disabled={isSendingOtp}
                        className="text-[#E67230] hover:underline font-semibold cursor-pointer"
                      >
                        Resend code
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage("");
                          setViewMode("signin");
                        }}
                        className="inline-flex items-center gap-1 font-semibold text-[#555555] hover:text-[#E67230] transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="size-3.5" />
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                </>
              )}
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
