import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/portal/brand";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/admin/ui";
import {
  seedReferralScores,
  type DoctorReferralScore,
  type ReferralPeriod,
} from "@/features/admin/referral-data";
import {
  BackButton,
  DetailSection,
  MetaList,
  SearchField,
  SelectField,
  SummaryRow,
} from "@/features/admin/fields";
import {
  Award,
  TrendingUp,
  Users,
  Calendar,
  Info,
  CheckCircle2,
  Mail,
  Phone,
  UserPlus,
  RefreshCw,
  Send,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Clock,
  ChevronRight,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCatalog } from "@/features/admin/catalog-state";
import { doctorSlugMap } from "@/features/admin/doctor-slug";
import { apiClient } from "@/services/apiClient";
import { copyToClipboard } from "@/lib/clipboard";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface ColleagueInvitation {
  id: string;
  referring_doctor_id?: string | null;
  inviting_doctor_name: string;
  inviting_doctor_qualification?: string | null;
  invite_code: string;
  colleague_name: string;
  colleague_email: string;
  colleague_mobile: string;
  qualification: string;
  status: string;
  email_dispatched: boolean;
  registration_url?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ColleagueInvitationStats {
  total_invitations: number;
  registered_count: number;
  verified_count: number;
  email_dispatched_count: number;
}

export function ReferralScoresPage() {
  const { doctors } = useCatalog();
  const doctorSlugs = useMemo(() => doctorSlugMap(doctors), [doctors]);

  // Main Tab State: "invitations" | "leaderboard"
  const [activeTab, setActiveTab] = useState<"invitations" | "leaderboard">("invitations");

  // Colleague Invitations State (Live Database Table)
  const [invitations, setInvitations] = useState<ColleagueInvitation[]>([]);
  const [invitationStats, setInvitationStats] = useState<ColleagueInvitationStats>({
    total_invitations: 0,
    registered_count: 0,
    verified_count: 0,
    email_dispatched_count: 0,
  });
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteStatusFilter, setInviteStatusFilter] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedInvite, setSelectedInvite] = useState<ColleagueInvitation | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Leaderboard State
  const [scores] = useState<DoctorReferralScore[]>(seedReferralScores);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<ReferralPeriod>("Last 30 Days");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchInvitations = async () => {
    setLoadingInvitations(true);
    try {
      const params = new URLSearchParams();
      if (inviteSearch.trim()) params.append("q", inviteSearch.trim());
      if (inviteStatusFilter !== "All") params.append("status", inviteStatusFilter);

      const endpoint = `/admin/invitations${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await apiClient.get<{
        items: ColleagueInvitation[];
        total: number;
        stats: ColleagueInvitationStats;
      }>(endpoint);

      if (res && Array.isArray(res.items)) {
        setInvitations(res.items);
        if (res.stats) {
          setInvitationStats(res.stats);
        }
      }
    } catch (err: any) {
      console.warn("Failed to fetch colleague invitations from database:", err?.message || err);
    } finally {
      setLoadingInvitations(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [inviteSearch, inviteStatusFilter]);

  const handleCopyLink = async (inv: ColleagueInvitation) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const link =
      inv.registration_url ||
      `${origin}/register?ref=${inv.invite_code}&name=${encodeURIComponent(inv.colleague_name)}&email=${encodeURIComponent(inv.colleague_email)}&mobile=${encodeURIComponent(inv.colleague_mobile)}&qualification=${encodeURIComponent(inv.qualification)}`;
    const success = await copyToClipboard(link);
    if (success) {
      setCopiedId(inv.id);
      toast.success("1-Click registration link copied to clipboard!", {
        description: `Custom invite link with code ${inv.invite_code} for Dr. ${inv.colleague_name}.`,
      });
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleResendInvite = async (inv: ColleagueInvitation) => {
    setResendingId(inv.id);
    try {
      await apiClient.post(`/admin/invitations/${inv.id}/resend`, {});
      toast.success("Official invitation email re-dispatched!", {
        description: `Delivered to ${inv.colleague_name} (${inv.colleague_email}) with code ${inv.invite_code}.`,
      });
      fetchInvitations();
    } catch (err: any) {
      toast.error(err?.message || "Failed to resend invitation email.");
    } finally {
      setResendingId(null);
    }
  };

  const handleUpdateStatus = async (invId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/admin/invitations/${invId}/status`, { status: newStatus });
      toast.success(`Invitation status updated to '${newStatus}'`);
      fetchInvitations();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update invitation status.");
    }
  };

  const selected = scores.find((s) => s.doctorId === selectedId) ?? null;

  const states = useMemo(() => {
    return Array.from(new Set(scores.map((s) => s.state))).sort();
  }, [scores]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scores.filter((item) => {
      const haystack = `${item.doctorId} ${item.doctorName} ${item.specialization} ${item.state} ${item.district}`.toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (selectedState !== "all" && item.state !== selectedState) return false;
      return true;
    });
  }, [scores, query, selectedState]);

  const topDoctor = scores[0];
  const totalVerifiedReferrals = scores.reduce((acc, s) => acc + s.verifiedReferrals, 0);
  const totalConsultationsRecorded = scores.reduce((acc, s) => acc + s.totalConsultations, 0);

  if (selected) {
    return (
      <ReferralDoctorDetailView
        score={selected}
        doctorSlug={doctorSlugs.get(selected.doctorId)}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  const leaderboardColumns: Column<DoctorReferralScore>[] = [
    {
      header: "Rank",
      cell: (row) => (
        <span
          className={`inline-flex items-center justify-center h-6 w-6 rounded-full font-bold text-xs ${
            row.ranking === 1
              ? "bg-amber-100 text-amber-800 ring-2 ring-amber-400"
              : row.ranking === 2
                ? "bg-slate-200 text-slate-800 ring-1 ring-slate-400"
                : row.ranking === 3
                  ? "bg-amber-50 text-amber-900 border border-amber-300"
                  : "bg-muted text-muted-foreground"
          }`}
        >
          {row.ranking}
        </span>
      ),
    },
    {
      header: "Doctor",
      cell: (row) => (
        <div>
          <span className="font-semibold text-foreground line-clamp-1">{row.doctorName}</span>
          <span className="text-xs text-muted-foreground block">
            {row.doctorId} · {row.specialization}
          </span>
        </div>
      ),
    },
    {
      header: "Location",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.district}, {row.state}
        </span>
      ),
    },
    {
      header: "Verified Referrals",
      cell: (row) => <span className="font-medium text-foreground">{row.verifiedReferrals}</span>,
    },
    {
      header: "Consultations",
      cell: (row) => <span className="text-muted-foreground">{row.totalConsultations}</span>,
    },
    {
      header: "Calculated Score",
      cell: (row) => (
        <span className="font-bold text-primary font-mono text-base">{row.score} pts</span>
      ),
    },
    {
      header: "Action",
      cell: (row) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(row.doctorId);
          }}
        >
          View Breakdown
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Colleague Invitations & Referrals"
          subtitle="Real-time database records of doctor colleague nominations, official invite dispatches, and clinical ranking scores."
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchInvitations}
            disabled={loadingInvitations}
            className="gap-2 shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${loadingInvitations ? "animate-spin" : ""}`} />
            <span>Refresh Records</span>
          </Button>
        </div>
      </div>

      {/* Tabs Switcher: Invitations (Default) vs Leaderboard */}
      <div className="flex border-b border-border gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("invitations")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === "invitations"
              ? "border-[#E67230] text-[#E67230]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserPlus className="h-4 w-4" />
          <span>Colleague Invitations</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#E67230]/10 text-[#E67230]">
            {invitations.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("leaderboard")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === "leaderboard"
              ? "border-[#E67230] text-[#E67230]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Referral Scores Leaderboard</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: COLLEAGUE INVITATIONS (FETCHED FROM DATABASE)              */}
      {/* ================================================================= */}
      {activeTab === "invitations" && (
        <div className="space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
              <span className="text-xs text-muted-foreground font-medium block">Total Invitations</span>
              <div className="text-2xl font-extrabold text-foreground font-mono">
                {invitationStats.total_invitations || invitations.length}
              </div>
              <p className="text-[11px] text-muted-foreground">Stored in database</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
              <span className="text-xs text-muted-foreground font-medium block">Emails Dispatched</span>
              <div className="text-2xl font-extrabold text-foreground font-mono">
                {invitationStats.email_dispatched_count}
              </div>
              <p className="text-[11px] text-muted-foreground">Automated delivery recorded</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
              <span className="text-xs text-muted-foreground font-medium block">Registered Accounts</span>
              <div className="text-2xl font-extrabold text-blue-600 font-mono">
                {invitationStats.registered_count}
              </div>
              <p className="text-[11px] text-muted-foreground">Via colleague invite link</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
              <span className="text-xs text-muted-foreground font-medium block">Council Verified</span>
              <div className="text-2xl font-extrabold text-[#E67230] font-mono">
                {invitationStats.verified_count}
              </div>
              <p className="text-[11px] text-muted-foreground">AYUSH credential verified</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <SearchField
                label="Search Invitations"
                value={inviteSearch}
                onChange={setInviteSearch}
                placeholder="Search colleague name, email, mobile, doctor, code..."
              />
            </div>
            <div className="w-full sm:w-56">
              <SelectField
                label="Filter by Status"
                value={inviteStatusFilter}
                onChange={setInviteStatusFilter}
                options={[
                  { value: "All", label: "All Statuses" },
                  { value: "Invitation Sent", label: "Invitation Sent" },
                  { value: "Registered", label: "Registered" },
                  { value: "Council Verified", label: "Council Verified" },
                  { value: "Access Active", label: "Access Active" },
                ]}
              />
            </div>
          </div>

          {/* Database Records Table */}
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Saved Colleague Invitations ({invitations.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Official colleague nomination records recorded in backend database table <code className="text-[#E67230] font-mono">colleague_invitations</code>.
                </p>
              </div>
            </div>

            {loadingInvitations ? (
              <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-[#E67230]" />
                <span>Fetching invitation records from database...</span>
              </div>
            ) : invitations.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">No colleague invitations found</p>
                <p className="mt-1 text-xs">
                  {inviteSearch || inviteStatusFilter !== "All"
                    ? "Try adjusting your search criteria or filter."
                    : "Doctor colleague invitations submitted via the workspace will appear here in real time."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/30 font-semibold text-muted-foreground">
                      <th className="px-4 py-3">Colleague / Invitee</th>
                      <th className="px-4 py-3">Mobile Number</th>
                      <th className="px-4 py-3">Qualification</th>
                      <th className="px-4 py-3">Invited By (Doctor)</th>
                      <th className="px-4 py-3">Invite Code</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Email Dispatched</th>
                      <th className="px-4 py-3">Date Dispatched</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {invitations.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedInvite(inv)}
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                            <span>Dr. {inv.colleague_name}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                            <Mail className="size-3 text-muted-foreground/70" />
                            <span>{inv.colleague_email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-foreground font-mono">
                          <div className="flex items-center gap-1">
                            <Phone className="size-3 text-muted-foreground" />
                            <span>{inv.colleague_mobile || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium text-[11px]">
                            <GraduationCap className="size-3 text-primary" />
                            <span>{inv.qualification}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-foreground block">
                            {inv.inviting_doctor_name}
                          </span>
                          {inv.inviting_doctor_qualification && (
                            <span className="text-[10px] text-muted-foreground">
                              {inv.inviting_doctor_qualification}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            {inv.invite_code}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === "Council Verified" || inv.status === "Access Active"
                                ? "bg-primary/10 text-primary border border-primary/25"
                                : inv.status === "Registered"
                                  ? "bg-secondary text-secondary-foreground border border-border"
                                  : "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            <span className="size-1.5 rounded-full bg-current" />
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {inv.email_dispatched ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-foreground font-medium">
                              <CheckCircle2 className="size-3.5 text-primary" />
                              <span>Dispatched</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Queued</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground text-[11px] whitespace-nowrap">
                          {inv.created_at ? new Date(inv.created_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }) : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs gap-1"
                              onClick={() => handleCopyLink(inv)}
                              title="Copy 1-click registration URL"
                            >
                              {copiedId === inv.id ? (
                                <>
                                  <Check className="size-3 text-primary" />
                                  <span className="text-primary font-bold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3" />
                                  <span>Link</span>
                                </>
                              )}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs gap-1"
                              disabled={resendingId === inv.id}
                              onClick={() => handleResendInvite(inv)}
                              title="Resend invitation email"
                            >
                              <Send className={`size-3 ${resendingId === inv.id ? "animate-spin" : ""}`} />
                              <span>Resend</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: REFERRAL SCORES & LEADERBOARD                              */}
      {/* ================================================================= */}
      {activeTab === "leaderboard" && (
        <div className="space-y-6">
          <SummaryRow
            items={[
              {
                label: "Top Ranked Practitioner",
                value: topDoctor ? topDoctor.doctorName.split(" ")[1] ?? topDoctor.doctorName : "—",
              },
              {
                label: "Total Verified Referrals",
                value: totalVerifiedReferrals,
              },
              {
                label: "Total Consultations",
                value: totalConsultationsRecorded,
              },
              {
                label: "Scoring Formula",
                value: "10x Ref + 2x Consult",
              },
            ]}
          />

          {/* Formula Clarification Box */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground block font-semibold mb-0.5">
                Transparent Score Calculation Rule
              </strong>
              Scores are computed objectively as:{" "}
              <code className="text-primary font-mono font-semibold">
                Score = (Verified Referrals × 10) + (Consultations × 2)
              </code>
              . Calculation Period: <span className="font-medium text-foreground">{period}</span> (Last updated: 19 Oct 2026).
            </div>
          </div>

          <section className="card-surface mt-5">
            <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-3">
              <div>
                <SearchField
                  label="Search Doctor"
                  value={query}
                  onChange={setQuery}
                  placeholder="Doctor name, ID, or location..."
                />
              </div>
              <SelectField
                label="Territory / State"
                value={selectedState}
                onChange={setSelectedState}
                options={[
                  { value: "all", label: "All Territories" },
                  ...states.map((st) => ({ value: st, label: st })),
                ]}
              />
              <SelectField
                label="Evaluation Period"
                value={period}
                onChange={(val) => setPeriod(val as ReferralPeriod)}
                options={[
                  { value: "Last 30 Days", label: "Last 30 Days (Active)" },
                  { value: "Last 90 Days", label: "Last 90 Days" },
                  { value: "Current Year", label: "Current Year (2026)" },
                  { value: "All Time", label: "All Time" },
                ]}
              />
            </div>

            <DataTable
              key={`${query}|${selectedState}|${period}`}
              rows={filteredRows}
              columns={leaderboardColumns}
              onRowClick={(row) => setSelectedId(row.doctorId)}
              pageSize={6}
            />
          </section>
        </div>
      )}

      {/* Colleague Invitation Record Details Modal */}
      <Dialog open={!!selectedInvite} onOpenChange={(open) => !open && setSelectedInvite(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#E67230]" />
              Colleague Invitation Record
            </DialogTitle>
            <DialogDescription>
              Database record details stored in <code className="text-[#E67230]">colleague_invitations</code>
            </DialogDescription>
          </DialogHeader>

          {selectedInvite && (
            <div className="space-y-4 text-sm pt-2">
              <div className="p-3.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Unique Record ID</p>
                  <p className="font-mono text-xs font-bold text-foreground">{selectedInvite.id}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E67230]/10 text-[#E67230]">
                  Code: {selectedInvite.invite_code}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <span className="text-xs text-muted-foreground block">Colleague Full Name</span>
                  <span className="font-bold text-foreground">Dr. {selectedInvite.colleague_name}</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <span className="text-xs text-muted-foreground block">Medical Qualification</span>
                  <span className="font-semibold text-foreground">{selectedInvite.qualification}</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <span className="text-xs text-muted-foreground block">Colleague Email</span>
                  <span className="font-mono text-xs text-foreground">{selectedInvite.colleague_email}</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <span className="text-xs text-muted-foreground block">Mobile Number</span>
                  <span className="font-mono text-xs text-foreground">{selectedInvite.colleague_mobile || "—"}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card space-y-1.5">
                <span className="text-xs text-muted-foreground block">Inviting Practitioner</span>
                <p className="font-bold text-foreground">
                  {selectedInvite.inviting_doctor_name}
                  {selectedInvite.inviting_doctor_qualification && ` (${selectedInvite.inviting_doctor_qualification})`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Invite Code: <strong className="text-primary font-mono">{selectedInvite.invite_code}</strong>
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">1-Click Registration Link</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[11px] px-2 gap-1"
                    onClick={() => handleCopyLink(selectedInvite)}
                  >
                    <Copy className="size-3" />
                    <span>Copy</span>
                  </Button>
                </div>
                <input
                  readOnly
                  value={
                    selectedInvite.registration_url ||
                    `${window.location.origin}/register?ref=${selectedInvite.invite_code}`
                  }
                  className="w-full text-xs font-mono bg-muted/50 p-2 rounded border border-border"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <select
                    value={selectedInvite.status}
                    onChange={(e) => handleUpdateStatus(selectedInvite.id, e.target.value)}
                    className="text-xs font-bold border border-border rounded px-2 py-1 bg-background"
                  >
                    <option value="Invitation Sent">Invitation Sent</option>
                    <option value="Registered">Registered</option>
                    <option value="Council Verified">Council Verified</option>
                    <option value="Access Active">Access Active</option>
                  </select>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleResendInvite(selectedInvite)}
                  disabled={resendingId === selectedInvite.id}
                  className="gap-1.5 bg-[#E67230] hover:bg-[#D15F1F]"
                >
                  <Send className="size-3.5" />
                  <span>Resend Email</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReferralDoctorDetailView({
  score,
  doctorSlug,
  onBack,
}: {
  score: DoctorReferralScore;
  doctorSlug?: string | undefined;
  onBack: () => void;
}) {
  return (
    <div>
      <PageHeader
        title="Doctor Referral Analytics"
        subtitle="Individual clinical referral points breakdown, consultation count, and audit trail."
      />
      <div className="flex items-center justify-between gap-4 mt-2 mb-4">
        <BackButton onClick={onBack} label="Back to Leaderboard" />
        {doctorSlug && (
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/doctors/$doctorSlug" params={{ doctorSlug }}>
              View Doctor Verification Profile
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Rank #{score.ranking} on Platform Leaderboard
          </span>
          <h2 className="type-record mt-1">{score.doctorName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {score.doctorId} · {score.specialization} · {score.district}, {score.state}
          </p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-extrabold text-primary font-mono">{score.score}</span>
          <span className="block text-xs text-muted-foreground uppercase tracking-wide">
            Total Points
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <DetailSection title="Score Formula Computation Breakdown">
          <MetaList
            rows={[
              { label: "Doctor ID", value: score.doctorId },
              { label: "Active Ranking Period", value: score.period },
              {
                label: "Verified Patient Referrals",
                value: `${score.verifiedReferrals} referrals (× 10 = ${score.verifiedReferrals * 10} pts)`,
              },
              {
                label: "Completed Clinical Consultations",
                value: `${score.totalConsultations} sessions (× 2 = ${score.totalConsultations * 2} pts)`,
              },
              {
                label: "Aggregate Score",
                value: (
                  <span className="font-bold text-primary font-mono text-base">
                    {score.score} points
                  </span>
                ),
              },
              { label: "Last Computed Timestamp", value: `${score.lastUpdated} 04:00 AM UTC` },
            ]}
          />
        </DetailSection>

        <DetailSection title="Underlying Verified Referral Records">
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="px-4 py-3">Patient Ref ID</th>
                  <th className="px-4 py-3">Consultation Type</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {score.breakdown.map((item) => (
                  <tr key={item.patientRefId} className="hover:bg-surface/50">
                    <td className="px-4 py-3 font-mono font-medium">{item.patientRefId}</td>
                    <td className="px-4 py-3">{item.consultationType}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.date}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        <CheckCircle2 className="h-3 w-3" />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold font-mono text-primary">
                      +{item.pointsAwarded}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DetailSection>
      </div>
    </div>
  );
}
