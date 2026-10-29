import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/portal/brand";
import { Button } from "@/components/ui/button";
import { DataTable, Timeline, type Column } from "@/components/admin/ui";
import { useCatalog } from "@/features/admin/catalog-state";
import { latestVersion, type Medicine } from "@/features/admin/catalog-data";
import {
  BackButton,
  DetailSection,
  MetaList,
  SearchField,
  SelectField,
  TextField,
  ViewTabs,
} from "@/features/admin/fields";
import {
  ingredientCategories,
  ingredientStatuses,
  type Ingredient,
  type IngredientInput,
  type IngredientStatus,
} from "@/features/admin/ingredient-data";
import { recorded, ReviewBadge } from "@/features/admin/review-ui";
import { useStore } from "@/lib/admin-store";

const emptyInput: IngredientInput = {
  name: "",
  standardName: "",
  synonyms: "",
  category: "Herb",
  status: "Draft",
  rasa: "",
  guna: "",
  virya: "",
  referenceSource: "",
  referenceNote: "",
};

const tabs = ["Overview", "Names", "Properties", "Medicines", "History"] as const;
type Tab = (typeof tabs)[number];

function toInput(ingredient: Ingredient): IngredientInput {
  const property = (label: string) =>
    ingredient.properties.find((item) => item.label === label)?.value ?? "";
  const reference = ingredient.references[0];
  return {
    name: ingredient.name,
    standardName: ingredient.standardName,
    synonyms: ingredient.synonyms.join(", "),
    category: ingredient.category,
    status: ingredient.status,
    rasa: property("Rasa"),
    guna: property("Guna"),
    virya: property("Virya"),
    referenceSource: reference?.source ?? "",
    referenceNote: reference?.note ?? "",
  };
}

function relatedMedicines(ingredient: Ingredient, medicines: Medicine[]) {
  const names = new Set(
    [ingredient.name, ingredient.standardName, ...ingredient.synonyms].map((item) =>
      item.toLowerCase(),
    ),
  );
  return medicines.filter((medicine) =>
    medicine.versions.some((version) =>
      version.formulation.some((line) => names.has(line.ingredient.toLowerCase())),
    ),
  );
}

export function IngredientsDirectory() {
  const { ingredients, medicines, saveIngredient } = useCatalog();
  const { can } = useStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<IngredientStatus | "all">("all");
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const selected = ingredients.find((item) => item.id === selectedId) ?? null;

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ingredients.filter((item) => {
      const haystack = `${item.name} ${item.standardName} ${item.synonyms.join(" ")}`.toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (status !== "all" && item.status !== status) return false;
      if (category !== "all" && item.category !== category) return false;
      return true;
    });
  }, [ingredients, query, status, category]);

  if (editing) {
    return (
      <IngredientForm
        ingredient={selected}
        enabled={can("manage")}
        onCancel={() => setEditing(false)}
        onSave={(input) => {
          const result = saveIngredient(input, selected?.id);
          if (!result.ok) {
            toast.error(result.message);
            return;
          }
          recorded(selected ? "Ingredient updated" : "Ingredient created");
          setSelectedId(result.id);
          setEditing(false);
        }}
      />
    );
  }

  if (selected) {
    return (
      <IngredientDetail
        ingredient={selected}
        medicines={relatedMedicines(selected, medicines)}
        enabled={can("manage")}
        onBack={() => setSelectedId(null)}
        onEdit={() => setEditing(true)}
      />
    );
  }

  const columns: Column<Ingredient>[] = [
    { header: "Ingredient", cell: (row) => <span className="font-semibold">{row.name}</span> },
    { header: "Standard Name", cell: (row) => row.standardName },
    { header: "Synonyms", cell: (row) => row.synonyms.join(", ") || "—" },
    { header: "Category", cell: (row) => row.category },
    { header: "Status", cell: (row) => <ReviewBadge status={row.status} /> },
    {
      header: "Actions",
      cell: (row) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedId(row.id);
          }}
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Ingredients"
        subtitle="Standard names, synonyms, and source references for the ingredient master."
        action={
          <Button
            type="button"
            onClick={() => {
              setSelectedId(null);
              setEditing(true);
            }}
          >
            New ingredient
          </Button>
        }
      />
      <section className="card-surface">
        <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SearchField
              label="Search"
              value={query}
              onChange={setQuery}
              placeholder="Ingredient, standard name, or synonym"
            />
          </div>
          <SelectField
            label="Category"
            value={category}
            onChange={setCategory}
            options={[
              { value: "all", label: "All categories" },
              ...ingredientCategories.map((item) => ({ value: item, label: item })),
            ]}
          />
          <SelectField
            label="Status"
            value={status}
            onChange={(value) => setStatus(value as IngredientStatus | "all")}
            options={[
              { value: "all", label: "All statuses" },
              ...ingredientStatuses.map((item) => ({ value: item, label: item })),
            ]}
          />
        </div>
        <DataTable
          key={`${query}|${status}|${category}`}
          rows={rows}
          columns={columns}
          onRowClick={(row) => setSelectedId(row.id)}
          pageSize={6}
        />
      </section>
    </div>
  );
}

