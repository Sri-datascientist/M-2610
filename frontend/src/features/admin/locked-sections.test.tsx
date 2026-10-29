import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { isSectionRouteLocked } from "@/features/admin/locked-sections-config";
import { LockedRouteOverlay, LockedSectionsProvider } from "@/features/admin/locked-sections";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe("Locked sections configuration & overlay", () => {
  it("correctly identifies locked routes and unlocked routes", () => {
    expect(isSectionRouteLocked("/admin/library")).toBe(false);
    expect(isSectionRouteLocked("/admin/doctors")).toBe(false);
    expect(isSectionRouteLocked("/admin/manufacturers")).toBe(false);
    expect(isSectionRouteLocked("/admin/approvals")).toBe(false);
  });

  it("renders a full-coverage blocking layer and hides content when route is locked", () => {
    render(
      <LockedSectionsProvider isRouteLocked={() => true}>
        <LockedRouteOverlay pathname="/admin/library">
          <div data-testid="secret-library-content">
            <h1>Secret Ayurveda Text</h1>
            <button type="button">Edit Text</button>
          </div>
        </LockedRouteOverlay>
      </LockedSectionsProvider>,
    );

    // Lock overlay card is present and visible
    expect(
      screen.getByRole("region", { name: /library management is temporarily locked/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/library management/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to dashboard/i })).toBeInTheDocument();

    // The underlying content container is shielded with invisible, opacity-0, inert, and aria-hidden
    const content = screen.getByTestId("secret-library-content");
    const contentWrapper = content.parentElement;
    expect(contentWrapper).not.toBeNull();
    expect(contentWrapper).toHaveAttribute("aria-hidden", "true");
    expect(contentWrapper).toHaveAttribute("inert", "");
    expect(contentWrapper?.className).toContain("invisible");
    expect(contentWrapper?.className).toContain("opacity-0");
  });

  it("renders content normally without the blocking layer when route is unlocked", () => {
    render(
      <LockedSectionsProvider>
        <LockedRouteOverlay pathname="/admin/doctors">
          <div data-testid="active-doctors-content">
            <h1>Doctor Directory</h1>
          </div>
        </LockedRouteOverlay>
      </LockedSectionsProvider>,
    );

    // Lock banner is not displayed
    expect(
      screen.queryByRole("region", { name: /temporarily locked/i }),
    ).not.toBeInTheDocument();

    // Content is displayed without hidden classes
    const content = screen.getByTestId("active-doctors-content");
    const contentWrapper = content.parentElement;
    expect(contentWrapper).not.toBeNull();
    expect(contentWrapper).not.toHaveAttribute("aria-hidden");
    expect(contentWrapper).not.toHaveAttribute("inert");
    expect(contentWrapper?.className).not.toContain("invisible");
    expect(contentWrapper?.className).not.toContain("opacity-0");
  });
});
