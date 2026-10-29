import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import {
  buildReports,
  filterReports,
  reportCategories,
  toCsv,
  type ReportCategory,
  type ReportRow,
} from "@/features/admin/administration-data";
import { useAdministration } from "@/features/admin/administration-state";
import { useCatalog } from "@/features/admin/catalog-state";
import { DirectoryShell } from "@/features/admin/compliance-ui";
import { useCompliance } from "@/features/admin/compliance-state";
import { DateField, SelectField } from "@/features/admin/fields";
import { recorded, ReviewBadge } from "@/features/admin/review-ui";

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ReportsWorkspace() {
  const { doctors, manufacturers } = useCatalog();
  const { submissions, batches, safety, cases } = useCompliance();
  const { audit, access, recordExport } = useAdministration();
  const [category, setCategory] = useState<ReportCategory>("Doctor Verification");
  const [status, setStatus] = useState("all");
  const [reviewer, setReviewer] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const allRows = useMemo(
    () => buildReports({ doctors, manufacturers, submissions, batches, safety, cases, audit }),
    [doctors, manufacturers, submissions, batches, safety, cases, audit],
  );
  const inCategory = useMemo(
    () => allRows.filter((row) => row.category === category),
    [allRows, category],
  );
  const rangeError = Boolean(from && to && from > to);
  const rows = useMemo(
    () => (rangeError ? [] : filterReports(allRows, { category, status, reviewer, from, to })),
    [allRows, category, status, reviewer, from, to, rangeError],
  );
  const statuses = useMemo(() => [...new Set(inCategory.map((row) => row.status))], [inCategory]);
  const reviewers = useMemo(
    () => [...new Set(inCategory.map((row) => row.reviewer))],
    [inCategory],
  );
  const reviewerLabel = category === "Platform Activity" ? "User" : "Reviewer";

  const columns: Column<ReportRow>[] = [
    { header: "Subject", cell: (row) => <span className="font-semibold">{row.subject}</span> },
    { header: "Status", cell: (row) => <ReviewBadge status={row.status} /> },
    { header: reviewerLabel, cell: (row) => row.reviewer },
    { header: "Date", cell: (row) => row.dateLabel },
    { header: "Detail", cell: (row) => row.detail },
  ];

  return (
    <DirectoryShell
      title="Reports"
      subtitle="Administrative reports across verification, quality, safety, and platform activity."
      action={
        access.export ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (!rows.length) {
                toast.error("There are no rows to export.");
                return;
              }
              const result = recordExport(category, `${rows.length} rows from ${category}.`);
              if (!result.ok) {
                toast.error(result.message);
                return;
              }
              downloadCsv(
                `meyveda-${category.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}.csv`,
                toCsv(
                  ["Subject", "Status", reviewerLabel, "Date", "Detail"],
                  rows.map((row) => [
                    row.subject,
                    row.status,
                    row.reviewer,
                    row.dateLabel,
                    row.detail,
                  ]),
                ),
              );
              recorded("Report exported");
            }}
          >
            Export
          </Button>
        ) : null
      }
      filters={
        <>
          <SelectField
            label="Module"
            value={category}
            onChange={(value) => {
              setCategory(value as ReportCategory);
              setStatus("all");
              setReviewer("all");
            }}
            options={reportCategories.map((item) => ({ value: item, label: item }))}
          />
          <SelectField
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All statuses" },
              ...statuses.map((item) => ({ value: item, label: item })),
            ]}
          />
          <SelectField
            label={reviewerLabel}
            value={reviewer}
            onChange={setReviewer}
            options={[
              {
                value: "all",
                label: category === "Platform Activity" ? "All users" : "All reviewers",
              },
              ...reviewers.map((item) => ({ value: item, label: item })),
            ]}
          />
          <DateField label="From" value={from} onChange={setFrom} />
          <DateField label="To" value={to} onChange={setTo} />
        </>
      }
      table={
        <>
          <p className="px-5 pt-4 text-sm text-muted-foreground">
            {rangeError ? "The start date is after the end date." : `${rows.length} records`}
          </p>
          <DataTable
            key={`${category}|${status}|${reviewer}|${from}|${to}`}
            rows={rows}
            columns={columns}
            pageSize={8}
          />
        </>
      }
    />
  );
}
