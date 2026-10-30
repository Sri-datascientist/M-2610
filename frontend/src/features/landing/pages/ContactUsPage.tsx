import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import meyvedaLogo from "@/assets/meyvedalogo.png";
import { apiClient } from "@/services/apiClient";
import { copyToClipboard } from "@/lib/clipboard";
import { MEYVEDA_CONTACT } from "@/lib/contact-info";

const CATEGORIES = [
  "General Inquiry",
  "Doctor & Clinical Support",
  "Cluster Franchise Partner",
  "Pharma & Product Listing",
  "Technical & Account Help",
] as const;

type CategoryType = (typeof CATEGORIES)[number];

const FAQ_ITEMS = [
  {
    q: "How soon will I receive a response?",
    a: "Our support desk in Chennai reviews inquiries Monday through Saturday, 9:00 AM to 6:00 PM IST. You will receive an official response within 24 business hours.",
  },
  {
    q: "Can I contact you directly on WhatsApp?",
    a: "Yes! You can reach our team directly at +91 99863 98332 or click the 'Open in WhatsApp' button to start an instant conversation with our team.",
  },
  {
    q: "Where is Meyveda headquartered?",
    a: "Meyveda Health Technologies is operating out of Chennai, Tamil Nadu, India, coordinating classical practitioner networks and pharmacy fulfillment across the country.",
  },
  {
    q: "Is my contact information kept confidential?",
    a: "Absolutely. We maintain strict data security practices. Your contact details and message contents are never shared with or sold to third-party marketing companies.",
  },
];

