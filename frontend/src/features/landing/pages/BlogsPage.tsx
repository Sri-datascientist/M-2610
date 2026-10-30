import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Home,
  BookOpen,
  Clock,
  Share2,
  Copy,
  ChevronRight,
  User,
  ShieldCheck,
  Search,
  Tag,
  CheckCircle2,
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
  category: string;
  reading_time: string;
  tags?: string[] | null;
  status: string;
  created_at?: string;
}

const CATEGORIES = [
  "All",
  "Clinical Practice",
  "Ayurvedic Pharmacology",
  "Integrative Medicine",
  "Regulatory & ABDM",
];

export function BlogsPage() {
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchBlogs() {
      try {
        setLoading(true);
        const data = await apiClient.get<BlogPostItem[]>("/content/blogs");
        if (Array.isArray(data) && data.length > 0) {
          setPosts(data);
          setSelectedId(data[0].id);
        } else {
          const fallbackData: BlogPostItem[] = [
            {
              id: "blog-1",
              title: "Modernizing Clinical Nadi Pariksha: Integrating Classical Pulse Diagnostics with Longitudinal Vitals",
              slug: "modernizing-clinical-nadi-pariksha-classical-pulse",
              author_name: "Dr. Ramesh Vaidya, BAMS",
              author_role: "Chief Ayurvedic Consultant",
              category: "Clinical Practice",
              reading_time: "5 min read",
              tags: ["Kayachikitsa", "Nadi Pariksha", "Diagnostics"],
              summary: "How systematic recording of Tridosha imbalances and Rogi-Roga Pariksha transforms subjective pulse analysis into verifiable clinical evidence.",
              content: "Classical Ayurveda places Nadi Pariksha (pulse examination) at the pinnacle of the Ashtavidha Pariksha. However, in contemporary practice, transmitting and tracking these diagnostic insights across multi-session treatments requires structured documentation.\n\nIn this clinical guide, we explore how standardized Prakriti-Vikriti digital indexing preserves the tactile nuance of pulse dynamics while creating verifiable longitudinal health records for integrative follow-ups.\n\nBy indexing pulse tactile variables (Sarpa, Manduka, Hamsa gati) alongside patient blood pressure and metabolic markers, clinicians build transparent clinical evidence that bridges millennia of Ayurvedic wisdom with modern healthcare standards.",
              status: "published",
              created_at: new Date().toISOString(),
            },
            {
              id: "blog-2",
              title: "Classical Pharmacology & Heavy Metal Safety: Vetting Rasa Shastra Formulations Under GMP Standards",
              slug: "classical-pharmacology-heavy-metal-safety-rasa-shastra",
              author_name: "Meyveda Editorial & Quality Board",
              author_role: "Department of Pharmaceutical Quality",
              category: "Ayurvedic Pharmacology",
              reading_time: "6 min read",
              tags: ["Rasa Shastra", "GMP Compliance", "Safety Protocols"],
              summary: "An analysis of Shodhana and Marana purification cycles, AAS testing protocols, and ensuring patient trust in classical herbo-mineral preparations.",
              content: "Herbo-mineral formulations in Ayurveda, developed through centuries of Rasa Shastra expertise, require exacting purification (Shodhana) and calcination (Marana) processes.\n\nWhen produced under strict Good Manufacturing Practices (GMP) and verified through Atomic Absorption Spectroscopy (AAS), Bhasmas demonstrate optimal bioavailability and strict adherence to statutory safety limits.\n\nWe review the essential laboratory criteria every practitioner must review before prescribing, highlighting how Certificate of Analysis (CoA) transparency protects patient wellness and clinical reputation.",
              status: "published",
              created_at: new Date().toISOString(),
            },
            {
              id: "blog-3",
              title: "The Digital Vaidya: Navigating ABDM-HPR Compliance & Sovereign Practice Ownership",
              slug: "the-digital-vaidya-navigating-abdm-hpr-compliance",
              author_name: "Dr. Akshara V., BAMS, MD (Ayu)",
              author_role: "Health Informatics Specialist",
              category: "Regulatory & ABDM",
              reading_time: "4 min read",
              tags: ["ABDM", "Telemedicine", "Healthcare Registry"],
              summary: "Demystifying Healthcare Professional Registry (HPR) enrollment, statutory compliance, and digital prescription validity under National Health Authority standards.",
              content: "The Ayushman Bharat Digital Mission (ABDM) has introduced a transformative leap for AYUSH practitioners. By linking state medical council credentials to a verified Healthcare Professional Registry (HPR) ID, doctors gain sovereign ownership of their digital identity.\n\nThis guide walks through the key statutory advantages, from digital signature compliance to direct integration with national health claim gateways, ensuring AYUSH clinicians stand on equal footing with all registered medical providers.",
              status: "published",
              created_at: new Date().toISOString(),
            },
          ];
          setPosts(fallbackData);
          setSelectedId(fallbackData[0].id);
        }
      } catch (err) {
        console.warn("Could not load remote blogs, using fallback data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogs();
  }, []);

  const filteredPosts = posts.filter((post) => {
    const matchesCat =
      activeCategory === "All" ||
      post.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesQuery =
      !searchQuery.trim() ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags && post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCat && matchesQuery;
  });

  const selectedPost =
    filteredPosts.find((p) => p.id === selectedId) ||
    filteredPosts[0] ||
    posts[0];

  const handleCopyLink = (post: BlogPostItem) => {
    const url = `${window.location.origin}/blogs?id=${post.slug || post.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Blog link copied to clipboard!");
  };

  const handleShare = (post: BlogPostItem) => {
    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: post.summary,
          url: `${window.location.origin}/blogs?id=${post.slug || post.id}`,
        })
        .catch(() => {});
    } else {
      handleCopyLink(post);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F0] text-[#111111] antialiased selection:bg-[#E67230]/20 selection:text-[#E67230]">
      {/* -------------------------------------------------------------------- */}
      {/* 1. HEADER & BRAND NAVIGATION BAR                                     */}
      {/* -------------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-[#E5E0D5] bg-white/95 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-18 max-w-[1360px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link
            to="/"
            aria-label="Meyveda — Return to Home"
            className="inline-flex items-center rounded-sm transition-opacity hover:opacity-90"
          >
            <img
              src={meyvedaLogo}
              alt="Meyveda — Reinvent You"
              className="h-10 sm:h-11 w-auto object-contain"
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
              to="/contact"
              className="whitespace-nowrap py-2 text-[15px] font-semibold text-[#555555] transition-colors hover:text-[#111111]"
            >
              Contact us
            </Link>
            <Link
              to="/blogs"
              className="whitespace-nowrap py-2 text-[15px] font-bold text-[#E67230] border-b-2 border-[#E67230]"
            >
              Blogs
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
              className="group relative inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#E67230] px-4.5 text-xs sm:text-sm font-bold text-white shadow-[0_4px_16px_-4px_rgba(230,114,48,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#D15F1F] active:translate-y-0 active:shadow-sm"
            >
              <span>Register as Doctor</span>
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/"
              className="inline-flex size-9 sm:size-10 items-center justify-center rounded-md border border-[#E5E0D5] bg-[#FAF9F6] text-[#555555] hover:bg-white hover:text-[#E67230] hover:border-[#E67230]/40 transition-colors shadow-2xs"
              title="Return to Meyveda Home"
              aria-label="Back to Home"
            >
              <Home className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* 2. SAAS CONSOLE COMMAND BAR                                          */}
      {/* -------------------------------------------------------------------- */}
      <section className="border-b border-[#E5E0D5] bg-white px-5 sm:px-8 lg:px-10 py-5">
        <div className="mx-auto flex max-w-[1360px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] font-bold tracking-wider uppercase text-[#E67230]">
                MEYVEDA CLINICAL REPOSITORY · KNOWLEDGE DESK
              </p>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
              Blogs
            </h1>
          </div>

          {/* Right Filter & Search Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category tabs */}
            <div className="flex items-center rounded-lg border border-[#E5E0D5] bg-[#FAF9F6] p-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                    activeCategory === cat
                      ? "bg-white text-[#111111] shadow-2xs"
                      : "text-[#666666] hover:text-[#111111]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quick search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-3.5 text-[#888888]" />
              <input
                type="text"
                placeholder="Search blogs, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 sm:w-52 rounded-lg border border-[#E5E0D5] bg-[#FAF9F6] py-1.5 pl-8.5 pr-3 text-xs text-[#111111] placeholder:text-[#888888] focus:border-[#E67230] focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 3. SAAS MASTER-DETAIL SPLIT WORKSPACE                                */}
      {/* -------------------------------------------------------------------- */}
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* =============================================================== */}
            {/* LEFT COLUMN: STREAM / FEED OF BLOGS                             */}
            {/* =============================================================== */}
            <div className="w-full lg:w-[460px] xl:w-[500px] flex-shrink-0 space-y-3">
              <div className="flex items-center justify-between text-xs text-[#777777] px-1 pb-1">
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  Clinical Posts ({filteredPosts.length})
                </span>
                <span>Select to inspect details</span>
              </div>

              {filteredPosts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#DCD6CA] bg-white p-8 text-center">
                  <BookOpen className="mx-auto size-8 text-[#AAAAAA]" />
                  <p className="mt-2 text-xs font-bold text-[#111111]">No blogs matching filter</p>
                </div>
              ) : (
                filteredPosts.map((post, index) => {
                  const isSelected = selectedPost?.id === post.id;
                  return (
                    <div
                      key={post.id}
                      onClick={() => setSelectedId(post.id)}
                      className={`group relative cursor-pointer rounded-xl border p-4.5 transition-all duration-150 ${
                        isSelected
                          ? "border-[#E67230] bg-[#FAF4ED] shadow-xs ring-1 ring-[#E67230]"
                          : "border-[#E5E0D5] bg-white hover:border-[#D0C9BD] hover:bg-[#FCFBF8]"
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-2 py-0.5 font-bold uppercase tracking-wider text-[10px] ${
                              isSelected
                                ? "bg-[#E67230] text-white"
                                : "bg-[#F3EFE6] text-[#7A4B29]"
                            }`}
                          >
                            {post.category}
                          </span>
                          <span className="font-mono text-[#888888]">
                            BLOG-0{index + 1}
                          </span>
                        </div>

                        <span className="flex items-center gap-1 font-mono text-[#777777]">
                          <Clock className="size-3" />
                          {post.reading_time}
                        </span>
                      </div>

                      {/* Headline */}
                      <h2
                        className={`mt-2.5 text-sm sm:text-base font-bold leading-snug line-clamp-2 transition-colors ${
                          isSelected ? "text-[#111111]" : "text-[#222222] group-hover:text-[#E67230]"
                        }`}
                      >
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="mt-1.5 text-xs leading-relaxed text-[#666666] line-clamp-2">
                        {post.summary}
                      </p>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="rounded bg-white/80 border border-[#E5E0D5] px-1.5 py-0.5 text-[10px] text-[#777777]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="mt-3 flex items-center justify-between border-t border-[#E5E0D5]/60 pt-2.5 text-[11px] text-[#777777]">
                        <span className="font-medium text-[#555555]">
                          {post.author_name}
                        </span>

                        <div className="flex items-center gap-1 font-semibold text-[#E67230]">
                          <span>{isSelected ? "Reading" : "Inspect"}</span>
                          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* =============================================================== */}
            {/* RIGHT COLUMN: ENTERPRISE DETAIL CANVAS (Sticky on desktop)       */}
            {/* =============================================================== */}
            <div className="flex-1 min-w-0">
              {selectedPost ? (
                <div className="sticky top-24 rounded-2xl border border-[#E5E0D5] bg-white shadow-xs overflow-hidden">
                  {/* Document Header Bar */}
                  <div className="border-b border-[#E5E0D5] bg-[#FAF9F6] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs">
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        Clinical Monograph
                      </span>
                      <span className="text-[#888888]">•</span>
                      <span className="font-semibold text-[#555555]">
                        {selectedPost.category}
                      </span>
                      <span className="text-[#888888]">•</span>
                      <span className="flex items-center gap-1 text-[#666666]">
                        <Clock className="size-3" />
                        {selectedPost.reading_time}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyLink(selectedPost)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E0D5] bg-white px-3 py-1.5 text-xs font-semibold text-[#555555] hover:bg-[#FAF9F6] hover:text-[#111111] transition-colors"
                        title="Copy Link to Clipboard"
                      >
                        <Copy className="size-3.5" />
                        <span>Copy Link</span>
                      </button>
                      <button
                        onClick={() => handleShare(selectedPost)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E0D5] bg-white px-3 py-1.5 text-xs font-semibold text-[#555555] hover:bg-[#FAF9F6] hover:text-[#111111] transition-colors"
                        title="Share Blog"
                      >
                        <Share2 className="size-3.5" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>

                  {/* Document Content Canvas */}
                  <div className="p-6 sm:p-8 lg:p-10">
                    <span className="rounded-md bg-[#FAF4ED] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#E67230]">
                      {selectedPost.category}
                    </span>

                    <h2
                      className="mt-3 text-2xl sm:text-3xl font-extrabold text-[#111111] leading-tight"
                      style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
                    >
                      {selectedPost.title}
                    </h2>

                    {/* Author Attribution Card */}
                    <div className="mt-5 flex items-center gap-3.5 border-y border-[#F0ECE1] py-3.5">
                      <div className="flex size-10 items-center justify-center rounded-full bg-[#FAF4ED] text-[#E67230] border border-[#E67230]/30 font-bold">
                        <User className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#111111]">{selectedPost.author_name}</p>
                        <p className="text-xs text-[#777777]">{selectedPost.author_role}</p>
                      </div>
                    </div>

                    {/* Clinical Summary Highlight Box */}
                    <div className="mt-6 rounded-xl border-l-4 border-[#E67230] bg-[#FAF9F6] p-4.5 text-sm leading-relaxed text-[#444444]">
                      <p className="font-bold text-[#E67230] text-xs uppercase tracking-wider mb-1">
                        Clinical Abstract
                      </p>
                      {selectedPost.summary}
                    </div>

                    {/* Full Content */}
                    <div className="mt-6 space-y-4 text-sm sm:text-[15px] leading-relaxed text-[#333333]">
                      {selectedPost.content.split("\n\n").map((para, idx) => (
                        <p key={idx}>{para}</p>
                      ))}
                    </div>

                    {/* Indexed Tags */}
                    {selectedPost.tags && selectedPost.tags.length > 0 && (
                      <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-[#F0ECE1] pt-5">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#888888] flex items-center gap-1">
                          <Tag className="size-3.5" />
                          Indexed Tags:
                        </span>
                        {selectedPost.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-[#FAF9F6] border border-[#E5E0D5] px-2.5 py-1 text-xs font-medium text-[#555555]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Doctor Practice CTA Banner */}
                    <div className="mt-8 rounded-xl border border-[#E67230]/30 bg-gradient-to-r from-[#FAF4ED] to-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-[#E67230] uppercase tracking-wider">
                          MEYVEDA PRACTITIONER ECOSYSTEM
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[#111111]">
                          Join India's Verified Network of Sovereign Vaidyas
                        </p>
                      </div>
                      <Link
                        to="/register"
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#E67230] px-4 py-2 text-xs font-bold text-white hover:bg-[#D15F1F] transition-colors shadow-2xs whitespace-nowrap"
                      >
                        <span>Register as Doctor</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      {/* -------------------------------------------------------------------- */}
      {/* 4. FOOTER                                                            */}
      {/* -------------------------------------------------------------------- */}
      <footer className="border-t border-[#E5E0D5] bg-white py-8 text-[#111111]">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#777777]">
            <div className="flex items-center gap-3">
              <img src={meyvedaLogo} alt="Meyveda Logo" className="h-7 w-auto object-contain" />
              <span>© {new Date().getFullYear()} Meyveda Ayush Pvt Ltd. Clinical Desk.</span>
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
