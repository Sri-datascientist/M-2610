import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
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
} from "lucide-react";
import meyvedaLogo from "@/assets/meyvedalogo.png";
import { MEYVEDA_CONTACT } from "@/lib/contact-info";

const CORE_PILLARS = [
  {
    icon: BookOpen,
    title: "Classical Knowledge Integrity",
    description:
      "Rooted firmly in classical literature (Brihat Trayi and Laghu Trayi texts), classical formulations, and authentic Rasapanchaka pharmacology. We honor traditional wisdom while organizing it into structured, accessible digital references.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Practitioner Network",
    description:
      "Every physician on Meyveda is manually verified against State AYUSH Council registries (BAMS, BSMS, BNYS, BHMS, BUMS). We implement no commercial scoring, ranking algorithms, or referral commissions.",
  },
  {
    icon: Building2,
    title: "Integrated Practice Infrastructure",
    description:
      "From clinical case continuity and electronic prescriptions to shared clinic co-working spaces and cluster supply chains, we provide Management Service Organization (MSO) support so doctors can focus purely on care delivery.",
  },
];

const PLATFORM_HIGHLIGHTS = [
  {
    metric: "5 Systems",
    label: "Classical Systems Supported",
    detail: "Ayurveda, Siddha, Naturopathy, Homeopathy, and Unani.",
  },
  {
    metric: "100% Vetted",
    label: "Statutory Council Verification",
    detail: "Manual State Council registry lookup with no automated score manipulation.",
  },
  {
    metric: "Chennai Hub",
    label: "Operating Headquarters",
    detail: "Central operational coordination hub for clinical networks across India.",
  },
];

