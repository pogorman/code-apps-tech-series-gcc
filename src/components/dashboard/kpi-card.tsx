import {
  ClipboardCheck,
  TrendingUp,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { DashboardStats, ActionItem } from "./dashboard-tokens";

interface KpiGridProps {
  stats: DashboardStats;
  allItems: ActionItem[];
  onDrilldown: (title: string, items: ActionItem[]) => void;
}

export function KpiGrid({ stats, allItems, onDrilldown }: KpiGridProps) {
  const filterComplete = () =>
    allItems.filter((i) => i.tdvsp_taskstatus === 468510005);
  const filterInProgress = () =>
    allItems.filter((i) => i.tdvsp_taskstatus === 468510001);
  const filterUrgent = () =>
    allItems.filter(
      (i) => i.tdvsp_priority === 468510002 || i.tdvsp_priority === 468510003
    );

  const open = stats.total - stats.complete;

  return (
    <div
      className="grid gap-2.5 mb-3.5"
      style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
    >
      {/* Total Items */}
      <KpiShell
        label="Total Items"
        iconBg="var(--dash-t-blue)"
        iconColor="var(--dash-blue)"
        icon={<ClipboardCheck className="h-3.5 w-3.5" />}
        onClick={() => onDrilldown("All Action Items", allItems)}
      >
        <ValueRow value={stats.total} delta={stats.weekDelta} />
        <Sub>across all accounts · vs last week</Sub>
        <Sparkline color="var(--dash-blue)" />
      </KpiShell>

      {/* Completion Rate */}
      <KpiShell
        label="Completion Rate"
        iconBg="var(--dash-t-green)"
        iconColor="var(--dash-green)"
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        onClick={() => onDrilldown("Completed Items", filterComplete())}
      >
        <ValueRow value={`${stats.completionRate}%`} />
        <Sub>{stats.complete} of {stats.total} complete</Sub>
        <RatioBar
          segments={[
            { pct: stats.completionRate, color: "var(--dash-green)" },
            { pct: 100 - stats.completionRate, color: "var(--dash-surface-2)" },
          ]}
        />
        <Legend
          items={[
            { color: "var(--dash-green)", label: `Done ${stats.complete}` },
            { color: "var(--dash-surface-2)", label: `Open ${open}` },
          ]}
        />
      </KpiShell>

      {/* In Progress */}
      <KpiShell
        label="In Progress"
        iconBg="var(--dash-t-amber)"
        iconColor="var(--dash-amber)"
        icon={<Clock className="h-3.5 w-3.5" />}
        onClick={() => onDrilldown("In Progress Items", filterInProgress())}
      >
        <ValueRow value={stats.inProgress} />
        <Sub>actively being worked</Sub>
        <Histogram color="var(--dash-amber)" />
      </KpiShell>

      {/* High / Top Priority */}
      <KpiShell
        label="High / Top Priority"
        iconBg="var(--dash-t-red)"
        iconColor="var(--dash-red)"
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        onClick={() =>
          onDrilldown("High & Top Priority Items", filterUrgent())
        }
      >
        <ValueRow value={stats.urgent} />
        <Sub>
          need attention · {stats.topCount} top / {stats.highCount} high
        </Sub>
        <RatioBar
          segments={stats.priorityCounts.map((p) => ({
            pct:
              stats.total > 0
                ? (p.count / stats.total) * 100
                : 0,
            color: p.color,
          }))}
        />
        <Legend
          items={stats.priorityCounts.map((p) => ({
            color: p.color,
            label: `${p.label} ${p.count}`,
          }))}
        />
      </KpiShell>
    </div>
  );
}

/* ── KPI card shell ─────────────────────────────────────────────── */

function KpiShell({
  label,
  iconBg,
  iconColor,
  icon,
  onClick,
  children,
}: {
  label: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col gap-2.5 rounded-[10px] p-3.5 cursor-pointer transition-[border-color] duration-150"
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
      }}
      onClick={onClick}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "var(--dash-border-strong)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--dash-border)")
      }
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: "var(--dash-ink-3)" }}
        >
          {label}
        </span>
        <div
          className="w-[22px] h-[22px] rounded-md grid place-items-center"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Value row with optional trend chip ─────────────────────────── */

