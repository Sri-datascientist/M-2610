import type { UsageSummary } from "@/features/admin/doctor-usage";

/** Illustrative development figures. These are not recorded doctor activity. */
export const doctorUsageDevelopmentSample = [
  { dayKey: "2026-10-11", axisLabel: "11 Oct", fullDate: "Sunday, 11 Oct 2026", averageMinutes: 35, activeDoctors: 3 },
  { dayKey: "2026-10-12", axisLabel: "12 Oct", fullDate: "Monday, 12 Oct 2026", averageMinutes: 48, activeDoctors: 4 },
  { dayKey: "2026-10-13", axisLabel: "13 Oct", fullDate: "Tuesday, 13 Oct 2026", averageMinutes: 30, activeDoctors: 2 },
  { dayKey: "2026-10-14", axisLabel: "14 Oct", fullDate: "Wednesday, 14 Oct 2026", averageMinutes: 55, activeDoctors: 5 },
  { dayKey: "2026-10-15", axisLabel: "15 Oct", fullDate: "Thursday, 15 Oct 2026", averageMinutes: 42, activeDoctors: 4 },
] as const;

export type DoctorUsageChartDay = {
  dayKey: string;
  axisLabel: string;
  fullDate: string;
  averageMinutes: number;
  activeDoctors: number;
};

export type DoctorUsageDisplay = {
  source: "recorded" | "development-sample" | "empty";
  todayMinutes: number | null;
  days: DoctorUsageChartDay[];
};

export function selectDoctorUsageDisplay(
  summary: UsageSummary,
  allowDevelopmentSample: boolean,
): DoctorUsageDisplay {
  const hasRecordedActivity = summary.days.some((day) => day.activeDoctors > 0);
  if (hasRecordedActivity) {
    return {
      source: "recorded",
      todayMinutes: summary.today.averageMs == null ? null : summary.today.averageMs / 60_000,
      days: summary.days.map((day) => ({
        dayKey: day.dayKey,
        axisLabel: day.axisLabel,
        fullDate: day.fullDate,
        averageMinutes: day.averageMs / 60_000,
        activeDoctors: day.activeDoctors,
      })),
    };
  }
  if (allowDevelopmentSample) {
    const days = doctorUsageDevelopmentSample.map((day) => ({ ...day }));
    return {
      source: "development-sample",
      todayMinutes: days[days.length - 1]?.averageMinutes ?? null,
      days,
    };
  }
  return {
    source: "empty",
    todayMinutes: null,
    days: summary.days.map((day) => ({
      dayKey: day.dayKey,
      axisLabel: day.axisLabel,
      fullDate: day.fullDate,
      averageMinutes: 0,
      activeDoctors: 0,
    })),
  };
}

export function formatUsageMinutes(minutes: number): string {
  return `${Math.round(minutes)} min`;
}
