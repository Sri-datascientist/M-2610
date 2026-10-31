import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Home,
  ShieldCheck,
  Building2,
  Award,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  Compass,
  Scale,
  Boxes,
  ChevronRight,
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
              to="/public-relations"
              className="whitespace-nowrap py-2 text-[15px] font-semibold text-[#555555] transition-colors hover:text-[#111111]"
            >
              Public relation
            </Link>
            <Link
              to="/blogs"
              className="whitespace-nowrap py-2 text-[15px] font-semibold text-[#555555] transition-colors hover:text-[#111111]"
            >
              Blogs
            </Link>
            <Link
              to="/contact"
              className="whitespace-nowrap py-2 text-[15px] font-semibold text-[#555555] transition-colors hover:text-[#111111]"
            >
              Contact us
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
              className="group relative inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#E67230] px-5 text-sm sm:text-[15px] font-bold text-white shadow-[0_4px_16px_-4px_rgba(230,114,48,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#D15F1F] hover:shadow-[0_8px_24px_-4px_rgba(230,114,48,0.5)] active:translate-y-0 active:shadow-sm"
            >
              <span>Register as Doctor</span>
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/"
              className="inline-flex size-10 sm:size-11 items-center justify-center rounded-md border border-[#EBE7DF] bg-[#FAF9F6] text-[#555555] hover:bg-white hover:text-[#E67230] hover:border-[#E67230]/40 transition-colors shadow-2xs"
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
        <section className="relative overflow-hidden border-b border-[#EBE7DF] bg-[#FAF9F6] py-16 sm:py-24 lg:py-28">
          <div className="relative mx-auto max-w-[1216px] px-5 sm:px-8 lg:px-12 text-center">
            {/* Clean Section Eyebrow matching Landing Page philosophy (no pill, no sparkles) */}
            <p className="mb-3 text-xs sm:text-sm font-bold uppercase tracking-widest text-[#E67230]">
              THE MODERN ERA OF AYUSH
            </p>

            {/* Main Hero Headline */}
            <h1
              className="text-[38px] sm:text-[50px] lg:text-[60px] xl:text-[66px] font-bold tracking-tight text-[#111111] leading-[1.08] text-balance max-w-4xl mx-auto"
              style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
            >
              Operating System for <br className="hidden sm:inline" />
              <span className="text-[#E67230]">AYUSH Practitioners</span>
            </h1>

            {/* Sub-headline */}
            <p className="mx-auto mt-5 max-w-3xl text-lg sm:text-xl lg:text-[22px] leading-relaxed text-[#444444] font-medium">
              21st-Century Modern Assistance for India’s Oldest Sovereign Medicine System.
            </p>

            <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-[#666666] leading-relaxed">
              Equipping registered Vaidyas, Siddha practitioners, and traditional physicians with verified
              digital identities, authenticated zero-inventory medicine fulfillment, and clinical practice infrastructure.
            </p>

            {/* Primary Action Buttons styled with Landing Page button philosophy */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                to="/"
                className="group relative inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#E67230] px-7 text-sm font-bold text-white shadow-[0_4px_16px_-4px_rgba(230,114,48,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#D15F1F] hover:shadow-[0_8px_24px_-4px_rgba(230,114,48,0.5)] active:translate-y-0 active:shadow-sm"
              >
                <span>Explore the Platform</span>
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>

              <a
                href="#who-we-are"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#EBE7DF] bg-white px-7 text-sm font-semibold text-[#111111] shadow-none transition-all duration-200 hover:border-[#E67230]/40 hover:bg-[#FAF9F6] hover:text-[#111111]"
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
        <section className="border-b border-[#EBE7DF] bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
              <p className="text-xs font-bold uppercase tracking-wider text-[#E67230] mb-2">
                PRACTICE METRICS · OPERATIONS OPTIMIZED
              </p>
              <h2
                className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight"
                style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
              >
                Centered for Impact
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {PRACTICE_METRICS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-5 sm:p-6 transition-all duration-200 hover:border-[#E67230]/40 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#E67230] tracking-tight font-serif block">
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
        <section id="who-we-are" className="py-16 sm:py-24 border-b border-[#EBE7DF] bg-[#FAF9F6]">
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
            <div className="max-w-3xl space-y-6">
              <div>
                <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#E67230]">
                  WHO WE ARE · YOUR CLINICIAN-FIRST PARTNER
                </p>
                <h2
                  className="text-balance text-3xl font-extrabold leading-[1.14] tracking-tight text-[#111111] sm:text-4xl lg:text-[42px]"
                  style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
                >
                  Your Clinician-First Partner
                </h2>
              </div>

              <p className="text-base sm:text-lg text-[#555555] leading-relaxed">
                <strong className="font-bold text-[#111111]">Meyveda Ayush Pvt Ltd</strong> is an
                AYUSH-focused practitioner enablement ecosystem and Phygital practice toolkit.
                Rather than positioning as an abstract algorithm or commercial middleman, Meyveda serves as a
                grounded, clinician-first partner designed to help registered AYUSH practitioners (Vaidyas)
                launch, operate, and scale their careers with absolute professional dignity.
              </p>

              {/* The Clean Division of Responsibility Charter Callout */}
              <div className="rounded-xl border-l-4 border-[#E67230] border-y border-r border-[#EBE7DF] bg-white p-6 sm:p-7 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#E67230] flex items-center gap-1.5">
                  <Scale className="size-3.5" />
                  <span>The Meyveda Practice Charter</span>
                </p>
                <blockquote className="text-base sm:text-lg italic font-medium text-[#111111] leading-relaxed">
                  &ldquo;We establish a clean division of responsibility: every non-medical, operational,
                  administrative, and logistical task stays with us, leaving all clinical decisions and patient
                  care entirely in your hands.&rdquo;
                </blockquote>
                <p className="text-xs font-medium text-[#777777]">
                  — Meyveda Clinician Enablement Commitment
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* 5. OUR VISION & MISSION: DUAL FOUNDATIONAL PILLARS                 */}
        {/* ================================================================== */}
        <section className="py-16 sm:py-24 border-b border-[#EBE7DF] bg-white">
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
              <p className="text-xs font-bold uppercase tracking-wider text-[#E67230] mb-2.5">
                STRATEGIC NORTH STAR
              </p>
              <h2
                className="text-balance text-3xl font-extrabold leading-[1.14] tracking-tight text-[#111111] sm:text-4xl lg:text-[42px]"
                style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
              >
                Our Vision &amp; Mission
              </h2>
              <p className="mt-3 text-base text-[#6B6B6B] leading-relaxed">
                Rooted in authentic classical texts, elevated by enterprise clinical engineering.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
              {/* Vision Card */}
              <div className="rounded-2xl border border-[#EBE7DF] bg-[#FAF9F6] p-7 sm:p-9 transition-all duration-200 hover:border-[#E67230]/40 flex flex-col justify-between">
                <div>
                  <div className="flex size-12 items-center justify-center rounded-xl bg-white border border-[#EBE7DF] text-[#E67230] mb-6">
                    <Compass className="size-6" />
                  </div>

                  <span className="text-xs font-bold uppercase tracking-wider text-[#E67230] block mb-2">
                    Long-Term Aspiration
                  </span>

                  <h3
                    className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight mb-4"
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

                <div className="mt-8 pt-5 border-t border-[#EBE7DF] flex items-center gap-2 text-xs font-semibold text-[#111111]">
                  <Globe2 className="size-4 text-[#E67230] shrink-0" />
                  <span>Universal Access · Root-Cause Healing · Classical Lineage</span>
                </div>
              </div>

              {/* Mission Card */}
              <div className="rounded-2xl border border-[#EBE7DF] bg-[#FAF9F6] p-7 sm:p-9 transition-all duration-200 hover:border-[#E67230]/40 flex flex-col justify-between">
                <div>
                  <div className="flex size-12 items-center justify-center rounded-xl bg-white border border-[#EBE7DF] text-[#E67230] mb-6">
                    <Award className="size-6" />
                  </div>

                  <span className="text-xs font-bold uppercase tracking-wider text-[#E67230] block mb-2">
                    Actionable Mandate
                  </span>

                  <h3
                    className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight mb-4"
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

                <div className="mt-8 pt-5 border-t border-[#EBE7DF] flex items-center gap-2 text-xs font-semibold text-[#111111]">
                  <CheckCircle2 className="size-4 text-[#E67230] shrink-0" />
                  <span>Modern Clinical Software · Verified Formulations · Transparent Care</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* 6. THE IMPACT WE DELIVER: 4 CORE PILLARS (INTERACTIVE SHOWCASE)   */}
        {/* ================================================================== */}
        <section id="impact" className="py-16 sm:py-24 border-b border-[#EBE7DF] bg-[#FAF9F6]">
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
            <div className="max-w-3xl mb-10 sm:mb-12">
              <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#E67230]">
                MEASURABLE TRANSFORMATION · 4 CORE PILLARS
              </p>
              <h2
                className="text-balance text-3xl font-extrabold leading-[1.14] tracking-tight text-[#111111] sm:text-4xl lg:text-[42px]"
                style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
              >
                The Impact We Deliver
              </h2>
              <p className="mt-3 text-base sm:text-lg text-[#555555] leading-relaxed">
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
                    className={`rounded-xl border p-4 sm:p-5 text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E67230] ${isSelected
                        ? "border-[#E67230] bg-white ring-1 ring-[#E67230] shadow-xs"
                        : "border-[#EBE7DF] bg-white hover:border-[#D5D0C6] hover:bg-[#FAF9F6]"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`font-mono text-xs font-bold ${isSelected ? "text-[#E67230]" : "text-[#888888]"
                          }`}
                      >
                        {pillar.number}
                      </span>
                      <IconComponent
                        className={`size-4.5 ${isSelected ? "text-[#E67230]" : "text-[#777777]"
                          }`}
                      />
                    </div>
                    <p
                      className={`text-sm sm:text-base font-bold leading-snug ${isSelected ? "text-[#111111]" : "text-[#444444]"
                        }`}
                    >
                      {pillar.title}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Selected Pillar Detailed Interactive Display Card */}
            <div className="rounded-2xl border border-[#EBE7DF] bg-white p-7 sm:p-10 lg:p-12 transition-all duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                {/* Left side: Detailed Content */}
                <div className="lg:col-span-8 space-y-5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#E67230]">
                      {activePillar.number}
                    </span>
                    <span className="text-xs text-[#888888]">·</span>
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
                          className="flex items-start gap-2.5 rounded-lg border border-[#EBE7DF] bg-[#FAF9F6] p-3.5"
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

                {/* Right side: Highlight Metric Card */}
                <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-5">
                  <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-6 text-center space-y-2">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-white border border-[#EBE7DF] text-[#E67230] mx-auto mb-2">
                      <ActiveIcon className="size-5.5" />
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

                  <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-5 text-center space-y-3">
                    <p className="text-xs font-bold text-[#111111]">
                      Ready to experience modern AYUSH practice management?
                    </p>
                    <Link
                      to="/register"
                      className="group relative inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#E67230] text-xs font-bold text-white shadow-[0_4px_16px_-4px_rgba(230,114,48,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#D15F1F] active:translate-y-0"
                    >
                      <span>Join as Practitioner</span>
                      <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
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
        <section className="border-t border-[#EBE7DF] bg-white py-16 sm:py-22">
          <div className="mx-auto max-w-[1080px] px-5 sm:px-8 text-center">
            <div className="rounded-2xl border border-[#EBE7DF] bg-[#FAF9F6] p-8 sm:p-12 lg:p-16 space-y-6">
              <p className="text-xs font-bold uppercase tracking-wider text-[#E67230]">
                START YOUR CLINICAL JOURNEY
              </p>

              <h2
                className="text-balance text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#111111] tracking-tight leading-tight"
                style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
              >
                Reinvent Your AYUSH Practice Today
              </h2>

              <p className="mx-auto max-w-xl text-base sm:text-lg text-[#555555] leading-relaxed">
                Connect with verified colleagues, zero-inventory medicine supply, and ABDM-aligned digital tools.
                All operational friction stays with us — your patients stay with you.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
                <Link
                  to="/register"
                  className="group relative inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#E67230] px-7 sm:px-8 text-sm sm:text-base font-bold text-white shadow-[0_4px_16px_-4px_rgba(230,114,48,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#D15F1F] hover:shadow-[0_8px_24px_-4px_rgba(230,114,48,0.5)] active:translate-y-0 active:shadow-sm"
                >
                  <span>Register as Doctor</span>
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/contact"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-[#EBE7DF] bg-white px-7 sm:px-8 text-sm sm:text-base font-semibold text-[#111111] shadow-none transition-all duration-200 hover:border-[#E67230]/40 hover:bg-[#FAF9F6] hover:text-[#111111]"
                >
                  Contact Our Team
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* -------------------------------------------------------------------- */}
      {/* 8. FOOTER                                                            */}
      {/* -------------------------------------------------------------------- */}
      <footer className="border-t border-[#EBE7DF] bg-white py-12 text-xs sm:text-sm">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
            {/* Col 1: Brand Info */}
            <div className="space-y-4">
              <Link to="/" className="inline-block">
                <img src={meyvedaLogo} alt="Meyveda" className="h-10 w-auto" />
              </Link>
              <p className="text-xs leading-relaxed text-[#666666]">
                Meyveda Ayush Pvt Ltd — The clinician-first operating system and clinical enablement
                platform for registered AYUSH physicians across India.
              </p>
              <div className="space-y-1.5 pt-2 text-xs text-[#555555]">
                <p className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-[#E67230] shrink-0" />
                  <span>{MEYVEDA_CONTACT.address}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="size-3.5 text-[#E67230] shrink-0" />
                  <a
                    href={`mailto:${MEYVEDA_CONTACT.email}`}
                    className="hover:text-[#E67230] transition-colors underline"
                  >
                    {MEYVEDA_CONTACT.email}
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="size-3.5 text-[#E67230] shrink-0" />
                  <a
                    href={`tel:${MEYVEDA_CONTACT.phoneRaw}`}
                    className="hover:text-[#E67230] transition-colors"
                  >
                    {MEYVEDA_CONTACT.phone}
                  </a>
                </p>
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#111111]">
                Navigation
              </p>
              <ul className="mt-4 space-y-2 text-xs sm:text-sm text-[#555555]">
                <li>
                  <Link to="/" className="hover:text-[#E67230] transition-colors">
                    Home (Doctor Suite)
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-[#E67230] font-bold transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/cluster-franchise" className="hover:text-[#E67230] transition-colors">
                    District Cluster Franchise
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-[#E67230] transition-colors">
                    Contact Support &amp; Grievance
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Clinical Platform */}
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#111111]">
                Platform
              </p>
              <ul className="mt-4 space-y-2 text-xs sm:text-sm text-[#555555]">
                <li>
                  <a href="#who-we-are" className="hover:text-[#E67230] transition-colors">
                    Clinician-First Charter
                  </a>
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
