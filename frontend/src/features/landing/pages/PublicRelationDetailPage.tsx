import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Share2,
  Home,
  ArrowRight,
} from "lucide-react";
import meyvedaLogo from "@/assets/meyvedalogo.png";
import { apiClient } from "@/services/apiClient";
import { toast } from "sonner";

interface PRItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  media_source: string;
  media_source_url?: string | null;
  category?: string;
  published_date: string;
  status: string;
}

const FALLBACK_PRS: Record<string, PRItem> = {
  "meyveda-unveils-sovereign-ayush-clinical-desk": {
    id: "pr-1",
    title: "Meyveda Unveils Sovereign AYUSH Clinical Desk & Protocol Platform for Registered Vaidyas",
    slug: "meyveda-unveils-sovereign-ayush-clinical-desk",
    media_source: "Meyveda Media Desk",
    media_source_url: "https://meyveda.com",
    summary: "Meyveda announces the national rollout of its ABDM-ready clinical desk, eliminating practitioner administrative burdens while ensuring zero commercial commissions.",
    content: "Meyveda Ayush Pvt Ltd has officially launched its digital clinician operating system, designed specifically for registered BAMS, BUMS, BHMS, and BSMS practitioners across India.\n\nWith full ABDM-HPR compliance, e-prescriptions, and zero-inventory pharmacy fulfillment, Meyveda establishes a clear division of operational responsibility: non-clinical workflows are fully handled by the platform, leaving diagnosis, treatment selection, and patient care entirely in the hands of the doctor.\n\nThe initiative addresses long-standing challenges faced by independent traditional medicine clinics, including fragmented patient records, pharmaceutical stockouts, and commercial middleman markups.",
    published_date: new Date().toISOString().split("T")[0],
    status: "published",
  },
  "ayush-clinical-research-initiative-real-world-evidence": {
    id: "pr-2",
    title: "AYUSH Clinical Research Initiative: Aggregating Real-World Evidence (RWE) Across Southern Districts",
    slug: "ayush-clinical-research-initiative-real-world-evidence",
    media_source: "Business Standard",
    media_source_url: "https://business-standard.com",
    summary: "A collaborative framework linking state council-registered practitioners with authenticated classical pharmacology monographs and longitudinal outcomes.",
    content: "In partnership with leading academic clinicians and accredited laboratories, Meyveda is pioneering the systematic documentation of constitutional (Prakriti) assessments and patient recovery trajectories.\n\nThis real-world evidence framework bridges classical Ayurvedic principles with contemporary peer-reviewed scientific validation.\n\nParticipating doctors contribute anonymized clinical observational data to build substantiated treatment cohorts across chronic joint, metabolic, and autoimmune conditions.",
    published_date: new Date().toISOString().split("T")[0],
    status: "published",
  },
  "meyveda-cluster-franchise-model-expands-supply-infrastructure": {
    id: "pr-3",
    title: "Meyveda Cluster Franchise Model Expands District-Level AYUSH Supply Infrastructure",
    slug: "meyveda-cluster-franchise-model-expands-supply-infrastructure",
    media_source: "Express Healthcare",
    media_source_url: "https://expresshealthcare.in",
    summary: "New exclusive district hub network ensures doctor-guided, authenticated herbal deliveries within 24 to 48 hours directly to patients.",
    content: "Meyveda's Cluster Franchise program empowers local healthcare entrepreneurs to operate exclusive district fulfillment hubs.\n\nBy replacing unverified direct-to-consumer commerce with doctor-guided, batch-tested herbal deliveries, Meyveda ensures medicine authenticity and timely patient support.\n\nEach hub operates under strict pharmaceutical depot standards, providing cold-chain integrity and Certificate of Analysis (CoA) transparency.",
    published_date: new Date().toISOString().split("T")[0],
    status: "published",
  },
};

