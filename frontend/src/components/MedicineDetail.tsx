import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  GitCompare,
  Info,
  Factory,
  BookOpen,
  FileCheck2,
  Search,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import {
  AYURVEDIC_GLOSSARY,
  batches,
  ingById,
  medById,
  mfrById,
  refById,
  type Medicine,
} from "@/lib/mock-data";
import { actions, useStore } from "@/lib/store";
import { EvidencePill, Pill, SaveButton } from "./ui-kit";
import { cn } from "@/lib/utils";
import triphala from "@/assets/triphala.jpg";
import herbs from "@/assets/herbs.jpg";

const TABS = ["Overview", "Ingredients", "References", "Quality", "Related"] as const;

export function MedicineDetail({ m }: { m: Medicine }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const compare = useStore((s) => s.compare);
  const mfr = mfrById(m.manufacturerId);
  const img = m.image === "triphala" ? triphala : m.image === "herbs" ? herbs : null;
  const mb = batches.filter((b) => b.medicineId === m.id);

  return (
    <article className="space-y-6">
      <div className="grid gap-5 md:grid-cols-[180px_1fr]">
        <div className="aspect-square overflow-hidden rounded-xl border bg-primary-soft">
          {img ? (
            <img
              src={img}
              alt={m.name}
              width={1280}
              height={960}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center font-display text-4xl font-bold text-primary/50">
              {m.name[0]}
            </div>
          )}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill t="outline">{m.form}</Pill>
            <Pill t="orange">{m.category}</Pill>
            <EvidencePill s={m.evidence} />
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{m.name}</h2>
          {m.synonyms.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Traditional & alternate names: {m.synonyms.join(", ")}
            </p>
          )}
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">{m.summary}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <SaveButton id={m.id} kind="medicine" />
            <button
              type="button"
              onClick={() => actions.toggleCompare(m.id)}
              aria-pressed={compare.includes(m.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                compare.includes(m.id)
                  ? "border-ink bg-ink text-ink-foreground"
                  : "bg-card hover:border-primary/50",
              )}
            >
              <GitCompare className="h-3.5 w-3.5" />
              {compare.includes(m.id) ? "In comparison (selected)" : "Add to compare"}
            </button>
            <Link
              to="/adr"
              search={{ medicine: m.name }}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 text-xs font-semibold hover:border-destructive/50 hover:text-destructive transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Report a Side Effect
            </Link>
          </div>
        </div>
      </div>

      <div role="tablist" aria-label="Medicine details" className="flex gap-1 overflow-x-auto border-b">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "relative px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap",
              tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
            {t === "Ingredients" && m.ingredients.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.2 text-[10px] text-foreground font-semibold">
                {m.ingredients.length}
              </span>
            )}
            {t === "References" && m.referenceIds.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.2 text-[10px] text-foreground font-semibold">
                {m.referenceIds.length}
              </span>
            )}
            {tab === t && (
              <motion.span
                layoutId="med-tab"
                className="absolute inset-x-1 -bottom-px h-0.5 rounded bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "Overview" && (
            <div className="space-y-5">
              {/* Ayurvedic Properties Matrix */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="eyebrow flex items-center gap-1 text-primary">
                    <Sparkles className="h-3.5 w-3.5" /> Ayurvedic Pharmacological Profile
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Sanskrit terminology preserved with clinical explanations
                  </span>
                </div>
                <div className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
                  {/* Rasa */}
                  <div className="bg-card p-3.5">
                    <div className="eyebrow flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Rasa (रस) <span className="text-[10px] font-normal text-muted-foreground">Taste</span>
                      </span>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {m.rasa.map((r) => {
                        const info = AYURVEDIC_GLOSSARY.rasa[r];
                        return (
                          <span
                            key={r}
                            title={info ? `${info.sanskrit} (${info.english}): ${info.desc}` : r}
                            className="inline-flex items-center gap-1 rounded bg-surface px-2 py-0.5 text-xs font-semibold"
                          >
                            {r}
                            {info && <span className="text-[10px] text-muted-foreground font-normal">({info.english})</span>}
                          </span>
                        );
                      })}
                    </div>
                    <div className="mt-1.5 text-[11px] text-muted-foreground">
                      {m.rasa.map((r) => AYURVEDIC_GLOSSARY.rasa[r]?.desc).filter(Boolean).slice(0, 1).join(" ")}
                    </div>
                  </div>

                  {/* Guna */}
                  <div className="bg-card p-3.5">
                    <div className="eyebrow flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Guna (गुण) <span className="text-[10px] font-normal text-muted-foreground">Attributes</span>
                      </span>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {m.guna.map((g) => {
                        const info = AYURVEDIC_GLOSSARY.guna[g];
                        return (
                          <span
                            key={g}
                            title={info ? `${info.sanskrit} (${info.english}): ${info.desc}` : g}
                            className="inline-flex items-center gap-1 rounded bg-surface px-2 py-0.5 text-xs font-semibold"
                          >
                            {g}
                            {info && <span className="text-[10px] text-muted-foreground font-normal">({info.english})</span>}
                          </span>
                        );
                      })}
                    </div>
                    <div className="mt-1.5 text-[11px] text-muted-foreground">
                      Physical attributes determining digestibility and bodily dispersion.
                    </div>
                  </div>

                  {/* Virya */}
                  <div className="bg-card p-3.5">
                    <div className="eyebrow flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Virya (वीर्य) <span className="text-[10px] font-normal text-muted-foreground">Potency</span>
                      </span>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="mt-1.5 text-sm font-semibold">
                      {m.virya}
                      {AYURVEDIC_GLOSSARY.virya[m.virya] && (
                        <span className="ml-1 text-xs text-muted-foreground font-normal">
                          ({AYURVEDIC_GLOSSARY.virya[m.virya]?.english})
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {AYURVEDIC_GLOSSARY.virya[m.virya]?.desc ?? "Thermal and biological potency."}
                    </div>
                  </div>

                  {/* Vipaka */}
                  <div className="bg-card p-3.5">
                    <div className="eyebrow flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Vipaka (विपाक) <span className="text-[10px] font-normal text-muted-foreground">Post-digestive</span>
                      </span>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="mt-1.5 text-sm font-semibold">
                      {m.vipaka}
                      {AYURVEDIC_GLOSSARY.vipaka[m.vipaka] && (
                        <span className="ml-1 text-xs text-muted-foreground font-normal">
                          ({AYURVEDIC_GLOSSARY.vipaka[m.vipaka]?.english})
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {AYURVEDIC_GLOSSARY.vipaka[m.vipaka]?.desc ?? "Metabolic end-transformation."}
                    </div>
                  </div>

                  {/* Karma */}
                  <div className="bg-card p-3.5 sm:col-span-2">
                    <div className="eyebrow flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Karma (कर्म) <span className="text-[10px] font-normal text-muted-foreground">Therapeutic actions</span>
                      </span>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {m.karma.map((k) => {
                        const info = AYURVEDIC_GLOSSARY.karma[k];
                        return (
                          <span
                            key={k}
                            title={info ? `${info.sanskrit} (${info.english}): ${info.desc}` : k}
                            className="inline-flex items-center gap-1 rounded-full border bg-surface px-2.5 py-0.5 text-xs font-semibold text-foreground"
                          >
                            {k}
                            {info && <span className="text-[10px] text-muted-foreground font-normal">· {info.english}</span>}
                          </span>
                        );
                      })}
                    </div>
                    <div className="mt-1.5 text-[11px] text-muted-foreground">
                      Documented physiological actions in classical Ayurveda pharmacopoeia.
                    </div>
                  </div>
                </div>
              </div>

              {/* Anupana (Accompanying Vehicle) */}
              <div className="rounded-xl border bg-card p-4">
                <div className="eyebrow mb-2 flex items-center gap-1.5 text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> Recommended Anupana (अनुपान — Catalytic Vehicle)
                </div>
                {m.anupana && m.anupana.length > 0 ? (
                  <div className="space-y-2">
                    <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
                      {m.anupana.map((a) => (
                        <li key={a} className="leading-relaxed">
                          <span className="font-semibold">{a}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-muted-foreground">
                      Anupana directs and facilitates bioavailability through designated bodily channels (Srotas).
                    </p>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">Standard vehicle: Ushnodaka (Lukewarm water)</p>
                    <p className="mt-1">
                      Specific Anupana varies based on patient constitution (Prakriti), disease state (Vikriti), and season (Ritu). Consult classical formulation monographs for tailored vehicles.
                    </p>
                  </div>
                )}
              </div>

              {/* Traditional Indications & Evidence Status */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border bg-surface p-4">
                  <div className="eyebrow mb-2">Traditional Indications (Rogaghnata)</div>
                  <ul className="list-inside list-disc space-y-1 text-sm text-foreground/90">
                    {m.traditionalIndications.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    As documented in classical literature. These describe traditional indications and do not constitute automated treatment directives.
                  </p>
                </div>

                <div className="rounded-xl border border-dashed bg-card p-4">
                  <div className="eyebrow mb-2">Clinical Evidence & Verification Status</div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{m.clinicalEvidenceNote}</p>
                  {m.contraindications && m.contraindications.length > 0 && (
                    <div className="mt-3 rounded-lg bg-destructive-soft p-3 text-xs">
                      <div className="flex items-center gap-1 font-bold text-destructive">
                        <ShieldAlert className="h-3.5 w-3.5" /> Classical Contraindications
                      </div>
                      <ul className="mt-1 list-inside list-disc space-y-0.5 text-muted-foreground">
                        {m.contraindications.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Illustrative records are distinct from independently verified laboratory batches and gazetted monographs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === "Ingredients" && (
            m.ingredients.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Ingredient records for this formulation are pending digitized monograph import.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{m.ingredients.length} botanical & classical ingredients</span>
                  <span>Click an ingredient to expand monograph or discover related formulations</span>
                </div>
                {m.ingredients.map((x) => {
                  const ing = ingById(x.ingredientId);
                  if (!ing) {
                    return (
                      <div
                        key={x.ingredientId}
                        className="rounded-xl border bg-card p-4 text-xs text-muted-foreground"
                      >
                        Ingredient monograph pending import for {x.ingredientId} ({x.quantity})
                      </div>
                    );
                  }
                  return (
                    <details
                      key={ing.id}
                      className="group rounded-xl border bg-card p-4 open:shadow-soft transition-all"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                        <div>
                          <span className="font-bold text-foreground text-sm">{ing.name}</span>
                          <span className="ml-2 text-xs italic text-muted-foreground">{ing.latin}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">{x.quantity}</span>
                          <Pill t="orange">{x.ratio}</Pill>
                        </div>
                      </summary>

                      <div className="mt-3 grid gap-2 border-t pt-3 text-xs sm:grid-cols-3">
                        <div>
                          <span className="eyebrow block">Part used</span>
                          <span className="font-medium text-foreground">{ing.part}</span>
                        </div>
                        <div>
                          <span className="eyebrow block">Rasa</span>
                          <span className="font-medium text-foreground">{ing.rasa.join(", ")}</span>
                        </div>
                        <div>
                          <span className="eyebrow block">Virya / Vipaka</span>
                          <span className="font-medium text-foreground">{ing.virya} / {ing.vipaka}</span>
                        </div>
                        <div>
                          <span className="eyebrow block">Guna</span>
                          <span className="font-medium text-foreground">{ing.guna.join(", ")}</span>
                        </div>
                        <div>
                          <span className="eyebrow block">Karma</span>
                          <span className="font-medium text-foreground">{ing.karma.join(", ")}</span>
                        </div>
                        <div>
                          <span className="eyebrow block">Synonyms</span>
                          <span className="font-medium text-foreground">{ing.synonyms.join(", ")}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                        <SaveButton id={ing.id} kind="ingredient" />
                        <Link
                          to="/medicines"
                          search={{ q: ing.name }}
                          className="inline-flex items-center gap-1.5 rounded-lg border bg-surface px-2.5 py-1 text-xs font-semibold text-primary hover:border-primary transition-colors"
                        >
                          <Search className="h-3 w-3" /> Search all medicines containing {ing.name}
                        </Link>
                      </div>
                    </details>
                  );
                })}
              </div>
            )
          )}

          {tab === "References" && (
            m.referenceIds.length === 0 ? (
              <p className="text-sm text-muted-foreground">No linked references yet.</p>
            ) : (
              <ul className="space-y-3">
                {m.referenceIds.map((id) => {
                  const r = refById(id);
                  if (!r) return null;
                  return (
                    <li key={id} className="rounded-xl border bg-card p-4 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <BookOpen className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                          <div>
                            <div className="text-sm font-bold text-foreground">
                              {r.title}
                              <Pill t="outline" className="ml-1.5">{r.code}</Pill>
                              {r.verificationStatus && (
                                <Pill t="muted" className="ml-1 text-[10px]">
                                  {r.verificationStatus}
                                </Pill>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {r.part} · {r.entry}
                              {r.chapter && ` · Chapter ${r.chapter}`}
                              {r.shlokaNumber && ` · Shloka ${r.shlokaNumber}`}
                            </div>
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              Provenance: {r.provenance} (Edition: {r.edition})
                            </div>
                          </div>
                        </div>
                        <Link
                          to="/library"
                          search={{ ref: r.id }}
                          className="inline-flex items-center gap-1 rounded-lg border bg-surface px-2.5 py-1 text-xs font-semibold text-primary hover:border-primary transition-colors"
                        >
                          Open in Library
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )
          )}

          {tab === "Quality" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
                <Factory className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 text-sm">
                  {mfr ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Link
                          to="/manufacturers"
                          search={{ id: mfr.id }}
                          className="font-bold text-foreground hover:text-primary"
                        >
                          {mfr.name}
                        </Link>
                        <Pill t="outline">{mfr.state}</Pill>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {mfr.city} · Licence: {mfr.licence}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        GMP Status: {mfr.gmp} · Lab facilities: {mfr.labFacilities ? "On-site tested" : "External testing"}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground">Manufacturer information pending</div>
                  )}
                </div>
              </div>

              <div>
                <div className="eyebrow mb-2">Available Batch Records & Analytical Evidence</div>
                {mb.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No batch evidence available for this medicine.</p>
                ) : (
                  <div className="space-y-2">
                    {mb.map((b) => (
                      <Link
                        key={b.id}
                        to="/quality"
                        search={{ batch: b.id }}
                        className="flex items-center justify-between rounded-xl border bg-card p-3.5 hover:border-primary/50 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-sm">
                          <FileCheck2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-bold text-foreground">{b.id}</span>
                          <span className="text-xs text-muted-foreground">exp {b.exp}</span>
                        </span>
                        <EvidencePill s={b.review} />
                      </Link>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-[11px] text-muted-foreground">
                  A document on file does not mean a batch has been declared safe. Doctor verification and vigilance required.
                </p>
              </div>
            </div>
          )}

          {tab === "Related" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {m.related.map((id) => {
                const r = medById(id);
                return r ? (
                  <Link
                    key={id}
                    to="/medicines"
                    search={{ id }}
                    className="rounded-xl border bg-card p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="font-bold text-foreground">{r.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {r.form} · {r.category}
                    </div>
                    <p className="mt-2 text-xs text-foreground/80 line-clamp-2">{r.summary}</p>
                  </Link>
                ) : null;
              })}
              {m.related.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-2">No related records.</p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </article>
  );
}
