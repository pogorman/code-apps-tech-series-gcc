import { useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import type { Tdvsp_actionitemsModel } from "@/generated";
import {
  PRIORITY_RAIL_COLORS,
  PRIORITY_PILL_STYLES,
  STATUS_PILL_STYLES,
  TASK_TYPE_ICON_CONFIG,
  STATUS_COMPLETE,
} from "@/components/dashboard/board-tokens";
import { PRIORITY_LABELS, STATUS_LABELS } from "./labels";

type ActionItem = Tdvsp_actionitemsModel.Tdvsp_actionitems;

/* ── Types ──────────────────────────────────────────────────── */

export interface GroupData {
  key: string;
  label: string;
  items: ActionItem[];
  openCount: number;
  overdueCount: number;
  statusDistribution: { status: number; count: number }[];
}

export type SortColumn = "name" | "priority" | "status" | "due" | "updated" | null;
export type SortDir = "asc" | "desc";

interface ActionItemsTableProps {
  groups: GroupData[];
  sortColumn: SortColumn;
  sortDir: SortDir;
  onSortChange: (col: SortColumn) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  allSelected: boolean;
  density: "compact" | "rich";
  onEdit: (item: ActionItem) => void;
  onDelete: (item: ActionItem) => void;
  onView: (item: ActionItem) => void;
  grouped: boolean;
}

/* ── Helpers ─────────────────────────────────────────────────── */

function isRecentlyActive(modifiedOn: string | null | undefined): boolean {
  if (!modifiedOn) return false;
  return Date.now() - new Date(modifiedOn).getTime() < 24 * 60 * 60 * 1000;
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

function getOverdueInfo(
  dateStr: string | null | undefined,
  status: number | null | undefined,
): { label: string; bg: string; color: string } | null {
  if (!dateStr || status === STATUS_COMPLETE) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { label: `${Math.abs(diffDays)}d overdue`, bg: "var(--dash-t-red)", color: "#b91c1c" };
  }
  if (diffDays <= 7) {
    return { label: `${diffDays}d`, bg: "var(--dash-t-amber)", color: "#b45309" };
  }
  return null;
}

const AVATAR_COLORS = [
  { bg: "var(--dash-t-blue)", color: "var(--dash-blue)" },
  { bg: "var(--dash-t-green)", color: "var(--dash-green)" },
  { bg: "var(--dash-t-amber)", color: "var(--dash-amber)" },
  { bg: "var(--dash-t-violet)", color: "var(--dash-violet)" },
  { bg: "var(--dash-t-pink)", color: "var(--dash-pink)" },
  { bg: "var(--dash-t-cyan)", color: "var(--dash-cyan)" },
];

function accountAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── Pill ────────────────────────────────────────────────────── */

function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.02em] px-1.5 py-[2px] rounded whitespace-nowrap"
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

/* ── Sort icon ───────────────────────────────────────────────── */

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) {
    return <ChevronsUpDown className="h-3 w-3 opacity-0 group-hover/th:opacity-50 transition-opacity" />;
  }
  return dir === "asc" ? (
    <ChevronUp className="h-3 w-3" style={{ color: "var(--dash-ink-1)" }} />
  ) : (
    <ChevronDown className="h-3 w-3" style={{ color: "var(--dash-ink-1)" }} />
  );
}

/* ── Table ────────────────────────────────────────────────────── */

