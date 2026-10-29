import { useMemo, useState } from "react";
import { PageHeader } from "@/components/portal/brand";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/features/admin/catalog-state";
import { buildTerritoryData } from "@/features/admin/territory-data";
import { SearchField, SelectField, SummaryRow } from "@/features/admin/fields";
import { MapPin, Stethoscope, Building2, ChevronRight, Hash, Layers } from "lucide-react";
import { ReviewBadge } from "@/features/admin/review-ui";
import { Link } from "@tanstack/react-router";
import { doctorSlugMap } from "@/features/admin/doctor-slug";

export function TerritoryPage() {
  const { doctors, manufacturers } = useCatalog();
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<"all" | "doctors" | "manufacturers">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDistrict, setActiveDistrict] = useState<{ state: string; district: string } | null>(null);

  const doctorSlugs = useMemo(() => doctorSlugMap(doctors), [doctors]);

  const territories = useMemo(
    () => buildTerritoryData(doctors, manufacturers),
    [doctors, manufacturers],
  );

  const stateNames = useMemo(
    () => territories.map((t) => t.state),
    [territories],
  );

  const filteredTerritories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return territories
      .filter((t) => (selectedState === "all" ? true : t.state === selectedState))
      .map((t) => {
        const filteredDistricts = t.districts.filter((d) => {
          if (!q) return true;
          const matchDist = d.name.toLowerCase().includes(q);
          const matchPins = d.pincodes.some((pin) => pin.includes(q));
          const matchDocs = d.doctors.some((doc) => doc.name.toLowerCase().includes(q));
          const matchMfrs = d.manufacturers.some((mfr) => mfr.company.toLowerCase().includes(q));
          return matchDist || matchPins || matchDocs || matchMfrs;
        });

        return {
          ...t,
          districts: filteredDistricts,
          totalDoctors: filteredDistricts.reduce((sum, d) => sum + d.doctorCount, 0),
          totalManufacturers: filteredDistricts.reduce((sum, d) => sum + d.manufacturerCount, 0),
        };
      })
      .filter((t) => t.districts.length > 0);
  }, [territories, selectedState, searchQuery]);

  const totalStates = territories.length;
  const totalDistricts = territories.reduce((acc, t) => acc + t.districts.length, 0);
  const totalCoveredDoctors = doctors.length;
  const totalCoveredMfrs = manufacturers.length;

  return (
    <div>
      <PageHeader
        title="Territory mapping"
        subtitle="Regional distribution and geographical clustering of registered practitioners and licensed pharmaceutical manufacturers."
      />

      <SummaryRow
        items={[
          {
            label: "Covered States",
            value: totalStates,
            pressed: selectedState === "all",
            onClick: () => setSelectedState("all"),
          },
          {
            label: "Mapped Districts",
            value: totalDistricts,
          },
          {
            label: "Registered Doctors",
            value: totalCoveredDoctors,
            pressed: selectedType === "doctors",
            onClick: () => setSelectedType((prev) => (prev === "doctors" ? "all" : "doctors")),
          },
          {
            label: "Licensed Manufacturers",
            value: totalCoveredMfrs,
            pressed: selectedType === "manufacturers",
            onClick: () => setSelectedType((prev) => (prev === "manufacturers" ? "all" : "manufacturers")),
          },
        ]}
      />

      <section className="card-surface mt-5">
        <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <SearchField
              label="Search Territory"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by state, district, PIN code, doctor or manufacturer..."
            />
          </div>
          <SelectField
            label="Filter by State"
            value={selectedState}
            onChange={setSelectedState}
            options={[
              { value: "all", label: "All States & Territories" },
              ...stateNames.map((st) => ({ value: st, label: st })),
            ]}
          />
        </div>

        {/* Territory Directory / Grouped Location Cards */}
        <div className="p-5 space-y-6">
          {filteredTerritories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No regional records found matching your filters.</p>
            </div>
          ) : (
            filteredTerritories.map((territory) => (
              <div key={territory.state} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="bg-secondary/40 px-5 py-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-base tracking-tight">{territory.state}</h3>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({territory.districts.length} {territory.districts.length === 1 ? "District" : "Districts"})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium">
                    <span className="inline-flex items-center gap-1 text-slate-700 bg-white/80 px-2 py-1 rounded-md border border-border">
                      <Stethoscope className="h-3.5 w-3.5 text-primary" />
                      {territory.totalDoctors} Doctors
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-700 bg-white/80 px-2 py-1 rounded-md border border-border">
                      <Building2 className="h-3.5 w-3.5 text-amber-600" />
                      {territory.totalManufacturers} Manufacturers
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                  {territory.districts.map((district) => (
                    <div
                      key={district.name}
                      className="rounded-lg border border-border/70 p-4 hover:border-primary/40 transition-colors bg-surface/30"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-sm">{district.name}</h4>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Hash className="h-3 w-3" />
                            <span>PIN Codes: {district.pincodes.join(", ") || "General"}</span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-accent text-accent-foreground">
                          {district.doctorCount + district.manufacturerCount} entities
                        </span>
                      </div>

                      {/* Doctors list preview */}
                      {selectedType !== "manufacturers" && district.doctors.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                            Doctors ({district.doctorCount})
                          </span>
                          <ul className="space-y-1">
                            {district.doctors.map((doc) => (
                              <li key={doc.id} className="flex items-center justify-between text-xs py-0.5">
                                <Link
                                  to="/admin/doctors/$doctorSlug"
                                  params={{ doctorSlug: doctorSlugs.get(doc.id) ?? doc.id }}
                                  className="font-medium text-primary hover:underline line-clamp-1"
                                >
                                  {doc.name}
                                </Link>
                                <ReviewBadge status={doc.status} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Manufacturers list preview */}
                      {selectedType !== "doctors" && district.manufacturers.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                            Manufacturers ({district.manufacturerCount})
                          </span>
                          <ul className="space-y-1">
                            {district.manufacturers.map((mfr) => (
                              <li key={mfr.id} className="flex items-center justify-between text-xs py-0.5">
                                <span className="font-medium text-foreground line-clamp-1">{mfr.company}</span>
                                <ReviewBadge status={mfr.status} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
