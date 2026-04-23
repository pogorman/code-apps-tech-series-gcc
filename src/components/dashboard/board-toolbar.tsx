import {
  Columns3,
  Clock,
  Plus,
  LayoutGrid,
  List,
} from "lucide-react";

export function BoardToolbar({ onNewItem }: { onNewItem?: () => void }) {
  return (
    <div
      className="flex items-center gap-2.5"
      style={{
        padding: "8px 18px 10px",
        borderBottom: "1px solid var(--dash-border)",
        background: "var(--dash-bg)",
      }}
    >
      {/* Icon tile + title */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-[7px] grid place-items-center"
          style={{ background: "var(--dash-t-violet)", color: "var(--dash-violet)" }}
        >
          <Columns3 className="h-[15px] w-[15px]" />
        </div>
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.08em] leading-tight"
            style={{ color: "var(--dash-ink-4)" }}
          >
            Kanban view
          </p>
          <h1
            className="text-[17px] font-bold tracking-[-0.02em] leading-tight m-0"
            style={{ color: "var(--dash-ink-1)" }}
          >
            My Board
          </h1>
        </div>
      </div>

      {/* Separator */}
      <div className="w-px h-5 shrink-0" style={{ background: "var(--dash-border-strong)" }} />

      {/* Filter pills */}
      <div className="flex items-center gap-1.5 flex-wrap flex-1">
        <FilterPill active>
          <Clock className="h-3 w-3" />
          My items
        </FilterPill>
        <FilterPill>
          <span className="text-[10px] uppercase tracking-[0.06em] font-medium" style={{ color: "var(--dash-ink-4)" }}>Type</span>
          {" "}Work, Project, Idea
        </FilterPill>
        <FilterPill>
          <span className="text-[10px] uppercase tracking-[0.06em] font-medium" style={{ color: "var(--dash-ink-4)" }}>Priority</span>
          {" "}Top, High
        </FilterPill>
        <FilterPill>
          <span className="text-[10px] uppercase tracking-[0.06em] font-medium" style={{ color: "var(--dash-ink-4)" }}>Account</span>
          {" "}Any
        </FilterPill>
        <FilterPill dashed>
          <Plus className="h-3 w-3" />
          Add filter
        </FilterPill>
      </div>

      {/* Segmented control */}
      <div
        className="inline-flex h-7 rounded-md p-0.5"
        style={{
          background: "var(--dash-surface)",
          border: "1px solid var(--dash-border-strong)",
        }}
      >
        <SegBtn icon={<LayoutGrid className="h-[11px] w-[11px]" />} label="Columns" />
        <SegBtn icon={<List className="h-[11px] w-[11px]" />} label="List" />
        <SegBtn label="Board" active />
      </div>

      {/* New Item button */}
      <button
        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium cursor-pointer border"
        style={{
          fontFamily: "inherit",
          background: "var(--dash-ink-1)",
          color: "#fff",
          borderColor: "var(--dash-ink-1)",
        }}
        onClick={onNewItem}
      >
        <Plus className="h-[13px] w-[13px]" />
        New Item
      </button>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function FilterPill({
  children,
  active,
  dashed,
}: {
  children: React.ReactNode;
  active?: boolean;
  dashed?: boolean;
}) {
  return (
    <button
      className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-md text-[11px] font-medium cursor-pointer border"
      style={{
        fontFamily: "inherit",
        background: active ? "var(--dash-ink-1)" : "var(--dash-surface)",
        color: active ? "#fff" : "var(--dash-ink-2)",
        borderColor: active ? "var(--dash-ink-1)" : "var(--dash-border-strong)",
        borderStyle: dashed ? "dashed" : "solid",
      }}
    >
      {children}
    </button>
  );
}

function SegBtn({
  icon,
  label,
  active,
}: {
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className="h-[22px] px-2.5 rounded text-[11px] font-medium border-0 cursor-pointer inline-flex items-center gap-[5px]"
      style={{
        fontFamily: "inherit",
        background: active ? "var(--dash-ink-1)" : "transparent",
        color: active ? "#fff" : "var(--dash-ink-3)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
