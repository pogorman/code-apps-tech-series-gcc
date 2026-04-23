import type { PriorityDatum } from "./dashboard-tokens";
import { CardShell } from "./status-breakdown";

interface PriorityDistributionProps {
  priorityCounts: PriorityDatum[];
  total: number;
  urgent: number;
  onPriorityClick: (label: string) => void;
}

export function PriorityDistribution({
  priorityCounts,
  total,
  urgent,
  onPriorityClick,
}: PriorityDistributionProps) {
  if (priorityCounts.length === 0) {
    return (
      <CardShell title="Priority Distribution" accent="var(--dash-red)" meta={`Σ ${total} items`}>
        <div className="p-4">
          <p className="text-sm" style={{ color: "var(--dash-ink-4)" }}>No data</p>
        </div>
      </CardShell>
    );
  }

  const maxCount = Math.max(...priorityCounts.map((p) => p.count), 1);

  return (
    <CardShell
      title="Priority Distribution"
      accent="var(--dash-red)"
      meta={`Σ ${total} items`}
    >
      <div className="p-3.5 px-4">
        {priorityCounts.map((p) => {
          const barPct = maxCount > 0 ? Math.round((p.count / maxCount) * 100) : 0;
          return (
            <div
              key={p.label}
              className="grid items-center gap-3 py-1.5 cursor-pointer"
              style={{ gridTemplateColumns: "68px 1fr 36px" }}
              onClick={() => onPriorityClick(p.label)}
            >
              <span
                className="text-xs font-medium"
                style={{ color: "var(--dash-ink-2)" }}
              >
                {p.label}
              </span>
              <div
                className="h-[18px] rounded overflow-hidden relative"
                style={{ background: "var(--dash-surface-2)" }}
              >
                <div
                  className="h-full rounded flex items-center justify-end pr-2 text-white text-[11px] font-semibold tabular-nums transition-all duration-300"
                  style={{
                    width: `${Math.max(barPct, 8)}%`,
                    background: p.color,
                    minWidth: 24,
                  }}
                >
                  {barPct > 15 ? p.count : ""}
                </div>
              </div>
              <span
                className="text-right font-semibold tabular-nums font-mono"
                style={{ color: "var(--dash-ink-1)", fontSize: 12 }}
              >
                {p.count}
              </span>
            </div>
          );
        })}

        {/* Dashed footer */}
        <div
          className="mt-2.5 pt-2.5 flex items-center justify-between"
          style={{ borderTop: "1px dashed var(--dash-border)" }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.06em]"
            style={{ color: "var(--dash-ink-3)" }}
          >
            High + Top Priority
          </span>
          <span className="font-mono">
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: "var(--dash-red)" }}
            >
              {urgent}
            </span>
            <span
              className="text-[10px] ml-1"
              style={{ color: "var(--dash-ink-4)" }}
            >
              · {total > 0 ? Math.round((urgent / total) * 100) : 0}%
            </span>
          </span>
        </div>
      </div>
    </CardShell>
  );
}
