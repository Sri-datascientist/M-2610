import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Sparkles, Clock, CheckCircle } from "lucide-react";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_ws/survey")({
  head: () =>
    seo(
      "Practitioner Survey | Meyveda",
      "Participate in the Meyveda clinical practice and AYUSH intelligence survey.",
    ),
  component: SurveyPage,
});

export function SurveyPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8">
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-soft space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Practitioner Clinical Survey
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              AYUSH Clinical Practice & Pharmacovigilance Feedback
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary-soft/40 p-6 space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Clock className="h-4 w-4" />
            <span>Survey Opening Shortly</span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Thank you for being part of the Meyveda early access practitioner network. This survey module is being configured for clinical questions, classical formulary usage patterns, and research case preferences.
          </p>
          <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span>Your practitioner profile is registered for early access.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SurveyPage;

