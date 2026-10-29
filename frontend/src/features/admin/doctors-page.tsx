import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { NoPermission } from "@/components/admin/ui";
import { focusRing, PageHeader } from "@/components/portal/brand";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type Column } from "@/components/admin/ui";
import { useCatalog } from "@/features/admin/catalog-state";
import { doctorSlugMap } from "@/features/admin/doctor-slug";
import {
  doctorStatusLabel,
  doctorStatuses,
  specializations,
  type Doctor,
  type DoctorStatus,
  type HistoryEntry,
} from "@/features/admin/catalog-data";
import {
  BackButton,
  DetailSection,
  MetaList,
  SearchField,
  SelectField,
  SummaryRow,
  ViewTabs,
} from "@/features/admin/fields";
import { NoteForm, recorded, ReviewBadge } from "@/features/admin/review-ui";
import { useStore } from "@/lib/admin-store";
import { cn } from "@/lib/utils";

type DoctorDecision = "verify" | "request" | "reject" | "suspend";

export function DoctorsDirectory() {
  const { doctors, isLoadingDoctors, quickVerifyDoctor, quickRejectDoctor } = useCatalog();
  const search = useSearch({ strict: false }) as { status?: DoctorStatus | undefined } | undefined;
  const navigate = useNavigate();
  const slugs = useMemo(() => doctorSlugMap(doctors), [doctors]);
  const openDoctor = (doctor: Doctor) => {
    const doctorSlug = slugs.get(doctor.id) || doctor.id;
    void navigate({ to: "/admin/doctors/$doctorSlug", params: { doctorSlug } });
  };
  const [internalStatus, setInternalStatus] = useState<DoctorStatus | "all">(
    search?.status && (doctorStatuses as readonly string[]).includes(search.status)
      ? search.status
      : "all",
  );
  const status: DoctorStatus | "all" =
    search?.status && (doctorStatuses as readonly string[]).includes(search.status)
      ? search.status
      : internalStatus;

  const setStatus = (
    next: DoctorStatus | "all" | ((current: DoctorStatus | "all") => DoctorStatus | "all"),
  ) => {
    const value = typeof next === "function" ? next(status) : next;
    setInternalStatus(value);
    void navigate({
      to: "/admin/doctors",
      search: (value === "all" ? {} : { status: value }) as any,
      replace: true,
    });
  };
  const [query, setQuery] = useState("");
  const [specialization, setSpecialization] = useState<string>("all");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return doctors.filter((doctor) => {
      const haystack = `${doctor.name} ${doctor.email} ${doctor.phone || ""} ${doctor.qualification || ""} ${doctor.inviteCode || ""} ${doctor.registrationNumber} ${doctor.city} ${doctor.state} ${doctor.pincode}`.toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (status !== "all" && doctor.status !== status) return false;
      if (specialization !== "all" && doctor.specialization !== specialization) return false;
      return true;
    });
  }, [doctors, query, status, specialization]);

  const count = (value: DoctorStatus) => doctors.filter((doctor) => doctor.status === value).length;

  const columns: Column<Doctor>[] = [
    {
      header: "Doctor & Contact",
      cell: (row) => (
        <div className="flex flex-col">
          <Link
            to="/admin/doctors/$doctorSlug"
            params={{ doctorSlug: slugs.get(row.id) ?? row.id }}
            className="font-semibold text-foreground hover:text-primary transition-colors"
            onClick={(event) => event.stopPropagation()}
          >
            {row.name}
          </Link>
          <span className="text-xs text-muted-foreground">{row.email}</span>
          {row.phone && (
            <span className="text-[11px] text-muted-foreground font-mono">{row.phone}</span>
          )}
        </div>
      ),
    },
    {
      header: "AYUSH Qualification",
      cell: (row) => (
        <div className="flex flex-col gap-1 items-start">
          <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
            {row.qualification || "BAMS"}
          </span>
          <span className="text-xs text-muted-foreground">{row.specialization}</span>
        </div>
      ),
    },
    {
      header: "Council Reg No.",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-bold text-foreground bg-muted/70 px-2 py-0.5 rounded border border-border inline-block w-fit">
            {row.registrationNumber}
          </span>
        </div>
      ),
    },
    {
      header: "Location (PIN)",
      cell: (row) => (
        <div className="text-sm">
          <span className="font-medium text-foreground">{row.pincode ? `PIN: ${row.pincode}` : "—"}</span>
          <span className="block text-xs text-muted-foreground">
            {row.city || row.state}
          </span>
        </div>
      ),
    },
    {
      header: "Invite Code",
      cell: (row) =>
        row.inviteCode ? (
          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            {row.inviteCode}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      header: "Submitted",
      cell: (row) => <span className="text-xs text-muted-foreground whitespace-nowrap">{row.submittedDate}</span>,
    },
    {
      header: "Status",
      cell: (row) => <ReviewBadge status={doctorStatusLabel(row.status)} />,
    },
    {
      header: "Verification Actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button asChild size="sm" variant="outline" className="h-8 text-xs font-medium">
            <Link
              to="/admin/doctors/$doctorSlug"
              params={{ doctorSlug: slugs.get(row.id) ?? row.id }}
            >
              Review
            </Link>
          </Button>
          {row.status !== "Verified" && (
            <Button
              size="sm"
              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-none"
              onClick={async () => {
                await quickVerifyDoctor(row.id);
                toast.success(`Verified ${row.name}`);
              }}
            >
              Verify
            </Button>
          )}
          {row.status !== "Rejected" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-destructive hover:bg-destructive/10 text-xs font-medium"
              onClick={async () => {
                await quickRejectDoctor(row.id, "Rejected during administrative review");
                toast.error(`Rejected ${row.name}`);
              }}
            >
              Reject
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Doctor verification and management"
        subtitle="Review real practitioner profiles and manage verification status."
      />
      <SummaryRow
        items={[
          {
            label: "All Doctors",
            value: doctors.length,
            pressed: status === "all",
            onClick: () => setStatus("all"),
          },
          {
            label: "Pending Verification",
            value: count("Pending Review"),
            pressed: status === "Pending Review",
            onClick: () =>
              setStatus((current) => (current === "Pending Review" ? "all" : "Pending Review")),
          },
          {
            label: "Under Review",
            value: count("Under Review"),
            pressed: status === "Under Review",
            onClick: () =>
              setStatus((current) => (current === "Under Review" ? "all" : "Under Review")),
          },
          {
            label: "Verified",
            value: count("Verified"),
            pressed: status === "Verified",
            onClick: () => setStatus((current) => (current === "Verified" ? "all" : "Verified")),
          },
          {
            label: "Rejected",
            value: count("Rejected"),
            pressed: status === "Rejected",
            onClick: () => setStatus((current) => (current === "Rejected" ? "all" : "Rejected")),
          },
        ]}
      />
      <section className="card-surface">
        <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SearchField
              label="Search"
              value={query}
              onChange={setQuery}
              placeholder="Search by doctor name, license number, email, phone, PIN, or invite code"
            />
          </div>
          <SelectField
            label="Status"
            value={status}
            onChange={(value) => setStatus(value as DoctorStatus | "all")}
            options={[
              { value: "all", label: "All statuses" },
              ...doctorStatuses.map((item) => ({ value: item, label: doctorStatusLabel(item) })),
            ]}
          />
          <SelectField
            label="Specialization"
            value={specialization}
            onChange={setSpecialization}
            options={[
              { value: "all", label: "All specializations" },
              ...specializations.map((item) => ({ value: item, label: item })),
            ]}
          />
        </div>
        {isLoadingDoctors && doctors.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading practitioner database records...
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No registered doctors match the selected search or filters.
          </div>
        ) : (
          <DataTable
            key={`${query}|${status}|${specialization}`}
            rows={rows}
            columns={columns}
            onRowClick={openDoctor}
            pageSize={10}
          />
        )}
      </section>
    </div>
  );
}

