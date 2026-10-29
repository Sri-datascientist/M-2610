import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { routeTree } from "@/app/router";
import { setState } from "@/lib/store";
import { apiClient } from "@/services/apiClient";

describe("Unified Credential-Based Auto-Routing Flow", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    setState(() => ({ signedIn: false }));
    vi.restoreAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    setState(() => ({ signedIn: false }));
    vi.restoreAllMocks();
  });

  it("renders unified sign-in form without role selection tabs on /login", async () => {
    const history = createMemoryHistory({ initialEntries: ["/login"] });
    const router = createRouter({
      routeTree,
      history,
      context: { queryClient: new QueryClient() },
    });
    await router.load();
    render(<RouterProvider router={router} />);

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(
      screen.getByText(/Doctor Workspace, Administrator console, or Manufacturer portal/i),
    ).toBeInTheDocument();

    // Verify there are NO role tabs (Doctor, Admin, Manufacturer)
    expect(screen.queryByRole("button", { name: /^Doctor$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Admin$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Manufacturer$/i })).not.toBeInTheDocument();

    // Verify the inputs
    expect(screen.getByLabelText("Doctor Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Sign In$/i })).toBeInTheDocument();
  });

  it("automatically routes to Administrator Console when admin credentials are authenticated", async () => {
    vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      access_token: "mock-admin-token",
      role: "admin",
      user_id: "admin-id-1",
    });

    const history = createMemoryHistory({ initialEntries: ["/login"] });
    const router = createRouter({
      routeTree,
      history,
      context: { queryClient: new QueryClient() },
    });
    await router.load();
    render(<RouterProvider router={router} />);

    fireEvent.change(screen.getByLabelText("Doctor Email"), {
      target: { value: "admin@meyveda.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "mey@123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(localStorage.getItem("meyveda_user_role")).toBe("admin");
      expect(sessionStorage.getItem("meyveda-admin")).toBeTruthy();
      expect(router.state.location.pathname).toBe("/admin/home");
    });
  });

  it("automatically routes to Manufacturer Portal when manufacturer credentials are authenticated", async () => {
    vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      access_token: "mock-mfg-token",
      role: "manufacturer",
      user_id: "mfg-id-1",
    });

    const history = createMemoryHistory({ initialEntries: ["/login"] });
    const router = createRouter({
      routeTree,
      history,
      context: { queryClient: new QueryClient() },
    });
    await router.load();
    render(<RouterProvider router={router} />);

    fireEvent.change(screen.getByLabelText("Doctor Email"), {
      target: { value: "regulatory@avnherbals.in" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Meyveda@2026" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(localStorage.getItem("meyveda_user_role")).toBe("manufacturer");
      expect(sessionStorage.getItem("meyveda_mfg_session")).toBeTruthy();
      expect(router.state.location.pathname).toBe("/manufacturer/overview");
    });
  });

  it("automatically routes to Doctor Workspace when doctor credentials are authenticated", async () => {
    vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      access_token: "mock-doctor-token",
      role: "doctor",
      user_id: "doc-id-1",
    });

    const history = createMemoryHistory({ initialEntries: ["/login"] });
    const router = createRouter({
      routeTree,
      history,
      context: { queryClient: new QueryClient() },
    });
    await router.load();
    render(<RouterProvider router={router} />);

    fireEvent.change(screen.getByLabelText("Doctor Email"), {
      target: { value: "doctor@practice.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Doctor123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(localStorage.getItem("meyveda_user_role")).toBe("doctor");
      expect(router.state.location.pathname).toBe("/workspace");
    });
  });
});
