import { describe, expect, it } from "vitest";
import {
  addMessageToQuery,
  assignQueryAdmin,
  defaultQueryFilters,
  deleteQuery,
  filterQueries,
  queryCounts,
  sampleQueries,
  sortQueries,
  updateQueryPriority,
  updateQueryStatus,
  type CustomerQuery,
} from "@/features/admin/queries-data";

describe("Query Management logic and operations", () => {
  it("calculates accurate counts across query statuses", () => {
    const counts = queryCounts(sampleQueries);
    expect(counts.total).toBe(sampleQueries.length);
    expect(counts.open).toBe(sampleQueries.filter((q) => q.status === "Open").length);
    expect(counts.inProgress).toBe(sampleQueries.filter((q) => q.status === "In Progress").length);
    expect(counts.resolved).toBe(sampleQueries.filter((q) => q.status === "Resolved").length);
    expect(counts.closed).toBe(sampleQueries.filter((q) => q.status === "Closed").length);
  });

  it("filters queries by search keyword across ID, subject, and submitter", () => {
    const byId = filterQueries(sampleQueries, {
      ...defaultQueryFilters,
      query: "QRY-2041",
    });
    expect(byId.length).toBe(1);
    expect(byId[0]?.id).toBe("QRY-2041");

    const byName = filterQueries(sampleQueries, {
      ...defaultQueryFilters,
      query: "Dr. Lakshmi Rao",
    });
    expect(byName.length).toBe(1);
    expect(byName[0]?.id).toBe("QRY-2046");

    const byKeyword = filterQueries(sampleQueries, {
      ...defaultQueryFilters,
      query: "deducted",
    });
    expect(byKeyword.length).toBeGreaterThanOrEqual(1);
  });

  it("combines status, userType, category, and priority filters correctly", () => {
    const filtered = filterQueries(sampleQueries, {
      ...defaultQueryFilters,
      status: "In Progress",
      userType: "Doctor",
      category: "Technical Issue",
      priority: "Urgent",
    });
    expect(filtered.length).toBe(1);
    expect(filtered[0]?.id).toBe("QRY-2046");
    expect(filtered[0]?.userType).toBe("Doctor");
  });

  it("sorts queries by priority (Urgent > High > Medium > Low)", () => {
    const sorted = sortQueries(sampleQueries, "priority");
    const priorities = sorted.map((q) => q.priority);
    const urgentIndex = priorities.indexOf("Urgent");
    const lowIndex = priorities.lastIndexOf("Low");
    expect(urgentIndex).toBeLessThan(lowIndex);
  });

  it("adds an admin message to a query and prevents empty messages", () => {
    const initialQuery = sampleQueries.find((q) => q.id === "QRY-2041")!;
    const initialMsgCount = initialQuery.messages.length;

    // Reject empty message
    const emptyRes = addMessageToQuery(sampleQueries, "QRY-2041", {
      senderId: "ADM-01",
      senderName: "Ananya Iyer",
      senderType: "admin",
      content: "   ",
    });
    expect(emptyRes.ok).toBe(false);

    // Accept valid response
    const validRes = addMessageToQuery(sampleQueries, "QRY-2041", {
      senderId: "ADM-01",
      senderName: "Ananya Iyer",
      senderType: "admin",
      content: "We have initiated a refund with reference TXN-998811.",
    });
    expect(validRes.ok).toBe(true);
    if (!validRes.ok) return;

    const updated = validRes.items.find((q) => q.id === "QRY-2041")!;
    expect(updated.messages.length).toBe(initialMsgCount + 1);
    const lastMsg = updated.messages.at(-1)!;
    expect(lastMsg.content).toBe("We have initiated a refund with reference TXN-998811.");
    expect(lastMsg.senderName).toBe("Ananya Iyer");
    expect(lastMsg.senderType).toBe("admin");
  });

  it("updates query status and resolution details", () => {
    const res = updateQueryStatus(
      sampleQueries,
      "QRY-2041",
      "Resolved",
      "Refund processed via razorpay batch #9812.",
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const updated = res.items.find((q) => q.id === "QRY-2041")!;
    expect(updated.status).toBe("Resolved");
    expect(updated.resolutionDetails).toBe("Refund processed via razorpay batch #9812.");
  });

  it("updates query priority", () => {
    const res = updateQueryPriority(sampleQueries, "QRY-2045", "High");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const updated = res.items.find((q) => q.id === "QRY-2045")!;
    expect(updated.priority).toBe("High");
  });

  it("assigns an administrator to a query", () => {
    const res = assignQueryAdmin(sampleQueries, "QRY-2041", "USR-02", "Meera Pillai");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const updated = res.items.find((q) => q.id === "QRY-2041")!;
    expect(updated.assignedAdminId).toBe("USR-02");
    expect(updated.assignedAdminName).toBe("Meera Pillai");
  });

  it("soft-deletes a query without removing other records", () => {
    const res = deleteQuery(sampleQueries, "QRY-2041");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const updated = res.items.find((q) => q.id === "QRY-2041")!;
    expect(updated.deleted).toBe(true);

    const activeCounts = queryCounts(res.items);
    expect(activeCounts.total).toBe(sampleQueries.length - 1);

    const filtered = filterQueries(res.items, defaultQueryFilters);
    expect(filtered.some((q) => q.id === "QRY-2041")).toBe(false);
  });
});
