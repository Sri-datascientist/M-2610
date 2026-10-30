import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Home,
  BookOpen,
  Clock,
  Search,
  Tag,
  Share2,
  X,
  User,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import meyvedaLogo from "@/assets/meyvedalogo.png";
import { MEYVEDA_CONTACT } from "@/lib/contact-info";
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
  cover_image_url?: string | null;
  reading_time: string;
  tags?: string[] | null;
  is_featured: boolean;
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
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<BlogPostItem | null>(null);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        setLoading(true);
        const data = await apiClient.get<BlogPostItem[]>("/content/blogs");
        if (Array.isArray(data) && data.length > 0) {
          setPosts(data);
        } else {
          // Fallback initial sample if server has empty list
          setPosts([
            {
              id: "blog-1",
              title: "Modernizing Clinical Nadi Pariksha: Integrating Classical Pulse Diagnostics with Longitudinal Vitals",
              slug: "modernizing-clinical-nadi-pariksha-classical-pulse",
              author_name: "Dr. Ramesh Vaidya, BAMS",
              author_role: "Chief Ayurvedic Consultant & Research Lead",
              category: "Clinical Practice",
              reading_time: "5 min read",
              tags: ["Kayachikitsa", "Nadi Pariksha", "Clinical Protocols"],
              summary: "How systematic recording of Tridosha imbalances and Rogi-Roga Pariksha transforms subjective pulse analysis into verifiable clinical evidence.",
              content: "Classical Ayurveda places Nadi Pariksha (pulse examination) at the pinnacle of the Ashtavidha Pariksha. However, in contemporary practice, transmitting and tracking these diagnostic insights across multi-session treatments requires structured documentation.\n\nIn this clinical guide, we explore how standardized Prakriti-Vikriti digital indexing preserves the tactile nuance of pulse dynamics while creating verifiable longitudinal health records for integrative follow-ups. By bridging classical terms (e.g. Sarpa, Manduka, Hamsa gati) with modern patient observation timelines, practitioners build unshakeable credibility with both patients and the wider medical community.",
              is_featured: true,
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
              tags: ["Rasa Shastra", "Heavy Metal Testing", "GMP Compliance"],
              summary: "An analysis of Shodhana and Marana purification cycles, AAS testing protocols, and ensuring patient trust in classical herbo-mineral preparations.",
              content: "Herbo-mineral formulations in Ayurveda, developed through centuries of Rasa Shastra expertise, require exacting purification (Shodhana) and calcination (Marana) processes.\n\nWhen produced under strict Good Manufacturing Practices (GMP) and verified through Atomic Absorption Spectroscopy (AAS), Bhasmas demonstrate optimal bioavailability and strict adherence to statutory safety limits. We review the essential laboratory criteria every practitioner must review before prescribing, highlighting how Certificate of Analysis (CoA) transparency protects patient wellness.",
              is_featured: false,
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
              tags: ["ABDM", "Healthcare Identity", "Telemedicine"],
              summary: "Demystifying Healthcare Professional Registry (HPR) enrollment, statutory compliance, and digital prescription validity under National Health Authority standards.",
              content: "The Ayushman Bharat Digital Mission (ABDM) has introduced a transformative leap for AYUSH practitioners. By linking state medical council credentials to a verified Healthcare Professional Registry (HPR) ID, doctors gain sovereign ownership of their digital identity.\n\nThis article walks through the key statutory advantages, from digital signature compliance to direct integration with national health claim gateways, ensuring AYUSH clinicians stand on equal footing with all registered medical providers.",
              is_featured: false,
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

  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      activeCategory === "All" ||
      post.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags && post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  const featuredPost = posts.find((p) => p.is_featured) || posts[0];

  const handleShare = (post: BlogPostItem) => {
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
      {/* 1. HEADER & BRAND NAVIGATION BAR                                     */}
      {/* -------------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-[#EBE7DF] bg-[#FAF9F6]/95 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-20 max-w-[1216px] items-center justify-between px-5 sm:px-8 lg:px-12">
          {/* Official Meyveda Logo */}
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
      {/* 2. HERO SECTION                                                      */}
      {/* -------------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-[#EBE7DF] bg-white py-16 sm:py-20 lg:py-24">
        <div className="relative mx-auto max-w-[1216px] px-5 sm:px-8 lg:px-12 text-center">
          <p className="mb-3 text-xs sm:text-sm font-bold uppercase tracking-widest text-[#E67230]">
            MEYVEDA CLINICAL & KNOWLEDGE DESK
          </p>

          <h1
            className="text-[36px] sm:text-[48px] lg:text-[58px] font-bold tracking-tight text-[#111111] leading-[1.1] max-w-4xl mx-auto"
            style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
          >
            Perspectives, Protocols & <br className="hidden sm:inline" />
            <span className="text-[#E67230]">AYUSH Clinical Insights</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg lg:text-[19px] leading-relaxed text-[#555555]">
            Evidence-guided clinical perspectives, classical Ayurvedic pharmacology, protocol reviews, and ABDM digital healthcare transformation written for registered practitioners.
          </p>

          {/* Search Bar */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="relative flex items-center">
              <Search className="absolute left-4 size-5 text-[#888888]" />
              <input
                type="text"
                placeholder="Search clinical topics, authors, herbs, protocols..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-[#EBE7DF] bg-[#FAF9F6] py-3.5 pl-12 pr-4 text-sm text-[#111111] placeholder-[#888888] shadow-inner transition-all focus:border-[#E67230] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E67230]/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 text-xs font-semibold text-[#888888] hover:text-[#111111]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-[#111111] text-white shadow-sm"
                    : "bg-[#FAF9F6] text-[#555555] border border-[#EBE7DF] hover:bg-white hover:text-[#111111]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 3. FEATURED POST SPOTLIGHT (if matches filter)                        */}
      {/* -------------------------------------------------------------------- */}
      {featuredPost && activeCategory === "All" && !searchQuery && (
        <section className="border-b border-[#EBE7DF] bg-[#FAF9F6] py-12 sm:py-16">
          <div className="mx-auto max-w-[1216px] px-5 sm:px-8 lg:px-12">
            <div className="rounded-2xl border border-[#E67230]/30 bg-gradient-to-br from-white via-white to-[#FAF4ED] p-6 sm:p-10 shadow-sm transition-all hover:shadow-md">
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E67230] px-3 py-1 font-bold text-white uppercase tracking-wider text-[11px]">
                  Featured Insight
                </span>
                <span className="font-semibold text-[#E67230]">
                  {featuredPost.category}
                </span>
                <span className="text-[#888888]">•</span>
                <span className="flex items-center gap-1 text-[#666666]">
                  <Clock className="size-3.5" />
                  {featuredPost.reading_time}
                </span>
              </div>

              <h2
                className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111111] leading-tight"
                style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
              >
                {featuredPost.title}
              </h2>

              <p className="mt-4 text-base sm:text-lg leading-relaxed text-[#555555]">
                {featuredPost.summary}
              </p>

              {/* Author & CTA Bar */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#F0ECE1] pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-[#E67230]/10 text-[#E67230]">
                    <User className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111111]">{featuredPost.author_name}</p>
                    <p className="text-xs text-[#777777]">{featuredPost.author_role}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPost(featuredPost)}
                  className="inline-flex items-center gap-2 rounded-md bg-[#111111] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#E67230]"
                >
                  <span>Read Full Article</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 4. BLOG POSTS GRID                                                   */}
      {/* -------------------------------------------------------------------- */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-[1216px] px-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between border-b border-[#EBE7DF] pb-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
              {activeCategory === "All" ? "Latest Articles & Monographs" : activeCategory}
            </h2>
            <span className="text-sm font-medium text-[#888888]">
              {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"}
            </span>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="my-16 rounded-2xl border border-dashed border-[#DCD6CA] bg-white p-12 text-center">
              <BookOpen className="mx-auto size-12 text-[#AAAAAA]" />
              <h3 className="mt-4 text-lg font-bold text-[#111111]">No articles found</h3>
              <p className="mt-1 text-sm text-[#666666]">
                Try adjusting your search criteria or filter to browse other topics.
              </p>
              <button
                onClick={() => {
                  setActiveCategory("All");
                  setSearchQuery("");
                }}
                className="mt-4 inline-flex items-center rounded-md bg-[#111111] px-4 py-2 text-xs font-bold text-white hover:bg-[#E67230]"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex flex-col justify-between rounded-xl border border-[#EBE7DF] bg-white p-6 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-[#E67230]/40 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="rounded-full bg-[#FAF4ED] px-2.5 py-0.5 font-bold text-[#E67230]">
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1 text-[#888888]">
                        <Clock className="size-3" />
                        {post.reading_time}
                      </span>
                    </div>

                    <h3
                      className="mt-4 text-lg sm:text-xl font-bold text-[#111111] leading-snug line-clamp-2 hover:text-[#E67230] transition-colors cursor-pointer"
                      onClick={() => setSelectedPost(post)}
                    >
                      {post.title}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-[#555555] line-clamp-3">
                      {post.summary}
                    </p>

                    {post.tags && post.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {post.tags.slice(0, 3).map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="rounded-md bg-[#FAF9F6] border border-[#EBE7DF] px-2 py-0.5 text-[11px] font-medium text-[#666666]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 border-t border-[#F0ECE1] pt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs">
                        <p className="font-bold text-[#111111]">{post.author_name}</p>
                        <p className="text-[11px] text-[#888888]">{post.author_role}</p>
                      </div>
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#E67230] hover:underline"
                      >
                        Read Post
                        <ArrowRight className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 5. CLINICAL CONTRIBUTIONS CTA BANNER                                 */}
      {/* -------------------------------------------------------------------- */}
      <section className="border-t border-[#EBE7DF] bg-[#FAF4ED] py-16 sm:py-20">
        <div className="mx-auto max-w-[1216px] px-5 sm:px-8 lg:px-12 text-center">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#E67230]">
            CALL FOR CLINICAL RESEARCH & CASE STUDIES
          </p>
          <h2
            className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111111]"
            style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
          >
            Are You an AYUSH Clinician with Real-World Evidence?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-[#555555]">
            Meyveda’s practitioner community welcomes peer-reviewed clinical monographs, case documentation, and pharmacovigilance reports from registered Vaidyas.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-md bg-[#E67230] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#D15F1F]"
            >
              <span>Join Practitioner Network</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center rounded-md border border-[#DCD6CA] bg-white px-5 py-3 text-sm font-semibold text-[#111111] hover:bg-[#FAF9F6]"
            >
              Learn Our Mission
            </Link>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 6. BLOG POST READING MODAL                                           */}
      {/* -------------------------------------------------------------------- */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 sm:p-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-[#888888] hover:bg-[#FAF9F6] hover:text-[#111111]"
            >
              <X className="size-5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-[#FAF4ED] px-3 py-1 font-bold text-[#E67230]">
                {selectedPost.category}
              </span>
              <span className="text-[#888888]">•</span>
              <span className="flex items-center gap-1 text-[#666666]">
                <Clock className="size-3" />
                {selectedPost.reading_time}
              </span>
            </div>

            <h2
              className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-[#111111] leading-snug"
              style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
            >
              {selectedPost.title}
            </h2>

            {/* Author Attribution */}
            <div className="mt-4 flex items-center gap-3 border-y border-[#F0ECE1] py-3 text-xs sm:text-sm">
              <div className="flex size-9 items-center justify-center rounded-full bg-[#E67230]/10 text-[#E67230]">
                <User className="size-4.5" />
              </div>
              <div>
                <p className="font-bold text-[#111111]">{selectedPost.author_name}</p>
                <p className="text-xs text-[#777777]">{selectedPost.author_role}</p>
              </div>
            </div>

            {/* Summary highlight box */}
            <div className="mt-4 rounded-lg border-l-4 border-[#E67230] bg-[#FAF9F6] p-4 text-sm italic text-[#555555]">
              {selectedPost.summary}
            </div>

            {/* Full Body Content */}
            <div className="mt-6 space-y-4 text-sm sm:text-base leading-relaxed text-[#333333]">
              {selectedPost.content.split("\n\n").map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            {/* Tags */}
            {selectedPost.tags && selectedPost.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#F0ECE1] pt-4">
                <span className="text-xs font-semibold text-[#888888]">Indexed Tags:</span>
                {selectedPost.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="rounded-md bg-[#FAF9F6] border border-[#EBE7DF] px-2.5 py-1 text-xs font-medium text-[#555555]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-between border-t border-[#EBE7DF] pt-6">
              <button
                onClick={() => handleShare(selectedPost)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#EBE7DF] px-3.5 py-2 text-xs font-semibold text-[#555555] hover:bg-[#FAF9F6] hover:text-[#111111]"
              >
                <Share2 className="size-3.5" />
                <span>Share Article</span>
              </button>

              <button
                onClick={() => setSelectedPost(null)}
                className="rounded-md bg-[#111111] px-5 py-2 text-xs font-bold text-white hover:bg-[#E67230]"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 7. FOOTER                                                            */}
      {/* -------------------------------------------------------------------- */}
      <footer className="border-t border-[#EBE7DF] bg-white py-12 text-[#111111] sm:py-16">
        <div className="mx-auto max-w-[1216px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-8">
            <div className="space-y-4">
              <img
                src={meyvedaLogo}
                alt="Meyveda Logo"
                className="h-9 w-auto object-contain"
              />
              <p className="text-xs leading-relaxed text-[#666666]">
                Modern Clinician Operating System for Sovereign AYUSH Practitioners. Zero Referral Commissions. Complete Practice Independence.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#111111]">Platform</p>
              <ul className="mt-4 space-y-2.5 text-xs text-[#666666]">
                <li><Link to="/" className="hover:text-[#E67230] transition-colors">For Doctors</Link></li>
                <li><Link to="/about" className="hover:text-[#E67230] transition-colors">About Us</Link></li>
                <li><Link to="/cluster-franchise" className="hover:text-[#E67230] transition-colors">Cluster Franchise</Link></li>
                <li><Link to="/contact" className="hover:text-[#E67230] transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#111111]">Media & Insights</p>
              <ul className="mt-4 space-y-2.5 text-xs text-[#666666]">
                <li><Link to="/public-relations" className="hover:text-[#E67230] transition-colors">Public Relations</Link></li>
                <li><Link to="/blogs" className="text-[#E67230] font-semibold">Clinical Blogs</Link></li>
                <li><a href="mailto:editorial@meyveda.com" className="hover:text-[#E67230] transition-colors">Submit Monograph</a></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#111111]">Legal & Compliance</p>
              <ul className="mt-4 space-y-2.5 text-xs text-[#666666]">
                <li><Link to="/terms" className="hover:text-[#E67230] transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-[#E67230] transition-colors">Privacy Policy</Link></li>
                <li><span className="text-[#999999]">ABDM-HPR Protocol Verified</span></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#111111]">Headquarters</p>
              <address className="mt-4 not-italic text-xs leading-relaxed text-[#666666]">
                Meyveda Ayush Pvt Ltd<br />
                {MEYVEDA_CONTACT.address}<br />
                Email: {MEYVEDA_CONTACT.email}
              </address>
            </div>
          </div>

          <div className="mt-12 border-t border-[#EBE7DF] pt-8 text-center text-xs text-[#888888]">
            <p>© {new Date().getFullYear()} Meyveda Ayush Pvt Ltd. All statutory rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
