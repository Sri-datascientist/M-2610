import type { HistoryEntry } from "@/features/admin/catalog-data";

export const libraryStatuses = ["Draft", "In Review", "Published", "Archived"] as const;
export type LibraryStatus = (typeof libraryStatuses)[number];

export const libraryCategories = ["Samhita", "Nighantu", "Commentary"] as const;

export type LibraryVerse = { number: string; text: string };
export type LibraryChapter = { title: string; verses: LibraryVerse[] };

export type LibraryVersion = {
  version: number;
  status: LibraryStatus;
  updated: string;
  chapters: LibraryChapter[];
  references: string[];
  editorialNote: string;
};

export type LibraryEntry = {
  id: string;
  title: string;
  source: string;
  category: (typeof libraryCategories)[number];
  versions: LibraryVersion[];
  history: HistoryEntry[];
};

export type LibraryDraftInput = {
  title: string;
  source: string;
  category: string;
  chapter: string;
  verseNumber: string;
  verseText: string;
  references: string;
  editorialNote: string;
};

export function latestLibraryVersion(entry: LibraryEntry) {
  const version = entry.versions[entry.versions.length - 1];
  if (!version) throw new Error(`Library entry ${entry.id} has no versions`);
  return version;
}

export function libraryInputError(input: LibraryDraftInput) {
  if (input.title.trim().length < 3) return "Enter a title of at least 3 characters.";
  if (input.source.trim().length < 3) return "Enter the source.";
  if (!libraryCategories.includes(input.category as (typeof libraryCategories)[number])) {
    return "Choose a category.";
  }
  if (input.chapter.trim().length < 2) return "Enter the chapter title.";
  if (input.verseNumber.trim().length < 1) return "Enter the verse number.";
  if (input.verseText.trim().length < 10) return "Enter the verse text (at least 10 characters).";
  return "";
}

export function versionFromInput(
  input: LibraryDraftInput,
  version: number,
  updated: string,
): LibraryVersion {
  return {
    version,
    status: "Draft",
    updated,
    chapters: [
      {
        title: input.chapter.trim(),
        verses: [{ number: input.verseNumber.trim(), text: input.verseText.trim() }],
      },
    ],
    references: input.references
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    editorialNote: input.editorialNote.trim(),
  };
}

const verse = (number: string, text: string): LibraryVerse => ({ number, text });

