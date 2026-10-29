import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Shield,
  FileText,
  AlertCircle,
  CheckCircle2,
  Lock,
  Stethoscope,
  Scale,
  Building,
  Mail,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { seo } from "@/lib/seo";
import meyvedaLogo from "@/assets/meyvedalogo.png";

export const Route = createFileRoute("/terms")({
  head: () =>
    seo(
      "Terms & Conditions | Meyveda",
      "Terms of Service and Conditions governing the use of the Meyveda clinical intelligence platform, practitioner portal, and AYUSH knowledge network."
    ),
  component: TermsPage,
});

const SECTIONS = [
  { id: "acceptance", title: "1. Acceptance of Terms" },
  { id: "eligibility", title: "2. Eligibility & Practitioner Qualifications" },
  { id: "platform-scope", title: "3. Scope of Services & Clinical Discretion" },
  { id: "account-security", title: "4. Account Verification & Credential Security" },
  { id: "patient-privacy", title: "5. Patient Anonymity & Data Ethics" },
  { id: "compendia-quality", title: "6. Classical Compendia & Formulary Evidence" },
  { id: "peer-network", title: "7. Community Contributions & Professional Decorum" },
  { id: "intellectual-property", title: "8. Intellectual Property & License" },
  { id: "liability-disclaimer", title: "9. Medical Disclaimers & Limitation of Liability" },
  { id: "termination", title: "10. Account Suspension & Termination" },
  { id: "governing-law", title: "11. Governing Law & Dispute Resolution" },
  { id: "contact-grievance", title: "12. Grievance Officer & Contact Information" },
];

