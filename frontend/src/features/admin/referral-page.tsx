import { useMemo, useState } from "react";
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
import { Award, TrendingUp, Users, Calendar, Info, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCatalog } from "@/features/admin/catalog-state";
import { doctorSlugMap } from "@/features/admin/doctor-slug";

export function ReferralScoresPage() {
  const { doctors } = useCatalog();
  const doctorSlugs = useMemo(() => doctorSlugMap(doctors), [doctors]);

  const [scores] = useState<DoctorReferralScore[]>(seedReferralScores);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<ReferralPeriod>("Last 30 Days");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const columns: Column<DoctorReferralScore>[] = [
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
    <div>
      <PageHeader
        title="Referral scores"
        subtitle="Transparent practitioner engagement metrics, clinical referral tracking, and verified partner rankings."
      />

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

      {/* Transparent Formula Clarification Box */}
      <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-muted-foreground">
          <strong className="text-foreground block font-semibold mb-0.5">
            Transparent Score Calculation Rule
          </strong>
          Scores are computed objectively as:{" "}
          <code className="text-primary font-mono font-semibold">
            Score = (Verified Referrals × 10) + (Consultations × 2)
          </code>
          . Calculation Period: <span className="font-medium text-foreground">{period}</span> (Last
          updated: 19 Oct 2026).
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
          columns={columns}
          onRowClick={(row) => setSelectedId(row.doctorId)}
          pageSize={6}
        />
      </section>
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
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
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
