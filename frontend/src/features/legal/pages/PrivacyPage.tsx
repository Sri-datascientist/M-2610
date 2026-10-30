import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Shield,
  Lock,
  Eye,
  CheckCircle2,
  FileText,
  AlertCircle,
  Database,
  KeyRound,
  Mail,
  ChevronRight,
  ArrowLeft,
  Home,
  Server,
  UserCheck,
} from "lucide-react";
import { seo } from "@/lib/seo";
import meyvedaLogo from "@/assets/meyvedalogo.png";

export const Route = createFileRoute("/privacy")({
  head: () =>
    seo(
      "Privacy Policy | Meyveda",
      "Privacy Policy and data protection framework governing practitioner identity, patient de-identification, and security on the Meyveda platform."
    ),
  component: PrivacyPage,
});

const SECTIONS = [
  { id: "overview", title: "1. Privacy Commitment & Scope" },
  { id: "information-collected", title: "2. Information We Collect" },
  { id: "purpose-processing", title: "3. How We Use Your Information" },
  { id: "patient-protection", title: "4. Patient De-identification Safeguards" },
  { id: "data-sharing", title: "5. Third-Party Disclosures & Security" },
  { id: "encryption-storage", title: "6. Data Security, Encryption & Storage" },
  { id: "retention-deletion", title: "7. Data Retention & Account Deletion" },
  { id: "practitioner-rights", title: "8. Your Statutory Rights" },
  { id: "cookies-sessions", title: "9. Cookies & Authentication Tokens" },
  { id: "policy-updates", title: "10. Changes to This Policy" },
  { id: "grievance-contact", title: "11. Grievance Officer & Contact" },
];

