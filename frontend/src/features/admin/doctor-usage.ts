/**
 * Doctor platform usage.
 *
 * There is no usage backend yet. Sessions are recorded in this browser and
 * shaped so a later API can store the same events. Nothing here is sample
 * data: an empty ledger means no doctor has been active.
 *
 * Only an authenticated doctor account may record time. Administrator roles
 * and email identities are ignored.
 *
 * Heartbeat interval: 30 seconds. A pulse adds at most that much, and only
 * after the doctor has interacted while the tab is visible.
 * Idle timeout: 2 minutes without interaction. The session closes, and time
 * after the last credited pulse is not counted.
 * A hidden tab does not accrue time. If the browser closes without logout,
 * reload keeps time only up to the last credited pulse.
 *
 * Dates use Asia/Kolkata, the portal timezone.
 */

export const PORTAL_TIME_ZONE = "Asia/Kolkata";
export const HEARTBEAT_INTERVAL_MS = 30_000;
export const IDLE_TIMEOUT_MS = 120_000;
const RETENTION_MS = 14 * 24 * 60 * 60 * 1000;

const ADMIN_ROLES = new Set([
  "Platform Administrator",
  "Compliance Administrator",
  "Operations Manager",
  "Support Administrator",
  "Read-Only Auditor",
]);

export type UsageEvent = {
  type: "start" | "heartbeat" | "pause" | "end";
  doctorId: string;
  at: number;
  role?: string;
};

export type ClosedUsageInterval = {
  id: string;
  doctorId: string;
  startedAt: number;
  endedAt: number;
};

export type OpenDoctorSession = {
  doctorId: string;
  startedAt: number;
  creditedEnd: number;
  lastEventAt: number;
};

export type UsageLedger = {
  intervals: ClosedUsageInterval[];
  open: OpenDoctorSession[];
};

export type UsageDay = {
  dayKey: string;
  axisLabel: string;
  fullDate: string;
  averageMs: number;
  activeDoctors: number;
};

export type UsageSummary = {
  timeZone: string;
  today: { averageMs: number | null; activeDoctors: number };
  yesterday: { averageMs: number | null; activeDoctors: number };
  days: UsageDay[];
};

export function emptyUsageLedger(): UsageLedger {
  return { intervals: [], open: [] };
}

export function acceptDoctorUsage(input: { doctorId: string; role?: string }): boolean {
  const doctorId = input.doctorId.trim();
  if (!doctorId || doctorId.includes("@")) return false;
  if (input.role && ADMIN_ROLES.has(input.role)) return false;
  return true;
}

export function formatActiveDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function applyUsageEvent(ledger: UsageLedger, event: UsageEvent): UsageLedger {
  if (!acceptDoctorUsage(event) || !Number.isFinite(event.at)) return ledger;
  if (event.type === "start") return startSession(ledger, event.doctorId, event.at);
  if (event.type === "heartbeat") return creditHeartbeat(ledger, event.doctorId, event.at);
  return closeDoctor(ledger, event.doctorId, event.at);
}

export function settleOpenSessions(ledger: UsageLedger): UsageLedger {
  let next = ledger;
  for (const session of ledger.open) {
    next = closeDoctor(next, session.doctorId, session.creditedEnd);
  }
  return next;
}

export function parseUsageLedger(raw: string): UsageLedger | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as { intervals?: unknown; open?: unknown };
  if (!Array.isArray(record.intervals) || !Array.isArray(record.open)) return null;
  const intervals = record.intervals.filter(isInterval);
  const open = record.open.filter(isOpenSession);
  if (intervals.length !== record.intervals.length || open.length !== record.open.length) return null;
  return settleOpenSessions({ intervals, open });
}

