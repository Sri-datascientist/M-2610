import React, { useState } from "react";
import {
  AlertTriangle,
  Search,
  Filter,
  Eye,
  FileText,
  ShieldAlert,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { PageHeader, StatusPill, EmptyState, focusRing } from "@/components/portal/brand";
import { useManufacturer } from "./manufacturer-context";
import type { ADRReport, ADRSeverity, ADRStatus } from "./manufacturer-types";
import { cn } from "@/lib/utils";

export const ADRReportsPage: React.FC = () => {
  const { adrReports, products, submitADRFollowUp } = useManufacturer();

  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [productFilter, setProductFilter] = useState("ALL");

  const [selectedReport, setSelectedReport] = useState<ADRReport | null>(null);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [successNotice, setSuccessNotice] = useState(false);

  const filteredReports = adrReports.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reactionDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === "ALL" || r.severity === severityFilter;
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchesProduct = productFilter === "ALL" || r.productId === productFilter;
    return matchesSearch && matchesSeverity && matchesStatus && matchesProduct;
  });

  const handleSendFollowUp = () => {
    if (!selectedReport || !followUpNotes.trim()) return;
    submitADRFollowUp(selectedReport.id, followUpNotes);
    setSelectedReport((prev) =>
      prev
        ? {
            ...prev,
            manufacturerFollowUpNotes: followUpNotes,
            followUpStatus: "Information Submitted",
          }
        : null
    );
    setFollowUpNotes("");
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 4000);
  };

  const getSeverityTone = (sev: ADRSeverity) => {
    switch (sev) {
      case "Severe":
      case "Life-Threatening":
        return "danger";
      case "Moderate":
        return "warning";
      default:
        return "muted";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="ADR Reports (Adverse Drug Reactions)"
      />

      {/* Authoritative Governance & Privacy Notice */}
      <div className="rounded-xl border border-destructive/20 bg-danger-soft/60 p-4">
        <div className="text-xs text-foreground/90 leading-relaxed">
          <span className="font-bold text-destructive">
            Pharmacovigilance & Causality Governance:{" "}
          </span>
          Reports logged here represent reported incidents undergoing expert Ayush Medical Board
          evaluation. Causality between the formulation and reported symptoms is not established
          unless confirmed by the authoritative assessment. Reporter identities and direct patient
          identifiers are suppressed. Manufacturers must provide batch analysis verification upon
          request.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-surface p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by ADR ID, product, batch, or symptom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border bg-white pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Severity filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Severities</option>
              <option value="Mild">Mild</option>
              <option value="Moderate">Moderate</option>
              <option value="Severe">Severe</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Under Medical Evaluation">Under Medical Evaluation</option>
              <option value="Manufacturer Review Requested">Manufacturer Review Requested</option>
              <option value="Closed / Assessed">Closed / Assessed</option>
            </select>
          </div>

          {/* Product filter */}
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
        </div>
      </div>

      {/* ADR Reports Table */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-muted-foreground uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">ADR ID & Date</th>
                <th className="py-3.5 px-3">Product Name</th>
                <th className="py-3.5 px-3">Batch Number</th>
                <th className="py-3.5 px-3">Severity</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Region</th>
                <th className="py-3.5 px-3">Manufacturer Follow-up</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <EmptyState
                      title="No ADR reports found"
                      body="No adverse drug reaction records match your active filter parameters."
                    />
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-foreground">{r.id}</span>
                      <p className="text-[11px] text-muted-foreground">{r.reportDate}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-foreground">{r.productName}</span>
                      <p className="text-[10px] font-mono text-muted-foreground">{r.productId}</p>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-foreground font-medium">
                      {r.batchNumber}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusPill tone={getSeverityTone(r.severity)}>{r.severity}</StatusPill>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-muted-foreground truncate max-w-[120px]">
                      {r.reportingRegion}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          r.followUpStatus === "Pending Manufacturer Response"
                            ? "bg-danger-soft text-destructive font-bold"
                            : r.followUpStatus === "Information Submitted"
                            ? "bg-info-soft text-info"
                            : "bg-success-soft text-success"
                        )}
                      >
                        {r.followUpStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReport(r);
                          setFollowUpNotes(r.manufacturerFollowUpNotes || "");
                        }}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
                        title="View ADR Details & Submit Follow-Up"
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

      {/* ADR DETAIL & FOLLOW-UP MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-lift border border-border text-xs">
            <div className="flex items-start justify-between border-b border-border pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="type-section">ADR Report Details: {selectedReport.id}</h2>
                  <StatusPill tone={getSeverityTone(selectedReport.severity)}>
                    {selectedReport.severity}
                  </StatusPill>
                </div>
                <p className="text-muted-foreground mt-0.5">
                  Associated formulation: <strong>{selectedReport.productName}</strong> (Batch:{" "}
                  {selectedReport.batchNumber})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {successNotice && (
              <div className="mb-4 rounded-xl bg-success-soft border border-success/30 p-3 text-success font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Manufacturer batch investigation notes successfully
                submitted to the Central Pharmacovigilance Board.
              </div>
            )}

            <div className="space-y-4">
              {/* Product & Batch Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-secondary/40 p-3.5 rounded-xl">
                <div>
                  <span className="text-muted-foreground">Product ID:</span>
                  <p className="font-mono font-semibold text-foreground">{selectedReport.productId}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Batch Number:</span>
                  <p className="font-mono font-semibold text-foreground">{selectedReport.batchNumber}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date Reported:</span>
                  <p className="font-semibold text-foreground">{selectedReport.reportDate}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Region:</span>
                  <p className="font-medium text-foreground">{selectedReport.reportingRegion}</p>
                </div>
              </div>

              {/* Reported Symptoms */}
              <div>
                <span className="font-semibold text-foreground">Reported Clinical Symptoms:</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {selectedReport.reportedSymptoms.map((sym, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-border bg-white px-2 py-1 text-xs text-foreground font-medium"
                    >
                      {sym}
                    </span>
                  ))}
                </div>
              </div>

              {/* Reaction Description */}
              <div>
                <span className="font-semibold text-foreground">Incident Description:</span>
                <p className="mt-1 text-muted-foreground leading-relaxed p-3.5 border border-border rounded-xl bg-white">
                  {selectedReport.reactionDescription}
                </p>
              </div>

              {/* Anonymized Patient & Concomitant Meds */}
              <div className="grid grid-cols-2 gap-3 bg-secondary/30 p-3 rounded-xl border border-border">
                <div>
                  <span className="text-muted-foreground">Anonymized Patient Cohort:</span>
                  <p className="font-medium text-foreground">
                    {selectedReport.patientAgeGroup} • {selectedReport.patientGender}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Concurrent Medications:</span>
                  <p className="font-medium text-foreground">
                    {selectedReport.concurrentMedications || "None"}
                  </p>
                </div>
              </div>

              {/* Medical Assessment Note */}
              {selectedReport.authorizedAssessmentInfo && (
                <div className="rounded-xl border border-border bg-secondary/60 p-3.5">
                  <span className="font-bold text-foreground">Official Medical Assessment:</span>
                  <p className="mt-1 text-muted-foreground leading-relaxed">
                    {selectedReport.authorizedAssessmentInfo}
                  </p>
                  {selectedReport.medicalBoardNotes && (
                    <p className="mt-2 text-[11px] text-primary font-semibold">
                      Board Guidance: {selectedReport.medicalBoardNotes}
                    </p>
                  )}
                </div>
              )}

              {/* Manufacturer Follow-Up Section */}
              <div className="rounded-xl border border-primary/30 bg-accent/30 p-4 space-y-3">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" /> Manufacturer Quality Assurance
                  Follow-Up
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Provide QC retain sample inspection results, certificate of analysis confirmations,
                  or microbiological lab assay reports for Batch #{selectedReport.batchNumber}.
                </p>
                <textarea
                  rows={3}
                  placeholder="Enter manufacturer QA investigation notes, retained sample assay values, and batch disposition..."
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  className="w-full rounded-xl border border-border p-3 bg-white text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={!followUpNotes.trim()}
                    onClick={handleSendFollowUp}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" /> Submit Follow-up to Medical Board
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
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
