import type { HistoryEntry } from "@/features/admin/catalog-data";

export const ingredientStatuses = ["Active", "Draft", "Restricted"] as const;
export type IngredientStatus = (typeof ingredientStatuses)[number];

export const ingredientCategories = ["Fruit", "Root", "Resin", "Herb", "Bark"] as const;

export type Ingredient = {
  id: string;
  name: string;
  standardName: string;
  synonyms: string[];
  category: (typeof ingredientCategories)[number];
  status: IngredientStatus;
  properties: { label: string; value: string }[];
  references: { source: string; note: string }[];
  history: HistoryEntry[];
};

export type IngredientInput = {
  name: string;
  standardName: string;
  synonyms: string;
  category: string;
  status: string;
  rasa: string;
  guna: string;
  virya: string;
  referenceSource: string;
  referenceNote: string;
};

export function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function splitSynonyms(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ingredientInputError(input: IngredientInput) {
  if (input.name.trim().length < 2) return "Enter the ingredient name.";
  if (input.standardName.trim().length < 2) return "Enter the standard name.";
  if (!ingredientCategories.includes(input.category as (typeof ingredientCategories)[number])) {
    return "Choose a category.";
  }
  if (!ingredientStatuses.includes(input.status as IngredientStatus)) return "Choose a status.";
  return "";
}

export function duplicateIngredient(rows: Ingredient[], input: IngredientInput, ignoreId?: string) {
  const incoming = [input.standardName, input.name, ...splitSynonyms(input.synonyms)]
    .map(normalizeName)
    .filter(Boolean);
  return rows.find((row) => {
    if (row.id === ignoreId) return false;
    const existing = [row.standardName, row.name, ...row.synonyms].map(normalizeName);
    return incoming.some((name) => existing.includes(name));
  });
}

export const seedIngredients: Ingredient[] = [
  {
    id: "ING-01",
    name: "Haritaki",
    standardName: "Terminalia chebula",
    synonyms: ["Abhaya", "Pathya"],
    category: "Fruit",
    status: "Active",
    properties: [
      { label: "Rasa", value: "Kashaya, amla, madhura, katu, tikta" },
      { label: "Guna", value: "Laghu, ruksha" },
      { label: "Virya", value: "Ushna" },
    ],
    references: [{ source: "Bhavaprakasha Nighantu", note: "Haritakyadi varga" }],
    history: [{ at: "02 Jan 2026 10:00", text: "Entry created", by: "Ananya Iyer" }],
  },
  {
    id: "ING-02",
    name: "Amalaki",
    standardName: "Phyllanthus emblica",
    synonyms: ["Dhatri", "Indian gooseberry"],
    category: "Fruit",
    status: "Active",
    properties: [
      { label: "Rasa", value: "Amla, madhura, kashaya" },
      { label: "Guna", value: "Guru, sheeta" },
      { label: "Virya", value: "Sheeta" },
    ],
    references: [{ source: "Bhavaprakasha Nighantu", note: "Haritakyadi varga" }],
    history: [{ at: "02 Jan 2026 10:12", text: "Entry created", by: "Ananya Iyer" }],
  },
  {
    id: "ING-03",
    name: "Vibhitaki",
    standardName: "Terminalia bellirica",
    synonyms: ["Aksha"],
    category: "Fruit",
    status: "Active",
    properties: [
      { label: "Rasa", value: "Kashaya" },
      { label: "Guna", value: "Laghu, ruksha" },
      { label: "Virya", value: "Ushna" },
    ],
    references: [{ source: "Bhavaprakasha Nighantu", note: "Haritakyadi varga" }],
    history: [{ at: "02 Jan 2026 10:20", text: "Entry created", by: "Ananya Iyer" }],
  },
  {
    id: "ING-04",
    name: "Guggulu",
    standardName: "Commiphora wightii",
    synonyms: ["Mahishaksha"],
    category: "Resin",
    status: "Active",
    properties: [
      { label: "Rasa", value: "Tikta, katu" },
      { label: "Guna", value: "Laghu, ruksha" },
      { label: "Virya", value: "Ushna" },
    ],
    references: [{ source: "Bhavaprakasha Nighantu", note: "Karpooradi varga" }],
    history: [{ at: "14 Feb 2026 11:00", text: "Entry created", by: "Meera Pillai" }],
  },
  {
    id: "ING-05",
    name: "Ashwagandha",
    standardName: "Withania somnifera",
    synonyms: ["Hayagandha"],
    category: "Root",
    status: "Active",
    properties: [
      { label: "Rasa", value: "Tikta, kashaya" },
      { label: "Guna", value: "Laghu, snigdha" },
      { label: "Virya", value: "Ushna" },
    ],
    references: [{ source: "Bhavaprakasha Nighantu", note: "Guduchyadi varga" }],
    history: [{ at: "14 Feb 2026 11:20", text: "Entry created", by: "Meera Pillai" }],
  },
  {
    id: "ING-06",
    name: "Brahmi",
    standardName: "Bacopa monnieri",
    synonyms: ["Saraswati"],
    category: "Herb",
    status: "Draft",
    properties: [
      { label: "Rasa", value: "Tikta, kashaya" },
      { label: "Guna", value: "Laghu" },
      { label: "Virya", value: "Sheeta" },
    ],
    references: [{ source: "Bhavaprakasha Nighantu", note: "Guduchyadi varga" }],
    history: [{ at: "03 Oct 2026 09:40", text: "Draft created", by: "Ananya Iyer" }],
  },
  {
    id: "ING-07",
    name: "Guduchi",
    standardName: "Tinospora cordifolia",
    synonyms: ["Amrita", "Giloy"],
    category: "Herb",
    status: "Active",
    properties: [
      { label: "Rasa", value: "Tikta, kashaya" },
      { label: "Guna", value: "Laghu" },
      { label: "Virya", value: "Ushna" },
    ],
    references: [{ source: "Bhavaprakasha Nighantu", note: "Guduchyadi varga" }],
    history: [{ at: "03 Oct 2026 09:55", text: "Entry created", by: "Ananya Iyer" }],
  },
  {
    id: "ING-08",
    name: "Yashtimadhu",
    standardName: "Glycyrrhiza glabra",
    synonyms: ["Madhuka"],
    category: "Root",
    status: "Restricted",
    properties: [
      { label: "Rasa", value: "Madhura" },
      { label: "Guna", value: "Guru, snigdha" },
      { label: "Virya", value: "Sheeta" },
    ],
    references: [
      { source: "Internal safety note", note: "High-dose use needs a practitioner review." },
    ],
    history: [
      { at: "08 Oct 2026 13:10", text: "Marked restricted", by: "Ananya Iyer" },
      { at: "20 Mar 2026 10:00", text: "Entry created", by: "Meera Pillai" },
    ],
  },
];
