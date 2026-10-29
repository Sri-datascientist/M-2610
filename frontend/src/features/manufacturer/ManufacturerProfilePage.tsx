import React, { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  Edit2,
  Save,
  X,
  ShieldCheck,
  ExternalLink,
  Lock,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { PageHeader, StatusPill, focusRing } from "@/components/portal/brand";
import { useManufacturer } from "./manufacturer-context";
import type { RegulatoryDocument } from "./manufacturer-types";
import { cn } from "@/lib/utils";

export const ManufacturerProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, uploadProfileDocument, signOut } = useManufacturer();

  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    legalCompanyName: profile.legalCompanyName,
    brandName: profile.brandName,
    registeredAddress: profile.registeredAddress,
    state: profile.state,
    district: profile.district,
    pinCode: profile.pinCode,
    contactPerson: profile.contactPerson,
    designation: profile.designation,
    businessEmail: profile.businessEmail,
    businessPhone: profile.businessPhone,
    website: profile.website,
    gstin: profile.gstin,
    form25DNumber: profile.form25DNumber,
    form25DIssueDate: profile.form25DIssueDate,
    form25DExpiryDate: profile.form25DExpiryDate,
    ayushLicenseNumber: profile.ayushLicenseNumber,
    gmpCertificateNumber: profile.gmpCertificateNumber,
  });

  interface ProfileFormErrors {
    legalCompanyName?: string;
    businessEmail?: string;
    businessPhone?: string;
    gstin?: string;
    form25DNumber?: string;
  }
  const [formErrors, setFormErrors] = useState<ProfileFormErrors>({});
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState<RegulatoryDocument["documentType"]>("Form 25D");
  const [newDocNumber, setNewDocNumber] = useState("");
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const validate = () => {
    const errs: ProfileFormErrors = {};
    if (!formData.legalCompanyName.trim()) errs.legalCompanyName = "Legal name is required";
    if (!formData.businessEmail.includes("@")) errs.businessEmail = "Valid email is required";
    if (!formData.businessPhone.trim()) errs.businessPhone = "Contact phone is required";
    if (formData.gstin.length !== 15) errs.gstin = "GSTIN must be 15 alphanumeric characters";
    if (!formData.form25DNumber.trim()) errs.form25DNumber = "Form 25D license number is mandatory";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const { requiresReverification } = updateProfile(formData);
    setIsEditing(false);
    if (requiresReverification) {
      setSuccessMessage(
        "Profile updated. Critical statutory fields changed: profile status transitioned to 'Re-verification Pending' for Admin verification."
      );
    } else {
      setSuccessMessage("Manufacturer profile successfully updated.");
    }
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleAddDocument = () => {
    if (!newDocName.trim() || !newDocNumber.trim()) return;
    uploadProfileDocument({
      id: `DOC-${Date.now()}`,
      name: newDocName,
      documentNumber: newDocNumber,
      documentType: newDocType,
      uploadDate: new Date().toISOString().split("T")[0] || "2026-03-31",
      fileSize: "2.2 MB",
      status: "Pending Review",
    });
    setIsDocModalOpen(false);
    setNewDocName("");
    setNewDocNumber("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manufacturer Profile & Regulatory Dossier"
        action={
          !isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 transition-all"
            >
              <Edit2 className="h-4 w-4" /> Edit Profile Information
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    legalCompanyName: profile.legalCompanyName,
                    brandName: profile.brandName,
                    registeredAddress: profile.registeredAddress,
                    state: profile.state,
                    district: profile.district,
                    pinCode: profile.pinCode,
                    contactPerson: profile.contactPerson,
                    designation: profile.designation,
                    businessEmail: profile.businessEmail,
                    businessPhone: profile.businessPhone,
                    website: profile.website,
                    gstin: profile.gstin,
                    form25DNumber: profile.form25DNumber,
                    form25DIssueDate: profile.form25DIssueDate,
                    form25DExpiryDate: profile.form25DExpiryDate,
                    ayushLicenseNumber: profile.ayushLicenseNumber,
                    gmpCertificateNumber: profile.gmpCertificateNumber,
                  });
                  setIsEditing(false);
                }}
                className="rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 shadow-soft"
              >
                <Save className="h-4 w-4" /> Save Changes
              </button>
            </div>
          )
        }
      />

      {successMessage && (
        <div className="rounded-xl bg-success-soft border border-success/30 p-4 text-xs font-semibold text-success flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Verification Status Banner */}
      <div className="card-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-brand font-bold text-base text-foreground">
              {profile.legalCompanyName}
            </p>
            <StatusPill
              tone={
                profile.verificationStatus === "Verified"
                  ? "sage"
                  : profile.verificationStatus === "Re-verification Pending"
                  ? "warning"
                  : "info"
              }
            >
              {profile.verificationStatus}
            </StatusPill>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manufacturer ID: <span className="font-mono">{profile.id}</span> • Form 25D:{" "}
            <span className="font-mono">{profile.form25DNumber}</span>
          </p>
        </div>

        <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
          <p className="text-xs text-muted-foreground">Authoritative Admin Status</p>
          <p className="text-sm font-semibold text-foreground">Active Ayurveda Licensee</p>
        </div>
      </div>

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Company & Operations Info */}
        <div className="card-surface p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="type-section">Corporate & Manufacturing Entity</h3>
            {isEditing && <span className="text-[11px] text-primary font-medium">Editable</span>}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-muted-foreground block font-medium mb-1">
                Legal Company Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.legalCompanyName}
                  onChange={(e) =>
                    setFormData({ ...formData, legalCompanyName: e.target.value })
                  }
                  className="w-full rounded-xl border border-border p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              ) : (
                <p className="font-semibold text-foreground text-sm">{profile.legalCompanyName}</p>
              )}
              {formErrors.legalCompanyName && (
                <p className="text-destructive text-[11px] mt-0.5">
                  {formErrors.legalCompanyName}
                </p>
              )}
            </div>

            <div>
              <label className="text-muted-foreground block font-medium mb-1">
                Display Brand Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  className="w-full rounded-xl border border-border p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              ) : (
                <p className="font-semibold text-foreground">{profile.brandName}</p>
              )}
            </div>

            <div>
              <label className="text-muted-foreground block font-medium mb-1">
                Manufacturing / Registered Address
              </label>
              {isEditing ? (
                <textarea
                  rows={2}
                  value={formData.registeredAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, registeredAddress: e.target.value })
                  }
                  className="w-full rounded-xl border border-border p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              ) : (
                <p className="text-foreground leading-relaxed">{profile.registeredAddress}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-muted-foreground block font-medium mb-1">State</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full rounded-xl border border-border p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                ) : (
                  <p className="font-medium text-foreground">{profile.state}</p>
                )}
              </div>
              <div>
                <label className="text-muted-foreground block font-medium mb-1">District</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full rounded-xl border border-border p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                ) : (
                  <p className="font-medium text-foreground">{profile.district}</p>
                )}
              </div>
              <div>
                <label className="text-muted-foreground block font-medium mb-1">PIN Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    className="w-full rounded-xl border border-border p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                ) : (
                  <p className="font-mono text-foreground">{profile.pinCode}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-muted-foreground block font-medium mb-1">Official Website</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full rounded-xl border border-border p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              ) : (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  {profile.website} <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Regulatory & Licensing (Form 25D Details) */}
        <div className="card-surface p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="type-section">AYUSH Licensing & Tax Register</h3>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
              <Lock className="h-3 w-3" /> Subject to Admin Audit
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-muted-foreground block font-medium mb-1">
                Form 25D Ayurvedic Drug License Number
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.form25DNumber}
                  onChange={(e) => setFormData({ ...formData, form25DNumber: e.target.value })}
                  className="w-full rounded-xl border border-border p-2 font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                />
              ) : (
                <p className="font-mono font-bold text-foreground text-sm">{profile.form25DNumber}</p>
              )}
              {formErrors.form25DNumber && (
                <p className="text-destructive text-[11px] mt-0.5">{formErrors.form25DNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-muted-foreground block font-medium mb-1">
                  License Issue Date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.form25DIssueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, form25DIssueDate: e.target.value })
                    }
                    className="w-full rounded-xl border border-border p-2 font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                ) : (
                  <p className="font-mono text-foreground">{profile.form25DIssueDate}</p>
                )}
              </div>
              <div>
                <label className="text-muted-foreground block font-medium mb-1">
                  License Expiry Date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.form25DExpiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, form25DExpiryDate: e.target.value })
                    }
                    className="w-full rounded-xl border border-border p-2 font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                ) : (
                  <p className="font-mono text-foreground">{profile.form25DExpiryDate}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-muted-foreground block font-medium mb-1">
                Goods and Services Tax ID (GSTIN)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  className="w-full rounded-xl border border-border p-2 font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                />
              ) : (
                <p className="font-mono font-semibold text-foreground">{profile.gstin}</p>
              )}
              {formErrors.gstin && (
                <p className="text-destructive text-[11px] mt-0.5">{formErrors.gstin}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-muted-foreground block font-medium mb-1">
                  WHO-GMP Certificate Ref
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.gmpCertificateNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, gmpCertificateNumber: e.target.value })
                    }
                    className="w-full rounded-xl border border-border p-2 font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                ) : (
                  <p className="font-mono text-foreground">{profile.gmpCertificateNumber}</p>
                )}
              </div>
              <div>
                <label className="text-muted-foreground block font-medium mb-1">
                  State AYUSH Lic Ref
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.ayushLicenseNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, ayushLicenseNumber: e.target.value })
                    }
                    className="w-full rounded-xl border border-border p-2 font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                ) : (
                  <p className="font-mono text-foreground">{profile.ayushLicenseNumber}</p>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => {
                  signOut();
                  navigate({ to: "/login", search: { portal: "manufacturer" } });
                }}
                className="w-full rounded-xl border border-destructive/30 bg-white px-4 py-2.5 text-xs font-semibold text-destructive shadow-xs hover:bg-destructive/10 transition-colors sm:w-auto"
              >
                Sign out of Manufacturer Portal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statutory Regulatory Documents */}
      <div className="card-surface p-5">
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <div>
            <h3 className="type-section">Verified Regulatory Documents & Certificates</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsDocModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-surface"
          >
            <Upload className="h-3.5 w-3.5" /> Upload Document
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {profile.documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-xl border border-border p-3.5 bg-secondary/30 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] text-muted-foreground">{doc.id}</span>
                  <StatusPill tone={doc.status === "Verified" ? "sage" : "info"}>
                    {doc.status}
                  </StatusPill>
                </div>
                <p className="font-semibold text-foreground text-xs truncate">{doc.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Type: {doc.documentType} • {doc.fileSize}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground mt-1">
                  Ref: {doc.documentNumber}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border/60 flex justify-between text-[10px] text-muted-foreground">
                <span>Uploaded {doc.uploadDate}</span>
                {doc.expiryDate && <span>Exp: {doc.expiryDate}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outstanding Documentation Requests from Admin */}
      <div className="card-surface p-5">
        <h3 className="type-section text-warning mb-2">
          Outstanding Documentation Requests
        </h3>

        {profile.outstandingRequests.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No outstanding requests at this time.</p>
        ) : (
          <div className="space-y-3">
            {profile.outstandingRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-warning/30 bg-warning-soft/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-foreground">{req.title}</p>
                  <p className="text-muted-foreground mt-0.5">{req.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                    Requested on {req.dateRequested}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(true)}
                  className="rounded-xl bg-warning px-3 py-1.5 font-semibold text-white hover:bg-warning/90 transition-colors shrink-0 text-center"
                >
                  Submit Document
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-lift border border-border text-xs">
            <h2 className="type-section mb-1">Upload Regulatory Document</h2>
            <p className="text-muted-foreground mb-4">
              Attach certified statutory records for Admin review
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Document Title / File Name</label>
                <input
                  type="text"
                  placeholder="e.g. Heavy_Metal_Batch24B_Lab_Report.pdf"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full rounded-xl border border-border p-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Document Category</label>
                <select
                  value={newDocType}
                  onChange={(e) =>
                    setNewDocType(e.target.value as RegulatoryDocument["documentType"])
                  }
                  className="w-full rounded-xl border border-border p-2.5 focus:ring-1 focus:ring-primary focus:outline-none bg-white"
                >
                  <option value="Form 25D">Form 25D</option>
                  <option value="GMP Certificate">GMP Certificate</option>
                  <option value="COA">Certificate of Analysis (COA)</option>
                  <option value="AYUSH License">AYUSH License</option>
                  <option value="Lab Report">Lab Report</option>
                  <option value="Other">Other Supporting Document</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Document or Lab Assay Reference No.</label>
                <input
                  type="text"
                  placeholder="e.g. LAB-TN-2026-904"
                  value={newDocNumber}
                  onChange={(e) => setNewDocNumber(e.target.value)}
                  className="w-full rounded-xl border border-border p-2.5 font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setIsDocModalOpen(false)}
                className="rounded-xl px-4 py-2 font-semibold text-muted-foreground hover:bg-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newDocName.trim() || !newDocNumber.trim()}
                onClick={handleAddDocument}
                className="rounded-xl bg-primary px-4 py-2 font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                Upload & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
