import { useCallback, useEffect, useMemo, useState } from "react";
import { useActionItems, useDeleteActionItem, useUpdateActionItem } from "@/hooks/use-action-items";
import { ActionItemFormDialog } from "./action-item-form-dialog";
import { ActionItemDetailDialog } from "./action-item-detail-dialog";
import { ActionItemDeleteDialog } from "./action-item-delete-dialog";
import { ActionItemsToolbar } from "./action-items-toolbar";
import { ActionItemsTable, type GroupData, type SortColumn, type SortDir } from "./action-items-table";
import { BulkActionBar } from "./action-items-bulk-bar";
import { Rows3, Rows4, Plus, Filter } from "lucide-react";
import type { Tdvsp_actionitemsModel } from "@/generated";
import { toast } from "sonner";
import { useQuickCreateStore } from "@/stores/quick-create-store";
import { PRIORITY_LABELS, STATUS_LABELS, TASK_TYPE_LABELS } from "./labels";
import { STATUS_COMPLETE } from "@/components/dashboard/board-tokens";

type ActionItem = Tdvsp_actionitemsModel.Tdvsp_actionitems;

type SavedView = "all" | "overdue" | "high" | "due-week";
type Density = "compact" | "rich";

function getDensity(): Density {
  try {
    const v = localStorage.getItem("action-items-density");
    if (v === "compact" || v === "rich") return v;
  } catch { /* noop */ }
  return "rich";
}

