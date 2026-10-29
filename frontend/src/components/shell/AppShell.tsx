import { Link, useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  Search,
  BookOpen,
  Factory,
  ShieldCheck,
  Stethoscope,
  FlaskConical,
  Users,
  Newspaper,
  AlertTriangle,
  FileText,
  Bookmark,
  User,
  LifeBuoy,
  LogOut,
  Bell,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
  UserPlus,
  ClipboardList,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { useStore, setState } from "@/lib/store";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  hidden?: boolean;
}

export const NAV: readonly NavItem[] = [
  { to: "/workspace", label: "Home", icon: Home },
  { to: "/survey", label: "Survey", icon: ClipboardList },
  { to: "/referrals", label: "Referrals & Early Access", icon: UserPlus },
] as const;

const navItemClass = (active: boolean) =>
  cn(
    "relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-medium text-white transition-colors duration-150 hover:bg-[var(--sidebar-hover)]",
    active && "bg-sidebar-accent font-semibold",
  );

function BrandPanel({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-white shadow-soft",
        compact ? "mx-auto h-14 w-14" : "w-full px-3 py-3",
      )}
    >
      <Logo compact={compact ?? false} />
    </div>
  );
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation();

  const item = (n: { to: string; label: string; icon: typeof Home }) => {
    const active =
      n.to === "/workspace" || n.to === "/ws"
        ? pathname === "/workspace" || pathname === "/ws"
        : pathname.startsWith(n.to);
    const Icon = n.icon;
    return (
      <Link
        key={n.to}
        to={n.to}
        onClick={onNavigate}
        title={collapsed ? n.label : undefined}
        aria-label={collapsed ? n.label : undefined}
        aria-current={active ? "page" : undefined}
        className={cn(navItemClass(active), collapsed && "justify-center px-0")}
      >
        {active && (
          <span
            className="absolute top-2 bottom-2 left-0 w-1 rounded-full bg-white"
            aria-hidden="true"
          />
        )}
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        {collapsed ? (
          <span className="sr-only">{n.label}</span>
        ) : (
          <span className="truncate">{n.label}</span>
        )}
      </Link>
    );
  };
  const visibleNav = NAV.filter((n) => !n.hidden);
  return (
    <nav className="relative z-[1] flex min-h-0 flex-1 flex-col" aria-label="Main">
      <div className="flex flex-col gap-1">{visibleNav.map(item)}</div>
      <div className="mt-auto pt-6 flex flex-col gap-1 border-t border-sidebar-border/40">
        <Link
          to="/login"
          onClick={() => {
            if (typeof window !== "undefined") {
              localStorage.removeItem("meyveda_auth_token");
              localStorage.removeItem("meyveda_user_role");
            }
            setState(() => ({ signedIn: false }));
            onNavigate?.();
          }}
          title={collapsed ? "Sign Out" : undefined}
          aria-label={collapsed ? "Sign Out" : undefined}
          className={cn(navItemClass(false), collapsed && "justify-center px-0 text-white/80 hover:text-white")}
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          {collapsed ? <span className="sr-only">Sign Out</span> : <span>Sign Out</span>}
        </Link>
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const doctor = useStore((s) => s.doctor);
  const notifications = useStore((s) => s.notifications);
  const unread = notifications.filter((n) => !n.read).length;
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const { pathname } = useLocation();
  const section = "/" + (pathname.split("/")[1] ?? "");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusToMenu = useRef(true);

  const closeDrawer = (restoreMenu: boolean) => {
    returnFocusToMenu.current = restoreMenu;
    setMobile(false);
  };

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMobile(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!mobile) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const drawer = drawerRef.current;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const focusable = () =>
      drawer
        ? [
            ...drawer.querySelectorAll<HTMLElement>(
              "a[href], button:not([disabled]), input, [tabindex]:not([tabindex='-1'])",
            ),
          ]
        : [];

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        returnFocusToMenu.current = true;
        setMobile(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.overflow = previousOverflow;
      if (returnFocusToMenu.current) previous?.focus();
      else document.getElementById("main")?.focus();
      returnFocusToMenu.current = true;
    };
  }, [mobile]);

  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:shadow-soft"
      >
        Skip to content
      </a>
      <aside
        className={cn(
          "shell-sidebar motif-corner sticky top-0 hidden h-screen h-dvh min-h-screen min-h-dvh shrink-0 flex-col overflow-hidden p-3 transition-[width] duration-[var(--duration-base)] ease-[var(--ease-out)] lg:flex",
          collapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width)]",
        )}
      >
        <div className="relative z-[1] mb-4">
          <BrandPanel compact={collapsed} />
        </div>
        <div className="relative z-[1] min-h-0 flex-1 overflow-y-auto">
          <NavList collapsed={collapsed} />
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            navItemClass(false),
            "relative z-[1] mt-3",
            collapsed && "justify-center px-0",
          )}
          aria-pressed={collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <>
              <PanelLeft className="h-[18px] w-[18px]" aria-hidden="true" />
              <span className="sr-only">Expand sidebar</span>
            </>
          ) : (
            <>
              <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden="true" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </aside>

      <AnimatePresence>
        {mobile && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-[#111111]/40"
              aria-label="Close menu"
              onClick={() => closeDrawer(true)}
            />
            <motion.aside
              ref={drawerRef}
              id="mobile-navigation"
              role="dialog"
              aria-modal="true"
              aria-label="Main menu"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 32, stiffness: 340 }}
              className="shell-sidebar absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col p-3 shadow-lift"
            >
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => closeDrawer(true)}
                aria-label="Close menu"
                className="absolute top-3 right-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white text-primary shadow-soft"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="relative z-[1] mb-4 pr-12">
                <BrandPanel />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <NavList collapsed={false} onNavigate={() => closeDrawer(false)} />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile menu bar - only rendered on small screens where sidebar is hidden */}
        <div className="flex h-12 items-center justify-between border-b border-border bg-white/95 px-4 backdrop-blur-md lg:hidden">
          <button
            ref={menuButtonRef}
            type="button"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg hover:bg-muted"
            onClick={() => setMobile(true)}
            aria-label="Open menu"
            aria-expanded={mobile}
            aria-controls="mobile-navigation"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="max-w-[200px] truncate text-xs font-semibold text-foreground">
            {doctor.name}
          </span>
          <div className="w-9" />
        </div>

        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </main>
        <footer className="border-t border-border px-6 py-3 text-xs text-muted-foreground">
          Mey Veda Grantha · Official AYUSH Practitioner Clinical Network · Verified Early Access System
        </footer>
      </div>
    </div>
  );
}
