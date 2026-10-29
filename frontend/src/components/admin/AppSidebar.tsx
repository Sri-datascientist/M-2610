import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, BadgeCheck, MessageSquareWarning, Receipt, BarChart3, ClipboardCheck,
  ShieldCheck, ScrollText, Lock, BookOpen, LifeBuoy, Settings, UserCircle,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
const groups = [
  { label: "Overview", items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }] },
  {
    label: "Administration",
    items: [
      { title: "Identity & Roles", url: "/identity", icon: Users },
      { title: "Verification", url: "/verification", icon: BadgeCheck },
      { title: "Content Moderation", url: "/moderation", icon: MessageSquareWarning },
      { title: "Commercial Rules", url: "/commercial", icon: Receipt },
    ],
  },
  {
    label: "Oversight",
    items: [
      { title: "Analytics & Operations", url: "/analytics", icon: BarChart3 },
      { title: "Compliance Register", url: "/compliance", icon: ClipboardCheck },
      { title: "Consent & Privacy", url: "/privacy", icon: ShieldCheck },
      { title: "Audit Management", url: "/audit", icon: ScrollText },
      { title: "Security & Access", url: "/security", icon: Lock },
      { title: "Knowledge Governance", url: "/knowledge", icon: BookOpen },
    ],
  },
] as const;
const bottom = [
  { title: "Help & Support", url: "/help", icon: LifeBuoy },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Administrator Profile", url: "/profile", icon: UserCircle },
] as const;

const itemClass =
  "h-10 rounded-lg text-[0.86rem] font-medium text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:[&>svg]:text-primary";

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const path = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => (url === "/" ? path === "/" : path === url || path.startsWith(url + "/") || (url === "/identity" && path.startsWith("/users")));
  const close = () => isMobile && setOpenMobile(false);

  const render = (items: readonly { title: string; url: string; icon: React.ComponentType<{ className?: string }> }[]) =>
    items.map((it) => (
      <SidebarMenuItem key={it.url}>
        <SidebarMenuButton asChild isActive={isActive(it.url)} tooltip={it.title} className={itemClass}>
          <Link to={it.url} onClick={close}>
            <it.icon className="h-4 w-4" />
            <span>{it.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="items-center px-6 pb-4 pt-6">
        <Link to="/" onClick={close} className="flex w-full items-center justify-center" aria-label="Meyveda Admin home">
          {collapsed ? (
            <img src="/p1.jpg" alt="Meyveda" className="h-8 w-8 object-contain" />
          ) : (
            <div className="relative w-[132.3px] shrink-0 overflow-hidden" style={{ aspectRatio: "646 / 562" }}>
              <img
                src="/p1.jpg"
                alt="Meyveda"
                className="pointer-events-none absolute max-w-none select-none object-contain"
                style={{ width: "212.38%", height: "139.50%", left: "-56.81%", top: "-12.81%" }}
              />
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-1">
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel className="text-[0.68rem] uppercase tracking-wider text-muted-foreground">{g.label}</SidebarGroupLabel>
            <SidebarGroupContent><SidebarMenu>{render(g.items)}</SidebarMenu></SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t px-1 py-3">
        <SidebarMenu>{render(bottom)}</SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
