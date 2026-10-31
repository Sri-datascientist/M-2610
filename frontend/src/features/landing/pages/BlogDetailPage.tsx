import { useState, useEffect } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Clock,
  Share2,
  Home,
  User,
  ArrowRight,
} from "lucide-react";
import meyvedaLogo from "@/assets/meyvedalogo.png";
import { apiClient } from "@/services/apiClient";
import { toast } from "sonner";

interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  author_name: string;
  author_role: string;
  category?: string;
  reading_time: string;
  tags?: string[] | null;
  status: string;
  created_at?: string;
}

const FALLBACK_BLOGS: Record<string, BlogPostItem> = {
  "modernizing-clinical-nadi-pariksha-classical-pulse": {
    id: "blog-1",
    title: "Modernizing Clinical Nadi Pariksha: Integrating Classical Pulse Diagnostics with Longitudinal Vitals",
    slug: "modernizing-clinical-nadi-pariksha-classical-pulse",
    author_name: "Dr. Ramesh Vaidya, BAMS",
    author_role: "Chief Ayurvedic Consultant",
    reading_time: "5 min read",
    tags: ["Kayachikitsa", "Nadi Pariksha"],
    summary: "How systematic recording of Tridosha imbalances and Rogi-Roga Pariksha transforms subjective pulse analysis into verifiable clinical evidence.",
    content: "Classical Ayurveda places Nadi Pariksha (pulse examination) at the pinnacle of the Ashtavidha Pariksha. However, in contemporary practice, transmitting and tracking these diagnostic insights across multi-session treatments requires structured documentation.\n\nIn this clinical guide, we explore how standardized Prakriti-Vikriti digital indexing preserves the tactile nuance of pulse dynamics while creating verifiable longitudinal health records for integrative follow-ups.\n\nBy systematically documenting Gati (movement), Vega (rate), and Bala (intensity) across treatment milestones, practitioners demonstrate measurable physiological change that aligns with both classical principles and modern scientific rigor.",
    status: "published",
    created_at: new Date().toISOString(),
  },
  "classical-pharmacology-heavy-metal-safety-rasa-shastra": {
    id: "blog-2",
    title: "Classical Pharmacology & Heavy Metal Safety: Vetting Rasa Shastra Formulations Under GMP Standards",
    slug: "classical-pharmacology-heavy-metal-safety-rasa-shastra",
    author_name: "Meyveda Editorial & Quality Board",
    author_role: "Department of Pharmaceutical Quality",
    reading_time: "6 min read",
    tags: ["Rasa Shastra", "GMP Compliance"],
    summary: "An analysis of Shodhana and Marana purification cycles, AAS testing protocols, and ensuring patient trust in classical herbo-mineral preparations.",
    content: "Herbo-mineral formulations in Ayurveda, developed through centuries of Rasa Shastra expertise, require exacting purification (Shodhana) and calcination (Marana) processes.\n\nWhen produced under strict Good Manufacturing Practices (GMP) and verified through Atomic Absorption Spectroscopy (AAS), Bhasmas demonstrate optimal bioavailability and strict adherence to statutory safety limits.\n\nClinicians must examine batch Certificates of Analysis (CoA) to verify that elemental mercury, lead, arsenic, and cadmium are converted into biocompatible, non-toxic micro-crystallites.",
    status: "published",
    created_at: new Date().toISOString(),
  },
  "the-digital-vaidya-navigating-abdm-hpr-compliance": {
    id: "blog-3",
    title: "The Digital Vaidya: Navigating ABDM-HPR Compliance & Sovereign Practice Ownership",
    slug: "the-digital-vaidya-navigating-abdm-hpr-compliance",
    author_name: "Dr. Akshara V., BAMS, MD (Ayu)",
    author_role: "Health Informatics Specialist",
    reading_time: "4 min read",
    tags: ["ABDM", "Telemedicine"],
    summary: "Demystifying Healthcare Professional Registry (HPR) enrollment, statutory compliance, and digital prescription validity under National Health Authority standards.",
    content: "The Ayushman Bharat Digital Mission (ABDM) has introduced a transformative leap for AYUSH practitioners. By linking state medical council credentials to a verified Healthcare Professional Registry (HPR) ID, doctors gain sovereign ownership of their digital identity.\n\nThis guide walks through the key statutory advantages, from digital signature compliance to direct integration with national health claim gateways.\n\nBy taking sovereign control of their electronic health desk, registered Vaidyas eliminate reliance on third-party commercial platforms and secure direct patient continuity.",
    status: "published",
    created_at: new Date().toISOString(),
  },
};

