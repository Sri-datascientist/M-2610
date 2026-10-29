/**
 * Configuration for temporarily locked admin sections.
 *
 * HOW TO UNLOCK FROM CODE:
 *
 * 1. To unlock ALL sections at once:
 *    Change `ENABLE_SECTION_LOCKING = true` to `false` below.
 *
 * 2. To unlock individual sections:
 *    Simply comment out or remove specific routes from the `LOCKED_ROUTES` array below.
 *    (For example, comment out `// "/admin/library",` to unlock Ayurveda Library)
 *
 * When unlocked, all internal pages, forms, and data remain 100% intact and immediately accessible.
 */
export const ENABLE_SECTION_LOCKING = false;

export const LOCKED_ROUTES: readonly string[] = [
  "/admin/library", // Ayurveda Library
  "/admin/published-content", // Published Contents
  "/admin/medicines", // Medicines
  "/admin/ingredients", // Ingredients
  "/admin/reports", // Reports
  "/admin/users", // User & Permissions
];

export function isSectionRouteLocked(pathname: string): boolean {
  if (!ENABLE_SECTION_LOCKING) return false;
  return LOCKED_ROUTES.some((locked) => pathname === locked || pathname.startsWith(`${locked}/`));
}