function IngredientForm({
  ingredient,
  enabled,
  onCancel,
  onSave,
}: {
  ingredient: Ingredient | null;
  enabled: boolean;
  onCancel: () => void;
  onSave: (input: IngredientInput) => void;
}) {
  const [form, setForm] = useState<IngredientInput>(ingredient ? toInput(ingredient) : emptyInput);
  const set = (key: keyof IngredientInput, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <div>
      <PageHeader
        title="Ingredients"
        subtitle="Standard names, synonyms, and source references for the ingredient master."
      />
      <BackButton onClick={onCancel} label="Back to ingredients" />
      <form
        className="mt-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!enabled) return;
          onSave(form);
        }}
      >
        <DetailSection title={ingredient ? "Edit ingredient" : "New ingredient"}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Ingredient"
              value={form.name}
              onChange={(value) => set("name", value)}
            />
            <TextField
              label="Standard name"
              value={form.standardName}
              onChange={(value) => set("standardName", value)}
            />
            <TextField
              label="Synonyms"
              value={form.synonyms}
              onChange={(value) => set("synonyms", value)}
              placeholder="Separate names with commas"
            />
            <SelectField
              label="Category"
              value={form.category}
              onChange={(value) => set("category", value)}
              options={ingredientCategories.map((item) => ({ value: item, label: item }))}
            />
            <SelectField
              label="Status"
              value={form.status}
              onChange={(value) => set("status", value)}
              options={ingredientStatuses.map((item) => ({ value: item, label: item }))}
            />
            <TextField label="Rasa" value={form.rasa} onChange={(value) => set("rasa", value)} />
            <TextField label="Guna" value={form.guna} onChange={(value) => set("guna", value)} />
            <TextField label="Virya" value={form.virya} onChange={(value) => set("virya", value)} />
            <TextField
              label="Reference source"
              value={form.referenceSource}
              onChange={(value) => set("referenceSource", value)}
            />
            <TextField
              label="Reference note"
              value={form.referenceNote}
              onChange={(value) => set("referenceNote", value)}
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Saving checks the standard name and synonyms against existing entries.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" disabled={!enabled}>
              Save ingredient
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </DetailSection>
      </form>
    </div>
  );
}

function IngredientDetail({
  ingredient,
  medicines,
  enabled,
  onBack,
  onEdit,
}: {
  ingredient: Ingredient;
  medicines: Medicine[];
  enabled: boolean;
  onBack: () => void;
  onEdit: () => void;
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  return (
    <div>
      <PageHeader
        title="Ingredients"
        subtitle="Standard names, synonyms, and source references for the ingredient master."
      />
      <BackButton onClick={onBack} label="Back to ingredients" />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="type-record">{ingredient.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{ingredient.standardName}</p>
        </div>
        <ReviewBadge status={ingredient.status} />
      </div>
      <div className="mt-4">
        <Button type="button" size="sm" variant="outline" disabled={!enabled} onClick={onEdit}>
          Edit names
        </Button>
      </div>
      <div className="mt-5">
        <ViewTabs
          label="Ingredient sections"
          value={tab}
          onChange={setTab}
          options={tabs.map((item) => ({ id: item, label: item }))}
        />
      </div>
      <div className="mt-4">
        {tab === "Overview" ? (
          <DetailSection title="Ingredient">
            <MetaList
              rows={[
                { label: "Standard name", value: ingredient.standardName },
                { label: "Category", value: ingredient.category },
                { label: "Synonyms", value: ingredient.synonyms.join(", ") || "None" },
              ]}
            />
          </DetailSection>
        ) : null}
        {tab === "Names" ? (
          <DetailSection title="Names">
            <p className="font-medium">{ingredient.standardName}</p>
            <ul className="mt-3 space-y-2">
              {ingredient.synonyms.length === 0 ? (
                <li className="text-sm text-muted-foreground">No synonyms recorded.</li>
              ) : (
                ingredient.synonyms.map((synonym) => (
                  <li key={synonym} className="rounded-xl border border-border px-3 py-2">
                    {synonym}
                  </li>
                ))
              )}
            </ul>
          </DetailSection>
        ) : null}
        {tab === "Properties" ? (
          <DetailSection title="Properties and references">
            <MetaList
              rows={ingredient.properties.map((item) => ({ label: item.label, value: item.value }))}
            />
            <ul className="mt-4 space-y-2">
              {ingredient.references.map((reference) => (
                <li key={reference.source} className="rounded-xl border border-border px-3 py-2">
                  <p className="font-medium">{reference.source}</p>
                  {reference.note ? (
                    <p className="text-sm text-muted-foreground">{reference.note}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </DetailSection>
        ) : null}
        {tab === "Medicines" ? (
          <DetailSection title="Related medicines">
            {medicines.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No catalog medicines use this ingredient.
              </p>
            ) : (
              <ul className="space-y-2">
                {medicines.map((medicine) => {
                  const current = latestVersion(medicine);
                  return (
                    <li key={medicine.id} className="rounded-xl border border-border px-3 py-2">
                      <p className="font-medium">{medicine.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {medicine.brand} · {current.status}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </DetailSection>
        ) : null}
        {tab === "History" ? (
          <DetailSection title="Change history">
            <Timeline items={ingredient.history} />
          </DetailSection>
        ) : null}
      </div>
    </div>
  );
}
