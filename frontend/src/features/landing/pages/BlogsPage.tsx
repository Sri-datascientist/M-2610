import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Home,
  Clock,
  BookOpen,
} from "lucide-react";
import meyvedaLogo from "@/assets/meyvedalogo.png";
import { apiClient } from "@/services/apiClient";

interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  author_name: string;
  author_role: string;
  reading_time: string;
  status: string;
  created_at?: string;
}

export function BlogsPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        setLoading(true);
        const data = await apiClient.get<BlogPostItem[]>("/content/blogs");
        if (Array.isArray(data) && data.length > 0) {
          setPosts(data);
        } else {
          setPosts([
            {
              id: "blog-1",
              title: "Modernizing Clinical Nadi Pariksha: Integrating Classical Pulse Diagnostics with Longitudinal Vitals",
              slug: "modernizing-clinical-nadi-pariksha-classical-pulse",
              author_name: "Dr. Ramesh Vaidya, BAMS",
              author_role: "Chief Ayurvedic Consultant",
              reading_time: "5 min read",
              summary: "How systematic recording of Tridosha imbalances and Rogi-Roga Pariksha transforms subjective pulse analysis into verifiable clinical evidence.",
              content: "Classical Ayurveda places Nadi Pariksha (pulse examination) at the pinnacle of the Ashtavidha Pariksha. However, in contemporary practice, transmitting and tracking these diagnostic insights across multi-session treatments requires structured documentation.\n\nIn this clinical guide, we explore how standardized Prakriti-Vikriti digital indexing preserves the tactile nuance of pulse dynamics while creating verifiable longitudinal health records for integrative follow-ups.",
              status: "published",
              created_at: new Date().toISOString(),
            },
            {
              id: "blog-2",
              title: "Classical Pharmacology & Heavy Metal Safety: Vetting Rasa Shastra Formulations Under GMP Standards",
              slug: "classical-pharmacology-heavy-metal-safety-rasa-shastra",
              author_name: "Meyveda Editorial & Quality Board",
              author_role: "Department of Pharmaceutical Quality",
              reading_time: "6 min read",
              summary: "An analysis of Shodhana and Marana purification cycles, AAS testing protocols, and ensuring patient trust in classical herbo-mineral preparations.",
              content: "Herbo-mineral formulations in Ayurveda, developed through centuries of Rasa Shastra expertise, require exacting purification (Shodhana) and calcination (Marana) processes.\n\nWhen produced under strict Good Manufacturing Practices (GMP) and verified through Atomic Absorption Spectroscopy (AAS), Bhasmas demonstrate optimal bioavailability and strict adherence to statutory safety limits.",
              status: "published",
              created_at: new Date().toISOString(),
            },
            {
              id: "blog-3",
              title: "The Digital Vaidya: Navigating ABDM-HPR Compliance & Sovereign Practice Ownership",
              slug: "the-digital-vaidya-navigating-abdm-hpr-compliance",
              author_name: "Dr. Akshara V., BAMS, MD (Ayu)",
              author_role: "Health Informatics Specialist",
              reading_time: "4 min read",
              summary: "Demystifying Healthcare Professional Registry (HPR) enrollment, statutory compliance, and digital prescription validity under National Health Authority standards.",
              content: "The Ayushman Bharat Digital Mission (ABDM) has introduced a transformative leap for AYUSH practitioners. By linking state medical council credentials to a verified Healthcare Professional Registry (HPR) ID, doctors gain sovereign ownership of their digital identity.\n\nThis guide walks through the key statutory advantages, from digital signature compliance to direct integration with national health claim gateways.",
              status: "published",
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.warn("Could not load remote blogs, using fallback data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogs();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F6] text-[#111111] antialiased selection:bg-[#E67230]/20 selection:text-[#E67230]">
      {/* -------------------------------------------------------------------- */}
      {/* 1. HEADER & BRAND NAVIGATION BAR                                     */}
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
      {/* 2. COMPACT TITLE & CLEAN BLOG BOXES                                  */}
      {/* -------------------------------------------------------------------- */}
      <main className="flex-1 py-10 sm:py-12">
        <div className="mx-auto max-w-[1216px] px-5 sm:px-8 lg:px-12">
          {/* Direct, clean title */}
          <div className="flex items-center justify-between border-b border-[#EBE7DF] pb-5">
            <h1
              className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]"
              style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
            >
              Blogs
            </h1>
            <span className="text-xs sm:text-sm font-medium text-[#777777]">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </span>
          </div>

          {/* Grid of Clean Blog Boxes (Clicking redirects to dedicated page) */}
          {posts.length === 0 ? (
            <div className="my-12 rounded-xl border border-dashed border-[#DCD6CA] bg-white p-12 text-center">
              <BookOpen className="mx-auto size-10 text-[#AAAAAA]" />
              <h3 className="mt-3 text-base font-bold text-[#111111]">No blogs found</h3>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() =>
                    navigate({
                      to: "/blogs/$slug",
                      params: { slug: post.slug },
                    })
                  }
                  className="group flex flex-col justify-between rounded-xl border border-[#EBE7DF] bg-white p-6 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-[#E67230]/40 hover:shadow-md cursor-pointer"
                >
                  <div>
                    {/* Clean Reading Time Only (No badges, no unwanted clutter) */}
                    <div className="flex items-center justify-between text-xs text-[#888888]">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="size-3 text-[#E67230]" />
                        {post.reading_time}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="mt-3.5 text-lg sm:text-xl font-bold text-[#111111] leading-snug line-clamp-2 group-hover:text-[#E67230] transition-colors">
                      {post.title}
                    </h2>

                    {/* Summary */}
                    <p className="mt-3 text-sm leading-relaxed text-[#555555] line-clamp-3">
                      {post.summary}
                    </p>
                  </div>

                  {/* Clean Bottom Bar */}
                  <div className="mt-6 border-t border-[#F0ECE1] pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#666666]">
                        {post.author_name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#E67230] group-hover:translate-x-1 transition-transform">
                        Read Blog
                        <ArrowRight className="size-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
