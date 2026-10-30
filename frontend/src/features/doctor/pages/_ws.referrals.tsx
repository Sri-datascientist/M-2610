import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  UserPlus,
  Copy,
  Check,
  Search,
  Filter,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  Send,
  ShieldCheck,
  Info,
  RefreshCw,
  FileText,
  Building,
  User,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Btn, Empty, Field, PageHeader, Pill, inputCls } from "@/components/ui-kit";
import { actions, setState, today, useStore, type DoctorReferral, type ReferralStatus } from "@/lib/store";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { apiClient } from "@/services/apiClient";
import { copyToClipboard } from "@/lib/clipboard";

export interface ReferralsSearchParams {
  tab?: "overview" | "invite" | "history" | undefined;
  status?: string | undefined;
  q?: string | undefined;
}

export const Route = createFileRoute("/_ws/referrals")({
  validateSearch: (s: Record<string, unknown>): ReferralsSearchParams => ({
    tab:
      s["tab"] === "overview" || s["tab"] === "invite" || s["tab"] === "history"
        ? (s["tab"] as ReferralsSearchParams["tab"])
        : undefined,
    status: typeof s["status"] === "string" ? s["status"] : undefined,
    q: typeof s["q"] === "string" ? s["q"] : undefined,
  }),
  head: () =>
    seo(
      "Doctor Referrals & Early Access",
      "Invite qualified Ayurvedic physicians to the Meyveda peer clinical network and track early access onboarding.",
    ),
  component: ReferralsPage,
});

export const REFERRAL_STATUSES: readonly ReferralStatus[] = [
  "Invitation Sent",
  "Registered",
  "Council Verified",
  "Access Active",
  "Expired",
] as const;

