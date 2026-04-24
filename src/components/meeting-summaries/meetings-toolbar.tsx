import { Download, Search } from "lucide-react";

interface MeetingsToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
}

/** Search + export row (primary "New Summary" button lives in the hero). */
export function MeetingsToolbar({ search, onSearchChange }: MeetingsToolbarProps) {
  return (
    <div
      className="flex items-center gap-2.5"
      style={{
        padding: "0 18px 10px",
        background: "var(--dash-bg)",
      }}
    >
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
          placeholder="Search meetings, titles, or summary text…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 border-0 outline-none bg-transparent"
          style={{ fontFamily: "inherit", fontSize: 13, color: "var(--dash-ink-1)" }}
        />
        <kbd
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            padding: "1px 5px",
            background: "var(--dash-surface-2)",
            border: "1px solid var(--dash-border-strong)",
            borderRadius: 3,
            color: "var(--dash-ink-4)",
          }}
        >
          /
        </kbd>
      </div>

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
    </div>
  );
}
