import { createFileRoute, Link } from "@tanstack/react-router";
import { X, GitCompare, Sparkles, ExternalLink, ShieldAlert, BookOpen } from "lucide-react";
import { Btn, Empty, EvidencePill, PageHeader, Pill, SaveButton } from "@/components/ui-kit";
import {
  ingById,
  medById,
  medicines,
  mfrById,
  refById,
  type Medicine,
} from "@/lib/mock-data";
import { actions, setState, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_ws/compare")({
  head: () =>
    seo(
      "Compare Medicines",
      "Side-by-side pharmacological comparison of Ayurvedic formulations, ingredients, Rasa, Virya, Vipaka, Anupana and reference citations.",
    ),
  component: Compare,
});

export function Compare() {
  const ids = useStore((s) => s.compare);
  const meds = ids
    .map((id) => medById(id))
    .filter((m): m is Medicine => Boolean(m));

  const rows: [string, string, (m: Medicine) => React.ReactNode][] = [
    ["Form", "Dosage form", (m) => <Pill t="outline">{m.form}</Pill>],
    ["Category", "Therapeutic class", (m) => <Pill t="orange">{m.category}</Pill>],
    ["Evidence Status", "Documentary verification", (m) => <EvidencePill s={m.evidence} />],
    [
      "Botanical Ingredients",
      "Key ingredients and ratios",
      (m) =>
        m.ingredients.length > 0 ? (
          <ul className="space-y-1 text-xs">
            {m.ingredients.map((i) => {
              const ing = ingById(i.ingredientId);
              return (
                <li key={i.ingredientId} className="flex items-center justify-between gap-1">
                  <span className="font-medium text-foreground">
                    {ing?.name ?? i.ingredientId}
                    {ing?.latin && <span className="italic text-muted-foreground ml-1">({ing.latin})</span>}
                  </span>
                  <span className="text-muted-foreground shrink-0">{i.ratio}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            Single drug or monograph pending import
          </span>
        ),
    ],
    [
      "Rasa (Taste)",
      "Panchamahabhuta elemental taste",
      (m) =>
        m.rasa.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {m.rasa.map((r) => (
              <span key={r} className="rounded bg-surface px-1.5 py-0.5 text-xs font-medium">
                {r}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Not specified</span>
        ),
    ],
    [
      "Guna (Attributes)",
      "Qualities affecting dispersion",
      (m) =>
        m.guna.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {m.guna.map((g) => (
              <span key={g} className="rounded bg-surface px-1.5 py-0.5 text-xs font-medium">
                {g}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Not specified</span>
        ),
    ],
    [
      "Virya (Potency)",
      "Heating or cooling metabolic power",
      (m) => (
        <span className="text-xs font-semibold text-foreground">
          {m.virya || <span className="text-muted-foreground italic">Not specified</span>}
        </span>
      ),
    ],
    [
      "Vipaka (Post-Digestive)",
      "Metabolic end-transformation",
      (m) => (
        <span className="text-xs font-semibold text-foreground">
          {m.vipaka || <span className="text-muted-foreground italic">Not specified</span>}
        </span>
      ),
    ],
    [
      "Karma (Actions)",
      "Documented physiological actions",
      (m) =>
        m.karma.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {m.karma.map((k) => (
              <span key={k} className="rounded-full border bg-card px-2 py-0.5 text-[11px] font-medium">
                {k}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Not specified</span>
        ),
    ],
    [
      "Recommended Anupana",
      "Catalytic vehicle / carrier",
      (m) =>
        m.anupana && m.anupana.length > 0 ? (
          <ul className="list-inside list-disc space-y-0.5 text-xs text-foreground">
            {m.anupana.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            Ushnodaka (Warm water) or as advised by Vaidya
          </span>
        ),
    ],
    [
      "Traditional Indications",
      "Classical disease mentions",
      (m) => (
        <ul className="list-inside list-disc space-y-0.5 text-xs text-foreground/90">
          {m.traditionalIndications.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      ),
    ],
    [
      "Contraindications",
      "Traditional cautionary notes",
      (m) =>
        m.contraindications && m.contraindications.length > 0 ? (
          <div className="text-xs text-destructive space-y-0.5">
            {m.contraindications.map((c) => (
              <div key={c} className="flex items-start gap-1">
                <ShieldAlert className="h-3 w-3 mt-0.5 shrink-0" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No specific contraindications recorded</span>
        ),
    ],
    [
      "Manufacturer & Licencing",
      "Producing company details",
      (m) => {
        const mfr = mfrById(m.manufacturerId);
        return mfr ? (
          <div className="text-xs">
            <Link
              to="/manufacturers"
              search={{ id: mfr.id }}
              className="font-semibold text-primary hover:underline flex items-center gap-1"
            >
              {mfr.name} <ExternalLink className="h-3 w-3" />
            </Link>
            <div className="text-muted-foreground mt-0.5">{mfr.city}, {mfr.state}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Lic: {mfr.licence}</div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Manufacturer information pending</span>
        );
      },
    ],
    [
      "Classical Reference",
      "Authoritative text citations",
      (m) => (
        <div className="space-y-1 text-xs">
          {m.referenceIds.map((id) => {
            const r = refById(id);
            return r ? (
              <div key={id}>
                <Link
                  to="/library"
                  search={{ ref: r.id }}
                  className="font-medium text-primary hover:underline flex items-center gap-1"
                >
                  <BookOpen className="h-3 w-3 shrink-0" />
                  {r.title} ({r.code})
                </Link>
                <div className="text-[11px] text-muted-foreground">{r.part} · {r.entry}</div>
              </div>
            ) : null;
          })}
          {m.referenceIds.length === 0 && (
            <span className="text-muted-foreground italic">No linked references</span>
          )}
        </div>
      ),
    ],
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Discovery & Analysis"
        title="Compare Medicines"
        desc="Side-by-side pharmacological and reference comparison of up to 3 Ayurvedic medicines. Useful for formulating clinical protocols and evaluating therapeutic alternatives."
        actions={
          meds.length > 0 ? (
            <Btn
              variant="outline"
              onClick={() => setState(() => ({ compare: [] }))}
              className="hover:border-destructive hover:text-destructive"
            >
              Clear comparison ({meds.length})
            </Btn>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        {meds.length === 0 ? (
          <Empty
            title="No medicines selected for comparison"
            desc="Add formulations or choose from the classical database to evaluate their Ayurvedic properties side by side."
            action={
              <Link
                to="/library"
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-ink-foreground hover:bg-ink/90 transition-colors"
              >
                <GitCompare className="h-4 w-4" />
                Browse Classical Library
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Comparing {meds.length} formulation{meds.length === 1 ? "" : "s"}
              </span>
              <span className="italic">
                Comparison highlights documented properties; differences do not imply therapeutic superiority or equivalence.
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
              <table className="w-full min-w-[700px] text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-surface">
                    <th className="w-52 p-4 text-left border-r font-semibold">
                      <span className="eyebrow block">Attribute</span>
                      <span className="text-[11px] font-normal text-muted-foreground">
                        Classical parameters
                      </span>
                    </th>
                    {meds.map((m) => (
                      <th key={m.id} className="p-4 text-left align-top border-r last:border-r-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-foreground text-base">
                              {m.name}
                            </span>
                            {m.synonyms.length > 0 && (
                              <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                                {m.synonyms[0]}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => actions.toggleCompare(m.id)}
                            aria-label={`Remove ${m.name} from comparison`}
                            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <SaveButton id={m.id} kind="medicine" />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, sub, render], idx) => (
                    <tr
                      key={label}
                      className={idx % 2 === 0 ? "border-b bg-card" : "border-b bg-surface/30"}
                    >
                      <td className="p-3.5 border-r align-top">
                        <div className="text-xs font-bold text-foreground">{label}</div>
                        <div className="text-[10px] text-muted-foreground">{sub}</div>
                      </td>
                      {meds.map((m) => (
                        <td
                          key={m.id}
                          className="p-3.5 align-top border-r last:border-r-0 text-foreground"
                        >
                          {render(m)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Add Tray */}
        {meds.length < 3 && (
          <div className="rounded-xl border bg-surface/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="eyebrow text-foreground">
                Quick-add formulation to comparison ({3 - meds.length} slot{3 - meds.length === 1 ? "" : "s"} available):
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {medicines
                .filter((m) => !ids.includes(m.id))
                .map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => actions.toggleCompare(m.id)}
                    className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    + {m.name}
                    <span className="text-[10px] text-muted-foreground font-normal">({m.form})</span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