export function AboutUsPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] antialiased selection:bg-[#E67230] selection:text-white flex flex-col justify-between">
      {/* 1. BRAND NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#EBE7DF] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1320px] items-center justify-between px-5 sm:h-22 sm:px-8 lg:px-12">
          {/* LEFT: Meyveda Logo */}
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

          {/* CENTER: Navigation Links */}
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

          {/* RIGHT: CTAs */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm sm:text-[15px] font-bold text-[#111111] transition-colors hover:text-[#E67230]"
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
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-14 sm:py-20 lg:py-24 border-b border-[#EBE7DF] bg-white">
          <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(230,114,48,0.12)_0%,rgba(250,249,246,0)_70%)]" />

          <div className="relative mx-auto max-w-[1080px] px-5 sm:px-8 lg:px-12 text-center">
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#111111] leading-[1.12]"
              style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
            >
              Classical Wisdom. Modern Practice.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base sm:text-lg lg:text-[20px] leading-relaxed text-[#555555]">
              Meyveda is building the foundational clinical and operational infrastructure for verified
              AYUSH physicians — uniting traditional medical intelligence, authentic formulations, and
              practice support across India.
            </p>
          </div>
        </section>

        {/* 3. CORE PILLARS SECTION */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <h2
                className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111]"
                style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
              >
                Our Foundational Pillars
              </h2>
              <p className="mt-3 text-base text-[#666666] leading-relaxed">
                Guided by respect for classical principles and built with modern clinical rigour.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {CORE_PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="group rounded-3xl border border-[#EBE7DF] bg-white p-7 sm:p-8 shadow-xs transition-all duration-200 hover:border-[#E67230]/40 hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex size-13 items-center justify-center rounded-2xl bg-[#FFF3EB] text-[#E67230] mb-6 transition-transform group-hover:scale-105">
                        <Icon className="size-6" />
                      </div>
                      <h3 className="text-xl font-bold text-[#111111] tracking-tight">
                        {pillar.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-[#555555]">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. OUR STORY & PHILOSOPHY (EDITORIAL SPLIT) */}
        <section className="border-y border-[#EBE7DF] bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-center">
              {/* Left Column: Purpose Narrative */}
              <div className="lg:col-span-7 space-y-6">
                <h2
                  className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#111111] leading-tight"
                  style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
                >
                  Why Meyveda Exists
                </h2>
                <p className="text-base sm:text-lg text-[#555555] leading-relaxed">
                  Traditional AYUSH medicine represents centuries of empirical observation, holistic
                  diagnostics, and deep therapeutic wisdom. Yet in daily practice, practitioners frequently
                  face fragmented medicine sourcing, lack of standardized case records, and minimal
                  practice management support.
                </p>
                <p className="text-base text-[#555555] leading-relaxed">
                  Meyveda was founded to bridge this gap. We operate as a dedicated Management Service
                  Organization (MSO) built specifically for classical doctors. We handle administrative
                  coordination, digital record continuity, and authenticated medicine distribution —
                  empowering practitioners to focus entirely on patient diagnosis, healing, and continuous
                  clinical mastery.
                </p>
                <div className="pt-2">
                  <div className="flex flex-wrap items-center gap-6 text-sm text-[#111111] font-semibold">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="size-4.5 text-[#E67230]" />
                      No referral commissions
                    </span>
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="size-4.5 text-[#E67230]" />
                      Manual council verification
                    </span>
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="size-4.5 text-[#E67230]" />
                      Classical integrity first
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Key Commitments Card */}
              <div className="lg:col-span-5">
                <div className="rounded-3xl border border-[#EBE7DF] bg-[#FAF9F6] p-7 sm:p-9 shadow-xs space-y-6">
                  <h3 className="text-xl font-bold text-[#111111] tracking-tight">
                    Meyveda at a Glance
                  </h3>

                  <div className="space-y-5 divide-y divide-[#EBE7DF]">
                    {PLATFORM_HIGHLIGHTS.map((item) => (
                      <div key={item.label} className="pt-5 first:pt-0 space-y-1">
                        <span className="text-2xl sm:text-3xl font-extrabold text-[#E67230] tracking-tight font-serif">
                          {item.metric}
                        </span>
                        <p className="text-sm font-bold text-[#111111]">{item.label}</p>
                        <p className="text-xs text-[#666666] leading-relaxed">{item.detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[#EBE7DF] text-xs text-[#777777] flex items-start gap-2">
                    <MapPin className="size-4 text-[#E67230] shrink-0 mt-0.5" />
                    <span>
                      Headquarters: <strong>{MEYVEDA_CONTACT.address}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. CALL TO ACTION BANNER */}
        <section className="py-16 sm:py-20 bg-[#FAF9F6]">
          <div className="mx-auto max-w-[1080px] px-5 sm:px-8 text-center">
            <div className="rounded-3xl border border-[#EBE7DF] bg-white p-8 sm:p-12 lg:p-14 shadow-sm space-y-6">
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight"
                style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
              >
                Join the Verified AYUSH Network
              </h2>
              <p className="mx-auto max-w-xl text-base text-[#555555] leading-relaxed">
                Connect your practice with peer physicians, verified classical medicine suppliers, and
                structured digital tools.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Link
                  to="/register"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#E67230] px-7 text-sm sm:text-base font-bold text-white shadow-[0_4px_16px_-4px_rgba(230,114,48,0.4)] transition-all hover:bg-[#D15F1F]"
                >
                  <span>Register as Doctor</span>
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-[#EBE7DF] bg-white px-7 text-sm sm:text-base font-bold text-[#111111] hover:border-[#E67230] hover:text-[#E67230] transition-colors"
                >
                  Contact Our Team
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. MEYVEDA COMMON FOOTER */}
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
                Classical wisdom. A stronger practice. Platform support for verified AYUSH
                practitioners across India.
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
                    Doctor Workspace Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-[#E67230] transition-colors">
                    Practitioner Registration
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-[#E67230] transition-colors">
                    Terms &amp; Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-[#E67230] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Operational Hours */}
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#111111]">
                Support Hours
              </p>
              <div className="mt-4 space-y-2 text-xs sm:text-sm text-[#555555]">
                <p>
                  <strong>{MEYVEDA_CONTACT.hours}</strong>
                </p>
                <p>Closed on National &amp; State Gazetted Holidays.</p>
                <div className="pt-3">
                  <a
                    href={MEYVEDA_CONTACT.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] px-3.5 py-2 text-xs font-bold text-[#111111] hover:border-[#25D366] hover:text-[#25D366] transition-colors"
                  >
                    <span>WhatsApp Support</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#EBE7DF] pt-6 text-xs text-[#666666] sm:flex-row">
            <p>© {new Date().getFullYear()} Meyveda Health Technologies. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="hover:text-[#E67230] underline">
                Terms
              </Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-[#E67230] underline">
                Privacy
              </Link>
              <span>•</span>
              <Link to="/contact" className="hover:text-[#E67230] underline">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default AboutUsPage;

