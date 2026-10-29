import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { PageHeader, StatusPill, focusRing } from "@/components/portal/brand";
import { Button } from "@/components/ui/button";
import { type DoctorStatus } from "@/features/admin/catalog-data";
import { useCatalog } from "@/features/admin/catalog-state";
import { DoctorPlatformUsage } from "@/features/admin/doctor-usage-panel";
import {
  actionQueue,
  quickActions,
  recentActivity,
  summaryCards,
  visibleActionCount,
} from "@/features/admin/dashboard-data";
import { cn } from "@/lib/utils";

const doctorOverviewCards: { label: string; status?: DoctorStatus }[] = [
  { label: "Registered Doctors" },
  { label: "Doctors Under Review", status: "Under Review" },
  { label: "Verified Doctors", status: "Verified" },
];

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export const Route = createFileRoute("/admin/home")({
  head: () => ({
    meta: [
      { title: "Overview — Meyveda Grantha" },
      {
        name: "description",
        content: "Your overview of Ayurveda platform operations and reviews.",
      },
      { property: "og:title", content: "Overview — Meyveda Grantha" },
      {
        property: "og:description",
        content: "Your overview of Ayurveda platform operations and reviews.",
      },
    ],
  }),
  component: HomePage,
});

export function HomePage() {
  const { doctors, manufacturers, medicines } = useCatalog();
  const [showQueue, setShowQueue] = useState(false);
  const [greeting] = useState(() => getTimeGreeting());
  const visibleActions = showQueue ? actionQueue : actionQueue.slice(0, visibleActionCount);
  const hiddenCount = actionQueue.length - visibleActionCount;

  // Live-derived KPIs matching the official Overview summary metrics:
  // 1. Registered Doctors
  const registeredDoctors = doctors.length;
  // 2. Verified Doctors
  const verifiedDoctors = doctors.filter((d) => d.status === "Verified").length;
  // 3. Registered Manufacturers
  const registeredManufacturers = manufacturers.length;
  // 4. Verified Manufacturers
  const verifiedManufacturers = manufacturers.filter((m) => m.status === "Verified").length;
  // 5. Approved Products
  const approvedProducts = medicines.filter((m) =>
    m.versions.some((v) => v.status === "Approved"),
  ).length;

  const kpiCards = [
    {
      id: "reg-docs",
      label: "Registered Doctors",
      count: registeredDoctors,
      description: "All practitioners with an application profile on record",
      trend: "+12% this month",
      to: "/admin/doctors" as const,
      search: {},
    },
    {
      id: "verified-docs",
      label: "Verified Doctors",
      count: verifiedDoctors,
      description: "Active council-verified practitioner accounts",
      trend: "100% credential match",
      to: "/admin/doctors" as const,
      search: { status: "Verified" as DoctorStatus },
    },
    {
      id: "reg-mfrs",
      label: "Registered Manufacturers",
      count: registeredManufacturers,
      description: "Pharmaceutical & AYUSH manufacturing companies",
      trend: "6 active entities",
      to: "/admin/manufacturers" as const,
      search: {},
    },
    {
      id: "verified-mfrs",
      label: "Verified Manufacturers",
      count: verifiedManufacturers,
      description: "Approved facility & Form 25D compliant producers",
      trend: "Audited & compliant",
      to: "/admin/manufacturers" as const,
      search: {},
    },
    {
      id: "approved-prods",
      label: "Approved Products",
      count: approvedProducts,
      description: "Formulations verified & published in the active catalog",
      trend: "Active formulary",
      to: "/admin/medicines" as const,
      search: {},
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-0"
        title={greeting}
      />

      {/* Official Summary KPI Section */}
      <section aria-labelledby="official-kpis">
        <div className="flex items-center justify-between mb-3">
          <h2 id="official-kpis" className="type-section text-base font-semibold">
            Summary Metrics
          </h2>
        </div>
        <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {kpiCards.map((card) => (
            <li key={card.id} className="flex">
              <Link
                to={card.to}
                search={card.search}
                className={cn(
                  "card-surface card-hover flex h-full w-full flex-col justify-between p-4.5 group border border-border/80 transition-all",
                  focusRing,
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground group-hover:text-primary transition-colors">
                      {card.count}
                    </span>
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {card.trend}
                    </span>
                  </div>
                  <span className="mt-2.5 block text-sm font-semibold text-foreground leading-snug">
                    {card.label}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
                  <span>View Details</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <DoctorPlatformUsage />

      <Panel
        id="action-required"
        title="Action Required"
        warm
        action={
          hiddenCount > 0 ? (
            <button
              type="button"
              className={cn(
                "rounded-lg text-sm font-semibold text-primary hover:underline",
                focusRing,
              )}
              aria-expanded={showQueue}
              onClick={() => setShowQueue((current) => !current)}
            >
              {showQueue ? "Show fewer" : `View full queue (${actionQueue.length})`}
            </button>
          ) : null
        }
      >
        <div className="hidden border-b border-border pb-2 text-xs font-semibold text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_7.5rem_8.5rem_6.5rem] sm:gap-3">
          <span>Task</span>
          <span>Module</span>
          <span>Date</span>
          <span>Status</span>
          <span className="sr-only">Action</span>
        </div>
        <ul>
          {visibleActions.map((item) => (
            <li
              key={item.id}
              className="border-b border-border py-3 last:border-b-0 sm:grid sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_7.5rem_8.5rem_6.5rem] sm:items-center sm:gap-3"
            >
              <p className="font-semibold leading-snug">{item.task}</p>
              <p className="mt-1 text-sm text-muted-foreground sm:mt-0">{item.module}</p>
              <time
                className="mt-1 block text-sm text-muted-foreground sm:mt-0"
                dateTime={item.dateTime}
              >
                {item.date}
              </time>
              <div className="mt-2 sm:mt-0">
                <StatusPill tone={item.tone}>{item.status}</StatusPill>
              </div>
              <Link
                to={item.to}
                className={cn(
                  "mt-2 inline-flex text-sm font-semibold text-primary hover:underline sm:mt-0",
                  focusRing,
                )}
              >
                View Details
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel id="recent-activity" title="Recent Activity">
        <div className="hidden border-b border-border pb-2 text-xs font-semibold text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.9fr)_10.5rem] sm:gap-3">
          <span>Action</span>
          <span>Module</span>
          <span>Administrator</span>
          <span>Date and time</span>
        </div>
        <ul>
          {recentActivity.map((item) => (
            <li key={item.id} className="border-b border-border last:border-b-0">
              <Link
                to={item.to}
                className={cn(
                  "block rounded-xl py-3 hover:bg-secondary sm:grid sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.9fr)_10.5rem] sm:items-baseline sm:gap-3 sm:px-2",
                  focusRing,
                )}
              >
                <span className="block font-semibold leading-snug">{item.action}</span>
                <span className="mt-1 block text-sm text-muted-foreground sm:mt-0">
                  {item.module}
                </span>
                <span className="mt-1 block text-sm sm:mt-0">{item.administrator}</span>
                <time
                  className="mt-1 block text-sm text-muted-foreground sm:mt-0"
                  dateTime={item.dateTime}
                >
                  {item.when}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel id="quick-actions" title="Quick Actions">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Button key={action.label} asChild variant="outline" className="justify-between">
              <Link to={action.to}>
                {action.label}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Panel({
  id,
  title,
  subtitle,
  action,
  warm = false,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  warm?: boolean;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="card-surface">
      <div
        className={cn(
          "flex flex-col gap-2 rounded-t-[1rem] border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between",
          warm ? "motif-corner bg-secondary" : "bg-card",
        )}
      >
        <div className="relative z-[1] min-w-0">
          <h2 id={id} className="type-section">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action ? <div className="relative z-[1] shrink-0 sm:pt-1">{action}</div> : null}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