export function summarizeDoctorUsage(
  ledger: UsageLedger,
  now: number,
  timeZone = PORTAL_TIME_ZONE,
): UsageSummary {
  const todayKey = zonedDayKey(now, timeZone);
  const yesterdayKey = shiftDayKey(todayKey, -1);
  const days = recentDayKeys(now, timeZone).map((dayKey) => {
    const totals = totalsForDay(ledger, dayKey, timeZone);
    return {
      dayKey,
      axisLabel: formatDay(dayKey, timeZone, { day: "numeric", month: "short" }),
      fullDate: formatDay(dayKey, timeZone, {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      averageMs: totals.averageMs,
      activeDoctors: totals.activeDoctors,
    };
  });
  return {
    timeZone,
    today: nullableAverage(totalsForDay(ledger, todayKey, timeZone)),
    yesterday: nullableAverage(totalsForDay(ledger, yesterdayKey, timeZone)),
    days,
  };
}

export function zonedDayKey(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ms);
}

function startSession(ledger: UsageLedger, doctorId: string, at: number): UsageLedger {
  if (ledger.open.some((session) => session.doctorId === doctorId)) return ledger;
  return prune(
    {
      intervals: ledger.intervals,
      open: [...ledger.open, { doctorId, startedAt: at, creditedEnd: at, lastEventAt: at }],
    },
    at,
  );
}

function creditHeartbeat(ledger: UsageLedger, doctorId: string, at: number): UsageLedger {
  const session = ledger.open.find((item) => item.doctorId === doctorId);
  if (!session) return startSession(ledger, doctorId, at);
  const delta = at - session.lastEventAt;
  if (delta <= 0) return ledger;
  if (delta > IDLE_TIMEOUT_MS) {
    const closed = closeDoctor(ledger, doctorId, session.creditedEnd);
    return startSession(closed, doctorId, at);
  }
  const credit = Math.min(delta, HEARTBEAT_INTERVAL_MS);
  return prune(
    {
      intervals: ledger.intervals,
      open: ledger.open.map((item) =>
        item.doctorId === doctorId
          ? { ...item, creditedEnd: item.creditedEnd + credit, lastEventAt: at }
          : item,
      ),
    },
    at,
  );
}

function closeDoctor(ledger: UsageLedger, doctorId: string, at: number): UsageLedger {
  const session = ledger.open.find((item) => item.doctorId === doctorId);
  if (!session) return ledger;
  const intervals = [...ledger.intervals];
  if (session.creditedEnd > session.startedAt) {
    const id = `${doctorId}:${session.startedAt}:${session.creditedEnd}`;
    if (!intervals.some((interval) => interval.id === id)) {
      intervals.push({
        id,
        doctorId,
        startedAt: session.startedAt,
        endedAt: session.creditedEnd,
      });
    }
  }
  return prune(
    { intervals, open: ledger.open.filter((item) => item.doctorId !== doctorId) },
    at,
  );
}

function prune(ledger: UsageLedger, now: number): UsageLedger {
  const cutoff = now - RETENTION_MS;
  return {
    intervals: ledger.intervals.filter((interval) => interval.endedAt >= cutoff),
    open: ledger.open,
  };
}

function totalsForDay(
  ledger: UsageLedger,
  dayKey: string,
  timeZone: string,
): { averageMs: number; activeDoctors: number } {
  const dayStart = zonedDayStart(dayKey, timeZone);
  const dayEnd = zonedDayStart(shiftDayKey(dayKey, 1), timeZone);
  const byDoctor = new Map<string, [number, number][]>();
  const add = (doctorId: string, start: number, end: number) => {
    const clippedStart = Math.max(start, dayStart);
    const clippedEnd = Math.min(end, dayEnd);
    if (clippedEnd <= clippedStart) return;
    const ranges = byDoctor.get(doctorId) ?? [];
    ranges.push([clippedStart, clippedEnd]);
    byDoctor.set(doctorId, ranges);
  };
  for (const interval of ledger.intervals) add(interval.doctorId, interval.startedAt, interval.endedAt);
  for (const session of ledger.open) add(session.doctorId, session.startedAt, session.creditedEnd);
  const totals = [...byDoctor.values()].map(mergeDuration).filter((total) => total > 0);
  if (totals.length === 0) return { averageMs: 0, activeDoctors: 0 };
  return {
    averageMs: totals.reduce((sum, total) => sum + total, 0) / totals.length,
    activeDoctors: totals.length,
  };
}

function nullableAverage(totals: { averageMs: number; activeDoctors: number }): {
  averageMs: number | null;
  activeDoctors: number;
} {
  if (totals.activeDoctors === 0) return { averageMs: null, activeDoctors: 0 };
  return totals;
}

function mergeDuration(ranges: [number, number][]): number {
  const sorted = [...ranges].sort((left, right) => left[0] - right[0]);
  let total = 0;
  let current: [number, number] | null = null;
  for (const range of sorted) {
    if (!current || range[0] > current[1]) {
      if (current) total += current[1] - current[0];
      current = [...range];
    } else {
      current = [current[0], Math.max(current[1], range[1])];
    }
  }
  if (current) total += current[1] - current[0];
  return total;
}

function recentDayKeys(now: number, timeZone: string): string[] {
  const today = zonedDayKey(now, timeZone);
  return [4, 3, 2, 1, 0].map((offset) => shiftDayKey(today, -offset));
}

function shiftDayKey(dayKey: string, days: number): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(year!, (month ?? 1) - 1, (day ?? 1) + days)).toISOString().slice(0, 10);
}

function zonedDayStart(dayKey: string, timeZone: string): number {
  const [year, month, day] = dayKey.split("-").map(Number);
  const guess = Date.UTC(year!, (month ?? 1) - 1, day ?? 1, 0, 0, 0);
  const offsetAtGuess = zoneOffsetMs(guess, timeZone);
  const start = guess - offsetAtGuess;
  const offsetAtStart = zoneOffsetMs(start, timeZone);
  return offsetAtStart === offsetAtGuess ? start : guess - offsetAtStart;
}

function zoneOffsetMs(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  let hour = value("hour");
  let day = value("day");
  if (hour === 24) {
    hour = 0;
    day += 1;
  }
  const asUtc = Date.UTC(value("year"), value("month") - 1, day, hour, value("minute"), value("second"));
  return asUtc - utcMs;
}

function formatDay(
  dayKey: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const midday = zonedDayStart(dayKey, timeZone) + 12 * 60 * 60 * 1000;
  return new Intl.DateTimeFormat("en-GB", { ...options, timeZone }).format(midday);
}

function isInterval(value: unknown): value is ClosedUsageInterval {
  if (!value || typeof value !== "object") return false;
  const interval = value as ClosedUsageInterval;
  return (
    typeof interval.id === "string" &&
    typeof interval.doctorId === "string" &&
    typeof interval.startedAt === "number" &&
    typeof interval.endedAt === "number" &&
    interval.endedAt > interval.startedAt
  );
}

function isOpenSession(value: unknown): value is OpenDoctorSession {
  if (!value || typeof value !== "object") return false;
  const session = value as OpenDoctorSession;
  return (
    typeof session.doctorId === "string" &&
    typeof session.startedAt === "number" &&
    typeof session.creditedEnd === "number" &&
    typeof session.lastEventAt === "number"
  );
}
