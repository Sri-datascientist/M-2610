import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HEARTBEAT_INTERVAL_MS,
  IDLE_TIMEOUT_MS,
  applyUsageEvent,
  emptyUsageLedger,
  formatActiveDuration,
  settleOpenSessions,
  summarizeDoctorUsage,
  zonedDayKey,
  type UsageLedger,
} from "@/features/admin/doctor-usage";
import { DoctorPlatformUsage } from "@/features/admin/doctor-usage-panel";
import { selectDoctorUsageDisplay } from "@/features/admin/doctor-usage-sample";
import { DoctorUsageProvider, useDoctorActivityTracker, useDoctorUsage } from "@/features/admin/doctor-usage-state";
import type { UsageEvent } from "@/features/admin/doctor-usage";

const NOW = Date.parse("2026-10-15T08:00:00.000Z");
const MORNING = Date.parse("2026-10-15T03:30:00.000Z");

describe("doctor usage totals", () => {
  it("formats durations in hours and minutes", () => {
    expect(formatActiveDuration(2 * 60 * 60 * 1000 + 15 * 60 * 1000)).toBe("2h 15m");
    expect(formatActiveDuration(60 * 60 * 1000)).toBe("1h");
    expect(formatActiveDuration(15 * 60 * 1000)).toBe("15m");
  });

  it("shows no average and five calendar days when nothing is recorded", () => {
    const summary = summarizeDoctorUsage(emptyUsageLedger(), NOW);
    expect(summary.today).toEqual({ averageMs: null, activeDoctors: 0 });
    expect(summary.days.map((day) => day.dayKey)).toEqual([
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
    ]);
    expect(summary.days.every((day) => day.activeDoctors === 0 && day.averageMs === 0)).toBe(true);
    expect(zonedDayKey(Date.parse("2026-10-14T18:30:00.000Z"), "Asia/Kolkata")).toBe("2026-10-15");
    expect(zonedDayKey(Date.parse("2026-10-14T18:29:59.000Z"), "Asia/Kolkata")).toBe("2026-10-14");
  });

  it("averages doctors who were active and merges overlapping time", () => {
    const ledger: UsageLedger = {
      open: [],
      intervals: [
        { id: "a", doctorId: "DOC-1", startedAt: MORNING, endedAt: MORNING + 30 * 60 * 1000 },
        { id: "b", doctorId: "DOC-1", startedAt: MORNING + 20 * 60 * 1000, endedAt: MORNING + 40 * 60 * 1000 },
        { id: "c", doctorId: "DOC-2", startedAt: MORNING, endedAt: MORNING + 20 * 60 * 1000 },
      ],
    };
    const summary = summarizeDoctorUsage(ledger, NOW);
    expect(summary.today.activeDoctors).toBe(2);
    expect(summary.today.averageMs).toBe(30 * 60 * 1000);
    expect(summary.days.at(-1)?.axisLabel).toBe("15 Oct");
  });

  it("splits a session on the Asia/Kolkata midnight boundary", () => {
    const start = Date.parse("2026-10-14T18:00:00.000Z");
    const ledger: UsageLedger = {
      open: [],
      intervals: [{ id: "night", doctorId: "DOC-1", startedAt: start, endedAt: start + 60 * 60 * 1000 }],
    };
    const summary = summarizeDoctorUsage(ledger, NOW);
    const fourteenth = summary.days.find((day) => day.dayKey === "2026-10-14");
    const fifteenth = summary.days.find((day) => day.dayKey === "2026-10-15");
    expect(fourteenth?.averageMs).toBe(30 * 60 * 1000);
    expect(fifteenth?.averageMs).toBe(30 * 60 * 1000);
  });

  it("does not credit an idle gap, a duplicate pulse, or a second open session", () => {
    let ledger = emptyUsageLedger();
    const start: UsageEvent = { type: "start", doctorId: "DOC-1", at: MORNING };
    ledger = applyUsageEvent(ledger, start);
    ledger = applyUsageEvent(ledger, { type: "start", doctorId: "DOC-1", at: MORNING + 1000 });
    ledger = applyUsageEvent(ledger, { type: "heartbeat", doctorId: "DOC-1", at: MORNING + 30_000 });
    ledger = applyUsageEvent(ledger, { type: "heartbeat", doctorId: "DOC-1", at: MORNING + 30_000 });
    ledger = applyUsageEvent(ledger, { type: "heartbeat", doctorId: "DOC-1", at: MORNING + 31_000 });
    ledger = applyUsageEvent(ledger, {
      type: "heartbeat",
      doctorId: "DOC-1",
      at: MORNING + 31_000 + IDLE_TIMEOUT_MS + 1,
    });
    ledger = applyUsageEvent(ledger, { type: "end", doctorId: "DOC-1", at: NOW });
    const summary = summarizeDoctorUsage(ledger, NOW);
    expect(summary.today.averageMs).toBe(31_000);
    expect(summary.today.activeDoctors).toBe(1);
  });

  it("keeps only credited time when a session is closed abruptly", () => {
    let ledger = applyUsageEvent(emptyUsageLedger(), { type: "start", doctorId: "DOC-1", at: MORNING });
    ledger = applyUsageEvent(ledger, { type: "heartbeat", doctorId: "DOC-1", at: MORNING + HEARTBEAT_INTERVAL_MS });
    ledger = settleOpenSessions(ledger);
    expect(ledger.open).toEqual([]);
    expect(summarizeDoctorUsage(ledger, NOW).today.averageMs).toBe(HEARTBEAT_INTERVAL_MS);
  });

  it("uses the development sample only when no sessions are recorded", () => {
    const empty = summarizeDoctorUsage(emptyUsageLedger(), NOW);
    const sample = selectDoctorUsageDisplay(empty, true);
    expect(sample.source).toBe("development-sample");
    expect(sample.todayMinutes).toBe(42);
    expect(sample.days.map((day) => [day.axisLabel, day.averageMinutes, day.activeDoctors])).toEqual([
      ["11 Oct", 35, 3],
      ["12 Oct", 48, 4],
      ["13 Oct", 30, 2],
      ["14 Oct", 55, 5],
      ["15 Oct", 42, 4],
    ]);
    expect(selectDoctorUsageDisplay(empty, false).source).toBe("empty");
  });

  it("ignores administrator identities", () => {
    const start = emptyUsageLedger();
    expect(
      applyUsageEvent(start, {
        type: "start",
        doctorId: "DOC-1",
        at: MORNING,
        role: "Platform Administrator",
      }),
    ).toEqual(start);
    expect(
      applyUsageEvent(start, { type: "heartbeat", doctorId: "admin@meyveda.com", at: MORNING }),
    ).toEqual(start);
  });
});

