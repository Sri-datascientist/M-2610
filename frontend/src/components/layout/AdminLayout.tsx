import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Bell, Menu, PanelLeft, X, Lock } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Avatar, BrandMark, SidebarLogo, focusRing } from "@/components/portal/brand";
import { CatalogProvider } from "@/features/admin/catalog-state";
import { DoctorUsageProvider } from "@/features/admin/doctor-usage-state";
import { AdministrationProvider } from "@/features/admin/administration-state";
import { PublishedContentProvider } from "@/features/admin/published-content-state";
import { QueriesProvider } from "@/features/admin/queries-state";
import { ComplianceProvider } from "@/features/admin/compliance-state";
import {
  LockedSectionsProvider,
  LockedRouteOverlay,
  useLockedSections,
} from "@/features/admin/locked-sections";
import { JournalProvider } from "@/features/admin/journal-state";
import { FeedbackProvider } from "@/features/admin/feedback-state";
import { adminModules, mobileNav, type AdminModule } from "@/features/admin/modules";
import { useStore } from "@/lib/admin-store";
import { cn } from "@/utils";

function NavItem({
  module,
  collapsed,
  onClick,
}: {
  module: AdminModule;
  collapsed: boolean;
  onClick?: (() => void) | undefined;
}) {
  const Icon = module.icon;
  const { isRouteLocked } = useLockedSections();
  const isLocked = isRouteLocked(module.to);

  return (
    <Link
      to={module.to}
      onClick={onClick}
      title={module.label + (isLocked ? " (Temporarily Locked)" : "")}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground md:max-lg:justify-center md:max-lg:px-0",
        collapsed && "lg:justify-center lg:px-0",
      )}
      activeProps={{ className: "!bg-accent !text-accent-foreground" }}
      activeOptions={{ exact: module.to !== "/admin/doctors" }}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className={cn("flex-1 md:max-lg:hidden", collapsed && "lg:hidden")}>
        {module.label}
      </span>
      {isLocked && (
        <span
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground/60 transition-colors group-hover:text-muted-foreground md:max-lg:hidden",
            collapsed && "lg:hidden",
          )}
          title="Section Locked"
        >
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      )}
    </Link>
  );
}