export function PrivacyPage() {
  const [activeSection, setActiveSection] = useState("overview");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] flex flex-col font-sans selection:bg-[#E67230]/20 selection:text-[#E67230]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-[#EBE7DF] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 sm:h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <img
                src={meyvedaLogo}
                alt="Meyveda Logo"
                className="h-9 sm:h-10 w-auto object-contain select-none"
              />
            </Link>
            <span className="hidden sm:inline-block h-5 w-px bg-[#EBE7DF]" />
            <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider text-[#777777]">
              Privacy Documentation
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/terms"
              className="text-xs sm:text-sm font-semibold text-[#555555] hover:text-[#E67230] px-3 py-1.5 transition-colors"
            >
              Terms &amp; Conditions
            </Link>
            <Link
              to="/login"
              className="hidden sm:inline-flex text-xs sm:text-sm font-bold text-[#111111] hover:text-[#E67230] px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-md bg-[#E67230] hover:bg-[#d94e10] text-white px-4 py-2 text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              Register as Doctor
            </Link>
            <Link
              to="/"
              className="inline-flex size-9 sm:size-10 items-center justify-center rounded-md border border-[#EBE7DF] bg-[#FAF9F6] text-[#555555] hover:bg-white hover:text-[#E67230] hover:border-[#E67230]/40 transition-colors shadow-2xs"
              title="Return to Meyveda Home"
              aria-label="Back to Home"
            >
              <Home className="size-4 sm:size-4.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative border-b border-[#EBE7DF] bg-white py-12 sm:py-16 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 select-none opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(230, 114, 48, 0.08) 0%, rgba(250, 249, 246, 0) 70%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#777777] mb-3">
            <Link to="/" className="hover:text-[#E67230] transition-colors inline-flex items-center justify-center size-6 rounded-full border border-[#EBE7DF] bg-white text-[#555555] hover:border-[#E67230]/40" title="Back to Home" aria-label="Back to Home">
              <Home className="size-3.5" />
            </Link>
            <span>/</span>
            <span className="text-[#E67230] font-bold">Privacy Policy</span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-700 mb-3 border border-emerald-500/20">
            <Shield className="size-3.5 text-emerald-600" />
            <span>DPDPA &amp; HEALTHCARE DATA PRIVACY</span>
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#111111]">
            Privacy Policy
          </h1>

          <p className="mt-3 text-sm sm:text-base text-[#555555] max-w-2xl leading-relaxed">
            How Meyveda protects practitioner identities, securely manages verification data, and enforces strict de-identification standards across AYUSH clinical research workflows.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-[#777777] border-t border-[#EBE7DF] pt-4">
            <div>
              <strong>Effective Date:</strong> October 1, 2026
            </div>
            <span>•</span>
            <div>
              <strong>Last Updated:</strong> October 30, 2026
            </div>
            <span>•</span>
            <div>
              <strong>Compliance Baseline:</strong> Indian DPDPA 2023 &amp; IT Act 2000
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout with Sidebar Navigation */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Sticky Table of Contents */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#777777] mb-4 flex items-center gap-2">
                <Lock className="size-4 text-[#E67230]" />
                Privacy Topics
              </h2>
              <nav className="space-y-1">
                {SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollTo(sec.id)}
                    className={`w-full text-left px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                      activeSection === sec.id
                        ? "bg-[#E67230]/10 text-[#E67230] font-bold"
                        : "text-[#555555] hover:bg-[#FAF9F6] hover:text-[#111111]"
                    }`}
                  >
                    <span className="line-clamp-1">{sec.title}</span>
                    <ChevronRight className="size-3.5 opacity-60 shrink-0 ml-1" />
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-5 border-t border-[#EBE7DF] space-y-3">
                <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#EBE7DF]">
                  <p className="text-xs font-bold text-[#111111]">Practitioner Terms</p>
                  <p className="text-[11px] text-[#666666] mt-0.5">
                    Review terms of service, clinical discretion, and eligibility.
                  </p>
                  <Link
                    to="/terms"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#E67230] hover:underline mt-2"
                  >
                    View Terms &amp; Conditions <ChevronRight className="size-3" />
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Column: Detailed Privacy Policy Sections */}
          <main className="lg:col-span-8 space-y-10 text-sm sm:text-[15px] leading-relaxed text-[#444444]">
            {/* Overview */}
            <section id="overview" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <Shield className="size-4" /> Section 1
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                1. Privacy Commitment &amp; Scope
              </h2>
              <p>
                Meyveda Health Technologies Private Limited (&quot;Meyveda&quot;, &quot;We&quot;, &quot;Us&quot;, &quot;Our&quot;) respects the fundamental privacy rights of healthcare professionals and individuals. This Privacy Policy details our practices regarding the collection, storage, processing, and protection of personal and professional data on the Meyveda platform.
              </p>
              <p>
                This policy applies to all registered AYUSH physicians (BAMS, BSMS, BNYS, BHMS, BUMS), medical clinic operators, verified pharmaceutical manufacturers, and visitors interacting with our website, APIs, and clinical workspaces.
              </p>
            </section>

            {/* Information Collected */}
            <section id="information-collected" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <Database className="size-4" /> Section 2
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                2. Information We Collect
              </h2>
              <p>
                To provide verified access to clinical intelligence, statutory literature, and referral rewards, we collect the following categories of data:
              </p>

              <div className="space-y-3 mt-2">
                <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4">
                  <h3 className="font-bold text-[#111111] text-sm">A. Practitioner Professional Credentials</h3>
                  <p className="text-xs sm:text-sm text-[#555555] mt-1">
                    Doctor full name, state medical council or NCISM/NCH registration number, primary qualification (BAMS, BSMS, BNYS, BHMS, BUMS), clinical specialization, practice address, city, and pincode.
                  </p>
                </div>

                <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4">
                  <h3 className="font-bold text-[#111111] text-sm">B. Authentication &amp; Contact Records</h3>
                  <p className="text-xs sm:text-sm text-[#555555] mt-1">
                    Email address (verified via ZeptoMail OTP), mobile telephone number (verified via SMS OTP), salted password hashes (PBKDF2/bcrypt), and role assignment (Doctor, Admin, Manufacturer).
                  </p>
                </div>

                <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4">
                  <h3 className="font-bold text-[#111111] text-sm">C. Peer Referral &amp; Early Access Data</h3>
                  <p className="text-xs sm:text-sm text-[#555555] mt-1">
                    Unique referral invite codes (3 letters + 2 numbers), colleague nomination records, and referral reward logs credited upon completed registration.
                  </p>
                </div>

                <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4">
                  <h3 className="font-bold text-[#111111] text-sm">D. Technical &amp; Security Metadata</h3>
                  <p className="text-xs sm:text-sm text-[#555555] mt-1">
                    IP address, session timestamps, user-agent details, and error logs collected automatically to safeguard against brute-force attacks and session hijacking.
                  </p>
                </div>
              </div>
            </section>

            {/* Purpose */}
            <section id="purpose-processing" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <UserCheck className="size-4" /> Section 3
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                3. How We Use Your Information
              </h2>
              <p>We process collected information strictly for legitimate medical platform operations:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Statutory Council Verification:</strong> Cross-referencing submitted doctor details with authorized State AYUSH and NCISM registries to prevent quackery and maintain a qualified practitioner network.
                </li>
                <li>
                  <strong>Authentication &amp; Account Protection:</strong> Issuing time-bound OTPs to your registered email and mobile number during registration and password resets.
                </li>
                <li>
                  <strong>Clinical Intelligence &amp; Formulary Delivery:</strong> Powering personalized research dossiers, adverse drug reaction (ADR) reporting, and classical formulation search.
                </li>
                <li>
                  <strong>Platform Communications:</strong> Transmitting essential account updates, verification statuses, and referral rewards (we do not send spam or third-party marketing).
                </li>
              </ul>
            </section>

            {/* Patient Protection */}
            <section id="patient-protection" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <Lock className="size-4" /> Section 4
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                4. Patient De-identification Safeguards
              </h2>
              <p>
                Meyveda enforces strict technical and policy boundaries to ensure patient confidentiality is permanently preserved:
              </p>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs sm:text-sm text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Absolute De-Identification Protocol
                </div>
                <p>
                  No patient personally identifiable information (PII)—such as patient legal names, Aadhaar/ID numbers, home addresses, phone numbers, or facial photographs—is ever accepted, requested, or indexed on the Meyveda platform.
                </p>
                <p>
                  All clinical cases, observational notes, and adverse drug reaction forms use randomized pseudonymous case tags (e.g. <code>CASE-2026-0814</code>) and age brackets (e.g. <code>45–50 yrs</code>).
                </p>
              </div>
            </section>

            {/* Third-Party Sharing */}
            <section id="data-sharing" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <Server className="size-4" /> Section 5
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                5. Third-Party Disclosures &amp; Commercial Non-Sale
              </h2>
              <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4 text-sm font-semibold text-[#111111]">
                We do not sell, rent, lease, or monetize practitioner personal data or doctor contact information to any third-party advertisers, data brokers, or pharmaceutical marketers.
              </div>
              <p>We share data exclusively with verified service infrastructure partners under strict confidentiality agreements:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>ZeptoMail by Zoho:</strong> Secure transactional email delivery for practitioner OTP verification codes.</li>
                <li><strong>Statutory SMS Gateways:</strong> Transmitting one-time passwords for mobile verification under Indian telecom guidelines.</li>
                <li><strong>Statutory Compliance:</strong> Where required by valid judicial order, NCISM regulatory directive, or applicable Indian law.</li>
              </ul>
            </section>

            {/* Security */}
            <section id="encryption-storage" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <KeyRound className="size-4" /> Section 6
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                6. Data Security, Encryption &amp; Storage
              </h2>
              <p>
                Meyveda deploys enterprise-grade security controls to protect practitioner data against unauthorized alteration, disclosure, destruction, or exfiltration:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>256-Bit SSL/TLS Encryption:</strong> All client-to-server and API communication is enforced strictly over HTTPS with modern cipher suites.
                </li>
                <li>
                  <strong>Cryptographic Hashing:</strong> Passwords are never stored in plain text. We utilize salted industry-standard cryptographic hashing functions.
                </li>
                <li>
                  <strong>Role-Based Access Control (RBAC):</strong> Granular permissions isolate doctor private research dossiers, manufacturer product catalogues, and administrative governance modules.
                </li>
                <li>
                  <strong>Secure Cloud Infrastructure:</strong> Data is hosted in SOC-2 compliant data centers located within India in compliance with statutory data residency norms.
                </li>
              </ul>
            </section>

            {/* Retention */}
            <section id="retention-deletion" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <FileText className="size-4" /> Section 7
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                7. Data Retention &amp; Account Deletion
              </h2>
              <p>
                We retain your practitioner account data for as long as your account remains active or as required to comply with statutory audit and licensing verification records.
              </p>
              <p>
                You may request account closure and deletion of your profile data at any time by emailing <a href="mailto:meyvedalife@gmail.com" className="text-[#E67230] font-bold hover:underline">meyvedalife@gmail.com</a>. Upon receipt, your account will be deactivated, credentials purged, and private dossiers deleted within 30 calendar days, subject to statutory record-retention requirements under Indian law.
              </p>
            </section>

            {/* Rights */}
            <section id="practitioner-rights" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <Eye className="size-4" /> Section 8
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                8. Your Statutory Rights
              </h2>
              <p>Under the Digital Personal Data Protection Act (DPDPA), 2023, you hold the following rights regarding your personal data:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Right to Access:</strong> View all registered details, credentials, and recorded referral scores in your Profile.</li>
                <li><strong>Right to Rectification:</strong> Update council registration numbers, contact phone, or clinic address.</li>
                <li><strong>Right to Erasure:</strong> Request permanent removal of your account and private notes.</li>
                <li><strong>Right to Grievance Redressal:</strong> File a formal inquiry with our designated Grievance Officer.</li>
              </ul>
            </section>

            {/* Cookies & Tokens */}
            <section id="cookies-sessions" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <Lock className="size-4" /> Section 9
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                9. Cookies &amp; Authentication Tokens
              </h2>
              <p>
                Meyveda uses essential session cookies and local storage tokens (<code>meyveda_auth_token</code>) strictly to maintain your authenticated state across page refreshes and prevent unauthorized CSRF requests.
              </p>
              <p>
                We do not deploy third-party advertising tracking cookies or cross-site behavioral tracking pixels.
              </p>
            </section>

            {/* Policy Updates */}
            <section id="policy-updates" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <FileText className="size-4" /> Section 10
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                10. Changes to This Privacy Policy
              </h2>
              <p>
                We may update this Privacy Policy periodically to reflect enhancements in security standards, statutory regulatory guidelines, or platform features. When changes are made, the &quot;Last Updated&quot; date will be revised. Substantial modifications will be highlighted via notice on the practitioner workspace.
              </p>
            </section>

            {/* Grievance */}
            <section id="grievance-contact" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <Mail className="size-4" /> Section 11
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                11. Grievance Officer &amp; Contact Information
              </h2>
              <p>
                For data protection inquiries, privacy requests, or grievances under the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, please contact:
              </p>
              <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4.5 space-y-1 text-xs sm:text-sm">
                <p><strong>Designated Grievance Officer:</strong> Data Protection &amp; Privacy Officer</p>
                <p><strong>Entity:</strong> Meyveda Health Technologies Private Limited</p>
                <p><strong>Official Email:</strong> <a href="mailto:meyvedalife@gmail.com" className="text-[#E67230] font-bold hover:underline">meyvedalife@gmail.com</a></p>
                <p><strong>Helpline &amp; WhatsApp:</strong> <a href="tel:+919986398332" className="text-[#E67230] font-bold hover:underline">998-MEYVEDA</a></p>
                <p><strong>Operating Office:</strong> Chennai, Tamil Nadu, India</p>
                <p><strong>Response Timelines:</strong> Inquiries acknowledged within 24 hours; resolved within statutory limits.</p>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-[#EBE7DF] bg-white py-8 text-xs text-[#666666]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={meyvedaLogo} alt="Meyveda Logo" className="h-7 w-auto object-contain" />
            <span>© {new Date().getFullYear()} Meyveda. Built for <strong className="font-bold text-[#E65C24]">AYUSH</strong> physicians.</span>
          </div>
          <div className="flex items-center gap-6 font-semibold">
            <Link to="/terms" className="hover:text-[#E67230] hover:underline transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link to="/privacy" className="text-[#E67230] hover:underline">
              Privacy Policy
            </Link>
            <Link to="/login" className="hover:text-[#E67230] hover:underline transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-[#E67230] hover:underline transition-colors">
              Doctor Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