export function ActionItemList() {
  /* ── Quick create store ──────────────────────────────────── */
  const quickTarget = useQuickCreateStore((s) => s.target);
  const quickPayload = useQuickCreateStore((s) => s.payload);
  const clearQuickCreate = useQuickCreateStore((s) => s.clear);

  /* ── Dialog state ────────────────────────────────────────── */
  const [createOpen, setCreateOpen] = useState(false);
  const [createTaskType, setCreateTaskType] = useState<number | undefined>(undefined);
  const [editItem, setEditItem] = useState<ActionItem | null>(null);
  const [viewItem, setViewItem] = useState<ActionItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<ActionItem | null>(null);

  useEffect(() => {
    if (quickTarget === "action-items") {
      const taskType = quickPayload?.taskType as number | undefined;
      setCreateTaskType(taskType);
      setCreateOpen(true);
      clearQuickCreate();
    }
  }, [quickTarget, quickPayload, clearQuickCreate]);

  /* ── Filter / sort / view state ──────────────────────────── */
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState<SavedView>("all");
  const [typeFilter, setTypeFilter] = useState<number | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [groupByAccount, setGroupByAccount] = useState(true);
  const [sortColumn, setSortColumn] = useState<SortColumn>("priority");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [density, setDensity] = useState<Density>(getDensity);

  /* ── Data hooks ──────────────────────────────────────────── */
  const filter = search
    ? `contains(tdvsp_name, '${search.replace(/'/g, "''")}')`
    : undefined;
  const { data: items, isLoading } = useActionItems({ filter });
  const deleteMutation = useDeleteActionItem();
  const updateMutation = useUpdateActionItem();

  /* ── Density persistence handled inline in toggle buttons ── */

  /* ── Sort handler ────────────────────────────────────────── */
  const handleSortChange = useCallback(
    (col: SortColumn) => {
      if (col === sortColumn) {
        if (sortDir === "asc") setSortDir("desc");
        else { setSortColumn(null); setSortDir("asc"); }
      } else {
        setSortColumn(col);
        setSortDir("asc");
      }
    },
    [sortColumn, sortDir],
  );

  /* ── Selection handlers ──────────────────────────────────── */
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* ── Computed: view counts (from unfiltered items) ─────── */
  const viewCounts = useMemo(() => {
    if (!items) return { all: 0, overdue: 0, high: 0, dueWeek: 0 };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(now);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    let overdue = 0;
    let high = 0;
    let dueWeek = 0;
    for (const it of items) {
      if (it.tdvsp_date && it.tdvsp_taskstatus !== STATUS_COMPLETE) {
        const due = new Date(it.tdvsp_date);
        due.setHours(0, 0, 0, 0);
        if (due < now) overdue++;
        if (due >= now && due <= weekFromNow) dueWeek++;
      }
      if (it.tdvsp_priority === 468510002 || it.tdvsp_priority === 468510003) high++;
    }
    return { all: items.length, overdue, high, dueWeek };
  }, [items]);

  /* ── Computed: filtered + sorted + grouped ─────────────── */
  const groups: GroupData[] = useMemo(() => {
    if (!items) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(now);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    // 1. Apply view preset
    let filtered = items;
    if (activeView === "overdue") {
      filtered = filtered.filter((it) => {
        if (!it.tdvsp_date || it.tdvsp_taskstatus === STATUS_COMPLETE) return false;
        const due = new Date(it.tdvsp_date);
        due.setHours(0, 0, 0, 0);
        return due < now;
      });
    } else if (activeView === "high") {
      filtered = filtered.filter(
        (it) => it.tdvsp_priority === 468510002 || it.tdvsp_priority === 468510003,
      );
    } else if (activeView === "due-week") {
      filtered = filtered.filter((it) => {
        if (!it.tdvsp_date || it.tdvsp_taskstatus === STATUS_COMPLETE) return false;
        const due = new Date(it.tdvsp_date);
        due.setHours(0, 0, 0, 0);
        return due >= now && due <= weekFromNow;
      });
    }

    // 2. Apply facet filters
    if (typeFilter !== null) filtered = filtered.filter((it) => it.tdvsp_tasktype === typeFilter);
    if (priorityFilter !== null)
      filtered = filtered.filter((it) => it.tdvsp_priority === priorityFilter);
    if (statusFilter !== null)
      filtered = filtered.filter((it) => it.tdvsp_taskstatus === statusFilter);

    // 3. Sort
    const sorted = [...filtered].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortColumn) {
        case "name":
          return dir * (a.tdvsp_name ?? "").localeCompare(b.tdvsp_name ?? "");
        case "priority":
          return dir * ((a.tdvsp_priority ?? 0) - (b.tdvsp_priority ?? 0));
        case "status":
          return dir * ((a.tdvsp_taskstatus ?? 0) - (b.tdvsp_taskstatus ?? 0));
        case "due": {
          const da = a.tdvsp_date ? new Date(a.tdvsp_date).getTime() : 0;
          const db = b.tdvsp_date ? new Date(b.tdvsp_date).getTime() : 0;
          return dir * (da - db);
        }
        case "updated": {
          const ma = (a as unknown as Record<string, unknown>).modifiedon as string | undefined;
          const mb = (b as unknown as Record<string, unknown>).modifiedon as string | undefined;
          const ta = ma ? new Date(ma).getTime() : 0;
          const tb = mb ? new Date(mb).getTime() : 0;
          return dir * (ta - tb);
        }
        default:
          return 0;
      }
    });

    // 4. Group by account
    if (groupByAccount) {
      const map = new Map<string, ActionItem[]>();
      for (const it of sorted) {
        const acct = (it as unknown as Record<string, unknown>).tdvsp_customername as string | undefined;
        const key = acct || "No Account";
        const list = map.get(key) ?? [];
        list.push(it);
        map.set(key, list);
      }
      // Sort groups: "No Account" last, rest alphabetical
      const keys = [...map.keys()].sort((a, b) => {
        if (a === "No Account") return 1;
        if (b === "No Account") return -1;
        return a.localeCompare(b);
      });
      return keys.map((key) => buildGroup(key, map.get(key)!, now));
    }

    // Ungrouped: single group
    return [buildGroup("All Items", sorted, now)];
  }, [items, activeView, typeFilter, priorityFilter, statusFilter, sortColumn, sortDir, groupByAccount]);

  function buildGroup(label: string, items: ActionItem[], now: Date): GroupData {
    let openCount = 0;
    let overdueCount = 0;
    const statusCounts = new Map<number, number>();
    for (const it of items) {
      if (it.tdvsp_taskstatus !== STATUS_COMPLETE) openCount++;
      if (it.tdvsp_date && it.tdvsp_taskstatus !== STATUS_COMPLETE) {
        const due = new Date(it.tdvsp_date);
        due.setHours(0, 0, 0, 0);
        if (due < now) overdueCount++;
      }
      if (it.tdvsp_taskstatus != null) {
        statusCounts.set(it.tdvsp_taskstatus, (statusCounts.get(it.tdvsp_taskstatus) ?? 0) + 1);
      }
    }
    return {
      key: label,
      label,
      items,
      openCount,
      overdueCount,
      statusDistribution: [...statusCounts.entries()]
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => a.status - b.status),
    };
  }

  const allVisibleIds = useMemo(
    () => groups.flatMap((g) => g.items.map((it) => it.tdvsp_actionitemid)),
    [groups],
  );
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allVisibleIds));
    }
  }, [allSelected, allVisibleIds]);

  /* ── Bulk actions ────────────────────────────────────────── */
  const handleBulkComplete = useCallback(() => {
    for (const id of selectedIds) {
      updateMutation.mutate({ id, fields: { tdvsp_taskstatus: STATUS_COMPLETE } as never });
    }
    toast.success(`Marked ${selectedIds.size} item(s) complete`);
    setSelectedIds(new Set());
  }, [selectedIds, updateMutation]);

  const handleBulkDelete = useCallback(() => {
    for (const id of selectedIds) {
      deleteMutation.mutate(id);
    }
    toast.success(`Deleted ${selectedIds.size} item(s)`);
    setSelectedIds(new Set());
  }, [selectedIds, deleteMutation]);

  /* ── Single delete ───────────────────────────────────────── */
  function handleDelete() {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.tdvsp_actionitemid, {
      onSuccess: () => {
        toast.success(`Deleted "${deleteItem.tdvsp_name}"`);
        setDeleteItem(null);
      },
      onError: (err) => {
        toast.error(`Delete failed: ${err.message}`);
      },
    });
  }

  /* ── Saved-view tabs config ──────────────────────────────── */
  const VIEW_TABS: { key: SavedView; label: string; count: number; accent?: string }[] = [
    { key: "all", label: "All", count: viewCounts.all },
    { key: "overdue", label: "Overdue", count: viewCounts.overdue, accent: "var(--dash-red)" },
    { key: "high", label: "High priority", count: viewCounts.high },
    { key: "due-week", label: "Due this week", count: viewCounts.dueWeek },
  ];

  /* ── Filter pill configs ─────────────────────────────────── */
  const TYPE_OPTIONS = Object.entries(TASK_TYPE_LABELS).map(([k, v]) => ({ value: Number(k), label: v }));
  const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(([k, v]) => ({ value: Number(k), label: v }));
  const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: Number(k), label: v }));

  /* ── Loading skeleton ────────────────────────────────────── */
  if (isLoading) {
    return (
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          background: "var(--dash-bg)",
          color: "var(--dash-ink-1)",
          minHeight: "100%",
        }}
      >
        <ActionItemsToolbar search="" onSearchChange={() => {}} onNewItem={() => {}} />
        <div className="flex flex-col gap-2 p-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-md animate-pulse"
              style={{ background: "var(--dash-surface-2)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: "var(--dash-bg)",
        color: "var(--dash-ink-1)",
        minHeight: "100%",
      }}
    >
      {/* Toolbar */}
      <ActionItemsToolbar
        search={search}
        onSearchChange={setSearch}
        onNewItem={() => setCreateOpen(true)}
      />

      {/* Saved-view tabs */}
      <div
        className="flex items-center gap-0.5 px-[18px]"
        style={{ borderBottom: "1px solid var(--dash-border)", background: "var(--dash-bg)" }}
      >
        {VIEW_TABS.map((tab) => {
          const isActive = activeView === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setActiveView(tab.key); setSelectedIds(new Set()); }}
              className="relative inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium cursor-pointer border-0 bg-transparent"
              style={{
                fontFamily: "inherit",
                color: isActive ? "var(--dash-ink-1)" : "var(--dash-ink-3)",
              }}
            >
              {tab.label}
              <span
                className="text-[10px] px-1.5 py-[1px] rounded-full font-medium"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: tab.accent && tab.count > 0 ? tab.accent : "var(--dash-surface-2)",
                  color: tab.accent && tab.count > 0 ? "#fff" : "var(--dash-ink-4)",
                }}
              >
                {tab.count}
              </span>
              {/* Active indicator */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t"
                  style={{ background: "var(--dash-ink-1)" }}
                />
              )}
            </button>
          );
        })}
        {/* Save view (visual-only) */}
        <button
          type="button"
          className="inline-flex items-center gap-1 px-2.5 py-2 text-[11px] font-medium cursor-pointer border-0 bg-transparent"
          style={{ fontFamily: "inherit", color: "var(--dash-ink-4)" }}
        >
          + Save view
        </button>
      </div>

      {/* Subtoolbar: filter pills + density + count */}
      <div
        className="flex items-center gap-2 px-[18px] py-2"
        style={{ borderBottom: "1px solid var(--dash-border)", background: "var(--dash-bg)" }}
      >
        {/* Group by Account toggle */}
        <FilterPill
          active={groupByAccount}
          onClick={() => setGroupByAccount((g) => !g)}
        >
          <Filter className="h-3 w-3" />
          Group by Account
        </FilterPill>

        {/* Type filter */}
        <DropdownPill
          label="Type"
          options={TYPE_OPTIONS}
          value={typeFilter}
          onChange={setTypeFilter}
        />

        {/* Priority filter */}
        <DropdownPill
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={priorityFilter}
          onChange={setPriorityFilter}
        />

        {/* Status filter */}
        <DropdownPill
          label="Status"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
        />

        {/* Add filter (visual-only) */}
        <FilterPill dashed>
          <Plus className="h-3 w-3" />
          Add filter
        </FilterPill>

        <div className="flex-1" />

        {/* Density toggle */}
        <div
          className="inline-flex h-7 rounded-md p-0.5"
          style={{
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border-strong)",
          }}
        >
          <button
            type="button"
            className="h-[22px] px-2 rounded text-[11px] font-medium border-0 cursor-pointer inline-flex items-center gap-[4px]"
            style={{
              fontFamily: "inherit",
              background: density === "compact" ? "var(--dash-ink-1)" : "transparent",
              color: density === "compact" ? "#fff" : "var(--dash-ink-3)",
            }}
            onClick={() => {
              setDensity("compact");
              try { localStorage.setItem("action-items-density", "compact"); } catch { /* noop */ }
            }}
          >
            <Rows4 className="h-[11px] w-[11px]" />
            Compact
          </button>
          <button
            type="button"
            className="h-[22px] px-2 rounded text-[11px] font-medium border-0 cursor-pointer inline-flex items-center gap-[4px]"
            style={{
              fontFamily: "inherit",
              background: density === "rich" ? "var(--dash-ink-1)" : "transparent",
              color: density === "rich" ? "#fff" : "var(--dash-ink-3)",
            }}
            onClick={() => {
              setDensity("rich");
              try { localStorage.setItem("action-items-density", "rich"); } catch { /* noop */ }
            }}
          >
            <Rows3 className="h-[11px] w-[11px]" />
            Rich
          </button>
        </div>

        {/* Count */}
        <span
          className="text-[11px] font-medium"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: "var(--dash-ink-4)",
          }}
        >
          {allVisibleIds.length} items
        </span>
      </div>

      {/* Table */}
      <ActionItemsTable
        groups={groups}
        sortColumn={sortColumn}
        sortDir={sortDir}
        onSortChange={handleSortChange}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        allSelected={allSelected}
        density={density}
        onEdit={setEditItem}
        onDelete={setDeleteItem}
        onView={setViewItem}
        grouped={groupByAccount}
      />

      {/* Bulk action bar */}
      <BulkActionBar
        count={selectedIds.size}
        onMarkComplete={handleBulkComplete}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedIds(new Set())}
      />

      {/* Dialogs */}
      <ActionItemFormDialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setCreateTaskType(undefined);
        }}
        mode="create"
        defaultTaskType={createTaskType}
      />

      <ActionItemFormDialog
        open={!!editItem}
        onOpenChange={(open) => {
          if (!open) setEditItem(null);
        }}
        mode="edit"
        actionItem={editItem ?? undefined}
      />

      <ActionItemDetailDialog
        open={!!viewItem}
        onOpenChange={(open) => {
          if (!open) setViewItem(null);
        }}
        actionItem={viewItem ?? undefined}
        onEdit={(item) => {
          setViewItem(null);
          setEditItem(item);
        }}
      />

      <ActionItemDeleteDialog
        open={!!deleteItem}
        onOpenChange={(open) => {
          if (!open) setDeleteItem(null);
        }}
        itemName={deleteItem?.tdvsp_name ?? ""}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function FilterPill({
  children,
  active,
  dashed,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  dashed?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-md text-[11px] font-medium cursor-pointer border"
      style={{
        fontFamily: "inherit",
        background: active ? "var(--dash-ink-1)" : "var(--dash-surface)",
        color: active ? "#fff" : "var(--dash-ink-2)",
        borderColor: active ? "var(--dash-ink-1)" : "var(--dash-border-strong)",
        borderStyle: dashed ? "dashed" : "solid",
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function DropdownPill({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: number; label: string }[];
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeLabel = value !== null ? options.find((o) => o.value === value)?.label : null;

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-md text-[11px] font-medium cursor-pointer border"
        style={{
          fontFamily: "inherit",
          background: value !== null ? "var(--dash-ink-1)" : "var(--dash-surface)",
          color: value !== null ? "#fff" : "var(--dash-ink-2)",
          borderColor: value !== null ? "var(--dash-ink-1)" : "var(--dash-border-strong)",
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className="text-[10px] uppercase tracking-[0.06em] font-medium"
          style={{ color: value !== null ? "rgba(255,255,255,.6)" : "var(--dash-ink-4)" }}
        >
          {label}
        </span>
        {activeLabel && <span>{activeLabel}</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full left-0 mt-1 z-50 rounded-lg py-1 min-w-[140px]"
            style={{
              background: "var(--dash-surface)",
              border: "1px solid var(--dash-border-strong)",
              boxShadow: "var(--dash-shadow-sm)",
            }}
          >
            {/* All option */}
            <button
              type="button"
              className="w-full text-left px-3 py-1.5 text-[12px] font-medium border-0 cursor-pointer"
              style={{
                fontFamily: "inherit",
                background: value === null ? "var(--dash-surface-2)" : "transparent",
                color: "var(--dash-ink-1)",
              }}
              onClick={() => { onChange(null); setOpen(false); }}
            >
              All
            </button>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="w-full text-left px-3 py-1.5 text-[12px] font-medium border-0 cursor-pointer"
                style={{
                  fontFamily: "inherit",
                  background: value === opt.value ? "var(--dash-surface-2)" : "transparent",
                  color: "var(--dash-ink-1)",
                }}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
