import React, { useState } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  History,
  FileCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  Upload,
  FileText,
  HelpCircle,
  GitPullRequest,
} from "lucide-react";
import { PageHeader, StatusPill, EmptyState, focusRing } from "@/components/portal/brand";
import { useManufacturer } from "./manufacturer-context";
import type { Product, ProductStatus } from "./manufacturer-types";
import { cn } from "@/lib/utils";

export const ProductManagementPage: React.FC = () => {
  const {
    products,
    addProduct,
    updateProductDraft,
    submitProductForReview,
    resubmitAfterChanges,
    proposeProductRevision,
    archiveProduct,
  } = useManufacturer();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Dialog & Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailModalTab, setDetailModalTab] = useState<"details" | "history" | "documents">("details");
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isResubmitModalOpen, setIsResubmitModalOpen] = useState(false);

  // Form states for Add Product
  const [formName, setFormName] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formCategory, setFormCategory] = useState<Product["category"]>("Classical Formulations");
  const [formDosage, setFormDosage] = useState<Product["dosageForm"]>("Tablet");
  const [formCode, setFormCode] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formUse, setFormUse] = useState("");
  const [formIngredients, setFormIngredients] = useState("");
  const [formStrength, setFormStrength] = useState("");
  const [formPackaging, setFormPackaging] = useState("");
  const [formStorage, setFormStorage] = useState("Store in a cool and dry place away from direct sunlight.");
  const [formLicense, setFormLicense] = useState("TN/AYU/25D/2018-0912");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Form errors
  interface ProductFormErrors {
    name?: string;
    code?: string;
    ingredients?: string;
    desc?: string;
    use?: string;
    strength?: string;
    packaging?: string;
  }
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});

  // Revision / Resubmit form state
  const [revisionNotes, setRevisionNotes] = useState("");
  const [revisionStrength, setRevisionStrength] = useState("");
  const [revisionPackaging, setRevisionPackaging] = useState("");
  const [resubmitCorrections, setResubmitCorrections] = useState("");

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchesCategory = categoryFilter === "ALL" || p.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const validateAddForm = () => {
    const errors: ProductFormErrors = {};
    if (!formName.trim()) errors.name = "Product name is mandatory";
    if (!formCode.trim()) errors.code = "Manufacturer product code is mandatory";
    if (!formIngredients.trim()) errors.ingredients = "Ingredients & formulation composition is required";
    if (!formDesc.trim()) errors.desc = "Description is required";
    if (!formUse.trim()) errors.use = "Intended therapeutic use is required";
    if (!formStrength.trim()) errors.strength = "Strength or concentration is required";
    if (!formPackaging.trim()) errors.packaging = "Packaging details are required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateProduct = (asDraft: boolean) => {
    if (!validateAddForm()) return;

    addProduct(
      {
        productCode: formCode,
        name: formName,
        ...(formBrand.trim() ? { brandName: formBrand.trim() } : {}),
        category: formCategory,
        dosageForm: formDosage,
        description: formDesc,
        intendedUse: formUse,
        ingredients: formIngredients,
        strength: formStrength,
        packaging: formPackaging,
        storageInstructions: formStorage,
        licenseNumber: formLicense,
        status: asDraft ? "Draft" : "Submitted",
        documents: uploadedFileName
          ? [
              {
                id: `DOC-${Date.now()}`,
                name: uploadedFileName,
                documentNumber: `REG-${Math.floor(1000 + Math.random() * 9000)}`,
                documentType: "COA",
                uploadDate: new Date().toISOString().split("T")[0] || "2026-03-31",
                fileSize: "1.8 MB",
                status: "Pending Review",
              },
            ]
          : [],
      },
      asDraft
    );

    // Reset & close
    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormName("");
    setFormBrand("");
    setFormCode("");
    setFormDesc("");
    setFormUse("");
    setFormIngredients("");
    setFormStrength("");
    setFormPackaging("");
    setUploadedFileName(null);
    setFormErrors({});
  };

  const handleResubmit = () => {
    if (!selectedProduct || !resubmitCorrections.trim()) return;
    resubmitAfterChanges(
      selectedProduct.id,
      {
        revisionNotes: resubmitCorrections,
      },
      resubmitCorrections
    );
    setIsResubmitModalOpen(false);
    setSelectedProduct(null);
    setResubmitCorrections("");
  };

  const handleProposeRevision = () => {
    if (!selectedProduct || !revisionNotes.trim()) return;
    proposeProductRevision(
      selectedProduct.id,
      {
        strength: revisionStrength || selectedProduct.strength,
        packaging: revisionPackaging || selectedProduct.packaging,
      },
      revisionNotes
    );
    setIsRevisionModalOpen(false);
    setSelectedProduct(null);
    setRevisionNotes("");
  };

  const getTone = (st: ProductStatus) => {
    switch (st) {
      case "Approved":
        return "sage";
      case "Under Review":
      case "Submitted":
        return "info";
      case "Changes Requested":
        return "warning";
      case "Rejected":
        return "danger";
      default:
        return "muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Product Management"
        action={
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        }
      />

      {/* Governance & Privacy Banner */}
      <div className="rounded-xl border border-border bg-secondary/60 p-4">
        <div className="text-xs text-foreground/90 leading-relaxed">
          <span className="font-bold text-foreground">Catalog Governance Rule: </span>
          Products submitted by manufacturers are placed in <strong>"Under Review"</strong> until
          authoritative approval is granted by the Central Grantha Admin AYUSH Board. Only
          explicitly approved products enter the live practitioner prescription directory. Approved
          products cannot be directly altered; changes require a proposed revision.
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="card-surface p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products by name, code or ID..."
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
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Changes Requested">Changes Requested</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Categories</option>
              <option value="Classical Formulations">Classical Formulations</option>
              <option value="Patent & Proprietary">Patent & Proprietary</option>
              <option value="Asava & Arishta">Asava & Arishta</option>
              <option value="Oils & Ghrithas">Oils & Ghrithas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product List Table */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-muted-foreground uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Product Info</th>
                <th className="py-3.5 px-3">Category & Form</th>
                <th className="py-3.5 px-3">Licence / Code</th>
                <th className="py-3.5 px-3">Submitted</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <EmptyState
                      title="No products found"
                      body="No product records match your active search or filter criteria. Try adjusting filters or create a new formulation."
                    />
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary font-bold text-xs">
                          {p.dosageForm.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{p.name}</p>
                          {p.brandName && (
                            <p className="text-[11px] text-muted-foreground">{p.brandName}</p>
                          )}
                          <p className="text-[10px] font-mono text-muted-foreground/80">{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-medium text-foreground">{p.category}</span>
                      <p className="text-[11px] text-muted-foreground">{p.dosageForm}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-mono text-foreground">{p.productCode}</span>
                      <p className="text-[10.5px] text-muted-foreground font-mono truncate max-w-[130px]">
                        {p.licenseNumber}
                      </p>
                    </td>
                    <td className="py-3.5 px-3 text-muted-foreground">
                      <p>{p.submissionDate}</p>
                      <p className="text-[10.5px]">Updated {p.lastUpdated}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusPill tone={getTone(p.status)}>{p.status}</StatusPill>
                        {p.isRevisionPending && (
                          <span className="inline-flex items-center gap-1 rounded bg-info-soft px-1.5 py-0.5 text-[10px] font-semibold text-info">
                            <GitPullRequest className="h-3 w-3" />
                            Revision Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View details */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(p);
                            setDetailModalTab("details");
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* If Changes Requested -> Allow Edit & Resubmit */}
                        {p.status === "Changes Requested" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(p);
                              setResubmitCorrections(p.rejectionReason || "");
                              setIsResubmitModalOpen(true);
                            }}
                            className="rounded-lg bg-warning-soft px-2.5 py-1 text-[11px] font-semibold text-warning hover:bg-warning hover:text-white transition-colors"
                          >
                            Resubmit
                          </button>
                        )}

                        {/* If Draft -> Allow Direct Submit */}
                        {p.status === "Draft" && (
                          <button
                            type="button"
                            onClick={() => submitProductForReview(p.id)}
                            className="rounded-lg bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
                          >
                            Submit
                          </button>
                        )}

                        {/* If Approved -> Propose Revision (Never overwrite!) */}
                        {p.status === "Approved" && !p.isRevisionPending && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(p);
                              setRevisionStrength(p.strength);
                              setRevisionPackaging(p.packaging);
                              setIsRevisionModalOpen(true);
                            }}
                            className="rounded-lg border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-surface"
                            title="Propose Product Revision for Admin Approval"
                          >
                            Propose Revision
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD PRODUCT FORM */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-lift border border-border">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <div>
                <h2 className="type-section">Submit New Ayurveda Formulation</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete required regulatory data for AYUSH board review
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Product Name & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Product Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Abhayarishtam Gold"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-destructive mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Brand Name / Line
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AVN Classic"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Category & Dosage Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Category <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Product["category"])}
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none bg-white"
                  >
                    <option value="Classical Formulations">Classical Formulations</option>
                    <option value="Patent & Proprietary">Patent & Proprietary</option>
                    <option value="Asava & Arishta">Asava & Arishta</option>
                    <option value="Oils & Ghrithas">Oils & Ghrithas</option>
                    <option value="Herbal Supplements">Herbal Supplements</option>
                    <option value="Bhasma & Pishti">Bhasma & Pishti</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Dosage Form <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formDosage}
                    onChange={(e) => setFormDosage(e.target.value as Product["dosageForm"])}
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none bg-white"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Churna">Churna</option>
                    <option value="Thailam">Thailam</option>
                    <option value="Kashayam">Kashayam</option>
                    <option value="Lehyam">Lehyam</option>
                    <option value="Vati">Vati</option>
                  </select>
                </div>
              </div>

              {/* Manufacturer Code & License */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Product Code / SKU <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AVN-ABH-07"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  {formErrors.code && (
                    <p className="text-[11px] text-destructive mt-1">{formErrors.code}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Manufacturing License Ref
                  </label>
                  <input
                    type="text"
                    value={formLicense}
                    onChange={(e) => setFormLicense(e.target.value)}
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Description & Intended Use */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Product Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Traditional therapeutic background and key Ayurvedic attributes..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
                {formErrors.desc && (
                  <p className="text-[11px] text-destructive mt-1">{formErrors.desc}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Intended Therapeutic Use <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arshas, Agnimandya, Constipation"
                  value={formUse}
                  onChange={(e) => setFormUse(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
                {formErrors.use && (
                  <p className="text-[11px] text-destructive mt-1">{formErrors.use}</p>
                )}
              </div>

              {/* Ingredients */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Active Ingredients & Composition <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Haritaki 100g, Vidanga 50g, Madhuca indica 50g, etc."
                  value={formIngredients}
                  onChange={(e) => setFormIngredients(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
                {formErrors.ingredients && (
                  <p className="text-[11px] text-destructive mt-1">{formErrors.ingredients}</p>
                )}
              </div>

              {/* Strength & Packaging */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Strength / Concentration <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 500 mg per tablet"
                    value={formStrength}
                    onChange={(e) => setFormStrength(e.target.value)}
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  {formErrors.strength && (
                    <p className="text-[11px] text-destructive mt-1">{formErrors.strength}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Packaging Details <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 60 Tablets HDPE container"
                    value={formPackaging}
                    onChange={(e) => setFormPackaging(e.target.value)}
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  {formErrors.packaging && (
                    <p className="text-[11px] text-destructive mt-1">{formErrors.packaging}</p>
                  )}
                </div>
              </div>

              {/* Supporting Document Upload Simulation */}
              <div className="rounded-xl border border-dashed border-border p-4 bg-secondary/40 text-center">
                <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-1.5" />
                <p className="font-semibold text-foreground">Attach Certificate of Analysis (COA) / Lab Report</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  PDF format up to 10MB (Validated against Form 25D specs)
                </p>
                <label className="mt-2.5 inline-block cursor-pointer rounded-lg bg-white border border-border px-3 py-1.5 text-xs font-semibold hover:bg-surface">
                  Browse File
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setUploadedFileName(e.target.files[0].name);
                      }
                    }}
                  />
                </label>
                {uploadedFileName && (
                  <p className="mt-2 text-[11px] font-semibold text-success flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Selected: {uploadedFileName}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCreateProduct(true)}
                  className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateProduct(false)}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 shadow-soft"
                >
                  Submit for Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PRODUCT DETAILS & HISTORY */}
      {selectedProduct && !isRevisionModalOpen && !isResubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-lift border border-border">
            <div className="flex items-start justify-between border-b border-border pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="type-section">{selectedProduct.name}</h2>
                  <StatusPill tone={getTone(selectedProduct.status)}>
                    {selectedProduct.status}
                  </StatusPill>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  ID: {selectedProduct.id} • SKU: {selectedProduct.productCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-border mb-4 text-xs">
              <button
                type="button"
                onClick={() => setDetailModalTab("details")}
                className={cn(
                  "border-b-2 py-2 px-3 font-semibold transition-colors",
                  detailModalTab === "details"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Specification
              </button>
              <button
                type="button"
                onClick={() => setDetailModalTab("history")}
                className={cn(
                  "border-b-2 py-2 px-3 font-semibold transition-colors",
                  detailModalTab === "history"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Approval History ({selectedProduct.history.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailModalTab("documents")}
                className={cn(
                  "border-b-2 py-2 px-3 font-semibold transition-colors",
                  detailModalTab === "documents"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Regulatory Documents ({selectedProduct.documents.length})
              </button>
            </div>

            {/* TAB CONTENT */}
            {detailModalTab === "details" && (
              <div className="space-y-3 text-xs">
                {selectedProduct.rejectionReason && (
                  <div className="rounded-xl border border-warning/40 bg-warning-soft p-3 text-warning">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4" /> Admin Reviewer Notes / Changes Requested:
                    </p>
                    <p className="mt-1 text-xs text-foreground/90">
                      {selectedProduct.rejectionReason}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 bg-secondary/40 p-3.5 rounded-xl">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p className="font-semibold text-foreground">{selectedProduct.category}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dosage Form:</span>
                    <p className="font-semibold text-foreground">{selectedProduct.dosageForm}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Strength:</span>
                    <p className="font-semibold text-foreground">{selectedProduct.strength}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Packaging:</span>
                    <p className="font-semibold text-foreground">{selectedProduct.packaging}</p>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-foreground">Intended Therapeutic Use:</span>
                  <p className="mt-0.5 text-muted-foreground leading-relaxed">
                    {selectedProduct.intendedUse}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-foreground">Ingredients & Composition:</span>
                  <p className="mt-0.5 text-muted-foreground leading-relaxed">
                    {selectedProduct.ingredients}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-foreground">Storage Instructions:</span>
                  <p className="mt-0.5 text-muted-foreground">{selectedProduct.storageInstructions}</p>
                </div>

                {selectedProduct.isRevisionPending && (
                  <div className="rounded-xl border border-info/40 bg-info-soft p-3 text-info">
                    <p className="font-bold flex items-center gap-1.5">
                      <GitPullRequest className="h-4 w-4" /> Proposed Revision Under Review:
                    </p>
                    <p className="mt-1 text-foreground/90 text-xs">
                      {selectedProduct.revisionNotes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {detailModalTab === "history" && (
              <div className="space-y-3">
                <div className="relative border-l-2 border-border/80 pl-4 ml-2 space-y-4 text-xs">
                  {selectedProduct.history.map((h) => (
                    <div key={h.id} className="relative">
                      <div className="absolute -left-[21px] top-0.5 h-3 w-3 rounded-full bg-primary ring-4 ring-white" />
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{h.action}</span>
                        <span className="text-[11px] text-muted-foreground">{h.date}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">By {h.performedBy}</p>
                      {h.notes && (
                        <p className="mt-1 text-xs bg-secondary/70 p-2 rounded-lg text-foreground/90">
                          {h.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailModalTab === "documents" && (
              <div className="space-y-2 text-xs">
                {selectedProduct.documents.length === 0 ? (
                  <p className="text-muted-foreground py-6 text-center">
                    No documents attached to this formulation dossier.
                  </p>
                ) : (
                  selectedProduct.documents.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between border border-border p-3 rounded-xl bg-secondary/30"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">{d.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {d.documentType} • {d.fileSize} • Uploaded {d.uploadDate}
                          </p>
                        </div>
                      </div>
                      <StatusPill
                        tone={
                          d.status === "Verified"
                            ? "sage"
                            : d.status === "Changes Requested"
                            ? "warning"
                            : "info"
                        }
                      >
                        {d.status}
                      </StatusPill>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RESUBMIT AFTER CHANGES REQUESTED */}
      {isResubmitModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-lift border border-border text-xs">
            <h2 className="type-section mb-1">Resubmit Product after Corrections</h2>
            <p className="text-muted-foreground mb-4">
              Addressing admin remarks for {selectedProduct.name}
            </p>

            <div className="rounded-xl bg-warning-soft/70 border border-warning/30 p-3 mb-4 text-foreground/90">
              <span className="font-bold text-warning">Admin Remark: </span>
              {selectedProduct.rejectionReason}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">
                  Correction Response & Compliance Notes <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Detail the corrections applied (e.g. updated accelerated stability data attached, dosage recommendation aligned with AFI)..."
                  value={resubmitCorrections}
                  onChange={(e) => setResubmitCorrections(e.target.value)}
                  className="w-full rounded-xl border border-border p-3 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setIsResubmitModalOpen(false)}
                className="rounded-xl px-4 py-2 font-semibold text-muted-foreground hover:bg-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!resubmitCorrections.trim()}
                onClick={handleResubmit}
                className="rounded-xl bg-primary px-4 py-2 font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                Resubmit for Board Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PROPOSE REVISION (Approved products cannot be directly overwritten) */}
      {isRevisionModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-lift border border-border text-xs">
            <h2 className="type-section mb-1">Propose Product Revision</h2>
            <p className="text-muted-foreground mb-3">
              For approved formulation: <strong>{selectedProduct.name}</strong>
            </p>

            <div className="rounded-xl bg-accent/60 border border-primary/20 p-3 mb-4 text-foreground/90">
              <p className="font-semibold text-primary">AYUSH Governance Protection</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                The current approved version remains active for prescribing doctors. Your proposed
                updates will be sent to the Central Grantha Admin for evaluation without disrupting
                existing clinic stock.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Proposed Packaging / Pack Size</label>
                <input
                  type="text"
                  value={revisionPackaging}
                  onChange={(e) => setRevisionPackaging(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Proposed Strength / Posology</label>
                <input
                  type="text"
                  value={revisionStrength}
                  onChange={(e) => setRevisionStrength(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Reason for Revision & Supporting R&D Rationale <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this revision is requested (e.g. improved dissolution rate, upgraded blister packing)..."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  className="w-full rounded-xl border border-border p-3 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setIsRevisionModalOpen(false)}
                className="rounded-xl px-4 py-2 font-semibold text-muted-foreground hover:bg-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!revisionNotes.trim()}
                onClick={handleProposeRevision}
                className="rounded-xl bg-primary px-4 py-2 font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                Submit Revision Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
