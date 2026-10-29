import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  User,
  Lock,
  RotateCcw,
  ShieldCheck,
  Eye,
  EyeOff,
  Clock,
  AlertCircle,
  Gift,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import meyvedaLogo from "@/assets/meyvedalogo.png";
import { Mascot } from "@/components/ui/mascot";
import { setState } from "@/lib/store";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { apiClient } from "@/services/apiClient";
import { setStoredToken, setStoredUser } from "@/lib/api";

export const Route = createFileRoute("/register")({
  head: () =>
    seo(
      "Register as a Verified Doctor | Mey Veda Grantha",
      "Official registration for AYUSH doctors (BAMS, BSMS, BNYS, BHMS, BUMS). Access classical monographs, clinical pharmacovigilance, and research intelligence.",
    ),
  component: Register,
});

export const AYUSH_QUALIFICATIONS = [
  { code: "BAMS", label: "BAMS — Ayurveda" },
  { code: "BSMS", label: "BSMS — Siddha" },
  { code: "BNYS", label: "BNYS — Naturopathy & Yoga" },
  { code: "BHMS", label: "BHMS — Homoeopathy" },
  { code: "BUMS", label: "BUMS — Unani" },
] as const;

export function Register() {
  const navigate = useNavigate();

  // 1. Full Name
  const [fullName, setFullName] = useState("");

  // 2. Qualification
  const [qualification, setQualification] = useState("BAMS");

  // 3. City
  const [city, setCity] = useState("");

  // 4. PIN Code
  const [pincode, setPincode] = useState("");

  // 5. Doctor Registration Number
  const [doctorRegNumber, setDoctorRegNumber] = useState("");

  // 6. Email + OTP Verification
  const [email, setEmail] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpInput, setEmailOtpInput] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [emailToken, setEmailToken] = useState<string | null>(null);

  // 7. Mobile + OTP Verification
  const [mobile, setMobile] = useState("");
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpInput, setMobileOtpInput] = useState("");
  const [mobileVerified, setMobileVerified] = useState(false);
  const [mobileSending, setMobileSending] = useState(false);
  const [mobileVerifying, setMobileVerifying] = useState(false);
  const [mobileCooldown, setMobileCooldown] = useState(0);
  const [mobileToken, setMobileToken] = useState<string | null>(null);

  // 8. Password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 9. Invite / Referral Code
  const [inviteCode, setInviteCode] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return (params.get("ref") || params.get("invite") || "").toUpperCase().slice(0, 5);
    }
    return "";
  });
  const [inviteValidating, setInviteValidating] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{
    checked: boolean;
    valid: boolean;
    doctorName?: string | null;
    message?: string;
  }>({ checked: false, valid: false });

  // Submission & Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cooldown timers
  useEffect(() => {
    if (emailCooldown <= 0) return;
    const interval = setInterval(() => {
      setEmailCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [emailCooldown]);

  useEffect(() => {
    if (mobileCooldown <= 0) return;
    const interval = setInterval(() => {
      setMobileCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [mobileCooldown]);

  // Auto-validate invite code if passed via URL parameter
  useEffect(() => {
    if (inviteCode && inviteCode.length === 5) {
      handleValidateInvite(inviteCode);
    }
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                         EMAIL OTP HANDLERS                               */
  /* ------------------------------------------------------------------------ */
  const handleSendEmailOtp = async () => {
    if (!email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    setErrorMessage(null);
    setEmailSending(true);

    try {
      const res = await apiClient.post<{
        success: boolean;
        message: string;
        target: string;
        demo_otp?: string | null;
        expires_in?: number;
      }>("/auth/send-email-otp", {
        email: email.trim().toLowerCase(),
      });

      setEmailOtpSent(true);
      setEmailCooldown(60);
      toast.success(res.message || `Verification code sent to ${email}`, {
        description: "Valid for 5 minutes. Please check your inbox and spam folder.",
      });
    } catch (err: any) {
      const msg = err?.message || "Failed to dispatch email verification code.";
      toast.error(msg);
      setErrorMessage(msg);
      const match = msg.match(/wait (\d+) seconds/i);
      if (match && match[1]) {
        setEmailCooldown(parseInt(match[1], 10));
      }
    } finally {
      setEmailSending(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    const cleanCode = emailOtpInput.trim();
    if (!cleanCode || cleanCode.length < 6) {
      toast.error("Please enter the complete 6-digit email verification code.");
      return;
    }
    setEmailVerifying(true);

    try {
      const res = await apiClient.post<{
        success: boolean;
        verified: boolean;
        message: string;
        verification_token?: string | null;
      }>("/auth/verify-email-otp", {
        email: email.trim().toLowerCase(),
        otp: cleanCode,
      });

      if (res.verified) {
        setEmailVerified(true);
        setEmailOtpSent(false);
        if (res.verification_token) {
          setEmailToken(res.verification_token);
        }
        setErrorMessage(null);
        toast.success("Email address verified successfully!");
      } else {
        toast.error(res.message || "Invalid verification code.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Invalid or expired email verification code.");
    } finally {
      setEmailVerifying(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                        MOBILE OTP HANDLERS                               */
  /* ------------------------------------------------------------------------ */
  const handleSendMobileOtp = async () => {
    const cleaned = mobile.replace(/\D/g, "");
    if (cleaned.length < 10) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    const finalMobile = cleaned.slice(-10);
    setErrorMessage(null);
    setMobileSending(true);

    try {
      const res = await apiClient.post<{
        success: boolean;
        message: string;
        target: string;
        demo_otp?: string | null;
        expires_in?: number;
      }>("/auth/send-sms-otp", {
        mobile: finalMobile,
      });

      setMobileOtpSent(true);
      setMobileCooldown(60);
      toast.success(res.message || `SMS verification code sent to +91 ${finalMobile}`, {
        description: "Valid for 5 minutes.",
      });
    } catch (err: any) {
      const msg = err?.message || "Failed to dispatch SMS verification code.";
      toast.error(msg);
      setErrorMessage(msg);
      const match = msg.match(/wait (\d+) seconds/i);
      if (match && match[1]) {
        setMobileCooldown(parseInt(match[1], 10));
      }
    } finally {
      setMobileSending(false);
    }
  };

  const handleVerifyMobileOtp = async () => {
    const cleanCode = mobileOtpInput.trim();
    if (!cleanCode || cleanCode.length < 6) {
      toast.error("Please enter the complete 6-digit SMS verification code.");
      return;
    }
    setMobileVerifying(true);

    try {
      const cleaned = mobile.replace(/\D/g, "").slice(-10);
      const res = await apiClient.post<{
        success: boolean;
        verified: boolean;
        message: string;
        verification_token?: string | null;
      }>("/auth/verify-sms-otp", {
        mobile: cleaned,
        otp: cleanCode,
      });

      if (res.verified) {
        setMobileVerified(true);
        setMobileOtpSent(false);
        if (res.verification_token) {
          setMobileToken(res.verification_token);
        }
        setErrorMessage(null);
        toast.success("Mobile phone verified successfully!");
      } else {
        toast.error(res.message || "Invalid SMS verification code.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Invalid or expired SMS verification code.");
    } finally {
      setMobileVerifying(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                        INVITE CODE VALIDATION                            */
  /* ------------------------------------------------------------------------ */
  const handleValidateInvite = async (codeToVerify: string) => {
    const clean = codeToVerify.trim().toUpperCase();
    if (!clean) {
      setInviteStatus({ checked: false, valid: false });
      return;
    }
    if (clean.length < 5) {
      setInviteStatus({
        checked: true,
        valid: false,
        message: "Invite code must be 5 characters (3 letters + 2 numbers, e.g. MSV77)",
      });
      return;
    }

    setInviteValidating(true);
    try {
      const res = await apiClient.get<{
        valid: boolean;
        invite_code: string;
        doctor_name?: string | null;
        message: string;
      }>(`/auth/validate-invite/${clean}`);

      if (res.valid) {
        setInviteStatus({
          checked: true,
          valid: true,
          doctorName: res.doctor_name,
          message: res.message,
        });
        toast.success(`Invite code verified! Referred by ${res.doctor_name}`);
      } else {
        setInviteStatus({
          checked: true,
          valid: false,
          doctorName: null,
          message: res.message || "Invalid invite code",
        });
        toast.error(res.message || "Invalid invite code");
      }
    } catch {
      setInviteStatus({
        checked: true,
        valid: false,
        doctorName: null,
        message: "Unable to verify invite code with backend",
      });
    } finally {
      setInviteValidating(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                     SUBMIT DOCTOR REGISTRATION                           */
  /* ------------------------------------------------------------------------ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 3) {
      setErrorMessage("Doctor Full Name is required (minimum 3 characters).");
      return;
    }

    if (!qualification) {
      setErrorMessage("Please select your AYUSH medical degree (BAMS, BSMS, BNYS, BHMS, BUMS).");
      return;
    }

    const cleanPin = pincode.trim();
    if (!cleanPin || !/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setErrorMessage("Please enter a valid 6-digit Indian PIN code.");
      return;
    }

    const cleanReg = doctorRegNumber.trim();
    if (!cleanReg) {
      setErrorMessage("Doctor Registration Number is required (e.g. State Council / NCISM).");
      return;
    }

    if (!emailVerified) {
      setErrorMessage("Please verify your Email Address using the OTP code.");
      return;
    }

    const cleanedMobile = mobile.replace(/\D/g, "").slice(-10);
    if (!mobileVerified) {
      setErrorMessage("Please verify your Mobile Number using the SMS code.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const formattedName = cleanName.startsWith("Dr.") ? cleanName : `Dr. ${cleanName}`;
    const systemName =
      qualification === "BSMS"
        ? "Siddha"
        : qualification === "BNYS"
          ? "Naturopathy & Yoga"
          : qualification === "BHMS"
            ? "Homoeopathy"
            : qualification === "BUMS"
              ? "Unani"
              : "Ayurveda";

    try {
      const regResponse = await apiClient.post<{
        id: string;
        email: string;
        role: string;
        status: string;
        message: string;
        access_token?: string | null;
        token_type?: string;
      }>("/auth/register", {
        email: email.trim().toLowerCase(),
        password,
        role: "doctor",
        full_name: formattedName,
        full_name_or_company: formattedName,
        doctor_register_number: cleanReg,
        medical_license_or_contact_name: cleanReg,
        qualification,
        specialty_or_contact_email: `${systemName} Practice`,
        pincode: cleanPin,
        mobile: `+91 ${cleanedMobile}`,
        phone: cleanedMobile,
        verification_token: emailToken || undefined,
        invite_code: inviteCode.trim().toUpperCase() || undefined,
      });

      if (regResponse?.access_token) {
        localStorage.setItem("meyveda_auth_token", regResponse.access_token);
        localStorage.setItem("meyveda_user_role", "doctor");
        setStoredToken(regResponse.access_token);
      }

      setState((s) => ({
        signedIn: true,
        doctor: {
          ...s.doctor,
          id: regResponse.id,
          name: formattedName,
          registrationNo: cleanReg,
          email: email.trim().toLowerCase(),
          mobile: `+91 ${cleanedMobile}`,
          qualification,
          specialty: `${systemName} Practice`,
          institution: `AYUSH Medical Council (PIN: ${cleanPin})`,
          system: systemName,
          verification: "Pending Verification",
          initials: formattedName
            .replace("Dr. ", "")
            .trim()
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        },
      }));

      setStoredUser({
        id: regResponse.id,
        email: regResponse.email,
        role: regResponse.role,
        status: regResponse.status,
        doctor_profile: {
          id: regResponse.id,
          full_name: formattedName,
          medical_license_number: cleanReg,
          specialty: `${systemName} Practice`,
          verification_status: "pending",
        },
      });

      toast.success(`Welcome to Mey Veda, ${formattedName}!`, {
        description: "Your verified doctor account has been successfully created.",
        duration: 5000,
      });

      navigate({ to: "/workspace" });
    } catch (err: any) {
      const msg = err?.message || "Registration failed. Please check your credentials and retry.";
      setErrorMessage(msg);
      toast.error(msg);
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

          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              to="/doctor"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#555555] hover:text-[#E67230] transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span>Back to Home</span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#E67230] hover:underline"
            >
              <span>Sign In</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 my-4 sm:my-8">
        <div className="w-full max-w-[1080px] bg-white rounded-3xl border border-[#EBE7DF] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT SIDE: Interactive Doctor Mascot & Registration Presentation */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#FFFBF8] to-[#FAF9F6] border-b lg:border-b-0 lg:border-r border-[#EBE7DF] p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-between text-center relative overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(230, 114, 48, 0.12) 0%, rgba(250, 249, 246, 0) 70%)",
              }}
            />

            <div className="relative z-10 w-full">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E67230]/10 text-xs font-bold text-[#E67230] mb-3">
                <ShieldCheck className="size-3.5" />
                <span>DOCTOR ONBOARDING</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#111111]">
                Register as an Ayurveda Doctor
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#666666] max-w-xs mx-auto leading-relaxed">
                Join fellow Ayurvedic physicians. Access classical literature, commercial medicine
                intelligence, batch quality evidence, and your private research library.
              </p>
            </div>

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

            <div className="relative z-10 w-full pt-4 border-t border-[#EBE7DF]/60 flex items-center justify-center gap-4 text-xs text-[#555555]">
              <span className="font-semibold text-[#111111]">Verified AYUSH Doctor Platform</span>
              <span>·</span>
              <span>256-bit SSL</span>
            </div>
          </div>

          {/* RIGHT SIDE: Clean, Professional Registration Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto">
              <div className="mb-6 sm:mb-8">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E67230] mb-1">
                  MEY VEDA GRANTHA · REGISTRATION
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
                  Register as a Doctor
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-[#666666] leading-relaxed">
                  Join the verified AYUSH doctor network and access your clinical research desk.
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

              <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
                {/* 1. Full Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#888888]">
                      <User className="size-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Dr. Ramesh Vaidya"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-md border border-[#EBE7DF] bg-white pl-10 pr-4 py-2.5 sm:py-3 text-sm text-[#111111] placeholder:text-[#999999] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* 2. Qualification & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5">
                      Qualification *
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#888888]">
                        <GraduationCap className="size-4" />
                      </div>
                      <select
                        required
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        className="w-full rounded-md border border-[#EBE7DF] bg-white pl-10 pr-4 py-2.5 sm:py-3 text-sm text-[#111111] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors cursor-pointer"
                      >
                        {AYUSH_QUALIFICATIONS.map((q) => (
                          <option key={q.code} value={q.code}>
                            {q.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="Pune / Mumbai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-md border border-[#EBE7DF] bg-white px-3.5 py-2.5 sm:py-3 text-sm text-[#111111] placeholder:text-[#999999] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* 3. PIN Code & Doctor Registration Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5">
                      PIN Code *
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#888888]">
                        <MapPin className="size-4" />
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        pattern="[0-9]{6}"
                        inputMode="numeric"
                        placeholder="411001"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full rounded-md border border-[#EBE7DF] bg-white pl-10 pr-4 py-2.5 sm:py-3 text-sm font-mono text-[#111111] placeholder:text-[#999999] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5">
                      Registration Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="AYUSH-REG-12345"
                      value={doctorRegNumber}
                      onChange={(e) => setDoctorRegNumber(e.target.value)}
                      className="w-full rounded-md border border-[#EBE7DF] bg-white px-3.5 py-2.5 sm:py-3 text-sm uppercase font-mono text-[#111111] placeholder:text-[#999999] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* 4. Email Address & OTP */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-[#111111]">
                      Email Address *
                    </label>
                    {emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="size-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#E67230] font-medium">
                        OTP verification required
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#888888]">
                        <Mail className="size-4" />
                      </div>
                      <input
                        type="email"
                        required
                        disabled={emailVerified}
                        placeholder="doctor@practice.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailVerified) {
                            setEmailVerified(false);
                            setEmailToken(null);
                          }
                        }}
                        className="w-full rounded-md border border-[#EBE7DF] bg-white pl-10 pr-4 py-2.5 sm:py-3 text-sm text-[#111111] placeholder:text-[#999999] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors disabled:bg-[#FAF9F6] disabled:text-[#777777]"
                      />
                    </div>
                    {!emailVerified && (
                      <button
                        type="button"
                        disabled={emailSending || !email.includes("@") || emailCooldown > 0}
                        onClick={handleSendEmailOtp}
                        className="px-4 py-2.5 sm:py-3 rounded-md bg-[#E67230] hover:bg-[#D15F1F] text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer shadow-xs"
                      >
                        {emailSending ? (
                          "Sending..."
                        ) : emailCooldown > 0 ? (
                          <span className="flex items-center gap-1">
                            <Clock className="size-3.5" /> {emailCooldown}s
                          </span>
                        ) : emailOtpSent ? (
                          "Resend OTP"
                        ) : (
                          "Send OTP"
                        )}
                      </button>
                    )}
                    {emailVerified && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmailVerified(false);
                          setEmailOtpSent(false);
                          setEmailOtpInput("");
                          setEmailToken(null);
                        }}
                        className="px-3 py-2.5 text-xs text-[#888888] hover:text-[#111111] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Change email"
                      >
                        <RotateCcw className="size-3.5" /> Change
                      </button>
                    )}
                  </div>

                  {/* Email OTP Verification Input */}
                  {emailOtpSent && !emailVerified && (
                    <div className="mt-2.5 p-3 rounded-md bg-[#FFFBF8] border border-[#E67230]/30 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#E67230] flex items-center gap-1">
                          <ShieldCheck className="size-3.5" /> Enter 6-Digit Email OTP
                        </span>
                        <span className="text-[11px] text-[#777777]">Valid for 5 minutes</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          inputMode="numeric"
                          placeholder="••••••"
                          value={emailOtpInput}
                          onChange={(e) => setEmailOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="flex-1 rounded-md border border-[#EBE7DF] bg-white px-3.5 py-2 text-sm text-center font-mono font-bold tracking-widest text-[#111111] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={emailVerifying || emailOtpInput.trim().length < 6}
                          onClick={handleVerifyEmailOtp}
                          className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {emailVerifying ? "Verifying..." : "Verify OTP"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Mobile Number & SMS OTP */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-[#111111]">
                      Mobile Number *
                    </label>
                    {mobileVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="size-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#E67230] font-medium">
                        SMS OTP required
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-bold text-[#888888]">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        disabled={mobileVerified}
                        placeholder="98765 43210"
                        value={mobile}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setMobile(val);
                          if (mobileVerified) {
                            setMobileVerified(false);
                            setMobileToken(null);
                          }
                        }}
                        className="w-full rounded-md border border-[#EBE7DF] bg-white pl-12 pr-4 py-2.5 sm:py-3 text-sm font-mono text-[#111111] placeholder:text-[#999999] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors disabled:bg-[#FAF9F6] disabled:text-[#777777]"
                      />
                    </div>
                    {!mobileVerified && (
                      <button
                        type="button"
                        disabled={mobileSending || mobile.replace(/\D/g, "").length < 10 || mobileCooldown > 0}
                        onClick={handleSendMobileOtp}
                        className="px-4 py-2.5 sm:py-3 rounded-md bg-[#E67230] hover:bg-[#D15F1F] text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer shadow-xs"
                      >
                        {mobileSending ? (
                          "Sending..."
                        ) : mobileCooldown > 0 ? (
                          <span className="flex items-center gap-1">
                            <Clock className="size-3.5" /> {mobileCooldown}s
                          </span>
                        ) : mobileOtpSent ? (
                          "Resend SMS"
                        ) : (
                          "Send OTP"
                        )}
                      </button>
                    )}
                    {mobileVerified && (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileVerified(false);
                          setMobileOtpSent(false);
                          setMobileOtpInput("");
                          setMobileToken(null);
                        }}
                        className="px-3 py-2.5 text-xs text-[#888888] hover:text-[#111111] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Change mobile"
                      >
                        <RotateCcw className="size-3.5" /> Change
                      </button>
                    )}
                  </div>

                  {/* Mobile OTP Verification Input */}
                  {mobileOtpSent && !mobileVerified && (
                    <div className="mt-2.5 p-3 rounded-md bg-[#FFFBF8] border border-[#E67230]/30 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#E67230] flex items-center gap-1">
                          <ShieldCheck className="size-3.5" /> Enter 6-Digit SMS OTP
                        </span>
                        <span className="text-[11px] text-[#777777]">Valid for 5 minutes</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          inputMode="numeric"
                          placeholder="••••••"
                          value={mobileOtpInput}
                          onChange={(e) => setMobileOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="flex-1 rounded-md border border-[#EBE7DF] bg-white px-3.5 py-2 text-sm text-center font-mono font-bold tracking-widest text-[#111111] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={mobileVerifying || mobileOtpInput.trim().length < 6}
                          onClick={handleVerifyMobileOtp}
                          className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {mobileVerifying ? "Verifying..." : "Verify OTP"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#888888]">
                        <Lock className="size-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-md border border-[#EBE7DF] bg-white pl-10 pr-10 py-2.5 sm:py-3 text-sm text-[#111111] placeholder:text-[#999999] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#888888] hover:text-[#111111] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#111111] mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#888888]">
                        <Lock className="size-4" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-md border border-[#EBE7DF] bg-white pl-10 pr-10 py-2.5 sm:py-3 text-sm text-[#111111] placeholder:text-[#999999] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#888888] hover:text-[#111111] cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 7. Invite / Referral Code */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-[#111111]">
                      Invite / Referral Code <span className="font-normal text-[#777777]">(Optional)</span>
                    </label>
                    {inviteStatus.checked && inviteStatus.valid ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="size-3" /> Valid Invite
                      </span>
                    ) : inviteStatus.checked && !inviteStatus.valid ? (
                      <span className="text-[11px] text-red-600 font-medium">
                        Invalid Code
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#777777]">
                        3 letters + 2 numbers (e.g. MSV77)
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#888888]">
                        <Gift className="size-4" />
                      </div>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="MSV77"
                        value={inviteCode}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().slice(0, 5);
                          setInviteCode(val);
                          if (inviteStatus.checked) {
                            setInviteStatus({ checked: false, valid: false });
                          }
                        }}
                        onBlur={() => {
                          if (inviteCode.trim().length === 5 && !inviteStatus.checked) {
                            handleValidateInvite(inviteCode);
                          }
                        }}
                        className="w-full rounded-md border border-[#EBE7DF] bg-white pl-10 pr-4 py-2.5 sm:py-3 text-sm font-mono uppercase font-bold tracking-wider text-[#111111] placeholder:text-[#999999] focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={inviteValidating || inviteCode.trim().length < 5}
                      onClick={() => handleValidateInvite(inviteCode)}
                      className="px-4 py-2.5 sm:py-3 rounded-md border border-[#EBE7DF] bg-[#FAF9F6] hover:bg-white text-xs font-bold text-[#111111] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                    >
                      {inviteValidating ? "Checking..." : inviteStatus.valid ? "Verified ✓" : "Verify Code"}
                    </button>
                  </div>
                  {inviteStatus.checked && inviteStatus.valid && inviteStatus.doctorName && (
                    <p className="mt-1 text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="size-3.5 shrink-0" />
                      Referred by {inviteStatus.doctorName}. Referral reward will be credited upon registration.
                    </p>
                  )}
                  {inviteStatus.checked && !inviteStatus.valid && (
                    <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="size-3.5 shrink-0" />
                      {inviteStatus.message || "Invalid invite code. Please recheck."}
                    </p>
                  )}
                </div>

                {/* Submit Primary Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 sm:h-13 rounded-md bg-[#E67230] hover:bg-[#D15F1F] text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_4px_16px_-4px_rgba(230,114,48,0.4)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#E67230] focus-visible:ring-offset-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Registering with Backend...</span>
                    ) : (
                      <>
                        <span>Register as a Doctor</span>
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Sign In Link Footer */}
              <div className="mt-8 pt-6 border-t border-[#EBE7DF] text-center">
                <p className="text-xs sm:text-sm text-[#555555]">
                  Already have a doctor account?{" "}
                  <Link to="/login" className="font-bold text-[#E67230] hover:underline">
                    Sign in to your Mey Veda Workspace
                  </Link>
                </p>
              </div>
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
