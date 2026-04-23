import { useState } from "react";
import { motion } from "framer-motion";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Plus, ChevronLeft, MoreHorizontal } from "lucide-react";
import { WIP_LIMITS, type CardConfig } from "./board-tokens";
import type { LucideIcon } from "lucide-react";

/* ── Motion presets ──────────────────────────────────────────── */

const MOTION_RISE = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
} as const;

const MOTION_TRANSITION = {
  duration: 0.45,
  ease: [0.16, 1, 0.3, 1] as const,
};

/* ── Types ───────────────────────────────────────────────────── */

export interface BoardColumnProps {
  columnKey: string;
  title: string;
  icon: LucideIcon;
  accent: string;
  ids: string[];
  items?: CardConfig[];
  headerInline?: React.ReactNode;
  isDropTarget?: boolean;
  delay?: number;
  quickAddPlaceholder?: string;
  onQuickAdd?: (name: string) => void;
  onQuickAddClick?: () => void;
  children: React.ReactNode;
}

/* ── WIP bar colour logic ────────────────────────────────────── */

function wipBarColor(count: number, limit: number | null, accent: string): string {
  if (limit == null) return accent;
  const ratio = count / limit;
  if (ratio >= 1) return "var(--dash-red)";
  if (ratio >= 0.8) return "var(--dash-amber)";
  return accent;
}

/* ── Board Column ────────────────────────────────────────────── */

export function BoardColumn({
  columnKey,
  title,
  icon: Icon,
  accent,
  ids,
  headerInline,
  isDropTarget,
  delay,
  quickAddPlaceholder = "Add item…",
  onQuickAdd,
  onQuickAddClick,
  children,
}: BoardColumnProps) {
  const { setNodeRef } = useDroppable({ id: `col-${columnKey}` });
  const limit = WIP_LIMITS[columnKey] ?? null;
  const count = ids.length;
  const wipColor = wipBarColor(count, limit, accent);
  const isOver = limit != null && count > limit;

  const [quickAddValue, setQuickAddValue] = useState("");

  const handleQuickAddSubmit = () => {
    const trimmed = quickAddValue.trim();
    if (!trimmed) return;
    if (onQuickAdd) {
      onQuickAdd(trimmed);
      setQuickAddValue("");
    }
  };

  return (
    <motion.div
      initial={MOTION_RISE.initial}
      animate={MOTION_RISE.animate}
      transition={{
        ...MOTION_TRANSITION,
        delay: delay != null ? delay / 1000 : 0,
      }}
      className="flex flex-col min-w-0 min-h-0 relative"
      style={{
        background: "var(--dash-surface-2)",
        border: isDropTarget
          ? `2px solid ${accent}`
          : "1px solid var(--dash-border)",
        borderRadius: "var(--radius, 10px)",
        boxShadow: isDropTarget
          ? `0 0 24px ${accent}30, 0 0 48px ${accent}15`
          : undefined,
        transition: "border-color .2s, box-shadow .2s",
      }}
    >
      {/* Accent bar */}
      <div
        className="h-[3px] shrink-0"
        style={{
          background: accent,
          borderRadius: "var(--radius, 10px) var(--radius, 10px) 0 0",
        }}
      />

      {/* Header */}
      <div
        className="px-3 py-2.5 flex flex-col gap-2.5"
        style={{ borderBottom: "none" }}
      >
        <div className="flex items-center gap-2">
          {/* Icon badge */}
          <div
            className="w-[22px] h-[22px] rounded-[5px] grid place-items-center shrink-0"
            style={{ background: accent, color: "#fff" }}
          >
            <Icon className="h-3 w-3" />
          </div>

          {/* Title + count */}
          <h2
            className="flex-1 text-[11px] font-semibold uppercase tracking-[0.08em] flex items-center gap-2 m-0"
            style={{ color: "var(--dash-ink-2)" }}
          >
            {title}
            <span
              className="text-[11px] font-semibold px-[7px] py-[1px] rounded-[10px]"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: "var(--dash-surface)",
                border: "1px solid var(--dash-border-strong)",
                color: "var(--dash-ink-2)",
              }}
            >
              {count}
            </span>
          </h2>

          {/* WIP text */}
          {limit != null && (
            <span
              className="text-[10px] font-semibold"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: isOver ? "var(--dash-red)" : "var(--dash-ink-4)",
              }}
            >
              {count} / {limit}
            </span>
          )}
          {limit == null && (
            <span
              className="text-[10px]"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: "var(--dash-ink-4)",
              }}
            >
              —
            </span>
          )}

          {/* Collapse / More buttons (visual-only) */}
          <div className="flex gap-0.5">
            <button
              type="button"
              title="Collapse"
              className="w-[22px] h-[22px] rounded grid place-items-center border-0 bg-transparent cursor-pointer"
              style={{ color: "var(--dash-ink-4)" }}
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <button
              type="button"
              title="More"
              className="w-[22px] h-[22px] rounded grid place-items-center border-0 bg-transparent cursor-pointer"
              style={{ color: "var(--dash-ink-4)" }}
            >
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* WIP progress bar */}
        {limit != null && (
          <div
            className="h-[3px] rounded-sm overflow-hidden -mt-1"
            style={{ background: "var(--dash-surface-3)" }}
          >
            <div
              className="h-full rounded-sm"
              style={{
                width: `${Math.min((count / limit) * 100, 100)}%`,
                background: wipColor,
                transition: "width .3s",
              }}
            />
          </div>
        )}

        {/* Filter row (optional headerInline) */}
        {headerInline}
      </div>

      {/* Quick add */}
      <div
        className="mx-3 mb-2 flex items-center gap-1.5 px-2.5 py-[7px] rounded-lg cursor-text"
        style={{
          background: "var(--dash-surface)",
          border: "1px dashed var(--dash-border-strong)",
          color: "var(--dash-ink-4)",
          fontSize: "12px",
        }}
        onClick={() => {
          if (onQuickAddClick) {
            onQuickAddClick();
          }
        }}
      >
        <Plus className="h-[13px] w-[13px] shrink-0" />
        {onQuickAdd ? (
          <input
            type="text"
            className="flex-1 bg-transparent border-0 outline-none text-xs p-0 m-0"
            style={{
              fontFamily: "inherit",
              color: "var(--dash-ink-2)",
            }}
            placeholder={quickAddPlaceholder}
            value={quickAddValue}
            onChange={(e) => setQuickAddValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleQuickAddSubmit();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span>{quickAddPlaceholder}</span>
        )}
        <span
          className="ml-auto text-[10px] px-[5px] py-[1px] rounded-[3px]"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            background: "var(--dash-surface-2)",
            border: "1px solid var(--dash-border)",
            color: "var(--dash-ink-4)",
          }}
        >
          N
        </span>
      </div>

      {/* Card body */}
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className="flex-1 overflow-y-auto px-3 pb-3 min-h-0 flex flex-col gap-2"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "var(--dash-border-strong) transparent",
          }}
        >
          {children}
          {ids.length === 0 && (
            <div className="flex flex-col items-center py-10" style={{ color: "var(--dash-ink-4)", opacity: 0.4 }}>
              <Icon className="h-10 w-10 mb-3" style={{ color: accent, opacity: 0.4 }} />
              <p
                className="text-[10px] uppercase tracking-[0.2em] m-0"
                style={{ color: "var(--dash-ink-4)", opacity: 0.6 }}
              >
                No items
              </p>
            </div>
          )}
        </div>
      </SortableContext>
    </motion.div>
  );
}
