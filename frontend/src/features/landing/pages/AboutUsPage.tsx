import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Home,
  ShieldCheck,
  Building2,
  BookOpen,
  Award,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  HeartHandshake,
  Network,
  Users,
  Compass,
  Scale,
  Activity,
  FileCheck2,
  Boxes,
  Stethoscope,
  ChevronRight,
  Lock,
  Globe2,
  LineChart,
} from "lucide-react";
import meyvedaLogo from "@/assets/meyvedalogo.png";
import { MEYVEDA_CONTACT } from "@/lib/contact-info";

interface ImpactPillar {
  id: string;
  number: string;
  title: string;
  tagline: string;
  summary: string;
  bullets: string[];
  metricLabel: string;
  metricValue: string;
  icon: typeof ShieldCheck;
  highlightColor: string;
  accentBg: string;
}

const IMPACT_PILLARS: ImpactPillar[] = [
  {
    id: "credibility",
    number: "01",
    title: "Eliminating the Credibility Gap",
    tagline: "Statutory Verification & National ABDM Gateway Integration",
    summary:
      "We equip qualified AYUSH practitioners with verified digital health identities (ABDM-HPR), linking state council registrations directly to standardized electronic health records recognized across national healthcare gateways, public health bodies, and insurance providers.",
    bullets: [
      "100% manual State Council registration validation (BAMS, BHMS, BSMS, BUMS, BNYS).",
      "Seamless integration with Ayushman Bharat Digital Mission (ABDM-HPR registry).",
      "No pay-to-play rankings, commercial advertising bias, or synthetic score inflation.",
      "Tamper-proof digital prescription signatures verified by statutory standards.",
    ],
    metricValue: "100%",
    metricLabel: "Council-Verified Registry",
    icon: ShieldCheck,
    highlightColor: "#E67230",
    accentBg: "rgba(230, 114, 48, 0.08)",
  },
  {
    id: "supply-chain",
    number: "02",
    title: "Authenticating the Herbal Supply Chain",
    tagline: "Doctor-Supervised, Zero-Inventory Direct Formulation Fulfillment",
    summary:
      "We replace risky direct-to-consumer self-medication with an authentic, doctor-guided distribution model. Every prescribed classical medicine reaches the patient under clinical supervision, backed by authenticated batch monographs and heavy-metal testing.",
    bullets: [
      "Direct clinic-to-patient fulfillment: zero inventory burden or expired stock risk.",
      "Strict compliance with Pharmacopoeia Laboratory for Indian Medicines (PLIM) norms.",
      "Mandatory Certificate of Analysis (CoA) and heavy-metal assays for every listed batch.",
      "Traceable classical formulation lineages directly referenced to authoritative texts.",
    ],
    metricValue: "0%",
    metricLabel: "Clinic Inventory Burden",
    icon: Boxes,
    highlightColor: "#D86423",
    accentBg: "rgba(216, 100, 35, 0.08)",
  },
  {
    id: "real-world-evidence",
    number: "03",
    title: "Building Global Real-World Evidence (RWE)",
    tagline: "Longitudinal Outcomes & Classical Root-Cause Clinical Research",
    summary:
      "By standardizing clinical intake, constitutional (Prakriti) assessment, and longitudinal outcomes, we aggregate structured clinical evidence that bridges millennia of classical healing with modern peer-reviewed integrative medical science.",
    bullets: [
      "Standardized digital clinical intake matching classical Ayurvedic pathology (Samprapti).",
      "Longitudinal patient recovery tracking across chronic, lifestyle, and autoimmune care.",
      "Anonymized clinical data sets contributing to peer-reviewed AYUSH research registries.",
      "Structured documentation for ADR (Adverse Drug Reaction) pharmacovigilance reporting.",
    ],
    metricValue: "Global",
    metricLabel: "Integrative Medical Reach",
    icon: LineChart,
    highlightColor: "#BE561A",
    accentBg: "rgba(190, 86, 26, 0.08)",
  },
  {
    id: "career-empowerment",
    number: "04",
    title: "Economic & Career Empowerment",
    tagline: "Enterprise Software & Compliant Practice Scale for Independent Doctors",
    summary:
      "We provide independent practitioners and physical clinics with enterprise-grade clinical software, multi-center scheduling, and transparent practice revenue models — removing commercial marketing burdens and middleman exploitation.",
    bullets: [
      "Zero referral commissions: doctors maintain 100% clinical and financial independence.",
      "Integrated Virtual Clinic with teleconsultation, e-prescriptions, and AI clinical support.",
      "Cluster co-working clinic network and district territory fulfillment infrastructure.",
      "Multi-center calendar coordination, automated patient follow-ups, and billing.",
    ],
    metricValue: "100%",
    metricLabel: "Clinical Autonomy",
    icon: Building2,
    highlightColor: "#AE4E18",
    accentBg: "rgba(174, 78, 24, 0.08)",
  },
];