function ValueRow({
  value,
  delta,
}: {
  value: number | string;
  delta?: number;
}) {
  const trendColor =
    delta && delta > 0
      ? { bg: "var(--dash-t-green)", color: "#047857" }
      : delta && delta < 0
        ? { bg: "var(--dash-t-red)", color: "#b91c1c" }
        : delta !== undefined
          ? { bg: "var(--dash-surface-2)", color: "var(--dash-ink-3)" }
          : null;

  return (
    <div className="flex items-baseline gap-2">
      <span
        className="text-[30px] font-bold tracking-[-0.03em] leading-none tabular-nums"
        style={{ color: "var(--dash-ink-1)" }}
      >
        {value}
      </span>
      {trendColor && delta !== undefined && (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded tabular-nums"
          style={{ background: trendColor.bg, color: trendColor.color }}
        >
          {delta > 0 ? "+" : ""}
          {delta}
        </span>
      )}
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] -mt-1"
      style={{ color: "var(--dash-ink-3)" }}
    >
      {children}
    </div>
  );
}

/* ── Sparkline (decorative SVG) ─────────────────────────────────── */

function Sparkline({ color }: { color: string }) {
  return (
    <svg
      className="h-[34px] -mx-0.5"
      viewBox="0 0 120 34"
      preserveAspectRatio="none"
      style={{ width: "100%" }}
    >
      <defs>
        <linearGradient id="dash-sg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d="M0,24 L12,22 L24,25 L36,20 L48,18 L60,21 L72,15 L84,17 L96,12 L108,10 L120,6 L120,34 L0,34 Z"
        fill="url(#dash-sg)"
      />
      <path
        d="M0,24 L12,22 L24,25 L36,20 L48,18 L60,21 L72,15 L84,17 L96,12 L108,10 L120,6"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={120}
        cy={6}
        r={2.5}
        fill={color}
        stroke="var(--dash-surface)"
        strokeWidth={1.5}
      />
    </svg>
  );
}

/* ── Histogram (decorative SVG) ─────────────────────────────────── */

function Histogram({ color }: { color: string }) {
  const bars = [18, 14, 20, 12, 16, 10, 14, 8, 12, 16, 10, 6];
  return (
    <svg
      className="h-[34px] -mx-0.5"
      viewBox="0 0 120 34"
      preserveAspectRatio="none"
      style={{ width: "100%" }}
    >
      <g fill={color}>
        {bars.map((y, i) => (
          <rect
            key={i}
            x={2 + i * 10}
            y={y}
            width={6}
            height={34 - y}
            rx={1}
            opacity={0.4 + i * 0.05}
          />
        ))}
      </g>
    </svg>
  );
}

/* ── Ratio bar ──────────────────────────────────────────────────── */

function RatioBar({
  segments,
}: {
  segments: { pct: number; color: string }[];
}) {
  return (
    <div
      className="flex h-1.5 rounded-[3px] overflow-hidden gap-px"
      style={{ background: "var(--dash-surface-2)" }}
    >
      {segments.map((seg, i) => (
        <div
          key={i}
          className="h-full transition-all duration-500"
          style={{ width: `${seg.pct}%`, background: seg.color }}
        />
      ))}
    </div>
  );
}

/* ── Legend ──────────────────────────────────────────────────────── */

function Legend({
  items,
}: {
  items: { color: string; label: string }[];
}) {
  return (
    <div className="flex gap-2.5 flex-wrap text-[10px]" style={{ color: "var(--dash-ink-3)" }}>
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1 tabular-nums">
          <span
            className="w-1.5 h-1.5 rounded-sm"
            style={{ background: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
