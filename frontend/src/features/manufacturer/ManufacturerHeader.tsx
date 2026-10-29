import React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Menu, PanelLeft, ShieldCheck } from "lucide-react";
import { Avatar, BrandMark, focusRing } from "@/components/portal/brand";
import { useManufacturer } from "./manufacturer-context";
import { cn } from "@/lib/utils";

interface HeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMobile: () => void;
}

export const ManufacturerHeader: React.FC<HeaderProps> = ({
  collapsed,
  onToggleCollapse,
  onOpenMobile,
}) => {
  const navigate = useNavigate();
  const { profile, adrReports, products, signOut } = useManufacturer();

  const initials = profile.contactPerson
    ? profile.contactPerson
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
    : "AV";

  const actionCount =
    products.filter((p) => p.status === "Changes Requested").length +
    adrReports.filter((a) => a.followUpStatus === "Pending Manufacturer Response").length;

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-white shadow-2xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <button
          type="button"
          className={cn("-ml-1 rounded-lg p-2 text-muted-foreground hover:bg-surface md:hidden", focusRing)}
          onClick={onOpenMobile}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop sidebar toggle button */}
        <button
          type="button"
          className={cn(
            "hidden rounded-lg p-2 text-muted-foreground hover:bg-surface lg:inline-flex",
            focusRing
          )}
          onClick={onToggleCollapse}
          aria-pressed={collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft className="h-5 w-5" />
        </button>

        {/* Mobile Brand Mark */}
        <Link to="/manufacturer/overview" className="md:hidden">
          <BrandMark className="[&_img]:h-7" />
        </Link>

        {/* Status indicator bar */}
        <div className="ml-auto hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2 rounded-full border border-border/80 bg-secondary/80 px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            <span className="font-medium text-foreground">{profile.brandName}</span>
            <span className="text-border">|</span>
            <span className="text-muted-foreground">Manufacturer Portal</span>
          </div>
        </div>

        {/* Alerts / Action center */}
        <div className="relative ml-auto md:ml-2">
          <div
            className={cn(
              "relative inline-flex rounded-full p-2.5 text-muted-foreground hover:bg-surface cursor-pointer",
              focusRing
            )}
            title={
              actionCount > 0
                ? `${actionCount} items require manufacturer attention`
                : "All manufacturer items up to date"
            }
          >
            <Bell className="h-5 w-5" />
            {actionCount > 0 && (
              <span
                className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-primary ring-2 ring-white"
                aria-hidden="true"
              />
            )}
          </div>
        </div>

        {/* Profile Avatar & dropdown link */}
        <div className="flex items-center gap-2">
          <Link
            to="/manufacturer/profile"
            className={cn("flex items-center gap-2.5 rounded-full p-1 hover:bg-surface transition-colors", focusRing)}
            aria-label="Manufacturer profile"
          >
            <Avatar initials={initials} size="sm" tone="brand" />
            <div className="hidden text-left lg:block">
              <p className="text-xs font-semibold leading-tight text-foreground truncate max-w-[140px]">
                {profile.contactPerson}
              </p>
              <p className="text-[10.5px] text-muted-foreground truncate max-w-[140px]">
                {profile.designation}
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => {
              signOut();
              navigate({ to: "/login", search: { portal: "manufacturer" } });
            }}
            title="Sign Out"
            aria-label="Sign out of Manufacturer Portal"
            className={cn(
              "rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors",
              focusRing
            )}
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
