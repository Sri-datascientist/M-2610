import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useAdministration } from "@/features/admin/administration-state";
import {
  removePublication,
  restorePublication,
  samplePractitionerContent,
  type PractitionerContent,
} from "@/features/admin/published-content-data";
import type { ActionResult } from "@/features/admin/compliance-data";

type PublishedContentState = {
  items: PractitionerContent[];
  removeFromPublication: (id: string) => ActionResult;
  restoreToPublication: (id: string, authorVerified: boolean) => ActionResult;
};

const Ctx = createContext<PublishedContentState | null>(null);

export function PublishedContentProvider({ children }: { children: ReactNode }) {
  const { recordActivity } = useAdministration();
  const [items, setItems] = useState(samplePractitionerContent);

  const removeFromPublication = useCallback(
    (id: string): ActionResult => {
      const next = removePublication(items, id);
      if (!next.ok) return next;
      const logged = recordActivity(
        "Published Content",
        "Removed published content",
        `${id} removed from public availability.`,
      );
      if (!logged.ok) return logged;
      setItems(next.items);
      return { ok: true };
    },
    [items, recordActivity],
  );

  const restoreToPublication = useCallback(
    (id: string, authorVerified: boolean): ActionResult => {
      const next = restorePublication(items, id, authorVerified);
      if (!next.ok) return next;
      const logged = recordActivity(
        "Published Content",
        "Restored published content",
        `${id} restored to the published list.`,
      );
      if (!logged.ok) return logged;
      setItems(next.items);
      return { ok: true };
    },
    [items, recordActivity],
  );

  return (
    <Ctx.Provider value={{ items, removeFromPublication, restoreToPublication }}>{children}</Ctx.Provider>
  );
}

export function usePublishedContent() {
  const value = useContext(Ctx);
  if (!value) throw new Error("usePublishedContent must be used inside PublishedContentProvider");
  return value;
}
