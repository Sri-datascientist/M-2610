import React from "react";
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import {
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from "@tanstack/react-router";
import { rootRoute, routeTree } from "@/app/router";
import { Providers } from "@/app/providers";
import { setState, getState } from "@/lib/store";
import { STORAGE_KEY_SESSION } from "@/features/manufacturer/manufacturer-context";

async function renderRoute(path: string) {
  cleanup();
  const history = createMemoryHistory({ initialEntries: [path] });
  const testRouter = createRouter({
    routeTree,
    history,
  });
  await testRouter.load();

  return render(
    <Providers>
      <RouterProvider router={testRouter} />
    </Providers>
  );
}

describe("Role-Based Route and Security Audit", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    setState(() => ({ signedIn: true }));
  });

  /* ------------------------------------------------------------------------ */
  /* 1. PUBLIC MARKETING PORTAL                                               */
  /* ------------------------------------------------------------------------ */
  describe("1. Public Marketing Portal", () => {
    it("renders public landing page (/) with CTAs and branding without credentials", async () => {
      const { findAllByText } = await renderRoute("/");
      const matches = await findAllByText(/Ayurveda|Meyveda/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    it("renders doctor public onboarding page (/doctor) without credentials", async () => {
      const { findAllByText } = await renderRoute("/doctor");
      const matches = await findAllByText(/Ayurveda|Doctor/i);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  /* ------------------------------------------------------------------------ */
  /* 2. AUTHENTICATION & ROLE SELECTION                                       */
  /* ------------------------------------------------------------------------ */
  describe("2. Authentication and Role Selection", () => {
    it("renders /login with default doctor workspace selection", async () => {
      const { findAllByText } = await renderRoute("/login");
      const matches = await findAllByText(/Doctor Workspace|Administrator|Manufacturer/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    it("renders /register for doctor onboarding declaration", async () => {
      const { findAllByText } = await renderRoute("/register");
      const matches = await findAllByText(/Register as a doctor/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    it("renders /forgot-password recovery interface", async () => {
      const { findAllByText } = await renderRoute("/forgot-password");
      const matches = await findAllByText(/Reset your password|Send reset link/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    it("renders /reset-password interface", async () => {
      const { findAllByText } = await renderRoute("/reset-password");
      const matches = await findAllByText(/Choose a new password|Update password/i);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  /* ------------------------------------------------------------------------ */
  /* 3. DOCTOR CLINICAL WORKSPACE                                             */
  /* ------------------------------------------------------------------------ */
  describe("3. Doctor Clinical Workspace", () => {
    it("renders doctor workspace at /workspace when signed in", async () => {
      const { findAllByText } = await renderRoute("/workspace");
      const matches = await findAllByText(/Ayurveda Library|Recent|Good/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    it("renders doctor workspace alias at /ws when signed in", async () => {
      const { findAllByText } = await renderRoute("/ws");
      const matches = await findAllByText(/Ayurveda Library|Recent|Good/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    it("redirects legacy /medicines route to /workspace", async () => {
      const { findAllByText } = await renderRoute("/medicines");
      const matches = await findAllByText(/Ayurveda Library|Recent|Good/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    it("renders Ayurveda monograph library (/library)", async () => {
      const { findAllByText } = await renderRoute("/library");
      const matches = await findAllByText(/Ayurveda Library|Library/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    it("renders clinical quality and batch registry (/quality)", async () => {
      const { findAllByText } = await renderRoute("/quality");
      const matches = await findAllByText(/Quality|Batch/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    it("denies access and shows security boundary on /workspace when signed out", async () => {
      setState(() => ({ signedIn: false }));
      const { findAllByText } = await renderRoute("/workspace");
      const matches = await findAllByText(/Doctor Workspace Session Required/i);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  /* ------------------------------------------------------------------------ */
  /* 4. ADMINISTRATOR PORTAL & GOVERNANCE                                      */
  /* ------------------------------------------------------------------------ */
  describe("4. Administrator Portal", () => {
    it("denies access and shows security boundary on /admin/home when not authenticated", async () => {
      sessionStorage.clear();
      const { findAllByText } = await renderRoute("/admin/home");
      const matches = await findAllByText(/Administrator Session Required/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    it("allows access to /admin/home when authenticated as Platform Administrator", async () => {
      sessionStorage.setItem(
        "meyveda-admin",
        JSON.stringify({
          name: "Ananya Iyer",
          email: "admin@meyveda.com",
          role: "Platform Administrator",
        })
      );
      const { findAllByText } = await renderRoute("/admin/home");
      const matches = await findAllByText(/Overview|Registered Doctors/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    it("allows access to doctor approvals queue (/admin/approvals) when authenticated", async () => {
      sessionStorage.setItem(
        "meyveda-admin",
        JSON.stringify({
          name: "Ananya Iyer",
          email: "admin@meyveda.com",
          role: "Platform Administrator",
        })
      );
      const { findAllByText } = await renderRoute("/admin/approvals");
      const matches = await findAllByText(/Product Approvals|Approvals/i);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  /* ------------------------------------------------------------------------ */
  /* 5. MANUFACTURER PORTAL & COMPLIANCE                                      */
  /* ------------------------------------------------------------------------ */
  describe("5. Manufacturer Portal", () => {
    it("denies access and displays security boundary on /manufacturer/overview when unauthenticated", async () => {
      sessionStorage.clear();
      const { findAllByText } = await renderRoute("/manufacturer/overview");
      const matches = await findAllByText(/Manufacturer Session Required/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    it("allows access to /manufacturer/overview when manufacturer session is present", async () => {
      sessionStorage.setItem(
        STORAGE_KEY_SESSION,
        JSON.stringify({
          brandName: "AVN Ayurveda Formulations",
          contactPerson: "Dr. K. R. Raman",
          email: "regulatory@avnherbals.in",
          licenseNumber: "AYUSH-IND-2024-MFR-004",
        })
      );
      const { findAllByText } = await renderRoute("/manufacturer/overview");
      const matches = await findAllByText(/Overview|Manufacturer Overview|Products/i);
      expect(matches.length).toBeGreaterThan(0);
    });
  });
});
