import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Home,
  Newspaper,
  Calendar,
  ExternalLink,
  Search,
  CheckCircle2,
  Share2,
  X,
  Mail,
  Building2,
  FileText,
  Sparkles,
} from "lucide-react";
import meyvedaLogo from "@/assets/meyvedalogo.png";
import { MEYVEDA_CONTACT } from "@/lib/contact-info";
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
  category: string;
  cover_image_url?: string | null;
  published_date: string;
  is_featured: boolean;
  status: string;
}

const CATEGORIES = [
  "All",
  "Press Release",
  "Media Coverage",
  "Statutory Milestone",
  "Partnership Announcement",
];

export function PublicRelationsPage() {
  const [items, setItems] = useState<PRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<PRItem | null>(null);

  useEffect(() => {
    async function fetchPR() {
      try {
        setLoading(true);
        const data = await apiClient.get<PRItem[]>("/content/pr");
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
        } else {
          // Fallback initial sample if server has empty list
          setItems([
            {
              id: "pr-1",
              title: "Meyveda Unveils Sovereign AYUSH Clinical Desk & Protocol Platform for Registered Vaidyas",
              slug: "meyveda-unveils-sovereign-ayush-clinical-desk",
              category: "Press Release",
              media_source: "Meyveda Media Desk",
              media_source_url: "https://meyveda.com",
              summary: "Meyveda announces the national rollout of its ABDM-ready clinical desk, eliminating practitioner administrative burdens while ensuring zero commercial commissions.",
              content: "Meyveda Ayush Pvt Ltd has officially launched its digital clinician operating system, designed specifically for registered BAMS, BUMS, BHMS, and BSMS practitioners across India. With full ABDM-HPR compliance, e-prescriptions, and zero-inventory pharmacy fulfillment, Meyveda establishes a clear division of operational responsibility: non-clinical workflows are fully handled by the platform, leaving diagnosis, treatment selection, and patient care entirely in the hands of the doctor.",
              published_date: new Date().toISOString().split("T")[0],
              is_featured: true,
              status: "published",
            },
            {
              id: "pr-2",
              title: "AYUSH Clinical Research Initiative: Aggregating Real-World Evidence (RWE) Across Southern Districts",
              slug: "ayush-clinical-research-initiative-real-world-evidence",
              category: "Statutory Milestone",
              media_source: "Business Standard",
              media_source_url: "https://business-standard.com",
              summary: "A collaborative framework linking state council-registered practitioners with authenticated classical pharmacology monographs and longitudinal outcomes.",
              content: "In partnership with leading academic clinicians and accredited laboratories, Meyveda is pioneering the systematic documentation of constitutional (Prakriti) assessments and patient recovery trajectories. This real-world evidence framework bridges classical Ayurvedic principles with contemporary peer-reviewed scientific validation.",
              published_date: new Date().toISOString().split("T")[0],
              is_featured: false,
              status: "published",
            },
            {
              id: "pr-3",
              title: "Meyveda Cluster Franchise Model Expands District-Level AYUSH Supply Infrastructure",
              slug: "meyveda-cluster-franchise-model-expands-supply-infrastructure",
              category: "Partnership Announcement",
              media_source: "Express Healthcare",
              media_source_url: "https://expresshealthcare.in",
              summary: "New exclusive district hub network ensures doctor-guided, authenticated herbal deliveries within 24 to 48 hours directly to patients.",
              content: "Meyveda's Cluster Franchise program empowers local healthcare entrepreneurs to operate exclusive district fulfillment hubs. By replacing unverified direct-to-consumer commerce with doctor-guided, batch-tested herbal deliveries, Meyveda ensures medicine authenticity and timely patient support.",
              published_date: new Date().toISOString().split("T")[0],
              is_featured: false,
              status: "published",
            },
          ]);
        }
      } catch (err) {
        console.warn("Could not load remote PR articles, using fallback data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPR();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      activeCategory === "All" ||
      item.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.media_source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredItem = items.find((i) => i.is_featured) || items[0];

  const handleShare = (article: PRItem) => {
    if (navigator.share) {
      navigator
        .share({
          title: article.title,
          text: article.summary,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Article link copied to clipboard!");
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
              className="whitespace-nowrap py-2 text-[15px] font-bold text-[#E67230] border-b-2 border-[#E67230]"
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
              className="whitespace-nowrap py-2 text-[15px] font-semibold text-[#555555] transition-colors hover:text-[#111111]"
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
            MEYVEDA NEWSROOM & MEDIA DESK
          </p>

          <h1
            className="text-[36px] sm:text-[48px] lg:text-[58px] font-bold tracking-tight text-[#111111] leading-[1.1] max-w-4xl mx-auto"
            style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
          >
            Public Relations & <br className="hidden sm:inline" />
            <span className="text-[#E67230]">Statutory Announcements</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg lg:text-[19px] leading-relaxed text-[#555555]">
            Official press releases, sovereign AYUSH regulatory milestones, media coverage, and institutional updates from Meyveda Ayush Pvt Ltd.
          </p>

          {/* Search Bar */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="relative flex items-center">
              <Search className="absolute left-4 size-5 text-[#888888]" />
              <input
                type="text"
                placeholder="Search press releases, media mentions, keywords..."
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
      {/* 3. FEATURED RELEASE SPOTLIGHT (if matches filter)                     */}
      {/* -------------------------------------------------------------------- */}
      {featuredItem && activeCategory === "All" && !searchQuery && (
        <section className="border-b border-[#EBE7DF] bg-[#FAF9F6] py-12 sm:py-16">
          <div className="mx-auto max-w-[1216px] px-5 sm:px-8 lg:px-12">
            <div className="rounded-2xl border border-[#E67230]/30 bg-gradient-to-br from-white via-white to-[#FAF4ED] p-6 sm:p-10 shadow-sm transition-all hover:shadow-md">
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E67230] px-3 py-1 font-bold text-white uppercase tracking-wider text-[11px]">
                  Featured Release
                </span>
                <span className="font-semibold text-[#E67230]">
                  {featuredItem.category}
                </span>
                <span className="text-[#888888]">•</span>
                <span className="flex items-center gap-1 text-[#666666]">
                  <Calendar className="size-3.5" />
                  {new Date(featuredItem.published_date).toLocaleDateString("en-IN", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="text-[#888888]">•</span>
                <span className="font-medium text-[#555555]">
                  Source: {featuredItem.media_source}
                </span>
              </div>

              <h2
                className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111111] leading-tight"
                style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
              >
                {featuredItem.title}
              </h2>

              <p className="mt-4 text-base sm:text-lg leading-relaxed text-[#555555]">
                {featuredItem.summary}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setSelectedArticle(featuredItem)}
                  className="inline-flex items-center gap-2 rounded-md bg-[#111111] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#E67230]"
                >
                  <span>Read Full Release</span>
                  <ArrowRight className="size-4" />
                </button>
                {featuredItem.media_source_url && (
                  <a
                    href={featuredItem.media_source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#555555] hover:text-[#E67230]"
                  >
                    <span>View External Source</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 4. ARTICLES GRID                                                     */}
      {/* -------------------------------------------------------------------- */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-[1216px] px-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between border-b border-[#EBE7DF] pb-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
              {activeCategory === "All" ? "All Announcements" : activeCategory}
            </h2>
            <span className="text-sm font-medium text-[#888888]">
              {filteredItems.length} {filteredItems.length === 1 ? "article" : "articles"}
            </span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="my-16 rounded-2xl border border-dashed border-[#DCD6CA] bg-white p-12 text-center">
              <Newspaper className="mx-auto size-12 text-[#AAAAAA]" />
              <h3 className="mt-4 text-lg font-bold text-[#111111]">No announcements found</h3>
              <p className="mt-1 text-sm text-[#666666]">
                Try adjusting your search criteria or filter to find older press releases.
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
              {filteredItems.map((article) => (
                <div
                  key={article.id}
                  className="flex flex-col justify-between rounded-xl border border-[#EBE7DF] bg-white p-6 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-[#E67230]/40 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="rounded-full bg-[#FAF4ED] px-2.5 py-0.5 font-bold text-[#E67230]">
                        {article.category}
                      </span>
                      <span className="flex items-center gap-1 text-[#888888]">
                        <Calendar className="size-3" />
                        {new Date(article.published_date).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h3
                      className="mt-4 text-lg sm:text-xl font-bold text-[#111111] leading-snug line-clamp-2 hover:text-[#E67230] transition-colors cursor-pointer"
                      onClick={() => setSelectedArticle(article)}
                    >
                      {article.title}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-[#555555] line-clamp-3">
                      {article.summary}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-[#F0ECE1] pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#888888]">
                        Source: <span className="text-[#333333]">{article.media_source}</span>
                      </span>
                      <button
                        onClick={() => setSelectedArticle(article)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#E67230] hover:underline"
                      >
                        Read More
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
      {/* 5. MEDIA INQUIRIES & PRESS CONTACT STRIP                             */}
      {/* -------------------------------------------------------------------- */}
      <section className="border-t border-[#EBE7DF] bg-[#FAF4ED] py-16 sm:py-20">
        <div className="mx-auto max-w-[1216px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#E67230]">
                PRESS & MEDIA INQUIRIES
              </p>
              <h2
                className="mt-2 text-2xl sm:text-3xl font-bold text-[#111111]"
                style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
              >
                Official Spokesperson & Media Relations Desk
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#555555]">
                For editorial interviews, verified statistics on AYUSH digitalization, official spokespersons, or high-resolution press assets, reach out to our corporate communications office.
              </p>
            </div>

            <div className="rounded-xl border border-[#E67230]/20 bg-white p-6 shadow-sm">
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="size-5 text-[#E67230]" />
                  <div>
                    <p className="text-xs text-[#888888]">Media Contact</p>
                    <a
                      href="mailto:press@meyveda.com"
                      className="font-bold text-[#111111] hover:text-[#E67230]"
                    >
                      press@meyveda.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="size-5 text-[#E67230]" />
                  <div>
                    <p className="text-xs text-[#888888]">Corporate Headquarters</p>
                    <p className="font-semibold text-[#111111]">
                      Meyveda Ayush Pvt Ltd • Chennai, Tamil Nadu, India
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 6. ARTICLE FULL READING MODAL                                        */}
      {/* -------------------------------------------------------------------- */}
      {selectedArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 sm:p-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-[#888888] hover:bg-[#FAF9F6] hover:text-[#111111]"
            >
              <X className="size-5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-[#FAF4ED] px-3 py-1 font-bold text-[#E67230]">
                {selectedArticle.category}
              </span>
              <span className="text-[#888888]">•</span>
              <span className="text-[#666666]">
                {new Date(selectedArticle.published_date).toLocaleDateString("en-IN", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="text-[#888888]">•</span>
              <span className="text-[#555555]">Source: {selectedArticle.media_source}</span>
            </div>

            <h2
              className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-[#111111] leading-snug"
              style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
            >
              {selectedArticle.title}
            </h2>

            {/* Summary highlight box */}
            <div className="mt-4 rounded-lg border-l-4 border-[#E67230] bg-[#FAF9F6] p-4 text-sm italic text-[#555555]">
              {selectedArticle.summary}
            </div>

            {/* Full Body Content */}
            <div className="mt-6 space-y-4 text-sm sm:text-base leading-relaxed text-[#333333]">
              {selectedArticle.content.split("\n\n").map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            {/* Modal Footer Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-between border-t border-[#EBE7DF] pt-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleShare(selectedArticle)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#EBE7DF] px-3.5 py-2 text-xs font-semibold text-[#555555] hover:bg-[#FAF9F6] hover:text-[#111111]"
                >
                  <Share2 className="size-3.5" />
                  <span>Share Announcement</span>
                </button>
                {selectedArticle.media_source_url && (
                  <a
                    href={selectedArticle.media_source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E67230] hover:underline"
                  >
                    <span>View Press Wire Link</span>
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>

              <button
                onClick={() => setSelectedArticle(null)}
                className="rounded-md bg-[#111111] px-5 py-2 text-xs font-bold text-white hover:bg-[#E67230]"
              >
                Close Release
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
                <li><Link to="/public-relations" className="text-[#E67230] font-semibold">Public Relations</Link></li>
                <li><Link to="/blogs" className="hover:text-[#E67230] transition-colors">Clinical Blogs</Link></li>
                <li><a href="mailto:press@meyveda.com" className="hover:text-[#E67230] transition-colors">Press Inquiries</a></li>
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
