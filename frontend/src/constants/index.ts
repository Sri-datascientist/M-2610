/**
 * App-wide constants and navigation descriptors
 */
export const CLINICAL_NAV_ITEMS = [
  { label: "Home", to: "/workspace", icon: "Home" },
  { label: "Ayurveda Library", to: "/library", icon: "BookOpen" },
  { label: "Manufacturers", to: "/manufacturers", icon: "Building" },
  { label: "Medicine Quality", to: "/quality", icon: "ShieldCheck" },
  { label: "Clinical Cases", to: "/cases", icon: "ClipboardList" },
  { label: "My Medicine Research", to: "/research", icon: "FlaskConical" },
  { label: "Report a Side Effect", to: "/adr", icon: "AlertTriangle" },
  { label: "My Reports", to: "/reports", icon: "FileText" },
  { label: "Saved Items", to: "/saved", icon: "Bookmark" },
] as const;

export const SECONDARY_NAV_ITEMS = [
  { label: "My Profile", to: "/profile", icon: "User" },
  { label: "Help & Support", to: "/help", icon: "HelpCircle" },
  { label: "Drug Compare", to: "/compare", icon: "GitCompare" },
  { label: "Notifications", to: "/notifications", icon: "Bell" },
] as const;
