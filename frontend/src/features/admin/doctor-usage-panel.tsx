import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Tooltip, XAxis, YAxis } from "recharts";
import {
  PORTAL_TIME_ZONE,
  summarizeDoctorUsage,
  type UsageSummary,
} from "@/features/admin/doctor-usage";
import {
  formatUsageMinutes,
  selectDoctorUsageDisplay,
  type DoctorUsageChartDay,
} from "@/features/admin/doctor-usage-sample";
import { useDoctorUsage } from "@/features/admin/doctor-usage-state";
import { cn } from "@/lib/utils";

export function DoctorPlatformUsage() {
  const { ledger, storageError } = useDoctorUsage();
  const [now, setNow] = useState(() => Date.now());
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
  }, [ledger]);

  const summary = summarizeDoctorUsage(ledger, now, PORTAL_TIME_ZONE);
  const display = selectDoctorUsageDisplay(summary, import.meta.env.DEV);

  const activeDoctorsToday =
    display.source === "recorded"
      ? summary.today.activeDoctors
      : (display.days[display.days.length - 1]?.activeDoctors ?? 0);

  const fiveDayAvg =
    display.days.length > 0
      ? Math.round(
          display.days.reduce((acc, day) => acc + day.averageMinutes, 0) / display.days.length,
        )
      : 0;

  const peakDay = display.days.reduce<DoctorUsageChartDay | null>((max, day) => {
    if (!max || day.averageMinutes > max.averageMinutes) return day;
    return max;
  }, null);

  let diffMinutes: number | null = null;
  if (display.source === "recorded") {
    if (summary.today.averageMs != null && summary.yesterday.averageMs != null) {
      diffMinutes = Math.round((summary.today.averageMs - summary.yesterday.averageMs) / 60_000);
    }
  } else if (display.source === "development-sample" && display.days.length >= 2) {
    const todayDay = display.days[display.days.length - 1];
    const yesterdayDay = display.days[display.days.length - 2];
    if (todayDay && yesterdayDay) {
      diffMinutes = Math.round(todayDay.averageMinutes - yesterdayDay.averageMinutes);
    }
  }

  const targetGoal = 60;
  const targetPercent =
    display.todayMinutes == null
      ? 0
      : Math.min(100, Math.round((display.todayMinutes / targetGoal) * 100));

  const hoveredDay =
    hoveredChartIndex !== null && display.days[hoveredChartIndex]
      ? display.days[hoveredChartIndex]
      : null;

  return (
    <section aria-labelledby="doctor-platform-usage" data-usage-source={display.source}>
      <h2 id="doctor-platform-usage" className="type-section">
        Doctor Platform Usage
      </h2>
      {storageError ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Usage history could not be read. Today&apos;s figures stay empty until new sessions are
          recorded.
        </p>
      ) : null}
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <article className="card-surface flex flex-col justify-between p-4 sm:p-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold leading-snug">Today&apos;s Average Time Spent</h3>
              </div>
              <span className="inline-flex shrink-0 items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                Daily Average
              </span>
            </div>

            <div className="mt-4">
              <p className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl tabular-nums">
                {display.todayMinutes == null
                  ? "No activity yet"
                  : formatUsageMinutes(display.todayMinutes)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Average per doctor today
                </span>
                <UsageTrendBadge deltaMinutes={diffMinutes} />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border/80 bg-secondary/50 p-3">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">Daily Benchmark Progress</span>
                <span className="font-semibold text-foreground">
                  {display.todayMinutes == null
                    ? "0% of 60 min goal"
                    : `${targetPercent}% of 60 min goal`}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border/60">
                <div
                  className="h-full rounded-full bg-gradient-brand transition-all duration-500"
                  style={{ width: `${Math.max(display.todayMinutes ? 3 : 0, targetPercent)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/60 pt-3">
            <div className="rounded-xl border border-border/70 bg-card p-2.5 text-left transition-colors">
              <span className="block truncate text-xs text-muted-foreground">Active Today</span>
              <p className="mt-1 text-sm font-bold tracking-tight text-foreground tabular-nums">
                {activeDoctorsToday} {activeDoctorsToday === 1 ? "Doctor" : "Doctors"}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-2.5 text-left transition-colors">
              <span className="block truncate text-xs text-muted-foreground">5-Day Avg</span>
              <p className="mt-1 text-sm font-bold tracking-tight text-foreground tabular-nums">
                {formatUsageMinutes(fiveDayAvg)}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-2.5 text-left transition-colors">
              <span className="block truncate text-xs text-muted-foreground">5-Day Peak</span>
              <p className="mt-1 text-sm font-bold tracking-tight text-foreground tabular-nums">
                {peakDay?.averageMinutes ? formatUsageMinutes(peakDay.averageMinutes) : "0 min"}
              </p>
            </div>
          </div>
        </article>

        <article className="card-surface flex min-w-0 flex-col justify-between p-4 sm:p-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold leading-snug">
                  Average Daily Time Spent — Last 5 Days
                </h3>
                {hoveredDay && (
                  <p className="text-xs text-muted-foreground transition-all duration-200">
                    <span className="font-medium text-primary">
                      {hoveredDay.fullDate}: {formatUsageMinutes(hoveredDay.averageMinutes)} (
                      {hoveredDay.activeDoctors} active{" "}
                      {hoveredDay.activeDoctors === 1 ? "doctor" : "doctors"})
                    </span>
                  </p>
                )}
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live View
              </span>
            </div>
            <UsageBars days={display.days} onHoverIndex={setHoveredChartIndex} />
          </div>
          <UsageTable days={display.days} />
          {display.source === "empty" ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No doctor activity recorded for these days.
            </p>
          ) : null}
        </article>
      </div>
    </section>
  );
}

function UsageTrendBadge({ deltaMinutes }: { deltaMinutes: number | null }) {
  if (deltaMinutes == null) return null;
  if (deltaMinutes === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
        Same as yesterday
      </span>
    );
  }
  const isPositive = deltaMinutes > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        isPositive ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
      )}
    >
      {formatUsageMinutes(Math.abs(deltaMinutes))} {isPositive ? "more" : "less"} than yesterday
    </span>
  );
}

function YesterdayComparison({ summary }: { summary: UsageSummary }) {
  if (summary.today.averageMs == null || summary.yesterday.averageMs == null) return null;
  const deltaMinutes = Math.round((summary.today.averageMs - summary.yesterday.averageMs) / 60_000);
  const text =
    deltaMinutes === 0
      ? "Same as yesterday"
      : `${formatUsageMinutes(Math.abs(summary.today.averageMs - summary.yesterday.averageMs) / 60_000)} ${
          deltaMinutes > 0 ? "more" : "less"
        } than yesterday`;
  return <p className="mt-2 text-sm text-muted-foreground">{text}</p>;
}

function UsageBars({
  days,
  onHoverIndex,
}: {
  days: DoctorUsageChartDay[];
  onHoverIndex?: (index: number | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const peak = Math.max(...days.map((day) => day.averageMinutes), 0);
  const domainMax = peak === 0 ? 60 : Math.ceil(peak / 15) * 15;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setWidth(element.clientWidth);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (state: { activeTooltipIndex?: number | undefined }) => {
    if (state && typeof state.activeTooltipIndex === "number") {
      setHoveredIndex(state.activeTooltipIndex);
      onHoverIndex?.(state.activeTooltipIndex);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    onHoverIndex?.(null);
  };

  return (
    <div ref={ref} className="mt-3 h-56 w-full min-w-0" aria-hidden={width === 0}>
      {width > 0 ? (
        <BarChart
          width={width}
          height={224}
          data={days}
          margin={{ top: 20, right: 8, left: 8, bottom: 0 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="usageBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f08a3c" />
              <stop offset="100%" stopColor="#e67230" />
            </linearGradient>
            <linearGradient id="usageBarHoverGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff9f59" />
              <stop offset="100%" stopColor="#f07222" />
            </linearGradient>
            <linearGradient id="usageCursorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(230, 114, 48, 0.14)" />
              <stop offset="100%" stopColor="rgba(230, 114, 48, 0.02)" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#eadfd4" strokeDasharray="3 3" opacity={0.6} />
          <XAxis
            dataKey="axisLabel"
            interval={0}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#8a7568", fontWeight: 500 }}
          />
          <YAxis
            width={72}
            domain={[0, domainMax]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#8a7568" }}
            tickFormatter={(value: number) => `${Math.round(value)}`}
            label={{
              value: "Minutes",
              angle: -90,
              position: "insideLeft",
              offset: 0,
              style: { fontSize: 11, fill: "#8a7568", fontWeight: 500 },
            }}
          />
          <Tooltip
            cursor={{ fill: "url(#usageCursorGradient)" }}
            content={<UsageTooltip />}
          />
          <Bar
            dataKey="averageMinutes"
            radius={[8, 8, 0, 0]}
            maxBarSize={48}
            isAnimationActive={true}
            animationDuration={900}
            animationEasing="ease-out"
          >
            <LabelList
              dataKey="averageMinutes"
              position="top"
              formatter={(value: number) => (value > 0 ? `${Math.round(value)}m` : "")}
              style={{
                fontSize: 11,
                fontWeight: 600,
                fill: "#8a7568",
                transition: "all 0.2s ease",
              }}
              offset={6}
            />
            {days.map((day, index) => {
              const isHovered = hoveredIndex === index;
              const isAnyHovered = hoveredIndex !== null;
              return (
                <Cell
                  key={day.dayKey}
                  fill={isHovered ? "url(#usageBarHoverGradient)" : "url(#usageBarGradient)"}
                  opacity={isAnyHovered && !isHovered ? 0.6 : 1}
                  className="cursor-pointer transition-all duration-200"
                  style={{
                    filter: isHovered ? "drop-shadow(0 6px 12px rgba(230, 114, 48, 0.4))" : "none",
                  }}
                />
              );
            })}
          </Bar>
        </BarChart>
      ) : null}
    </div>
  );
}

function UsageTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: DoctorUsageChartDay }>;
}) {
  const day = payload?.[0]?.payload;
  if (!active || !day) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md px-3.5 py-2.5 text-xs shadow-lift animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-1.5">
        <span className="font-semibold text-foreground">{day.fullDate}</span>
        <span className="inline-flex items-center rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
          {day.axisLabel}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-lg font-extrabold text-foreground tabular-nums">
          {day.activeDoctors === 0 ? "No activity" : formatUsageMinutes(day.averageMinutes)}
        </span>
        <span className="text-[11px] text-muted-foreground">avg duration</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-muted-foreground">
        <span>Active doctors:</span>
        <span className="font-semibold text-foreground">
          {day.activeDoctors} {day.activeDoctors === 1 ? "doctor" : "doctors"}
        </span>
      </div>
    </div>
  );
}

function UsageTable({ days }: { days: DoctorUsageChartDay[] }) {
  return (
    <table className="sr-only">
      <caption>Average daily time spent for the last 5 days</caption>
      <thead>
        <tr>
          <th>Date</th>
          <th>Average</th>
          <th>Active doctors</th>
        </tr>
      </thead>
      <tbody>
        {days.map((day) => (
          <tr key={day.dayKey}>
            <td>{day.fullDate}</td>
            <td>
              {day.activeDoctors === 0 ? "No activity" : formatUsageMinutes(day.averageMinutes)}
            </td>
            <td>{day.activeDoctors}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