export const seedLibrary: LibraryEntry[] = [
  {
    id: "LIB-01",
    title: "Charaka Samhita, Sutrasthana",
    source: "Charaka Samhita",
    category: "Samhita",
    versions: [
      {
        version: 1,
        status: "Published",
        updated: "12 Jan 2026",
        chapters: [
          {
            title: "Dirghanjivitiya",
            verses: [
              verse(
                "1.1",
                "A long life follows the person who keeps food, sleep, and conduct in measure.",
              ),
            ],
          },
        ],
        references: ["Chakrapani commentary, opening verse", "Kottakkal edition, 2018 reprint"],
        editorialNote: "Opening verse kept in the source voice. No gloss was added to the text.",
      },
      {
        version: 2,
        status: "Published",
        updated: "04 Aug 2026",
        chapters: [
          {
            title: "Dirghanjivitiya",
            verses: [
              verse(
                "1.1",
                "A long life follows the person who keeps food, sleep, and conduct in measure.",
              ),
              verse(
                "1.2",
                "The physician first learns the person, then the season, then the remedy.",
              ),
            ],
          },
        ],
        references: ["Chakrapani commentary, opening verse", "Kottakkal edition, 2018 reprint"],
        editorialNote: "Verse 1.2 added from the same chapter. Verse 1.1 was left unchanged.",
      },
    ],
    history: [
      { at: "04 Aug 2026 11:20", text: "Version 2 published", by: "Ananya Iyer" },
      { at: "12 Jan 2026 09:05", text: "Version 1 published", by: "Meera Pillai" },
    ],
  },
  {
    id: "LIB-02",
    title: "Sushruta Samhita, Sutrasthana",
    source: "Sushruta Samhita",
    category: "Samhita",
    versions: [
      {
        version: 1,
        status: "Draft",
        updated: "09 Oct 2026",
        chapters: [
          {
            title: "Vedotpatti",
            verses: [
              verse(
                "1.1",
                "Surgery begins with a clean hand, a steady eye, and a named instrument.",
              ),
            ],
          },
        ],
        references: ["Dalhana commentary, chapter opening"],
        editorialNote: "Draft only. The instrument list still needs a source citation.",
      },
    ],
    history: [{ at: "09 Oct 2026 15:10", text: "Draft created", by: "Meera Pillai" }],
  },
  {
    id: "LIB-03",
    title: "Ashtanga Hridaya, Sutrasthana",
    source: "Ashtanga Hridaya",
    category: "Samhita",
    versions: [
      {
        version: 1,
        status: "In Review",
        updated: "02 Oct 2026",
        chapters: [
          {
            title: "Ayushkamiya",
            verses: [verse("1.1", "Desire for life is the reason a person seeks a physician.")],
          },
        ],
        references: ["Arunadatta commentary"],
        editorialNote: "Submitted with the source line separate from this note.",
      },
    ],
    history: [
      { at: "02 Oct 2026 10:40", text: "Submitted for review", by: "Meera Pillai" },
      { at: "28 Sep 2026 16:00", text: "Draft created", by: "Meera Pillai" },
    ],
  },
  {
    id: "LIB-04",
    title: "Bhavaprakasha Nighantu, Haritakyadi",
    source: "Bhavaprakasha",
    category: "Nighantu",
    versions: [
      {
        version: 1,
        status: "Archived",
        updated: "18 May 2026",
        chapters: [
          {
            title: "Haritaki",
            verses: [
              verse("1", "Haritaki is named for the fruit that carries away accumulated waste."),
            ],
          },
        ],
        references: ["Bhavaprakasha, Haritakyadi varga"],
        editorialNote: "Archived after the later nighantu entry replaced this working copy.",
      },
    ],
    history: [{ at: "18 May 2026 12:00", text: "Entry archived", by: "Ananya Iyer" }],
  },
  {
    id: "LIB-05",
    title: "Madhava Nidana, Jwara",
    source: "Madhava Nidana",
    category: "Samhita",
    versions: [
      {
        version: 1,
        status: "Published",
        updated: "22 Jul 2026",
        chapters: [
          {
            title: "Jwara nidana",
            verses: [
              verse("2.1", "Fever is read from heat, thirst, body ache, and the loss of taste."),
            ],
          },
        ],
        references: ["Madhukosha commentary"],
        editorialNote: "",
      },
    ],
    history: [{ at: "22 Jul 2026 14:18", text: "Version 1 published", by: "Ananya Iyer" }],
  },
  {
    id: "LIB-06",
    title: "Sharngadhara Samhita, Madhyama Khanda",
    source: "Sharngadhara Samhita",
    category: "Samhita",
    versions: [
      {
        version: 1,
        status: "Draft",
        updated: "11 Oct 2026",
        chapters: [
          {
            title: "Kwatha",
            verses: [
              verse("1.1", "A decoction is one part of the drug boiled in sixteen parts of water."),
            ],
          },
        ],
        references: ["Adamalla commentary"],
        editorialNote: "Check the water ratio against the printed edition before review.",
      },
    ],
    history: [{ at: "11 Oct 2026 09:25", text: "Draft created", by: "Meera Pillai" }],
  },
  {
    id: "LIB-07",
    title: "Chakrapani on Charaka, Sutrasthana",
    source: "Ayurveda Dipika",
    category: "Commentary",
    versions: [
      {
        version: 1,
        status: "In Review",
        updated: "06 Oct 2026",
        chapters: [
          {
            title: "On Dirghanjivitiya 1.1",
            verses: [
              verse(
                "1",
                "The commentator reads measure as the balance of food, sleep, and conduct, not as a single dose.",
              ),
            ],
          },
        ],
        references: ["Ayurveda Dipika on Charaka Sutrasthana 1.1"],
        editorialNote: "This note is the editor's question, not part of the commentary.",
      },
    ],
    history: [{ at: "06 Oct 2026 17:05", text: "Submitted for review", by: "Ananya Iyer" }],
  },
];
