import { createFileRoute } from "@tanstack/react-router";
import { FeedbackPage } from "@/features/admin/feedback-page";

export const Route = createFileRoute("/admin/feedback")({
  head: () => ({
    meta: [
      { title: "Feedback management — Meyveda Grantha" },
      {
        name: "description",
        content: "Manage doctor and partner platform suggestions, complaints, reviews, and satisfaction feedback.",
      },
    ],
  }),
  component: FeedbackPage,
});

export { FeedbackPage };
