import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  HEARTBEAT_INTERVAL_MS,
  IDLE_TIMEOUT_MS,
  acceptDoctorUsage,
  applyUsageEvent,
  emptyUsageLedger,
  parseUsageLedger,
  type UsageEvent,
  type UsageLedger,
} from "@/features/admin/doctor-usage";

const STORAGE_KEY = "meyveda-doctor-usage-v1";

type DoctorUsageContextValue = {
  ledger: UsageLedger;
  storageError: boolean;
  record: (event: UsageEvent) => void;
};

const DoctorUsageContext = createContext<DoctorUsageContextValue | null>(null);

function readStoredLedger(): { ledger: UsageLedger; error: boolean } {
  if (typeof localStorage === "undefined") return { ledger: emptyUsageLedger(), error: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ledger: emptyUsageLedger(), error: false };
    const ledger = parseUsageLedger(raw);
    return ledger ? { ledger, error: false } : { ledger: emptyUsageLedger(), error: true };
  } catch {
    return { ledger: emptyUsageLedger(), error: true };
  }
}

export function DoctorUsageProvider({ children }: { children: ReactNode }) {
  const [ledger, setLedger] = useState<UsageLedger | null>(null);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    const stored = readStoredLedger();
    setLedger(stored.ledger);
    setStorageError(stored.error);
  }, []);

  useEffect(() => {
    if (!ledger) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
    } catch {
      setStorageError(true);
    }
  }, [ledger]);

  const record = useCallback((event: UsageEvent) => {
    setLedger((current) => applyUsageEvent(current ?? emptyUsageLedger(), event));
  }, []);

  const value = useMemo(
    () => ({ ledger: ledger ?? emptyUsageLedger(), storageError, record }),
    [ledger, record, storageError],
  );

  return <DoctorUsageContext.Provider value={value}>{children}</DoctorUsageContext.Provider>;
}

export function useDoctorUsage(): DoctorUsageContextValue {
  const value = useContext(DoctorUsageContext);
  if (!value) throw new Error("useDoctorUsage outside DoctorUsageProvider");
  return value;
}

/**
 * Records active time for one authenticated doctor. Pass null for an
 * administrator session so this portal never counts staff activity.
 */
export function useDoctorActivityTracker(doctorId: string | null, role?: string) {
  const { record } = useDoctorUsage();

  useEffect(() => {
    if (!doctorId || !acceptDoctorUsage({ doctorId, ...(role ? { role } : {}) })) return;

    let open = false;
    let engaged = false;
    let idleTimer = 0;
    let heartTimer = 0;

    const pause = () => {
      if (!open) return;
      record({ type: "pause", doctorId, at: Date.now(), ...(role ? { role } : {}) });
      open = false;
      engaged = false;
    };

    const end = () => {
      if (open && engaged && document.visibilityState === "visible") {
        record({ type: "heartbeat", doctorId, at: Date.now(), ...(role ? { role } : {}) });
      }
      if (open) record({ type: "end", doctorId, at: Date.now(), ...(role ? { role } : {}) });
      open = false;
      engaged = false;
    };

    const armIdle = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(pause, IDLE_TIMEOUT_MS);
    };

    const onActivity = () => {
      if (document.visibilityState !== "visible") return;
      if (!open) {
        record({ type: "start", doctorId, at: Date.now(), ...(role ? { role } : {}) });
        open = true;
      }
      engaged = true;
      armIdle();
    };

    const beat = () => {
      if (!open || !engaged || document.visibilityState !== "visible") return;
      record({ type: "heartbeat", doctorId, at: Date.now(), ...(role ? { role } : {}) });
      engaged = false;
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") pause();
    };

    heartTimer = window.setInterval(beat, HEARTBEAT_INTERVAL_MS);
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity, true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", end);

    return () => {
      window.clearInterval(heartTimer);
      window.clearTimeout(idleTimer);
      end();
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity, true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", end);
    };
  }, [doctorId, record, role]);
}
