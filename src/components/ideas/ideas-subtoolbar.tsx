import { Filter, LayoutGrid, Rows3, Columns3, X } from "lucide-react";
import type { Tdvsp_ideasModel } from "@/generated";
import { CATEGORY_SHORT_LABELS, IDEA_PRIORITY_SHORT } from "./labels";

type Category = Tdvsp_ideasModel.Tdvsp_ideastdvsp_category;
export type IdeaViewMode = "table" | "gallery" | "kanban";

interface IdeasSubtoolbarProps {
  viewMode: IdeaViewMode;
  onViewModeChange: (m: IdeaViewMode) => void;
  categoryFilter: Category | null;
  onCategoryClear: () => void;
  priorityFilter: number | null;
  onPriorityClear: () => void;
  accountFilter: string | null;
  accountName?: string;
  onAccountClear: () => void;
  resultCount: number;
  totalCount: number;
}

export function IdeasSubtoolbar({
  viewMode,
  onViewModeChange,
  categoryFilter,
  onCategoryClear,
  priorityFilter,
  onPriorityClear,
  accountFilter,
  accountName,
  onAccountClear,
  resultCount,
  totalCount,
}: IdeasSubtoolbarProps) {
  const hasFilters = categoryFilter !== null || priorityFilter !== null || accountFilter !== null;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      style={{
        padding: "8px 18px",
        background: "var(--dash-surface)",
        borderBottom: "1px solid var(--dash-border)",
      }}
    >
      {/* Filter label */}
      <span
        className="inline-flex items-center gap-1.5 text-[11px] font-medium"
        style={{ color: "var(--dash-ink-4)" }}
      >
        <Filter className="h-[12px] w-[12px]" />
        Filters
      </span>

      {/* Active filter pills */}
      {categoryFilter !== null && (
        <ActiveFilterPill label={`Category: ${CATEGORY_SHORT_LABELS[categoryFilter]}`} onClear={onCategoryClear} />
      )}
      {priorityFilter !== null && (
        <ActiveFilterPill label={`Priority: ${IDEA_PRIORITY_SHORT[priorityFilter]}`} onClear={onPriorityClear} />
      )}
      {accountFilter !== null && (
        <ActiveFilterPill label={`Account: ${accountName ?? "—"}`} onClear={onAccountClear} />
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
          pick a category pill or priority to filter
        </span>
      )}

      <div className="flex-1" />

      {/* View mode segment */}
      <ViewModeSegment mode={viewMode} onChange={onViewModeChange} />

      {/* Count */}
      <span
        className="text-[11px] tabular-nums"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          color: "var(--dash-ink-4)",
        }}
      >
        {resultCount === totalCount ? `${totalCount} ideas` : `${resultCount} of ${totalCount}`}
      </span>
    </div>
  );
}

function ActiveFilterPill({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-medium"
      style={{
        height: 26,
        padding: "0 4px 0 9px",
        borderRadius: 6,
        background: "var(--dash-ink-1)",
        color: "#fff",
        border: "1px solid var(--dash-ink-1)",
      }}
    >
      {label}
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center justify-center cursor-pointer"
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          background: "rgba(255,255,255,.14)",
          color: "#fff",
          border: 0,
        }}
      >
        <X className="h-[10px] w-[10px]" />
      </button>
    </span>
  );
}

function ViewModeSegment({
  mode,
  onChange,
}: {
  mode: IdeaViewMode;
  onChange: (m: IdeaViewMode) => void;
}) {
  const MODES: { key: IdeaViewMode; icon: typeof Rows3; label: string }[] = [
    { key: "table", icon: Rows3, label: "Table" },
    { key: "gallery", icon: LayoutGrid, label: "Gallery" },
    { key: "kanban", icon: Columns3, label: "Kanban" },
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
              background: on ? "var(--dash-ink-1)" : "transparent",
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