export function BlogDetailPage() {
  const params = useParams({ strict: false }) as { slug?: string };
  const slug = params?.slug || "";

  const [post, setPost] = useState<BlogPostItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      if (!slug) return;
      try {
        setLoading(true);
        const data = await apiClient.get<BlogPostItem>(`/content/blogs/${slug}`);
        if (data && data.title) {
          setPost(data);
          return;
        }
      } catch (err) {
        // Fallback to local data
      }

      if (FALLBACK_BLOGS[slug]) {
        setPost(FALLBACK_BLOGS[slug]);
      } else {
        const found = Object.values(FALLBACK_BLOGS).find(
          (b) => b.slug === slug || b.id === slug
        );
        setPost(found || null);
      }
      setLoading(false);
    }
    loadPost();
  }, [slug]);

  const handleShare = () => {
    if (!post) return;
    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: post.summary,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Blog link copied to clipboard!");
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
              className="whitespace-nowrap py-2 text-[15px] font-semibold text-[#555555] transition-colors hover:text-[#111111]"
            >
              Public relation
            </Link>
            <Link
              to="/blogs"
              className="whitespace-nowrap py-2 text-[15px] font-bold text-[#E67230] border-b-2 border-[#E67230]"
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
            to="/blogs"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#666666] hover:text-[#E67230] transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Blogs</span>
          </Link>

          {!post ? (
            <div className="my-16 text-center">
              <p className="text-sm font-semibold text-[#888888]">Blog not found.</p>
              <Link
                to="/blogs"
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#111111] px-4 py-2 text-xs font-bold text-white hover:bg-[#E67230]"
              >
                Return to Blogs
              </Link>
            </div>
          ) : (
            <article className="mt-8">
              {/* Reading time */}
              <div className="flex items-center gap-2 text-xs text-[#777777]">
                <Clock className="size-3.5 text-[#E67230]" />
                <span>{post.reading_time}</span>
              </div>

              {/* Title */}
              <h1
                className="mt-3 text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#111111] leading-[1.18]"
                style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
              >
                {post.title}
              </h1>

              {/* Author attribution */}
              <div className="mt-6 flex items-center gap-3.5 border-y border-[#EBE7DF] py-4 text-xs sm:text-sm">
                <div className="flex size-10 items-center justify-center rounded-full bg-[#E67230]/10 text-[#E67230]">
                  <User className="size-5" />
                </div>
                <div>
                  <p className="font-bold text-[#111111]">{post.author_name}</p>
                  <p className="text-xs text-[#777777]">{post.author_role}</p>
                </div>
              </div>

              {/* Summary box */}
              <div className="mt-6 rounded-xl border-l-4 border-[#E67230] bg-white p-5 text-sm sm:text-base leading-relaxed text-[#555555] shadow-2xs">
                {post.summary}
              </div>

              {/* Content body */}
              <div className="mt-8 space-y-5 text-base sm:text-[17px] leading-relaxed text-[#2A2A2A]">
                {post.content.split("\n\n").map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-[#EBE7DF] pt-5">
                  <span className="text-xs font-semibold text-[#888888]">Tags:</span>
                  {post.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded-md bg-[#FAF9F6] border border-[#EBE7DF] px-2.5 py-1 text-xs font-medium text-[#555555]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Bottom Actions */}
              <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#EBE7DF] pt-6">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#EBE7DF] bg-white px-4 py-2 text-xs font-bold text-[#555555] hover:bg-[#FAF9F6] hover:text-[#111111] shadow-2xs"
                >
                  <Share2 className="size-3.5" />
                  <span>Share Blog</span>
                </button>

                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#E67230] px-4 py-2 text-xs font-bold text-white hover:bg-[#D15F1F] shadow-sm"
                >
                  <span>Register as Doctor</span>
                  <ArrowRight className="size-3.5" />
                </Link>
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
              <Link to="/blogs" className="text-[#E67230] font-semibold">Blogs</Link>
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

