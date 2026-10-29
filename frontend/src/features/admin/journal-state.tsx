import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { seedJournals, type JournalRecord, type JournalStatus } from "./journal-data";

type JournalContextType = {
  journals: JournalRecord[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedStatus: JournalStatus | "all";
  setSelectedStatus: (status: JournalStatus | "all") => void;
  addJournal: (record: Omit<JournalRecord, "id" | "lastFetchedAt" | "syncStatus">) => void;
  updateJournal: (id: string, updates: Partial<JournalRecord>) => void;
  deleteJournal: (id: string) => void;
  triggerManualSync: (id: string) => Promise<void>;
  isSyncingAll: boolean;
  syncAll: () => Promise<void>;
};

const JournalContext = createContext<JournalContextType | null>(null);

export function JournalProvider({ children }: { children: ReactNode }) {
  const [journals, setJournals] = useState<JournalRecord[]>(seedJournals);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<JournalStatus | "all">("all");
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const addJournal = useCallback((record: Omit<JournalRecord, "id" | "lastFetchedAt" | "syncStatus">) => {
    const newId = `JRN-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString().replace("T", " ").slice(0, 16);
    const newEntry: JournalRecord = {
      ...record,
      id: newId,
      lastFetchedAt: now,
      syncStatus: "Success",
    };
    setJournals((prev) => [newEntry, ...prev]);
  }, []);

  const updateJournal = useCallback((id: string, updates: Partial<JournalRecord>) => {
    setJournals((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const deleteJournal = useCallback((id: string) => {
    setJournals((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const triggerManualSync = useCallback(async (id: string) => {
    setJournals((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, syncStatus: "Syncing" } : item,
      ),
    );
    // Simulate realistic asynchronous network synchronization
    await new Promise((resolve) => setTimeout(resolve, 800));
    const now = new Date().toISOString().replace("T", " ").slice(0, 16);
    setJournals((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              syncStatus: "Success",
              lastFetchedAt: now,
              status: "Indexed",
              syncError: undefined,
            }
          : item,
      ),
    );
  }, []);

  const syncAll = useCallback(async () => {
    setIsSyncingAll(true);
    setJournals((prev) => prev.map((item) => ({ ...item, syncStatus: "Syncing" })));
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const now = new Date().toISOString().replace("T", " ").slice(0, 16);
    setJournals((prev) =>
      prev.map((item) => ({
        ...item,
        syncStatus: "Success",
        lastFetchedAt: now,
        status: "Indexed",
        syncError: undefined,
      })),
    );
    setIsSyncingAll(false);
  }, []);

  const value = useMemo(
    () => ({
      journals,
      searchQuery,
      setSearchQuery,
      selectedCategory,
      setSelectedCategory,
      selectedStatus,
      setSelectedStatus,
      addJournal,
      updateJournal,
      deleteJournal,
      triggerManualSync,
      isSyncingAll,
      syncAll,
    }),
    [
      journals,
      searchQuery,
      selectedCategory,
      selectedStatus,
      addJournal,
      updateJournal,
      deleteJournal,
      triggerManualSync,
      isSyncingAll,
      syncAll,
    ],
  );

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useJournals() {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error("useJournals must be used within a JournalProvider");
  }
  return context;
}
