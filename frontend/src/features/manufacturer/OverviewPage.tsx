import { Link } from "@tanstack/react-router";
import { Package, ArrowRight } from "lucide-react";
import { PageHeader, MetricCard, StatusPill } from "@/components/portal/brand";
import { useManufacturer } from "./manufacturer-context";

export const OverviewPage: React.FC = () => {
  const { products, doctorResponses, doctorFeedback, territoryInsights, adrReports, profile } =
    useManufacturer();

  // Summary Metrics calculated dynamically from current state
  const totalProducts = products.length;
  const approvedProducts = products.filter((p) => p.status === "Approved").length;
  const productsUnderReview = products.filter(
    (p) => p.status === "Under Review" || p.status === "Submitted",
  ).length;
  const productsRequiringCorrections = products.filter(
    (p) => p.status === "Changes Requested",
  ).length;
  const totalResponses = doctorResponses.length;
  const unresolvedFeedback = doctorFeedback.filter(
    (fb) => fb.status === "Open" || fb.status === "In Review",
  ).length;

  // Active ADR requiring follow-up
  const pendingADRCount = adrReports.filter(
    (a) => a.followUpStatus === "Pending Manufacturer Response",
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Manufacturer Overview"
        action={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success-soft px-3 py-1 text-xs font-semibold text-success">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              AYUSH Form 25D Verified
            </span>
            <Link
              to="/manufacturer/products"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90"
            >
              <Package className="h-4 w-4" />
              Manage Products
            </Link>
          </div>
        }
      />

      {/* Summary Cards (clean, uncrowded, without icons or extra sub-descriptions) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Total Products" value={totalProducts} />
        <MetricCard title="Approved Products" value={approvedProducts} />
        <MetricCard title="Under Review" value={productsUnderReview} />
        <MetricCard title="Requiring Corrections" value={productsRequiringCorrections} />
        <MetricCard title="Doctor Responses" value={totalResponses} />
        <MetricCard title="Unresolved Feedback" value={unresolvedFeedback} />
      </div>

      {/* Action Banner if any products require correction or ADR response */}
      {(productsRequiringCorrections > 0 || pendingADRCount > 0) && (
        <div className="rounded-2xl border border-warning/30 bg-warning-soft/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-foreground">
              Action Items Awaiting Manufacturer Response
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {productsRequiringCorrections > 0 &&
                `${productsRequiringCorrections} product submission(s) require technical revisions. `}
              {pendingADRCount > 0 &&
                `${pendingADRCount} adverse event report(s) request QC batch verification.`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {productsRequiringCorrections > 0 && (
              <Link
                to="/manufacturer/products"
                className="rounded-lg bg-warning px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-warning/90 transition-colors"
              >
                Review Corrections
              </Link>
            )}
            {pendingADRCount > 0 && (
              <Link
                to="/manufacturer/adr-reports"
                className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface transition-colors"
              >
                View ADR Inquiries
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Left Column (Recent Products & Doctor Responses) | Right Column (Territory, ADR, Profile) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols wide) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent Product Submissions */}
          <div className="card-surface p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="type-section">Recent Product Submissions</h2>
              <Link
                to="/manufacturer/products"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-border/60">
              {products.slice(0, 4).map((product) => {
                const getTone = (st: string): "sage" | "info" | "warning" | "danger" | "muted" => {
                  switch (st) {
                    case "Approved":
                      return "sage";
                    case "Under Review":
                      return "info";
                    case "Changes Requested":
                      return "warning";
                    case "Rejected":
                      return "danger";
                    default:
                      return "muted";
                  }
                };

                return (
                  <div
                    key={product.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2 hover:bg-surface/40 px-2 rounded-lg transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-foreground">{product.name}</p>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          ({product.productCode})
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {product.category} • {product.strength}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-medium text-foreground">{product.lastUpdated}</p>
                      </div>
                      <StatusPill tone={getTone(product.status)}>{product.status}</StatusPill>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Doctor Responses */}
          <div className="card-surface p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="type-section">Recently Received Doctor Responses</h2>
              <Link
                to="/manufacturer/doctor-responses"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {doctorResponses.slice(0, 3).map((resp) => (
                <div
                  key={resp.id}
                  className="rounded-xl border border-border bg-secondary/50 p-4 transition-all hover:bg-surface"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {resp.doctorDisplayName}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        • {resp.doctorSpecialty}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{resp.responseDate}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                      {resp.productName}
                    </span>
                    <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {resp.category}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                    "{resp.summary}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Doctor Feedback */}
          <div className="card-surface p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="type-section">Recent Formulation Feedback</h2>
              <Link
                to="/manufacturer/doctor-feedback"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {doctorFeedback.slice(0, 3).map((fb) => (
                <div
                  key={fb.id}
                  className="flex items-start justify-between rounded-xl border border-border p-3.5 hover:bg-surface/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-foreground">{fb.productName}</p>
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted-foreground font-mono">
                        {fb.id}
                      </span>
                    </div>
                    <p className="text-xs text-foreground leading-normal">{fb.summary}</p>
                    <p className="text-[11px] text-muted-foreground">
                      From {fb.doctorDisplayName} ({fb.doctorLocation})
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusPill
                      tone={
                        fb.status === "Resolved"
                          ? "sage"
                          : fb.status === "Manufacturer Responded"
                            ? "info"
                            : "warning"
                      }
                    >
                      {fb.status}
                    </StatusPill>
                    <p className="text-[10px] text-muted-foreground mt-1">{fb.feedbackDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col wide) */}
        <div className="space-y-6">
          {/* Territory Interest Summary */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="type-name">Territory Interest</h3>
              <Link
                to="/manufacturer/territory-insights"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Insights
              </Link>
            </div>

            <div className="space-y-3">
              {territoryInsights.slice(0, 4).map((ter) => (
                <div
                  key={ter.id}
                  className="rounded-xl border border-border/80 bg-secondary/40 p-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{ter.state}</span>
                    <span className="font-bold text-primary">
                      {ter.interestedDoctorsCount} Doctors
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Regular Prescribers: {ter.regularPrescribersCount}</span>
                    <span className="text-success font-medium">
                      {ter.trendingDirection === "up" ? "▲ Growing" : "● Stable"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent ADR Summary */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="type-name text-destructive">ADR Reports Summary</h3>
              <Link
                to="/manufacturer/adr-reports"
                className="text-xs font-semibold text-primary hover:underline"
              >
                View
              </Link>
            </div>

            <div className="space-y-2.5">
              {adrReports.map((adr) => (
                <div
                  key={adr.id}
                  className="rounded-xl border border-border/80 p-3 bg-white hover:bg-surface/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-foreground">{adr.id}</span>
                    <StatusPill
                      tone={
                        adr.severity === "Moderate"
                          ? "warning"
                          : adr.severity === "Severe"
                            ? "danger"
                            : "muted"
                      }
                    >
                      {adr.severity}
                    </StatusPill>
                  </div>
                  <p className="mt-1 text-xs font-medium text-foreground">{adr.productName}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Batch: {adr.batchNumber} • {adr.reportDate}
                  </p>
                  <div className="mt-2 text-[11px] font-semibold text-primary">
                    {adr.followUpStatus}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Profile Completion Status */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="type-name">Profile & Verification</h3>
              <Link
                to="/manufacturer/profile"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Edit
              </Link>
            </div>
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span>Dossier Completion</span>
                <span className="text-primary">{profile.profileCompletionPercentage}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-gradient-brand rounded-full transition-all duration-500"
                  style={{ width: `${profile.profileCompletionPercentage}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 text-xs border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Form 25D Lic:</span>
                <span className="font-mono text-foreground">{profile.form25DNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GSTIN:</span>
                <span className="font-mono text-foreground">{profile.gstin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verification:</span>
                <span className="font-semibold text-success">{profile.verificationStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
