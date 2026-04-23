import type { AccountDatum } from "./dashboard-tokens";
import { STATUS_COLORS } from "./dashboard-tokens";
import { CardShell } from "./status-breakdown";

interface ItemsByAccountProps {
  accountCounts: AccountDatum[];
  onAccountClick: (name: string) => void;
}

export function ItemsByAccount({
  accountCounts,
  onAccountClick,
}: ItemsByAccountProps) {
  if (accountCounts.length === 0) {
    return (
      <CardShell
        title="Items by Account"
        accent="var(--dash-violet)"
        meta={`0 accounts`}
      >
        <div className="p-4">
          <p className="text-sm" style={{ color: "var(--dash-ink-4)" }}>
            No customer-linked items
          </p>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell
      title="Items by Account"
      accent="var(--dash-violet)"
      meta={`${accountCounts.length} accounts`}
    >
      <div className="p-3.5 px-4">
        {accountCounts.map((a) => {
          const initials = getInitials(a.name);
          return (
            <div
              key={a.name}
              className="grid items-center gap-3 py-1.5 cursor-pointer"
              style={{ gridTemplateColumns: "160px 1fr 30px" }}
              onClick={() => onAccountClick(a.name)}
              onMouseEnter={(e) => {
                const nameEl = e.currentTarget.querySelector("[data-name]") as HTMLElement;
                if (nameEl) nameEl.style.color = "var(--dash-ink-1)";
              }}
              onMouseLeave={(e) => {
                const nameEl = e.currentTarget.querySelector("[data-name]") as HTMLElement;
                if (nameEl) nameEl.style.color = "var(--dash-ink-2)";
              }}
            >
              {/* Avatar + name */}
              <div
                data-name
                className="flex items-center gap-2 text-xs font-medium truncate"
                style={{ color: "var(--dash-ink-2)" }}
              >
                <div
                  className="w-[18px] h-[18px] rounded shrink-0 grid place-items-center text-white text-[9px] font-bold font-mono"
                  style={{ background: a.color }}
                >
                  {initials}
                </div>
                <span className="truncate" title={a.name}>
                  {a.name}
                </span>
              </div>

              {/* Stacked status bar */}
              <div
                className="flex gap-0.5 h-2 rounded overflow-hidden"
                style={{ background: "var(--dash-surface-2)" }}
              >
                {a.statusBreakdown.map((seg) => {
                  const pct =
                    a.count > 0 ? (seg.count / a.count) * 100 : 0;
                  return (
                    <div
                      key={seg.label}
                      className="h-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: seg.color }}
                      title={`${seg.label}: ${seg.count}`}
                    />
                  );
                })}
              </div>

              {/* Count */}
              <span
                className="text-right tabular-nums font-semibold text-xs font-mono"
                style={{ color: "var(--dash-ink-1)" }}
              >
                {a.count}
              </span>
            </div>
          );
        })}

        {/* Legend */}
        <div
          className="mt-2.5 pt-2.5 flex gap-2.5 flex-wrap text-[10px]"
          style={{
            borderTop: "1px dashed var(--dash-border)",
            color: "var(--dash-ink-4)",
          }}
        >
          {Object.entries(STATUS_COLORS).map(([label, color]) => (
            <span key={label} className="inline-flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ background: color }}
              />
              {label === "Pending Comms" ? "Pending" : label === "Wrapping Up" ? "Wrapping" : label}
            </span>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

function getInitials(name: string): string {
  const words = name.split(/\s+/);
  if (words.length >= 2) {
    return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
