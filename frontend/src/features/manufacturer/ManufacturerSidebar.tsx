import React from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  MessageSquareText,
  MessageSquareHeart,
  MapPin,
  AlertTriangle,
  Building2,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { SidebarLogo } from "@/components/portal/brand";
import { cn } from "@/lib/utils";
import { useManufacturer } from "./manufacturer-context";

// Exact required Sidebar navigation in exact order:
// 1. Overview
// 2. Product Management
// 3. Doctor Responses
// 4. Doctor Feedback
// 5. Territory Insights
// 6. ADR Reports
// 7. Manufacturer Profile
export const navItems = [
  { label: "Overview", to: "/manufacturer/overview", icon: LayoutDashboard },
  { label: "Product Management", to: "/manufacturer/products", icon: Package },
  { label: "Doctor Responses", to: "/manufacturer/doctor-responses", icon: MessageSquareText },
  { label: "Doctor Feedback", to: "/manufacturer/doctor-feedback", icon: MessageSquareHeart },
  { label: "Territory Insights", to: "/manufacturer/territory-insights", icon: MapPin },
  { label: "ADR Reports", to: "/manufacturer/adr-reports", icon: AlertTriangle },
  { label: "Manufacturer Profile", to: "/manufacturer/profile", icon: Building2 },
];

interface SidebarProps {
  collapsed: boolean;
  onCloseMobile?: () => void;
}

export const ManufacturerSidebar: React.FC<SidebarProps> = ({ collapsed, onCloseMobile }) => {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, products, doctorFeedback, adrReports, signOut } = useManufacturer();

  // Badges for pending items
  const pendingCorrections = products.filter((p) => p.status === "Changes Requested").length;
  const unresolvedFeedback = doctorFeedback.filter(
    (fb) => fb.status === "Open" || fb.status === "In Review"
  ).length;
  const pendingADR = adrReports.filter(
    (r) => r.followUpStatus === "Pending Manufacturer Response"
  ).length;

  const isActive = (to: string) => {
    if (to === "/manufacturer/overview" && (pathname === "/manufacturer" || pathname === "/manufacturer/overview")) {
      return true;
    }
    return pathname.startsWith(to);
  };

  return (
    <div className="flex h-full flex-col justify-between bg-sidebar py-6">
      <div>
        {/* Meyveda Logo */}
        <div
          className={cn(
            "mb-8 flex items-center",
            collapsed ? "justify-center px-0" : "justify-center px-4"
          )}
        >
          <Link
            to="/manufacturer/overview"
            onClick={onCloseMobile}
            className="flex items-center justify-center overflow-hidden"
            aria-label="Meyveda Manufacturer Portal Home"
          >
            {collapsed ? (
              <img src="/p1.jpg" alt="Meyveda" className="h-8 w-8 object-contain" />
            ) : (
              <div className="flex flex-col items-center">
                <div
                  className="relative w-[130px] shrink-0 overflow-hidden"
                  style={{ aspectRatio: "646 / 562" }}
                >
                  <img
                    src="/p1.jpg"
                    alt="Meyveda"
                    className="pointer-events-none absolute max-w-none select-none object-contain"
                    style={{
                      width: "212.38%",
                      height: "139.50%",
                      left: "-56.81%",
                      top: "-12.81%",
                    }}
                  />
                </div>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation list */}
        <div className="px-3">
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {!collapsed && "Platform Modules"}
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(item.to);
              const Icon = item.icon;

              // Module badge
              let badgeCount: number | null = null;
              if (item.label === "Product Management" && pendingCorrections > 0) {
                badgeCount = pendingCorrections;
              } else if (item.label === "Doctor Feedback" && unresolvedFeedback > 0) {
                badgeCount = unresolvedFeedback;
              } else if (item.label === "ADR Reports" && pendingADR > 0) {
                badgeCount = pendingADR;
              }

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  title={item.label}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all",
                    active
                      ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4.5 w-4.5 shrink-0 transition-colors",
                      active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                  {!collapsed && badgeCount !== null && badgeCount > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-bold",
                        item.label === "ADR Reports"
                          ? "bg-danger-soft text-destructive"
                          : "bg-primary-soft text-primary"
                      )}
                    >
                      {badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3 px-3">
        {/* Sign Out Action */}
        <div className="border-t border-sidebar-border/70 pt-2">
          <button
            type="button"
            onClick={() => {
              signOut();
              onCloseMobile?.();
              navigate({ to: "/login", search: { portal: "manufacturer" } });
            }}
            title={collapsed ? "Sign Out" : undefined}
            aria-label="Sign out of Manufacturer Portal"
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30",
              collapsed && "justify-center px-0",
            )}
          >
            <LogOut
              className={cn(
                "h-4.5 w-4.5 shrink-0 transition-colors text-muted-foreground group-hover:text-destructive",
              )}
            />
            {!collapsed && <span className="flex-1 text-left truncate font-medium">Sign Out</span>}
          </button>
        </div>

        {/* Manufacturer organization card in sidebar */}
        {!collapsed && (
          <div className="rounded-xl border border-border bg-secondary p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent font-brand font-bold text-primary text-xs">
                AVN
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">
                  {profile.brandName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  <span className="truncate text-[10px] text-muted-foreground">
                    {profile.verificationStatus}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-mono text-[10px]">LIC: TN/25D/0912</span>
              <span className="text-primary font-medium">Ayush</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