export function ActionItemsTable({
  groups,
  sortColumn,
  sortDir,
  onSortChange,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  density,
  onEdit,
  onDelete,
  onView,
  grouped,
}: ActionItemsTableProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleGroup = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const COLUMNS: { key: SortColumn; label: string; width?: string; sortable: boolean }[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "priority", label: "Priority", width: "100px", sortable: true },
    { key: "status", label: "Status", width: "120px", sortable: true },
    { key: "due", label: "Due", width: "120px", sortable: true },
    { key: "updated", label: "Updated", width: "90px", sortable: true },
    { key: null, label: "", width: "64px", sortable: false },
  ];

  const totalItems = groups.reduce((s, g) => s + g.items.length, 0);

  if (totalItems === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 gap-3"
        style={{ color: "var(--dash-ink-4)" }}
      >
        <div
          className="w-10 h-10 rounded-[10px] grid place-items-center"
          style={{ background: "var(--dash-surface-2)" }}
        >
          <ChevronDown className="h-5 w-5" style={{ color: "var(--dash-ink-4)" }} />
        </div>
        <p className="text-[13px] font-medium" style={{ color: "var(--dash-ink-3)" }}>
          No action items match your filters
        </p>
        <p className="text-[11px]" style={{ color: "var(--dash-ink-4)" }}>
          Try adjusting your filters or create a new action item
        </p>
      </div>
    );
  }

  return (
    <div style={{ overflow: "auto" }}>
      <table
        className="w-full border-collapse"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
        }}
      >
        {/* Header */}
        <thead>
          <tr style={{ background: "var(--dash-bg)", borderBottom: "1px solid var(--dash-border)" }}>
            {/* Checkbox */}
            <th style={{ width: 36, padding: "8px 0 8px 12px", textAlign: "center" }}>
              <input
                type="checkbox"
                checked={allSelected && totalItems > 0}
                onChange={onToggleSelectAll}
                className="cursor-pointer"
                style={{
                  width: 15,
                  height: 15,
                  accentColor: "var(--dash-ink-1)",
                }}
              />
            </th>
            {COLUMNS.map((col) => (
              <th
                key={col.key ?? "actions"}
                className={col.sortable ? "group/th cursor-pointer select-none" : ""}
                style={{
                  width: col.width,
                  padding: "8px 10px",
                  textAlign: "left",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--dash-ink-4)",
                  whiteSpace: "nowrap",
                }}
                onClick={col.sortable ? () => onSortChange(col.key) : undefined}
              >
                {col.sortable ? (
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIcon
                      active={sortColumn === col.key}
                      dir={sortDir}
                    />
                  </span>
                ) : col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {groups.map((group) => {
            const isCollapsed = collapsed.has(group.key);
            return (
              <GroupSection
                key={group.key}
                group={group}
                collapsed={isCollapsed}
                onToggle={() => toggleGroup(group.key)}
                selectedIds={selectedIds}
                onToggleSelect={onToggleSelect}
                density={density}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
                showGroupHeader={grouped}
                colSpan={COLUMNS.length + 1}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Group Section ───────────────────────────────────────────── */

function GroupSection({
  group,
  collapsed,
  onToggle,
  selectedIds,
  onToggleSelect,
  density,
  onEdit,
  onDelete,
  onView,
  showGroupHeader,
  colSpan,
}: {
  group: GroupData;
  collapsed: boolean;
  onToggle: () => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  density: "compact" | "rich";
  onEdit: (item: ActionItem) => void;
  onDelete: (item: ActionItem) => void;
  onView: (item: ActionItem) => void;
  showGroupHeader: boolean;
  colSpan: number;
}) {
  const avatarColor = accountAvatarColor(group.label);
  const initials = group.label
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  // Mini status distribution bar
  const totalForBar = group.statusDistribution.reduce((s, d) => s + d.count, 0);

  return (
    <>
      {showGroupHeader && (
        <tr
          style={{
            background: "var(--dash-surface-2)",
            borderBottom: "1px solid var(--dash-border)",
          }}
        >
          <td colSpan={colSpan} style={{ padding: "6px 12px" }}>
            <div className="flex items-center gap-2.5">
              {/* Chevron */}
              <button
                type="button"
                onClick={onToggle}
                className="border-0 bg-transparent cursor-pointer p-0 flex items-center"
                style={{ color: "var(--dash-ink-3)" }}
              >
                <ChevronRight
                  className="h-[14px] w-[14px] transition-transform duration-150"
                  style={{ transform: collapsed ? "rotate(0deg)" : "rotate(90deg)" }}
                />
              </button>

              {/* Avatar */}
              <div
                className="w-5 h-5 rounded-[5px] grid place-items-center text-[9px] font-bold shrink-0"
                style={{ background: avatarColor.bg, color: avatarColor.color }}
              >
                {initials}
              </div>

              {/* Account name */}
              <span
                className="text-[13px] font-semibold"
                style={{ color: "var(--dash-ink-1)" }}
              >
                {group.label}
              </span>

              {/* Count pill */}
              <span
                className="text-[10px] font-medium px-1.5 py-[1px] rounded"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: "var(--dash-surface)",
                  border: "1px solid var(--dash-border-strong)",
                  color: "var(--dash-ink-3)",
                }}
              >
                {group.items.length}
              </span>

              {/* Mini status bar */}
              {totalForBar > 0 && (
                <div
                  className="h-1 rounded-full overflow-hidden flex shrink-0"
                  style={{ width: 100, background: "var(--dash-surface-3)" }}
                >
                  {group.statusDistribution.map((seg) => {
                    const pct = (seg.count / totalForBar) * 100;
                    const style = STATUS_PILL_STYLES[seg.status];
                    return (
                      <div
                        key={seg.status}
                        style={{
                          width: `${pct}%`,
                          background: style?.color ?? "var(--dash-ink-4)",
                        }}
                      />
                    );
                  })}
                </div>
              )}

              {/* Open / overdue text */}
              <span
                className="text-[11px]"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "var(--dash-ink-4)",
                }}
              >
                {group.openCount} open
                {group.overdueCount > 0 && (
                  <span style={{ color: "var(--dash-red)" }}> · {group.overdueCount} overdue</span>
                )}
              </span>
            </div>
          </td>
        </tr>
      )}

      {!collapsed &&
        group.items.map((item) => (
          <ItemRow
            key={item.tdvsp_actionitemid}
            item={item}
            selected={selectedIds.has(item.tdvsp_actionitemid)}
            onToggleSelect={() => onToggleSelect(item.tdvsp_actionitemid)}
            density={density}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item)}
            onView={() => onView(item)}
          />
        ))}
    </>
  );
}

/* ── Item Row ────────────────────────────────────────────────── */

function ItemRow({
  item,
  selected,
  onToggleSelect,
  density,
  onEdit,
  onDelete,
  onView,
}: {
  item: ActionItem;
  selected: boolean;
  onToggleSelect: () => void;
  density: "compact" | "rich";
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  const railColor =
    item.tdvsp_priority != null
      ? PRIORITY_RAIL_COLORS[item.tdvsp_priority] ?? "var(--dash-ink-4)"
      : "transparent";

  const typeConfig =
    item.tdvsp_tasktype != null ? TASK_TYPE_ICON_CONFIG[item.tdvsp_tasktype] : null;
  const TypeIcon = typeConfig?.icon;

  const priorityLabel =
    item.tdvsp_priority != null
      ? PRIORITY_LABELS[item.tdvsp_priority as keyof typeof PRIORITY_LABELS]
      : null;
  const priorityStyle =
    item.tdvsp_priority != null ? PRIORITY_PILL_STYLES[item.tdvsp_priority] : null;

  const statusLabel =
    item.tdvsp_taskstatus != null
      ? STATUS_LABELS[item.tdvsp_taskstatus as keyof typeof STATUS_LABELS]
      : null;
  const statusStyle =
    item.tdvsp_taskstatus != null ? STATUS_PILL_STYLES[item.tdvsp_taskstatus] : null;

  const overdue = getOverdueInfo(item.tdvsp_date, item.tdvsp_taskstatus);
  const active = isRecentlyActive((item as unknown as Record<string, unknown>).modifiedon as string | undefined);
  const relTime = relativeTime((item as unknown as Record<string, unknown>).modifiedon as string | undefined);
  const isCompact = density === "compact";
  const rowPy = isCompact ? "6px" : "10px";

  const description = (item as unknown as Record<string, unknown>).tdvsp_description as string | undefined;

  return (
    <tr
      className="group/row cursor-pointer"
      style={{
        borderBottom: "1px solid var(--dash-border)",
        background: selected ? "var(--dash-t-blue)" : "transparent",
        transition: "background .1s",
      }}
      onClick={onView}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.background = "var(--dash-surface-2)";
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Checkbox */}
      <td
        style={{ width: 36, padding: `${rowPy} 0 ${rowPy} 12px`, textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="cursor-pointer"
          style={{ width: 15, height: 15, accentColor: "var(--dash-ink-1)" }}
        />
      </td>

      {/* Name cell with priority rail */}
      <td style={{ padding: `${rowPy} 10px`, position: "relative" }}>
        {/* Priority rail */}
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{ width: 3, background: railColor }}
        />
        <div className="flex items-center gap-2">
          {/* Type icon tile */}
          {TypeIcon && typeConfig && (
            <div
              className="w-[18px] h-[18px] rounded shrink-0 grid place-items-center"
              style={{ background: typeConfig.bg, color: typeConfig.color }}
            >
              <TypeIcon className="h-[10px] w-[10px]" />
            </div>
          )}
          <div className="min-w-0">
            <div
              className="text-[13px] font-semibold truncate"
              style={{ color: "var(--dash-ink-1)", letterSpacing: "-0.005em" }}
            >
              {item.tdvsp_name}
            </div>
            {/* Description meta-line (Rich mode only) */}
            {!isCompact && description && (
              <div
                className="text-[11px] truncate mt-0.5"
                style={{ color: "var(--dash-ink-4)", maxWidth: 400 }}
              >
                {description}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Priority */}
      <td style={{ padding: `${rowPy} 10px`, width: 100 }}>
        {priorityLabel && priorityStyle ? (
          <Pill label={priorityLabel} bg={priorityStyle.bg} color={priorityStyle.color} />
        ) : (
          <span style={{ color: "var(--dash-ink-4)" }}>—</span>
        )}
      </td>

      {/* Status */}
      <td style={{ padding: `${rowPy} 10px`, width: 120 }}>
        {statusLabel && statusStyle ? (
          <Pill label={statusLabel} bg={statusStyle.bg} color={statusStyle.color} />
        ) : (
          <span style={{ color: "var(--dash-ink-4)" }}>—</span>
        )}
      </td>

      {/* Due */}
      <td style={{ padding: `${rowPy} 10px`, width: 120 }}>
        <div className="flex items-center gap-1.5">
          <span
            className="text-[11px]"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: "var(--dash-ink-2)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatDate(item.tdvsp_date)}
          </span>
          {overdue && (
            <span
              className="inline-flex items-center px-[5px] py-[1px] rounded-[3px] text-[10px] font-semibold"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: overdue.bg,
                color: overdue.color,
              }}
            >
              {overdue.label}
            </span>
          )}
        </div>
      </td>

      {/* Updated */}
      <td style={{ padding: `${rowPy} 10px`, width: 90 }}>
        <div className="flex items-center gap-1.5">
          <span
            className="text-[11px]"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: "var(--dash-ink-4)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {relTime}
          </span>
          {active && (
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                background: "var(--dash-blue)",
                boxShadow: "0 0 0 2px var(--dash-t-blue)",
              }}
            />
          )}
        </div>
      </td>

      {/* Actions */}
      <td
        style={{ padding: `${rowPy} 10px ${rowPy} 0`, width: 64 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
          <button
            type="button"
            className="border-0 bg-transparent cursor-pointer p-1 rounded hover:bg-[var(--dash-surface-2)]"
            style={{ color: "var(--dash-ink-3)" }}
            onClick={onEdit}
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="border-0 bg-transparent cursor-pointer p-1 rounded hover:bg-[var(--dash-t-red)]"
            style={{ color: "var(--dash-red)" }}
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