const PRACTICE_METRICS = [
  {
    metric: "100%",
    label: "Statutory Council Verification",
    subtext: "Manual lookup against official State Medical Council registries.",
  },
  {
    metric: "5 Systems",
    label: "Sovereign Systems Supported",
    subtext: "Ayurveda (BAMS), Siddha (BSMS), Homoeopathy, Unani & Naturopathy.",
  },
  {
    metric: "ABDM Aligned",
    label: "National Gateway Standards",
    subtext: "Compliant with Healthcare Professional Registry (HPR) guidelines.",
  },
  {
    metric: "Chennai Hub",
    label: "Central Operating Headquarters",
    subtext: "Unified operational, logistics, and partner coordination center.",
  },
];

export function AboutUsPage() {
  const [activePillarId, setActivePillarId] = useState<string>("credibility");

  const activePillar =
    IMPACT_PILLARS.find((p) => p.id === activePillarId) ?? IMPACT_PILLARS[0];
  const ActiveIcon = activePillar.icon;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] antialiased selection:bg-[#E67230] selection:text-white flex flex-col justify-between">
      {/* -------------------------------------------------------------------- */}
      {/* 1. BRAND NAVIGATION HEADER                                           */}
      {/* -------------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-[#EBE7DF] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1320px] items-center justify-between px-5 sm:h-22 sm:px-8 lg:px-12">
          {/* Brand Logo Link to Landing */}
          <Link
            to="/"
            aria-label="Meyveda — Return to Home"
            className="inline-flex items-center rounded-sm transition-opacity hover:opacity-90"
          >
            <img
              src={meyvedaLogo}
              alt="Meyveda — Reinvent You"
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </Link>

          {/* Center Navigation Links */}
          <nav aria-label="Main Navigation" className="hidden items-center gap-6 lg:flex xl:gap-8">
            <Link
              to="/"
              className="whitespace-nowrap py-2 text-[15px] font-semibold text-[#555555] transition-colors hover:text-[#111111]"
            >
              For Doctors
            </Link>
            <Link
              to="/about"
              className="whitespace-nowrap py-2 text-[15px] font-bold text-[#E67230] border-b-2 border-[#E67230]"
            >
              About us
            </Link>
            <Link
              to="/"
              hash="public-relation"
              className="whitespace-nowrap py-2 text-[15px] font-semibold text-[#555555] transition-colors hover:text-[#111111]"
            >
              Public relation
            </Link>
            <Link
              to="/contact"
              className="whitespace-nowrap py-2 text-[15px] font-semibold text-[#555555] transition-colors hover:text-[#111111]"
            >
              Contact us
            </Link>
            <Link
              to="/"
              hash="blogs"
              className="whitespace-nowrap py-2 text-[15px] font-semibold text-[#555555] transition-colors hover:text-[#111111]"
            >
              Blogs
            </Link>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm sm:text-[15px] font-bold text-[#111111] transition-colors hover:text-[#E67230]"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#E67230] px-5 text-sm sm:text-[15px] font-bold text-white shadow-[0_2px_8px_-2px_rgba(230,114,48,0.4)] transition-all hover:bg-[#D15F1F]"
            >
              <span>Register as Doctor</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/"
              className="inline-flex size-10 sm:size-11 items-center justify-center rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] text-[#555555] hover:bg-white hover:text-[#E67230] hover:border-[#E67230]/40 transition-colors shadow-2xs"
              title="Return to Meyveda Home"
              aria-label="Back to Home"
            >
              <Home className="size-4.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* MAIN CONTENT CONTAINER                                               */}
      {/* -------------------------------------------------------------------- */}
      <main className="flex-1">
        {/* ================================================================== */}
        {/* 2. HERO SECTION — THE MODERN ERA OF AYUSH                           */}
        {/* ================================================================== */}
        <section className="relative overflow-hidden border-b border-[#EBE7DF] bg-white py-16 sm:py-22 lg:py-26">
          {/* Subtle Ambient Radial Glow */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(230, 114, 48, 0.14) 0%, rgba(250, 249, 246, 0) 70%)",
            }}
          />

          <div className="relative mx-auto max-w-[1180px] px-5 sm:px-8 lg:px-12 text-center">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FBD9C3] bg-[#FFF3EB] px-4 py-1.5 mb-6 shadow-2xs">
              <span className="flex size-4 items-center justify-center rounded-full bg-[#E67230] text-white">
                <Sparkles className="size-2.5" />
              </span>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E67230]">
                THE MODERN ERA OF AYUSH
              </p>
            </div>

            {/* Main Hero Headline */}
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-[64px] font-extrabold tracking-tight text-[#111111] leading-[1.08]"
              style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
            >
              Operating System for <br className="hidden sm:inline" />
              <span className="text-[#E67230]">AYUSH Practitioners</span>
            </h1>

            {/* Sub-headline */}
            <p className="mx-auto mt-6 max-w-3xl text-lg sm:text-xl lg:text-[22px] leading-relaxed text-[#555555] font-medium">
              21st-Century Modern Assistance for India’s Oldest Sovereign Medicine System.
            </p>

            <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-[#777777] leading-relaxed">
              Equipping registered Vaidyas, Siddha practitioners, and traditional physicians with verified
              digital identities, authenticated medicine fulfillment, and clinical practice infrastructure.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/"
                className="inline-flex h-12 sm:h-13 items-center justify-center gap-2 rounded-xl bg-[#E67230] px-7 text-sm sm:text-base font-bold text-white shadow-[0_4px_16px_-4px_rgba(230,114,48,0.45)] transition-all hover:bg-[#D15F1F] hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Explore the Platform</span>
                <ArrowRight className="size-4" />
              </Link>

              <a
                href="#who-we-are"
                className="inline-flex h-12 sm:h-13 items-center justify-center gap-2 rounded-xl border border-[#D5D0C6] bg-white px-7 text-sm sm:text-base font-bold text-[#111111] hover:border-[#E67230] hover:text-[#E67230] hover:bg-[#FAF9F6] transition-all shadow-2xs"
              >
                <span>Learn Our Story</span>
                <ChevronRight className="size-4" />
              </a>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* 3. PRACTICE METRICS STRIP — OPERATIONS OPTIMIZED                   */}
        {/* ================================================================== */}
        <section className="border-b border-[#EBE7DF] bg-[#FAF9F6] py-10 sm:py-12">
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
              {PRACTICE_METRICS.map((item, idx) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[#EBE7DF] bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div>
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#E67230] tracking-tight font-serif block">
                      {item.metric}
                    </span>
                    <h3 className="mt-2 text-sm sm:text-base font-bold text-[#111111] leading-snug">
                      {item.label}
                    </h3>
                  </div>
                  <p className="mt-2 text-xs text-[#666666] leading-relaxed">
                    {item.subtext}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* 4. WHO WE ARE: YOUR CLINICIAN-FIRST PARTNER                        */}
        {/* ================================================================== */}
        <section id="who-we-are" className="py-16 sm:py-24 border-b border-[#EBE7DF] bg-white">
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column: Mission Narrative */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E67230]">
                  <HeartHandshake className="size-4" />
                  <span>WHO WE ARE · CLINICIAN-FIRST ECOSYSTEM</span>
                </div>

                <h2
                  className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-[#111111] leading-[1.12]"
                  style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
                >
                  Your Clinician-First Partner
                </h2>

                <p className="text-base sm:text-lg text-[#555555] leading-relaxed">
                  <strong className="font-bold text-[#111111]">Meyveda Ayush Pvt Ltd</strong> is an
                  AYUSH-focused practitioner enablement ecosystem and digital-and-physical practice toolkit.
                  Rather than positioning as an abstract algorithm or commercial middleman, Meyveda serves as a
                  grounded, clinician-first partner designed to help registered AYUSH practitioners (Vaidyas)
                  launch, operate, and scale their careers with absolute professional dignity.
                </p>

                {/* The Clean Division of Responsibility Charter Callout */}
                <div className="rounded-2xl border-l-4 border-[#E67230] bg-gradient-to-r from-[#FFF7F0] to-[#FAF9F6] p-6 sm:p-7 border-y border-r border-[#EBE7DF] shadow-2xs space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#E67230] flex items-center gap-1.5">
                    <Scale className="size-3.5" />
                    <span>The Meyveda Practice Charter</span>
                  </p>
                  <blockquote className="text-base sm:text-lg italic font-medium text-[#111111] leading-relaxed">
                    &ldquo;We establish a clean division of responsibility: every non-medical, operational,
                    administrative, and logistical task stays with us, leaving all clinical decisions and patient
                    care entirely in your hands.&rdquo;
                  </blockquote>
                  <p className="text-xs text-[#777777] font-semibold">
                    — Meyveda Clinician Enablement Commitment
                  </p>
                </div>

                {/* Division Breakdown Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#E67230] uppercase">
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>What Stays With Meyveda</span>
                    </div>
                    <ul className="text-xs text-[#666666] space-y-1.5">
                      <li>• E-Prescriptions &amp; Digital Case Records (HPR)</li>
                      <li>• Zero-inventory pharmacy supply &amp; patient dispatch</li>
                      <li>• Multi-center calendar scheduling &amp; billing</li>
                      <li>• Classical formulation monograph vetting</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#111111] uppercase">
                      <Stethoscope className="size-4 text-[#E67230] shrink-0" />
                      <span>What Stays 100% With You</span>
                    </div>
                    <ul className="text-xs text-[#666666] space-y-1.5">
                      <li>• Diagnostic evaluation &amp; constitutional analysis</li>
                      <li>• Independent clinical decision making</li>
                      <li>• Formulation choice &amp; dosage protocols</li>
                      <li>• Ongoing patient relationship &amp; care stewardship</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Trust & Operational Credentials */}
              <div className="lg:col-span-5 space-y-6">
                <div className="rounded-3xl border border-[#EBE7DF] bg-[#FAF9F6] p-7 sm:p-9 shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#EBE7DF]">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-3 rounded-full bg-[#E67230]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                        Corporate Governance
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#E67230] bg-[#E67230]/10 px-2.5 py-0.5 rounded-full border border-[#E67230]/20">
                      Registered AYUSH Entity
                    </span>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm text-[#555555]">
                    <div className="flex items-start gap-3">
                      <Building2 className="size-4.5 text-[#E67230] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-[#111111] block">Meyveda Ayush Pvt Ltd</strong>
                        <span>Incorporated to build sovereign healthcare operating infrastructure.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <ShieldCheck className="size-4.5 text-[#E67230] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-[#111111] block">No Referral Commissions</strong>
                        <span>Zero pay-to-play listings. Practitioners are never ranked by revenue.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="size-4.5 text-[#E67230] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-[#111111] block">Operating Headquarters</strong>
                        <span>{MEYVEDA_CONTACT.address}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FileCheck2 className="size-4.5 text-[#E67230] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-[#111111] block">ABDM-HPR Protocol Readiness</strong>
                        <span>Unified digital architecture recognized by national health gateways.</span>
                      </div>
                    </div>
                  </div>

                  {/* Connect link */}
                  <div className="pt-4 border-t border-[#EBE7DF]">
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-2 text-xs font-bold text-[#E67230] hover:text-[#D15F1F] transition-colors"
                    >
                      <span>Connect with our leadership team</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* 5. OUR VISION & MISSION: DUAL FOUNDATIONAL PILLARS                 */}
        {/* ================================================================== */}
        <section className="py-16 sm:py-24 border-b border-[#EBE7DF] bg-[#FAF9F6]">
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <p className="text-xs font-bold uppercase tracking-wider text-[#E67230] mb-2">
                STRATEGIC NORTH STAR
              </p>
              <h2
                className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#111111]"
                style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
              >
                Our Vision &amp; Mission
              </h2>
              <p className="mt-3 text-base text-[#666666]">
                Rooted in authentic classical texts, elevated by enterprise clinical engineering.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
              {/* Vision Card */}
              <div className="rounded-3xl border border-[#EBE7DF] bg-white p-8 sm:p-10 shadow-xs hover:border-[#E67230]/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-[#FFF3EB] text-[#E67230] mb-6">
                    <Compass className="size-7" />
                  </div>

                  <span className="text-xs font-bold uppercase tracking-wider text-[#E67230] block mb-2">
                    Long-Term Aspiration
                  </span>

                  <h3
                    className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight mb-4"
                    style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
                  >
                    Our Vision
                  </h3>

                  <p className="text-base sm:text-lg leading-relaxed text-[#555555]">
                    To build the sovereign operational infrastructure for global AYUSH, establishing
                    personalized, preventive, and root-cause traditional healing as an accessible primary
                    pillar of healthcare worldwide.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-[#EBE7DF] flex items-center gap-2 text-xs font-bold text-[#111111]">
                  <Globe2 className="size-4 text-[#E67230]" />
                  <span>Universal Access · Root-Cause Healing · Classical Lineage</span>
                </div>
              </div>

              {/* Mission Card */}
              <div className="rounded-3xl border border-[#EBE7DF] bg-white p-8 sm:p-10 shadow-xs hover:border-[#E67230]/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-[#FFF3EB] text-[#E67230] mb-6">
                    <Award className="size-7" />
                  </div>

                  <span className="text-xs font-bold uppercase tracking-wider text-[#E67230] block mb-2">
                    Actionable Mandate
                  </span>

                  <h3
                    className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight mb-4"
                    style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
                  >
                    Our Mission
                  </h3>

                  <p className="text-base sm:text-lg leading-relaxed text-[#555555]">
                    To empower qualified AYUSH practitioners with modern, accessible clinical tools, connect
                    patients with transparent, protocol-based care, and ensure that every formulation
                    prescribed traces its lineage back to authenticated classical texts and strict laboratory
                    quality standards.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-[#EBE7DF] flex items-center gap-2 text-xs font-bold text-[#111111]">
                  <CheckCircle2 className="size-4 text-[#E67230]" />
                  <span>Modern Clinical Software · Verified Formulations · Transparent Care</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* 6. THE IMPACT WE DELIVER: 4 CORE PILLARS (INTERACTIVE SHOWCASE)   */}
        {/* ================================================================== */}
        <section id="impact" className="py-16 sm:py-24 border-b border-[#EBE7DF] bg-white">
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
            <div className="max-w-3xl mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E67230] mb-2">
                <Activity className="size-4" />
                <span>MEASURABLE TRANSFORMATION</span>
              </div>
              <h2
                className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-[#111111] leading-[1.12]"
                style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
              >
                The Impact We Deliver
              </h2>
              <p className="mt-4 text-base sm:text-lg text-[#555555] leading-relaxed">
                Traditional medicine touches over a billion lives, yet qualified Vaidyas often shoulder
                operational friction that distracts from patient healing. Meyveda delivers measurable
                transformation across four core pillars.
              </p>
            </div>

            {/* Interactive Pillar Selector Tabs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              {IMPACT_PILLARS.map((pillar) => {
                const isSelected = activePillarId === pillar.id;
                const IconComponent = pillar.icon;
                return (
                  <button
                    key={pillar.id}
                    type="button"
                    onClick={() => setActivePillarId(pillar.id)}
                    aria-pressed={isSelected}
                    className={`rounded-2xl border p-4 sm:p-5 text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E67230] ${
                      isSelected
                        ? "border-[#E67230] bg-[#FFF8F2] shadow-sm ring-1 ring-[#E67230]"
                        : "border-[#EBE7DF] bg-[#FAF9F6] hover:bg-white hover:border-[#D5D0C6]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`flex size-8 items-center justify-center rounded-lg text-xs font-bold ${
                          isSelected
                            ? "bg-[#E67230] text-white"
                            : "bg-[#EBE7DF] text-[#666666]"
                        }`}
                      >
                        {pillar.number}
                      </span>
                      <IconComponent
                        className={`size-4.5 ${
                          isSelected ? "text-[#E67230]" : "text-[#777777]"
                        }`}
                      />
                    </div>
                    <p
                      className={`text-sm sm:text-base font-bold leading-snug ${
                        isSelected ? "text-[#111111]" : "text-[#444444]"
                      }`}
                    >
                      {pillar.title}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Selected Pillar Detailed Interactive Display Card */}
            <div className="rounded-3xl border border-[#EBE7DF] bg-[#FAF9F6] p-7 sm:p-10 lg:p-12 shadow-xs transition-all duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                {/* Left side: Detailed Content */}
                <div className="lg:col-span-8 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-[#E67230] text-white text-sm font-bold">
                      {activePillar.number}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#E67230]">
                      {activePillar.tagline}
                    </span>
                  </div>

                  <h3
                    className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#111111] tracking-tight leading-snug"
                    style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
                  >
                    {activePillar.title}
                  </h3>

                  <p className="text-base sm:text-lg text-[#555555] leading-relaxed">
                    {activePillar.summary}
                  </p>

                  <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] mb-3">
                      Key Deliverables &amp; Practice Standards:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activePillar.bullets.map((b) => (
                        <div
                          key={b}
                          className="flex items-start gap-2.5 rounded-xl border border-[#EBE7DF] bg-white p-3.5 shadow-2xs"
                        >
                          <CheckCircle2 className="size-4 text-[#E67230] shrink-0 mt-0.5" />
                          <span className="text-xs text-[#555555] leading-relaxed">
                            {b}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right side: Highlight Badge & Metric Card */}
                <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-6">
                  <div className="rounded-2xl border border-[#EBE7DF] bg-white p-6 shadow-2xs text-center space-y-2">
                    <div className="flex size-12 items-center justify-center rounded-full bg-[#E67230]/10 text-[#E67230] mx-auto mb-2">
                      <ActiveIcon className="size-6" />
                    </div>
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#E67230] font-serif block">
                      {activePillar.metricValue}
                    </span>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                      {activePillar.metricLabel}
                    </p>
                    <p className="text-xs text-[#777777] pt-1">
                      Statutory assurance built into every layer of the Meyveda ecosystem.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#FBD9C3] bg-[#FFF8F2] p-5 text-center space-y-3">
                    <p className="text-xs font-bold text-[#111111]">
                      Ready to experience modern AYUSH practice management?
                    </p>
                    <Link
                      to="/register"
                      className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#E67230] text-xs font-bold text-white shadow-xs hover:bg-[#D15F1F] transition-colors"
                    >
                      <span>Join as Practitioner</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* 7. CALL TO ACTION BANNER                                           */}
        {/* ================================================================== */}
        <section className="py-16 sm:py-22 bg-[#FAF9F6]">
          <div className="mx-auto max-w-[1080px] px-5 sm:px-8 text-center">
            <div className="rounded-3xl border border-[#EBE7DF] bg-white p-8 sm:p-12 lg:p-16 shadow-sm space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FBD9C3] bg-[#FFF3EB] px-3.5 py-1 text-xs font-bold text-[#E67230]">
                <Sparkles className="size-3" />
                <span>START YOUR CLINICAL JOURNEY</span>
              </div>

              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111111] tracking-tight leading-tight"
                style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
              >
                Reinvent Your AYUSH Practice Today
              </h2>

              <p className="mx-auto max-w-xl text-base sm:text-lg text-[#555555] leading-relaxed">
                Connect with verified colleagues, zero-inventory medicine supply, and ABDM-aligned digital tools.
                All operational friction stays with us — your patients stay with you.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
                <Link
                  to="/register"
                  className="inline-flex h-12 sm:h-13 items-center justify-center gap-2 rounded-xl bg-[#E67230] px-7 sm:px-8 text-sm sm:text-base font-bold text-white shadow-[0_4px_16px_-4px_rgba(230,114,48,0.4)] transition-all hover:bg-[#D15F1F] hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Register as Doctor</span>
                  <ArrowRight className="size-4" />
                </Link>

                <Link
                  to="/contact"
                  className="inline-flex h-12 sm:h-13 items-center justify-center rounded-xl border border-[#D5D0C6] bg-white px-7 sm:px-8 text-sm sm:text-base font-bold text-[#111111] hover:border-[#E67230] hover:text-[#E67230] transition-colors shadow-2xs"
                >
                  Contact Our Team
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* -------------------------------------------------------------------- */}
      {/* 8. MEYVEDA COMMON FOOTER                                             */}
      {/* -------------------------------------------------------------------- */}
      <footer className="border-t border-[#EBE7DF] bg-white py-12 text-[#111111] sm:py-16">
        <div className="mx-auto max-w-[1216px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4 lg:gap-8">
            {/* Col 1: Brand & Contact Info */}
            <div className="space-y-4">
              <img
                src={meyvedaLogo}
                alt="Meyveda Logo"
                className="h-9 w-auto object-contain"
              />
              <p className="text-xs sm:text-sm leading-relaxed text-[#555555]">
                The Operating System for AYUSH Practitioners. Platform enablement, verified supply chain,
                and digital clinical infrastructure across India.
              </p>
              <div className="pt-2 text-xs text-[#555555] space-y-1.5">
                <p className="flex items-center gap-2">
                  <Mail className="size-3.5 text-[#E67230]" />
                  <a
                    href={`mailto:${MEYVEDA_CONTACT.email}`}
                    className="hover:text-[#E67230] transition-colors font-semibold"
                  >
                    {MEYVEDA_CONTACT.email}
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="size-3.5 text-[#E67230]" />
                  <a
                    href={`tel:${MEYVEDA_CONTACT.phone}`}
                    className="hover:text-[#E67230] transition-colors font-semibold"
                  >
                    {MEYVEDA_CONTACT.phoneFormatted}
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-[#E67230]" />
                  <span>{MEYVEDA_CONTACT.address}</span>
                </p>
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#111111]">
                Quick Links
              </p>
              <ul className="mt-4 space-y-2 text-xs sm:text-sm text-[#555555]">
                <li>
                  <Link to="/" className="hover:text-[#E67230] transition-colors">
                    For Doctors
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-[#E67230] font-bold">
                    About us
                  </Link>
                </li>
                <li>
                  <Link to="/" hash="public-relation" className="hover:text-[#E67230] transition-colors">
                    Public relation
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-[#E67230] transition-colors">
                    Contact us
                  </Link>
                </li>
                <li>
                  <Link to="/" hash="blogs" className="hover:text-[#E67230] transition-colors">
                    Blogs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Programs & Partnerships */}
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#111111]">
                Platform
              </p>
              <ul className="mt-4 space-y-2 text-xs sm:text-sm text-[#555555]">
                <li>
                  <Link to="/cluster-franchise" className="hover:text-[#E67230] transition-colors">
                    Cluster Franchise Partner
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-[#E67230] transition-colors">
                    Doctor Portal Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-[#E67230] transition-colors">
                    Register as Practitioner
                  </Link>
                </li>
                <li>
                  <a href="#impact" className="hover:text-[#E67230] transition-colors">
                    Clinical Impact Pillars
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Statutory & Governance */}
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#111111]">
                Governance
              </p>
              <ul className="mt-4 space-y-2 text-xs sm:text-sm text-[#555555]">
                <li className="flex items-center gap-1.5 text-xs text-[#666666]">
                  <ShieldCheck className="size-3.5 text-[#E67230]" />
                  <span>State AYUSH Council Lookup</span>
                </li>
                <li className="flex items-center gap-1.5 text-xs text-[#666666]">
                  <CheckCircle2 className="size-3.5 text-[#E67230]" />
                  <span>Zero Commission Guarantee</span>
                </li>
                <li className="flex items-center gap-1.5 text-xs text-[#666666]">
                  <Award className="size-3.5 text-[#E67230]" />
                  <span>ABDM-HPR Standards Ready</span>
                </li>
                <li className="flex items-center gap-1.5 text-xs text-[#666666]">
                  <Building2 className="size-3.5 text-[#E67230]" />
                  <span>Meyveda Ayush Pvt Ltd</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Legal Links */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#EBE7DF] pt-8 text-xs text-[#777777] sm:flex-row">
            <p>© {new Date().getFullYear()} Meyveda Ayush Pvt Ltd. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-[#E67230] transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-[#E67230] transition-colors">
                Terms of Service
              </Link>
              <Link to="/contact" className="hover:text-[#E67230] transition-colors">
                Support &amp; Grievance Desk
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
