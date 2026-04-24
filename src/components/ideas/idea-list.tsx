import { useEffect, useMemo, useState } from "react";
import type { Tdvsp_ideasModel } from "@/generated";
import { useAllIdeas, useDeleteIdea, useUpdateIdea } from "@/hooks/use-ideas";
import { useAccounts } from "@/hooks/use-accounts";
import { useQuickCreateStore } from "@/stores/quick-create-store";
import { toast } from "sonner";

import { IdeaFormDialog } from "./idea-form-dialog";
import { IdeaDetailDialog } from "./idea-detail-dialog";
import { IdeaDeleteDialog } from "./idea-delete-dialog";
import { IdeasHeader } from "./ideas-header";
import { IdeasToolbar } from "./ideas-toolbar";
import { IdeasViewTabs, type IdeaSavedView } from "./ideas-view-tabs";
import { IdeasSubtoolbar, type IdeaViewMode } from "./ideas-subtoolbar";
import { IdeasTable, type IdeaGroup } from "./ideas-table";
import { IdeasGallery } from "./ideas-gallery";
import { IdeasKanban } from "./ideas-kanban";
import { IdeasQuickAdd } from "./ideas-quick-add";
import { IdeasBulkBar } from "./ideas-bulk-bar";
import { CaptureComposer } from "./capture-composer";
import { PromoteDialog } from "./promote-dialog";
import { CATEGORY_ORDER, HIGH_POTENTIAL_PRIORITIES, STATE_ACTIVE, STATE_ARCHIVED } from "./labels";

type Idea = Tdvsp_ideasModel.Tdvsp_ideas;
type Category = Tdvsp_ideasModel.Tdvsp_ideastdvsp_category;

const VIEW_MODE_KEY = "ideas.view-mode";

function getViewMode(): IdeaViewMode {
  try {
    const v = localStorage.getItem(VIEW_MODE_KEY);
    if (v === "table" || v === "gallery" || v === "kanban") return v;
  } catch { /* noop */ }
  return "table";
}

