import { useState, useId } from "react";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  Calendar,
  Truck,
  Users,
  Network,
  GitFork,
  Crown,
  TrendingUp,
  Check,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Search,
  ArrowRight,
  ArrowLeft,
  Home,
  ShieldCheck,
  Send,
  Loader2,
  Copy,
  Info,
  Phone,
  Mail,
  ChevronDown,
  Boxes,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import meyvedaLogo from "@/assets/meyvedalogo.png";
import { apiClient } from "@/services/apiClient";
import { copyToClipboard } from "@/lib/clipboard";
import { seo } from "@/lib/seo";

export type FranchiseTier =
  | "State Cluster Head"
  | "Zone Cluster Franchisee"
  | "Territory Cluster Franchisee";

interface PincodeLookupResult {
  pincode: string;
  district: string;
  state: string;
  region?: string;
  division?: string;
  post_offices?: string[];
  ayush_governance?: {
    board_type?: string;
    board_name?: string;
    statutory_act?: string;
    controlling_authority?: string;
    jurisdiction?: string;
    official_portal?: string;
    description?: string;
  };
}

export function ClusterFranchisePage() {
  // Market Availability State
  const [checkPincode, setCheckPincode] = useState("");
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [availabilityResult, setAvailabilityResult] = useState<PincodeLookupResult | null>(null);

  // Enquiry Form State
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [territoryPincode, setTerritoryPincode] = useState("");
  const [interestedTier, setInterestedTier] = useState<FranchiseTier>("Zone Cluster Franchisee");
  const [message, setMessage] = useState("");

  // Enquiry Form Validation & Submission State
  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    mobile?: string;
    email?: string;
    territoryPincode?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enquiryStatus, setEnquiryStatus] = useState<{
    validated: boolean;
    submittedData?: {
      id?: string;
      fullName: string;
      mobile: string;
      email?: string;
      territoryPincode: string;
      interestedTier: FranchiseTier;
      message?: string;
      timestamp: string;
    };
  } | null>(null);

  // IDs for accessibility
  const checkInputId = useId();
  const nameInputId = useId();
  const mobileInputId = useId();
  const emailInputId = useId();
  const pincodeInputId = useId();
  const tierInputId = useId();
  const messageInputId = useId();

  // Handle Market Availability Check
  const handleCheckAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setPincodeError(null);
    setAvailabilityResult(null);

    const cleanPin = checkPincode.trim();
    const pinRegex = /^[1-9][0-9]{5}$/;

    if (!cleanPin) {
      setPincodeError("PIN code incorrect. Please enter a 6-digit PIN code.");
      return;
    }

    if (!pinRegex.test(cleanPin)) {
      setPincodeError("PIN code incorrect. Must be a 6-digit Indian postal code.");
      return;
    }

    setIsCheckingPincode(true);

    try {
      // Connect to the existing backend territory lookup endpoint
      const res = await apiClient.get<PincodeLookupResult>(`/territory/lookup/${cleanPin}`);
      setAvailabilityResult(res);
      toast.success(`District located: ${res.district}, ${res.state}`);
    } catch (err: any) {
      // Fallback try the general pincode endpoint
      try {
        const fallbackRes = await apiClient.get<any>(`/pincode/${cleanPin}`);
        if (fallbackRes) {
          setAvailabilityResult({
            pincode: fallbackRes.pincode || cleanPin,
            district: fallbackRes.district || "District Located",
            state: fallbackRes.state || "India",
            region: fallbackRes.region,
            division: fallbackRes.division,
            post_offices: fallbackRes.post_offices,
            ayush_governance: fallbackRes.ayush_governance,
          });
          toast.success(`District located: ${fallbackRes.district || cleanPin}`);
        } else {
          setPincodeError("PIN code incorrect.");
        }
      } catch (fallbackErr: any) {
        setPincodeError("PIN code incorrect.");
      }
    } finally {
      setIsCheckingPincode(false);
    }
  };

  // Pre-fill PIN into enquiry form
  const handleApplyWithPincode = (pin: string) => {
    setTerritoryPincode(pin);
    const formElement = document.getElementById("franchise-enquiry");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
    toast.info(`PIN code ${pin} applied to enquiry form.`);
  };

  // Select tier from pricing cards
  const handleSelectTier = (tier: FranchiseTier) => {
    setInterestedTier(tier);
    const formElement = document.getElementById("franchise-enquiry");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
    toast.info(`Selected tier: ${tier}`);
  };

  // Validate Enquiry Form
  const validateEnquiryForm = (): boolean => {
    const errors: typeof formErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pinRegex = /^[1-9][0-9]{5}$/;
    const phoneDigits = mobile.replace(/\D/g, "");

    if (!fullName.trim()) {
      errors.fullName = "Full name is required.";
    } else if (fullName.trim().length < 2) {
      errors.fullName = "Please enter your full name.";
    }

    if (!mobile.trim()) {
      errors.mobile = "Mobile number is required.";
    } else if (phoneDigits.length < 10) {
      errors.mobile = "Please enter a valid 10-digit mobile number.";
    }

    if (email.trim() && !emailRegex.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!territoryPincode.trim()) {
      errors.territoryPincode = "Territory PIN code is required.";
    } else if (!pinRegex.test(territoryPincode.trim())) {
      errors.territoryPincode = "Must be a valid 6-digit PIN code (e.g. 560001).";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Enquiry Submission with Live Backend API & Database
  const handleSendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEnquiryForm()) {
      toast.error("Please resolve the highlighted validation errors.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiClient.post<any>("/api/v1/franchise/enquiry", {
        full_name: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        territory_pincode: territoryPincode.trim(),
        interested_tier: interestedTier,
        message: message.trim() || undefined,
      });

      const submissionRecord = {
        id: res.id,
        fullName: res.full_name,
        mobile: res.mobile,
        email: res.email,
        territoryPincode: res.territory_pincode,
        interestedTier: res.interested_tier as FranchiseTier,
        message: res.message,
        timestamp: new Date(res.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      };

      setEnquiryStatus({
        validated: true,
        submittedData: submissionRecord,
      });

      toast.success("Franchise enquiry registered successfully! Our territory expansion team will contact you.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit enquiry. Please verify your details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy Enquiry Summary
  const handleCopySummary = async () => {
    if (!enquiryStatus?.submittedData) return;
    const d = enquiryStatus.submittedData;
    const summaryText = `Meyveda Cluster Franchise Enquiry:
Name: ${d.fullName}
Mobile: ${d.mobile}
Email: ${d.email || "N/A"}
Territory PIN: ${d.territoryPincode}
Selected Tier: ${d.interestedTier}
Message: ${d.message || "None"}
Timestamp: ${d.timestamp}`;

    const ok = await copyToClipboard(summaryText);
    if (ok) {
      toast.success("Enquiry summary copied to clipboard.");
    } else {
      toast.error("Unable to copy summary.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] antialiased selection:bg-[#E67230]/20 selection:text-[#E67230]">
      {/* -------------------------------------------------------------------- */}
      {/* TOP NAVIGATION BAR                                                   */}
      {/* -------------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-[#EBE7DF] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 sm:h-18 max-w-[1320px] items-center justify-between px-4 sm:px-8 lg:px-12">
          {/* Brand Logo Link to Landing */}
          <Link
            to="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67230] rounded-md"
            aria-label="Meyveda Home"
          >
            <img
              src={meyvedaLogo}
              alt="Meyveda"
              width={1755}
              height={492}
              className="h-9 sm:h-11 w-auto object-contain select-none"
            />
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="#check-availability"
              className="hidden md:inline-flex text-xs sm:text-sm font-semibold text-[#555555] hover:text-[#E67230] transition-colors py-2 px-3"
            >
              Check Availability
            </a>
            <a
              href="#partnership-tiers"
              className="hidden sm:inline-flex text-xs sm:text-sm font-semibold text-[#555555] hover:text-[#E67230] transition-colors py-2 px-3"
            >
              Tiers & Deposits
            </a>
            <a
              href="#franchise-enquiry"
              className="inline-flex h-9 sm:h-10 items-center justify-center rounded-md bg-[#E67230] px-4 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#D15F1F] transition-all hover:-translate-y-0.5"
            >
              Enquire Now
            </a>
            <Link
              to="/"
              className="inline-flex size-9 sm:size-10 items-center justify-center rounded-md border border-[#EBE7DF] bg-[#FAF9F6] text-[#555555] hover:bg-white hover:text-[#E67230] hover:border-[#E67230]/40 transition-colors"
              title="Return to Main Doctor Platform"
              aria-label="Back to Doctor Platform"
            >
              <Home className="size-4.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* 1. HERO SECTION (Light, Luxury, Warm Meyveda Theme)                  */}
      {/* -------------------------------------------------------------------- */}
      <section
        id="hero"
        aria-labelledby="franchise-hero-title"
        className="relative overflow-hidden border-b border-[#E8E4DE] bg-gradient-to-b from-[#FBF9F5] via-[#F8F4EC] to-[#FAF9F6] text-[#111111] py-14 sm:py-18 lg:py-22"
      >
        {/* Subtle decorative warm ambient radial glows */}
        <div
          className="pointer-events-none absolute -top-24 right-0 size-[550px] rounded-full opacity-40 blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(230, 114, 48, 0.15) 0%, rgba(250, 247, 242, 0) 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-10 size-[400px] rounded-full opacity-30 blur-2xl"
          style={{
            background: "radial-gradient(circle, rgba(244, 124, 11, 0.12) 0%, rgba(250, 247, 242, 0) 70%)",
          }}
        />

        <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Column: Headlines & Pitch */}
            <div className="lg:col-span-6 xl:col-span-6 z-10">
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FBD9C3] bg-[#FFF3EB] px-3.5 py-1 mb-4 shadow-2xs">
                <span className="flex size-4 items-center justify-center rounded-full bg-[#E67230] text-white">
                  <Sparkles className="size-2.5" />
                </span>
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E67230]">
                  BUSINESS OPPORTUNITY
                </p>
              </div>

              {/* Headline */}
              <h1
                id="franchise-hero-title"
                className="text-3xl sm:text-5xl lg:text-[50px] xl:text-[54px] font-bold tracking-tight text-[#111111] leading-[1.12]"
                style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
              >
                Become a Meyveda Cluster Franchisee
              </h1>

              {/* Subtitle */}
              <p className="mt-4 sm:mt-5 text-base sm:text-lg lg:text-[19px] leading-relaxed text-[#55524B] max-w-xl">
                Build a lasting <strong className="font-bold text-[#E67230]">AYUSH</strong> healthcare business in your own district — supply, events and community care, backed by the Meyveda network.
              </p>

              {/* Action Buttons */}
              <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-3.5 sm:gap-4">
                <a
                  href="#check-availability"
                  className="inline-flex h-12 sm:h-13 items-center justify-center gap-2 rounded-lg bg-[#E67230] px-6 sm:px-7 text-sm sm:text-base font-bold text-white shadow-[0_4px_16px_-4px_rgba(230,114,48,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#D15F1F] active:translate-y-0"
                >
                  <Search className="size-4 shrink-0" />
                  <span>Check District Availability</span>
                </a>

                <a
                  href="#partnership-tiers"
                  className="inline-flex h-12 sm:h-13 items-center justify-center gap-2 rounded-lg border border-[#E0DBD1] bg-white px-6 sm:px-7 text-sm sm:text-base font-bold text-[#111111] shadow-2xs hover:bg-[#FAF7F2] hover:border-[#E67230]/50 transition-all duration-200"
                >
                  <span>View Partnership Tiers</span>
                  <ArrowRight className="size-4 shrink-0" />
                </a>
              </div>

              {/* Trust & Governance Badges */}
              <div className="mt-8 pt-6 border-t border-[#EBE7DF] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-[13px] text-[#66635D]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#E67230] shrink-0" />
                  <span>Statutory AYUSH Council Alignment</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-[#E67230] shrink-0" />
                  <span>100% Refundable Caution Deposit</span>
                </div>
              </div>
            </div>

            {/* Right Column: Creative, Big, Premium Visual Representation of the Franchise Network */}
            <div className="lg:col-span-6 xl:col-span-6 flex justify-center lg:justify-end z-10 w-full">
              <div className="relative w-full max-w-[560px] xl:max-w-[600px]">
                {/* Ambient glow behind card */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#E67230]/20 via-[#F47C0B]/10 to-[#E67230]/15 blur-xl opacity-75" />

                {/* Main Console Container */}
                <div className="relative rounded-3xl border border-[#E8E4DE] bg-white/95 p-5 sm:p-7 shadow-[0_20px_50px_-12px_rgba(230,114,48,0.18)] backdrop-blur-sm">
                  {/* Console Header Bar */}
                  <div className="flex items-center justify-between pb-3.5 mb-4 sm:mb-5 border-b border-[#EFECE6]">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex size-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E67230] opacity-75" />
                        <span className="relative inline-flex size-2.5 rounded-full bg-[#E67230]" />
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                        Meyveda Cluster Ecosystem
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-full bg-[#FAF7F2] border border-[#EBE7DF] px-2.5 py-0.5 text-[11px] font-semibold text-[#666666]">
                      <MapPin className="size-3 text-[#E67230]" />
                      <span>District Territory Grid</span>
                    </div>
                  </div>

                  {/* Visual Network Architecture Diagram */}
                  <div className="relative rounded-2xl bg-gradient-to-br from-[#FAF9F6] via-[#F6F2EA] to-[#F1ECE0] border border-[#EAE6DE] p-4 sm:p-6 overflow-hidden">
                    {/* SVG Connector Lines (Decorative circuitry / network web) */}
                    <svg
                      className="absolute inset-0 size-full pointer-events-none opacity-40"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <line x1="50%" y1="50%" x2="22%" y2="22%" stroke="#E67230" strokeWidth="2" strokeDasharray="4 4" />
                      <line x1="50%" y1="50%" x2="78%" y2="22%" stroke="#E67230" strokeWidth="2" strokeDasharray="4 4" />
                      <line x1="50%" y1="50%" x2="22%" y2="78%" stroke="#E67230" strokeWidth="2" strokeDasharray="4 4" />
                      <line x1="50%" y1="50%" x2="78%" y2="78%" stroke="#E67230" strokeWidth="2" strokeDasharray="4 4" />
                      <circle cx="50%" cy="50%" r="58" fill="none" stroke="#E67230" strokeWidth="1" strokeDasharray="2 4" />
                      <circle cx="50%" cy="50%" r="95" fill="none" stroke="#E67230" strokeWidth="0.8" opacity="0.5" />
                    </svg>

                    {/* 4 Connected Satellite Nodes */}
                    <div className="grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-10 sm:gap-y-12 relative z-10">
                      {/* Satellite 1: Doctor Touchpoints & CME */}
                      <div className="flex items-start gap-2 sm:gap-2.5 bg-white/95 backdrop-blur-xs rounded-xl p-2.5 sm:p-3 border border-[#E8E4DE] shadow-2xs hover:border-[#E67230]/50 transition-colors">
                        <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#E67230]">
                          <Stethoscope className="size-3.5 sm:size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#111111] truncate">Doctor Network</p>
                          <p className="text-[10px] text-[#777777]">Prescriptions &amp; CME</p>
                        </div>
                      </div>

                      {/* Satellite 2: Physical Co-Working Clinics */}
                      <div className="flex items-start gap-2 sm:gap-2.5 bg-white/95 backdrop-blur-xs rounded-xl p-2.5 sm:p-3 border border-[#E8E4DE] shadow-2xs hover:border-[#E67230]/50 transition-colors justify-self-end w-full">
                        <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#E67230]">
                          <Building2 className="size-3.5 sm:size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#111111] truncate">Co-working Clinics</p>
                          <p className="text-[10px] text-[#777777]">OPD &amp; Therapy Hubs</p>
                        </div>
                      </div>

                      {/* Center Node (Overlaid Medallion) */}
                      <div className="col-span-2 flex justify-center -my-5 sm:-my-6 relative z-20">
                        <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#E67230] to-[#D15F1F] text-white px-4 sm:px-6 py-3 sm:py-3.5 shadow-[0_8px_24px_rgba(230,114,48,0.4)] border-2 border-white ring-4 ring-[#E67230]/20 max-w-[270px] text-center">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Network className="size-4 text-white" />
                            <span className="text-xs font-extrabold uppercase tracking-wide">
                              Cluster Territory Hub
                            </span>
                          </div>
                          <p className="text-[10px] font-medium text-white/90">
                            Exclusive District Command &amp; Supply
                          </p>
                        </div>
                      </div>

                      {/* Satellite 3: Central Depot & GMP Supply */}
                      <div className="flex items-start gap-2 sm:gap-2.5 bg-white/95 backdrop-blur-xs rounded-xl p-2.5 sm:p-3 border border-[#E8E4DE] shadow-2xs hover:border-[#E67230]/50 transition-colors">
                        <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#E67230]">
                          <Truck className="size-3.5 sm:size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#111111] truncate">Central Depot</p>
                          <p className="text-[10px] text-[#777777]">Direct Pharma Flow</p>
                        </div>
                      </div>

                      {/* Satellite 4: Last-Mile Patient Dispatches */}
                      <div className="flex items-start gap-2 sm:gap-2.5 bg-white/95 backdrop-blur-xs rounded-xl p-2.5 sm:p-3 border border-[#E8E4DE] shadow-2xs hover:border-[#E67230]/50 transition-colors justify-self-end w-full">
                        <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF3EB] text-[#E67230]">
                          <Boxes className="size-3.5 sm:size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#111111] truncate">Patient Delivery</p>
                          <p className="text-[10px] text-[#777777]">Doorstep Express Care</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Highlights & Financial Features Strip */}
                  <div className="mt-4 pt-4 border-t border-[#EFECE6] grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-[#FAF7F2] p-2 sm:p-2.5 border border-[#EBE7DF]">
                      <p className="text-[11px] font-extrabold text-[#E67230]">100% Refundable</p>
                      <p className="text-[9px] text-[#777777] uppercase tracking-wider font-semibold">Caution Deposit</p>
                    </div>
                    <div className="rounded-lg bg-[#FAF7F2] p-2 sm:p-2.5 border border-[#EBE7DF]">
                      <p className="text-[11px] font-extrabold text-[#111111]">1 District = 1 Hub</p>
                      <p className="text-[9px] text-[#777777] uppercase tracking-wider font-semibold">Exclusive Rights</p>
                    </div>
                    <div className="rounded-lg bg-[#FAF7F2] p-2 sm:p-2.5 border border-[#EBE7DF]">
                      <p className="text-[11px] font-extrabold text-[#111111]">Single-Layer</p>
                      <p className="text-[9px] text-[#777777] uppercase tracking-wider font-semibold">Margin Override</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 2. YOUR ROLE IN THE TERRITORY (Screenshot 3 Inspiration)             */}
      {/* -------------------------------------------------------------------- */}
      <section
        id="your-role"
        aria-labelledby="your-role-heading"
        className="scroll-mt-20 border-b border-[#EBE7DF] bg-[#FAF9F6] py-16 sm:py-20 lg:py-24"
      >
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
          {/* Section Header */}
          <div className="max-w-3xl mb-12 sm:mb-14">
            <h2
              id="your-role-heading"
              className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#111111] leading-tight"
              style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
            >
              Your role in the territory
            </h2>
            <p className="mt-3 text-sm sm:text-base lg:text-[17px] leading-relaxed text-[#555555]">
              Cluster franchisees are appointed territory-wise. The smallest territory is at least one district (a 3-digit PIN zone).
            </p>
          </div>

          {/* Four Core Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {/* Card 1: Medicine & consumables supply */}
            <div className="group rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-7 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-[#E67230]/50 hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#E67230] mb-5 group-hover:bg-[#E67230] group-hover:text-white transition-colors duration-200">
                  <Truck className="size-5.5" />
                </div>
                <h3 className="text-lg sm:text-[19px] font-bold tracking-tight text-[#111111] mb-2.5">
                  Medicine &amp; consumables supply
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-[#555555]">
                  Own the supply chain for your territory — prescriptions, clinic orders and last-mile delivery to patients.
                </p>
              </div>
            </div>

            {/* Card 2: CME programs */}
            <div className="group rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-7 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-[#E67230]/50 hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#E67230] mb-5 group-hover:bg-[#E67230] group-hover:text-white transition-colors duration-200">
                  <Calendar className="size-5.5" />
                </div>
                <h3 className="text-lg sm:text-[19px] font-bold tracking-tight text-[#111111] mb-2.5">
                  CME programs
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-[#555555]">
                  Coordinate continuing medical education events with AYUSH doctors across your district.
                </p>
              </div>
            </div>

            {/* Card 3: Medical camps */}
            <div className="group rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-7 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-[#E67230]/50 hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#E67230] mb-5 group-hover:bg-[#E67230] group-hover:text-white transition-colors duration-200">
                  <Users className="size-5.5" />
                </div>
                <h3 className="text-lg sm:text-[19px] font-bold tracking-tight text-[#111111] mb-2.5">
                  Medical camps
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-[#555555]">
                  Organise community medical camps and outreach drives with local practitioners.
                </p>
              </div>
            </div>

            {/* Card 4: Doctor touchpoints */}
            <div className="group rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-7 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-[#E67230]/50 hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#E67230] mb-5 group-hover:bg-[#E67230] group-hover:text-white transition-colors duration-200">
                  <Network className="size-5.5" />
                </div>
                <h3 className="text-lg sm:text-[19px] font-bold tracking-tight text-[#111111] mb-2.5">
                  Doctor touchpoints
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-[#555555]">
                  Onboard practitioners and become the trusted local face of the Meyveda network.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 3. PARTNERSHIP TIERS (Screenshot 4 Inspiration)                      */}
      {/* -------------------------------------------------------------------- */}
      <section
        id="partnership-tiers"
        aria-labelledby="partnership-tiers-heading"
        className="scroll-mt-20 border-b border-[#EBE7DF] bg-white py-16 sm:py-20 lg:py-24"
      >
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
          {/* Section Header */}
          <div className="max-w-3xl mb-12 sm:mb-14">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E67230] mb-2">
              TERRITORY STRUCTURE &amp; DEPOSITS
            </p>
            <h2
              id="partnership-tiers-heading"
              className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#111111] leading-tight"
              style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
            >
              Partnership tiers
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#555555]">
              Every tier operates under a transparent, 100% refundable caution deposit structure rather than a sunk franchise fee.
            </p>
          </div>

          {/* Three Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 items-stretch">
            {/* Tier 1: State Cluster Head */}
            <div className="rounded-2xl border border-[#EBE7DF] bg-[#FAF9F6] p-7 sm:p-8 flex flex-col justify-between shadow-2xs hover:border-[#111111]/30 transition-all duration-200">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
                  State Cluster Head
                </h3>
                <p className="text-xs sm:text-sm text-[#777777] mt-1">
                  State / Union Territory (GST unit)
                </p>

                <div className="mt-6 pb-6 border-b border-[#EBE7DF]">
                  <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111]">
                    ₹10 Lakhs
                  </div>
                  <div className="text-xs font-semibold text-[#888888] mt-1 uppercase tracking-wider">
                    Refundable caution deposit
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-[#111111]">Override:</span>{" "}
                    <span className="text-[#555555]">1% of direct Zone Franchisee revenues</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#111111]">Revenue:</span>{" "}
                    <span className="text-[#555555]">Fixed base + promotional incentives</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <button
                  type="button"
                  onClick={() => handleSelectTier("State Cluster Head")}
                  className="w-full inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-[#111111] bg-white text-xs sm:text-sm font-bold text-[#111111] hover:bg-[#111111] hover:text-white transition-colors cursor-pointer"
                >
                  <span>Select State Tier</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Tier 2: Zone Cluster Franchisee (Most Popular) */}
            <div className="relative rounded-2xl border-2 border-[#E67230] bg-white p-7 sm:p-8 flex flex-col justify-between shadow-lg shadow-[#E67230]/10 hover:shadow-xl transition-all duration-200">
              {/* Most popular badge */}
              <div className="absolute -top-3.5 left-7 rounded-full bg-[#E67230] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-xs">
                Most popular
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
                  Zone Cluster Franchisee
                </h3>
                <p className="text-xs sm:text-sm text-[#777777] mt-1">
                  3-digit PIN zone — at least one district
                </p>

                <div className="mt-6 pb-6 border-b border-[#EBE7DF]">
                  <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#E67230]">
                    ₹5 Lakhs
                  </div>
                  <div className="text-xs font-semibold text-[#888888] mt-1 uppercase tracking-wider">
                    Refundable caution deposit
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-[#111111]">Override:</span>{" "}
                    <span className="text-[#555555]">1% of direct Territory Franchisee revenues</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#111111]">Revenue:</span>{" "}
                    <span className="text-[#555555]">Fixed base + promotional incentives</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <button
                  type="button"
                  onClick={() => handleSelectTier("Zone Cluster Franchisee")}
                  className="w-full inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-[#E67230] text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#D15F1F] transition-all cursor-pointer hover:-translate-y-0.5"
                >
                  <span>Select Zone Tier (Recommended)</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Tier 3: Territory Cluster Franchisee */}
            <div className="rounded-2xl border border-[#EBE7DF] bg-[#FAF9F6] p-7 sm:p-8 flex flex-col justify-between shadow-2xs hover:border-[#111111]/30 transition-all duration-200">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
                  Territory Cluster Franchisee
                </h3>
                <p className="text-xs sm:text-sm text-[#777777] mt-1">
                  Primary PIN + secondary PIN cluster
                </p>

                <div className="mt-6 pb-6 border-b border-[#EBE7DF]">
                  <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111]">
                    ₹2 Lakhs
                  </div>
                  <div className="text-xs font-semibold text-[#888888] mt-1 uppercase tracking-wider">
                    Refundable caution deposit
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-[#111111]">Override:</span>{" "}
                    <span className="text-[#555555]">Standard retail and fulfilment margins</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#111111]">Revenue:</span>{" "}
                    <span className="text-[#555555]">Fixed base + promotional incentives</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <button
                  type="button"
                  onClick={() => handleSelectTier("Territory Cluster Franchisee")}
                  className="w-full inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-[#111111] bg-white text-xs sm:text-sm font-bold text-[#111111] hover:bg-[#111111] hover:text-white transition-colors cursor-pointer"
                >
                  <span>Select Territory Tier</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 4. ATTRACTIVE, FAIR TERMS (Screenshot 5 Inspiration)                 */}
      {/* -------------------------------------------------------------------- */}
      <section
        id="fair-terms"
        aria-labelledby="fair-terms-heading"
        className="scroll-mt-20 border-b border-[#EBE7DF] bg-[#FAF9F6] py-16 sm:py-20 lg:py-24"
      >
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
          {/* Section Heading */}
          <div className="max-w-3xl mb-12">
            <h2
              id="fair-terms-heading"
              className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#111111] leading-tight"
              style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
            >
              Attractive, fair terms
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: 6 Clear Bullet Guarantees */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-4.5">
              {[
                "Minimum territory of a full district — no crowded micro-markets",
                "Refundable caution deposit, not a franchise fee",
                "Fixed margins on fulfilment plus promotional incentives",
                "Early-bird bonuses for under-served PIN zones",
                "1% lifetime royalty if your territory is later bifurcated",
                "Central logistics, compliance and GST-ready state accounting",
              ].map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-3.5">
                  <div className="flex size-6 items-center justify-center rounded-full bg-[#E67230]/15 text-[#E67230] shrink-0 mt-0.5">
                    <Check className="size-3.5 stroke-[2.5]" />
                  </div>
                  <span className="text-sm sm:text-base leading-relaxed text-[#333333] font-medium">
                    {bullet}
                  </span>
                </div>
              ))}
            </div>

            {/* Right Column: 3 Strategic Policy Cards */}
            <div className="lg:col-span-6 space-y-4">
              {/* Card 1: Lifetime bifurcation royalty */}
              <div className="rounded-2xl border border-[#EBE7DF] bg-white p-6 shadow-2xs hover:border-[#E67230]/40 transition-colors">
                <div className="flex items-center gap-2.5 text-[#E67230] mb-2 font-bold text-base">
                  <GitFork className="size-5 shrink-0" />
                  <h3 className="text-base sm:text-lg font-bold text-[#111111]">
                    Lifetime bifurcation royalty
                  </h3>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-[#555555]">
                  When your market grows and is split, the franchisee who first developed it earns 1% of the new territory&apos;s gross revenue — for life, while their own franchise contract stays active. The reward belongs to you personally and does not pass to a replacement.
                </p>
              </div>

              {/* Card 2: Single-layer override */}
              <div className="rounded-2xl border border-[#EBE7DF] bg-white p-6 shadow-2xs hover:border-[#E67230]/40 transition-colors">
                <div className="flex items-center gap-2.5 text-[#E67230] mb-2 font-bold text-base">
                  <Crown className="size-5 shrink-0" />
                  <h3 className="text-base sm:text-lg font-bold text-[#111111]">
                    Single-layer override
                  </h3>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-[#555555]">
                  Each tier earns 1% from the tier directly beneath it — no layer skipping, keeping earnings transparent.
                </p>
              </div>

              {/* Card 3: Growth windows */}
              <div className="rounded-2xl border border-[#EBE7DF] bg-white p-6 shadow-2xs hover:border-[#E67230]/40 transition-colors">
                <div className="flex items-center gap-2.5 text-[#E67230] mb-2 font-bold text-base">
                  <TrendingUp className="size-5 shrink-0" />
                  <h3 className="text-base sm:text-lg font-bold text-[#111111]">
                    Growth windows
                  </h3>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-[#555555]">
                  Time-bound launch campaigns and target-linked multipliers for onboarding practitioners or hitting volume milestones in 30–90 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 5. CHECK MARKET AVAILABILITY SECTION                                  */}
      {/* -------------------------------------------------------------------- */}
      <section
        id="check-availability"
        aria-labelledby="check-availability-heading"
        className="scroll-mt-20 border-b border-[#EBE7DF] bg-white py-16 sm:py-20"
      >
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E67230]/10 text-xs font-bold text-[#E67230] mb-2.5">
              <MapPin className="size-3.5" />
              <span>TERRITORY VERIFICATION</span>
            </span>
            <h2
              id="check-availability-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111111]"
              style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
            >
              Check market availability
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#666666]">
              Enter any PIN code in your district.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleCheckAvailability}
            className="rounded-2xl border border-[#EBE7DF] bg-[#FAF9F6] p-6 sm:p-8 shadow-xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <label htmlFor={checkInputId} className="sr-only">
                  6-digit Indian Postal PIN code
                </label>
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#999999]">
                  <MapPin className="size-4.5" />
                </div>
                <input
                  id={checkInputId}
                  type="text"
                  maxLength={6}
                  value={checkPincode}
                  onChange={(e) => {
                    setCheckPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setPincodeError(null);
                  }}
                  placeholder="Enter 6-digit PIN code (e.g. 560001, 600001)"
                  className="w-full h-12 rounded-lg border border-[#EBE7DF] bg-white pl-10 pr-4 text-sm sm:text-base font-mono tracking-wider text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isCheckingPincode || checkPincode.trim().length !== 6}
                className="h-12 px-7 rounded-lg bg-[#E67230] hover:bg-[#D15F1F] text-white font-bold text-sm sm:text-base inline-flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isCheckingPincode ? (
                  <>
                    <Loader2 className="size-4.5 animate-spin" />
                    <span>Verifying…</span>
                  </>
                ) : (
                  <>
                    <span>Check</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {pincodeError && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-xl bg-[#FFF3EB] border border-[#E67230]/35 p-3.5 text-xs sm:text-sm text-[#111111] shadow-2xs animate-in fade-in-50"
              >
                <AlertCircle className="size-4.5 shrink-0 text-[#E67230]" />
                <span className="font-semibold text-[#111111]">{pincodeError}</span>
              </div>
            )}

            {/* Result Box */}
            {availabilityResult && (
              <div
                role="region"
                aria-live="polite"
                className="rounded-2xl border border-[#EBE7DF] bg-[#FAF9F6] p-5 sm:p-6 space-y-4 shadow-xs animate-in fade-in-50"
              >
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#EBE7DF]">
                  <div className="flex items-center gap-2.5 font-bold text-[#111111] text-base">
                    <CheckCircle2 className="size-5 text-[#E67230] shrink-0" />
                    <span>Postal Record Verified: {availabilityResult.district}, {availabilityResult.state}</span>
                  </div>
                  <span className="font-mono text-xs bg-white px-2.5 py-1 rounded-full border border-[#EBE7DF] text-[#E67230] font-bold">
                    PIN: {availabilityResult.pincode}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-[#EBE7DF] shadow-2xs">
                  <div>
                    <span className="text-[11px] font-semibold text-[#777777] uppercase tracking-wider block">District / Zone</span>
                    <strong className="text-sm font-bold text-[#111111] block mt-0.5">{availabilityResult.district}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#777777] uppercase tracking-wider block">State / UT</span>
                    <strong className="text-sm font-bold text-[#111111] block mt-0.5">{availabilityResult.state}</strong>
                  </div>
                  {availabilityResult.division && (
                    <div>
                      <span className="text-[11px] font-semibold text-[#777777] uppercase tracking-wider block">Postal Division</span>
                      <span className="text-xs text-[#333333] font-medium block mt-0.5">{availabilityResult.division}</span>
                    </div>
                  )}
                  {availabilityResult.ayush_governance?.board_name && (
                    <div className="sm:col-span-2 pt-1 border-t border-[#EBE7DF]">
                      <span className="text-[11px] font-semibold text-[#777777] uppercase tracking-wider block">Statutory AYUSH Authority</span>
                      <span className="text-xs text-[#111111] font-medium block mt-0.5">{availabilityResult.ayush_governance.board_name}</span>
                    </div>
                  )}
                </div>

                {/* Honest Allocation Availability Note */}
                <div className="rounded-xl bg-white p-3.5 text-xs text-[#555555] border border-[#EBE7DF] leading-relaxed space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#111111]">
                    <Info className="size-4 text-[#E67230] shrink-0" />
                    <span>Territory Allocation Status: Open for Partner Expression of Interest</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#555555] pt-0.5">
                    Live exclusive territory reservation is processed in pilot cohorts. Pre-fill your district into the franchise enquiry form below to lock your application priority with our territory desk.
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-between flex-wrap gap-3">
                  <span className="text-[11px] text-[#777777] font-medium">
                    Apply this territory to reserve your exclusive district hub.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyWithPincode(availabilityResult.pincode)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E67230] text-white text-xs font-bold hover:bg-[#D15F1F] transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Apply for {availabilityResult.district} Territory</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 6. FRANCHISE ENQUIRY FORM                                            */}
      {/* -------------------------------------------------------------------- */}
      <section
        id="franchise-enquiry"
        aria-labelledby="franchise-enquiry-heading"
        className="scroll-mt-20 border-b border-[#EBE7DF] bg-[#FAF9F6] py-16 sm:py-20 lg:py-24"
      >
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          <div className="panel p-6 sm:p-10 space-y-6 bg-white border border-[#EBE7DF] rounded-3xl shadow-sm">
            <div className="border-b border-[#EBE7DF] pb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E67230]">
                EXPRESSION OF INTEREST
              </span>
              <h2
                id="franchise-enquiry-heading"
                className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]"
                style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
              >
                Franchise enquiry
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#666666] leading-relaxed">
                Connect with our territory expansion team to begin your application for an exclusive district franchise.
              </p>
            </div>

            {/* Submission Status Notice (Live Database Saved) */}
            {enquiryStatus?.validated && (
              <div
                role="region"
                aria-live="polite"
                className="rounded-2xl border border-[#EBE7DF] bg-[#FAF9F6] p-6 space-y-4 text-xs sm:text-sm shadow-xs animate-in fade-in-50"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap border-b border-[#EBE7DF] pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-full bg-[#E67230]/10 flex items-center justify-center shrink-0 border border-[#E67230]/25">
                      <CheckCircle2 className="size-5 text-[#E67230]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#111111] text-base">
                        Franchise Enquiry Registered
                      </h3>
                      <p className="text-xs text-[#555555]">
                        Your application has been recorded in the central territory database.
                      </p>
                    </div>
                  </div>
                  {enquiryStatus.submittedData?.id && (
                    <span className="font-mono text-xs font-bold text-[#E67230] bg-[#E67230]/10 px-3 py-1 rounded-full border border-[#E67230]/25">
                      Ref: {enquiryStatus.submittedData.id}
                    </span>
                  )}
                </div>

                <div className="rounded-xl border border-[#EBE7DF] bg-white p-4 space-y-3 shadow-2xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-[#777777] uppercase tracking-wider block">
                        Applicant Name
                      </span>
                      <strong className="text-sm font-bold text-[#111111] block mt-0.5">
                        {enquiryStatus.submittedData?.fullName}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-[#777777] uppercase tracking-wider block">
                        Selected Tier
                      </span>
                      <strong className="text-sm font-bold text-[#E67230] block mt-0.5">
                        {enquiryStatus.submittedData?.interestedTier}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-[#777777] uppercase tracking-wider block">
                        Territory PIN Code
                      </span>
                      <span className="font-mono text-xs text-[#111111] font-bold block mt-0.5">
                        {enquiryStatus.submittedData?.territoryPincode}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-[#777777] uppercase tracking-wider block">
                        Contact Mobile
                      </span>
                      <span className="font-mono text-xs text-[#111111] block mt-0.5">
                        {enquiryStatus.submittedData?.mobile}
                      </span>
                    </div>

                    {enquiryStatus.submittedData?.email && (
                      <div className="sm:col-span-2">
                        <span className="text-[11px] font-semibold text-[#777777] uppercase tracking-wider block">
                          Contact Email
                        </span>
                        <span className="font-mono text-xs text-[#111111] block mt-0.5">
                          {enquiryStatus.submittedData.email}
                        </span>
                      </div>
                    )}

                    {enquiryStatus.submittedData?.message && (
                      <div className="sm:col-span-2 pt-1 border-t border-[#EBE7DF]">
                        <span className="text-[11px] font-semibold text-[#777777] uppercase tracking-wider block">
                          Experience / Notes
                        </span>
                        <p className="text-xs text-[#555555] mt-0.5 leading-relaxed">
                          {enquiryStatus.submittedData.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-white p-3.5 text-xs text-[#555555] border border-[#EBE7DF] leading-relaxed flex items-start gap-2 shadow-2xs">
                  <Info className="size-4 text-[#E67230] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#111111]">Next Steps: </span>
                    Our territory manager will review your PIN zone exclusivity and contact you within 24–48 business hours to discuss district allocation and caution deposit escrow.
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#E67230] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#D15F1F] transition-colors cursor-pointer"
                  >
                    <Copy className="size-3.5" />
                    <span>Copy Application Summary</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEnquiryStatus(null);
                      setFullName("");
                      setMobile("");
                      setEmail("");
                      setTerritoryPincode("");
                      setMessage("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#EBE7DF] bg-white px-4 py-2 text-xs font-semibold text-[#555555] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                  >
                    <span>Submit Another Enquiry</span>
                  </button>
                </div>
              </div>
            )}

            {/* Form */}
            {!enquiryStatus?.validated && (
              <form onSubmit={handleSendEnquiry} className="space-y-4 sm:space-y-5 text-xs sm:text-sm">
                {/* Full name (Required) */}
                <div className="space-y-1.5">
                  <label htmlFor={nameInputId} className="block font-semibold text-[#111111]">
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id={nameInputId}
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (formErrors.fullName) setFormErrors((p) => ({ ...p, fullName: undefined }));
                    }}
                    placeholder="e.g. Ramesh Kumar Sharma"
                    className="w-full h-11 sm:h-12 rounded-lg border border-[#EBE7DF] bg-[#FAF9F6]/40 px-3.5 text-[#111111] placeholder:text-[#999999] focus:bg-white focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-all"
                  />
                  {formErrors.fullName && (
                    <p className="text-xs text-red-600 font-medium">{formErrors.fullName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mobile (Required) */}
                  <div className="space-y-1.5">
                    <label htmlFor={mobileInputId} className="block font-semibold text-[#111111]">
                      Mobile <span className="text-red-500">*</span>
                    </label>
                    <input
                      id={mobileInputId}
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => {
                        setMobile(e.target.value);
                        if (formErrors.mobile) setFormErrors((p) => ({ ...p, mobile: undefined }));
                      }}
                      placeholder="e.g. 9876543210"
                      className="w-full h-11 sm:h-12 rounded-lg border border-[#EBE7DF] bg-[#FAF9F6]/40 px-3.5 text-[#111111] placeholder:text-[#999999] focus:bg-white focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-all"
                    />
                    {formErrors.mobile && (
                      <p className="text-xs text-red-600 font-medium">{formErrors.mobile}</p>
                    )}
                  </div>

                  {/* Email (Optional) */}
                  <div className="space-y-1.5">
                    <label htmlFor={emailInputId} className="block font-semibold text-[#111111]">
                      Email <span className="text-xs font-normal text-[#888888]">(optional)</span>
                    </label>
                    <input
                      id={emailInputId}
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (formErrors.email) setFormErrors((p) => ({ ...p, email: undefined }));
                      }}
                      placeholder="e.g. ramesh@example.com"
                      className="w-full h-11 sm:h-12 rounded-lg border border-[#EBE7DF] bg-[#FAF9F6]/40 px-3.5 text-[#111111] placeholder:text-[#999999] focus:bg-white focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-all"
                    />
                    {formErrors.email && (
                      <p className="text-xs text-red-600 font-medium">{formErrors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Territory PIN Code (Required) */}
                  <div className="space-y-1.5">
                    <label htmlFor={pincodeInputId} className="block font-semibold text-[#111111]">
                      Territory PIN code <span className="text-red-500">*</span>
                    </label>
                    <input
                      id={pincodeInputId}
                      type="text"
                      maxLength={6}
                      required
                      value={territoryPincode}
                      onChange={(e) => {
                        setTerritoryPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
                        if (formErrors.territoryPincode) {
                          setFormErrors((p) => ({ ...p, territoryPincode: undefined }));
                        }
                      }}
                      placeholder="e.g. 560001"
                      className="w-full h-11 sm:h-12 rounded-lg border border-[#EBE7DF] bg-[#FAF9F6]/40 px-3.5 font-mono tracking-wider text-[#111111] placeholder:text-[#999999] focus:bg-white focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-all"
                    />
                    {formErrors.territoryPincode && (
                      <p className="text-xs text-red-600 font-medium">{formErrors.territoryPincode}</p>
                    )}
                  </div>

                  {/* Interested Tier (Dropdown, default to Zone Cluster Franchisee) */}
                  <div className="space-y-1.5">
                    <label htmlFor={tierInputId} className="block font-semibold text-[#111111]">
                      Interested tier <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id={tierInputId}
                        value={interestedTier}
                        onChange={(e) => setInterestedTier(e.target.value as FranchiseTier)}
                        className="w-full h-11 sm:h-12 appearance-none rounded-lg border border-[#EBE7DF] bg-[#FAF9F6]/40 pl-3.5 pr-10 text-[#111111] focus:bg-white focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-all cursor-pointer font-medium"
                      >
                        <option value="State Cluster Head">State Cluster Head (₹10 Lakhs)</option>
                        <option value="Zone Cluster Franchisee">Zone Cluster Franchisee (₹5 Lakhs)</option>
                        <option value="Territory Cluster Franchisee">Territory Cluster Franchisee (₹2 Lakhs)</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-[#888888]" />
                    </div>
                  </div>
                </div>

                {/* Message (Optional) */}
                <div className="space-y-1.5">
                  <label htmlFor={messageInputId} className="block font-semibold text-[#111111]">
                    Message <span className="text-xs font-normal text-[#888888]">(optional)</span>
                  </label>
                  <textarea
                    id={messageInputId}
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Briefly describe your distribution, clinical, or community network experience..."
                    className="w-full rounded-lg border border-[#EBE7DF] bg-[#FAF9F6]/40 p-3.5 text-[#111111] placeholder:text-[#999999] focus:bg-white focus:border-[#E67230] focus:ring-1 focus:ring-[#E67230] focus:outline-none transition-all"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 sm:h-13 rounded-lg bg-[#E67230] hover:bg-[#D15F1F] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_4px_16px_-4px_rgba(230,114,48,0.4)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Validating Enquiry…</span>
                      </>
                    ) : (
                      <>
                        <span>Send enquiry</span>
                        <Send className="size-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 7. FOOTER                                                            */}
      {/* -------------------------------------------------------------------- */}
      <footer className="border-t border-[#EBE7DF] bg-white py-12 text-[#111111]">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 border-b border-[#EBE7DF]">
            <div>
              <img
                src={meyvedaLogo}
                alt="Meyveda"
                width={1755}
                height={492}
                className="h-10 w-auto object-contain select-none"
              />
              <p className="mt-2 text-xs sm:text-sm text-[#666666] max-w-md">
                Connecting clinical wisdom with modern pharmacy supply &amp; healthcare infrastructure across India.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#555555]">
              <Link to="/doctor" className="hover:text-[#E67230] transition-colors font-medium">
                Doctor Platform
              </Link>
              <span>·</span>
              <Link to="/terms" className="hover:text-[#E67230] transition-colors font-medium">
                Terms &amp; Conditions
              </Link>
              <span>·</span>
              <Link to="/privacy" className="hover:text-[#E67230] transition-colors font-medium">
                Privacy Policy
              </Link>
              <span>·</span>
              <Link to="/contact" className="hover:text-[#E67230] transition-colors font-medium">
                Contact Us
              </Link>
              <span>·</span>
              <a href="mailto:meyveda@gmail.com" className="hover:text-[#E67230] transition-colors font-medium">
                meyveda@gmail.com
              </a>
              <span>·</span>
              <a href="tel:+919986398332" className="hover:text-[#E67230] transition-colors font-medium">
                +91 99863 98332
              </a>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#888888]">
            <p>© 2026 Meyveda. Reinvent You · All rights reserved.</p>
            <Link
              to="/doctor"
              className="inline-flex items-center gap-1.5 font-semibold text-[#555555] hover:text-[#E67230] transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Doctor Platform</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ClusterFranchisePage;

