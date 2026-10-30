import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Home,
  Newspaper,
  Calendar,
  ExternalLink,
  Share2,
  X,
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

export function PublicRelationsPage() {
  const [items, setItems] = useState<PRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PRItem | null>(null);

  useEffect(() => {
    async function fetchPR() {
      try {
        setLoading(true);
        const data = await apiClient.get<PRItem[]>("/content/pr");
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
        } else {
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
              status: "published",
            },
          ]);
        }
      } catch (err) {
        console.warn("Could not load remote PR releases, using fallback data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPR();
  }, []);

  const handleShare = (item: PRItem) => {
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
      {/* 2. COMPACT TITLE & PUBLIC RELATION BOXES                             */}
      {/* -------------------------------------------------------------------- */}
      <main className="flex-1 py-10 sm:py-12">
        <div className="mx-auto max-w-[1216px] px-5 sm:px-8 lg:px-12">
          {/* Direct, clean title */}
          <div className="flex items-center justify-between border-b border-[#EBE7DF] pb-5">
            <h1
              className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]"
              style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
            >
              Public Relations
            </h1>
            <span className="text-xs sm:text-sm font-medium text-[#777777]">
              {items.length} {items.length === 1 ? "release" : "releases"}
            </span>
          </div>

          {/* Grid of Public Relation Boxes */}
          {items.length === 0 ? (
            <div className="my-12 rounded-xl border border-dashed border-[#DCD6CA] bg-white p-12 text-center">
              <Newspaper className="mx-auto size-10 text-[#AAAAAA]" />
              <h3 className="mt-3 text-base font-bold text-[#111111]">No releases found</h3>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-xl border border-[#EBE7DF] bg-white p-6 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-[#E67230]/40 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="rounded-full bg-[#FAF4ED] px-2.5 py-0.5 font-bold text-[#E67230]">
                        {item.category}
                      </span>
                      <span className="flex items-center gap-1 text-[#888888]">
                        <Calendar className="size-3" />
                        {new Date(item.published_date).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h2
                      className="mt-4 text-lg sm:text-xl font-bold text-[#111111] leading-snug line-clamp-2 hover:text-[#E67230] transition-colors cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      {item.title}
                    </h2>

                    <p className="mt-3 text-sm leading-relaxed text-[#555555] line-clamp-3">
                      {item.summary}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-[#F0ECE1] pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#888888]">
                        Source: <span className="text-[#333333]">{item.media_source}</span>
                      </span>
                      <button
                        onClick={() => setSelectedItem(item)}
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
      </main>

      {/* -------------------------------------------------------------------- */}
      {/* 3. RELEASE READING MODAL                                             */}
      {/* -------------------------------------------------------------------- */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 sm:p-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-[#888888] hover:bg-[#FAF9F6] hover:text-[#111111]"
            >
              <X className="size-5" />
            </button>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-[#FAF4ED] px-3 py-1 font-bold text-[#E67230]">
                {selectedItem.category}
              </span>
              <span className="text-[#888888]">•</span>
              <span className="text-[#666666]">
                {new Date(selectedItem.published_date).toLocaleDateString("en-IN", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="text-[#888888]">•</span>
              <span className="text-[#555555]">Source: {selectedItem.media_source}</span>
            </div>

            <h2
              className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-[#111111] leading-snug"
              style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
            >
              {selectedItem.title}
            </h2>

            <div className="mt-4 rounded-lg border-l-4 border-[#E67230] bg-[#FAF9F6] p-4 text-sm italic text-[#555555]">
              {selectedItem.summary}
            </div>

            <div className="mt-6 space-y-4 text-sm sm:text-base leading-relaxed text-[#333333]">
              {selectedItem.content.split("\n\n").map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between border-t border-[#EBE7DF] pt-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleShare(selectedItem)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#EBE7DF] px-3.5 py-2 text-xs font-semibold text-[#555555] hover:bg-[#FAF9F6] hover:text-[#111111]"
                >
                  <Share2 className="size-3.5" />
                  <span>Share</span>
                </button>
                {selectedItem.media_source_url && (
                  <a
                    href={selectedItem.media_source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E67230] hover:underline"
                  >
                    <span>View Press Link</span>
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-md bg-[#111111] px-5 py-2 text-xs font-bold text-white hover:bg-[#E67230]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 4. FOOTER                                                            */}
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
