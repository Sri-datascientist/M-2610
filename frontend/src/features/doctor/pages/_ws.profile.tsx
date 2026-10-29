import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileCheck2,
  FileText,
  KeyRound,
  Lock,
  LogOut,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  Btn,
  Field,
  MockUpload,
  PageHeader,
  Pill,
  VerificationBadge,
  inputCls,
} from "@/components/ui-kit";
import type { VerificationStatus } from "@/lib/mock-data";
import { resetDemo, setState, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_ws/profile")({
  head: () =>
    seo(
      "My Profile & Credentials",
      "Manage your professional profile, AYUSH state council registration details, verification status, and account security preferences.",
    ),
  component: Profile,
});

const STATUSES: VerificationStatus[] = [
  "Not Submitted",
  "Pending Verification",
  "Additional Information Required",
  "Verified",
  "Rejected",
  "Suspended",
];

const STATUS_GUIDANCE: Record<
  VerificationStatus,
  { title: string; desc: string; tone: "muted" | "warn" | "danger" | "ink" }
> = {
  "Not Submitted": {
    title: "Registration Not Submitted",
    desc: "Submit your State Council registration certificate and medical qualifications to initiate clinical verification.",
    tone: "muted",
  },
  "Pending Verification": {
    title: "Queued for Manual Council Review",
    desc: "Your registration documents have been submitted to the platform verification team. No council or registry has been contacted automatically; reviews are completed within 2–3 business days.",
    tone: "warn",
  },
  "Additional Information Required": {
    title: "Clarification or Clearer Document Required",
    desc: "The verification officer has requested a higher-resolution scan of your State Medical Council registration certificate showing the registration seal and renewal date.",
    tone: "warn",
  },
  Verified: {
    title: "Verified Practitioner (Demo State)",
    desc: "Your professional qualifications and State Council registration have been verified on record (Phase 1 prototype demonstration status).",
    tone: "ink",
  },
  Rejected: {
    title: "Registration Verification Declined",
    desc: "Verification could not be established with the provided credentials. Please contact medical credentialing support.",
    tone: "danger",
  },
  Suspended: {
    title: "Account Verification Suspended (Demo State)",
    desc: "Verification privileges are suspended pending administrative or regulatory review (Phase 1 prototype demonstration status). Please contact credentialing support.",
    tone: "danger",
  },
};

interface PasswordModalState {
  current: string;
  newPass: string;
  confirmPass: string;
  error?: string | undefined;
}

export function validateProfile(d: { name: string; email: string; registrationNo: string }) {
  const errs: {
    name?: string | undefined;
    email?: string | undefined;
    registrationNo?: string | undefined;
  } = {};
  if (!d.name.trim()) errs.name = "Full name is required";
  if (!d.email.trim()) {
    errs.email = "Email is required";
  } else if (!d.email.includes("@")) {
    errs.email = "Enter a valid email address";
  }
  if (!d.registrationNo.trim()) errs.registrationNo = "Registration number is required";
  return errs;
}

export function validatePasswordChange(
  current: string,
  newPass: string,
  confirmPass: string,
): string | null {
  if (!current.trim()) return "Please enter your current password";
  if (newPass.length < 8) return "New password must be at least 8 characters";
  if (newPass !== confirmPass) return "Passwords do not match";
  return null;
}

