import { createFileRoute } from "@tanstack/react-router";
import { DoctorsDirectory } from "@/features/admin/doctors-page";

export const Route = createFileRoute("/admin/doctors")({
  head: () => ({
    meta: [
      { title: "Doctor verification and management — Meyveda" },
      {
        name: "description",
        content: "Review practitioner profiles and verification applications.",
      },
    ],
  }),
  component: DoctorsSection,
});

export function DoctorsSection() {
  return <DoctorsDirectory />;
}