export function filterDoctorReferrals(
  list: DoctorReferral[],
  opts: {
    status?: string | undefined;
    q?: string | undefined;
    onlyUserCreated?: boolean | undefined;
  } = {},
): DoctorReferral[] {
  const { status, q = "", onlyUserCreated = false } = opts;
  const query = q.trim().toLowerCase();

  return list.filter((r) => {
    if (status && status !== "All" && r.status !== status) return false;
    if (!query) return true;

    const haystack = [
      r.id,
      r.invitedEmail,
      r.invitedName ?? "",
      r.invitedSpecialty ?? "",
      r.invitedCouncil ?? "",
      r.status,
      r.notes ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function ReferralsPage() {
  const searchParams = (Route.useSearch() ?? {}) as ReferralsSearchParams;
  const navigate = Route.useNavigate();
  const doctor = useStore((s) => s.doctor);
  const referrals = useStore((s) => s.referrals);
  const referralAccount = useStore((s) => s.referralAccount);

  const activeTab = searchParams.tab ?? "overview";
  const [q, setQ] = useState(searchParams.q ?? "");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.status ?? "All");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Invitation Form State (4 Questions: Name, Email, Mobile, Qualification)
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMobile, setInviteMobile] = useState("");
  const [inviteQualification, setInviteQualification] = useState("BAMS");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteSuccessInfo, setInviteSuccessInfo] = useState<{
    id: string;
    name: string;
    email: string;
    mobile: string;
    qualification: string;
    inviteCode: string;
    registrationUrl: string;
  } | null>(null);

  // Form errors
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    mobile?: string;
    qualification?: string;
  }>({});

  // Sync state with search params
  useEffect(() => {
    setQ(searchParams.q ?? "");
    setStatusFilter(searchParams.status ?? "All");
  }, [searchParams.q, searchParams.status]);

  useEffect(() => {
    let active = true;

    // Fetch live invite code, points, and summary from backend
    apiClient
      .get<{
        invite_code: string;
        invite_url: string;
        referral_count: number;
        total_rewards: number;
        joined_doctors?: Array<any>;
      }>("/referrals/my-summary")
      .then((sumRes) => {
        if (!active || !sumRes) return;
        const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
        setState((s) => ({
          referralAccount: {
            ...s.referralAccount,
            referralCode: sumRes.invite_code,
            referralLink: sumRes.invite_url || `${origin}/register?ref=${sumRes.invite_code}`,
            referralPoints: sumRes.total_rewards ?? 0,
            totalInvited: sumRes.referral_count ?? 0,
            isReferralActive: true,
          },
        }));
      })
      .catch((err) => {
        console.warn("Could not load referral summary:", err);
      });

    // Fetch live list of referrals from backend
    apiClient
      .get<{ items: any[]; total: number }>("/doctors/me/referrals")
      .then((res) => {
        if (!active || !res?.items) return;
        const mapped: DoctorReferral[] = res.items.map((it) => ({
          id: it.id,
          invitedEmail: it.referred_contact,
          invitedName: it.referred_name,
          invitedSpecialty: undefined,
          invitedCouncil: undefined,
          notes: it.reason,
          dateInvited: it.created_at ? it.created_at.split("T")[0] : today(),
          statusUpdatedDate: it.created_at ? it.created_at.split("T")[0] : today(),
          status:
            it.status === "completed"
              ? "Access Active"
              : it.status === "accepted"
                ? "Registered"
                : it.status === "declined"
                  ? "Expired"
                  : "Invitation Sent",
          isDemoSample: false,
        }));

        setState(() => ({
          referrals: mapped,
        }));
      })
      .catch((err) => {
        console.warn("Could not load backend referrals:", err);
      });

    return () => {
      active = false;
    };
  }, []);

  const updateSearch = (patch: Partial<ReferralsSearchParams>) => {
    (navigate as any)({
      search: (prev: any) => ({
        ...(typeof prev === "object" && prev ? prev : {}),
        ...patch,
      }),
    });
  };

  // Filtered referrals
  const filteredReferrals = useMemo(() => {
    return filterDoctorReferrals(referrals, {
      status: statusFilter,
      q,
    });
  }, [referrals, statusFilter, q]);

  // Counts
  const verifiedCount = referrals.filter(
    (r) => r.status === "Council Verified" || r.status === "Access Active",
  ).length;
  const pendingCount = referrals.filter(
    (r) => r.status === "Invitation Sent" || r.status === "Registered",
  ).length;
  const userSentCount = referrals.filter((r) => !r.isDemoSample).length;

  const targetCode =
    referralAccount.referralCode ||
    (doctor as any)?.inviteCode ||
    (doctor as any)?.invite_code ||
    "MSV77";
  const targetLink =
    referralAccount.referralLink ||
    `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/register?ref=${targetCode}`;

  const handleCopyCode = async () => {
    const ok = await copyToClipboard(targetCode);
    if (ok) {
      setCopiedCode(true);
      toast.success("Referral code copied to clipboard");
      setTimeout(() => setCopiedCode(false), 2500);
    } else {
      toast.error("Unable to copy to clipboard. Please copy manually.");
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(targetLink);
    if (ok) {
      setCopiedLink(true);
      toast.success("Referral link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2500);
    } else {
      toast.error("Unable to copy to clipboard. Please copy manually.");
    }
  };

  const validateInviteForm = (): boolean => {
    const errors: typeof formErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = inviteMobile.replace(/\D/g, "");

    if (!inviteName.trim()) {
      errors.name = "Colleague's full name is required.";
    } else if (inviteName.trim().length < 2) {
      errors.name = "Please enter a valid full name (e.g. Dr. Rajesh K. Varma).";
    }

    if (!inviteEmail.trim()) {
      errors.email = "Colleague's email address is required.";
    } else if (!emailRegex.test(inviteEmail.trim())) {
      errors.email = "Please enter a valid email address (e.g. dr.rajesh@example.com).";
    }

    if (!inviteMobile.trim()) {
      errors.mobile = "Colleague's mobile number is required.";
    } else if (phoneDigits.length < 10) {
      errors.mobile = "Please provide a valid 10-digit mobile number.";
    }

    if (!inviteQualification.trim()) {
      errors.qualification = "Qualification is required.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInviteForm()) {
      toast.error("Please address the highlighted form validation errors.");
      return;
    }

    setIsSubmitting(true);

    apiClient
      .post<{
        id: string;
        referred_name: string;
        referred_contact: string;
        reason: string;
        created_at: string;
        invite_code?: string;
        registration_url?: string;
        email_dispatched?: boolean;
      }>("/referrals", {
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        mobile: inviteMobile.trim(),
        qualification: inviteQualification.trim(),
      })
      .then((res) => {
        setIsSubmitting(false);
        const effectiveInviteCode = res.invite_code || targetCode;
        const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
        const queryParams = new URLSearchParams({
          ref: effectiveInviteCode,
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          mobile: inviteMobile.trim(),
          qualification: inviteQualification.trim(),
        }).toString();
        const effectiveRegistrationUrl = res.registration_url || `${origin}/register?${queryParams}`;

        const record: DoctorReferral = {
          id: res.id,
          invitedEmail: res.referred_contact,
          invitedName: res.referred_name,
          dateInvited: res.created_at ? res.created_at.split("T")[0] : today(),
          statusUpdatedDate: res.created_at ? res.created_at.split("T")[0] : today(),
          status: "Invitation Sent",
          isDemoSample: false,
          notes: res.reason,
        };

        setState((s) => ({
          referrals: [record, ...s.referrals.filter((r) => r.id !== res.id)],
        }));

        setInviteSuccessInfo({
          id: record.id,
          name: record.invitedName || inviteName.trim(),
          email: record.invitedEmail,
          mobile: inviteMobile.trim(),
          qualification: inviteQualification.trim(),
          inviteCode: effectiveInviteCode,
          registrationUrl: effectiveRegistrationUrl,
        });

        // Reset form
        setInviteName("");
        setInviteEmail("");
        setInviteMobile("");
        setInviteQualification("BAMS");

        toast.success("Invitation email dispatched successfully!", {
          description: `Dispatched to ${record.invitedName} (${record.invitedEmail}) with code ${effectiveInviteCode}`,
        });
      })
      .catch((err: any) => {
        setIsSubmitting(false);
        toast.error(err?.message || "Failed to submit referral. Please try again.");
      });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Practitioner Network"
        title="Referrals & Early Access"
        desc="Invite qualified AYUSH physicians to the Meyveda early access cohort. Help expand our peer-reviewed classical clinical network."
      />

      {/* Prototype Boundary & Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 bg-primary-soft/60 px-4 py-2.5 text-xs text-foreground md:px-8">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold text-primary-deep">Phase 1 Pilot Program Notice:</span>
          <span>
            Early access invitations are currently vetted through manual State AYUSH Council
            verification. No automated scoring, rankings, or referral commissions are implemented.
          </span>
        </div>
        <Pill t="orange" className="text-[11px] font-semibold py-0.5 px-2">
          {referralAccount.programStatus}
        </Pill>
      </div>

      {/* Main Tab Navigation */}
      <div className="border-b border-border bg-card/40 px-4 md:px-8 pt-4">
        <div className="flex items-center gap-2 overflow-x-auto text-sm">
          <button
            type="button"
            onClick={() => updateSearch({ tab: "overview" })}
            className={cn(
              "flex items-center gap-2 border-b-2 px-3 py-2.5 font-medium transition-colors shrink-0",
              activeTab === "overview"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            Program Overview & Policy
          </button>

          <button
            type="button"
            onClick={() => updateSearch({ tab: "invite" })}
            className={cn(
              "flex items-center gap-2 border-b-2 px-3 py-2.5 font-medium transition-colors shrink-0",
              activeTab === "invite"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <UserPlus className="h-4 w-4" />
            Invite a Colleague
            {userSentCount > 0 && (
              <span className="rounded-full bg-primary/20 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                {userSentCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => updateSearch({ tab: "history" })}
            className={cn(
              "flex items-center gap-2 border-b-2 px-3 py-2.5 font-medium transition-colors shrink-0",
              activeTab === "history"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Clock className="h-4 w-4" />
            Referral Records & Verification Status
            <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-bold text-muted-foreground">
              {referrals.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Overview & Policy */}
      {activeTab === "overview" && (
        <div className="p-4 md:p-8 space-y-6 max-w-5xl">
          {/* Key Metric Highlights */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="panel p-4 space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Invited Colleagues</span>
              <div className="text-2xl font-bold text-foreground">{(referralAccount.totalInvited ?? 0) || referrals.length}</div>
              <div className="text-[11px] text-muted-foreground">
                Colleagues nominated or registered
              </div>
            </div>

            <div className="panel p-4 space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Completed Registrations</span>
              <div className="text-2xl font-bold text-primary-deep">{verifiedCount}</div>
              <div className="text-[11px] text-muted-foreground">
                AYUSH practitioners onboarded
              </div>
            </div>

            <div className="panel p-4 space-y-1">
              <span className="text-xs text-muted-foreground font-medium">
                Early Access Points
              </span>
              <div className="text-2xl font-bold text-amber-700">{referralAccount.referralPoints ?? 0} pts</div>
              <div className="text-[11px] text-muted-foreground">
                10 reward points per verified colleague
              </div>
            </div>
          </div>

          {/* Personal Referral Code Section */}
          <div className="panel p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Your Unique Referral Invite Link
                </h2>
                <p className="text-xs text-muted-foreground pt-1">
                  Share this verified invite code with fellow AYUSH doctors to unlock early access rewards.
                </p>
              </div>
              <Pill t="emerald">
                Code Verified & Active
              </Pill>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Invite Code (3 Letters + 2 Digits)</label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={referralAccount.referralCode || (doctor as any)?.inviteCode || "MSV77"}
                    className={cn(inputCls, "font-mono font-bold tracking-wider bg-muted text-primary text-base")}
                    aria-label="Referral Code"
                  />
                  <Btn variant="outline" onClick={handleCopyCode} aria-label="Copy referral code">
                    {copiedCode ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedCode ? "Copied" : "Copy"}
                  </Btn>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Direct Registration URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={
                      referralAccount.referralLink ||
                      `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/register?ref=${referralAccount.referralCode || (doctor as any)?.inviteCode || "MSV77"}`
                    }
                    className={cn(inputCls, "font-mono text-xs bg-muted truncate")}
                    aria-label="Direct Registration URL"
                  />
                  <Btn variant="outline" onClick={handleCopyLink} aria-label="Copy referral link">
                    {copiedLink ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedLink ? "Copied" : "Copy Link"}
                  </Btn>
                </div>
              </div>
            </div>
          </div>

          {/* Program Guidelines and Eligibility */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="panel p-5 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground border-b pb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Eligibility Criteria for Early Access
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Meyveda is a closed professional environment. Early access privileges are
                reserved exclusively for:
              </p>
              <ul className="space-y-2 text-xs">
                {referralAccount.eligibleCohorts.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">{c}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-lg bg-muted p-3 text-[11px] text-muted-foreground">
                <strong>Documentation Required:</strong> Invitees must upload their State Board
                registration certificate and institutional credentials during onboarding.
              </div>
            </div>

            <div className="panel p-5 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground border-b pb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Program Boundaries & Commercial Policy
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {referralAccount.termsNotice}
              </p>
              <div className="space-y-2 text-xs pt-1">
                <div className="flex items-start gap-2 text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                  <span>
                    <strong>Zero Financial Commission:</strong> Referrals do not confer monetary
                    rewards, discounts, or financial compensation.
                  </span>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                  <span>
                    <strong>No Public Leaderboards:</strong> We do not publish doctor referral
                    rankings, competitive scoring, or volume metrics.
                  </span>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                  <span>
                    <strong>Independent Privacy Scoping:</strong> Your research formulations and
                    patient case notes are never exposed to invited peers.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Colleague Invitation Form (4 Questions) */}
      {activeTab === "invite" && (
        <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
          <div className="panel p-6 space-y-5">
            <div className="border-b pb-4 space-y-1">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Invite a Colleague to Meyveda
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Provide your colleague&apos;s details below. An official invitation email from you will be automatically dispatched to their inbox with your exclusive invite code and a 1-click registration link.
              </p>
            </div>

            {inviteSuccessInfo ? (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-5 space-y-4">
                <div className="flex items-center gap-2 font-bold text-base text-emerald-900">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  Invitation Email Dispatched to Dr. {inviteSuccessInfo.name}!
                </div>

                <div className="space-y-1.5 text-xs text-emerald-800 leading-relaxed bg-white/70 rounded-lg p-3.5 border border-emerald-200">
                  <div>
                    <strong>Recipient:</strong> Dr. {inviteSuccessInfo.name} ({inviteSuccessInfo.qualification})
                  </div>
                  <div>
                    <strong>Email Address:</strong> {inviteSuccessInfo.email}
                  </div>
                  <div>
                    <strong>Mobile Number:</strong> {inviteSuccessInfo.mobile}
                  </div>
                  <div>
                    <strong>Invite Code Sent:</strong>{" "}
                    <span className="font-mono font-bold text-primary-deep">{inviteSuccessInfo.inviteCode}</span>
                  </div>
                </div>

                <p className="text-xs text-emerald-800 leading-relaxed">
                  We have dispatched a personalized invitation to <strong>{inviteSuccessInfo.email}</strong>. When your colleague clicks the link in the email, their registration form will be automatically pre-filled with this code for instant onboarding.
                </p>

                {/* Direct link box */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-emerald-900">
                    Direct Colleague Registration URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={inviteSuccessInfo.registrationUrl}
                      className={cn(inputCls, "font-mono text-xs bg-white truncate")}
                      aria-label="Direct registration URL"
                    />
                    <Btn
                      variant="outline"
                      className="shrink-0 text-xs"
                      onClick={async () => {
                        const ok = await copyToClipboard(inviteSuccessInfo.registrationUrl);
                        if (ok) {
                          toast.success("Direct registration link copied to clipboard");
                        } else {
                          toast.error("Unable to copy to clipboard");
                        }
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copy Link
                    </Btn>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-emerald-200/80">
                  <Btn
                    variant="primary"
                    className="text-xs"
                    onClick={() => {
                      setInviteSuccessInfo(null);
                    }}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Invite Another Colleague
                  </Btn>
                  <Btn
                    variant="outline"
                    className="text-xs bg-white"
                    onClick={() => {
                      setInviteSuccessInfo(null);
                      updateSearch({ tab: "history" });
                    }}
                  >
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    View Referral History
                  </Btn>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
                {/* Question 1: Name */}
                <Field
                  label="1. Colleague's Full Name *"
                  hint="Official practitioner name for the personalized invitation"
                  error={formErrors.name}
                >
                  <input
                    type="text"
                    required
                    className={cn(inputCls, formErrors.name && "border-destructive")}
                    value={inviteName}
                    onChange={(e) => {
                      setInviteName(e.target.value);
                      if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="e.g. Dr. Rajesh K. Varma"
                    aria-label="Colleague's full name"
                  />
                </Field>

                {/* Question 2: Email */}
                <Field
                  label="2. Colleague's Email Address *"
                  hint="The official invitation with early access link will be dispatched to this inbox"
                  error={formErrors.email}
                >
                  <input
                    type="email"
                    required
                    className={cn(inputCls, formErrors.email && "border-destructive")}
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="e.g. dr.rajesh@ayurveda-institute.org"
                    aria-label="Colleague's email"
                  />
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Question 3: Mobile */}
                  <Field
                    label="3. Colleague's Mobile Number *"
                    hint="For SMS delivery & registration pre-fill"
                    error={formErrors.mobile}
                  >
                    <input
                      type="tel"
                      required
                      className={cn(inputCls, formErrors.mobile && "border-destructive")}
                      value={inviteMobile}
                      onChange={(e) => {
                        setInviteMobile(e.target.value);
                        if (formErrors.mobile) setFormErrors((prev) => ({ ...prev, mobile: undefined }));
                      }}
                      placeholder="e.g. +91 98765 43210"
                      aria-label="Colleague's mobile number"
                    />
                  </Field>

                  {/* Question 4: Qualification */}
                  <Field
                    label="4. Medical Qualification *"
                    hint="Practitioner degree or credential"
                    error={formErrors.qualification}
                  >
                    <select
                      className={inputCls}
                      value={inviteQualification}
                      onChange={(e) => {
                        setInviteQualification(e.target.value);
                        if (formErrors.qualification) {
                          setFormErrors((prev) => ({ ...prev, qualification: undefined }));
                        }
                      }}
                      aria-label="Medical qualification"
                    >
                      <option value="BAMS">BAMS — Ayurveda</option>
                      <option value="MD (Ayurveda)">MD (Ayurveda) — Postgraduate</option>
                      <option value="MS (Ayurveda)">MS (Ayurveda) — Shalya / Shalakya</option>
                      <option value="BHMS">BHMS — Homoeopathy</option>
                      <option value="BUMS">BUMS — Unani Medicine</option>
                      <option value="BSMS">BSMS — Siddha Medicine</option>
                      <option value="BNYS">BNYS — Naturopathy & Yoga</option>
                      <option value="Ph.D (AYUSH)">Ph.D / Research Scholar (AYUSH)</option>
                    </select>
                  </Field>
                </div>

                {/* Attributed Inviter Notice */}
                <div className="rounded-xl border border-border bg-surface p-3 text-[11px] text-muted-foreground flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span>
                      Inviting Practitioner:{" "}
                      <strong className="text-foreground">{doctor.name}</strong> (
                      {doctor.qualification})
                    </span>
                  </div>
                  <div className="font-mono text-[11px] font-semibold text-primary">
                    Invite Code: <strong>{targetCode}</strong>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t">
                  <Btn
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setInviteName("");
                      setInviteEmail("");
                      setInviteMobile("");
                      setInviteQualification("BAMS");
                      setFormErrors({});
                    }}
                  >
                    Clear Form
                  </Btn>
                  <Btn type="submit" disabled={isSubmitting} className="gap-2">
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Dispatching Invitation Email…" : "Send Colleague Invitation"}
                  </Btn>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: History & Records */}
      {activeTab === "history" && (
        <div className="p-4 md:p-8 space-y-5 max-w-5xl">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-xs focus-within:border-primary max-w-md">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                value={q}
                onChange={(e) => updateSearch({ q: e.target.value })}
                placeholder="Search by colleague name, email, or council…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                aria-label="Search referrals"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => updateSearch({ q: "" })}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <select
                value={statusFilter}
                onChange={(e) => updateSearch({ status: e.target.value })}
                className={inputCls}
                aria-label="Filter referral status"
              >
                <option value="All">All Statuses ({referrals.length})</option>
                {REFERRAL_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table / List View */}
          {filteredReferrals.length === 0 ? (
            <Empty
              title="No Referral Records Found"
              desc={
                q || statusFilter !== "All"
                  ? "No colleagues match your current search and filter criteria."
                  : "You have not dispatched any colleague early access invitations yet."
              }
              action={
                <Btn onClick={() => updateSearch({ tab: "invite" })}>
                  <UserPlus className="h-4 w-4" />
                  Invite Your First Colleague
                </Btn>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40 font-semibold text-muted-foreground">
                    <th className="px-4 py-3">Colleague / Invitee</th>
                    <th className="px-4 py-3">Specialty & Council</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date Dispatched</th>
                    <th className="px-4 py-3">Record Origin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredReferrals.map((r) => {
                    const statusTone =
                      r.status === "Council Verified" || r.status === "Access Active"
                        ? "ink"
                        : r.status === "Registered"
                          ? "orange"
                          : r.status === "Expired"
                            ? "danger"
                            : "warn";

                    return (
                      <tr key={r.id} className="hover:bg-primary-soft/20 transition-colors">
                        <td className="px-4 py-3.5 space-y-0.5">
                          <div className="font-bold text-foreground">
                            {r.invitedName || "Ayurvedic Physician"}
                          </div>
                          <div className="text-muted-foreground font-mono text-[11px]">
                            {r.invitedEmail}
                          </div>
                          {r.notes && (
                            <div className="text-[10px] text-muted-foreground/80 italic line-clamp-1 pt-0.5">
                              {r.notes}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5 space-y-0.5">
                          <div className="font-medium text-foreground">
                            {r.invitedSpecialty || "General Ayurveda"}
                          </div>
                          <div className="text-muted-foreground text-[11px]">
                            {r.invitedCouncil || "State Council Verification Pending"}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <Pill t={statusTone} className="text-[10px] py-0.5 px-2">
                            {r.status}
                          </Pill>
                        </td>

                        <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                          {r.dateInvited}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Recorded
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