export function PublicRelationDetailPage() {
  const params = useParams({ strict: false }) as { slug?: string };
  const navigate = useNavigate();
  const slug = params?.slug || "";

  const [item, setItem] = useState<PRItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadItem() {
      if (!slug) return;
      try {
        setLoading(true);
        const data = await apiClient.get<PRItem>(`/content/pr/${slug}`);
        if (data && data.title) {
          setItem(data);
          return;
        }
      } catch (err) {
        // Fallback to local data
      }

      if (FALLBACK_PRS[slug]) {
        setItem(FALLBACK_PRS[slug]);
      } else {
        // Find by partial slug or id
        const found = Object.values(FALLBACK_PRS).find(
          (p) => p.slug === slug || p.id === slug
        );
        setItem(found || null);
      }
      setLoading(false);
    }
    loadItem();
  }, [slug]);

  const handleShare = () => {
    if (!item) return;
    if (navigator.share) {
      navigator
        .share({
          title: item.title,
          text: item.summary,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F6] text-[#111111] antialiased selection:bg-[#E67230]/20 selection:text-[#E67230]">
      {/* -------------------------------------------------------------------- */}
      {/* 1. HEADER                                                            */}
      {/* -------------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-[#EBE7DF] bg-[#FAF9F6]/95 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-20 max-w-[1216px] items-center justify-between px-5 sm:px-8 lg:px-12">
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
              to="/public-relations"
              className="whitespace-nowrap py-2 text-[15px] font-bold text-[#E67230] border-b-2 border-[#E67230]"
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
      {/* 2. MAIN DETAIL CONTENT                                               */}
      {/* -------------------------------------------------------------------- */}
      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          {/* Back button */}
          <Link
            to="/public-relations"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#666666] hover:text-[#E67230] transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Public Relations</span>
          </Link>

          {!item ? (
            <div className="my-16 text-center">
              <p className="text-sm font-semibold text-[#888888]">Release not found.</p>
              <Link
                to="/public-relations"
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#111111] px-4 py-2 text-xs font-bold text-white hover:bg-[#E67230]"
              >
                Return to Public Relations
              </Link>
            </div>
          ) : (
            <article className="mt-8">
              {/* Publication Date & Source */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#777777]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {new Date(item.published_date).toLocaleDateString("en-IN", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span>•</span>
                <span>Source: <strong className="text-[#333333]">{item.media_source}</strong></span>
              </div>

              {/* Title */}
              <h1
                className="mt-4 text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#111111] leading-[1.18]"
                style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
              >
                {item.title}
              </h1>

              {/* Summary box */}
              <div className="mt-6 rounded-xl border-l-4 border-[#E67230] bg-white p-5 text-sm sm:text-base leading-relaxed text-[#555555] shadow-2xs">
                {item.summary}
              </div>

              {/* Content body */}
              <div className="mt-8 space-y-5 text-base sm:text-[17px] leading-relaxed text-[#2A2A2A]">
                {item.content.split("\n\n").map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#EBE7DF] pt-6">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#EBE7DF] bg-white px-4 py-2 text-xs font-bold text-[#555555] hover:bg-[#FAF9F6] hover:text-[#111111] shadow-2xs"
                >
                  <Share2 className="size-3.5" />
                  <span>Share</span>
                </button>

                {item.media_source_url && (
                  <a
                    href={item.media_source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E67230] hover:underline"
                  >
                    <span>View Press Link</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            </article>
          )}
        </div>
      </main>

      {/* -------------------------------------------------------------------- */}
      {/* 3. FOOTER                                                            */}
      {/* -------------------------------------------------------------------- */}
      <footer className="border-t border-[#EBE7DF] bg-white py-10 text-[#111111]">
        <div className="mx-auto max-w-[1216px] px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#777777]">
            <div className="flex items-center gap-3">
              <img src={meyvedaLogo} alt="Meyveda Logo" className="h-7 w-auto object-contain" />
              <span>© {new Date().getFullYear()} Meyveda Ayush Pvt Ltd.</span>
            </div>
            <div className="flex gap-6">
              <Link to="/about" className="hover:text-[#E67230]">About Us</Link>
              <Link to="/public-relations" className="hover:text-[#E67230]">Public relation</Link>
              <Link to="/blogs" className="hover:text-[#E67230]">Blogs</Link>
              <Link to="/contact" className="hover:text-[#E67230]">Contact Us</Link>
              <Link to="/privacy" className="hover:text-[#E67230]">Privacy</Link>
              <Link to="/terms" className="hover:text-[#E67230]">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

