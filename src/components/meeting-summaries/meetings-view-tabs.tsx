export type MeetingSavedView = "all" | "mine" | "this-week" | "needs-summary" | "pinned" | "archived";

interface MeetingsViewTabsProps {
  active: MeetingSavedView;
  onChange: (v: MeetingSavedView) => void;
  counts: Record<MeetingSavedView, number>;
}

const TABS: { key: MeetingSavedView; label: string }[] = [
  { key: "all", label: "All" },
  { key: "mine", label: "Mine" },
  { key: "this-week", label: "This week" },
  { key: "needs-summary", label: "Needs summary" },
  { key: "pinned", label: "Pinned" },
  { key: "archived", label: "Archived" },
];

export function MeetingsViewTabs({ active, onChange, counts }: MeetingsViewTabsProps) {
  return (
    <div
      className="flex items-end gap-0.5"
      style={{
        padding: "0 18px",
        borderBottom: "1px solid var(--dash-border)",
        background: "var(--dash-bg)",
      }}
    >
      {TABS.map((tab) => {
        const on = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className="inline-flex items-center gap-2 text-[12px] transition-colors cursor-pointer"
            style={{
              padding: "8px 14px 9px",
              borderTopLeftRadius: 7,
              borderTopRightRadius: 7,
              borderTop: on ? "1px solid var(--dash-border)" : "1px solid transparent",
              borderLeft: on ? "1px solid var(--dash-border)" : "1px solid transparent",
              borderRight: on ? "1px solid var(--dash-border)" : "1px solid transparent",
              borderBottom: 0,
              marginBottom: -1,
              fontWeight: on ? 600 : 500,
              color: on ? "var(--dash-ink-1)" : "var(--dash-ink-3)",
              background: on ? "var(--dash-surface)" : "transparent",
            }}
          >
            {tab.label}
            <span
              className="tabular-nums"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                padding: "1px 6px",
                borderRadius: 10,
                background: on ? "var(--dash-surface-2)" : "var(--dash-surface)",
                border: "1px solid var(--dash-border)",
                color: "var(--dash-ink-3)",
                fontWeight: 600,
              }}
            >
              {counts[tab.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
