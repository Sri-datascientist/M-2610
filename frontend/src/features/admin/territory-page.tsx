import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/portal/brand";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/features/admin/catalog-state";
import {
  fetchTerritoryFromApi,
  lookupPincodeTerritory,
  type TerritoryNode,
  type TerritoryPincodeLookupResponse,
} from "@/features/admin/territory-data";
import { SearchField, SelectField, SummaryRow } from "@/features/admin/fields";
import {
  MapPin,
  Stethoscope,
  Building2,
  ChevronRight,
  Hash,
  Layers,
  Search,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Landmark,
  Phone,
  Mail,
  Eye,
  Trash2,
  X,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";
import { ReviewBadge } from "@/features/admin/review-ui";
import { Link } from "@tanstack/react-router";
import { doctorSlugMap } from "@/features/admin/doctor-slug";
import { toast } from "sonner";
import { apiClient } from "@/services/apiClient";

const QUICK_PINCODES = [
  { pin: "682001", label: "Kochi, Kerala" },
  { pin: "411004", label: "Pune, Maharashtra" },
  { pin: "110001", label: "New Delhi, Delhi" },
  { pin: "560001", label: "Bengaluru, Karnataka" },
  { pin: "600001", label: "Chennai, Tamil Nadu" },
  { pin: "221005", label: "Varanasi, UP" },
];

interface FranchiseEnquiryItem {
  id: string;
  full_name: string;
  mobile: string;
  email?: string | null;
  territory_pincode: string;
  interested_tier: string;
  message?: string | null;
  status: string;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export function TerritoryPage() {
  const { doctors, manufacturers } = useCatalog();

  // Tab State: "hierarchy" | "enquiries"
  const [activeTab, setActiveTab] = useState<"hierarchy" | "enquiries">(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("tab") === "enquiries") return "enquiries";
    }
    return "hierarchy";
  });

  const [territories, setTerritories] = useState<TerritoryNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<"all" | "doctors" | "manufacturers">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGovernance, setExpandedGovernance] = useState<Record<string, boolean>>({});

  // Franchise Enquiries State (Live Database-backed)
  const [enquiries, setEnquiries] = useState<FranchiseEnquiryItem[]>([]);
  const [enquiryStats, setEnquiryStats] = useState({
    total: 0,
    new_count: 0,
    under_review: 0,
    contacted: 0,
    approved: 0,
  });
  const [isLoadingEnquiries, setIsLoadingEnquiries] = useState(false);
  const [enquirySearch, setEnquirySearch] = useState("");
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState("All");
  const [enquiryTierFilter, setEnquiryTierFilter] = useState("All");
  const [selectedEnquiry, setSelectedEnquiry] = useState<FranchiseEnquiryItem | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [modalAdminNotes, setModalAdminNotes] = useState("");

  // Live PIN Code & AYUSH Board Resolver State
  const [pincodeInput, setPincodeInput] = useState("");
  const [isResolvingPin, setIsResolvingPin] = useState(false);
  const [pinResult, setPinResult] = useState<TerritoryPincodeLookupResponse | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  const doctorSlugs = useMemo(() => doctorSlugMap(doctors), [doctors]);

  // Load Territory Mapping from API on mount
  const loadTerritoryData = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const data = await fetchTerritoryFromApi();
      setTerritories(data.territories);
      if (showToast) toast.success("Territory mapping refreshed from API.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to load territory mapping from API.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadEnquiries = async (showToast = false) => {
    setIsLoadingEnquiries(true);
    try {
      const qParams = new URLSearchParams();
      if (enquirySearch.trim()) qParams.set("q", enquirySearch.trim());
      if (enquiryStatusFilter !== "All") qParams.set("status", enquiryStatusFilter);
      if (enquiryTierFilter !== "All") qParams.set("tier", enquiryTierFilter);

      const res = await apiClient.get<any>(`/franchise/admin/enquiries?${qParams.toString()}`);
      if (res) {
        setEnquiries(res.items || []);
        if (res.stats) setEnquiryStats(res.stats);
      }
      if (showToast) toast.success("Franchise enquiries refreshed from database.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to load franchise enquiries.");
    } finally {
      setIsLoadingEnquiries(false);
    }
  };

  useEffect(() => {
    loadTerritoryData(false);
    loadEnquiries(false);
  }, []);

  useEffect(() => {
    loadEnquiries(false);
  }, [enquiryStatusFilter, enquiryTierFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string, notes?: string) => {
    setUpdatingId(id);
    try {
      const res = await apiClient.patch<any>(`/franchise/admin/enquiries/${id}/status`, {
        status: newStatus,
        admin_notes: notes,
      });
      setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status: res.status, admin_notes: res.admin_notes } : e)));
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setSelectedEnquiry({ ...selectedEnquiry, status: res.status, admin_notes: res.admin_notes });
      }
      toast.success(`Enquiry status updated to ${newStatus}.`);
      loadEnquiries(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteEnquiry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this franchise enquiry record?")) return;
    try {
      await apiClient.delete<any>(`/franchise/admin/enquiries/${id}`);
      setEnquiries((prev) => prev.filter((e) => e.id !== id));
      if (selectedEnquiry?.id === id) setSelectedEnquiry(null);
      toast.success("Enquiry record deleted.");
      loadEnquiries(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete enquiry.");
    }
  };

  const stateNames = useMemo(
    () => territories.map((t) => t.state),
    [territories],
  );

  const toggleGovernance = (state: string) => {
    setExpandedGovernance((prev) => ({
      ...prev,
      [state]: !prev[state],
    }));
  };

  // Execute PIN Code Auto-Lookup against API
  const handleResolvePincode = async (codeToLookup?: string) => {
    const target = (codeToLookup || pincodeInput).trim();
    if (!/^[1-9][0-9]{5}$/.test(target)) {
      setPinError("Please enter a valid 6-digit Indian PIN code (digits 1-9 followed by 5 digits).");
      return;
    }

    setIsResolvingPin(true);
    setPinError(null);
    try {
      const res = await lookupPincodeTerritory(target);
      setPinResult(res);
      toast.success(`PIN ${target} successfully resolved to ${res.district}, ${res.state}.`);
    } catch (err: any) {
      setPinResult(null);
      let errMsg = err?.message || "PIN code incorrect.";
      if (typeof errMsg === "string" && (errMsg.includes("national postal directory") || errMsg.includes("postal directory"))) {
        errMsg = "PIN code incorrect.";
      }
      setPinError(errMsg);
      toast.error("PIN code lookup failed.");
    } finally {
      setIsResolvingPin(false);
    }
  };

  // Filtered Territory Nodes
  const filteredTerritories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return territories
      .filter((t) => (selectedState === "all" ? true : t.state === selectedState))
      .map((t) => {
        const matchStateGovernance =
          t.state.toLowerCase().includes(q) ||
          t.ayushGovernance.board_name.toLowerCase().includes(q) ||
          t.ayushGovernance.statutory_act.toLowerCase().includes(q);

        const filteredDistricts = t.districts.filter((d) => {
          if (!q) return true;
          if (matchStateGovernance) return true;
          const matchDist = d.name.toLowerCase().includes(q);
          const matchPins = d.pincodes.some((pin) => pin.includes(q));
          const matchDocs = d.doctors.some((doc) => doc.name.toLowerCase().includes(q));
          const matchMfrs = d.manufacturers.some((mfr) => mfr.company.toLowerCase().includes(q));
          return matchDist || matchPins || matchDocs || matchMfrs;
        });

        return {
          ...t,
          districts: filteredDistricts,
          totalDoctors: filteredDistricts.reduce((sum, d) => sum + d.doctorCount, 0),
          totalManufacturers: filteredDistricts.reduce((sum, d) => sum + d.manufacturerCount, 0),
        };
      })
      .filter((t) => t.districts.length > 0);
  }, [territories, selectedState, searchQuery]);

  const totalStates = territories.length;
  const totalDistricts = territories.reduce((acc, t) => acc + t.districts.length, 0);
  const totalCoveredDoctors = territories.reduce((acc, t) => acc + t.totalDoctors, 0);
  const totalCoveredMfrs = territories.reduce((acc, t) => acc + t.totalManufacturers, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title={activeTab === "enquiries" ? "Cluster Franchise Enquiries" : "Territory mapping"}
          subtitle={
            activeTab === "enquiries"
              ? "Live database table of partner expressions of interest and territory exclusivity applications."
              : "Regional distribution and statutory AYUSH medical authority mapping for practitioners and licensed manufacturers."
          }
        />
        <div className="flex items-center gap-2">
          {activeTab === "enquiries" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadEnquiries(true)}
              disabled={isLoadingEnquiries}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingEnquiries ? "animate-spin" : ""}`} />
              Refresh Enquiries
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadTerritoryData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Sync from API
            </Button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="border-b border-border bg-card/40 pt-1">
        <div className="flex items-center gap-2 overflow-x-auto text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("hierarchy")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTab === "hierarchy"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapPin className="h-4 w-4" />
            Territory &amp; Statutory AYUSH Councils
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("enquiries")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTab === "enquiries"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Franchise Enquiries (Expression of Interest)
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              {enquiryStats.total || enquiries.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === "hierarchy" && (
      <>
      {/* PIN Code Auto-Lookup & Statutory AYUSH Governance Resolver Card */}
      <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-surface to-background p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
              <Landmark className="h-3.5 w-3.5" />
              API Pincode Auto-Lookup & AYUSH Governance Resolver
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Regional Jurisdiction & Statutory Medical Council Resolver
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Enter any 6-digit Indian PIN code to query the national postal registry API and automatically map the location to its statutory State AYUSH Board, governing legislative act, and regulatory portal.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              maxLength={6}
              value={pincodeInput}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPincodeInput(val);
                if (val.length === 6) {
                  handleResolvePincode(val);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleResolvePincode();
              }}
              placeholder="Enter 6-digit Indian PIN code (e.g. 682001, 110001, 411004)"
              className="w-full rounded-xl border border-border bg-white px-9 py-2.5 text-sm font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>
          <Button
            onClick={() => handleResolvePincode()}
            disabled={isResolvingPin || pincodeInput.trim().length !== 6}
            className="flex items-center gap-2"
          >
            {isResolvingPin ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Resolve PIN Code
          </Button>
        </div>

        {/* Quick Sample Buttons */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium mr-1">Quick lookups:</span>
          {QUICK_PINCODES.map((item) => (
            <button
              key={item.pin}
              type="button"
              onClick={() => {
                setPincodeInput(item.pin);
                handleResolvePincode(item.pin);
              }}
              className="rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-mono font-medium hover:border-primary hover:text-primary transition-colors cursor-pointer"
            >
              {item.pin} <span className="text-[11px] text-muted-foreground">({item.label})</span>
            </button>
          ))}
        </div>

        {/* PIN Lookup Error */}
        {pinError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#E67230]/35 bg-[#FFF3EB] p-3 text-xs text-[#111111] shadow-2xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#E67230]" />
            <span className="font-semibold text-[#111111]">{pinError}</span>
          </div>
        )}

        {/* Resolved Result Panel */}
        {pinResult && (
          <div className="mt-5 rounded-xl border border-border bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    PIN {pinResult.pincode}: {pinResult.district}, {pinResult.state}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {pinResult.region && `Region: ${pinResult.region} • `}
                    {pinResult.division && `Division: ${pinResult.division} • `}
                    Post offices: {pinResult.post_offices.slice(0, 4).join(", ") || "General delivery"}
                    {pinResult.post_offices.length > 4 && ` (+${pinResult.post_offices.length - 4} more)`}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                {pinResult.ayush_governance.jurisdiction} Authority
              </span>
            </div>

            {/* Statutory Board Details */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg bg-surface/50 p-3.5 border border-border/70">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Statutory Medical Board / Council
                </span>
                <p className="font-semibold text-sm text-foreground">
                  {pinResult.ayush_governance.board_name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">Type: </span>
                  {pinResult.ayush_governance.board_type}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">Controlling Authority: </span>
                  {pinResult.ayush_governance.controlling_authority}
                </p>
              </div>

              <div className="rounded-lg bg-surface/50 p-3.5 border border-border/70 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Statutory Legislation & Official Portal
                  </span>
                  <p className="text-xs font-medium text-foreground">
                    <span className="font-bold text-primary">Act: </span>
                    {pinResult.ayush_governance.statutory_act}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {pinResult.ayush_governance.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between">
                  <a
                    href={pinResult.ayush_governance.official_portal}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    Visit Official Portal
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {pinResult.matched_doctors.length} doctors • {pinResult.matched_manufacturers.length} mfrs
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Summary KPI Row */}
      <SummaryRow
        items={[
          {
            label: "Covered States",
            value: totalStates,
            pressed: selectedState === "all",
            onClick: () => setSelectedState("all"),
          },
          {
            label: "Mapped Districts",
            value: totalDistricts,
          },
          {
            label: "Registered Doctors",
            value: totalCoveredDoctors,
            pressed: selectedType === "doctors",
            onClick: () => setSelectedType((prev) => (prev === "doctors" ? "all" : "doctors")),
          },
          {
            label: "Licensed Manufacturers",
            value: totalCoveredMfrs,
            pressed: selectedType === "manufacturers",
            onClick: () => setSelectedType((prev) => (prev === "manufacturers" ? "all" : "manufacturers")),
          },
        ]}
      />

      {/* Filtering & Territory List */}
      <section className="card-surface">
        <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <SearchField
              label="Search Territory"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by state, district, PIN code, AYUSH board, doctor, or manufacturer..."
            />
          </div>
          <SelectField
            label="Filter by State"
            value={selectedState}
            onChange={setSelectedState}
            options={[
              { value: "all", label: "All States & Territories" },
              ...stateNames.map((st) => ({ value: st, label: st })),
            ]}
          />
        </div>

        {/* Territory Directory Cards with AYUSH Governance */}
        <div className="p-5 space-y-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-primary opacity-60" />
              <p>Loading territory records and AYUSH statutory mappings...</p>
            </div>
          ) : filteredTerritories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No regional records found matching your filters.</p>
            </div>
          ) : (
            filteredTerritories.map((territory) => {
              const isGovExpanded = !!expandedGovernance[territory.state];
              return (
                <div
                  key={territory.state}
                  className="rounded-xl border border-border bg-card overflow-hidden shadow-xs transition-shadow hover:shadow-soft"
                >
                  {/* State Header with Governance Badge */}
                  <div className="bg-secondary/40 px-5 py-3.5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="font-bold text-base tracking-tight text-foreground">
                        {territory.state}
                      </h3>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({territory.districts.length} {territory.districts.length === 1 ? "District" : "Districts"})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => toggleGovernance(territory.state)}
                        className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-primary hover:bg-primary/20 transition-colors font-semibold"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>AYUSH Authority</span>
                        {isGovExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 ml-0.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                        )}
                      </button>

                      <span className="inline-flex items-center gap-1 text-slate-700 bg-white/90 px-2 py-1 rounded-md border border-border">
                        <Stethoscope className="h-3.5 w-3.5 text-primary" />
                        {territory.totalDoctors} Doctors
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-700 bg-white/90 px-2 py-1 rounded-md border border-border">
                        <Building2 className="h-3.5 w-3.5 text-amber-600" />
                        {territory.totalManufacturers} Manufacturers
                      </span>
                    </div>
                  </div>

                  {/* Expandable Statutory AYUSH Governance Banner */}
                  {isGovExpanded && (
                    <div className="bg-primary/[0.03] border-b border-primary/15 p-4 sm:p-5 text-xs">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                            Statutory Governance Authority ({territory.ayushGovernance.jurisdiction} Jurisdiction)
                          </span>
                          <h4 className="text-sm font-bold text-foreground">
                            {territory.ayushGovernance.board_name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">Statutory Act: </span>
                            {territory.ayushGovernance.statutory_act}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">Controlling Body: </span>
                            {territory.ayushGovernance.controlling_authority}
                          </p>
                        </div>
                        <div className="shrink-0 pt-1">
                          <a
                            href={territory.ayushGovernance.official_portal}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-white px-3 py-1.5 font-bold text-primary hover:bg-primary/5 transition-colors shadow-2xs"
                          >
                            <span>Official State Portal</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* District Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                    {territory.districts.map((district) => (
                      <div
                        key={district.name}
                        className="rounded-lg border border-border/70 p-4 hover:border-primary/40 transition-colors bg-surface/30 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-sm text-foreground">{district.name}</h4>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Hash className="h-3 w-3" />
                                <span>PIN Codes: {district.pincodes.join(", ") || "General"}</span>
                              </div>
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-accent text-accent-foreground">
                              {district.doctorCount + district.manufacturerCount} entities
                            </span>
                          </div>

                          {/* Doctors List Preview */}
                          {selectedType !== "manufacturers" && district.doctors.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                                Doctors ({district.doctorCount})
                              </span>
                              <ul className="space-y-1">
                                {district.doctors.map((doc) => (
                                  <li key={doc.id} className="flex items-center justify-between text-xs py-0.5">
                                    <Link
                                      to="/admin/doctors/$doctorSlug"
                                      params={{ doctorSlug: doctorSlugs.get(doc.id) ?? doc.id }}
                                      className="font-medium text-primary hover:underline line-clamp-1"
                                    >
                                      {doc.name}
                                    </Link>
                                    <ReviewBadge status={doc.status as any} />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Manufacturers List Preview */}
                          {selectedType !== "doctors" && district.manufacturers.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                                Manufacturers ({district.manufacturerCount})
                              </span>
                              <ul className="space-y-1">
                                {district.manufacturers.map((mfr) => (
                                  <li key={mfr.id} className="flex items-center justify-between text-xs py-0.5">
                                    <span className="font-medium text-foreground line-clamp-1">{mfr.company}</span>
                                    <ReviewBadge status={mfr.status as any} />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
      </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Tab 2: Franchise Enquiries Management Table                        */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "enquiries" && (
        <div className="space-y-6">
          {/* Key Metric Highlights Strip */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-border bg-card p-4 space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Total Enquiries
              </span>
              <div className="text-2xl font-mono font-extrabold text-foreground">
                {enquiryStats.total}
              </div>
              <p className="text-[11px] text-muted-foreground">Applications on database</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                New Submissions
              </span>
              <div className="text-2xl font-mono font-extrabold text-[#E67230]">
                {enquiryStats.new_count}
              </div>
              <p className="text-[11px] text-muted-foreground">Awaiting territory review</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Under Review
              </span>
              <div className="text-2xl font-mono font-extrabold text-amber-600">
                {enquiryStats.under_review}
              </div>
              <p className="text-[11px] text-muted-foreground">PIN feasibility evaluation</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Contacted
              </span>
              <div className="text-2xl font-mono font-extrabold text-blue-600">
                {enquiryStats.contacted}
              </div>
              <p className="text-[11px] text-muted-foreground">Terms / Escrow discussions</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Approved
              </span>
              <div className="text-2xl font-mono font-extrabold text-emerald-600">
                {enquiryStats.approved}
              </div>
              <p className="text-[11px] text-muted-foreground">District hubs allocated</p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 max-w-md focus-within:border-primary">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={enquirySearch}
                onChange={(e) => setEnquirySearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") loadEnquiries(false);
                }}
                placeholder="Search applicant, mobile, email, or PIN..."
                className="w-full bg-transparent text-xs sm:text-sm outline-none placeholder:text-muted-foreground/70"
              />
              {enquirySearch && (
                <button
                  type="button"
                  onClick={() => {
                    setEnquirySearch("");
                    loadEnquiries(false);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={enquiryStatusFilter}
                onChange={(e) => setEnquiryStatusFilter(e.target.value)}
                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium focus:border-primary focus:outline-none"
              >
                <option value="All">All Statuses ({enquiryStats.total})</option>
                <option value="New">New ({enquiryStats.new_count})</option>
                <option value="Under Review">Under Review ({enquiryStats.under_review})</option>
                <option value="Contacted">Contacted ({enquiryStats.contacted})</option>
                <option value="Approved">Approved ({enquiryStats.approved})</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={enquiryTierFilter}
                onChange={(e) => setEnquiryTierFilter(e.target.value)}
                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium focus:border-primary focus:outline-none"
              >
                <option value="All">All Franchise Tiers</option>
                <option value="State Cluster Head">State Cluster Head (₹10L)</option>
                <option value="Zone Cluster Franchisee">Zone Cluster Franchisee (₹5L)</option>
                <option value="Territory Cluster Franchisee">Territory Cluster Franchisee (₹2L)</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => loadEnquiries(false)}
                className="text-xs h-8"
              >
                Search
              </Button>
            </div>
          </div>

          {/* Franchise Enquiries Table */}
          {enquiries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card">
              <Building2 className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
              <h4 className="font-bold text-foreground">No Franchise Enquiries Found</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {enquirySearch || enquiryStatusFilter !== "All" || enquiryTierFilter !== "All"
                  ? "No expressions of interest match the selected search and filter parameters."
                  : "No franchise enquiries have been submitted yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                    <th className="px-4 py-3">Applicant &amp; Reference</th>
                    <th className="px-4 py-3">Contact Details</th>
                    <th className="px-4 py-3">Territory PIN</th>
                    <th className="px-4 py-3">Franchise Tier</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date Submitted</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {enquiries.map((enq) => {
                    const statusColor =
                      enq.status === "Approved"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : enq.status === "Contacted"
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : enq.status === "Under Review"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-[#FFF3EB] text-[#E67230] border-[#E67230]/30";

                    return (
                      <tr key={enq.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3.5 space-y-0.5">
                          <div className="font-bold text-foreground text-sm">
                            {enq.full_name}
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground block">
                            {enq.id}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 space-y-0.5">
                          <div className="flex items-center gap-1.5 font-mono text-foreground">
                            <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span>{enq.mobile}</span>
                          </div>
                          {enq.email && (
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[160px]">{enq.email}</span>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-[#E67230] bg-[#E67230]/10 px-2.5 py-0.5 rounded border border-[#E67230]/25">
                            <MapPin className="h-3 w-3" />
                            {enq.territory_pincode}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-block rounded-md bg-[#FAF9F6] border border-border px-2.5 py-1 text-xs font-semibold text-foreground">
                            {enq.interested_tier}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <select
                            value={enq.status}
                            disabled={updatingId === enq.id}
                            onChange={(e) => handleUpdateStatus(enq.id, e.target.value)}
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold outline-none cursor-pointer ${statusColor}`}
                          >
                            <option value="New">New</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>

                        <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                          {new Date(enq.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEnquiry(enq);
                                setModalAdminNotes(enq.admin_notes || "");
                              }}
                              className="h-7 px-2 text-xs font-semibold text-primary hover:bg-primary/10"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Details
                            </Button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEnquiry(enq.id)}
                              className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal / Slide-over Details Drawer */}
          {selectedEnquiry && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-50">
              <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
                <div className="flex items-start justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Franchise Expression of Interest
                    </h3>
                    <p className="font-mono text-xs text-muted-foreground">
                      Ref: {selectedEnquiry.id}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedEnquiry(null)}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-xl border border-border">
                    <div>
                      <span className="text-muted-foreground block text-[11px] font-semibold uppercase">
                        Applicant Name
                      </span>
                      <strong className="text-foreground text-sm block mt-0.5">
                        {selectedEnquiry.full_name}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px] font-semibold uppercase">
                        Territory PIN
                      </span>
                      <strong className="text-primary font-mono text-sm block mt-0.5">
                        {selectedEnquiry.territory_pincode}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px] font-semibold uppercase">
                        Mobile Number
                      </span>
                      <span className="font-mono text-foreground block mt-0.5">
                        {selectedEnquiry.mobile}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px] font-semibold uppercase">
                        Email Address
                      </span>
                      <span className="font-mono text-foreground block mt-0.5 truncate">
                        {selectedEnquiry.email || "Not specified"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[11px] font-semibold uppercase mb-1">
                      Interested Franchise Tier
                    </span>
                    <span className="inline-block rounded-md bg-[#FAF9F6] border border-border px-3 py-1 font-bold text-[#E67230]">
                      {selectedEnquiry.interested_tier}
                    </span>
                  </div>

                  {selectedEnquiry.message && (
                    <div>
                      <span className="text-muted-foreground block text-[11px] font-semibold uppercase mb-1">
                        Applicant Experience &amp; Notes
                      </span>
                      <div className="rounded-lg bg-background p-3 border border-border text-foreground leading-relaxed">
                        {selectedEnquiry.message}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border space-y-2">
                    <span className="text-muted-foreground block text-[11px] font-semibold uppercase">
                      Admin Evaluation Notes
                    </span>
                    <textarea
                      rows={2}
                      value={modalAdminNotes}
                      onChange={(e) => setModalAdminNotes(e.target.value)}
                      placeholder="Add internal notes on territory allocation, background checks, or phone calls..."
                      className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-muted-foreground">Status:</span>
                      <select
                        value={selectedEnquiry.status}
                        onChange={(e) =>
                          handleUpdateStatus(selectedEnquiry.id, e.target.value, modalAdminNotes)
                        }
                        className="rounded-lg border border-border bg-background px-2 py-1 font-semibold text-xs text-foreground"
                      >
                        <option value="New">New</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEnquiry(null)}
                      >
                        Close
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleUpdateStatus(selectedEnquiry.id, selectedEnquiry.status, modalAdminNotes)
                        }
                      >
                        Save Notes
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
