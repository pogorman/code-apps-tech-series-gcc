import type { StatusDatum } from "./dashboard-tokens";

interface StatusBreakdownProps {
  statusCounts: StatusDatum[];
  weekDelta: number;
  onStatusClick: (label: string) => void;
}

export function StatusBreakdown({
  statusCounts,
  weekDelta,
  onStatusClick,
}: StatusBreakdownProps) {
  const total = statusCounts.reduce((s, d) => s + d.count, 0);
  if (total === 0) {
    return <Empty />;
  }

  return (
    <CardShell title="Status Breakdown" accent="var(--dash-blue)">
      <div
        className="grid gap-4 items-center p-4"
        style={{ gridTemplateColumns: "200px 1fr" }}
      >
        {/* SVG Donut */}
        <div className="relative" style={{ width: 200, height: 200 }}>
          <svg width={200} height={200} viewBox="0 0 120 120">
            <circle
              cx={60}
              cy={60}
              r={48}
              fill="none"
              stroke="var(--dash-border)"
              strokeWidth={16}
            />
            <g
              transform="rotate(-90 60 60)"
              fill="none"
              strokeWidth={16}
            >
              {renderArcs(statusCounts, total)}
            </g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[34px] font-bold tracking-[-0.02em] tabular-nums font-mono"
              style={{ color: "var(--dash-ink-1)" }}
            >
              {total}
            </span>
            <span
              className="text-[9px] font-semibold tracking-[0.1em] uppercase mt-0.5"
              style={{ color: "var(--dash-ink-4)" }}
            >
              Total
            </span>
            {weekDelta > 0 && (
              <span
                className="mt-1.5 text-[11px] font-semibold px-1.5 py-0.5 rounded tabular-nums"
                style={{ background: "var(--dash-t-green)", color: "#047857" }}
              >
                +{weekDelta} wk
              </span>
            )}
          </div>
        </div>

        {/* Side list */}
        <div className="flex flex-col gap-2">
          {statusCounts.map((s) => {
            const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
            const maxCount = Math.max(...statusCounts.map((c) => c.count));
            const barPct = maxCount > 0 ? Math.round((s.count / maxCount) * 100) : 0;
            return (
              <div
                key={s.label}
                className="grid items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer"
                style={{
                  gridTemplateColumns: "14px 1fr auto",
                }}
                onClick={() => onStatusClick(s.label)}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--dash-surface-2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <span
                  className="w-2.5 h-2.5 rounded-[3px]"
                  style={{ background: s.color }}
                />
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-medium min-w-[100px]"
                    style={{ color: "var(--dash-ink-1)" }}
                  >
                    {s.label}
                  </span>
                  <div
                    className="flex-1 h-1 rounded-sm overflow-hidden"
                    style={{ background: "var(--dash-surface-2)" }}
                  >
                    <div
                      className="h-full rounded-sm transition-all duration-500"
                      style={{ width: `${barPct}%`, background: s.color }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="text-xs font-semibold tabular-nums min-w-[24px] text-right font-mono"
                    style={{ color: "var(--dash-ink-1)" }}
                  >
                    {s.count}
                  </span>
                  <span
                    className="text-[10px] tabular-nums font-mono"
                    style={{ color: "var(--dash-ink-4)" }}
                  >
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CardShell>
  );
}

/* ── SVG arc renderer ───────────────────────────────────────────── */

function renderArcs(slices: StatusDatum[], total: number) {
  const circumference = 2 * Math.PI * 48; // ~301.6
  let offset = 0;
  return slices.map((slice) => {
    const pct = slice.count / total;
    const dash = pct * circumference;
    const currentOffset = offset;
    offset += dash;
    return (
      <circle
        key={slice.label}
        cx={60}
        cy={60}
        r={48}
        stroke={slice.color}
        strokeDasharray={`${dash} ${circumference}`}
        strokeDashoffset={-currentOffset}
        className="transition-all duration-700"
      />
    );
  });
}

/* ── Card shell (shared by all chart cards) ─────────────────────── */

export function CardShell({
  title,
  accent,
  meta,
  children,
}: {
  title: string;
  accent: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
      }}
    >
      <div
        className="flex items-center justify-between px-3.5 py-2.5"
        style={{ borderBottom: "1px solid var(--dash-border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-[3px] h-3 rounded-sm"
            style={{ background: accent }}
          />
          <h3
            className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--dash-ink-2)" }}
          >
            {title}
          </h3>
        </div>
        {meta && (
          <span
            className="text-[11px] font-mono"
            style={{ color: "var(--dash-ink-4)" }}
          >
            {meta}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <CardShell title="Status Breakdown" accent="var(--dash-blue)">
      <div className="p-4">
        <p className="text-sm" style={{ color: "var(--dash-ink-4)" }}>
          No data
        </p>
      </div>
    </CardShell>
  );
}
