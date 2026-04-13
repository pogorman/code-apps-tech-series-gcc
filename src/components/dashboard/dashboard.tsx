import { useMemo, useState } from "react";
import { useActionItems } from "@/hooks/use-action-items";
import { useAccounts } from "@/hooks/use-accounts";
import type { Tdvsp_actionitemsModel } from "@/generated";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_TYPE_LABELS,
} from "@/components/action-items/labels";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  ClipboardCheck,
  Clock,
  AlertTriangle,
  TrendingUp,
  Briefcase,
  House,
  BookOpen,
} from "lucide-react";
import { DrilldownDialog } from "./drilldown-dialog";

type ActionItem = Tdvsp_actionitemsModel.Tdvsp_actionitems;

/* ── colour tokens ─────────────────────────────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  Recognized: "#888780",
  "In Progress": "#378ADD",
  "Pending Comms": "#EF9F27",
  "On Hold": "#ef4444",
  "Wrapping Up": "#8b5cf6",
  Complete: "#1D9E75",
};

const PRIORITY_COLORS: Record<string, string> = {
  "Top Priority": "#E24B4A",
  High: "#EF9F27",
  Low: "#378ADD",
  Med: "#888780",
};

const TYPE_COLORS: Record<string, string> = {
  Work: "#ef4444",
  Personal: "#3b82f6",
  Learning: "#d946ef",
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Work: Briefcase,
  Personal: House,
  Learning: BookOpen,
};

const ACCOUNT_PALETTE = [
  "#378ADD", "#1D9E75", "#EF9F27", "#8b5cf6", "#E24B4A", "#888780",
];

/* ── reverse lookups (label → numeric key) ─────────────────────── */

const STATUS_KEY_BY_LABEL = Object.fromEntries(
  Object.entries(STATUS_LABELS).map(([k, v]) => [v, Number(k)])
) as Record<string, number>;

const PRIORITY_KEY_BY_LABEL = Object.fromEntries(
  Object.entries(PRIORITY_LABELS).map(([k, v]) => [v, Number(k)])
) as Record<string, number>;

const TYPE_KEY_BY_LABEL = Object.fromEntries(
  Object.entries(TASK_TYPE_LABELS).map(([k, v]) => [v, Number(k)])
) as Record<string, number>;

/* ── animation keyframes ──────────────────────────────────────── */

const ANIM_CSS = `
@keyframes dashRise {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
`;

/* ── hover tooltip ─────────────────────────────────────────────── */

