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
      "Invite qualified Ayurvedic physicians to the Mey Veda Grantha peer clinical network and track early access onboarding.",
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

  // Invitation Form State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteSpecialty, setInviteSpecialty] = useState("");
  const [inviteCouncil, setInviteCouncil] = useState("");
  const [inviteNotes, setInviteNotes] = useState("");
  const [acknowledgedEligibility, setAcknowledgedEligibility] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteSuccessId, setInviteSuccessId] = useState<string | null>(null);

  // Form errors
  const [formErrors, setFormErrors] = useState<{
    email?: string | undefined;
    eligibility?: string | undefined;
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

  const handleCopyCode = async () => {
    if (!referralAccount.referralCode) {
      toast.error("Referral code is not currently generated by the platform service.");
      return;
    }
    try {
      await navigator.clipboard.writeText(referralAccount.referralCode);
      setCopiedCode(true);
      toast.success("Referral code copied to clipboard");
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      toast.error("Unable to copy to clipboard. Please copy manually.");
    }
  };

  const handleCopyLink = async () => {
    if (!referralAccount.referralLink) {
      toast.error("Personalized referral URL is not available in preview mode.");
      return;
    }
    try {
      await navigator.clipboard.writeText(referralAccount.referralLink);
      setCopiedLink(true);
      toast.success("Referral link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.error("Unable to copy to clipboard. Please copy manually.");
    }
  };

  const validateInviteForm = (): boolean => {
    const errors: typeof formErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!inviteEmail.trim()) {
      errors.email = "Colleague's email address is required.";
    } else if (!emailRegex.test(inviteEmail.trim())) {
      errors.email = "Please provide a valid medical email address.";
    }

    if (!acknowledgedEligibility) {
      errors.eligibility = "Please confirm that the invitee is a qualified medical practitioner.";
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
      .post<{ id: string; referred_name: string; referred_contact: string; created_at: string }>(
        "/referrals",
        {
          referred_name: inviteName.trim() || inviteEmail.split("@")[0],
          referred_contact: inviteEmail.trim(),
          reason: `Ayurvedic physician referral: ${inviteSpecialty || "General"} · ${inviteCouncil || "State Council"}`,
        },
      )
      .then((res) => {
        setIsSubmitting(false);
        const record: DoctorReferral = {
          id: res.id,
          invitedEmail: res.referred_contact,
          invitedName: res.referred_name,
          invitedSpecialty: inviteSpecialty || undefined,
          invitedCouncil: inviteCouncil || undefined,
          notes: inviteNotes || undefined,
          dateInvited: res.created_at ? res.created_at.split("T")[0] : today(),
          statusUpdatedDate: res.created_at ? res.created_at.split("T")[0] : today(),
          status: "Invitation Sent",
          isDemoSample: false,
        };

        setState((s) => ({
          referrals: [record, ...s.referrals.filter((r) => r.id !== res.id)],
        }));
        setInviteSuccessId(record.id);

        // Reset form
        setInviteEmail("");
        setInviteName("");
        setInviteSpecialty("");
        setInviteCouncil("");
        setInviteNotes("");
        setAcknowledgedEligibility(false);

        toast.success("Invitation dispatched successfully", {
          description: `Referral ID: ${record.id} · Dispatched to ${record.invitedEmail}`,
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
        desc="Invite qualified Ayurvedic physicians to the Mey Veda Grantha early access cohort. Help expand our peer-reviewed classical clinical network."
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
                Mey Veda Grantha is a closed professional environment. Early access privileges are
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

      {/* Tab 2: Colleague Invitation Form */}
      {activeTab === "invite" && (
        <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
          <div className="panel p-6 space-y-5">
            <div className="border-b pb-4 space-y-1">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Nominate an Ayurvedic Colleague for Early Access
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Submit your colleague's professional details to issue a peer early access
                invitation. Our verification desk will review their AYUSH council affiliation.
              </p>
            </div>

            {inviteSuccessId && (
              <div className="rounded-xl border border-primary/30 bg-primary-soft/50 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Invitation Recorded
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Colleague invitation reference <code>{inviteSuccessId}</code> has been dispatched
                  and recorded in your local session. It is now listed under{" "}
                  <strong>Referral Records</strong>.
                </p>
                <div className="pt-2">
                  <Btn
                    variant="outline"
                    onClick={() => {
                      setInviteSuccessId(null);
                      updateSearch({ tab: "history" });
                    }}
                    className="text-xs"
                  >
                    View in Referral Records
                  </Btn>
                </div>
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
              <Field
                label="Colleague's Professional Email Address *"
                hint="Invitation and onboarding instructions will be addressed to this inbox"
                error={formErrors.email}
              >
                <input
                  type="email"
                  className={cn(inputCls, formErrors.email && "border-destructive")}
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="e.g. vaidya.sharma@ayurveda-institute.org"
                  aria-label="Colleague's email"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Colleague's Full Name (Optional)" hint="e.g. Dr. Rajesh K. Varma">
                  <input
                    className={inputCls}
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Dr. Rajesh K. Varma"
                    aria-label="Colleague's name"
                  />
                </Field>

                <Field
                  label="Primary Specialization / Branch (Optional)"
                  hint="e.g. Kayachikitsa, Dravyaguna"
                >
                  <input
                    className={inputCls}
                    value={inviteSpecialty}
                    onChange={(e) => setInviteSpecialty(e.target.value)}
                    placeholder="e.g. Dravyaguna Vijnana"
                    aria-label="Primary specialization"
                  />
                </Field>
              </div>

              <Field
                label="State AYUSH Council / Medical Board (Optional)"
                hint="e.g. Maharashtra Council of Indian Medicine, Delhi Bharatiya Chikitsa Parishad"
              >
                <input
                  className={inputCls}
                  value={inviteCouncil}
                  onChange={(e) => setInviteCouncil(e.target.value)}
                  placeholder="e.g. Maharashtra Council of Indian Medicine"
                  aria-label="State AYUSH Council"
                />
              </Field>

              <Field
                label="Clinical Context or Invitation Note (Optional)"
                hint="Brief note regarding research collaboration or shared clinical interests"
              >
                <textarea
                  rows={2}
                  className={inputCls}
                  value={inviteNotes}
                  onChange={(e) => setInviteNotes(e.target.value)}
                  placeholder="Collaborating on observational rasayana studies..."
                  aria-label="Invitation notes"
                />
              </Field>

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
                <span className="font-mono text-[10px]">Session ID: doc-ak-1</span>
              </div>

              {/* Eligibility Checkbox */}
              <div className="rounded-xl border border-amber-300 bg-amber-50/50 p-3.5 space-y-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer text-foreground font-medium">
                  <input
                    type="checkbox"
                    checked={acknowledgedEligibility}
                    onChange={(e) => {
                      setAcknowledgedEligibility(e.target.checked);
                      if (formErrors.eligibility) {
                        setFormErrors((prev) => ({ ...prev, eligibility: undefined }));
                      }
                    }}
                    className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>
                    I confirm that the nominee is a bona fide registered Ayurvedic practitioner
                    holding valid qualifications from an accredited institution.
                  </span>
                </label>
                {formErrors.eligibility && (
                  <p className="text-destructive font-semibold text-xs pl-6">
                    {formErrors.eligibility}
                  </p>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <Btn
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setInviteEmail("");
                    setInviteName("");
                    setInviteSpecialty("");
                    setInviteCouncil("");
                    setInviteNotes("");
                    setAcknowledgedEligibility(false);
                  }}
                >
                  Clear Form
                </Btn>
                <Btn type="submit" disabled={isSubmitting} className="gap-2">
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Dispatching Invitation…" : "Send Early Access Invitation"}
                </Btn>
              </div>
            </form>
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
