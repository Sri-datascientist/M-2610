import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { seedFeedback, type FeedbackRecord, type FeedbackStatus } from "./feedback-data";
import { useStore } from "@/lib/admin-store";

type FeedbackContextType = {
  feedback: FeedbackRecord[];
  addInternalNote: (id: string, text: string) => void;
  updateStatus: (id: string, status: FeedbackStatus, resolutionNotes?: string) => void;
  deleteFeedback: (id: string) => void;
};

const FeedbackContext = createContext<FeedbackContextType | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<FeedbackRecord[]>(seedFeedback);
  const { admin } = useStore();
  const actor = admin?.name ?? "Ananya Iyer";

  const addInternalNote = useCallback(
    (id: string, text: string) => {
      const now = new Date().toISOString().replace("T", " ").slice(0, 16);
      setFeedback((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                internalNotes: [...item.internalNotes, { at: now, by: actor, text }],
              }
            : item,
        ),
      );
    },
    [actor],
  );

  const updateStatus = useCallback(
    (id: string, status: FeedbackStatus, resolutionNotes?: string) => {
      const now = new Date().toISOString().replace("T", " ").slice(0, 16);
      setFeedback((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                resolutionNotes: resolutionNotes ?? item.resolutionNotes,
                resolvedAt: status === "Resolved" || status === "Closed" ? now : item.resolvedAt,
              }
            : item,
        ),
      );
    },
    [],
  );

  const deleteFeedback = useCallback((id: string) => {
    setFeedback((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      feedback,
      addInternalNote,
      updateStatus,
      deleteFeedback,
    }),
    [feedback, addInternalNote, updateStatus, deleteFeedback],
  );

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return context;
}
