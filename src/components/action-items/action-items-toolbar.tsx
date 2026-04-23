import { CheckSquare, Download, Plus, Search } from "lucide-react";

interface ActionItemsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onNewItem: () => void;
}

export function ActionItemsToolbar({ search, onSearchChange, onNewItem }: ActionItemsToolbarProps) {
  return (
    <div
      className="flex items-center gap-3"
      style={{
        padding: "14px 18px 12px",
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
          <CheckSquare className="h-[15px] w-[15px]" />
        </div>
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.08em] leading-tight m-0"
            style={{ color: "var(--dash-ink-4)" }}
          >
            Track and manage your tasks
          </p>
          <h1
            className="text-[17px] font-bold tracking-[-0.02em] leading-tight m-0"
            style={{ color: "var(--dash-ink-1)" }}
          >
            Action Items
          </h1>
        </div>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative" style={{ width: 280 }}>
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-[14px] w-[14px]"
          style={{ color: "var(--dash-ink-4)" }}
        />
        <input
          type="text"
          placeholder="Search action items…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-[30px] pl-8 pr-8 rounded-md text-[12px] outline-none"
          style={{
            fontFamily: "inherit",
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border-strong)",
            color: "var(--dash-ink-1)",
          }}
        />
        <kbd
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium px-1 py-[1px] rounded"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            background: "var(--dash-surface-2)",
            color: "var(--dash-ink-4)",
            border: "1px solid var(--dash-border-strong)",
          }}
        >
          /
        </kbd>
      </div>

      {/* Export (visual-only) */}
      <button
        className="inline-flex items-center gap-1.5 h-[30px] px-2.5 rounded-md text-[12px] font-medium cursor-pointer border"
        style={{
          fontFamily: "inherit",
          background: "var(--dash-surface)",
          color: "var(--dash-ink-2)",
          borderColor: "var(--dash-border-strong)",
        }}
      >
        <Download className="h-[13px] w-[13px]" />
        Export
      </button>

      {/* New Action Item */}
      <button
        className="inline-flex items-center gap-1.5 h-[30px] px-3 rounded-md text-[12px] font-medium cursor-pointer border"
        style={{
          fontFamily: "inherit",
          background: "var(--dash-ink-1)",
          color: "#fff",
          borderColor: "var(--dash-ink-1)",
        }}
        onClick={onNewItem}
      >
        <Plus className="h-[13px] w-[13px]" />
        New Action Item
      </button>
    </div>
  );
}
