import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
  FileCheck2,
  Gift,
} from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Btn, Field, inputCls } from "@/components/ui-kit";
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

/* -------------------------------------------------------------------------- */
/*             RECOGNIZED AYUSH MEDICAL QUALIFICATIONS (NCISM / NCH)          */
/* -------------------------------------------------------------------------- */

export const AYUSH_QUALIFICATIONS = [
  {
    code: "BAMS",
    title: "BAMS",
    label: "BAMS — Bachelor of Ayurvedic Medicine and Surgery",
    system: "Ayurveda",
  },
  {
    code: "BSMS",
    title: "BSMS",
    label: "BSMS — Bachelor of Siddha Medicine and Surgery",
    system: "Siddha",
  },
  {
    code: "BNYS",
    title: "BNYS",
    label: "BNYS — Bachelor of Naturopathy and Yogic Sciences",
    system: "Naturopathy & Yoga",
  },
  {
    code: "BHMS",
    title: "BHMS",
    label: "BHMS — Bachelor of Homeopathic Medicine and Surgery",
    system: "Homoeopathy",
  },
  {
    code: "BUMS",
    title: "BUMS",
    label: "BUMS — Bachelor of Unani Medicine and Surgery",
    system: "Unani",
  },
] as const;

export type AyushQualificationCode = (typeof AYUSH_QUALIFICATIONS)[number]["code"];

