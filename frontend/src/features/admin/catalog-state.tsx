import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import {
  latestVersion,
  seedDoctors,
  seedManufacturers,
  seedMedicines,
  type Doctor,
  type DoctorStatus,
  type HistoryEntry,
  type Manufacturer,
  type ManufacturerStatus,
  type Medicine,
  type MedicineStatus,
  type MedicineVersion,
  type NoteEntry,
} from "@/features/admin/catalog-data";
import {
  duplicateIngredient,
  ingredientInputError,
  seedIngredients,
  splitSynonyms,
  type Ingredient,
  type IngredientInput,
  type IngredientStatus,
} from "@/features/admin/ingredient-data";
import {
  latestLibraryVersion,
  libraryInputError,
  seedLibrary,
  versionFromInput,
  type LibraryDraftInput,
  type LibraryEntry,
  type LibraryStatus,
} from "@/features/admin/library-data";
import { useStore } from "@/lib/admin-store";

function stamp() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type Catalog = {
  doctors: Doctor[];
  manufacturers: Manufacturer[];
  medicines: Medicine[];
  actor: string;
  setChecklist: (id: string, index: number, done: boolean) => void;
  addDoctorNote: (id: string, text: string) => void;
  decideDoctor: (
    id: string,
    decision: "verify" | "request" | "reject" | "suspend",
    reason: string,
    documents?: string[],
  ) => { ok: true } | { ok: false; message: string };
  addManufacturerNote: (id: string, text: string) => void;
  decideManufacturer: (
    id: string,
    decision: "approve" | "corrections" | "reject",
    reason: string,
  ) => void;
  addMedicineNote: (id: string, text: string) => void;
  decideMedicine: (
    id: string,
    decision: "approve" | "request" | "reject",
    reason: string,
  ) => { ok: true } | { ok: false; message: string };
  library: LibraryEntry[];
  createLibraryDraft: (
    input: LibraryDraftInput,
  ) => { ok: true; id: string } | { ok: false; message: string };
  updateLibraryDraft: (
    id: string,
    input: LibraryDraftInput,
  ) => { ok: true } | { ok: false; message: string };
  startLibraryRevision: (id: string) => { ok: true } | { ok: false; message: string };
  decideLibrary: (
    id: string,
    decision: "submit" | "publish" | "archive",
  ) => { ok: true } | { ok: false; message: string };
  ingredients: Ingredient[];
  saveIngredient: (
    input: IngredientInput,
    id?: string,
  ) => { ok: true; id: string } | { ok: false; message: string };
};

const Ctx = createContext<Catalog | null>(null);

function note(actor: string, text: string): NoteEntry {
  return { at: stamp(), by: actor, text };
}

