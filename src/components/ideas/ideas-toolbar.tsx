import { Download, Plus, Search } from "lucide-react";

interface IdeasToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  onNewIdea: () => void;
}

/** Capture-row: big search + export + primary new-idea button. */
export function IdeasToolbar({ search, onSearchChange, onNewIdea }: IdeasToolbarProps) {
  return (
    <div
      className="flex items-center gap-2.5"
      style={{
        padding: "0 18px 10px",
        background: "var(--dash-bg)",
      }}
    >
      {/* Capture box */}
      <div
        className="flex-1 flex items-center gap-2.5"
        style={{
          height: 36,
          padding: "0 12px",
          background: "var(--dash-surface)",
          border: "1px solid var(--dash-border-strong)",
          borderRadius: 8,
        }}
      >
        <Search className="h-[14px] w-[14px]" style={{ color: "var(--dash-ink-4)" }} />
        <input
          type="text"
          placeholder="Search ideas, or press ⌘⇧I to capture a new one…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 border-0 outline-none bg-transparent"
          style={{
            fontFamily: "inherit",
            fontSize: 13,
            color: "var(--dash-ink-1)",
          }}
        />
      </div>

      {/* Export (visual-only for v1) */}
      <button
        type="button"
        className="inline-flex items-center gap-1.5 cursor-pointer text-[12px] font-medium"
        style={{
          fontFamily: "inherit",
          height: 36,
          padding: "0 12px",
          borderRadius: 8,
          background: "var(--dash-surface)",
          border: "1px solid var(--dash-border-strong)",
          color: "var(--dash-ink-2)",
        }}
      >
        <Download className="h-[13px] w-[13px]" />
        Export
      </button>

      {/* New Idea — warm yellow, signature element */}
      <button
        type="button"
        onClick={onNewIdea}
        className="inline-flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold"
        style={{
          fontFamily: "inherit",
          height: 36,
          padding: "0 14px",
          borderRadius: 8,
          background: "linear-gradient(135deg, #fde047, #facc15)",
          color: "#713f12",
          border: "1px solid #eab308",
          boxShadow: "0 1px 2px rgba(234,179,8,.3)",
        }}
      >
        <Plus className="h-[13px] w-[13px]" />
        New Idea
      </button>
    </div>
  );
}
