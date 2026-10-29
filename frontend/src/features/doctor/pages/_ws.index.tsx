import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Share2,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  ClipboardList,
  CheckCircle2,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { VerificationBadge } from "@/components/ui-kit";
import { useStore, getState } from "@/lib/store";
import { seo } from "@/lib/seo";
import { apiClient } from "@/services/apiClient";
import { toast } from "sonner";
import dhanvantari from "@/assets/Dhanvantari2.png";

export const Route = createFileRoute("/_ws/")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("meyveda_auth_token");
    const signedIn = getState().signedIn;
    if (!token && !signedIn) {
      throw redirect({ to: "/login", search: { portal: "doctor" }, replace: true });
    }
  },
  head: () =>
    seo(
      "Doctor Workspace | Mey Veda Grantha",
      "Practitioner registration dashboard, unique referral invite link, and early access onboarding.",
    ),
  component: Home,
});

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function familiarName(name: string) {
  const given = name
    .replace(/^Dr\.?\s+/i, "")
    .split(" ")
    .filter(Boolean)[0];
  if (!given) return name;
  return /^Dr\.?\s+/i.test(name) ? `Dr. ${given}` : given;
}

export function Home() {
  const doctor = useStore((s) => s.doctor);
  const now = new Date();

  // Unique invite code: 3 uppercase letters + 2 numbers (e.g. MSV77)
  const defaultCode = (doctor as any)?.inviteCode || "MSV77";
  const [inviteCode, setInviteCode] = useState<string>(defaultCode);
  const [referralCount, setReferralCount] = useState<number>(0);
  const [totalRewards, setTotalRewards] = useState<number>(0);
  const [joinedDoctors, setJoinedDoctors] = useState<Array<{
    id: string;
    name: string;
    qualification?: string;
    status: string;
    registered_at: string;
  }>>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch live referral summary and invite code from backend
  useEffect(() => {
    let active = true;
    async function fetchReferralSummary() {
      try {
        const res = await apiClient.get<{
          invite_code: string;
          invite_url: string;
          referral_count: number;
          total_rewards: number;
          joined_doctors?: Array<{
            id: string;
            name: string;
            qualification?: string;
            status: string;
            registered_at: string;
          }>;
        }>("/referrals/my-summary");

        if (active && res) {
          if (res.invite_code) setInviteCode(res.invite_code);
          setReferralCount(res.referral_count || 0);
          setTotalRewards(res.total_rewards || 0);
          if (res.joined_doctors) setJoinedDoctors(res.joined_doctors);
        }
      } catch {
        // Fallback to doctor profile or stored data
        if ((doctor as any)?.invite_code) {
          setInviteCode((doctor as any).invite_code);
        }
      }
    }
    fetchReferralSummary();
    return () => {
      active = false;
    };
  }, [doctor]);

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  const fullInviteUrl = `${origin}/register?ref=${inviteCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullInviteUrl);
    setCopiedLink(true);
    toast.success("Invite link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    toast.success(`Invite code ${inviteCode} copied!`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const shareText = encodeURIComponent(
    `Namaste Doctor, I invite you to join Mey Veda Grantha — verified AYUSH clinical network & research repository. Register with my invite code ${inviteCode}: ${fullInviteUrl}`,
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8 space-y-6">
      {/* 1. Minimal Header Greeting */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-white p-6 md:p-8 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium">
                {now.toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
              <VerificationBadge status={doctor.verification} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {greetingFor(now)}, {familiarName(doctor.name)}.
            </h1>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              Welcome to the Mey Veda Grantha early practitioner network. Share your exclusive invite link with fellow AYUSH doctors to unlock early access rewards.
            </p>
          </div>

          {/* Lord Dhanvantari Icon */}
          <div className="relative flex shrink-0 items-center justify-center self-center pointer-events-none select-none">
            <div className="hero-dhanvantari-float motion-reduce:animate-none">
              <img
                src={dhanvantari}
                alt="Lord Dhanvantari"
                className="h-28 w-28 md:h-32 md:w-32 object-contain drop-shadow-sm"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Prominent Invite Link & Referral Code Card */}
      <section className="rounded-2xl border-2 border-primary/30 bg-card p-6 md:p-8 shadow-soft space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-2">
              <Sparkles className="h-3.5 w-3.5" /> Exclusive Practitioner Invite
            </div>
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">
              Your Unique Referral Invite Link
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Invite AYUSH doctors (BAMS, BSMS, BNYS, BHMS, BUMS). Once they complete registration with your unique code, your referral reward is recorded.
            </p>
          </div>

          {/* Unique 5-char code display (3 letters + 2 numbers) */}
          <div className="flex flex-col items-center sm:items-end">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Your Invite Code
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="rounded-xl border border-primary/40 bg-primary-soft px-4 py-2 font-mono text-2xl font-black tracking-widest text-primary shadow-xs">
                {inviteCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                title="Copy code"
              >
                {copiedCode ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Invite URL Copy & WhatsApp Share Box */}
        <div className="rounded-xl border border-border bg-background p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                readOnly
                value={fullInviteUrl}
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 font-mono text-xs text-foreground focus:outline-none select-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4" /> Copied Link
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copy Link
                  </>
                )}
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" /> Share
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Minimal Stats Grid: Referrals & Recorded Rewards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Doctors Registered
            </span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {referralCount}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Colleagues joined with your code
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Referral Rewards Recorded
            </span>
            <Award className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {totalRewards} pts
          </div>
          <p className="text-[11px] text-muted-foreground">
            10 points recorded per doctor
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Early Access Tier
            </span>
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-foreground">
            Priority Beta Group
          </div>
          <p className="text-[11px] text-muted-foreground">
            Early access to monographs & research
          </p>
        </div>
      </div>

      {/* 4. Doctors Joined via your Invite Code */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Registered Colleagues ({joinedDoctors.length})
          </h3>
          <Link
            to="/referrals"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            View Referrals & Early Access <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {joinedDoctors.length > 0 ? (
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {joinedDoctors.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3.5 bg-background hover:bg-card transition-colors">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-foreground">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.qualification || "AYUSH"} • Registered {doc.registered_at}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {doc.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-2">
            <Users className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
            <p className="text-sm font-semibold text-foreground">No doctors registered with your code yet</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Share your invite link above with fellow doctors. Once they complete registration using your code {inviteCode}, their name and your reward will appear here.
            </p>
          </div>
        )}
      </section>

      {/* 5. Minimal Survey Link Banner */}
      <section className="rounded-2xl border border-primary/20 bg-primary-soft/30 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Practitioner Clinical Survey
              </h4>
              <p className="text-xs text-muted-foreground">
                Participate in tailoring the clinical intelligence and pharmacovigilance modules.
              </p>
            </div>
          </div>
          <Link
            to="/survey"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            Open Survey <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