export function IdeaList() {
  /* ── External open-from-quick-create signal ─────────────────── */
  const quickTarget = useQuickCreateStore((s) => s.target);
  const clearQuickCreate = useQuickCreateStore((s) => s.clear);

  /* ── Dialog state ───────────────────────────────────────────── */
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Idea | null>(null);
  const [viewItem, setViewItem] = useState<Idea | null>(null);
  const [deleteItem, setDeleteItem] = useState<Idea | null>(null);
  const [promoteItems, setPromoteItems] = useState<Idea[] | null>(null);

  useEffect(() => {
    if (quickTarget === "ideas") {
      setCreateOpen(true);
      clearQuickCreate();
    }
  }, [quickTarget, clearQuickCreate]);

  /* ── Filter / view state ────────────────────────────────────── */
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState<IdeaSavedView>("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<number | null>(null);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<IdeaViewMode>(getViewMode);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try { localStorage.setItem(VIEW_MODE_KEY, viewMode); } catch { /* noop */ }
  }, [viewMode]);

  /* ── Data ───────────────────────────────────────────────────── */
  const { data: allItems, error } = useAllIdeas();
  const { data: accounts } = useAccounts();
  const updateMutation = useUpdateIdea();
  const deleteMutation = useDeleteIdea();

  const accountNameMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts?.forEach((a) => map.set(a.accountid, a.name));
    return map;
  }, [accounts]);

  /* ── Computed: view counts from all items ───────────────────── */
  const viewCounts = useMemo(() => {
    if (!allItems) return { all: 0, mine: 0, "new-week": 0, "high-potential": 0, archived: 0 } as Record<IdeaSavedView, number>;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let all = 0, mine = 0, newWeek = 0, highPot = 0, archived = 0;
    for (const it of allItems) {
      const state = (it as unknown as Record<string, number>).statecode ?? 0;
      if (state === STATE_ARCHIVED) { archived++; continue; }
      all++;
      // "mine" heuristic: owned by the current user's record (owner vs createdby both work as a visual proxy)
      // Without a userId in scope, lean on owneridname being populated — all records have one, so this will
      // show the full list; refine once we plumb the current user id through. Good-enough for the demo tab.
      mine++;
      const createdOn = (it as unknown as Record<string, string>).createdon;
      if (createdOn && new Date(createdOn).getTime() >= weekAgo) newWeek++;
      const p = (it as unknown as Record<string, number>).tdvsp_priority;
      if (p != null && HIGH_POTENTIAL_PRIORITIES.has(p)) highPot++;
    }
    return { all, mine, "new-week": newWeek, "high-potential": highPot, archived } as Record<IdeaSavedView, number>;
  }, [allItems]);

  /* ── Computed: filtered + grouped ───────────────────────────── */
  const filtered = useMemo(() => {
    if (!allItems) return [] as Idea[];
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const searchLower = search.trim().toLowerCase();

    return allItems.filter((it) => {
      const state = (it as unknown as Record<string, number>).statecode ?? 0;
      const isArchived = state === STATE_ARCHIVED;

      // 1. Saved view
      switch (activeView) {
        case "archived":
          if (!isArchived) return false;
          break;
        case "new-week": {
          if (isArchived) return false;
          const c = (it as unknown as Record<string, string>).createdon;
          if (!c || new Date(c).getTime() < weekAgo) return false;
          break;
        }
        case "high-potential": {
          if (isArchived) return false;
          const p = (it as unknown as Record<string, number>).tdvsp_priority;
          if (p == null || !HIGH_POTENTIAL_PRIORITIES.has(p)) return false;
          break;
        }
        case "mine":
        case "all":
        default:
          if (isArchived) return false;
          break;
      }

      // 2. Category filter
      if (categoryFilter !== null && it.tdvsp_category !== categoryFilter) return false;

      // 3. Priority filter
      if (priorityFilter !== null) {
        const p = (it as unknown as Record<string, number>).tdvsp_priority;
        if (p !== priorityFilter) return false;
      }

      // 4. Account filter
      if (accountFilter !== null) {
        const a = (it as unknown as Record<string, string>)._tdvsp_account_value;
        if (a !== accountFilter) return false;
      }

      // 5. Search
      if (searchLower) {
        const name = (it.tdvsp_name ?? "").toLowerCase();
        const desc = (it.tdvsp_description ?? "").toLowerCase();
        if (!name.includes(searchLower) && !desc.includes(searchLower)) return false;
      }

      return true;
    });
  }, [allItems, activeView, categoryFilter, priorityFilter, accountFilter, search]);

  const groups: IdeaGroup[] = useMemo(() => {
    const buckets = new Map<Category | null, Idea[]>();
    for (const it of filtered) {
      const key: Category | null = it.tdvsp_category ?? null;
      const list = buckets.get(key) ?? [];
      list.push(it);
      buckets.set(key, list);
    }
    // Sort each bucket by createdon desc
    for (const list of buckets.values()) {
      list.sort((a, b) => {
        const ca = (a as unknown as Record<string, string>).createdon ?? "";
        const cb = (b as unknown as Record<string, string>).createdon ?? "";
        return cb.localeCompare(ca);
      });
    }
    // Order: CATEGORY_ORDER first, then null (uncategorized) at the end
    const out: IdeaGroup[] = [];
    for (const c of CATEGORY_ORDER) {
      const list = buckets.get(c);
      if (list && list.length) out.push({ category: c, items: list });
    }
    const uncategorized = buckets.get(null);
    if (uncategorized && uncategorized.length) out.push({ category: null, items: uncategorized });
    return out;
  }, [filtered]);

  /* ── Selection handlers ─────────────────────────────────────── */
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (prev.size === filtered.length && filtered.length > 0) return new Set();
      return new Set(filtered.map((it) => it.tdvsp_ideaid));
    });
  }

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;
  const selectedItems = useMemo(
    () => filtered.filter((it) => selectedIds.has(it.tdvsp_ideaid)),
    [filtered, selectedIds],
  );

  /* ── Actions ────────────────────────────────────────────────── */
  function handleDelete() {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.tdvsp_ideaid, {
      onSuccess: () => {
        toast.success(`Deleted "${deleteItem.tdvsp_name}"`);
        setDeleteItem(null);
      },
      onError: (err) => toast.error(`Delete failed: ${err.message}`),
    });
  }

  async function handleBulkArchive() {
    if (selectedItems.length === 0) return;
    let successes = 0;
    let failures = 0;
    for (const it of selectedItems) {
      try {
        await updateMutation.mutateAsync({
          id: it.tdvsp_ideaid,
          fields: { statecode: STATE_ARCHIVED } as never,
        });
        successes++;
      } catch {
        failures++;
      }
    }
    if (successes) toast.success(`Archived ${successes}`);
    if (failures) toast.error(`${failures} failed to archive`);
    setSelectedIds(new Set());
  }

  async function handleBulkDelete() {
    if (selectedItems.length === 0) return;
    if (!window.confirm(`Delete ${selectedItems.length} idea${selectedItems.length === 1 ? "" : "s"}? This cannot be undone.`)) {
      return;
    }
    let successes = 0;
    let failures = 0;
    for (const it of selectedItems) {
      try {
        await deleteMutation.mutateAsync(it.tdvsp_ideaid);
        successes++;
      } catch {
        failures++;
      }
    }
    if (successes) toast.success(`Deleted ${successes}`);
    if (failures) toast.error(`${failures} failed to delete`);
    setSelectedIds(new Set());
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        Failed to load ideas: {error.message}
      </div>
    );
  }

  const totalForSubtoolbar = activeView === "archived" ? viewCounts.archived : viewCounts.all;

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div
      style={{
        margin: -16, // cancel AppLayout's padding so we can paint edge-to-edge
        background: "var(--dash-bg)",
        minHeight: "calc(100vh - 88px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Hero + category strip */}
      <IdeasHeader
        items={allItems?.filter((it) => ((it as unknown as Record<string, number>).statecode ?? 0) === STATE_ACTIVE)}
        activeCategory={categoryFilter}
        onCategoryChange={setCategoryFilter}
        newThisWeekCount={viewCounts["new-week"]}
        highPotentialCount={viewCounts["high-potential"]}
      />

      {/* Capture row (search + new-idea) */}
      <IdeasToolbar
        search={search}
        onSearchChange={setSearch}
        onNewIdea={() => setCreateOpen(true)}
      />

      {/* Saved view tabs */}
      <IdeasViewTabs active={activeView} onChange={setActiveView} counts={viewCounts} />

      {/* Subtoolbar: filters + view mode + count */}
      <IdeasSubtoolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        categoryFilter={categoryFilter}
        onCategoryClear={() => setCategoryFilter(null)}
        priorityFilter={priorityFilter}
        onPriorityClear={() => setPriorityFilter(null)}
        accountFilter={accountFilter}
        accountName={accountFilter ? accountNameMap.get(accountFilter) : undefined}
        onAccountClear={() => setAccountFilter(null)}
        resultCount={filtered.length}
        totalCount={totalForSubtoolbar}
      />

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {viewMode === "table" && (
          <IdeasTable
            groups={groups}
            accountNameMap={accountNameMap}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            allSelected={allSelected}
            onView={setViewItem}
            onEdit={setEditItem}
            onDelete={setDeleteItem}
            onPromote={(item) => setPromoteItems([item])}
            quickAdd={<IdeasQuickAdd defaultCategory={categoryFilter} />}
          />
        )}
        {viewMode === "gallery" && (
          <IdeasGallery
            groups={groups}
            accountNameMap={accountNameMap}
            onView={setViewItem}
            onEdit={setEditItem}
            onDelete={setDeleteItem}
            onPromote={(item) => setPromoteItems([item])}
          />
        )}
        {viewMode === "kanban" && (
          <IdeasKanban
            items={filtered}
            accountNameMap={accountNameMap}
            onView={setViewItem}
          />
        )}
      </div>

      {/* Bulk bar (fixed bottom) */}
      <IdeasBulkBar
        count={selectedIds.size}
        onPromote={() => setPromoteItems(selectedItems)}
        onArchive={handleBulkArchive}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedIds(new Set())}
      />

      {/* Floating capture composer */}
      <CaptureComposer
        accounts={accounts}
        defaultCategory={categoryFilter ?? undefined}
      />

      {/* Dialogs */}
      <IdeaFormDialog open={createOpen} onOpenChange={setCreateOpen} mode="create" />
      <IdeaFormDialog
        open={!!editItem}
        onOpenChange={(open) => { if (!open) setEditItem(null); }}
        mode="edit"
        idea={editItem ?? undefined}
      />
      <IdeaDetailDialog
        open={!!viewItem}
        onOpenChange={(open) => { if (!open) setViewItem(null); }}
        idea={viewItem ?? undefined}
        onEdit={(item) => { setViewItem(null); setEditItem(item); }}
      />
      <IdeaDeleteDialog
        open={!!deleteItem}
        onOpenChange={(open) => { if (!open) setDeleteItem(null); }}
        itemName={deleteItem?.tdvsp_name ?? ""}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
      <PromoteDialog
        open={!!promoteItems}
        onOpenChange={(open) => { if (!open) setPromoteItems(null); }}
        ideas={promoteItems ?? []}
        onDone={() => { setPromoteItems(null); setSelectedIds(new Set()); }}
      />
    </div>
  );
}