function NavGroups({ collapsed, onClick }: { collapsed: boolean; onClick?: () => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      {adminModules.map((module) => (
        <NavItem key={module.to} module={module} collapsed={collapsed} onClick={onClick} />
      ))}
    </div>
  );
}

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { admin, ready, notifications, ensureDemoSession, syncAdmin } = useStore();
  const unread = notifications?.items ? notifications.items.filter((item) => !item.read).length : 0;
  const initials = admin
    ? admin.name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
    : "MV";

  useEffect(() => {
    if (!admin) {
      syncAdmin();
    }
  }, [admin, syncAdmin]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (ready && !admin) {
    return (
      <div className="admin-portal flex min-h-screen items-center justify-center bg-background px-4">
        <section className="card-surface mx-auto my-12 max-w-lg p-8 text-center shadow-soft border border-border rounded-2xl bg-card">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Administrator Session Required
          </h2>
          <p className="mx-auto mt-2 text-sm text-muted-foreground">
            You must be authenticated as an authorized Meyveda platform administrator to access governance, verification, and audit tools.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => {
                const restored = syncAdmin() || ensureDemoSession();
                if (restored) {
                  window.location.reload();
                } else {
                  window.location.href = "/login?portal=admin";
                }
              }}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 cursor-pointer"
            >
              Sign in as Administrator
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              Go to Meyveda Home
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <CatalogProvider>
      <DoctorUsageProvider>
        <ComplianceProvider>
          <AdministrationProvider>
            <PublishedContentProvider>
              <JournalProvider>
                <FeedbackProvider>
                  <QueriesProvider>
                    <LockedSectionsProvider>
                      <div className="admin-portal min-h-screen bg-background">
                        <aside
                          className={cn(
                            "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar py-6 md:flex",
                            collapsed ? "w-20 px-3" : "w-20 px-3 lg:w-64 lg:px-4",
                          )}
                        >
                          <Link
                            to="/admin/home"
                            className={cn(
                              "mb-8 flex items-center px-2 md:max-lg:justify-center md:max-lg:px-0",
                              collapsed && "lg:justify-center lg:px-0",
                            )}
                            aria-label="Meyveda Admin"
                          >
                            <SidebarLogo className={cn(collapsed && "lg:w-[44px]")} />
                          </Link>
                          <nav className="flex flex-1 flex-col overflow-y-auto">
                            <NavGroups collapsed={collapsed} />
                          </nav>
                        </aside>

                        <div className={cn(collapsed ? "md:pl-20" : "md:pl-20 lg:pl-64")}>
                          <header className="sticky top-0 z-20 border-b border-border/60 bg-white">
                            <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-10">
                              <button
                                type="button"
                                className={cn(
                                  "-ml-1 rounded-lg p-2 hover:bg-surface md:hidden",
                                  focusRing,
                                )}
                                onClick={() => setOpen(true)}
                                aria-label="Open menu"
                              >
                                <Menu className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                className={cn(
                                  "hidden rounded-lg p-2 hover:bg-surface lg:inline-flex",
                                  focusRing,
                                )}
                                onClick={() => setCollapsed((current) => !current)}
                                aria-pressed={collapsed}
                                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                              >
                                <PanelLeft className="h-5 w-5" />
                              </button>
                              <Link to="/admin/home" className="md:hidden">
                                <BrandMark className="[&_img]:h-7" />
                              </Link>
                              <p className="ml-auto hidden text-sm text-muted-foreground sm:block">
                                {admin?.role ?? "Meyveda administration"}
                              </p>
                              <div className="relative ml-auto sm:ml-0">
                                <Link
                                  to="/admin/notifications"
                                  activeOptions={{ exact: true }}
                                  activeProps={{ className: "bg-accent text-accent-foreground" }}
                                  className={cn(
                                    "relative inline-flex rounded-full p-2.5 hover:bg-surface",
                                    focusRing,
                                  )}
                                  aria-label={
                                    unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
                                  }
                                >
                                  <Bell className="h-5 w-5" />
                                  {unread > 0 ? (
                                    <span
                                      className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary"
                                      aria-hidden="true"
                                    />
                                  ) : null}
                                </Link>
                              </div>
                              <Link
                                to="/admin/profile"
                                activeOptions={{ exact: true }}
                                className={cn("rounded-full", focusRing)}
                                aria-label="Administrator profile"
                              >
                                <Avatar initials={initials} size="sm" />
                              </Link>
                            </div>
                          </header>

                          <div className="min-h-[calc(100vh-4rem)] bg-white">
                            <main
                              key={pathname}
                              className="page-enter mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-16 lg:px-8 lg:pt-8"
                            >
                              <LockedRouteOverlay pathname={pathname}>
                                <Outlet />
                              </LockedRouteOverlay>
                            </main>
                          </div>
                        </div>

                        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur md:hidden">
                          <div className="grid grid-cols-5">
                            {mobileNav.map((path) => {
                              const module = adminModules.find((item) => item.to === path)!;
                              const Icon = module.icon;
                              return (
                                <Link
                                  key={module.to}
                                  to={module.to}
                                  className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
                                  activeProps={{ className: "!text-primary" }}
                                >
                                  <Icon className="h-5 w-5" />
                                  {module.mobileLabel ?? module.label.split(" ")[0]}
                                </Link>
                              );
                            })}
                          </div>
                        </nav>

                        <div
                          className={cn(
                            "fixed inset-0 z-40 md:hidden",
                            open ? "" : "pointer-events-none",
                          )}
                          inert={!open ? true : undefined}
                          aria-hidden={!open}
                        >
                          <div
                            className={cn(
                              "absolute inset-0 bg-foreground/20 transition-opacity",
                              open ? "opacity-100" : "opacity-0",
                            )}
                            onClick={() => setOpen(false)}
                          />
                          <div
                            className={cn(
                              "absolute inset-y-0 left-0 flex w-72 flex-col bg-card p-5 shadow-lift transition-transform duration-300",
                              open ? "translate-x-0" : "-translate-x-full",
                            )}
                          >
                            <div className="mb-6 flex items-center justify-between">
                              <BrandMark />
                              <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className={cn("rounded-lg p-2 hover:bg-surface", focusRing)}
                                aria-label="Close menu"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                            <nav className="flex flex-1 flex-col overflow-y-auto">
                              <NavGroups collapsed={false} onClick={() => setOpen(false)} />
                            </nav>
                          </div>
                        </div>
                      </div>
                    </LockedSectionsProvider>
                  </QueriesProvider>
                </FeedbackProvider>
              </JournalProvider>
            </PublishedContentProvider>
          </AdministrationProvider>
        </ComplianceProvider>
      </DoctorUsageProvider>
    </CatalogProvider>
  );
}

export default AdminLayout;
