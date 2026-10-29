import { Link, createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { PageHeader } from "@/components/portal/brand";
import { Button } from "@/components/ui/button";
import { findDoctorBySlug } from "@/features/admin/doctor-slug";
import { DoctorDetail } from "@/features/admin/doctors-page";
import { useCatalog } from "@/features/admin/catalog-state";
import { useStore } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/doctors/$doctorSlug")({
  head: () => ({
    meta: [
      { title: "Doctor verification and management — Meyveda" },
      {
        name: "description",
        content: "Review a practitioner profile and verification application.",
      },
    ],
  }),
  component: DoctorProfilePage,
});

export function DoctorProfilePage() {
  const params = useParams({ strict: false }) as { doctorSlug?: string };
  const doctorSlug = params?.doctorSlug || "";
  const { doctors, isLoadingDoctors, setChecklist, addDoctorNote, decideDoctor } = useCatalog();
  const { can } = useStore();
  const navigate = useNavigate();
  const doctor = findDoctorBySlug(doctors, doctorSlug);

  if (!doctor) {
    if (isLoadingDoctors) {
      return (
        <div>
          <PageHeader
            title="Doctors"
            subtitle="Review practitioner profiles and verification applications."
          />
          <section className="card-surface px-6 py-12 text-center">
            <h2 className="text-lg font-semibold">Loading doctor profile...</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Retrieving practitioner credentials from database.
            </p>
          </section>
        </div>
      );
    }
    return (
      <div>
        <PageHeader
          title="Doctors"
          subtitle="Review practitioner profiles and verification applications."
        />
        <section className="card-surface px-6 py-12 text-center">
          <h2 className="text-lg font-semibold">Doctor not found</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            This link does not match a doctor on file.
          </p>
          <Button asChild className="mt-6">
            <Link to="/admin/doctors" activeOptions={{ exact: true }}>
              Back to doctors
            </Link>
          </Button>
        </section>
      </div>
    );
  }

  return (
    <DoctorDetail
      doctor={doctor}
      enabled={can("manage")}
      onBack={() => {
        void navigate({ to: "/admin/doctors" });
      }}
      onChecklist={(index, done) => setChecklist(doctor.id, index, done)}
      onNote={(text) => addDoctorNote(doctor.id, text)}
      onDecide={(decision, reason, documents) =>
        decideDoctor(doctor.id, decision, reason, documents)
      }
    />
  );
}
