import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Phone,
  RotateCw,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  Eye,
  X,
  Sparkles,
  AlertCircle,
  Calendar,
  Tag,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/services/apiClient";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { StatusPill, focusRing } from "@/components/portal/brand";
import { Button } from "@/components/ui/button";

export interface LiveContactMessage {
  id: string;
  reference_code: string;
  full_name: string;
  email: string;
  phone: string;
  category: string;
  subject: string;
  message: string;
  status: "New" | "In Progress" | "Contacted" | "Resolved" | "Archived";
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LiveContactStats {
  total: number;
  new_count: number;
  in_progress_count: number;
  contacted_count: number;
  resolved_count: number;
}

const CATEGORIES = [
  "All",
  "Doctor Onboarding & Verification",
  "Cluster Franchise Network",
  "AYUSH Pharma Collaboration",
  "Research & Journal Publications",
  "Technical & Platform Support",
  "General Inquiry",
] as const;

const STATUSES = ["All", "New", "In Progress", "Contacted", "Resolved", "Archived"] as const;

export function LiveContactInquiriesSection() {
  const [messages, setMessages] = useState<LiveContactMessage[]>([]);
  const [stats, setStats] = useState<LiveContactStats>({
    total: 0,
    new_count: 0,
    in_progress_count: 0,
    contacted_count: 0,
    resolved_count: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const [selectedMessage, setSelectedMessage] = useState<LiveContactMessage | null>(null);
  const [modalStatus, setModalStatus] = useState<string>("New");
  const [modalNotes, setModalNotes] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const loadMessages = useCallback(async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "All") params.set("status", statusFilter);
      if (categoryFilter !== "All") params.set("category", categoryFilter);

      const res = await apiClient.get<{
        items: LiveContactMessage[];
        total: number;
        stats: LiveContactStats;
      }>(`/contact/admin/messages?${params.toString()}`);

      setMessages(res.items || []);
      if (res.stats) {
        setStats(res.stats);
      }
      if (showToast) {
        toast.success("Contact inquiries refreshed from live database.");
      }
    } catch (err: any) {
      console.error("Error fetching contact messages:", err);
      toast.error(err?.message || "Failed to load contact messages.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleOpenDetails = (msg: LiveContactMessage) => {
    setSelectedMessage(msg);
    setModalStatus(msg.status);
    setModalNotes(msg.admin_notes || "");
  };

  const handleCloseDetails = () => {
    setSelectedMessage(null);
  };

  const handleSaveModalStatus = async () => {
    if (!selectedMessage) return;
    setIsUpdating(true);
    try {
      const res = await apiClient.patch<LiveContactMessage>(
        `/contact/admin/messages/${selectedMessage.id}/status`,
        {
          status: modalStatus,
          admin_notes: modalNotes,
        }
      );

      setMessages((prev) => prev.map((m) => (m.id === selectedMessage.id ? res : m)));
      setSelectedMessage(res);
      toast.success(`Inquiry marked as ${modalStatus}.`);
      loadMessages();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update inquiry status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopy = async (code: string) => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedCode(true);
      toast.success("Reference code copied!");
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "Recently";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const getStatusTone = (st: string): "brand" | "sage" | "muted" | "danger" | "warning" | "info" => {
    switch (st) {
      case "New":
        return "brand";
      case "In Progress":
        return "info";
      case "Contacted":
        return "warning";
      case "Resolved":
        return "sage";
      default:
        return "muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. KPI Stats Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <button
          type="button"
          onClick={() => setStatusFilter("All")}
          className={cn(
            "card-surface p-4 text-left transition-all",
            statusFilter === "All" && "border-primary ring-2 ring-primary/20",
            focusRing
          )}
        >
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Inquiries
          </span>
          <span className="mt-1 block text-2xl font-extrabold text-foreground tracking-tight">
            {stats.total}
          </span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">
            All submitted messages
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("New")}
          className={cn(
            "card-surface p-4 text-left transition-all",
            statusFilter === "New" && "border-[#E67230] ring-2 ring-[#E67230]/20",
            focusRing
          )}
        >
          <span className="text-xs font-semibold text-[#E67230] uppercase tracking-wider flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#E67230] animate-pulse" />
            New / Unread
          </span>
          <span className="mt-1 block text-2xl font-extrabold text-[#E67230] tracking-tight">
            {stats.new_count}
          </span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">
            Requires initial review
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("In Progress")}
          className={cn(
            "card-surface p-4 text-left transition-all",
            statusFilter === "In Progress" && "border-blue-500 ring-2 ring-blue-500/20",
            focusRing
          )}
        >
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            In Progress
          </span>
          <span className="mt-1 block text-2xl font-extrabold text-foreground tracking-tight">
            {stats.in_progress_count}
          </span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">
            Under active coordinator review
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Contacted")}
          className={cn(
            "card-surface p-4 text-left transition-all",
            statusFilter === "Contacted" && "border-indigo-500 ring-2 ring-indigo-500/20",
            focusRing
          )}
        >
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Contacted
          </span>
          <span className="mt-1 block text-2xl font-extrabold text-foreground tracking-tight">
            {stats.contacted_count}
          </span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">
            Outreach initiated via call/email
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Resolved")}
          className={cn(
            "card-surface p-4 text-left transition-all",
            statusFilter === "Resolved" && "border-emerald-500 ring-2 ring-emerald-500/20",
            focusRing
          )}
        >
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Resolved
          </span>
          <span className="mt-1 block text-2xl font-extrabold text-foreground tracking-tight">
            {stats.resolved_count}
          </span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">
            Fulfilled and concluded
          </span>
        </button>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="card-surface p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone, subject..."
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadMessages(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5"
            >
              <RotateCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Status Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
          <span className="text-xs font-semibold text-muted-foreground mr-1">Status:</span>
          {STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                statusFilter === st
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Messages Data Table */}
      <div className="card-surface overflow-hidden">
        <div className="border-b border-border bg-surface px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              Contact &amp; Practitioner Messages ({messages.length})
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Directly connected to PostgreSQL DB
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="mx-auto size-7 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading inquiries from database...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface text-muted-foreground">
              <Mail className="size-6" />
            </div>
            <p className="font-semibold text-foreground">No contact inquiries found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search || statusFilter !== "All" || categoryFilter !== "All"
                ? "Try adjusting your search query or status filter."
                : "New visitor and practitioner inquiries submitted on /contact will appear here automatically."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Ref Code &amp; Date</th>
                  <th className="py-3 px-4">Submitter Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Subject &amp; Message Preview</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {messages.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-surface/50 transition-colors group cursor-pointer"
                    onClick={() => handleOpenDetails(item)}
                  >
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {item.reference_code}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="size-3" />
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{item.full_name}</span>
                        <a
                          href={`mailto:${item.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Mail className="size-3" />
                          {item.email}
                        </a>
                        <a
                          href={`tel:${item.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="size-3" />
                          {item.phone}
                        </a>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md bg-surface px-2 py-1 text-xs font-medium text-foreground border border-border/80">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-top max-w-md">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground line-clamp-1">
                          {item.subject}
                        </span>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {item.message}
                        </p>
                        {item.admin_notes && (
                          <div className="mt-1 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900 inline-block max-w-fit">
                            <strong>Note:</strong> {item.admin_notes}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <StatusPill tone={getStatusTone(item.status)}>{item.status}</StatusPill>
                    </td>

                    <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetails(item);
                        }}
                        className="h-8 gap-1 text-xs font-semibold"
                      >
                        <Eye className="size-3.5" />
                        <span>See Details</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. "SEE DETAILS" MODAL DIALOG */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-extrabold text-foreground">
                    {selectedMessage.reference_code}
                  </span>
                  <StatusPill tone={getStatusTone(selectedMessage.status)}>
                    {selectedMessage.status}
                  </StatusPill>
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  Received on {formatDate(selectedMessage.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseDetails}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Submitter Info Grid */}
            <div className="rounded-xl border border-border bg-surface p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                  Full Legal Name
                </span>
                <span className="font-bold text-foreground text-base">
                  {selectedMessage.full_name}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                  Category
                </span>
                <span className="font-semibold text-foreground">
                  {selectedMessage.category}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                  Email Address
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)} [${selectedMessage.reference_code}]`}
                    className="font-medium text-primary hover:underline break-all"
                  >
                    {selectedMessage.email}
                  </a>
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)} [${selectedMessage.reference_code}]`}
                    title="Send Email"
                    className="inline-flex size-6 items-center justify-center rounded bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                  Phone / WhatsApp
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedMessage.phone}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {selectedMessage.phone}
                  </a>
                  <a
                    href={`https://wa.me/${selectedMessage.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Chat on WhatsApp"
                    className="inline-flex items-center gap-1 rounded bg-[#25D366]/10 px-1.5 py-0.5 text-[11px] font-bold text-[#25D366] hover:bg-[#25D366]/20"
                  >
                    <MessageCircle className="size-3" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Subject & Full Message Body */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Inquiry Subject &amp; Message
              </span>
              <div className="rounded-xl border border-border bg-background p-4 space-y-2.5">
                <h3 className="font-bold text-foreground text-base">
                  {selectedMessage.subject}
                </h3>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.message}
                </p>
              </div>
            </div>

            {/* Status & Admin Notes Form */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Administrative Governance &amp; Follow-Up
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Update Workflow Status
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {STATUSES.filter((s) => s !== "All").map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedMessage.reference_code)}
                    className="inline-flex h-9.5 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-surface transition-colors cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="size-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>Copy Ref ID</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Internal Coordinator Notes
                </label>
                <textarea
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Record outcome of phone call, verification documents received, next action date..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDetails}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleSaveModalStatus}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-1.5" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Notes &amp; Update Status</span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