function event(actor: string, text: string, extra?: Partial<HistoryEntry>): HistoryEntry {
  return { at: stamp(), by: actor, text, ...extra };
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { admin } = useStore();
  const actor = admin?.name ?? "Ananya Iyer";
  const [doctors, setDoctors] = useState(seedDoctors);
  const doctorsRef = useRef(doctors);
  doctorsRef.current = doctors;
  const [manufacturers, setManufacturers] = useState(seedManufacturers);
  const [medicines, setMedicines] = useState(seedMedicines);
  const [library, setLibrary] = useState(seedLibrary);
  const [ingredients, setIngredients] = useState(seedIngredients);

  const setChecklist = useCallback((id: string, index: number, done: boolean) => {
    setDoctors((rows) =>
      rows.map((row) =>
        row.id === id
          ? {
              ...row,
              checklist: row.checklist.map((item, itemIndex) =>
                itemIndex === index ? { ...item, done } : item,
              ),
            }
          : row,
      ),
    );
  }, []);

  const addDoctorNote = useCallback(
    (id: string, text: string) => {
      setDoctors((rows) =>
        rows.map((row) =>
          row.id === id ? { ...row, notes: [note(actor, text), ...row.notes] } : row,
        ),
      );
    },
    [actor],
  );

  const decideDoctor = useCallback(
    (
      id: string,
      decision: "verify" | "request" | "reject" | "suspend",
      reason: string,
      documents: string[] = [],
    ) => {
      const current = doctorsRef.current.find((row) => row.id === id);
      if (!current) return { ok: false as const, message: "This doctor record is no longer available." };
      const trimmed = reason.trim();
      const requestedDocuments = [
        ...new Set(documents.map((item) => item.trim()).filter(Boolean)),
      ];
      if (decision !== "verify" && !trimmed) {
        return {
          ok: false as const,
          message:
            decision === "request"
              ? "Describe the additional information or documents required."
              : "Enter a reason before confirming.",
        };
      }
      if (decision === "verify" && current.checklist.some((item) => !item.done)) {
        return {
          ok: false as const,
          message: "Complete every verification check before confirming verification.",
        };
      }
      if (decision === "verify" && current.status === "Verified") {
        return { ok: false as const, message: "This doctor is already verified." };
      }
      if (decision === "reject" && current.status === "Rejected") {
        return { ok: false as const, message: "This application is already rejected." };
      }
      if (decision === "suspend" && current.status === "Suspended") {
        return { ok: false as const, message: "This doctor is already suspended." };
      }
      const nextStatus: DoctorStatus =
        decision === "verify"
          ? "Verified"
          : decision === "request"
            ? "Additional Information Required"
            : decision === "reject"
              ? "Rejected"
              : "Suspended";
      const action =
        decision === "verify"
          ? "Verify"
          : decision === "request"
            ? "Additional Information Required"
            : decision === "reject"
              ? "Reject"
              : "Suspend";
      const detail = [
        trimmed,
        requestedDocuments.length
          ? `Documents to resubmit: ${requestedDocuments.join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
      const text =
        decision === "verify"
          ? "Credentials verified"
          : decision === "request"
            ? "Additional information requested"
            : decision === "reject"
              ? "Application rejected"
              : "Doctor suspended";
      setDoctors((rows) =>
        rows.map((row) =>
          row.id === id
            ? {
                ...row,
                status: nextStatus,
                history: [
                  event(actor, detail ? `${text}: ${detail}` : text, {
                    action,
                    fromStatus: row.status,
                    toStatus: nextStatus,
                    ...(detail ? { reason: detail } : {}),
                  }),
                  ...row.history,
                ],
                notes: detail ? [note(actor, detail), ...row.notes] : row.notes,
              }
            : row,
        ),
      );
      return { ok: true as const };
    },
    [actor],
  );

  const addManufacturerNote = useCallback(
    (id: string, text: string) => {
      setManufacturers((rows) =>
        rows.map((row) =>
          row.id === id ? { ...row, notes: [note(actor, text), ...row.notes] } : row,
        ),
      );
    },
    [actor],
  );

  const decideManufacturer = useCallback(
    (id: string, decision: "approve" | "corrections" | "reject", reason: string) => {
      const next: Record<typeof decision, ManufacturerStatus> = {
        approve: "Verified",
        corrections: "Corrections Requested",
        reject: "Rejected",
      };
      const label =
        decision === "approve"
          ? "Manufacturer verified"
          : decision === "corrections"
            ? `Corrections requested: ${reason}`
            : `Rejected: ${reason}`;
      setManufacturers((rows) =>
        rows.map((row) =>
          row.id === id
            ? {
                ...row,
                status: next[decision],
                history: [event(actor, label), ...row.history],
                notes: reason ? [note(actor, reason), ...row.notes] : row.notes,
              }
            : row,
        ),
      );
    },
    [actor],
  );

  const addMedicineNote = useCallback(
    (id: string, text: string) => {
      setMedicines((rows) =>
        rows.map((row) =>
          row.id === id
            ? { ...row, history: [event(actor, `Note: ${text}`), ...row.history] }
            : row,
        ),
      );
    },
    [actor],
  );

  const decideMedicine = useCallback(
    (id: string, decision: "approve" | "request" | "reject", reason: string) => {
      const row = medicines.find((item) => item.id === id);
      if (!row) return { ok: false as const, message: "Record not found." };
      const current = latestVersion(row);
      if (decision === "approve" && current.status === "Approved") {
        return { ok: false as const, message: "This version is already approved." };
      }
      if (
        decision === "reject" &&
        (current.status === "Approved" || current.status === "Inactive")
      ) {
        return {
          ok: false as const,
          message: "Approved history is kept. Rejection applies only to an open submission.",
        };
      }
      setMedicines((rows) =>
        rows.map((item) => {
          if (item.id !== id) return item;
          const latest = latestVersion(item);
          if (decision === "approve") {
            return {
              ...item,
              versions: mapLatest(item, (version) => ({ ...version, status: "Approved" })),
              history: [event(actor, `Version ${latest.version} approved`), ...item.history],
            };
          }
          if (decision === "request") {
            if (latest.status === "Approved" || latest.status === "Inactive") {
              return appendVersion(item, actor, reason);
            }
            return {
              ...item,
              versions: mapLatest(item, (version) => ({
                ...version,
                status: "Changes Requested" satisfies MedicineStatus,
                note: reason,
              })),
              history: [
                event(actor, `Changes requested on version ${latest.version}: ${reason}`),
                ...item.history,
              ],
            };
          }
          return {
            ...item,
            versions: mapLatest(item, (version) => ({
              ...version,
              status: "Rejected",
              note: reason,
            })),
            history: [
              event(actor, `Version ${latest.version} rejected: ${reason}`),
              ...item.history,
            ],
          };
        }),
      );
      return { ok: true as const };
    },
    [actor, medicines],
  );

  const createLibraryDraft = useCallback(
    (input: LibraryDraftInput) => {
      const message = libraryInputError(input);
      if (message) return { ok: false as const, message };
      const id = `LIB-${String(library.length + 8).padStart(2, "0")}`;
      const entry: LibraryEntry = {
        id,
        title: input.title.trim(),
        source: input.source.trim(),
        category: input.category as LibraryEntry["category"],
        versions: [versionFromInput(input, 1, stamp())],
        history: [event(actor, "Draft created")],
      };
      setLibrary((rows) => [entry, ...rows]);
      return { ok: true as const, id };
    },
    [actor, library.length],
  );

  const updateLibraryDraft = useCallback(
    (id: string, input: LibraryDraftInput) => {
      const message = libraryInputError(input);
      if (message) return { ok: false as const, message };
      const current = library.find((item) => item.id === id);
      if (!current) return { ok: false as const, message: "Entry not found." };
      if (latestLibraryVersion(current).status !== "Draft") {
        return { ok: false as const, message: "Only a draft version can be edited." };
      }
      setLibrary((rows) =>
        rows.map((item) => {
          if (item.id !== id) return item;
          const latest = latestLibraryVersion(item);
          const next = versionFromInput(input, latest.version, stamp());
          return {
            ...item,
            title: input.title.trim(),
            source: input.source.trim(),
            category: input.category as LibraryEntry["category"],
            versions: item.versions.map((version, index) =>
              index === item.versions.length - 1 ? next : version,
            ),
            history: [event(actor, `Draft version ${latest.version} updated`), ...item.history],
          };
        }),
      );
      return { ok: true as const };
    },
    [actor, library],
  );

  const startLibraryRevision = useCallback(
    (id: string) => {
      const current = library.find((item) => item.id === id);
      if (!current) return { ok: false as const, message: "Entry not found." };
      const latest = latestLibraryVersion(current);
      if (latest.status !== "Published") {
        return { ok: false as const, message: "A new version starts from a published entry." };
      }
      setLibrary((rows) =>
        rows.map((item) => {
          if (item.id !== id) return item;
          const source = latestLibraryVersion(item);
          return {
            ...item,
            versions: [
              ...item.versions,
              {
                ...source,
                version: source.version + 1,
                status: "Draft" satisfies LibraryStatus,
                updated: stamp(),
                chapters: source.chapters.map((chapter) => ({
                  ...chapter,
                  verses: chapter.verses.map((line) => ({ ...line })),
                })),
                references: [...source.references],
                editorialNote: "",
              },
            ],
            history: [
              event(
                actor,
                `Version ${source.version + 1} opened. Version ${source.version} stays published.`,
              ),
              ...item.history,
            ],
          };
        }),
      );
      return { ok: true as const };
    },
    [actor, library],
  );

  const decideLibrary = useCallback(
    (id: string, decision: "submit" | "publish" | "archive") => {
      const current = library.find((item) => item.id === id);
      if (!current) return { ok: false as const, message: "Entry not found." };
      const latest = latestLibraryVersion(current);
      if (decision === "submit" && latest.status !== "Draft") {
        return { ok: false as const, message: "Only a draft can be submitted for review." };
      }
      if (decision === "publish" && latest.status !== "In Review") {
        return { ok: false as const, message: "Publish applies to an entry that is in review." };
      }
      if (decision === "archive" && latest.status === "Archived") {
        return { ok: false as const, message: "This entry is already archived." };
      }
      const next: LibraryStatus =
        decision === "submit" ? "In Review" : decision === "publish" ? "Published" : "Archived";
      const label =
        decision === "submit"
          ? `Version ${latest.version} submitted for review`
          : decision === "publish"
            ? `Version ${latest.version} published`
            : `Version ${latest.version} archived`;
      setLibrary((rows) =>
        rows.map((item) => {
          if (item.id !== id) return item;
          const last = item.versions.length - 1;
          return {
            ...item,
            versions: item.versions.map((version, index) =>
              index === last ? { ...version, status: next, updated: stamp() } : version,
            ),
            history: [event(actor, label), ...item.history],
          };
        }),
      );
      return { ok: true as const };
    },
    [actor, library],
  );

  const saveIngredient = useCallback(
    (input: IngredientInput, id?: string) => {
      const message = ingredientInputError(input);
      if (message) return { ok: false as const, message };
      const clash = duplicateIngredient(ingredients, input, id);
      if (clash) {
        return {
          ok: false as const,
          message: `This matches ${clash.name} (${clash.standardName}). Use that entry instead of creating a duplicate.`,
        };
      }
      const properties = [
        { label: "Rasa", value: input.rasa.trim() },
        { label: "Guna", value: input.guna.trim() },
        { label: "Virya", value: input.virya.trim() },
      ].filter((item) => item.value);
      const references = input.referenceSource.trim()
        ? [{ source: input.referenceSource.trim(), note: input.referenceNote.trim() }]
        : [];
      if (id) {
        setIngredients((rows) =>
          rows.map((row) =>
            row.id === id
              ? {
                  ...row,
                  name: input.name.trim(),
                  standardName: input.standardName.trim(),
                  synonyms: splitSynonyms(input.synonyms),
                  category: input.category as Ingredient["category"],
                  status: input.status as IngredientStatus,
                  properties,
                  references: references.length ? references : row.references,
                  history: [event(actor, "Standard name and synonyms updated"), ...row.history],
                }
              : row,
          ),
        );
        return { ok: true as const, id };
      }
      const nextId = `ING-${String(ingredients.length + 9).padStart(2, "0")}`;
      const entry: Ingredient = {
        id: nextId,
        name: input.name.trim(),
        standardName: input.standardName.trim(),
        synonyms: splitSynonyms(input.synonyms),
        category: input.category as Ingredient["category"],
        status: input.status as IngredientStatus,
        properties,
        references,
        history: [event(actor, "Entry created")],
      };
      setIngredients((rows) => [entry, ...rows]);
      return { ok: true as const, id: nextId };
    },
    [actor, ingredients],
  );

  const value = useMemo(
    () => ({
      doctors,
      manufacturers,
      medicines,
      actor,
      setChecklist,
      addDoctorNote,
      decideDoctor,
      addManufacturerNote,
      decideManufacturer,
      addMedicineNote,
      decideMedicine,
      library,
      createLibraryDraft,
      updateLibraryDraft,
      startLibraryRevision,
      decideLibrary,
      ingredients,
      saveIngredient,
    }),
    [
      doctors,
      manufacturers,
      medicines,
      actor,
      setChecklist,
      addDoctorNote,
      decideDoctor,
      addManufacturerNote,
      decideManufacturer,
      addMedicineNote,
      decideMedicine,
      library,
      createLibraryDraft,
      updateLibraryDraft,
      startLibraryRevision,
      decideLibrary,
      ingredients,
      saveIngredient,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function mapLatest(medicine: Medicine, update: (version: MedicineVersion) => MedicineVersion) {
  const last = medicine.versions.length - 1;
  return medicine.versions.map((version, index) => (index === last ? update(version) : version));
}

function appendVersion(medicine: Medicine, actor: string, reason: string): Medicine {
  const current = latestVersion(medicine);
  const next: MedicineVersion = {
    ...current,
    version: current.version + 1,
    status: "Changes Requested",
    submitted: stamp(),
    note: reason,
    formulation: current.formulation.map((line) => ({ ...line })),
    labels: [...current.labels],
  };
  return {
    ...medicine,
    versions: [...medicine.versions, next],
    history: [
      event(
        actor,
        `Version ${next.version} opened for changes. Version ${current.version} stays ${current.status.toLowerCase()}.`,
      ),
      ...medicine.history,
    ],
  };
}

export function useCatalog() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useCatalog must be used inside CatalogProvider");
  return value;
}