export function Register() {
  const navigate = useNavigate();

  // 1. Full Name
  const [fullName, setFullName] = useState("");

  // 2. Qualification (Strictly: BAMS, BSMS, BNYS, BHMS, BUMS)
  const [qualification, setQualification] = useState<AyushQualificationCode>("BAMS");

  // 3. Pincode
  const [pincode, setPincode] = useState("");

  // 4. Doctor Registration Number
  const [doctorRegNumber, setDoctorRegNumber] = useState("");

  // 5. Email + OTP Verification
  const [email, setEmail] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpInput, setEmailOtpInput] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [emailToken, setEmailToken] = useState<string | null>(null);
  const [emailDemoOtp, setEmailDemoOtp] = useState<string | null>(null);

  // 6. Mobile + OTP Verification
  const [mobile, setMobile] = useState("");
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpInput, setMobileOtpInput] = useState("");
  const [mobileVerified, setMobileVerified] = useState(false);
  const [mobileSending, setMobileSending] = useState(false);
  const [mobileVerifying, setMobileVerifying] = useState(false);
  const [mobileCooldown, setMobileCooldown] = useState(0);
  const [mobileToken, setMobileToken] = useState<string | null>(null);
  const [mobileDemoOtp, setMobileDemoOtp] = useState<string | null>(null);

  // 7. Password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 8. Practitioner Statutory Declaration & Ethics Agreement
  const [declaration, setDeclaration] = useState(false);

  // 9. Invite / Referral Code (Verified with Backend)
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
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  /* ------------------------------------------------------------------------ */
  /*                         EMAIL OTP HANDLERS                               */
  /* ------------------------------------------------------------------------ */
  const handleSendEmailOtp = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid practitioner email address." }));
      return;
    }
    setErrors((prev) => ({ ...prev, email: "" }));
    setEmailSending(true);

    try {
      const res = await apiClient.post<{
        success: boolean;
        message: string;
        target: string;
        demo_otp?: string | null;
        expires_in?: number;
      }>("/auth/send-email-otp", {
        email: trimmedEmail,
      });

      setEmailOtpSent(true);
      setEmailCooldown(60);
      if (res.demo_otp) {
        setEmailDemoOtp(res.demo_otp);
      } else {
        setEmailDemoOtp(null);
      }

      toast.success(res.message || `Verification code sent to ${trimmedEmail}`, {
        description: "Valid for 5 minutes. Check your inbox and spam folder.",
      });
    } catch (err: any) {
      const msg = err?.message || "Failed to send email verification code.";
      toast.error(msg);
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
        setErrors((prev) => ({ ...prev, email: "" }));
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
      setErrors((prev) => ({ ...prev, mobile: "Please enter a valid 10-digit Indian mobile number." }));
      return;
    }
    const finalMobile = cleaned.slice(-10);
    setErrors((prev) => ({ ...prev, mobile: "" }));
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
      if (res.demo_otp) {
        setMobileDemoOtp(res.demo_otp);
      } else {
        setMobileDemoOtp(null);
      }

      toast.success(res.message || `SMS verification code sent to +91 ${finalMobile}`, {
        description: "Valid for 5 minutes.",
      });
    } catch (err: any) {
      const msg = err?.message || "Failed to dispatch SMS verification code.";
      toast.error(msg);
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
        setErrors((prev) => ({ ...prev, mobile: "" }));
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

  // Auto-validate invite code if passed via URL parameter (?ref=... or ?invite=...)
  useEffect(() => {
    if (inviteCode && inviteCode.length === 5) {
      handleValidateInvite(inviteCode);
    }
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                     SUBMIT DOCTOR REGISTRATION                           */
  /* ------------------------------------------------------------------------ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 3) {
      newErrors.fullName = "Doctor Full Name is required (minimum 3 characters).";
    }

    if (!qualification) {
      newErrors.qualification = "Please select your AYUSH medical degree (BAMS, BSMS, BNYS, BHMS, BUMS).";
    }

    const cleanPin = pincode.trim();
    if (!cleanPin || !/^[1-9][0-9]{5}$/.test(cleanPin)) {
      newErrors.pincode = "Please enter a valid 6-digit Indian PIN code.";
    }

    const cleanReg = doctorRegNumber.trim();
    if (!cleanReg) {
      newErrors.doctorRegNumber = "Doctor Registration Number is required (e.g. State Council / NCISM).";
    }

    if (!emailVerified) {
      newErrors.email = "Please verify your Email Address using the OTP code.";
    }

    if (!mobileVerified) {
      newErrors.mobile = "Please verify your Mobile Number using the SMS code.";
    }

    if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (!declaration) {
      newErrors.declaration = "You must accept the statutory AYUSH practitioner declaration to register.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return;
    }

    setIsSubmitting(true);

    const formattedName = cleanName.startsWith("Dr.") ? cleanName : `Dr. ${cleanName}`;
    const cleanedMobile = mobile.replace(/\D/g, "").slice(-10);

    const selectedQualObj = AYUSH_QUALIFICATIONS.find((q) => q.code === qualification);
    const systemName = selectedQualObj?.system || "Ayurveda";

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

      // Save token in storage
      if (regResponse?.access_token) {
        localStorage.setItem("meyveda_auth_token", regResponse.access_token);
        setStoredToken(regResponse.access_token);
      }

      // Save user session in state
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

      // Cache user object
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
      toast.error(err?.message || "Registration failed. Please check your credentials and retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormReady =
    fullName.trim().length >= 3 &&
    Boolean(qualification) &&
    /^[1-9][0-9]{5}$/.test(pincode.trim()) &&
    doctorRegNumber.trim().length > 0 &&
    emailVerified &&
    mobileVerified &&
    password.length >= 6 &&
    password === confirmPassword &&
    declaration &&
    !isSubmitting;

  return (
    <AuthLayout
      title="Register as a doctor"
      desc="Create your verified AYUSH medical practitioner account. Connect to classical monographs, clinical intelligence, and pharmacovigilance."
    >
      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
        {/* 1. FULL NAME */}
        <Field
          label="Full Name *"
          hint="Official name as recorded in your Medical Council Registration"
          error={errors.fullName}
        >
          <div className="relative">
            <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              required
              className={cn(inputCls, "pl-9 text-sm")}
              placeholder=""
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: "" }));
              }}
            />
          </div>
        </Field>

        {/* 2. QUALIFICATION (Strictly: BAMS, BSMS, BNYS, BHMS, BUMS) */}
        <Field
          label="Qualification * (AYUSH Medical Degree)"
          hint="Select your primary degree recognized under NCISM / NCH"
          error={errors.qualification}
        >
          <div className="space-y-2">
            <div className="relative">
              <GraduationCap className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                required
                className={cn(inputCls, "pl-9 bg-card cursor-pointer text-sm font-medium")}
                value={qualification}
                onChange={(e) => {
                  setQualification(e.target.value as AyushQualificationCode);
                  if (errors.qualification) setErrors((prev) => ({ ...prev, qualification: "" }));
                }}
              >
                {AYUSH_QUALIFICATIONS.map((q) => (
                  <option key={q.code} value={q.code}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick-Select Qualification Badges */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {AYUSH_QUALIFICATIONS.map((q) => {
                const isSelected = qualification === q.code;
                return (
                  <button
                    key={q.code}
                    type="button"
                    onClick={() => {
                      setQualification(q.code);
                      if (errors.qualification) setErrors((prev) => ({ ...prev, qualification: "" }));
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    )}
                  >
                    <span>{q.code}</span>
                    <span className={cn("text-[10px] font-normal opacity-80", isSelected ? "text-primary-foreground" : "text-muted-foreground")}>
                      ({q.system})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Field>

        {/* 3. PINCODE & 4. DOCTOR REGISTRATION NUMBER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="PIN Code *"
            hint="6-digit Indian postal code"
            error={errors.pincode}
          >
            <div className="relative">
              <MapPin className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                inputMode="numeric"
                className={cn(inputCls, "pl-9 font-mono tracking-wider text-sm")}
                placeholder=""
                value={pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPincode(val);
                  if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: "" }));
                }}
              />
            </div>
          </Field>

          <Field
            label="Doctor Registration Number *"
            hint="NCISM / State Council Reg No."
            error={errors.doctorRegNumber}
          >
            <div className="relative">
              <ShieldCheck className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                required
                className={cn(inputCls, "pl-9 font-mono text-sm uppercase")}
                placeholder=""
                value={doctorRegNumber}
                onChange={(e) => {
                  setDoctorRegNumber(e.target.value);
                  if (errors.doctorRegNumber) setErrors((prev) => ({ ...prev, doctorRegNumber: "" }));
                }}
              />
            </div>
          </Field>
        </div>

        {/* 5. EMAIL (SEND AND VERIFY OTP) */}
        <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-primary" /> Email Address *
            </span>
            {emailVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 border border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> OTP verification required
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="email"
              required
              disabled={emailVerified}
              className={cn(inputCls, "flex-1 text-sm disabled:opacity-75 disabled:bg-muted/30")}
              placeholder=""
              autoComplete="off"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailVerified) {
                  setEmailVerified(false);
                  setEmailToken(null);
                }
                if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
              }}
            />
            {!emailVerified && (
              <button
                type="button"
                disabled={emailSending || !email.includes("@") || emailCooldown > 0}
                onClick={handleSendEmailOtp}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-2xs transition-colors hover:bg-primary/90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {emailSending ? (
                  "Sending..."
                ) : emailCooldown > 0 ? (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {emailCooldown}s
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
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                title="Change email"
              >
                <RotateCcw className="h-3 w-3" /> Change
              </button>
            )}
          </div>

          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}

          {/* Email OTP Verification Box */}
          {emailOtpSent && !emailVerified && (
            <div className="rounded-lg border border-primary/30 bg-primary-soft/40 p-3 space-y-2 animate-in fade-in-50">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-primary flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Enter 6-Digit Email OTP
                </span>
                <span className="text-[11px] text-muted-foreground">Valid for 5 minutes • Check inbox & spam</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  className={cn(inputCls, "font-mono tracking-widest text-center text-sm font-bold bg-card")}
                  placeholder="• • • • • •"
                  value={emailOtpInput}
                  onChange={(e) => setEmailOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                <button
                  type="button"
                  disabled={emailVerifying || emailOtpInput.trim().length < 6}
                  onClick={handleVerifyEmailOtp}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {emailVerifying ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 6. MOBILE (SEND AND VERIFY OTP) */}
        <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-primary" /> Mobile Number *
            </span>
            {mobileVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 border border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> SMS OTP required
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                disabled={mobileVerified}
                className={cn(inputCls, "pl-11 font-mono text-sm disabled:opacity-75 disabled:bg-muted/30")}
                placeholder=""
                autoComplete="off"
                value={mobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setMobile(val);
                  if (mobileVerified) {
                    setMobileVerified(false);
                    setMobileToken(null);
                  }
                  if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: "" }));
                }}
              />
            </div>
            {!mobileVerified && (
              <button
                type="button"
                disabled={mobileSending || mobile.replace(/\D/g, "").length < 10 || mobileCooldown > 0}
                onClick={handleSendMobileOtp}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-2xs transition-colors hover:bg-primary/90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {mobileSending ? (
                  "Sending..."
                ) : mobileCooldown > 0 ? (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {mobileCooldown}s
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
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                title="Change mobile"
              >
                <RotateCcw className="h-3 w-3" /> Change
              </button>
            )}
          </div>

          {errors.mobile && <p className="text-xs text-destructive">{errors.mobile}</p>}

          {/* Mobile OTP Verification Box */}
          {mobileOtpSent && !mobileVerified && (
            <div className="rounded-lg border border-primary/30 bg-primary-soft/40 p-3 space-y-2 animate-in fade-in-50">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-primary flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Enter 6-Digit SMS OTP
                </span>
                <span className="text-[11px] text-muted-foreground">Valid for 5 minutes • Check SMS</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  className={cn(inputCls, "font-mono tracking-widest text-center text-sm font-bold bg-card")}
                  placeholder="• • • • • •"
                  value={mobileOtpInput}
                  onChange={(e) => setMobileOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                <button
                  type="button"
                  disabled={mobileVerifying || mobileOtpInput.trim().length < 6}
                  onClick={handleVerifyMobileOtp}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {mobileVerifying ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 7. PASSWORD & CONFIRM PASSWORD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Password *" hint="Minimum 6 characters" error={errors.password}>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                required
                className={cn(inputCls, "pl-9 pr-9 text-sm")}
                placeholder=""
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <Field label="Confirm Password *" error={errors.confirmPassword}>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                className={cn(inputCls, "pl-9 pr-9 text-sm")}
                placeholder=""
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
        </div>

        {/* 8. INVITE / REFERRAL CODE (Verified by Backend) */}
        <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Gift className="h-3.5 w-3.5 text-primary" /> Invite / Referral Code (Optional)
            </span>
            {inviteStatus.checked && inviteStatus.valid ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 border border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3" /> Valid Invite
              </span>
            ) : inviteStatus.checked && !inviteStatus.valid ? (
              <span className="text-[11px] font-medium text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Invalid Code
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                3 letters + 2 numbers (e.g. MSV77)
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              maxLength={5}
              autoComplete="off"
              className={cn(inputCls, "flex-1 font-mono uppercase tracking-widest text-sm font-bold")}
              placeholder=""
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
            />
            <button
              type="button"
              disabled={inviteValidating || inviteCode.trim().length < 5}
              onClick={() => handleValidateInvite(inviteCode)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-secondary px-3.5 py-2 text-xs font-bold text-secondary-foreground shadow-2xs transition-colors hover:bg-secondary/80 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed border border-border"
            >
              {inviteValidating ? "Checking..." : inviteStatus.valid ? "Verified ✓" : "Verify Code"}
            </button>
          </div>

          {inviteStatus.checked && inviteStatus.valid && inviteStatus.doctorName && (
            <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Referred by {inviteStatus.doctorName}. Referral reward will be credited upon registration.
            </p>
          )}

          {inviteStatus.checked && !inviteStatus.valid && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {inviteStatus.message || "Invalid invite code. Check with your referring colleague."}
            </p>
          )}
        </div>

        {/* 9. PRACTITIONER STATUTORY DECLARATION QUESTION & AFFIRMATION */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Practitioner Statutory Declaration & Ethics Agreement
            </span>
          </div>
          <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed text-foreground/90">
            <input
              type="checkbox"
              required
              className="mt-1 h-4 w-4 rounded border-border accent-primary cursor-pointer shrink-0"
              checked={declaration}
              onChange={(e) => {
                setDeclaration(e.target.checked);
                if (errors.declaration) setErrors((prev) => ({ ...prev, declaration: "" }));
              }}
            />
            <div className="space-y-1 text-muted-foreground">
              <p className="font-semibold text-foreground">I solemnly declare and affirm that:</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>I hold the recognized AYUSH degree ({qualification}) selected above from an accredited university.</li>
                <li>I am registered with the National Commission for Indian System of Medicine (NCISM), National Commission for Homoeopathy (NCH), or a recognized State Medical Council under the Registration Number entered.</li>
                <li>I will adhere to clinical pharmacovigilance, Adverse Drug Reaction (ADR) reporting, and ethical AYUSH practice.</li>
              </ul>
            </div>
          </label>
          {errors.declaration && <p className="text-xs text-destructive">{errors.declaration}</p>}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <Btn
            type="submit"
            className="w-full text-sm font-bold py-3 shadow-sm cursor-pointer"
            disabled={!isFormReady}
          >
            {isSubmitting ? "Registering Practitioner Account..." : "Complete Doctor Registration"}
          </Btn>
          {!isFormReady && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {!emailVerified || !mobileVerified
                ? "Please verify both Email and Mobile No using the 6-digit OTP codes."
                : "Please fill all required (*) fields and accept the declaration."}
            </p>
          )}
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link to="/login" className="font-bold text-primary hover:underline">
          Sign in to your Mey Veda Workspace
        </Link>
      </p>
    </AuthLayout>
  );
}
