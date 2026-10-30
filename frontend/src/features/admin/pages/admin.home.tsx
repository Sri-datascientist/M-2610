import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { PageHeader, StatusPill, focusRing } from "@/components/portal/brand";
import { Button } from "@/components/ui/button";
import { type DoctorStatus } from "@/features/admin/catalog-data";
import { useCatalog } from "@/features/admin/catalog-state";
import { DoctorPlatformUsage } from "@/features/admin/doctor-usage-panel";
import { apiClient } from "@/services/apiClient";
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
      { title: "Overview — meyveda" },
      {
        name: "description",
        content: "Your overview of Ayurveda platform operations and reviews.",
      },
      { property: "og:title", content: "Overview — meyveda" },
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
  const [invitationsCount, setInvitationsCount] = useState<number>(0);
  const [franchiseCount, setFranchiseCount] = useState<number>(0);
  const [recentFranchiseEnquiries, setRecentFranchiseEnquiries] = useState<any[]>([]);
  const [contactCount, setContactCount] = useState<number>(0);
  const [recentContactMessages, setRecentContactMessages] = useState<any[]>([]);

  useEffect(() => {
    apiClient
      .get<{ total: number }>("/admin/invitations")
      .then((res) => {
        if (typeof res?.total === "number") {
          setInvitationsCount(res.total);
        }
      })
      .catch(() => {});

    apiClient
      .get<{ total: number; items: any[] }>("/franchise/admin/enquiries?limit=6")
      .then((res) => {
        if (typeof res?.total === "number") {
          setFranchiseCount(res.total);
        }
        if (Array.isArray(res?.items)) {
          setRecentFranchiseEnquiries(res.items);
        }
      })
      .catch(() => {});

    apiClient
      .get<{ total: number; items: any[] }>("/contact/admin/messages?limit=6")
      .then((res) => {
        if (typeof res?.total === "number") {
          setContactCount(res.total);
        }
        if (Array.isArray(res?.items)) {
          setRecentContactMessages(res.items);
        }
      })
      .catch(() => {});
  }, []);
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
    {
      id: "doctor-invites",
      label: "Doctor Invitations",
      count: invitationsCount,
      description: "Colleague nominations recorded in database",
      trend: "Dispatched & tracked",
      to: "/admin/referrals" as const,
      search: {},
    },
    {
      id: "franchise-enquiries",
      label: "Franchise Enquiries",
      count: franchiseCount,
      description: "Cluster franchise applications in database",
      trend: "Active applicants",
      to: "/admin/territory" as const,
      search: { tab: "enquiries" as any },
    },
    {
      id: "contact-inquiries",
      label: "Contact Inquiries",
      count: contactCount,
      description: "Live visitor & doctor messages in database",
      trend: "Live database",
      to: "/admin/queries" as const,
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

      {/* Cluster Franchise Enquiries Column Panel */}
      <Panel
        id="franchise-enquiries-panel"
        title="Cluster Franchise Enquiries (Expression of Interest)"
        warm
        action={
          <Link
            to="/admin/territory"
            search={{ tab: "enquiries" as any }}
            className={cn(
              "rounded-lg text-sm font-semibold text-primary hover:underline",
              focusRing,
            )}
          >
            {`View all enquiries (${franchiseCount})`}
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <div className="hidden border-b border-border pb-2 text-xs font-semibold text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_7rem_7rem_6rem] sm:gap-3">
            <span>Applicant &amp; PIN</span>
            <span>Contact Details</span>
            <span>Interested Tier</span>
            <span>Status</span>
            <span>Received</span>
            <span className="text-right">Action</span>
          </div>
          {recentFranchiseEnquiries.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No franchise enquiries recorded yet.
            </div>
          ) : (
            <ul>
              {recentFranchiseEnquiries.map((enq) => {
                const tone =
                  enq.status === "Approved"
                    ? "emerald"
                    : enq.status === "Contacted"
                      ? "blue"
                      : enq.status === "Under Review"
                        ? "warn"
                        : "orange";
                return (
                  <li
                    key={enq.id}
                    className="border-b border-border py-3 last:border-b-0 sm:grid sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_7rem_7rem_6rem] sm:items-center sm:gap-3"
                  >
                    <div>
                      <p className="font-bold text-foreground leading-snug">{enq.full_name}</p>
                      <p className="text-xs font-mono text-muted-foreground">
                        PIN: <span className="font-bold text-primary">{enq.territory_pincode}</span>
                      </p>
                    </div>

                    <div className="mt-1 text-xs sm:mt-0">
                      <p className="font-mono text-foreground">{enq.mobile}</p>
                      {enq.email && (
                        <p className="text-muted-foreground truncate max-w-[180px]">{enq.email}</p>
                      )}
                    </div>

                    <div className="mt-1 sm:mt-0">
                      <span className="inline-block rounded-md bg-[#FAF9F6] border border-border px-2 py-0.5 text-xs font-semibold text-foreground">
                        {enq.interested_tier}
                      </span>
                    </div>

                    <div className="mt-2 sm:mt-0">
                      <StatusPill tone={tone as any}>{enq.status}</StatusPill>
                    </div>

                    <time className="mt-1 block text-xs text-muted-foreground sm:mt-0">
                      {new Date(enq.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>

                    <div className="mt-2 sm:mt-0 text-right">
                      <Link
                        to="/admin/territory"
                        search={{ tab: "enquiries" as any }}
                        className={cn("text-xs font-bold text-primary hover:underline", focusRing)}
                      >
                        Review →
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Panel>

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


      {/* Live Contact & Practitioner Inquiries Panel */}
      <Panel
        id="contact-inquiries-panel"
        title="Contact & Practitioner Inquiries (Live Messages)"
        warm
        action={
          <Link
            to="/admin/queries"
            className={cn(
              "rounded-lg text-sm font-semibold text-primary hover:underline",
              focusRing,
            )}
          >
            {`View all inquiries (${contactCount})`}
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <div className="hidden border-b border-border pb-2 text-xs font-semibold text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_6rem_6rem] sm:gap-3">
            <span>Ref &amp; Submitter</span>
            <span>Contact Details</span>
            <span>Category</span>
            <span>Subject</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>
          {recentContactMessages.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No contact inquiries recorded yet.
            </div>
          ) : (
            <ul>
              {recentContactMessages.map((msg) => {
                const tone: "brand" | "sage" | "muted" | "danger" | "warning" | "info" =
                  msg.status === "Resolved"
                    ? "sage"
                    : msg.status === "Contacted"
                      ? "warning"
                      : msg.status === "In Progress"
                        ? "info"
                        : "brand";
                return (
                  <li
                    key={msg.id}
                    className="border-b border-border py-3 last:border-b-0 sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_6rem_6rem] sm:items-center sm:gap-3"
                  >
                    <div>
                      <p className="font-semibold text-foreground text-sm line-clamp-1">
                        {msg.full_name}
                      </p>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {msg.reference_code || `MV-CT-${msg.id.slice(0, 8).toUpperCase()}`}
                      </span>
                    </div>

                    <div className="text-xs space-y-0.5">
                      <a
                        href={`mailto:${msg.email}`}
                        className="text-primary hover:underline block truncate"
                        title={msg.email}
                      >
                        {msg.email}
                      </a>
                      <a
                        href={`tel:${msg.phone}`}
                        className="text-muted-foreground hover:text-foreground block truncate"
                        title={msg.phone}
                      >
                        {msg.phone}
                      </a>
                    </div>

                    <div>
                      <span className="inline-flex rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-foreground border border-border/80">
                        {msg.category}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-foreground line-clamp-1" title={msg.subject}>
                        {msg.subject}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {msg.message}
                      </p>
                    </div>

                    <div>
                      <StatusPill tone={tone as any}>{msg.status}</StatusPill>
                    </div>

                    <div className="text-right">
                      <Link
                        to="/admin/queries"
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-hover hover:text-primary transition-colors"
                      >
                        See Details
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
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
  children,
  warm,
}: {
  id: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  warm?: boolean;
}) {
  return (
    <section aria-labelledby={id} className={cn("card-surface", warm && "border-primary/30")}>
      <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
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
