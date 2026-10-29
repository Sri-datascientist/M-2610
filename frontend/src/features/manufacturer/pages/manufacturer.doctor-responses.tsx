import { createFileRoute } from "@tanstack/react-router";
import { DoctorResponsesPage } from "@/features/manufacturer/DoctorResponsesPage";

export const Route = createFileRoute("/manufacturer/doctor-responses")({
  head: () => ({
    meta: [
      { title: "Doctor Responses — meyveda" },
      { name: "description", content: "Doctor clinical experiences and responses to Ayurvedic formulations." },
    ],
  }),
  component: DoctorResponsesPage,
});