export function ContactUsPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<CategoryType>("General Inquiry");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    referenceCode: string;
    submittedAt: string;
    fullName: string;
    email: string;
    category: string;
  } | null>(null);

  const [copiedRef, setCopiedRef] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const handleCopyRef = async (code: string) => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedRef(true);
      toast.success("Reference code copied to clipboard!");
      setTimeout(() => setCopiedRef(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg("Please provide your full name.");
      toast.error("Please enter a valid full name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg("Please provide a valid email address.");
      toast.error("Invalid email address.");
      return;
    }

    const phoneDigits = cleanPhone.replace(/[^0-9]/g, "");
    if (phoneDigits.length < 10) {
      setErrorMsg("Please provide a valid 10-digit phone or mobile number.");
      toast.error("Invalid phone number.");
      return;
    }

    if (!cleanSubject || cleanSubject.length < 3) {
      setErrorMsg("Please provide a subject for your inquiry.");
      toast.error("Subject is required.");
      return;
    }

    if (!cleanMessage || cleanMessage.length < 10) {
      setErrorMsg("Please provide a detailed message (at least 10 characters).");
      toast.error("Message is too short.");
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.post<{
        ok: boolean;
        id: string;
        reference_code: string;
        message: string;
        submitted_at: string;
      }>("/contact", {
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        category: category,
        subject: cleanSubject,
        message: cleanMessage,
      });

      setSubmittedData({
        referenceCode: res.reference_code || `MV-CT-${res.id.slice(0, 8).toUpperCase()}`,
        submittedAt: res.submitted_at || new Date().toISOString(),
        fullName: cleanName,
        email: cleanEmail,
        category: category,
      });

      toast.success("Your message has been received! We will be in touch shortly.");
    } catch (err: any) {
      console.error("Contact submission error:", err);
      const detail =
        err?.data?.detail || err?.message || "Failed to submit inquiry. Please try again or email us directly.";
      setErrorMsg(typeof detail === "string" ? detail : "Submission failed. Please check your information.");
      toast.error("Submission failed. Please review the form.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmittedData(null);
    setFullName("");
    setEmail("");
    setPhone("");
    setCategory("General Inquiry");
    setSubject("");
    setMessage("");
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] antialiased selection:bg-[#E67230] selection:text-white flex flex-col justify-between">
      {/* 1. BRAND HEADER */}
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
              className="whitespace-nowrap py-2 text-[15px] font-semibold text-[#555555] transition-colors hover:text-[#111111]"
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
              className="whitespace-nowrap py-2 text-[15px] font-bold text-[#E67230] border-b-2 border-[#E67230]"
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

      {/* 2. MAIN COHESIVE SPLIT SECTION */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20">
          {/* Subtle ambient lighting */}
          <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply bg-[radial-gradient(ellipse_60%_50%_at_30%_20%,rgba(230,114,48,0.1)_0%,rgba(250,249,246,0)_70%)]" />

          <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-start">
              {/* LEFT COLUMN: Editorial Header & Sleek Contact Channels (5 Cols) */}
              <div className="lg:col-span-5 space-y-8">
                <div>
                  <h1
                    className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-[#111111] leading-[1.12]"
                    style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
                  >
                    Contact Meyveda
                  </h1>
                  <p className="mt-4 text-base sm:text-lg text-[#555555] leading-relaxed">
                    Have questions, need support, or looking to partner with us? Reach out directly or
                    submit your inquiry through the form.
                  </p>
                </div>

                {/* 3 Sleek Official Contact Cards */}
                <div className="space-y-4 pt-2">
                  {/* Card 1: Email */}
                  <div className="group rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs transition-all duration-200 hover:border-[#E67230]/40 hover:shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF3EB] text-[#E67230] transition-transform group-hover:scale-105">
                        <Mail className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#777777]">
                          Official Email
                        </p>
                        <a
                          href={`mailto:${MEYVEDA_CONTACT.email}`}
                          className="mt-0.5 block text-base font-bold text-[#E67230] hover:underline truncate"
                        >
                          {MEYVEDA_CONTACT.email}
                        </a>
                        <p className="mt-1 text-xs text-[#777777]">
                          Fast response within 24 business hours.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Phone & WhatsApp */}
                  <div className="group rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs transition-all duration-200 hover:border-[#E67230]/40 hover:shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF3EB] text-[#E67230] transition-transform group-hover:scale-105">
                        <Phone className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#777777]">
                          Helpline &amp; WhatsApp
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <a
                            href={`tel:${MEYVEDA_CONTACT.phone}`}
                            className="text-base font-bold text-[#111111] hover:text-[#E67230] transition-colors"
                          >
                            {MEYVEDA_CONTACT.phoneFormatted}
                          </a>
                          <a
                            href={MEYVEDA_CONTACT.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-[#25D366]/10 px-2.5 py-0.5 text-xs font-bold text-[#1da851] hover:bg-[#25D366]/20 transition-colors"
                          >
                            <MessageCircle className="size-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                        <p className="mt-1 text-xs text-[#777777]">{MEYVEDA_CONTACT.hours}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Operating Headquarters */}
                  <div className="group rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs transition-all duration-200 hover:border-[#E67230]/40 hover:shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF3EB] text-[#E67230] transition-transform group-hover:scale-105">
                        <MapPin className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#777777]">
                          Operating Office
                        </p>
                        <p className="mt-0.5 text-base font-bold text-[#111111]">
                          {MEYVEDA_CONTACT.address}
                        </p>
                        <p className="mt-1 text-xs text-[#777777]">
                          Operational headquarters &amp; practitioner network coordination.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct Commitment Box */}
                <div className="rounded-2xl border border-[#EBE7DF] bg-white/70 p-4.5 text-xs text-[#666666] flex items-start gap-3 shadow-2xs">
                  <ShieldCheck className="size-4 shrink-0 text-[#E67230] mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Logged &amp; Tracked:</strong> Every inquiry submitted here receives an
                    official reference ID and is reviewed directly by our administration desk.
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN: The Interactive Form Card (7 Cols) */}
              <div className="lg:col-span-7">
                <div className="rounded-3xl border border-[#EBE7DF] bg-white p-6 sm:p-9 lg:p-11 shadow-sm">
                  {submittedData ? (
                    /* SUCCESS CONFIRMATION */
                    <div className="py-6 text-center space-y-6">
                      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#FFF3EB] text-[#E67230] ring-8 ring-[#FFF3EB]/60">
                        <CheckCircle2 className="size-9" />
                      </div>

                      <div>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
                          Message Received!
                        </h3>
                        <p className="mt-2 text-sm sm:text-base text-[#555555] max-w-md mx-auto leading-relaxed">
                          Thank you, <strong>{submittedData.fullName}</strong>. Your message has been
                          logged and our team will get in touch with you shortly.
                        </p>
                      </div>

                      {/* Reference ID Pill */}
                      <div className="mx-auto max-w-sm rounded-2xl border border-[#EBE7DF] bg-[#FAF9F6] p-4 text-left space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#777777]">
                            Inquiry Reference ID
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyRef(submittedData.referenceCode)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E67230] hover:underline cursor-pointer"
                          >
                            {copiedRef ? (
                              <>
                                <Check className="size-3.5 text-[#2E7D32]" />
                                <span className="text-[#2E7D32]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="size-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="font-mono text-lg font-bold text-[#111111]">
                          {submittedData.referenceCode}
                        </p>

                        <div className="border-t border-[#EBE7DF] pt-2 text-xs text-[#666666]">
                          <p>
                            <strong>Contact Email:</strong> {submittedData.email}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleReset}
                          className="inline-flex h-11 items-center justify-center rounded-xl border border-[#EBE7DF] bg-white px-6 text-sm font-bold text-[#111111] hover:border-[#E67230] hover:text-[#E67230] transition-colors cursor-pointer"
                        >
                          Submit Another Inquiry
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* INQUIRY FORM */
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
                          Send Us a Message
                        </h2>
                        <p className="text-xs sm:text-sm text-[#666666] mt-1.5 leading-relaxed">
                          Fill out the form below and we will get back to you as soon as possible.
                        </p>
                      </div>

                      {errorMsg && (
                        <div className="rounded-xl border border-[#F5C2B3] bg-[#FFF2ED] p-3.5 text-xs sm:text-sm font-semibold text-[#B93815] flex items-center gap-2.5">
                          <AlertCircle className="size-4 shrink-0" />
                          <span>{errorMsg}</span>
                        </div>
                      )}

                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                          Full Name <span className="text-[#E67230]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full rounded-xl border border-[#D5D0C6] bg-white px-4 py-2.5 text-sm text-[#111111] placeholder:text-[#999999] focus:border-[#E67230] focus:ring-2 focus:ring-[#E67230]/20 focus:outline-none transition-all"
                        />
                      </div>

                      {/* Email & Phone in 2-Col Grid */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                            Email Address <span className="text-[#E67230]">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. ramesh@example.com"
                            className="w-full rounded-xl border border-[#D5D0C6] bg-white px-4 py-2.5 text-sm text-[#111111] placeholder:text-[#999999] focus:border-[#E67230] focus:ring-2 focus:ring-[#E67230]/20 focus:outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                            Mobile / WhatsApp <span className="text-[#E67230]">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. +91 98765 43210"
                            className="w-full rounded-xl border border-[#D5D0C6] bg-white px-4 py-2.5 text-sm text-[#111111] placeholder:text-[#999999] focus:border-[#E67230] focus:ring-2 focus:ring-[#E67230]/20 focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Inquiry Category */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                          Category <span className="text-[#E67230]">*</span>
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as CategoryType)}
                          className="w-full rounded-xl border border-[#D5D0C6] bg-white px-4 py-2.5 text-sm text-[#111111] focus:border-[#E67230] focus:ring-2 focus:ring-[#E67230]/20 focus:outline-none transition-all"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                          Subject <span className="text-[#E67230]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Brief summary of your inquiry"
                          className="w-full rounded-xl border border-[#D5D0C6] bg-white px-4 py-2.5 text-sm text-[#111111] placeholder:text-[#999999] focus:border-[#E67230] focus:ring-2 focus:ring-[#E67230]/20 focus:outline-none transition-all"
                        />
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                          Detailed Message <span className="text-[#E67230]">*</span>
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Please provide specifics regarding your question, proposal, or feedback..."
                          className="w-full rounded-xl border border-[#D5D0C6] bg-white px-4 py-2.5 text-sm text-[#111111] placeholder:text-[#999999] focus:border-[#E67230] focus:ring-2 focus:ring-[#E67230]/20 focus:outline-none transition-all"
                        />
                      </div>

                      {/* Submit CTA */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#E67230] px-6 text-base font-bold text-white shadow-[0_4px_16px_-4px_rgba(230,114,48,0.4)] transition-all hover:bg-[#D15F1F] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            <span>Dispatching Message...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Message</span>
                            <Send className="size-4" />
                          </>
                        )}
                      </button>

                      <p className="text-center text-[11px] text-[#777777]">
                        By sending this message, you agree to our{" "}
                        <Link to="/terms" className="text-[#E67230] underline">
                          Terms
                        </Link>{" "}
                        and{" "}
                        <Link to="/privacy" className="text-[#E67230] underline">
                          Privacy Policy
                        </Link>
                        . Your contact information is never shared or sold.
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. CLEAN FREQUENTLY ASKED QUESTIONS */}
        <section className="border-t border-[#EBE7DF] bg-[#FAF9F6] py-14 sm:py-20">
          <div className="mx-auto max-w-[840px] px-5 sm:px-8">
            <div className="text-center mb-10">
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight"
                style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
              >
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-[#666666] mt-2">
                Quick answers to common questions about contacting Meyveda.
              </p>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div
                    key={item.q}
                    className="rounded-2xl border border-[#EBE7DF] bg-white overflow-hidden shadow-2xs transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-5 text-left font-bold text-[#111111] hover:text-[#E67230] transition-colors cursor-pointer"
                    >
                      <span className="text-sm sm:text-base">{item.q}</span>
                      {isOpen ? (
                        <ChevronUp className="size-4 shrink-0 text-[#E67230]" />
                      ) : (
                        <ChevronDown className="size-4 shrink-0 text-[#777777]" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-[#555555] leading-relaxed border-t border-[#F0ECE1] pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* 4. MEYVEDA COMMON FOOTER */}
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
                  <Link to="/" hash="doctors" className="hover:text-[#E67230] transition-colors">
                    For Doctors
                  </Link>
                </li>
                <li>
                  <Link to="/" hash="why-meyveda" className="hover:text-[#E67230] transition-colors">
                    About us
                  </Link>
                </li>
                <li>
                  <Link to="/" hash="public-relation" className="hover:text-[#E67230] transition-colors">
                    Public relation
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-[#E67230] font-bold">
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
                    <MessageCircle className="size-3.5 text-[#25D366]" />
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
export default ContactUsPage;
