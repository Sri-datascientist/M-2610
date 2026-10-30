import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

export function ClusterFranchiseePartnerSection() {
  return (
    <section
      id="cluster-franchise-partner-network"
      aria-labelledby="franchise-partner-heading"
      className="scroll-mt-20 border-t border-b border-[#E8E4DE] bg-gradient-to-b from-[#FAF7F2] via-[#F6F1E8] to-[#FAF7F2] text-[#111111] py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        {/* Header & Primary Action CTA Block */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 sm:gap-8">
          <div className="max-w-3xl">
            {/* Section Eyebrow Label */}
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E67230] mb-2.5">
              CLUSTER FRANCHISEE PARTNER NETWORK
            </p>

            {/* Headline */}
            <h2
              id="franchise-partner-heading"
              className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[#111111] leading-[1.15]"
              style={{ fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif' }}
            >
              Bring care closer to your community.
            </h2>

            {/* Description */}
            <p className="mt-3 text-sm sm:text-base lg:text-[17px] leading-relaxed text-[#55524B] max-w-2xl">
              Supply medicines to prescribed patients and clinics through doctor and territory manager orders.
              The partnership program is planned.
            </p>
          </div>

          {/* Primary Action Button */}
          <div className="shrink-0 pt-2 lg:pt-0">
            <Link
              to="/cluster-franchise"
              className="inline-flex h-12 sm:h-13 items-center justify-center gap-2 rounded-lg bg-[#E67230] px-6 sm:px-7 text-sm sm:text-base font-bold text-white shadow-[0_4px_16px_-4px_rgba(230,114,48,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#D15F1F] hover:shadow-[0_8px_24px_-4px_rgba(230,114,48,0.5)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67230] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <span>Become a Cluster Franchisee Partner</span>
              <ArrowUpRight className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
