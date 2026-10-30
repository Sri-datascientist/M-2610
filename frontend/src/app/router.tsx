import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  Link,
  useRouter,
  redirect,
} from "@tanstack/react-router";
import React, { useEffect } from "react";
import { getState } from "@/lib/store";

// Layouts
import { DoctorWorkspaceLayout } from "@/components/layout/DoctorWorkspaceLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ManufacturerLayoutWrapper } from "@/components/layout/ManufacturerLayout";

// Landing Features
import { LandingPage } from "@/features/landing";
import { DoctorLandingPage } from "@/features/landing";

// Auth Features
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from "@/features/auth";

// Legal Features
import { TermsPage, PrivacyPage } from "@/features/legal";

// Doctor Workspace Pages
import {
  Home as DoctorHomePage,
  Library,
  Manufacturers,
  Quality,
  Cases,
  Research,
  Adr,
  Reports,
  SavedPage,
  Profile,
  Help,
  Compare,
  Notifications,
  CommunityPage,
  JournalsPage,
  ReferralsPage,
  SurveyPage,
} from "@/features/doctor";

// Admin Pages
import {
  ApprovalsPage as AdminApprovalsPage,
  CasesPage as AdminCasesPage,
  DoctorProfilePage as AdminDoctorDetailPage,
  DoctorsSection as AdminDoctorsSection,
  FeedbackPage as AdminFeedbackPage,
  HomePage as AdminHomePage,
  IngredientsDirectory as AdminIngredientsPage,
  JournalsPage as AdminJournalsPage,
  LibraryWorkspace as AdminLibraryPage,
  ManufacturersDirectory as AdminManufacturersPage,
  MedicinesDirectory as AdminMedicinesPage,
  NotificationsPage as AdminNotificationsPage,
  ProfilePage as AdminProfilePage,
  PublishedContentPage as AdminPublishedContentPage,
  QualityPage as AdminQualityPage,
  QueriesPage as AdminQueriesPage,
  ReferralScoresPage as AdminReferralsPage,
  ReportsPage as AdminReportsPage,
  SafetyPage as AdminSafetyPage,
  SettingsPage as AdminSettingsPage,
  TerritoryPage as AdminTerritoryPage,
  UsersPage as AdminUsersPage,
} from "@/features/admin";

// Manufacturer Pages
import {
  ADRReportsPage as MfgADRReportsPage,
  DoctorFeedbackPage as MfgDoctorFeedbackPage,
  DoctorResponsesPage as MfgDoctorResponsesPage,
  OverviewPage as MfgOverviewPage,
  ProductManagementPage as MfgProductManagementPage,
  ManufacturerProfilePage as MfgProfilePage,
  TerritoryInsightsPage as MfgTerritoryInsightsPage,
} from "@/features/manufacturer";

/* -------------------------------------------------------------------------- */
/*                         NOT FOUND & ERROR BOUNDARIES                       */
/* -------------------------------------------------------------------------- */

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to Home
          </Link>
          <Link
            to="/workspace"
            className="inline-flex items-center justify-center rounded-md border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Doctor Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error("Router Boundary Error:", error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong loading this view. You can try refreshing or heading home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                ROUTE TREE                                  */
/* -------------------------------------------------------------------------- */

export const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent as any,
});

// 1. Public & Marketing routes
export const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

export const doctorLandingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/doctor",
  component: DoctorLandingPage,
});

// 2. Auth routes
export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

export const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

export const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  beforeLoad: () => {
    throw redirect({ to: "/login", search: { mode: "forgot" }, replace: true });
  },
  component: ForgotPasswordPage,
});

export const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reset-password",
  beforeLoad: () => {
    throw redirect({ to: "/login", search: { mode: "forgot" }, replace: true });
  },
  component: ResetPasswordPage,
});

// 2b. Legal & Compliance routes
export const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms",
  component: TermsPage,
});

export const termsAliasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms-and-conditions",
  component: TermsPage,
});

export const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: PrivacyPage,
});

export const privacyAliasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy-policy",
  component: PrivacyPage,
});

// 3. Doctor Clinical Workspace (under DoctorWorkspaceLayout)
export const doctorWorkspaceLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_ws",
  component: DoctorWorkspaceLayout,
});

export const doctorWorkspaceHomeRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/workspace",
  component: DoctorHomePage,
});

export const doctorWsAliasRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/ws",
  component: DoctorHomePage,
});

export const doctorDashboardAliasRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/dashboard",
  component: DoctorHomePage,
});

export const medicinesRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/medicines",
  beforeLoad: () => {
    throw redirect({ to: "/workspace", replace: true });
  },
  component: () => null,
});

export const libraryRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/library",
  component: Library,
});

export const manufacturersRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/manufacturers",
  component: Manufacturers,
});

export const qualityRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/quality",
  component: Quality,
});

export const casesRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/cases",
  component: Cases,
});

export const researchRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/research",
  component: Research,
});

export const adrRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/adr",
  component: Adr,
});

export const reportsRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/reports",
  component: Reports,
});

export const savedRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/saved",
  component: SavedPage,
});

export const profileRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/profile",
  component: Profile,
});

export const helpRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/help",
  component: Help,
});

export const compareRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/compare",
  component: Compare,
});

export const notificationsRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/notifications",
  component: Notifications,
});

export const communityRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/community",
  component: CommunityPage,
});

export const journalsRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/journals",
  component: JournalsPage,
});

export const referralsRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/referrals",
  component: ReferralsPage,
});

export const surveyRoute = createRoute({
  getParentRoute: () => doctorWorkspaceLayoutRoute,
  path: "/survey",
  component: SurveyPage,
});

// 4. Admin Portal (under AdminLayout at /admin)
export const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminLayout,
});

