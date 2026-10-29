import { createFileRoute } from "@tanstack/react-router";
import { DoctorFeedbackPage } from "@/features/manufacturer/DoctorFeedbackPage";

export const Route = createFileRoute("/manufacturer/doctor-feedback")({
  head: () => ({
    meta: [
      { title: "Doctor Feedback — meyveda" },
      { name: "description", content: "Review and respond to technical and clinical doctor formulation inquiries." },
    ],
  }),
  component: DoctorFeedbackPage,
});