export function TermsPage() {
  const [activeSection, setActiveSection] = useState("acceptance");

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
              Legal Documentation
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/privacy"
              className="text-xs sm:text-sm font-semibold text-[#555555] hover:text-[#E67230] px-3 py-1.5 transition-colors"
            >
              Privacy Policy
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
            <Link to="/" className="hover:text-[#E67230] transition-colors flex items-center gap-1">
              <ArrowLeft className="size-3" /> Home
            </Link>
            <span>/</span>
            <span className="text-[#E67230] font-bold">Terms &amp; Conditions</span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E67230]/10 text-xs font-bold text-[#E67230] mb-3">
            <Scale className="size-3.5" />
            <span>PRACTITIONER TERMS OF SERVICE</span>
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#111111]">
            Terms &amp; Conditions
          </h1>

          <p className="mt-3 text-sm sm:text-base text-[#555555] max-w-2xl leading-relaxed">
            Please read these terms carefully before accessing or using the Meyveda clinical intelligence platform, practitioner portal, and associated AYUSH medical services.
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
              <strong>Applicable Cohort:</strong> AYUSH Physicians, Clinics &amp; Partners
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
                <FileText className="size-4 text-[#E67230]" />
                Contents Table
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
                  <p className="text-xs font-bold text-[#111111]">Looking for Privacy?</p>
                  <p className="text-[11px] text-[#666666] mt-0.5">
                    Read how we protect practitioner identity and clinical records.
                  </p>
                  <Link
                    to="/privacy"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#E67230] hover:underline mt-2"
                  >
                    View Privacy Policy <ChevronRight className="size-3" />
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Column: Detailed Legal Terms */}
          <main className="lg:col-span-8 space-y-10 text-sm sm:text-[15px] leading-relaxed text-[#444444]">
            {/* Acceptance */}
            <section id="acceptance" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <Shield className="size-4" /> Section 1
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                1. Acceptance of Terms
              </h2>
              <p>
                These Terms and Conditions (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;Practitioner&quot;, &quot;User&quot;, &quot;You&quot;) and Meyveda Health Technologies Private Limited (&quot;Meyveda&quot;, &quot;Company&quot;, &quot;We&quot;, &quot;Us&quot;, &quot;Our&quot;) governing access to and use of the Meyveda platform, web applications, APIs, research repositories, and clinical portals.
              </p>
              <p>
                By registering an account, submitting medical credentials, checking an acceptance box, or accessing any part of the platform, you acknowledge that you have read, understood, and agreed to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must discontinue use immediately.
              </p>
            </section>

            {/* Eligibility */}
            <section id="eligibility" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <Stethoscope className="size-4" /> Section 2
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                2. Eligibility &amp; Practitioner Qualifications
              </h2>
              <p>
                The Meyveda doctor workspace and clinical features are exclusively restricted to qualified, bona fide healthcare professionals holding statutory licenses or degrees recognized under the statutory framework of the National Commission for Indian System of Medicine (NCISM), National Commission for Homoeopathy (NCH), or relevant State AYUSH Councils in India, including:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-[#333333]">
                <li><strong>BAMS</strong> — Bachelor of Ayurvedic Medicine and Surgery</li>
                <li><strong>BSMS</strong> — Bachelor of Siddha Medicine and Surgery</li>
                <li><strong>BNYS</strong> — Bachelor of Naturopathy and Yogic Sciences</li>
                <li><strong>BHMS</strong> — Bachelor of Homoeopathic Medicine and Surgery</li>
                <li><strong>BUMS</strong> — Bachelor of Unani Medicine and Surgery</li>
                <li>Postgraduate (MD/MS) and doctoral specialists in AYUSH disciplines</li>
              </ul>
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs sm:text-sm text-amber-900 flex items-start gap-3">
                <AlertCircle className="size-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong>Mandatory Council Verification:</strong> All practitioner accounts are subject to administrative verification against official State and Central Medical Council registries. Providing fraudulent, revoked, or impersonated registration numbers constitutes a material breach and will result in permanent termination and notification to appropriate regulatory bodies.
                </div>
              </div>
            </section>

            {/* Scope of Services */}
            <section id="platform-scope" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <Building className="size-4" /> Section 3
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                3. Scope of Services &amp; Clinical Discretion
              </h2>
              <p>
                Meyveda provides a unified technological and evidentiary infrastructure designed to support AYUSH practitioners. The platform includes canonical Samhita literature (Brihat Trayi, Laghu Trayi), statutory pharmacopoeia compendia (API, AFI), commercial formulation directories, batch laboratory testing evidence, and practice support tools.
              </p>
              <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4.5 space-y-2">
                <h3 className="font-bold text-[#111111] text-sm sm:text-base">
                  Non-Replacement of Independent Clinical Judgement
                </h3>
                <p className="text-xs sm:text-sm text-[#555555]">
                  All monographs, therapeutic indications, dosage guidelines, classical citations, and AI-assisted search outputs are provided strictly as reference material and decision support tools. Meyveda does not practice medicine, prescribe pharmaceuticals, or establish a doctor-patient relationship. The treating practitioner retains complete, exclusive, and undelegated responsibility for diagnosing patients, prescribing formulations, evaluating contraindications, and directing therapeutic courses.
                </p>
              </div>
            </section>

            {/* Account Verification & Security */}
            <section id="account-security" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <Lock className="size-4" /> Section 4
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                4. Account Verification &amp; Credential Security
              </h2>
              <p>
                During registration, you must provide accurate, complete, and verifiable information including your statutory council registration number, professional qualification, official email, and mobile phone number for multi-factor authentication (SMS/Email OTP).
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Confidentiality:</strong> You are responsible for safeguarding your login credentials. You must not disclose your password, OTPs, or share session tokens with third parties.
                </li>
                <li>
                  <strong>Unauthorized Access:</strong> You agree to notify Meyveda immediately at <a href="mailto:security@meyveda.com" className="text-[#E67230] font-bold hover:underline">security@meyveda.com</a> upon becoming aware of any breach of security, unauthorized access, or credential compromise.
                </li>
                <li>
                  <strong>Session Integrity:</strong> Meyveda utilizes 256-bit SSL encrypted transports and time-bound bearer tokens. Any attempt to bypass access controls, spoof identities, or scrape internal APIs will result in immediate session revocation.
                </li>
              </ul>
            </section>

            {/* Patient Privacy & Data Ethics */}
            <section id="patient-privacy" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <Shield className="size-4" /> Section 5
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                5. Patient Anonymity &amp; Clinical Data Ethics
              </h2>
              <p>
                Meyveda upholds strict clinical privacy standards in accordance with the Digital Personal Data Protection Act (DPDPA), Information Technology Act 2000, and statutory NCISM medical ethics guidelines.
              </p>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs sm:text-sm text-emerald-950 flex items-start gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <strong>Mandatory De-identification Rule:</strong> Practitioners contributing clinical case reports, adverse drug reaction (ADR) notices, or observational insights to the shared clinical repository must strictly de-identify all patient information. You must never upload direct identifiers including patient names, Aadhaar numbers, residential addresses, phone numbers, or unredacted diagnostic photographs.
                </div>
              </div>
              <p>
                Practitioners warrant that all necessary consent has been acquired from patients in accordance with applicable healthcare norms prior to publishing anonymized observational clinical records.
              </p>
            </section>

            {/* Compendia & Quality Evidence */}
            <section id="compendia-quality" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <FileText className="size-4" /> Section 6
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                6. Classical Compendia &amp; Formulary Evidence
              </h2>
              <p>
                Formulations catalogued on Meyveda are indexed from canonical treatises (such as Charaka Samhita, Sushruta Samhita, Ashtanga Hridaya, Sharangadhara Samhita, and Bhaishajya Ratnavali) and verified against Form 25D manufacturing licenses and Certificates of Analysis (CoA) submitted by licensed manufacturers.
              </p>
              <p>
                While Meyveda employs multi-tier verification protocols for laboratory assays (heavy metals, microbial limits, aflatoxins, and pesticide residues), practitioners must independently verify product batch numbers, manufacturing validity, and clinical suitability prior to dispensing or administering any commercial formulation.
              </p>
            </section>

            {/* Peer Network */}
            <section id="peer-network" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <Building className="size-4" /> Section 7
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                7. Community Contributions &amp; Professional Decorum
              </h2>
              <p>
                The Meyveda peer practitioner forum and referral networks are dedicated to professional collaboration, scholarly discourse, and clinical knowledge advancement.
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>You agree not to post defamatory, offensive, fraudulent, or commercially misleading communications.</li>
                <li>You must not post unverified curative claims or solicit patients directly through peer academic channels.</li>
                <li>Referral invite codes (e.g., unique 3-letter + 2-digit format) are strictly non-transferable and intended solely for nominating qualified AYUSH colleagues.</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section id="intellectual-property" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <Scale className="size-4" /> Section 8
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                8. Intellectual Property &amp; License
              </h2>
              <p>
                All proprietary software, algorithms, user interfaces, branding, visual designs, and organized taxonomies within the platform belong exclusively to Meyveda.
              </p>
              <p>
                Classical Sanskrit verses and statutory public compendia remain in the public domain. Meyveda grants you a limited, non-exclusive, non-transferable, and revocable license to access the platform solely for internal clinical and professional research purposes.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section id="liability-disclaimer" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <AlertCircle className="size-4" /> Section 9
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                9. Medical Disclaimers &amp; Limitation of Liability
              </h2>
              <p>
                THE MEYVEDA PLATFORM IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMISSIBLE UNDER APPLICABLE LAW, MEYVEDA DISCLAIMS ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR CLINICAL PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p>
                IN NO EVENT SHALL MEYVEDA, ITS DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, NOR FOR ANY LOSS OF CLINICAL PRACTICE REVENUE, DATA LOSS, OR PATIENT ADVERSE OUTCOMES RESULTING FROM INDEPENDENT PRACTITIONER PRESCRIPTION DECISIONS.
              </p>
            </section>

            {/* Termination */}
            <section id="termination" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <Scale className="size-4" /> Section 10
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                10. Account Suspension &amp; Termination
              </h2>
              <p>
                Meyveda reserves the right to suspend or permanently deactivate any practitioner account without prior notice if:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Your statutory medical council license is suspended, expired, or revoked by licensing bodies.</li>
                <li>You breach patient anonymity protocols or violate these Terms.</li>
                <li>Security anomalies, brute force attacks, or token misuse are detected on your account.</li>
              </ul>
              <p>
                You may request account closure and export of your documented clinical dossiers at any time by contacting support.
              </p>
            </section>

            {/* Governing Law */}
            <section id="governing-law" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <Building className="size-4" /> Section 11
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                11. Governing Law &amp; Dispute Resolution
              </h2>
              <p>
                These Terms shall be governed by, interpreted, and construed in accordance with the laws of India, without reference to conflict of laws principles.
              </p>
              <p>
                Any dispute, claim, or controversy arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in Chennai, Tamil Nadu, India.
              </p>
            </section>

            {/* Contact & Grievance */}
            <section id="contact-grievance" className="scroll-mt-24 rounded-2xl border border-[#EBE7DF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#E67230] font-bold text-xs uppercase tracking-wider">
                <Mail className="size-4" /> Section 12
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                12. Grievance Officer &amp; Contact Information
              </h2>
              <p>
                In compliance with the Information Technology Act 2000 and rules made thereunder, questions, legal notices, or grievances concerning these Terms may be directed to our designated Grievance Officer:
              </p>
              <div className="rounded-xl border border-[#EBE7DF] bg-[#FAF9F6] p-4.5 space-y-1 text-xs sm:text-sm">
                <p><strong>Grievance &amp; Legal Officer:</strong> Meyveda Legal &amp; Compliance Cell</p>
                <p><strong>Entity:</strong> Meyveda Health Technologies Private Limited</p>
                <p><strong>Email:</strong> <a href="mailto:legal@meyveda.com" className="text-[#E67230] font-bold hover:underline">legal@meyveda.com</a></p>
                <p><strong>Support Desk:</strong> <a href="mailto:support@meyveda.com" className="text-[#E67230] font-bold hover:underline">support@meyveda.com</a></p>
                <p><strong>Response Turnaround:</strong> Within 36 business hours of receipt</p>
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
            <Link to="/terms" className="text-[#E67230] hover:underline">
              Terms &amp; Conditions
            </Link>
            <Link to="/privacy" className="hover:text-[#E67230] hover:underline transition-colors">
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
