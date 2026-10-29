import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { routeTree } from "@/app/router";
import { setState } from "@/lib/store";

describe("Unified Login & Portal Selection Flow", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    setState(() => ({ signedIn: false }));
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    setState(() => ({ signedIn: false }));
  });

  it("renders portal selection with Doctor Workspace active by default on /login", async () => {
    const history = createMemoryHistory({ initialEntries: ["/login"] });
    const router = createRouter({
      routeTree,
      history,
      context: { queryClient: new QueryClient() },
    });
    await router.load();
    render(<RouterProvider router={router} />);

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByText("Sign in to your doctor workspace.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Doctor$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /^Admin$/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: /^Manufacturer$/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("switches to Admin Portal tab correctly and displays admin demo credentials", async () => {
    const history = createMemoryHistory({ initialEntries: ["/login"] });
    const router = createRouter({
      routeTree,
      history,
      context: { queryClient: new QueryClient() },
    });
    await router.load();
    render(<RouterProvider router={router} />);

    const adminBtn = screen.getByRole("button", { name: /^Admin$/i });
    fireEvent.click(adminBtn);

    await waitFor(() => {
      expect(screen.getByText("Administrator Sign In")).toBeInTheDocument();
      expect(
        screen.getByText("Access the Meyveda Grantha governance and administration console.")
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Admin$/i })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByText("Demo Administrator Accounts")).toBeInTheDocument();
    });
  });

  it("switches to Manufacturer Portal tab correctly and displays manufacturer presets", async () => {
    const history = createMemoryHistory({ initialEntries: ["/login"] });
    const router = createRouter({
      routeTree,
      history,
      context: { queryClient: new QueryClient() },
    });
    await router.load();
    render(<RouterProvider router={router} />);

    const mfgBtn = screen.getByRole("button", { name: /^Manufacturer$/i });
    fireEvent.click(mfgBtn);

    await waitFor(() => {
      expect(screen.getByText("Manufacturer Sign In")).toBeInTheDocument();
      expect(
        screen.getByText("Access the Meyveda Grantha manufacturer regulatory and formulation portal.")
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Manufacturer$/i })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByText(/AVN Herbals/i)).toBeInTheDocument();
    });
  });
});
