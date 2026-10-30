import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Home,
  Newspaper,
  Calendar,
  ExternalLink,
  Share2,
  CheckCircle2,
  Search,
  Building2,
  Copy,
  ChevronRight,
  FileCheck,
  ShieldCheck,
  Globe2,
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
  category: string;
  published_date: string;
  status: string;
}

const CATEGORIES = [
  "All",
  "Press Release",
  "Statutory Milestone",
  "Partnership Announcement",
];

export function PublicRelationsPage() {
  const [items, setItems] = useState<PRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  useEffect(() => {
    async function fetchPR() {
      try {
        setLoading(true);
        const data = await apiClient.get<PRItem[]>("/content/pr");
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
          setSelectedId(data[0].id);
        } else {
          const fallbackData: PRItem[] = [
            {
              id: "pr-1",
              title: "Meyveda Unveils Sovereign AYUSH Clinical Desk & Protocol Platform for Registered Vaidyas",
              slug: "meyveda-unveils-sovereign-ayush-clinical-desk",
              category: "Press Release",
              media_source: "Meyveda Media Desk",
              media_source_url: "https://meyveda.com",
              summary: "Meyveda announces the national rollout of its ABDM-ready clinical desk, eliminating practitioner administrative burdens while ensuring zero commercial commissions.",
              content: "Meyveda Ayush Pvt Ltd has officially launched its digital clinician operating system, designed specifically for registered BAMS, BUMS, BHMS, and BSMS practitioners across India.\n\nWith full ABDM-HPR compliance, e-prescriptions, and zero-inventory pharmacy fulfillment, Meyveda establishes a clear division of operational responsibility: non-clinical workflows are fully handled by the platform, leaving diagnosis, treatment selection, and patient care entirely in the hands of the doctor.\n\nThe initiative addresses long-standing challenges in traditional medicine by providing standardized digital records, verified council credentials, and reliable direct-from-depot herbal supplies.",
              published_date: new Date().toISOString().split("T")[0],
              status: "published",
            },
            {
              id: "pr-2",
              title: "AYUSH Clinical Research Initiative: Aggregating Real-World Evidence Across Southern Districts",
              slug: "ayush-clinical-research-initiative-real-world-evidence",
              category: "Statutory Milestone",
              media_source: "Business Standard",
              media_source_url: "https://business-standard.com",
              summary: "A collaborative framework linking state council-registered practitioners with authenticated classical pharmacology monographs and longitudinal outcomes.",
              content: "In partnership with leading academic clinicians and accredited laboratories, Meyveda is pioneering the systematic documentation of constitutional (Prakriti) assessments and patient recovery trajectories.\n\nThis real-world evidence framework bridges classical Ayurvedic principles with contemporary peer-reviewed scientific validation, allowing independent Vaidyas to contribute to longitudinal research registries.",
              published_date: new Date().toISOString().split("T")[0],
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
              content: "Meyveda's Cluster Franchise program empowers local healthcare entrepreneurs to operate exclusive district fulfillment hubs.\n\nBy replacing unverified direct-to-consumer commerce with doctor-guided, batch-tested herbal deliveries, Meyveda ensures medicine authenticity and timely patient support across all territorial clusters.",
              published_date: new Date().toISOString().split("T")[0],
              status: "published",
            },
          ];
          setItems(fallbackData);
          setSelectedId(fallbackData[0].id);
        }
      } catch (err) {
        console.warn("Could not load remote PR releases, using fallback data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPR();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesCat =
      activeCategory === "All" ||
      item.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesQuery =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.media_source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const selectedItem =
    filteredItems.find((i) => i.id === selectedId) ||
    filteredItems[0] ||
    items[0];

  const handleCopyLink = (item: PRItem) => {
    const url = `${window.location.origin}/public-relations?id=${item.slug || item.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Release link copied to clipboard!");
  };

  const handleShare = (item: PRItem) => {
    if (navigator.share) {
      navigator
        .share({
          title: item.title,
          text: item.summary,
          url: `${window.location.origin}/public-relations?id=${item.slug || item.id}`,
        })
        .catch(() => {});
    } else {
      handleCopyLink(item);
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
                MEYVEDA DISPATCH · PUBLIC RELATIONS DESK
              </p>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
              Public Relations
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
                placeholder="Search releases..."
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
            {/* LEFT COLUMN: STREAM / FEED OF RELEASES                          */}
            {/* =============================================================== */}
            <div className="w-full lg:w-[460px] xl:w-[500px] flex-shrink-0 space-y-3">
              <div className="flex items-center justify-between text-xs text-[#777777] px-1 pb-1">
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  Official Releases ({filteredItems.length})
                </span>
                <span>Select to inspect details</span>
              </div>

              {filteredItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#DCD6CA] bg-white p-8 text-center">
                  <Newspaper className="mx-auto size-8 text-[#AAAAAA]" />
                  <p className="mt-2 text-xs font-bold text-[#111111]">No releases matching filter</p>
                </div>
              ) : (
                filteredItems.map((item, index) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedId(item.id);
                        setMobileDetailOpen(true);
                      }}
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
                            {item.category}
                          </span>
                          <span className="font-mono text-[#888888]">
                            PR-0{index + 1}
                          </span>
                        </div>

                        <span className="flex items-center gap-1 font-mono text-[#777777]">
                          <Calendar className="size-3" />
                          {new Date(item.published_date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {/* Headline */}
                      <h2
                        className={`mt-2.5 text-sm sm:text-base font-bold leading-snug line-clamp-2 transition-colors ${
                          isSelected ? "text-[#111111]" : "text-[#222222] group-hover:text-[#E67230]"
                        }`}
                      >
                        {item.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="mt-1.5 text-xs leading-relaxed text-[#666666] line-clamp-2">
                        {item.summary}
                      </p>

                      {/* Footer Info */}
                      <div className="mt-3 flex items-center justify-between border-t border-[#E5E0D5]/60 pt-2.5 text-[11px] text-[#777777]">
                        <span className="font-medium text-[#555555]">
                          {item.media_source}
                        </span>

                        <div className="flex items-center gap-1 font-semibold text-[#E67230]">
                          <span>{isSelected ? "Inspecting" : "View"}</span>
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
              {selectedItem ? (
                <div className="sticky top-24 rounded-2xl border border-[#E5E0D5] bg-white shadow-xs overflow-hidden">
                  {/* Document Header Bar */}
                  <div className="border-b border-[#E5E0D5] bg-[#FAF9F6] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs">
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        Statutory Dispatch
                      </span>
                      <span className="text-[#888888]">•</span>
                      <span className="font-mono text-[#666666]">
                        {selectedItem.published_date}
                      </span>
                      <span className="text-[#888888]">•</span>
                      <span className="font-semibold text-[#555555]">
                        {selectedItem.media_source}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyLink(selectedItem)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E0D5] bg-white px-3 py-1.5 text-xs font-semibold text-[#555555] hover:bg-[#FAF9F6] hover:text-[#111111] transition-colors"
                        title="Copy Link to Clipboard"
                      >
                        <Copy className="size-3.5" />
                        <span>Copy Link</span>
                      </button>
                      <button
                        onClick={() => handleShare(selectedItem)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E0D5] bg-white px-3 py-1.5 text-xs font-semibold text-[#555555] hover:bg-[#FAF9F6] hover:text-[#111111] transition-colors"
                        title="Share Release"
                      >
                        <Share2 className="size-3.5" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>

                  {/* Document Content Canvas */}
                  <div className="p-6 sm:p-8 lg:p-10">
                    <span className="rounded-md bg-[#FAF4ED] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#E67230]">
                      {selectedItem.category}
                    </span>

                    <h2
                      className="mt-3 text-2xl sm:text-3xl font-extrabold text-[#111111] leading-tight"
                      style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
                    >
                      {selectedItem.title}
                    </h2>

                    {/* Metadata Telemetry Pill Strip */}
                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-y border-[#F0ECE1] py-3.5 text-xs">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-[#888888]">Issuing Entity</p>
                        <p className="font-semibold text-[#111111] mt-0.5">Meyveda Ayush Pvt Ltd</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-[#888888]">Regulatory Gate</p>
                        <p className="font-semibold text-[#111111] mt-0.5">ABDM-HPR Protocol</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-[#888888]">Primary Sector</p>
                        <p className="font-semibold text-[#111111] mt-0.5">AYUSH Infrastructure</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-[#888888]">Distribution</p>
                        <p className="font-semibold text-[#111111] mt-0.5">National Wire</p>
                      </div>
                    </div>

                    {/* Executive Abstract Box */}
                    <div className="mt-6 rounded-xl border-l-4 border-[#E67230] bg-[#FAF9F6] p-4.5 text-sm leading-relaxed text-[#444444]">
                      <p className="font-bold text-[#E67230] text-xs uppercase tracking-wider mb-1">
                        Executive Summary
                      </p>
                      {selectedItem.summary}
                    </div>

                    {/* Formatted Full Content */}
                    <div className="mt-6 space-y-4 text-sm sm:text-[15px] leading-relaxed text-[#333333]">
                      {selectedItem.content.split("\n\n").map((para, idx) => (
                        <p key={idx}>{para}</p>
                      ))}
                    </div>

                    {/* Document Verification Footer */}
                    <div className="mt-8 flex flex-wrap items-center justify-between border-t border-[#F0ECE1] pt-6 text-xs text-[#777777]">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-emerald-600" />
                        <span>Authenticated Meyveda Ayush Communications Desk</span>
                      </div>

                      {selectedItem.media_source_url && (
                        <a
                          href={selectedItem.media_source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-bold text-[#E67230] hover:underline"
                        >
                          <span>External Wire Record</span>
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
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
              <span>© {new Date().getFullYear()} Meyveda Ayush Pvt Ltd. Official Media Desk.</span>
            </div>
            <div className="flex gap-6">
              <Link to="/about" className="hover:text-[#E67230]">About Us</Link>
              <Link to="/public-relations" className="text-[#E67230] font-semibold">Public relation</Link>
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