function Tip({
  children,
  items,
  label,
  onClick,
  position = "above",
}: {
  children: React.ReactNode;
  items: ActionItem[];
  label: string;
  onClick: () => void;
  position?: "above" | "below";
}) {
  const posClass =
    position === "below"
      ? "top-full left-1/2 -translate-x-1/2 mt-3"
      : "bottom-full left-1/2 -translate-x-1/2 mb-3";
  return (
    <div
      className="relative group/tip cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      {children}
      <div
        className={`absolute z-50 opacity-0 scale-95 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:scale-100 transition-all duration-200 ease-out ${posClass}`}
      >
        <div className="bg-popover/92 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl shadow-black/12 dark:shadow-black/40 p-3.5 min-w-[220px] max-w-[280px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground/70 mb-1.5">
            {items.length} {label}
          </p>
          {items.slice(0, 4).map((item) => (
            <p
              key={item.tdvsp_actionitemid}
              className="text-[11px] text-muted-foreground truncate leading-relaxed"
            >
              {item.tdvsp_name}
            </p>
          ))}
          {items.length > 4 && (
            <p className="text-[10px] text-muted-foreground/50 mt-1">
              +{items.length - 4} more
            </p>
          )}
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/35 mt-2 border-t border-border/30 pt-2">
            Click to drill down
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── SVG donut ─────────────────────────────────────────────────── */

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

function SvgDonut({
  slices,
  size = 144,
}: {
  slices: DonutSlice[];
  size?: number;
}) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 10;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = slices.map((slice) => {
    const pct = slice.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const currentOffset = offset;
    offset += dash;
    return (
      <circle
        key={slice.label}
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={slice.color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-currentOffset}
        strokeLinecap="butt"
        className="transition-all duration-700 ease-out"
      />
    );
  });

  return (
    <div
      className="relative"
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-border/40 dark:text-border/20"
          strokeWidth={strokeWidth}
        />
        {arcs}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[26px] font-bold leading-none tracking-tight tabular-nums">
          {total}
        </span>
        <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground/60 mt-1">
          total
        </span>
      </div>
    </div>
  );
}

/* ── horizontal bar row ────────────────────────────────────────── */

function HBar({
  label,
  value,
  max,
  color,
  showValue = true,
  onClick,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  showValue?: boolean;
  onClick?: () => void;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div
      className={`flex items-center gap-3 text-xs py-2 rounded-lg px-2 -mx-2 ${
        onClick
          ? "cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors duration-200"
          : ""
      }`}
      onClick={onClick}
    >
      <span className="min-w-[90px] text-muted-foreground truncate font-medium">
        {label}
      </span>
      <div className="flex-1 h-6 bg-muted/60 dark:bg-muted/30 rounded-full overflow-hidden">
        <div
          className="h-full flex items-center pl-2.5 text-[11px] font-semibold text-white rounded-full"
          style={{
            width: `${Math.max(pct, value > 0 ? 10 : 0)}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            transition: "width 0.7s cubic-bezier(.4,0,.2,1)",
          }}
        >
          {showValue && value > 0 ? value : ""}
        </div>
      </div>
    </div>
  );
}

/* ── status row with mini progress bar ─────────────────────────── */

function StatusRow({
  label,
  count,
  total,
  color,
  onClick,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  onClick?: () => void;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div
      className={`rounded-lg border border-border/40 dark:border-border/25 px-3.5 py-2.5 bg-muted/20 dark:bg-muted/10 transition-all duration-200 ${
        onClick
          ? "cursor-pointer hover:bg-muted/40 dark:hover:bg-muted/20 hover:border-border/60"
          : ""
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-muted-foreground flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-[3px]"
            style={{ background: color }}
          />
          {label}
        </span>
        <span className="text-xs font-bold tabular-nums">{count}</span>
      </div>
      <div className="h-[3px] bg-muted/60 dark:bg-muted/30 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: color,
            transition: "width 0.7s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
    </div>
  );
}

/* ── account bar row ──────────────────────────────────────────── */

function AccountRow({
  name,
  count,
  max,
  color,
  onClick,
}: {
  name: string;
  count: number;
  max: number;
  color: string;
  onClick?: () => void;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div
      className={`flex items-center gap-3 mb-1 text-xs rounded-lg px-2 -mx-2 py-2 ${
        onClick
          ? "cursor-pointer hover:bg-muted/40 dark:hover:bg-muted/20 transition-colors duration-200"
          : ""
      }`}
      onClick={onClick}
    >
      <span className="w-[180px] shrink-0 text-muted-foreground truncate font-medium">
        {name}
      </span>
      <div className="flex-1 h-2 bg-muted/60 dark:bg-muted/30 rounded-full overflow-hidden min-w-0">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: color,
            transition: "width 0.7s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
      <span className="text-muted-foreground text-[11px] font-bold tabular-nums min-w-[20px] text-right">
        {count}
      </span>
    </div>
  );
}

/* ── chart card shell ─────────────────────────────────────────── */

function ChartCard({
  title,
  accent,
  delay,
  children,
}: {
  title: string;
  accent: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <Card
      className="relative overflow-hidden transition-all duration-300 hover:shadow-md dark:hover:shadow-black/20"
      style={{
        animation: `dashRise 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both`,
      }}
    >
      {/* Top accent gradient line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${accent}, ${accent}40, transparent)`,
        }}
      />
      <div className="p-5 pt-4">
        {/* Section header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-1 h-4 rounded-full"
            style={{ background: accent }}
          />
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {title}
          </h2>
        </div>
        <div className="h-px bg-border/40 dark:bg-border/20 -mx-5 mb-4" />
        {children}
      </div>
    </Card>
  );
}

/* ── main dashboard ────────────────────────────────────────────── */

interface Drilldown {
  title: string;
  items: ActionItem[];
}

export function Dashboard() {
  const { data: items, isLoading, error } = useActionItems();
  const { data: accounts } = useAccounts();
  const [drilldown, setDrilldown] = useState<Drilldown | null>(null);

  const openDrilldown = (title: string, filtered: ActionItem[]) =>
    setDrilldown({ title, items: filtered });

  const stats = useMemo(() => {
    if (!items) return null;

    const total = items.length;
    const complete = items.filter(
      (i) => i.tdvsp_taskstatus === 468510005
    ).length;
    const inProgress = items.filter(
      (i) => i.tdvsp_taskstatus === 468510001
    ).length;
    const urgent = items.filter(
      (i) =>
        i.tdvsp_priority === 468510002 || i.tdvsp_priority === 468510003
    ).length;
    const completionRate =
      total > 0 ? Math.round((complete / total) * 100) : 0;

    // Status breakdown
    const statusCounts: { label: string; count: number; color: string }[] = [];
    for (const [key, label] of Object.entries(STATUS_LABELS)) {
      const count = items.filter(
        (i) => i.tdvsp_taskstatus === Number(key)
      ).length;
      if (count > 0)
        statusCounts.push({
          label,
          count,
          color: STATUS_COLORS[label] ?? "#94a3b8",
        });
    }

    // Priority breakdown
    const priorityCounts: {
      label: string;
      count: number;
      color: string;
    }[] = [];
    for (const [key, label] of Object.entries(PRIORITY_LABELS)) {
      const count = items.filter(
        (i) => i.tdvsp_priority === Number(key)
      ).length;
      if (count > 0)
        priorityCounts.push({
          label,
          count,
          color: PRIORITY_COLORS[label] ?? "#94a3b8",
        });
    }

    // Type breakdown
    const typeCounts: { label: string; count: number }[] = [];
    for (const [key, label] of Object.entries(TASK_TYPE_LABELS)) {
      const count = items.filter(
        (i) => i.tdvsp_tasktype === Number(key)
      ).length;
      if (count > 0) typeCounts.push({ label, count });
    }

    // Items per account
    const accountMap = new Map<string, string>();
    accounts?.forEach((a) => accountMap.set(a.accountid, a.name));

    const accountBuckets = new Map<string, number>();
    for (const item of items) {
      const custId = (item as unknown as Record<string, string>)
        ._tdvsp_customer_value;
      if (custId) {
        const name =
          item.tdvsp_customername ?? accountMap.get(custId) ?? "Unknown";
        accountBuckets.set(name, (accountBuckets.get(name) ?? 0) + 1);
      }
    }
    const accountCounts = [...accountBuckets.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({
        name,
        count,
        color: ACCOUNT_PALETTE[i % ACCOUNT_PALETTE.length] ?? "#888780",
      }));

    return {
      total,
      complete,
      inProgress,
      urgent,
      completionRate,
      statusCounts,
      priorityCounts,
      typeCounts,
      accountCounts,
    };
  }, [items, accounts]);

  /* ── filter helpers ─────────────────────────────────────────── */

  const filterByStatus = (label: string) =>
    items?.filter((i) => i.tdvsp_taskstatus === STATUS_KEY_BY_LABEL[label]) ??
    [];

  const filterByPriority = (label: string) =>
    items?.filter((i) => i.tdvsp_priority === PRIORITY_KEY_BY_LABEL[label]) ??
    [];

  const filterByType = (label: string) =>
    items?.filter((i) => i.tdvsp_tasktype === TYPE_KEY_BY_LABEL[label]) ?? [];

  const filterByAccount = (accountName: string) =>
    items?.filter((i) => {
      const name = i.tdvsp_customername ?? "Unknown";
      return name === accountName;
    }) ?? [];

  const filterComplete = () =>
    items?.filter((i) => i.tdvsp_taskstatus === 468510005) ?? [];

  const filterInProgress = () =>
    items?.filter((i) => i.tdvsp_taskstatus === 468510001) ?? [];

  const filterUrgent = () =>
    items?.filter(
      (i) =>
        i.tdvsp_priority === 468510002 || i.tdvsp_priority === 468510003
    ) ?? [];

  /* ── loading / error states ─────────────────────────────────── */

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 dark:bg-destructive/10 p-5 text-destructive">
        Failed to load dashboard data: {error.message}
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <Skeleton className="h-5 w-32 mb-1.5" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-3 w-20 mb-4" />
              <Skeleton className="h-8 w-14 mb-2" />
              <Skeleton className="h-3 w-28" />
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-3 w-32 mb-6" />
              <Skeleton className="h-[200px] w-full rounded-lg" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const allItems = items ?? [];

  const donutSlices: DonutSlice[] = stats.statusCounts.map((s) => ({
    label: s.label,
    value: s.count,
    color: s.color,
  }));

  const statusTotal = stats.statusCounts.reduce((s, d) => s + d.count, 0);
  const priorityMax = Math.max(
    ...stats.priorityCounts.map((p) => p.count),
    1
  );
  const accountMax = Math.max(
    ...stats.accountCounts.map((a) => a.count),
    1
  );
  const typeTotal = stats.typeCounts.reduce((s, d) => s + d.count, 0);

  const kpis = [
    {
      label: "Total Items",
      value: stats.total,
      sub: "across all accounts",
      accent: "#378ADD",
      icon: ClipboardCheck,
      filterItems: () => allItems,
      drilldownTitle: "All Action Items",
    },
    {
      label: "Completion Rate",
      value: `${stats.completionRate}%`,
      sub: `${stats.complete} of ${stats.total} complete`,
      accent: "#1D9E75",
      icon: TrendingUp,
      filterItems: filterComplete,
      drilldownTitle: "Completed Items",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      sub: "actively being worked",
      accent: "#EF9F27",
      icon: Clock,
      filterItems: filterInProgress,
      drilldownTitle: "In Progress Items",
    },
    {
      label: "High / Top Priority",
      value: stats.urgent,
      sub: "need attention",
      accent: "#E24B4A",
      icon: AlertTriangle,
      filterItems: filterUrgent,
      drilldownTitle: "High & Top Priority Items",
    },
  ];

  return (
    <>
      <style>{ANIM_CSS}</style>
      <div className="space-y-5">
        {/* Header */}
        <div
          className="flex items-center gap-3"
          style={{
            animation:
              "dashRise 0.55s cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/15">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Action Items
            </h1>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
              Insights at a glance
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, idx) => {
            const filtered = kpi.filterItems();
            const Icon = kpi.icon;
            return (
              <Tip
                key={kpi.label}
                items={filtered}
                label={kpi.label.toLowerCase()}
                onClick={() =>
                  openDrilldown(kpi.drilldownTitle, filtered)
                }
                position="below"
              >
                <Card
                  className="group/kpi relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/25"
                  style={{
                    borderLeft: `3px solid ${kpi.accent}`,
                    animation: `dashRise 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${60 + idx * 75}ms both`,
                  }}
                >
                  {/* Subtle accent radial glow */}
                  <div
                    className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-[0.06] dark:opacity-[0.10] blur-2xl pointer-events-none"
                    style={{ background: kpi.accent }}
                  />

                  <div className="relative px-5 py-4">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 font-medium">
                        {kpi.label}
                      </p>
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-300 group-hover/kpi:scale-110"
                        style={{ background: `${kpi.accent}14` }}
                      >
                        <Icon
                          className="h-4 w-4"
                          style={{ color: kpi.accent }}
                        />
                      </div>
                    </div>
                    <p className="text-[28px] font-bold leading-none tracking-tight tabular-nums">
                      {kpi.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground/50 mt-2">
                      {kpi.sub}
                    </p>
                  </div>
                </Card>
              </Tip>
            );
          })}
        </div>

        {/* Charts row 1 */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Status breakdown: donut + side list */}
          <ChartCard title="Status Breakdown" accent="#378ADD" delay={360}>
            {stats.statusCounts.length > 0 ? (
              <div className="flex items-center gap-5">
                <SvgDonut slices={donutSlices} />
                <div className="flex-1 min-w-0 space-y-1.5">
                  {stats.statusCounts.map((s) => {
                    const filtered = filterByStatus(s.label);
                    return (
                      <Tip
                        key={s.label}
                        items={filtered}
                        label={`${s.label.toLowerCase()} items`}
                        onClick={() =>
                          openDrilldown(`Status: ${s.label}`, filtered)
                        }
                      >
                        <StatusRow
                          label={s.label}
                          count={s.count}
                          total={statusTotal}
                          color={s.color}
                        />
                      </Tip>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground/50 text-sm">No data</p>
            )}
          </ChartCard>

          {/* Priority distribution */}
          <ChartCard title="Priority Distribution" accent="#EF9F27" delay={435}>
            {stats.priorityCounts.length > 0 ? (
              <div className="space-y-0.5">
                {stats.priorityCounts.map((p) => {
                  const filtered = filterByPriority(p.label);
                  return (
                    <Tip
                      key={p.label}
                      items={filtered}
                      label={`${p.label.toLowerCase()} priority items`}
                      onClick={() =>
                        openDrilldown(`Priority: ${p.label}`, filtered)
                      }
                    >
                      <HBar
                        label={p.label}
                        value={p.count}
                        max={priorityMax}
                        color={p.color}
                      />
                    </Tip>
                  );
                })}
                <div className="mt-3 pt-3 border-t border-border/40 dark:border-border/20 flex justify-between items-center px-2 -mx-2">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/60">
                    High + top priority
                  </span>
                  <span
                    className="text-base font-bold tabular-nums"
                    style={{ color: "#E24B4A" }}
                  >
                    {stats.urgent}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground/50 text-sm">No data</p>
            )}
          </ChartCard>
        </div>

        {/* Charts row 2 */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Task types (Work / Personal / Learning) */}
          <ChartCard title="Task Types" accent="#8b5cf6" delay={510}>
            {stats.typeCounts.length > 0 ? (
              <div className="space-y-4">
                {/* Segmented overview bar */}
                <div className="flex h-3 rounded-full overflow-hidden bg-muted/40 dark:bg-muted/20">
                  {stats.typeCounts.map((t) => {
                    const pct =
                      typeTotal > 0 ? (t.count / typeTotal) * 100 : 0;
                    const color = TYPE_COLORS[t.label] ?? "#94a3b8";
                    return (
                      <div
                        key={t.label}
                        className="h-full transition-all duration-700 ease-out first:rounded-l-full last:rounded-r-full"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    );
                  })}
                </div>
                {/* Individual rows */}
                <div className="space-y-1">
                  {stats.typeCounts.map((t) => {
                    const pct =
                      typeTotal > 0
                        ? Math.round((t.count / typeTotal) * 100)
                        : 0;
                    const color = TYPE_COLORS[t.label] ?? "#94a3b8";
                    const TypeIcon = TYPE_ICONS[t.label];
                    const filtered = filterByType(t.label);
                    return (
                      <Tip
                        key={t.label}
                        items={filtered}
                        label={`${t.label.toLowerCase()} items`}
                        onClick={() =>
                          openDrilldown(`Type: ${t.label}`, filtered)
                        }
                      >
                        <div className="flex items-center gap-3 text-xs rounded-lg px-2 -mx-2 py-2 cursor-pointer hover:bg-muted/40 dark:hover:bg-muted/20 transition-colors duration-200">
                          {TypeIcon ? (
                            <TypeIcon
                              className="h-3.5 w-3.5 shrink-0"
                              style={{ color }}
                            />
                          ) : (
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-[3px] shrink-0"
                              style={{ background: color }}
                            />
                          )}
                          <span className="text-muted-foreground min-w-[70px] font-medium">
                            {t.label}
                          </span>
                          <div className="flex-1 h-2 bg-muted/50 dark:bg-muted/25 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                background: color,
                                transition:
                                  "width 0.7s cubic-bezier(.4,0,.2,1)",
                              }}
                            />
                          </div>
                          <span className="text-[11px] font-bold tabular-nums min-w-[42px] text-right text-muted-foreground">
                            {t.count}{" "}
                            <span className="text-muted-foreground/40">
                              ({pct}%)
                            </span>
                          </span>
                        </div>
                      </Tip>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground/50 text-sm">No data</p>
            )}
          </ChartCard>

          {/* Items by account */}
          <ChartCard title="Items by Account" accent="#1D9E75" delay={585}>
            {stats.accountCounts.length > 0 ? (
              <div className="space-y-0.5">
                {stats.accountCounts.map((a) => {
                  const filtered = filterByAccount(a.name);
                  return (
                    <Tip
                      key={a.name}
                      items={filtered}
                      label={`items for ${a.name}`}
                      onClick={() =>
                        openDrilldown(`Account: ${a.name}`, filtered)
                      }
                    >
                      <AccountRow
                        name={a.name}
                        count={a.count}
                        max={accountMax}
                        color={a.color}
                      />
                    </Tip>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground/50 text-sm">
                No customer-linked items
              </p>
            )}
          </ChartCard>
        </div>

        {/* Drilldown dialog */}
        <DrilldownDialog
          open={drilldown !== null}
          onOpenChange={(open) => {
            if (!open) setDrilldown(null);
          }}
          title={drilldown?.title ?? ""}
          items={drilldown?.items ?? []}
        />
      </div>
    </>
  );
}
