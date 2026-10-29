import { createFileRoute } from "@tanstack/react-router";
import { doctorStatuses, type DoctorStatus } from "@/features/admin/catalog-data";
import { DoctorsDirectory } from "@/features/admin/doctors-page";

function doctorSearch(search: Record<string, unknown>): { status?: DoctorStatus } {
  const status = search["status"];
  if (typeof status === "string" && (doctorStatuses as readonly string[]).includes(status)) {
    return { status: status as DoctorStatus };
  }
  return {};
}

export const Route = createFileRoute("/admin/doctors/")({
  validateSearch: doctorSearch,
  head: () => ({
    meta: [
      { title: "Doctor verification and management — meyveda" },
      {
        name: "description",
        content: "Review practitioner profiles and verification applications.",
      },
    ],
  }),
  component: DoctorsDirectory,
});
