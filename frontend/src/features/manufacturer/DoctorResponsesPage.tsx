import React, { useState } from "react";
import {
  MessageSquareText,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Stethoscope,
  MapPin,
  Calendar,
  X,
  FileText,
  ShieldCheck,
  Tag,
  Building,
} from "lucide-react";
import { PageHeader, StatusPill, EmptyState, focusRing } from "@/components/portal/brand";
import { useManufacturer } from "./manufacturer-context";
import type { DoctorResponse } from "./manufacturer-types";
import { cn } from "@/lib/utils";

export const DoctorResponsesPage: React.FC = () => {
  const { doctorResponses, products } = useManufacturer();

  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedResponse, setSelectedResponse] = useState<DoctorResponse | null>(null);

  // Filter responses
  const filteredResponses = doctorResponses.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.doctorDisplayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = productFilter === "ALL" || r.productId === productFilter;
    const matchesCategory = categoryFilter === "ALL" || r.category === categoryFilter;
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesProduct && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor Responses"
      />

      {/* Data Privacy & Authorization Callout */}
      <div className="rounded-xl border border-border bg-secondary/80 p-4">
        <div className="text-xs text-foreground/90 leading-relaxed">
          <span className="font-bold text-foreground">Practitioner Privacy & Access Policy: </span>
          Only responses explicitly tagged to products manufactured by your organization are shown.
          Direct patient identifiable health records (PHI) and confidential consultation transcripts
          remain protected under Grantha Clinical Data Privacy policies.
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card-surface p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by practitioner, summary, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border bg-white pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Product Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Product:</span>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Categories</option>
              <option value="Clinical Efficacy">Clinical Efficacy</option>
              <option value="Dosage Inquiry">Dosage Inquiry</option>
              <option value="Prescription Adoption">Prescription Adoption</option>
              <option value="Tolerance & Safety">Tolerance & Safety</option>
              <option value="Ingredient Clarification">Ingredient Clarification</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="New">New</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Followed Up">Followed Up</option>
            </select>
          </div>
        </div>
      </div>

      {/* Responses Table */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-muted-foreground uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Response ID & Date</th>
                <th className="py-3.5 px-3">Product Context</th>
                <th className="py-3.5 px-3">Doctor / Specialty</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3">Summary</th>
                <th className="py-3.5 px-3">Adoption Level</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredResponses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <EmptyState
                      title="No doctor responses found"
                      body="No practitioner responses match your current filter criteria."
                    />
                  </td>
                </tr>
              ) : (
                filteredResponses.map((r) => (
                  <tr key={r.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-foreground">{r.id}</span>
                      <p className="text-[11px] text-muted-foreground">{r.responseDate}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-foreground">{r.productName}</span>
                      <p className="text-[10px] font-mono text-muted-foreground">{r.productId}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-medium text-foreground">{r.doctorDisplayName}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.doctorSpecialty} • {r.district}, {r.state}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 max-w-xs">
                      <p className="line-clamp-2 text-foreground/90">{r.summary}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          r.adoptionLevel === "Regular Prescriber"
                            ? "bg-success-soft text-success"
                            : r.adoptionLevel === "Occasional Prescriber"
                            ? "bg-accent text-accent-foreground"
                            : "bg-surface text-muted-foreground"
                        )}
                      >
                        {r.adoptionLevel}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusPill
                        tone={
                          r.status === "Reviewed"
                            ? "sage"
                            : r.status === "Followed Up"
                            ? "info"
                            : "brand"
                        }
                      >
                        {r.status}
                      </StatusPill>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedResponse(r)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
                        title="View Full Clinical Response"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-lift border border-border text-xs">
            <div className="flex items-start justify-between border-b border-border pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="type-section">Doctor Response Details</h2>
                  <span className="font-mono text-xs text-muted-foreground">
                    ({selectedResponse.id})
                  </span>
                </div>
                <p className="text-muted-foreground mt-0.5">
                  Authorized practitioner feedback for {selectedResponse.productName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Doctor Details Card */}
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground">Practitioner:</span>
                    <p className="font-bold text-foreground text-sm">
                      {selectedResponse.doctorDisplayName}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Specialty:</span>
                    <p className="font-semibold text-foreground">
                      {selectedResponse.doctorSpecialty}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-medium text-foreground">
                      {selectedResponse.district}, {selectedResponse.state}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prescription Adoption:</span>
                    <p className="font-semibold text-primary">
                      {selectedResponse.adoptionLevel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Reference */}
              <div className="flex items-center justify-between border border-border p-3 rounded-xl bg-white">
                <div>
                  <span className="text-muted-foreground">Associated Product:</span>
                  <p className="font-bold text-foreground">{selectedResponse.productName}</p>
                </div>
                <span className="rounded bg-accent px-2 py-1 text-[11px] font-semibold text-accent-foreground">
                  {selectedResponse.category}
                </span>
              </div>

              {/* Summary */}
              <div>
                <span className="font-semibold text-foreground">Response Summary:</span>
                <p className="mt-1 text-foreground/90 bg-secondary/30 p-3 rounded-xl border border-border leading-relaxed font-medium">
                  "{selectedResponse.summary}"
                </p>
              </div>

              {/* Clinical Observations */}
              <div>
                <span className="font-semibold text-foreground">Detailed Clinical Observations:</span>
                <p className="mt-1 text-muted-foreground leading-relaxed bg-white border border-border p-3.5 rounded-xl">
                  {selectedResponse.clinicalObservations}
                </p>
              </div>

              {/* Manufacturer Internal Notes */}
              {selectedResponse.internalNotes && (
                <div className="rounded-xl border border-info/30 bg-info-soft/70 p-3.5">
                  <span className="font-bold text-info">Internal Manufacturer Notes:</span>
                  <p className="mt-1 text-foreground/90 text-xs">
                    {selectedResponse.internalNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="rounded-xl bg-secondary px-4 py-2 font-semibold text-foreground hover:bg-surface"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
