import { describe, expect, it } from "vitest";
import { router, rootRoute } from "@/app/router";

const corePages = [
  "/",
  "/doctor",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/workspace",
  "/ws",
  "/medicines",
  "/library",
  "/manufacturers",
  "/quality",
  "/cases",
  "/research",
  "/adr",
  "/reports",
  "/saved",
  "/profile",
  "/help",
  "/compare",
  "/notifications",
  "/community",
  "/journals",
  "/referrals",
  "/admin",
  "/admin/home",
  "/admin/doctors",
  "/admin/manufacturers",
  "/admin/medicines",
  "/admin/library",
  "/admin/published-content",
  "/admin/ingredients",
  "/admin/approvals",
  "/admin/quality",
  "/admin/safety",
  "/admin/cases",
  "/admin/reports",
  "/admin/queries",
  "/admin/journals",
  "/admin/territory",
  "/admin/feedback",
  "/admin/referrals",
  "/admin/users",
  "/admin/settings",
  "/admin/notifications",
  "/admin/profile",
  "/manufacturer",
  "/manufacturer/overview",
  "/manufacturer/products",
  "/manufacturer/doctor-responses",
  "/manufacturer/doctor-feedback",
  "/manufacturer/territory-insights",
  "/manufacturer/adr-reports",
  "/manufacturer/profile",
] as const;

describe("Unified App Routing", () => {
  it.each(corePages)("matches a route for %s instead of falling back to root not found", (path) => {
    const matches = router.matchRoutes(path);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.at(-1)?.routeId).not.toBe(rootRoute.id);
  });

  it("falls back to not found for an unknown URL", () => {
    const matches = router.matchRoutes("/this-page-does-not-exist");
    expect(matches.at(-1)?.routeId).toBe(rootRoute.id);
  });

  it("matches an admin doctor profile on its dynamic slug route", () => {
    const directory = router.matchRoutes("/admin/doctors");
    const profile = router.matchRoutes("/admin/doctors/meera-nair");
    expect(directory.length).toBeGreaterThan(0);
    expect(profile.length).toBeGreaterThan(0);
    expect(profile.at(-1)?.routeId).toContain("$doctorSlug");
  });
});
