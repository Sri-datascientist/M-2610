import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useAdministration } from "@/features/admin/administration-state";
import {
  addMessageToQuery,
  assignQueryAdmin,
  deleteQuery,
  sampleQueries,
  updateQueryPriority,
  updateQueryStatus,
  type CustomerQuery,
  type QueryPriority,
  type QueryStatus,
} from "@/features/admin/queries-data";
import type { ActionResult } from "@/features/admin/compliance-data";

type QueriesState = {
  items: CustomerQuery[];
  sendReply: (queryId: string, content: string) => ActionResult;
  setQueryStatus: (queryId: string, status: QueryStatus, resolutionNote?: string) => ActionResult;
  setQueryPriority: (queryId: string, priority: QueryPriority) => ActionResult;
  assignAdmin: (queryId: string, adminId: string, adminName: string) => ActionResult;
  closeQuery: (queryId: string) => ActionResult;
  removeQuery: (queryId: string) => ActionResult;
};

const Ctx = createContext<QueriesState | null>(null);

export function QueriesProvider({ children }: { children: ReactNode }) {
  const { recordActivity, actor } = useAdministration();
  const [items, setItems] = useState<CustomerQuery[]>(sampleQueries);

  const sendReply = useCallback(
    (queryId: string, content: string): ActionResult => {
      const res = addMessageToQuery(items, queryId, {
        senderId: "ADMIN-CURRENT",
        senderName: actor || "Platform Administrator",
        senderType: "admin",
        content,
      });

      if (!res.ok) return res;

      const logged = recordActivity(
        "Query Management",
        "Responded to query",
        `${queryId}: Administrator response sent.`,
      );
      if (!logged.ok) return logged;

      setItems(res.items);
      return { ok: true };
    },
    [items, recordActivity, actor],
  );

  const setQueryStatus = useCallback(
    (queryId: string, status: QueryStatus, resolutionNote?: string): ActionResult => {
      const res = updateQueryStatus(items, queryId, status, resolutionNote);
      if (!res.ok) return res;

      const logged = recordActivity(
        "Query Management",
        "Updated query status",
        `${queryId} status set to ${status}.`,
      );
      if (!logged.ok) return logged;

      setItems(res.items);
      return { ok: true };
    },
    [items, recordActivity],
  );

  const setQueryPriority = useCallback(
    (queryId: string, priority: QueryPriority): ActionResult => {
      const res = updateQueryPriority(items, queryId, priority);
      if (!res.ok) return res;

      const logged = recordActivity(
        "Query Management",
        "Updated query priority",
        `${queryId} priority changed to ${priority}.`,
      );
      if (!logged.ok) return logged;

      setItems(res.items);
      return { ok: true };
    },
    [items, recordActivity],
  );

  const assignAdmin = useCallback(
    (queryId: string, adminId: string, adminName: string): ActionResult => {
      const res = assignQueryAdmin(items, queryId, adminId, adminName);
      if (!res.ok) return res;

      const logged = recordActivity(
        "Query Management",
        "Assigned query",
        `${queryId} assigned to ${adminName}.`,
      );
      if (!logged.ok) return logged;

      setItems(res.items);
      return { ok: true };
    },
    [items, recordActivity],
  );

  const closeQuery = useCallback(
    (queryId: string): ActionResult => {
      const res = updateQueryStatus(items, queryId, "Closed");
      if (!res.ok) return res;

      const logged = recordActivity(
        "Query Management",
        "Closed query",
        `${queryId} formally closed by administrator.`,
      );
      if (!logged.ok) return logged;

      setItems(res.items);
      return { ok: true };
    },
    [items, recordActivity],
  );

  const removeQuery = useCallback(
    (queryId: string): ActionResult => {
      const res = deleteQuery(items, queryId);
      if (!res.ok) return res;

      const logged = recordActivity(
        "Query Management",
        "Deleted query",
        `${queryId} removed/archived from active queries.`,
      );
      if (!logged.ok) return logged;

      setItems(res.items);
      return { ok: true };
    },
    [items, recordActivity],
  );

  return (
    <Ctx.Provider
      value={{
        items,
        sendReply,
        setQueryStatus,
        setQueryPriority,
        assignAdmin,
        closeQuery,
        removeQuery,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useQueries() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useQueries must be used inside QueriesProvider");
  return value;
}
