import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PincodeAyushLookup } from "@/components/PincodeAyushLookup";
import { apiClient } from "@/services/apiClient";

describe("PincodeAyushLookup Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders PIN code input field and helper text", () => {
    render(<PincodeAyushLookup />);

    expect(
      screen.getByText("PIN Code & AYUSH Governance Lookup")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. 600001/i)).toBeInTheDocument();
    expect(screen.getByText(/0\/6/)).toBeInTheDocument();
  });

  it("filters non-numeric input and enforces 6-digit maximum", () => {
    render(<PincodeAyushLookup />);
    const input = screen.getByPlaceholderText(/e\.g\. 600001/i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "600abc00199" } });
    expect(input.value).toBe("600001");
    expect(screen.getByText(/6\/6/)).toBeInTheDocument();
  });

  it("triggers API call on 6-digit debounce and displays geographic & governance cards", async () => {
    const mockResponse = {
      pincode: "600001",
      district: "Chennai",
      state: "Tamil Nadu",
      region: "Chennai City",
      division: "Chennai GPO",
      post_offices: ["Chennai G.P.O.", "Mannady", "Sowcarpet"],
      ayush_governance: {
        board_type: "State Statutory Board",
        board_name: "Tamil Nadu Board of Indian Medicine & Homoeopathy",
        statutory_act: "Tamil Nadu Siddha System of Medicine Act",
        controlling_authority: "Department of Health & Family Welfare, Govt. of Tamil Nadu",
        jurisdiction: "State",
        official_portal: "https://www.tn.gov.in",
        description: "Regulates Siddha, Ayurveda, Unani, and Naturopathy practitioners in Tamil Nadu.",
      },
    };

    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockResponse);
    const resolvedSpy = vi.fn();

    render(<PincodeAyushLookup onResolved={resolvedSpy} />);
    const input = screen.getByPlaceholderText(/e\.g\. 600001/i);

    fireEvent.change(input, { target: { value: "600001" } });

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith("/api/v1/pincode/600001");
    });

    await waitFor(() => {
      expect(screen.getByText("Tamil Nadu Board of Indian Medicine & Homoeopathy")).toBeInTheDocument();
      expect(screen.getByText("Chennai")).toBeInTheDocument();
      expect(screen.getByText("Tamil Nadu")).toBeInTheDocument();
      expect(screen.getByText("State Jurisdiction")).toBeInTheDocument();
      expect(screen.getByText("Visit Board Portal")).toBeInTheDocument();
    });

    expect(resolvedSpy).toHaveBeenCalledWith(mockResponse);
  });

  it("displays error notice when API call rejects", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue({
      response: {
        data: { detail: "PIN code incorrect." },
      },
    });

    render(<PincodeAyushLookup />);
    const input = screen.getByPlaceholderText(/e\.g\. 600001/i);

    fireEvent.change(input, { target: { value: "999999" } });

    await waitFor(() => {
      expect(
        screen.getByText(/PIN code incorrect/i)
      ).toBeInTheDocument();
    });
  });
});