export function DoctorDetail({
  doctor,
  enabled,
  onBack,
  onChecklist,
  onNote,
  onDecide,
}: {
  doctor: Doctor;
  enabled: boolean;
  onBack: () => void;
  onChecklist: (index: number, done: boolean) => void;
  onNote: (text: string) => Promise<void> | void;
  onDecide: (
    decision: DoctorDecision,
    reason: string,
    documents?: string[],
  ) => Promise<{ ok: true } | { ok: false; message: string }> | ({ ok: true } | { ok: false; message: string });
}) {
  const [tab, setTab] = useState<"Overview" | "Credentials" | "Documents" | "Review History">(
    "Overview",
  );
  const closed = doctor.status === "Rejected" || doctor.status === "Suspended";
  return (
    <div>
      <PageHeader
        title="Doctor verification and management"
        subtitle="Review practitioner profiles and verification applications."
      />
      <BackButton onClick={onBack} label="Back to doctors" />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="type-record">{doctor.name}</h2>
            {doctor.qualification && (
              <span className="rounded-md bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                {doctor.qualification}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {doctor.specialization} · Reg #{doctor.registrationNumber} · {doctor.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReviewBadge status={doctorStatusLabel(doctor.status)} />
          {enabled && !closed && doctor.status !== "Verified" && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              onClick={async () => {
                await Promise.resolve(onDecide("verify", "Doctor credentials verified by Administrator"));
                toast.success(`Verified ${doctor.name}`);
              }}
            >
              Verify & Approve
            </Button>
          )}
          {enabled && !closed && doctor.status !== "Rejected" && (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10 font-medium"
              onClick={async () => {
                await Promise.resolve(onDecide("reject", "Application rejected by Administrator"));
                toast.error(`Rejected ${doctor.name}`);
              }}
            >
              Reject
            </Button>
          )}
        </div>
      </div>
      <div className="mt-4">
        {closed ? (
          <p className="text-sm text-muted-foreground">This decision is already recorded.</p>
        ) : (
          <DoctorReviewActions doctor={doctor} enabled={enabled} onDecide={onDecide} />
        )}
      </div>
      <div className="mt-5">
        <ViewTabs
          label="Doctor sections"
          value={tab}
          onChange={setTab}
          options={(["Overview", "Credentials", "Documents", "Review History"] as const).map(
            (item) => ({ id: item, label: item }),
          )}
        />
      </div>
      <div className="mt-4 space-y-4">
        {tab === "Overview" ? (
          <>
            <DetailSection title="Practitioner Information">
              <MetaList
                rows={[
                  { label: "Full Name", value: doctor.name },
                  { label: "Email Address", value: doctor.email },
                  { label: "Mobile / Phone", value: doctor.phone || "Not provided" },
                  { label: "AYUSH Qualification", value: doctor.qualification || "BAMS" },
                  { label: "Specialization", value: doctor.specialization },
                  { label: "Council Registration No.", value: doctor.registrationNumber },
                  { label: "PIN Code", value: doctor.pincode || "Not specified" },
                  { label: "Practitioner Invite Code", value: doctor.inviteCode || "None generated" },
                  { label: "Referred By Invite Code", value: doctor.referredByInviteCode || "Direct registration" },
                  { label: "Registration Date", value: doctor.submittedDate },
                  { label: "Practice Address", value: doctor.address || "Ayurvedic Medical Practice" },
                  { label: "City & State", value: `${doctor.city}, ${doctor.state}` },
                  { label: "Experience", value: doctor.experience },
                  { label: "Languages", value: doctor.languages },
                ]}
              />
            </DetailSection>
            <DetailSection title="Verification checklist">
              <div className="mb-3 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Verify practitioner credentials against medical registers</span>
                {enabled && !closed && (
                  <button
                    type="button"
                    className="text-xs text-primary font-medium hover:underline"
                    onClick={() => {
                      doctor.checklist.forEach((_, idx) => onChecklist(idx, true));
                    }}
                  >
                    Mark all checked
                  </button>
                )}
              </div>
              <ul className="space-y-2">
                {doctor.checklist.map((item, index) => (
                  <li key={item.label}>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.done}
                        disabled={!enabled || closed}
                        onChange={() => onChecklist(index, !item.done)}
                        className="rounded border-input text-primary focus:ring-primary/20"
                      />
                      {item.label}
                    </label>
                  </li>
                ))}
              </ul>
            </DetailSection>
          </>
        ) : null}
        {tab === "Credentials" ? (
          <>
            <DetailSection title="Qualifications">
              <ul className="space-y-3">
                {doctor.qualifications.map((item) => (
                  <li key={`${item.degree}-${item.year}`}>
                    <p className="font-medium">{item.degree}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.institution} · {item.year}
                    </p>
                  </li>
                ))}
              </ul>
            </DetailSection>
            <DetailSection title="Registration details">
              <MetaList
                rows={[
                  { label: "Council", value: doctor.council },
                  { label: "Number", value: doctor.registrationNumber },
                  { label: "State", value: doctor.registrationState },
                  { label: "Valid until", value: doctor.registrationValidUntil },
                  { label: "Submitted", value: doctor.submittedDate },
                ]}
              />
            </DetailSection>
          </>
        ) : null}
        {tab === "Documents" ? (
          <DetailSection title="Submitted documents">
            <ul className="space-y-2">
              {doctor.documents.map((document) => (
                <li key={document.name} className="rounded-xl border border-border px-3 py-2">
                  <p className="font-medium">{document.name}</p>
                  <p className="text-sm text-muted-foreground">Submitted {document.submitted}</p>
                </li>
              ))}
            </ul>
          </DetailSection>
        ) : null}
        {tab === "Review History" ? (
          <>
            <DetailSection title="Reviewer notes">
              <NoteForm onAdd={onNote} />
              <ul className="mt-4 space-y-2">
                {doctor.notes.length === 0 ? (
                  <li className="text-sm text-muted-foreground">No notes yet.</li>
                ) : (
                  doctor.notes.map((item, index) => (
                    <li
                      key={`${item.at}-${index}`}
                      className="rounded-xl border border-border px-3 py-2"
                    >
                      <p>{item.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.at} · {item.by}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </DetailSection>
            <DetailSection title="Verification history">
              <DoctorHistory items={doctor.history} />
            </DetailSection>
          </>
        ) : null}
      </div>
    </div>
  );
}

const reviewOptions: { value: DoctorDecision; label: string }[] = [
  { value: "verify", label: "Verify" },
  { value: "request", label: "Additional Information Required" },
  { value: "reject", label: "Reject" },
  { value: "suspend", label: "Suspend" },
];

function DoctorReviewActions({
  doctor,
  enabled,
  onDecide,
}: {
  doctor: Doctor;
  enabled: boolean;
  onDecide: (
    decision: DoctorDecision,
    reason: string,
    documents?: string[],
  ) => Promise<{ ok: true } | { ok: false; message: string }> | { ok: true } | { ok: false; message: string };
}) {
  const [choice, setChoice] = useState<DoctorDecision | null>(null);
  const [detail, setDetail] = useState("");
  const [detailError, setDetailError] = useState("");
  const [requestedDocs, setRequestedDocs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const missingChecks = doctor.checklist.filter((item) => !item.done).map((item) => item.label);

  const close = () => {
    setChoice(null);
    setDetail("");
    setDetailError("");
    setRequestedDocs([]);
    busyRef.current = false;
    setBusy(false);
  };

  const submit = async () => {
    if (!choice || busyRef.current) return;
    if (choice === "verify" && missingChecks.length > 0) {
      setDetailError("Complete every verification check before confirming verification.");
      return;
    }
    if (choice !== "verify" && !detail.trim()) {
      setDetailError(
        choice === "request"
          ? "Describe the additional information or documents required."
          : "Enter a reason before confirming.",
      );
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      const result = await Promise.resolve(
        onDecide(choice, detail.trim(), choice === "request" ? requestedDocs : [])
      );
      if (!result.ok) {
        setDetailError(result.message);
        return;
      }
      recorded(
        choice === "verify"
          ? "Verification confirmed"
          : choice === "request"
            ? "Additional information request saved"
            : choice === "reject"
              ? "Rejection recorded"
              : "Suspension recorded",
      );
      close();
    } catch (err: any) {
      setDetailError(err.message || "An error occurred while saving decision");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  if (!enabled) return <NoPermission />;

  return (
    <>
      <label className="block max-w-sm">
        <span className="mb-2 block text-sm font-semibold">Review Action</span>
        <select
          aria-label="Review Action"
          value=""
          onChange={(event) => {
            const value = event.target.value as DoctorDecision | "";
            if (!value) return;
            setDetail("");
            setDetailError("");
            setRequestedDocs([]);
            busyRef.current = false;
            setBusy(false);
            setChoice(value);
          }}
          className={cn(
            "h-11 w-full rounded-xl border border-input bg-card px-3 text-[15px] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15",
            focusRing,
          )}
        >
          <option value="">Select an action</option>
          {reviewOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <AlertDialog open={choice !== null} onOpenChange={(open) => { if (!open) close(); }}>
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          {choice === "verify" ? (
            <VerifyDialog doctorName={doctor.name} missingChecks={missingChecks} error={detailError} />
          ) : null}
          {choice === "request" ? (
            <RequestDialog
              doctorName={doctor.name}
              documents={doctor.documents.map((document) => document.name)}
              detail={detail}
              error={detailError}
              requestedDocs={requestedDocs}
              onDetail={(value) => {
                setDetail(value);
                setDetailError("");
              }}
              onToggleDocument={(name) => {
                setRequestedDocs((current) =>
                  current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
                );
              }}
            />
          ) : null}
          {choice === "reject" ? (
            <ReasonDialog
              title="Reject application"
              description={`Reject ${doctor.name}'s application. The doctor record stays on file with your reason.`}
              label="Rejection reason"
              placeholder="Explain why this application is rejected..."
              detail={detail}
              error={detailError}
              onDetail={(value) => {
                setDetail(value);
                setDetailError("");
              }}
            />
          ) : null}
          {choice === "suspend" ? (
            <ReasonDialog
              title="Suspend doctor"
              description={`Suspending ${doctor.name} restricts this doctor's access and privileges. The doctor record is kept.`}
              label="Suspension reason"
              placeholder="Explain why this doctor is being suspended..."
              detail={detail}
              error={detailError}
              onDetail={(value) => {
                setDetail(value);
                setDetailError("");
              }}
            />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            {choice ? (
              <Button
                type="button"
                variant={choice === "reject" ? "destructive" : "default"}
                disabled={busy || (choice === "verify" && missingChecks.length > 0)}
                onClick={submit}
              >
                {choice === "verify"
                  ? "Confirm Verification"
                  : choice === "request"
                    ? "Send Request"
                    : choice === "reject"
                      ? "Confirm Rejection"
                      : "Confirm Suspension"}
              </Button>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function VerifyDialog({
  doctorName,
  missingChecks,
  error,
}: {
  doctorName: string;
  missingChecks: string[];
  error: string;
}) {
  return (
    <AlertDialogHeader>
      <AlertDialogTitle>Confirm verification</AlertDialogTitle>
      <AlertDialogDescription>
        {doctorName}&apos;s credentials have been verified. Confirm to record this decision.
      </AlertDialogDescription>
      {missingChecks.length > 0 ? (
        <p className="text-sm font-medium text-destructive">
          Complete the verification checklist on the Overview tab before confirming. Still required:{" "}
          {missingChecks.join(", ")}.
        </p>
      ) : null}
      {error && missingChecks.length === 0 ? (
        <p className="text-sm font-medium text-destructive">{error}</p>
      ) : null}
    </AlertDialogHeader>
  );
}

function RequestDialog({
  doctorName,
  documents,
  detail,
  error,
  requestedDocs,
  onDetail,
  onToggleDocument,
}: {
  doctorName: string;
  documents: string[];
  detail: string;
  error: string;
  requestedDocs: string[];
  onDetail: (value: string) => void;
  onToggleDocument: (name: string) => void;
}) {
  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Request Additional Information</AlertDialogTitle>
        <AlertDialogDescription>
          Specify the information or documents the doctor needs to provide before verification can
          continue.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="space-y-4">
        <div>
          <Label htmlFor="request-doctor">Doctor</Label>
          <p
            id="request-doctor"
            className="mt-2 rounded-xl border border-border bg-secondary px-3 py-2 text-sm font-medium"
          >
            {doctorName}
          </p>
        </div>
        <div>
          <Label htmlFor="information-required">Information Required</Label>
          <Textarea
            id="information-required"
            value={detail}
            rows={4}
            placeholder="Describe the additional information or documents required..."
            aria-invalid={error ? true : undefined}
            onChange={(event) => onDetail(event.target.value)}
            className="mt-2 rounded-xl px-4 py-3 text-[15px]"
          />
          {error ? <p className="mt-1 text-sm font-medium text-destructive">{error}</p> : null}
        </div>
        {documents.length > 0 ? (
          <fieldset>
            <legend className="text-sm font-medium">Optional supporting document request</legend>
            <ul className="mt-2 space-y-2">
              {documents.map((name) => (
                <li key={name}>
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={requestedDocs.includes(name)}
                      onChange={() => onToggleDocument(name)}
                    />
                    <span>Request resubmission of {name}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ) : null}
      </div>
    </>
  );
}

function ReasonDialog({
  title,
  description,
  label,
  placeholder,
  detail,
  error,
  onDetail,
}: {
  title: string;
  description: string;
  label: string;
  placeholder: string;
  detail: string;
  error: string;
  onDetail: (value: string) => void;
}) {
  const fieldId = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <div>
        <Label htmlFor={fieldId}>{label}</Label>
        <Textarea
          id={fieldId}
          value={detail}
          rows={4}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onDetail(event.target.value)}
          className="mt-2 rounded-xl px-4 py-3 text-[15px]"
        />
        {error ? <p className="mt-1 text-sm font-medium text-destructive">{error}</p> : null}
      </div>
    </>
  );
}

function statusText(status: string | undefined) {
  if (!status) return "";
  return (doctorStatuses as readonly string[]).includes(status)
    ? doctorStatusLabel(status as DoctorStatus)
    : status;
}

function DoctorHistory({ items }: { items: HistoryEntry[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No history yet.</p>;
  }
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={`${item.at}-${index}`} className="flex gap-3 text-sm">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          <div className="min-w-0">
            {item.action ? (
              <>
                <p className="font-semibold">{item.action}</p>
                <dl className="mt-1 space-y-1">
                  {item.fromStatus ? (
                    <div>
                      <dt className="inline text-muted-foreground">Previous status </dt>
                      <dd className="inline">{statusText(item.fromStatus)}</dd>
                    </div>
                  ) : null}
                  {item.toStatus ? (
                    <div>
                      <dt className="inline text-muted-foreground">New status </dt>
                      <dd className="inline">{statusText(item.toStatus)}</dd>
                    </div>
                  ) : null}
                  {item.reason ? (
                    <div>
                      <dt className="text-muted-foreground">Reason</dt>
                      <dd className="whitespace-pre-wrap">{item.reason}</dd>
                    </div>
                  ) : null}
                </dl>
              </>
            ) : (
              <p>{item.text}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {item.at} · {item.by}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