export function Profile() {
  const doc = useStore((s) => s.doctor);
  const [d, setD] = useState(doc);
  const [errors, setErrors] = useState<{
    name?: string | undefined;
    email?: string | undefined;
    registrationNo?: string | undefined;
  }>({});
  const [notif, setNotif] = useState({ email: true, sms: false });
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([
    "State_Council_Registration_Certificate_2024.pdf",
    "BAMS_Degree_Certificate_MUHS.pdf",
  ]);

  // Password Modal State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pwState, setPwState] = useState<PasswordModalState>({
    current: "",
    newPass: "",
    confirmPass: "",
  });

  // Track unsaved modifications
  const isDirty = useMemo(() => {
    return (
      d.name !== doc.name ||
      d.email !== doc.email ||
      d.qualification !== doc.qualification ||
      d.institution !== doc.institution ||
      d.council !== doc.council ||
      d.registrationNo !== doc.registrationNo ||
      d.bio !== doc.bio ||
      d.graduationYear !== doc.graduationYear ||
      d.system !== doc.system
    );
  }, [d, doc]);

  // Sync component state when store doc updates externally
  useEffect(() => {
    setD(doc);
  }, [doc]);

  // Keyboard Escape for Password Modal
  useEffect(() => {
    if (!passwordModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPasswordModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [passwordModalOpen]);

  const f =
    (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setD({ ...d, [k]: e.target.value });
      if (k in errors) {
        setErrors({ ...errors, [k]: undefined });
      }
    };

  const handleSave = () => {
    const errs = validateProfile(d);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error("Please correct the errors in the profile form");
      return;
    }

    const calculatedInitials =
      d.name
        .replace(/^Dr\.?\s*/i, "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
        .slice(0, 2) || "DR";

    const regChanged = d.registrationNo !== doc.registrationNo;

    setState((s) => ({
      doctor: {
        ...d,
        name: d.name.trim(),
        email: d.email.trim(),
        registrationNo: d.registrationNo.trim(),
        verification: regChanged ? "Pending Verification" : s.doctor.verification,
        initials: calculatedInitials,
      },
    }));

    if (regChanged) {
      toast.info("Registration number changed; status set to Pending Verification");
    } else {
      toast.success("Profile saved successfully to workspace");
    }
  };

  const handleDiscard = () => {
    setD(doc);
    setErrors({});
    toast("Modifications discarded");
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validatePasswordChange(pwState.current, pwState.newPass, pwState.confirmPass);
    if (err) {
      setPwState((p) => ({ ...p, error: err }));
      return;
    }

    setPasswordModalOpen(false);
    setPwState({ current: "", newPass: "", confirmPass: "" });
    toast.success("Password updated (prototype security simulation)");
  };

  const guidance = STATUS_GUIDANCE[doc.verification];

  return (
    <div>
      <PageHeader
        eyebrow="Practitioner Account"
        title="My Profile"
        desc="Professional credentials, State Council registration records and security preferences."
        actions={
          isDirty && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-accent-foreground border border-primary/30">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Unsaved changes
            </span>
          )
        }
      />

      <div className="grid gap-6 p-4 md:p-8 lg:grid-cols-[320px_1fr]">
        {/* Left Column: Identity Card and Verification Status */}
        <aside className="space-y-6">
          <div className="panel p-6 text-center space-y-4">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-orange-gradient text-2xl font-bold text-primary-foreground shadow-soft">
              {doc.initials}
            </div>

            <div>
              <h2 className="font-bold text-lg text-foreground">{doc.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{doc.qualification}</p>
              <p className="text-xs text-muted-foreground font-mono">{doc.registrationNo}</p>
            </div>

            <div className="pt-1">
              <VerificationBadge status={doc.verification} />
            </div>

            {/* Guidance Explanatory Box */}
            <div className="rounded-xl border bg-surface/80 p-3.5 text-left text-xs space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                {guidance.title}
              </div>
              <p className="text-muted-foreground leading-relaxed">{guidance.desc}</p>
            </div>

            {/* Verification Simulator Switcher */}
            <div className="border-t pt-4 text-left space-y-2">
              <div className="eyebrow flex items-center justify-between text-muted-foreground">
                <span>Demo: Simulation Status</span>
                <span className="text-[10px] text-primary font-mono">Frontend Only</span>
              </div>
              <select
                className={inputCls}
                value={doc.verification}
                onChange={(e) =>
                  setState((s) => ({
                    doctor: {
                      ...s.doctor,
                      verification: e.target.value as VerificationStatus,
                    },
                  }))
                }
                aria-label="Simulation verification status"
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Allows testing doctor portal view states across verification lifecycle stages.
              </p>
            </div>
          </div>

          {/* Verification Documents Vault */}
          <div className="panel p-5 space-y-3">
            <div className="eyebrow flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5 text-foreground font-semibold">
                <FileCheck2 className="h-4 w-4 text-primary" />
                Credentials on File
              </span>
              <span className="text-[11px]">{uploadedDocs.length} documents</span>
            </div>

            <ul className="space-y-1.5 text-xs">
              {uploadedDocs.map((docName, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-surface/60 p-2.5 text-foreground min-w-0"
                >
                  <span
                    className="truncate break-all min-w-0 max-w-full flex-1 font-mono text-[11px]"
                    title={docName}
                  >
                    {docName}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-semibold text-primary">Attached</span>
                    <button
                      type="button"
                      aria-label={`Remove document ${docName}`}
                      onClick={() => setUploadedDocs((prev) => prev.filter((_, i) => i !== idx))}
                      className="rounded p-0.5 text-muted-foreground hover:text-destructive hover:bg-muted"
                      title="Remove document"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="pt-1 min-w-0">
              <MockUpload
                files={uploadedDocs}
                onChange={setUploadedDocs}
                label="Upload updated registration scan"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Accepted formats: PDF or JPG scans up to 10 MB. Mock files remain in local session
              only as file names and are not uploaded to an administrator or verified by an external
              council.
            </p>
          </div>
        </aside>

        {/* Right Column: Profile Form & Account Settings */}
        <div className="space-y-6">
          {/* Main Professional Information Form */}
          <section className="panel p-6 space-y-4">
            <div className="border-b pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Professional & Statutory Details
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Statutory qualifications and council registration information.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name with prefix *" error={errors.name}>
                <input
                  className={inputCls}
                  value={d.name}
                  onChange={f("name")}
                  aria-label="Full name"
                />
              </Field>

              <Field label="Professional email *" error={errors.email}>
                <input
                  type="email"
                  className={inputCls}
                  value={d.email}
                  onChange={f("email")}
                  aria-label="Professional email"
                />
              </Field>

              <Field label="Medical qualification (e.g. BAMS, MD)">
                <input
                  className={inputCls}
                  value={d.qualification}
                  onChange={f("qualification")}
                  aria-label="Medical qualification"
                />
              </Field>

              <Field label="Institution / College of Graduation">
                <input
                  className={inputCls}
                  value={d.institution}
                  onChange={f("institution")}
                  aria-label="Institution or college"
                />
              </Field>

              <Field label="Graduation year">
                <input
                  className={inputCls}
                  value={d.graduationYear ?? "2014"}
                  onChange={f("graduationYear" as never)}
                  placeholder="e.g. 2014"
                  aria-label="Graduation year"
                />
              </Field>

              <Field label="Medical system">
                <input
                  className={cn(inputCls, "bg-muted")}
                  value={d.system ?? "Ayurveda"}
                  readOnly
                  aria-label="Medical system"
                />
              </Field>

              <Field label="State Medical Council / Board">
                <input
                  className={inputCls}
                  value={d.council}
                  onChange={f("council")}
                  aria-label="State Medical Council"
                />
              </Field>

              <Field
                label="Council registration number *"
                error={errors.registrationNo}
                hint="Modifying registration number triggers re-verification"
              >
                <input
                  className={cn(inputCls, "font-mono")}
                  value={d.registrationNo}
                  onChange={f("registrationNo")}
                  aria-label="Council registration number"
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Clinical biography & background">
                  <textarea
                    rows={3}
                    className={inputCls}
                    value={d.bio}
                    onChange={f("bio")}
                    placeholder="Brief overview of clinical practice and therapeutic specialties…"
                    aria-label="Clinical biography"
                  />
                </Field>
              </div>

              <div className="md:col-span-2">
                <div className="mb-1.5 text-xs font-semibold text-foreground">
                  Clinical & Research Interests
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {d.interests.map((i) => (
                    <Pill key={i} t="orange">
                      {i}
                    </Pill>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-4">
              <Btn type="button" variant="outline" disabled={!isDirty} onClick={handleDiscard}>
                Discard changes
              </Btn>
              <Btn type="button" onClick={handleSave}>
                Save profile
              </Btn>
            </div>
          </section>

          {/* Contact Preferences */}
          <section className="panel p-6 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Notification Preferences</h3>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                  checked={notif.email}
                  onChange={(e) => setNotif({ ...notif, email: e.target.checked })}
                />
                <span className="text-foreground">
                  Email updates (case reviews, ADR communications and quality alerts)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                  checked={notif.sms}
                  onChange={(e) => setNotif({ ...notif, sms: e.target.checked })}
                />
                <span className="text-foreground">
                  SMS alerts for critical pharmacovigilance follow-ups
                </span>
              </label>
            </div>
          </section>

          {/* Account Security & Prototype Simulation */}
          <section className="panel p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Account Security & Sessions
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Authentication settings for your doctor portal session.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Btn
                type="button"
                variant="outline"
                onClick={() => setPasswordModalOpen(true)}
                className="gap-2 text-xs"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Change Password
              </Btn>

              <Btn
                type="button"
                variant="outline"
                onClick={() =>
                  toast.success(
                    "Signed out of all other active sessions (local session simulation)",
                  )
                }
                className="gap-2 text-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out Other Sessions
              </Btn>

              <Btn
                type="button"
                variant="outline"
                onClick={() => {
                  resetDemo();
                  toast.success("Workspace reset to initial demonstration state");
                }}
                className="gap-2 text-xs text-muted-foreground hover:text-destructive"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Demo Data
              </Btn>
            </div>

            <div className="rounded-xl border bg-surface/60 p-3 text-[11px] text-muted-foreground leading-relaxed">
              <strong>Security Architecture Note:</strong> Mey Veda Grantha Phase 1 operates in a
              client-side demonstration workspace. Remote password synchronization, session tokens,
              multi-factor authentication, and multi-tenant access control require production
              backend identity integration.
            </div>
          </section>
        </div>
      </div>

      {/* Accessible Password Change Modal */}
      <AnimatePresence>
        {passwordModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Change Password"
            onClick={() => setPasswordModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border bg-card shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <span>Update Account Password</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
                {pwState.error && (
                  <div className="rounded-lg bg-destructive-soft border border-destructive/30 p-2.5 text-destructive font-medium">
                    {pwState.error}
                  </div>
                )}

                <Field label="Current password *">
                  <input
                    type="password"
                    className={inputCls}
                    value={pwState.current}
                    onChange={(e) =>
                      setPwState({ ...pwState, current: e.target.value, error: undefined })
                    }
                    placeholder="Enter current password"
                    aria-label="Current password"
                  />
                </Field>

                <Field label="New password (min 8 characters) *">
                  <input
                    type="password"
                    className={inputCls}
                    value={pwState.newPass}
                    onChange={(e) =>
                      setPwState({ ...pwState, newPass: e.target.value, error: undefined })
                    }
                    placeholder="Enter new strong password"
                    aria-label="New password"
                  />
                </Field>

                <Field label="Confirm new password *">
                  <input
                    type="password"
                    className={inputCls}
                    value={pwState.confirmPass}
                    onChange={(e) =>
                      setPwState({ ...pwState, confirmPass: e.target.value, error: undefined })
                    }
                    placeholder="Repeat new password"
                    aria-label="Confirm new password"
                  />
                </Field>

                <p className="text-[11px] text-muted-foreground pt-1">
                  Note: Changes are validated and simulated in the local session.
                </p>

                <div className="flex justify-end gap-2 border-t pt-3">
                  <Btn type="button" variant="ghost" onClick={() => setPasswordModalOpen(false)}>
                    Cancel
                  </Btn>
                  <Btn type="submit">Update password</Btn>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
