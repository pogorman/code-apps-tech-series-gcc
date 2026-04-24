import { Calendar, Filter, LayoutGrid, Rows3, X } from "lucide-react";

export type MeetingViewMode = "table" | "gallery" | "timeline";

interface MeetingsSubtoolbarProps {
  viewMode: MeetingViewMode;
  onViewModeChange: (m: MeetingViewMode) => void;
  accountFilter: string | null;
  accountName?: string;
  onAccountClear: () => void;
  resultCount: number;
  totalCount: number;
}

export function MeetingsSubtoolbar({
  viewMode,
  onViewModeChange,
  accountFilter,
  accountName,
  onAccountClear,
  resultCount,
  totalCount,
}: MeetingsSubtoolbarProps) {
  const hasFilters = accountFilter !== null;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      style={{
        padding: "8px 18px",
        background: "var(--dash-surface)",
        borderBottom: "1px solid var(--dash-border)",
      }}
    >
      <span
        className="inline-flex items-center gap-1.5 text-[11px] font-medium"
        style={{ color: "var(--dash-ink-4)" }}
      >
        <Filter className="h-[12px] w-[12px]" />
        Filters
      </span>

      {accountFilter !== null && (
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-medium"
          style={{
            height: 26,
            padding: "0 4px 0 9px",
            borderRadius: 6,
            background: "var(--dash-teal)",
            color: "#fff",
            border: "1px solid var(--dash-teal)",
          }}
        >
          Account: {accountName ?? "—"}
          <button
            type="button"
            onClick={onAccountClear}
            className="inline-flex items-center justify-center cursor-pointer"
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              background: "rgba(255,255,255,.18)",
              color: "#fff",
              border: 0,
            }}
          >
            <X className="h-[10px] w-[10px]" />
          </button>
        </span>
      )}

      {!hasFilters && (
        <span
          className="text-[11px]"
          style={{
            color: "var(--dash-ink-4)",
            padding: "2px 6px",
            fontStyle: "italic",
          }}
        >
          click an account group header to filter
        </span>
      )}

      <div className="flex-1" />

      <ViewModeSegment mode={viewMode} onChange={onViewModeChange} />

      <span
        className="text-[11px] tabular-nums"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          color: "var(--dash-ink-4)",
        }}
      >
        {resultCount === totalCount ? `${totalCount} meetings` : `${resultCount} of ${totalCount}`}
      </span>
    </div>
  );
}

function ViewModeSegment({ mode, onChange }: { mode: MeetingViewMode; onChange: (m: MeetingViewMode) => void }) {
  const MODES: { key: MeetingViewMode; icon: typeof Rows3; label: string }[] = [
    { key: "table",    icon: Rows3,      label: "Table" },
    { key: "gallery",  icon: LayoutGrid, label: "Gallery" },
    { key: "timeline", icon: Calendar,   label: "Timeline" },
  ];
  return (
    <div
      className="inline-flex"
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border-strong)",
        borderRadius: 6,
        padding: 2,
        height: 28,
      }}
    >
      {MODES.map((m) => {
        const on = m.key === mode;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onChange(m.key)}
            className="inline-flex items-center gap-1 cursor-pointer"
            style={{
              fontFamily: "inherit",
              height: 22,
              padding: "0 9px",
              border: 0,
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 500,
              background: on ? "var(--dash-teal)" : "transparent",
              color: on ? "#fff" : "var(--dash-ink-3)",
            }}
            title={m.label}
          >
            <m.icon className="h-[12px] w-[12px]" />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