export const adminIndexRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/admin/home", replace: true });
  },
  component: AdminHomePage,
});

export const adminHomeRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/home",
  component: AdminHomePage,
});

export const adminApprovalsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/approvals",
  component: AdminApprovalsPage,
});

export const adminCasesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/cases",
  component: AdminCasesPage,
});

export const adminDoctorsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/doctors",
  validateSearch: (search: Record<string, unknown>) => {
    const status = search["status"];
    if (typeof status === "string") {
      return { status };
    }
    return {};
  },
  component: AdminDoctorsSection,
});

export const adminDoctorDetailRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/doctors/$doctorSlug",
  component: AdminDoctorDetailPage,
});

export const adminFeedbackRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/feedback",
  component: AdminFeedbackPage,
});

export const adminIngredientsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/ingredients",
  component: AdminIngredientsPage,
});

export const adminJournalsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/journals",
  component: AdminJournalsPage,
});

export const adminLibraryRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/library",
  component: AdminLibraryPage,
});

export const adminManufacturersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/manufacturers",
  component: AdminManufacturersPage,
});

export const adminMedicinesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/medicines",
  component: AdminMedicinesPage,
});

export const adminNotificationsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/notifications",
  component: AdminNotificationsPage,
});

export const adminProfileRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/profile",
  component: AdminProfilePage,
});

export const adminPublishedContentRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/published-content",
  component: AdminPublishedContentPage,
});

export const adminQualityRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/quality",
  component: AdminQualityPage,
});

export const adminQueriesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/queries",
  component: AdminQueriesPage,
});

export const adminReferralsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/referrals",
  component: AdminReferralsPage,
});

export const adminReportsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/reports",
  component: AdminReportsPage,
});

export const adminSafetyRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/safety",
  component: AdminSafetyPage,
});

export const adminSettingsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/settings",
  component: AdminSettingsPage,
});

export const adminTerritoryRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/territory",
  component: AdminTerritoryPage,
});

export const adminUsersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/users",
  component: AdminUsersPage,
});

// 5. Manufacturer Portal (under ManufacturerLayoutWrapper at /manufacturer)
export const manufacturerLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/manufacturer",
  component: ManufacturerLayoutWrapper,
});

export const manufacturerIndexRoute = createRoute({
  getParentRoute: () => manufacturerLayoutRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/manufacturer/overview", replace: true });
  },
  component: MfgOverviewPage,
});

export const manufacturerOverviewRoute = createRoute({
  getParentRoute: () => manufacturerLayoutRoute,
  path: "/overview",
  component: MfgOverviewPage,
});

export const manufacturerProductsRoute = createRoute({
  getParentRoute: () => manufacturerLayoutRoute,
  path: "/products",
  component: MfgProductManagementPage,
});

export const manufacturerResponsesRoute = createRoute({
  getParentRoute: () => manufacturerLayoutRoute,
  path: "/doctor-responses",
  component: MfgDoctorResponsesPage,
});

export const manufacturerFeedbackRoute = createRoute({
  getParentRoute: () => manufacturerLayoutRoute,
  path: "/doctor-feedback",
  component: MfgDoctorFeedbackPage,
});

export const manufacturerTerritoryRoute = createRoute({
  getParentRoute: () => manufacturerLayoutRoute,
  path: "/territory-insights",
  component: MfgTerritoryInsightsPage,
});

export const manufacturerAdrRoute = createRoute({
  getParentRoute: () => manufacturerLayoutRoute,
  path: "/adr-reports",
  component: MfgADRReportsPage,
});

export const manufacturerProfileRoute = createRoute({
  getParentRoute: () => manufacturerLayoutRoute,
  path: "/profile",
  component: MfgProfilePage,
});

// Route Tree Aggregation
export const routeTree = rootRoute.addChildren([
  landingRoute,
  doctorLandingRoute,
  loginRoute,
  registerRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  termsRoute,
  termsAliasRoute,
  privacyRoute,
  privacyAliasRoute,
  doctorWorkspaceLayoutRoute.addChildren([
    doctorWorkspaceHomeRoute,
    doctorWsAliasRoute,
    doctorDashboardAliasRoute,
    medicinesRoute,
    libraryRoute,
    manufacturersRoute,
    qualityRoute,
    casesRoute,
    researchRoute,
    adrRoute,
    reportsRoute,
    savedRoute,
    profileRoute,
    helpRoute,
    compareRoute,
    notificationsRoute,
    communityRoute,
    journalsRoute,
    referralsRoute,
    surveyRoute,
  ]),
  adminLayoutRoute.addChildren([
    adminIndexRoute,
    adminHomeRoute,
    adminApprovalsRoute,
    adminCasesRoute,
    adminDoctorsRoute,
    adminDoctorDetailRoute,
    adminFeedbackRoute,
    adminIngredientsRoute,
    adminJournalsRoute,
    adminLibraryRoute,
    adminManufacturersRoute,
    adminMedicinesRoute,
    adminNotificationsRoute,
    adminProfileRoute,
    adminPublishedContentRoute,
    adminQualityRoute,
    adminQueriesRoute,
    adminReferralsRoute,
    adminReportsRoute,
    adminSafetyRoute,
    adminSettingsRoute,
    adminTerritoryRoute,
    adminUsersRoute,
  ]),
  manufacturerLayoutRoute.addChildren([
    manufacturerIndexRoute,
    manufacturerOverviewRoute,
    manufacturerProductsRoute,
    manufacturerResponsesRoute,
    manufacturerFeedbackRoute,
    manufacturerTerritoryRoute,
    manufacturerAdrRoute,
    manufacturerProfileRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    [key: string]: any;
  }
  interface Register {
    router: typeof router;
  }
}

export default router;
