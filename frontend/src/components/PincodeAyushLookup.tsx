import React, { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Building2,
  ShieldCheck,
  Scale,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  RotateCcw,
  Compass,
} from "lucide-react";
import { apiClient } from "@/services/apiClient";

export interface PostOfficeDetail {
  name: string;
  branch_type?: string | null;
  delivery_status?: string | null;
  circle?: string | null;
  district?: string | null;
  division?: string | null;
  region?: string | null;
  state?: string | null;
  country?: string | null;
  pincode: string;
}

export interface AyushGovernanceDetails {
  board_type: string;
  board_name: string;
  statutory_act: string;
  controlling_authority: string;
  jurisdiction: "State" | "UT" | "Central" | string;
  official_portal: string;
  description: string;
  region_note?: string | null;
}

export interface PincodeLookupResult {
  pincode: string;
  district: string;
  state: string;
  region?: string | null;
  division?: string | null;
  post_offices: string[];
  primary_post_office?: PostOfficeDetail | null;
  ayush_governance: AyushGovernanceDetails;
}

export interface PincodeAyushLookupProps {
  initialPincode?: string;
  onResolved?: (data: PincodeLookupResult) => void;
  className?: string;
  showCardTitle?: boolean;
}

export function PincodeAyushLookup({
  initialPincode = "",
  onResolved,
  className = "",
  showCardTitle = true,
}: PincodeAyushLookupProps) {
  const [pincode, setPincode] = useState(initialPincode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PincodeLookupResult | null>(null);

  const fetchPincodeDetails = useCallback(
    async (code: string) => {
      const clean = code.trim();
      if (!/^[1-9][0-9]{5}$/.test(clean)) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await apiClient.get<PincodeLookupResult>(`/api/v1/pincode/${clean}`);
        setResult(data);
        if (onResolved) {
          onResolved(data);
        }
      } catch (err: any) {
        setResult(null);
        const msg =
          err?.response?.data?.detail ||
          err?.message ||
          `Unable to resolve PIN code ${clean}. Please verify the 6-digit code.`;
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [onResolved]
  );

  // 400ms Debounce effect on pincode input
  useEffect(() => {
    const clean = pincode.replace(/\D/g, "").slice(0, 6);
    if (clean.length === 6) {
      const timer = setTimeout(() => {
        fetchPincodeDetails(clean);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setResult(null);
      setError(null);
      setIsLoading(false);
    }
  }, [pincode, fetchPincodeDetails]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(val);
  };

  const handleClear = () => {
    setPincode("");
    setResult(null);
    setError(null);
  };

  return (
    <div
      className={`rounded-2xl border border-[#EBE7DF] bg-white p-5 sm:p-6 shadow-xs transition-all ${className}`}
    >
      {showCardTitle && (
        <div className="mb-4 flex items-center justify-between border-b border-[#EBE7DF] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#E67230]/10 text-[#E67230]">
              <Compass className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111111]">
                PIN Code &amp; AYUSH Governance Lookup
              </h3>
              <p className="text-[11px] text-[#666666]">
                Instant postal geography &amp; statutory medical authority mapping
              </p>
            </div>
          </div>
          {pincode && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-semibold text-[#777777] hover:text-[#E67230] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="size-3" /> Clear
            </button>
          )}
        </div>
      )}

      {/* Input Field */}
      <div className="space-y-1.5">
        <label htmlFor="pincode-input" className="block text-xs font-bold uppercase tracking-wider text-[#555555]">
          Indian Postal PIN Code
        </label>
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute left-3.5 flex items-center text-[#777777]">
            <MapPin className="size-4 text-[#E67230]" />
          </div>
          <input
            id="pincode-input"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="e.g. 600001, 110001, 560001"
            value={pincode}
            onChange={handleInputChange}
            className="w-full rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] py-2.5 pl-10 pr-10 font-mono text-sm sm:text-base font-bold tracking-widest text-[#111111] placeholder:text-[#999999] placeholder:tracking-normal placeholder:font-sans focus:border-[#E67230] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#E67230] transition-colors"
          />
          <div className="absolute right-3 flex items-center">
            {isLoading ? (
              <Loader2 className="size-4 animate-spin text-[#E67230]" />
            ) : pincode.length === 6 && result ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : pincode.length === 6 && error ? (
              <AlertCircle className="size-4 text-red-500" />
            ) : (
              <span className="text-[11px] font-mono text-[#999999]">
                {pincode.length}/6
              </span>
            )}
          </div>
        </div>
        <p className="text-[11px] text-[#777777]">
          Enter any 6-digit postal code across 28 Indian States &amp; 8 Union Territories.
        </p>
      </div>

      {/* Loading state skeleton */}
      {isLoading && (
        <div className="mt-4 rounded-xl border border-[#E67230]/20 bg-[#FAF9F6] p-4 text-center animate-pulse space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#E67230]">
            <Loader2 className="size-4 animate-spin" />
            Resolving postal geography &amp; statutory AYUSH council...
          </div>
          <div className="h-2 w-3/4 mx-auto rounded bg-[#EBE7DF]" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50/70 p-3.5 text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in-50">
          <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Lookup Notice:</span> {error}
          </div>
        </div>
      )}

      {/* Result Cards Display */}
      {result && !isLoading && (
        <div className="mt-5 space-y-4 animate-in fade-in-50 duration-200">
          {/* Card 1: Geographic Resolution */}
          <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#555555]">
                <MapPin className="size-3.5 text-[#E67230]" /> Postal Geography
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-500/20">
                Verified PIN: {result.pincode}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#777777]">District</span>
                <p className="font-bold text-[#111111] text-sm">{result.district}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#777777]">State / UT</span>
                <p className="font-bold text-[#111111] text-sm">{result.state}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#777777]">Division</span>
                <p className="font-semibold text-[#333333] text-sm">{result.division || "—"}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#777777]">Region</span>
                <p className="font-semibold text-[#333333] text-sm">{result.region || "—"}</p>
              </div>
            </div>

            {result.post_offices.length > 0 && (
              <div className="pt-2 border-t border-[#EBE7DF]/80">
                <span className="text-[10px] uppercase font-bold text-[#777777] block mb-1.5">
                  Serving Post Offices ({result.post_offices.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.post_offices.slice(0, 6).map((name, idx) => (
                    <span
                      key={idx}
                      className="inline-block rounded-md bg-white border border-[#EBE7DF] px-2 py-0.5 text-[11px] font-medium text-[#444444]"
                    >
                      {name}
                    </span>
                  ))}
                  {result.post_offices.length > 6 && (
                    <span className="inline-block rounded-md bg-white/50 border border-[#EBE7DF] px-2 py-0.5 text-[11px] font-semibold text-[#777777]">
                      +{result.post_offices.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Statutory AYUSH Board Mapping */}
          <div className="rounded-xl border border-[#E67230]/30 bg-gradient-to-br from-white to-[#FFFBF8] p-4.5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E67230]/10 text-xs font-bold text-[#E67230]">
                <Scale className="size-3.5" />
                {result.ayush_governance.board_type}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  result.ayush_governance.jurisdiction === "State"
                    ? "bg-blue-500/10 text-blue-700 border border-blue-500/20"
                    : "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                }`}
              >
                {result.ayush_governance.jurisdiction} Jurisdiction
              </span>
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-extrabold text-[#111111] leading-snug">
                {result.ayush_governance.board_name}
              </h4>
              <p className="mt-1 text-xs text-[#555555] leading-relaxed">
                {result.ayush_governance.description}
              </p>
            </div>

            <div className="space-y-1.5 rounded-lg bg-white/80 border border-[#EBE7DF] p-3 text-xs">
              <div>
                <span className="font-bold text-[#111111]">Statutory Act: </span>
                <span className="text-[#555555]">{result.ayush_governance.statutory_act}</span>
              </div>
              <div>
                <span className="font-bold text-[#111111]">Controlling Authority: </span>
                <span className="text-[#555555]">
                  {result.ayush_governance.controlling_authority}
                </span>
              </div>
            </div>

            {result.ayush_governance.region_note && (
              <div className="rounded-lg bg-amber-50 border border-amber-200/80 p-2.5 text-xs text-amber-800 flex items-start gap-2">
                <Sparkles className="size-4 shrink-0 text-amber-600 mt-0.5" />
                <span>{result.ayush_governance.region_note}</span>
              </div>
            )}

            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-[#777777]">
                Official state portal for practitioner licensing &amp; council verifications.
              </span>
              <a
                href={result.ayush_governance.official_portal}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#E67230] hover:bg-[#d94e10] text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition-colors"
              >
                <span>Visit Board Portal</span>
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PincodeAyushLookup;
