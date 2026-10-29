import React, { useState } from "react";
import {
  MessageSquareHeart,
  Search,
  Filter,
  Eye,
  Reply,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Send,
  Building,
} from "lucide-react";
import { PageHeader, StatusPill, EmptyState, focusRing } from "@/components/portal/brand";
import { useManufacturer } from "./manufacturer-context";
import type { DoctorFeedback, FeedbackPriority, FeedbackStatus } from "./manufacturer-types";
import { cn } from "@/lib/utils";

export const DoctorFeedbackPage: React.FC = () => {
  const { doctorFeedback, products, respondToFeedback, updateFeedbackStatus } = useManufacturer();

  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [selectedFeedback, setSelectedFeedback] = useState<DoctorFeedback | null>(null);
  const [replyText, setReplyText] = useState("");
  const [internalNotesText, setInternalNotesText] = useState("");

  const filteredFeedback = doctorFeedback.filter((fb) => {
    const matchesSearch =
      fb.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fb.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fb.doctorDisplayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fb.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = productFilter === "ALL" || fb.productId === productFilter;
    const matchesCategory = categoryFilter === "ALL" || fb.category === categoryFilter;
    const matchesStatus = statusFilter === "ALL" || fb.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || fb.priority === priorityFilter;
    return matchesSearch && matchesProduct && matchesCategory && matchesStatus && matchesPriority;
  });

  const handleSendReply = () => {
    if (!selectedFeedback || !replyText.trim()) return;
    respondToFeedback(selectedFeedback.id, replyText);
    setReplyText("");
    // Update local selectedFeedback view
    setSelectedFeedback((prev) =>
      prev
        ? {
            ...prev,
            status: "Manufacturer Responded",
            responseHistory: [
              ...prev.responseHistory,
              {
                id: `RH-${Date.now()}`,
                date: new Date().toISOString().split("T")[0] ?? "2026-03-31",
                author: "Manufacturer QC / Medical Desk",
                message: replyText,
              },
            ],
          }
        : null
    );
  };

  const handleStatusChange = (newStatus: FeedbackStatus) => {
    if (!selectedFeedback) return;
    updateFeedbackStatus(selectedFeedback.id, newStatus, internalNotesText || undefined);
    setSelectedFeedback((prev) => (prev ? { ...prev, status: newStatus } : null));
  };

  const getPriorityTone = (pr: FeedbackPriority) => {
    switch (pr) {
      case "Urgent":
        return "danger";
      case "High":
        return "warning";
      case "Medium":
        return "brand";
      default:
        return "muted";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor Feedback"
      />

      {/* Distinction notice */}
      <div className="rounded-xl border border-border bg-secondary/60 p-4">
        <div className="text-xs text-foreground/90 leading-relaxed">
          <span className="font-bold text-foreground">Dedicated Feedback Workflow: </span>
          This module tracks specific quality, organoleptic, and packaging improvement suggestions
          from clinicians. Manufacturers can maintain internal QC notes, track resolutions, and
          reply directly with manufacturing update memos.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-surface p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search feedback by doctor, product or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border bg-white pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Review">In Review</option>
              <option value="Manufacturer Responded">Manufacturer Responded</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
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

      {/* Feedback Table */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-muted-foreground uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Feedback ID</th>
                <th className="py-3.5 px-3">Product Name</th>
                <th className="py-3.5 px-3">Practitioner</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3">Summary</th>
                <th className="py-3.5 px-3">Priority</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredFeedback.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <EmptyState
                      title="No feedback records found"
                      body="No product feedback matches your filter criteria."
                    />
                  </td>
                </tr>
              ) : (
                filteredFeedback.map((fb) => (
                  <tr key={fb.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-foreground">{fb.id}</span>
                      <p className="text-[11px] text-muted-foreground">{fb.feedbackDate}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-foreground">{fb.productName}</span>
                      <p className="text-[10px] font-mono text-muted-foreground">{fb.productId}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-medium text-foreground">{fb.doctorDisplayName}</div>
                      <div className="text-[11px] text-muted-foreground">{fb.doctorLocation}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground">
                        {fb.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 max-w-xs">
                      <p className="line-clamp-2 text-foreground/90">{fb.summary}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusPill tone={getPriorityTone(fb.priority)}>
                        {fb.priority}
                      </StatusPill>
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusPill
                        tone={
                          fb.status === "Resolved"
                            ? "sage"
                            : fb.status === "Manufacturer Responded"
                            ? "info"
                            : "warning"
                        }
                      >
                        {fb.status}
                      </StatusPill>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFeedback(fb);
                          setInternalNotesText(fb.manufacturerNotes || "");
                        }}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
                        title="View / Reply Feedback"
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

      {/* FEEDBACK DETAIL & REPLY MODAL */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-lift border border-border text-xs">
            <div className="flex items-start justify-between border-b border-border pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="type-section">Product Feedback: {selectedFeedback.id}</h2>
                  <StatusPill tone={getPriorityTone(selectedFeedback.priority)}>
                    {selectedFeedback.priority}
                  </StatusPill>
                  <StatusPill
                    tone={
                      selectedFeedback.status === "Resolved"
                        ? "sage"
                        : selectedFeedback.status === "Manufacturer Responded"
                        ? "info"
                        : "warning"
                    }
                  >
                    {selectedFeedback.status}
                  </StatusPill>
                </div>
                <p className="text-muted-foreground mt-0.5">
                  Associated formulation: <strong>{selectedFeedback.productName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFeedback(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Doctor Details */}
              <div className="rounded-xl border border-border bg-secondary/30 p-3.5 flex justify-between items-center">
                <div>
                  <span className="text-muted-foreground">Submitted by:</span>
                  <p className="font-bold text-foreground text-sm">
                    {selectedFeedback.doctorDisplayName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{selectedFeedback.doctorLocation}</p>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">Category:</span>
                  <p className="font-semibold text-primary">{selectedFeedback.category}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedFeedback.feedbackDate}</p>
                </div>
              </div>

              {/* Feedback Summary & Full Details */}
              <div>
                <span className="font-semibold text-foreground">Doctor Feedback:</span>
                <p className="mt-1 font-medium text-foreground bg-secondary/50 p-3 rounded-xl border border-border">
                  "{selectedFeedback.summary}"
                </p>
                <p className="mt-2 text-muted-foreground leading-relaxed p-3.5 border border-border rounded-xl bg-white">
                  {selectedFeedback.details}
                </p>
              </div>

              {/* Thread / Response History */}
              <div>
                <span className="font-semibold text-foreground">
                  Communication History ({selectedFeedback.responseHistory.length})
                </span>
                <div className="mt-2 space-y-2">
                  {selectedFeedback.responseHistory.length === 0 ? (
                    <p className="text-muted-foreground italic text-[11px]">
                      No responses logged yet for this feedback.
                    </p>
                  ) : (
                    selectedFeedback.responseHistory.map((rh) => (
                      <div
                        key={rh.id}
                        className="rounded-xl border border-primary/20 bg-accent/30 p-3 text-xs"
                      >
                        <div className="flex justify-between font-bold text-primary mb-1">
                          <span>{rh.author}</span>
                          <span className="text-[11px] font-normal text-muted-foreground">
                            {rh.date}
                          </span>
                        </div>
                        <p className="text-foreground/90">{rh.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Reply Formulation Workflow */}
              <div className="rounded-xl border border-border p-4 bg-secondary/20 space-y-3">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Reply className="h-4 w-4 text-primary" /> Send Manufacturer Update or Response
                </span>
                <textarea
                  rows={3}
                  placeholder="Draft technical response or corrective action note for doctor..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full rounded-xl border border-border p-3 bg-white text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Update Status:</span>
                    <button
                      type="button"
                      onClick={() => handleStatusChange("In Review")}
                      className="rounded-lg border border-border bg-white px-2 py-1 text-[11px] hover:bg-surface font-medium"
                    >
                      In Review
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange("Resolved")}
                      className="rounded-lg bg-success-soft text-success px-2 py-1 text-[11px] hover:bg-success hover:text-white transition-colors font-medium"
                    >
                      Mark Resolved
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={!replyText.trim()}
                    onClick={handleSendReply}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" /> Send Reply
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setSelectedFeedback(null)}
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
