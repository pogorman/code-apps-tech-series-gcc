import { Lightbulb } from "lucide-react";
import type { Tdvsp_ideasModel } from "@/generated";
import { CATEGORY_DOT, CATEGORY_ORDER, CATEGORY_SHORT_LABELS } from "./labels";

type Idea = Tdvsp_ideasModel.Tdvsp_ideas;
type Category = Tdvsp_ideasModel.Tdvsp_ideastdvsp_category;

interface IdeasHeaderProps {
  items: Idea[] | undefined;
  activeCategory: Category | null;
  onCategoryChange: (c: Category | null) => void;
  newThisWeekCount: number;
  highPotentialCount: number;
}

/** Hero row + CategoryStrip (pills w/ colored dot + count). */
export function IdeasHeader({
  items,
  activeCategory,
  onCategoryChange,
  newThisWeekCount,
  highPotentialCount,
}: IdeasHeaderProps) {
  const total = items?.length ?? 0;

  const categoryCounts = new Map<Category, number>();
  for (const it of items ?? []) {
    const cat = it.tdvsp_category;
    if (cat == null) continue;
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }

  return (
    <div
      className="flex flex-col gap-2.5"
      style={{
        padding: "14px 18px 12px",
        background: "var(--dash-bg)",
        borderBottom: "1px solid var(--dash-border)",
      }}
    >
      {/* Hero row */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 grid place-items-center"
          style={{
            borderRadius: 9,
            background: "linear-gradient(135deg, #fef9c3, #fde68a)",
            color: "#a16207",
            border: "1px solid #fde68a",
          }}
        >
          <Lightbulb className="h-[18px] w-[18px]" />
        </div>
        <div className="flex flex-col">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.08em] leading-tight"
            style={{ color: "var(--dash-ink-4)" }}
          >
            Capture · organize · promote
          </span>
          <h1
            className="text-[22px] font-bold tracking-[-0.02em] leading-tight m-0"
            style={{ color: "var(--dash-ink-1)" }}
          >
            Ideas
          </h1>
        </div>

        <div className="flex-1" />

        {/* Stats */}
        <div className="flex gap-5 pr-1">
          <Stat value={total} label="Captured" />
          <Stat value={newThisWeekCount} label="This week" />
          <Stat value={highPotentialCount} label="High potential" />
        </div>
      </div>

      {/* Category strip */}
      <div className="flex flex-wrap items-center gap-1.5">
        <CategoryPill
          active={activeCategory === null}
          label="All categories"
          count={total}
          onClick={() => onCategoryChange(null)}
        />
        {CATEGORY_ORDER.map((c) => {
          const count = categoryCounts.get(c) ?? 0;
          if (count === 0) return null;
          return (
            <CategoryPill
              key={c}
              active={activeCategory === c}
              label={CATEGORY_SHORT_LABELS[c]}
              count={count}
              dot={CATEGORY_DOT[c]}
              onClick={() => onCategoryChange(activeCategory === c ? null : c)}
            />
          );
        })}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-end">
      <span
        className="font-bold tabular-nums"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 19,
          letterSpacing: "-0.01em",
          color: "var(--dash-ink-1)",
        }}
      >
        {value}
      </span>
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.06em]"
        style={{ color: "var(--dash-ink-4)" }}
      >
        {label}
      </span>
    </div>
  );
}

function CategoryPill({
  active,
  label,
  count,
  dot,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  dot?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[11px] font-medium transition-colors cursor-pointer"
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        background: active ? "var(--dash-ink-1)" : "var(--dash-surface)",
        border: active ? "1px solid var(--dash-ink-1)" : "1px solid var(--dash-border-strong)",
        color: active ? "#fff" : "var(--dash-ink-2)",
      }}
    >
      {dot && (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            background: dot,
            boxShadow: active ? "0 0 0 2px rgba(255,255,255,.2)" : undefined,
          }}
        />
      )}
      <span>{label}</span>
      <span
        className="tabular-nums"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          fontWeight: 600,
          color: active ? "rgba(255,255,255,.6)" : "var(--dash-ink-3)",
        }}
      >
        {count}
      </span>
    </button>
  );
}
