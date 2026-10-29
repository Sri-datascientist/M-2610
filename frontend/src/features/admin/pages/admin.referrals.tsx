import { createFileRoute } from "@tanstack/react-router";
import { ReferralScoresPage } from "@/features/admin/referral-page";

export const Route = createFileRoute("/admin/referrals")({
  head: () => ({
    meta: [
      { title: "Referral scores — Meyveda Grantha" },
      {
        name: "description",
        content: "Practitioner referral metrics, objective clinical scoring formula, and ranking leaderboard.",
      },
    ],
  }),
  component: ReferralScoresPage,
});
