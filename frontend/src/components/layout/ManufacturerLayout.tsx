import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Lock, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import {
  ManufacturerProvider,
  useManufacturer,
} from "@/features/manufacturer/manufacturer-context";
import { ManufacturerHeader } from "@/features/manufacturer/ManufacturerHeader";
import { ManufacturerSidebar, navItems } from "@/features/manufacturer/ManufacturerSidebar";
import { BrandMark, focusRing } from "@/components/portal/brand";
import { cn } from "@/utils";

export function ManufacturerLayoutWrapper() {
  return (
    <ManufacturerProvider>
      <ManufacturerLayout />
    </ManufacturerProvider>
  );
}

export function ManufacturerLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, ready } = useManufacturer();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className="manufacturer-portal min-h-screen bg-background">
      {/* Desktop Fixed Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border bg-sidebar transition-all duration-300 md:flex flex-col",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <ManufacturerSidebar collapsed={collapsed} />
      </aside>

      {/* Main Content Area */}
      <div className={cn("transition-all duration-300", collapsed ? "md:pl-20" : "md:pl-64")}>
        <ManufacturerHeader
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          onOpenMobile={() => setMobileOpen(true)}
        />

        <div className="min-h-[calc(100vh-4rem)] bg-white">
          <main
            key={pathname}
            className="page-enter mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-16 lg:px-8 lg:pt-8"
          >
            {ready && !session ? (
              <section className="card-surface mx-auto my-12 max-w-lg p-8 text-center shadow-soft">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Lock className="h-6 w-6" aria-hidden="true" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Manufacturer Session Required
                </h2>
                <p className="mx-auto mt-2 text-sm text-muted-foreground">
                  You need an active manufacturer session to access the Meyveda Grantha Manufacturer
                  Portal.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link
                    to="/login"
                    search={{ portal: "manufacturer" }}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
                  >
                    Sign in to Manufacturer Portal
                  </Link>
                  <Link
                    to="/doctor"
                    className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                  >
                    Go to Meyveda Home
                  </Link>
                </div>
              </section>
            ) : (
              <Outlet />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active =
              item.to === "/manufacturer/overview"
                ? pathname === "/manufacturer" || pathname === "/manufacturer/overview"
                : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
                  active
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                <span className="truncate max-w-[55px] text-center">
                  {item.label.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      <div
        className={cn("fixed inset-0 z-40 md:hidden", mobileOpen ? "" : "pointer-events-none")}
        inert={!mobileOpen ? true : undefined}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-foreground/20 backdrop-blur-xs transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 flex-col bg-card p-4 shadow-lift transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
            <BrandMark />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className={cn("rounded-lg p-2 text-muted-foreground hover:bg-surface", focusRing)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ManufacturerSidebar collapsed={false} onCloseMobile={() => setMobileOpen(false)} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManufacturerLayoutWrapper;
