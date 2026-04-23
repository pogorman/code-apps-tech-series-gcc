import { GripVertical, Pencil, Car, X } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import {
  PRIORITY_RAIL_COLORS,
  PRIORITY_PILL_STYLES,
  STATUS_PILL_STYLES,
  TASK_TYPE_ICON_CONFIG,
  ENTITY_ICON_CONFIG,
  type CardConfig,
  type ParkingLotEntry,
} from "./board-tokens";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/components/action-items/labels";
import { CATEGORY_LABELS } from "@/components/ideas/labels";

/* ── Drag handle types ───────────────────────────────────────── */

type DragHandleProps = {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
};

/* ── Helpers ─────────────────────────────────────────────────── */

function isRecentlyActive(modifiedOn: string | null | undefined): boolean {
  if (!modifiedOn) return false;
  const diff = Date.now() - new Date(modifiedOn).getTime();
  return diff < 24 * 60 * 60 * 1000;
}

function formatCardDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getOverdueInfo(dateStr: string | null | undefined): { label: string; style: { bg: string; color: string } } | null {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `${Math.abs(diffDays)}d overdue`,
      style: { bg: "var(--dash-t-red)", color: "#b91c1c" },
    };
  }
  if (diffDays <= 7) {
    return {
      label: `${diffDays}d`,
      style: { bg: "var(--dash-t-amber)", color: "#b45309" },
    };
  }
  return null;
}

/* ── Card pill (inline-styled) ───────────────────────────────── */

function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.02em] px-1.5 py-[2px] rounded"
      style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        background: bg,
        color,
      }}
    >
      <span className="w-[5px] h-[5px] rounded-full" style={{ background: "currentColor" }} />
      {label}
    </span>
  );
}

/* ── Board Card ──────────────────────────────────────────────── */

export function BoardCard({
  config,
  dragHandle,
}: {
  config: CardConfig;
  dragHandle: DragHandleProps;
}) {
  const {
    kind,
    title,
    description,
    priority,
    status,
    category,
    taskType,
    date,
    customerName,
    modifiedOn,
    onEdit,
    isPinned,
    onPinToggle,
  } = config;

  const railColor = priority != null ? PRIORITY_RAIL_COLORS[priority] ?? "var(--dash-ink-4)" : "var(--dash-ink-4)";
  const active = isRecentlyActive(modifiedOn);
  const overdue = kind === "action-item" ? getOverdueInfo(date) : null;
  const formattedDate = formatCardDate(date);

  // Determine type icon
  const fallbackIcon = ENTITY_ICON_CONFIG["action-item"]!;
  let typeIcon: { icon: React.ComponentType<{ className?: string }>; bg: string; color: string };
  if (kind === "action-item" && taskType != null && TASK_TYPE_ICON_CONFIG[taskType]) {
    typeIcon = TASK_TYPE_ICON_CONFIG[taskType]!;
  } else {
    typeIcon = ENTITY_ICON_CONFIG[kind] ?? fallbackIcon;
  }
  const TypeIcon = typeIcon.icon;

  // Priority pill
  const priorityLabel = priority != null ? PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS] : null;
  const priorityStyle = priority != null ? PRIORITY_PILL_STYLES[priority] : null;

  // Status pill (action items only)
  const statusLabel = kind === "action-item" && status != null ? STATUS_LABELS[status as keyof typeof STATUS_LABELS] : null;
  const statusStyle = status != null ? STATUS_PILL_STYLES[status] : null;

  // Category pill (ideas only)
  const categoryLabel = kind === "idea" && category != null ? CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] : null;

  // Ideas use pink rail if no priority
  const ideaRail = kind === "idea" && priority == null ? "var(--dash-pink)" : railColor;
  const effectiveRail = kind === "idea" ? ideaRail : railColor;

  return (
    <div
      className="relative flex flex-col gap-1.5 rounded-lg cursor-pointer group/card"
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        padding: "10px 10px 10px 12px",
        boxShadow: "var(--dash-shadow-xs)",
        transition: "box-shadow .12s, transform .12s, border-color .12s",
      }}
      onClick={() => onEdit()}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.boxShadow = "var(--dash-shadow-sm)";
        el.style.borderColor = "var(--dash-border-strong)";
        el.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.boxShadow = "var(--dash-shadow-xs)";
        el.style.borderColor = "var(--dash-border)";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Priority rail */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg"
        style={{ background: effectiveRail }}
      />

      {/* Hover toolbar */}
      <div
        className="absolute -top-2.5 -right-2.5 z-10 flex items-center gap-1.5 rounded-lg px-2 py-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200"
        style={{
          background: "var(--dash-surface)",
          border: "1px solid var(--dash-border)",
          boxShadow: "var(--dash-shadow-sm)",
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          className="cursor-grab active:cursor-grabbing"
          style={{ color: "var(--dash-ink-4)" }}
          {...dragHandle.attributes}
          {...dragHandle.listeners}
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="h-4 w-px shrink-0" style={{ background: "var(--dash-border)" }} />
        <button
          type="button"
          title="Edit"
          className="shrink-0 border-0 bg-transparent cursor-pointer p-0"
          style={{ color: "var(--dash-ink-4)" }}
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title={isPinned ? "Unpin" : "Pin to parking lot"}
          className="shrink-0 border-0 bg-transparent cursor-pointer p-0"
          style={{ color: isPinned ? "var(--dash-green)" : "var(--dash-ink-4)" }}
          onClick={(e) => { e.stopPropagation(); onPinToggle(); }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Car className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Top row: type icon + title + activity dot */}
      <div className="flex items-start gap-2">
        <div
          className="w-4 h-4 rounded shrink-0 mt-[1px] grid place-items-center"
          style={{ background: typeIcon.bg, color: typeIcon.color }}
        >
          <TypeIcon className="h-[10px] w-[10px]" />
        </div>
        <div
          className="flex-1 text-[13px] font-semibold leading-[1.3] line-clamp-2"
          style={{ color: "var(--dash-ink-1)", letterSpacing: "-0.005em" }}
        >
          {title}
        </div>
        {active && (
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
            style={{
              background: "var(--dash-blue)",
              boxShadow: "0 0 0 2px var(--dash-t-blue)",
            }}
          />
        )}
      </div>

      {/* Description */}
      {description && (
        <div
          className="text-xs leading-[1.4] line-clamp-2"
          style={{ color: "var(--dash-ink-3)" }}
        >
          {description}
        </div>
      )}

      {/* Pills row */}
      {(priorityLabel || statusLabel || categoryLabel) && (
        <div className="flex flex-wrap gap-1 items-center">
          {priorityLabel && priorityStyle && (
            <Pill label={priorityLabel} bg={priorityStyle.bg} color={priorityStyle.color} />
          )}
          {statusLabel && statusStyle && (
            <Pill label={statusLabel} bg={statusStyle.bg} color={statusStyle.color} />
          )}
          {categoryLabel && (
            <Pill label={categoryLabel} bg="var(--dash-surface-2)" color="var(--dash-ink-3)" />
          )}
        </div>
      )}

      {/* Meta row */}
      {(formattedDate || overdue || customerName) && (
        <div
          className="flex items-center gap-2 mt-0.5 text-[11px]"
          style={{ color: "var(--dash-ink-4)" }}
        >
          {formattedDate && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: "tabular-nums" }}>
              {formattedDate}
            </span>
          )}
          {overdue && (
            <span
              className="inline-flex items-center gap-[3px] px-[5px] py-[1px] rounded-[3px] font-semibold text-[10px]"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: overdue.style.bg,
                color: overdue.style.color,
              }}
            >
              {overdue.label}
            </span>
          )}
          {customerName && (
            <span className="truncate">{customerName}</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Parking Lot Card ────────────────────────────────────────── */

export function ParkingLotCard({
  entry,
  dragHandle,
}: {
  entry: ParkingLotEntry;
  dragHandle: DragHandleProps;
}) {
  const fallback = ENTITY_ICON_CONFIG["action-item"]!;
  const entryIcon = ENTITY_ICON_CONFIG[entry.kind] ?? fallback;
  let typeIcon = entryIcon;

  // If it's an action item with a task type, use the task type icon
  if (entry.kind === "action-item" && entry.taskType != null && TASK_TYPE_ICON_CONFIG[entry.taskType]) {
    typeIcon = TASK_TYPE_ICON_CONFIG[entry.taskType]!;
  }
  const TypeIcon = typeIcon.icon;

  const railColor = entry.priority != null ? PRIORITY_RAIL_COLORS[entry.priority] ?? "var(--dash-ink-4)" : "var(--dash-ink-4)";
  const active = isRecentlyActive(entry.modifiedOn);

  const priorityLabel = entry.priority != null ? PRIORITY_LABELS[entry.priority as keyof typeof PRIORITY_LABELS] : null;
  const priorityStyle = entry.priority != null ? PRIORITY_PILL_STYLES[entry.priority] : null;

  return (
    <div
      className="relative flex flex-col gap-1.5 rounded-lg cursor-pointer group/card"
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        padding: "10px 10px 10px 12px",
        boxShadow: "var(--dash-shadow-xs)",
        transition: "box-shadow .12s, transform .12s, border-color .12s",
      }}
      onClick={() => entry.onEdit()}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.boxShadow = "var(--dash-shadow-sm)";
        el.style.borderColor = "var(--dash-border-strong)";
        el.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.boxShadow = "var(--dash-shadow-xs)";
        el.style.borderColor = "var(--dash-border)";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Priority rail */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg"
        style={{ background: railColor }}
      />

      {/* Hover toolbar: grip + unpin */}
      <div
        className="absolute -top-2.5 -right-2.5 z-10 flex items-center gap-1.5 rounded-lg px-2 py-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200"
        style={{
          background: "var(--dash-surface)",
          border: "1px solid var(--dash-border)",
          boxShadow: "var(--dash-shadow-sm)",
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          className="cursor-grab active:cursor-grabbing"
          style={{ color: "var(--dash-ink-4)" }}
          {...dragHandle.attributes}
          {...dragHandle.listeners}
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="h-4 w-px shrink-0" style={{ background: "var(--dash-border)" }} />
        <button
          type="button"
          title="Remove from parking lot"
          className="shrink-0 border-0 bg-transparent cursor-pointer p-0"
          style={{ color: "var(--dash-ink-4)" }}
          onClick={(e) => { e.stopPropagation(); entry.onUnpin(); }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Top row */}
      <div className="flex items-start gap-2">
        <div
          className="w-4 h-4 rounded shrink-0 mt-[1px] grid place-items-center"
          style={{ background: typeIcon.bg, color: typeIcon.color }}
        >
          <TypeIcon className="h-[10px] w-[10px]" />
        </div>
        <div
          className="flex-1 text-[13px] font-semibold leading-[1.3] line-clamp-2"
          style={{ color: "var(--dash-ink-1)", letterSpacing: "-0.005em" }}
        >
          {entry.name}
        </div>
        {active && (
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
            style={{
              background: "var(--dash-blue)",
              boxShadow: "0 0 0 2px var(--dash-t-blue)",
            }}
          />
        )}
      </div>

      {/* Description */}
      {entry.description && (
        <div
          className="text-xs leading-[1.4] line-clamp-2"
          style={{ color: "var(--dash-ink-3)" }}
        >
          {entry.description}
        </div>
      )}

      {/* Priority pill */}
      {priorityLabel && priorityStyle && (
        <div className="flex flex-wrap gap-1 items-center">
          <Pill label={priorityLabel} bg={priorityStyle.bg} color={priorityStyle.color} />
        </div>
      )}
    </div>
  );
}
