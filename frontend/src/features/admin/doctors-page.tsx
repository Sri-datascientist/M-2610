import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
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

const doctorsRoute = getRouteApi("/admin/doctors");

export function DoctorsDirectory() {
  const { doctors } = useCatalog();
  const { status: requestedStatus } = (doctorsRoute.useSearch() ?? {}) as { status?: DoctorStatus | undefined };
  const updateSearch = doctorsRoute.useNavigate();
  const navigate = useNavigate();
  const slugs = useMemo(() => doctorSlugMap(doctors), [doctors]);
  const openDoctor = (doctor: Doctor) => {
    const doctorSlug = slugs.get(doctor.id);
    if (!doctorSlug) return;
    void navigate({ to: "/admin/doctors/$doctorSlug", params: { doctorSlug } });
  };
  const status: DoctorStatus | "all" = requestedStatus ?? "all";
  const setStatus = (
    next: DoctorStatus | "all" | ((current: DoctorStatus | "all") => DoctorStatus | "all"),
  ) => {
    const value = typeof next === "function" ? next(status) : next;
    void (updateSearch as any)({
      search: value === "all" ? {} : { status: value },
      replace: true,
    });
  };
  const [query, setQuery] = useState("");
  const [specialization, setSpecialization] = useState<string>("all");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return doctors.filter((doctor) => {
      const haystack = `${doctor.name} ${doctor.registrationNumber} ${doctor.city} ${doctor.state} ${doctor.pincode}`.toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (status !== "all" && doctor.status !== status) return false;
      if (specialization !== "all" && doctor.specialization !== specialization) return false;
      return true;
    });
  }, [doctors, query, status, specialization]);

  const count = (value: DoctorStatus) => doctors.filter((doctor) => doctor.status === value).length;

  const columns: Column<Doctor>[] = [
    {
      header: "Doctor",
      cell: (row) => (
        <Link
          to="/admin/doctors/$doctorSlug"
          params={{ doctorSlug: slugs.get(row.id) ?? row.id }}
          className="font-semibold hover:text-primary"
          onClick={(event) => event.stopPropagation()}
        >
          {row.name}
        </Link>
      ),
    },
    { header: "Specialization", cell: (row) => row.specialization },
    { header: "Registration", cell: (row) => row.registrationNumber },
    {
      header: "Location",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.city}, {row.state} ({row.pincode})
        </span>
      ),
    },
    { header: "Submitted Date", cell: (row) => row.submittedDate },
    { header: "Status", cell: (row) => <ReviewBadge status={doctorStatusLabel(row.status)} /> },
    {
      header: "Actions",
      cell: (row) => (
        <Button asChild size="sm" variant="outline">
          <Link
            to="/admin/doctors/$doctorSlug"
            params={{ doctorSlug: slugs.get(row.id) ?? row.id }}
            onClick={(event) => event.stopPropagation()}
          >
            Review
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Doctor verification and management"
        subtitle="Review practitioner profiles and verification applications."
      />
      <SummaryRow
        items={[
          {
            label: doctorStatusLabel("Pending Review"),
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
        ]}
      />
      <section className="card-surface">
        <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SearchField
              label="Search"
              value={query}
              onChange={setQuery}
              placeholder="Doctor name or registration number"
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
        <DataTable
          key={`${query}|${status}|${specialization}`}
          rows={rows}
          columns={columns}
          onRowClick={openDoctor}
          pageSize={6}
        />
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
  onNote: (text: string) => void;
  onDecide: (
    decision: DoctorDecision,
    reason: string,
    documents?: string[],
  ) => { ok: true } | { ok: false; message: string };
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
          <h2 className="type-record">{doctor.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {doctor.specialization} · {doctor.registrationNumber}
          </p>
        </div>
        <ReviewBadge status={doctorStatusLabel(doctor.status)} />
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
            <DetailSection title="Professional profile">
              <MetaList
                rows={[
                  { label: "Email", value: doctor.email },
                  { label: "Phone", value: doctor.phone },
                  { label: "Address", value: doctor.address || "Not specified" },
                  { label: "City", value: doctor.city },
                  { label: "State", value: doctor.state },
                  { label: "PIN Code", value: doctor.pincode },
                  { label: "Experience", value: doctor.experience },
                  { label: "Languages", value: doctor.languages },
                ]}
              />
            </DetailSection>
            <DetailSection title="Verification checklist">
              <ul className="space-y-2">
                {doctor.checklist.map((item, index) => (
                  <li key={item.label}>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={item.done}
                        disabled={!enabled || closed}
                        onChange={() => onChecklist(index, !item.done)}
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
  ) => { ok: true } | { ok: false; message: string };
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

  const submit = () => {
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
    const result = onDecide(choice, detail.trim(), choice === "request" ? requestedDocs : []);
    busyRef.current = false;
    setBusy(false);
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