function TrackerProbe({ doctorId, role }: { doctorId: string | null; role?: string }) {
  useDoctorActivityTracker(doctorId, role);
  const { ledger } = useDoctorUsage();
  const summary = summarizeDoctorUsage(ledger, Date.now());
  return <p data-testid="today">{summary.today.averageMs ?? "none"}</p>;
}

function RecordProbe() {
  const { record } = useDoctorUsage();
  return (
    <button
      type="button"
      onClick={() => {
        record({ type: "start", doctorId: "DOC-1042", at: MORNING });
        record({ type: "heartbeat", doctorId: "DOC-1042", at: MORNING + HEARTBEAT_INTERVAL_MS });
        record({ type: "end", doctorId: "DOC-1042", at: MORNING + HEARTBEAT_INTERVAL_MS });
      }}
    >
      Record session
    </button>
  );
}

describe("doctor usage on the dashboard", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
  });

  it("refreshes today's average when a doctor session is recorded", () => {
    render(
      <DoctorUsageProvider>
        <DoctorPlatformUsage />
        <RecordProbe />
      </DoctorUsageProvider>,
    );
    expect(screen.getByRole("heading", { name: "Today's Average Time Spent" })).toBeInTheDocument();
    expect(screen.queryByText(/Asia\/Kolkata/)).not.toBeInTheDocument();
    expect(screen.getAllByText("42 min").length).toBeGreaterThan(0);
    expect(screen.getByText("35 min")).toBeInTheDocument();
    act(() => {
      screen.getByRole("button", { name: "Record session" }).click();
    });
    expect(screen.queryByText("42 min")).not.toBeInTheDocument();
    expect(screen.getAllByText("1 min").length).toBeGreaterThan(0);
  });

  it("counts an active visible slice and leaves later idle time out", () => {
    render(
      <DoctorUsageProvider>
        <TrackerProbe doctorId="DOC-1042" />
      </DoctorUsageProvider>,
    );
    expect(screen.getByTestId("today")).toHaveTextContent("none");
    act(() => {
      vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS);
    });
    expect(screen.getByTestId("today")).toHaveTextContent("none");
    act(() => {
      window.dispatchEvent(new Event("pointerdown"));
      vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS);
    });
    expect(screen.getByTestId("today")).toHaveTextContent(String(HEARTBEAT_INTERVAL_MS));
    act(() => {
      vi.advanceTimersByTime(IDLE_TIMEOUT_MS + HEARTBEAT_INTERVAL_MS);
    });
    expect(screen.getByTestId("today")).toHaveTextContent(String(HEARTBEAT_INTERVAL_MS));
  });

  it("does not count a hidden tab or an administrator", () => {
    const { unmount } = render(
      <DoctorUsageProvider>
        <TrackerProbe doctorId="DOC-1042" />
      </DoctorUsageProvider>,
    );
    act(() => {
      window.dispatchEvent(new Event("pointerdown"));
      vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS);
    });
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(5 * 60 * 1000);
    });
    expect(screen.getByTestId("today")).toHaveTextContent(String(HEARTBEAT_INTERVAL_MS));
    unmount();
    localStorage.clear();

    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
    render(
      <DoctorUsageProvider>
        <TrackerProbe doctorId="admin@meyveda.com" />
        <TrackerProbe doctorId="DOC-1042" role="Platform Administrator" />
      </DoctorUsageProvider>,
    );
    act(() => {
      window.dispatchEvent(new Event("pointerdown"));
      vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS);
    });
    expect(screen.getAllByTestId("today").every((node) => node.textContent === "none")).toBe(true);
  });
});
