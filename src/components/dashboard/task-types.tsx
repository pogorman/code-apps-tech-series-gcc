import type { TypeDatum } from "./dashboard-tokens";
import { CardShell } from "./status-breakdown";

interface TaskTypesProps {
  typeCounts: TypeDatum[];
  total: number;
  onTypeClick: (label: string) => void;
}

export function TaskTypes({
  typeCounts,
  total,
  onTypeClick,
}: TaskTypesProps) {
  if (typeCounts.length === 0) {
    return (
      <CardShell title="Task Types" accent="var(--dash-pink)" meta={`${total} total`}>
        <div className="p-4">
          <p className="text-sm" style={{ color: "var(--dash-ink-4)" }}>No data</p>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell title="Task Types" accent="var(--dash-pink)" meta={`${total} total`}>
      <div className="p-3.5 px-4">
        {/* Stacked composition bar */}
        <div
          className="flex h-2 rounded overflow-hidden mb-3.5"
          style={{ background: "var(--dash-surface-2)" }}
        >
          {typeCounts.map((t) => {
            const pct = total > 0 ? (t.count / total) * 100 : 0;
            return (
              <div
                key={t.label}
                className="h-full transition-all duration-500"
                style={{ width: `${pct}%`, background: t.color }}
                title={`${t.label} ${t.count}`}
              />
            );
          })}
        </div>

        {/* Individual rows */}
        {typeCounts.map((t) => {
          const pct = total > 0 ? Math.round((t.count / total) * 100) : 0;
          return (
            <div
              key={t.label}
              className="grid items-center gap-3 py-1.5 cursor-pointer"
              style={{ gridTemplateColumns: "90px 1fr 60px" }}
              onClick={() => onTypeClick(t.label)}
            >
              <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--dash-ink-2)" }}>
                <span
                  className="w-2 h-2 rounded-sm shrink-0"
                  style={{ background: t.color }}
                />
                {t.label}
              </div>
              <div
                className="h-1.5 rounded-[3px] overflow-hidden"
                style={{ background: "var(--dash-surface-2)" }}
              >
                <div
                  className="h-full rounded-[3px] transition-all duration-500"
                  style={{ width: `${pct}%`, background: t.color }}
                />
              </div>
              <div
                className="text-right tabular-nums font-semibold text-xs font-mono"
                style={{ color: "var(--dash-ink-1)" }}
              >
                {t.count}
                <span className="ml-1" style={{ color: "var(--dash-ink-4)", fontWeight: 500, fontSize: 11 }}>
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}
