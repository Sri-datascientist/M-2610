import React, { useState } from "react";
import {
  MapPin,
  Filter,
  BarChart2,
  TrendingUp,
  Users,
  CheckCircle,
  ShieldCheck,
  Calendar,
  Layers,
} from "lucide-react";
import { PageHeader, StatusPill, EmptyState, MetricCard } from "@/components/portal/brand";
import { useManufacturer } from "./manufacturer-context";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export const TerritoryInsightsPage: React.FC = () => {
  const { territoryInsights, products } = useManufacturer();

  const [stateFilter, setStateFilter] = useState("ALL");
  const [productFilter, setProductFilter] = useState("ALL");
  const [periodFilter, setPeriodFilter] = useState("Last 90 Days (Q3 2026)");

  const filteredTerritories = territoryInsights.filter((t) => {
    const matchesState = stateFilter === "ALL" || t.state === stateFilter;
    const matchesProduct =
      productFilter === "ALL" || t.topProducts.some((p) => p.productName === productFilter);
    return matchesState && matchesProduct;
  });

  // Calculate Aggregates
  const totalDoctors = filteredTerritories.reduce((acc, t) => acc + t.interestedDoctorsCount, 0);
  const totalRegular = filteredTerritories.reduce((acc, t) => acc + t.regularPrescribersCount, 0);
  const totalResponses = filteredTerritories.reduce((acc, t) => acc + t.totalResponses, 0);

  // Chart Data preparation
  const chartData = filteredTerritories.map((t) => ({
    name: t.state,
    Doctors: t.interestedDoctorsCount,
    "Regular Prescribers": t.regularPrescribersCount,
    Responses: t.totalResponses,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Territory Insights"
      />

      {/* Strict Privacy Governance Callout */}
      <div className="rounded-xl border border-border bg-secondary/80 p-4">
        <div className="text-xs text-foreground/90 leading-relaxed">
          <span className="font-bold text-foreground">Doctor Privacy & Aggregate Reporting: </span>
          In strict compliance with Meyveda clinical privacy standards, only aggregated regional
          statistics are presented. Individual doctor identities, personal mobile contacts, or
          granular clinic locations are suppressed to safeguard practitioner autonomy.
        </div>
      </div>

      {/* Aggregate Metric Cards without icons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Receptive Doctors"
          value={totalDoctors}
        />
        <MetricCard
          title="Regular Prescribers"
          value={totalRegular}
        />
        <MetricCard
          title="Clinical Inquiries / Interactions"
          value={totalResponses}
        />
      </div>

      {/* Filter Bar */}
      <div className="card-surface p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* State Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium">State / Region:</span>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="rounded-lg border border-border bg-white px-2.5 py-1.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All States</option>
              {territoryInsights.map((t) => (
                <option key={t.id} value={t.state}>
                  {t.state}
                </option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium">Filter by Product:</span>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="rounded-lg border border-border bg-white px-2.5 py-1.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reporting Period */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Period: <strong>{periodFilter}</strong></span>
        </div>
      </div>

      {/* Regional Interest Chart */}
      <div className="card-surface p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="type-section">Regional Doctor Distribution & Prescribing Interest</h2>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e4de" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b6b6b" }} stroke="#e8e4de" />
              <YAxis tick={{ fontSize: 12, fill: "#6b6b6b" }} stroke="#e8e4de" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "1rem",
                  borderColor: "#e8e4de",
                  boxShadow: "0 8px 24px -16px rgb(17 17 17 / 0.12)",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }} />
              <Bar dataKey="Doctors" fill="#e67230" radius={[6, 6, 0, 0]} barSize={26} />
              <Bar
                dataKey="Regular Prescribers"
                fill="#f4a261"
                radius={[6, 6, 0, 0]}
                barSize={26}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Territory Details Table */}
      <div className="card-surface overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
          <h3 className="type-name">State & District Breakdown</h3>
          <span className="text-xs text-muted-foreground">{filteredTerritories.length} Territories</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-muted-foreground uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">State & Key Districts</th>
                <th className="py-3.5 px-3">Interested Doctors</th>
                <th className="py-3.5 px-3">Regular Prescribers</th>
                <th className="py-3.5 px-3">Top Products in Region</th>
                <th className="py-3.5 px-3">Interactions</th>
                <th className="py-3.5 px-4 text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredTerritories.map((ter) => (
                <tr key={ter.id} className="hover:bg-surface/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-foreground text-sm">{ter.state}</p>
                    <p className="text-[11px] text-muted-foreground">{ter.district}</p>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-foreground text-sm">
                      {ter.interestedDoctorsCount}
                    </span>
                    <span className="text-muted-foreground text-[11px]"> MD/BAMS</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-primary">
                      {ter.regularPrescribersCount}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {" "}
                      ({Math.round((ter.regularPrescribersCount / ter.interestedDoctorsCount) * 100)}%)
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="space-y-1">
                      {ter.topProducts.map((tp, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{tp.productName}:</span>
                          <span className="text-muted-foreground text-[11px]">
                            {tp.doctorCount} doctors
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-medium text-foreground">{ter.totalResponses}</span>
                    <p className="text-[11px] text-muted-foreground">
                      {ter.totalFeedbackCount} feedback items
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        ter.trendingDirection === "up"
                          ? "bg-success-soft text-success"
                          : "bg-surface text-muted-foreground"
                      )}
                    >
                      {ter.trendingDirection === "up" ? "▲ Growing" : "● Stable"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
