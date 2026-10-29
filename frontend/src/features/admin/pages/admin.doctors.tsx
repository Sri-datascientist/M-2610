import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/doctors")({
  component: DoctorsSection,
});

export function DoctorsSection() {
  return <Outlet />;
}
