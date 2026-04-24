import { useEffect, useMemo, useState } from "react";
import type { Tdvsp_meetingsummariesModel } from "@/generated";
import {
  useAllMeetingSummaries,
  useDeleteMeetingSummary,
  useUpdateMeetingSummary,
} from "@/hooks/use-meeting-summaries";
import { useAccounts } from "@/hooks/use-accounts";
import { useQuickCreateStore } from "@/stores/quick-create-store";
import { toast } from "sonner";

import { MeetingSummaryFormDialog } from "./meeting-summary-form-dialog";
import { MeetingSummaryDetailDialog } from "./meeting-summary-detail-dialog";
import { MeetingSummaryDeleteDialog } from "./meeting-summary-delete-dialog";
import { ExtractActionItemsDialog } from "./extract-action-items-dialog";
import { MeetingsHeader } from "./meetings-header";
import { MeetingsToolbar } from "./meetings-toolbar";
import { MeetingsViewTabs, type MeetingSavedView } from "./meetings-view-tabs";
import { MeetingsSubtoolbar, type MeetingViewMode } from "./meetings-subtoolbar";
import { MeetingsTable, type MeetingGroup } from "./meetings-table";
import { MeetingsGallery } from "./meetings-gallery";
import { MeetingsTimeline } from "./meetings-timeline";
import { MeetingsQuickAdd } from "./meetings-quick-add";
import { MeetingsBulkBar } from "./meetings-bulk-bar";
import { STATE_ACTIVE, STATE_ARCHIVED, isPinned } from "./labels";

type MeetingSummary = Tdvsp_meetingsummariesModel.Tdvsp_meetingsummaries;

const VIEW_MODE_KEY = "meetings.view-mode";

function getViewMode(): MeetingViewMode {
  try {
    const v = localStorage.getItem(VIEW_MODE_KEY);
    if (v === "table" || v === "gallery" || v === "timeline") return v;
  } catch { /* noop */ }
  return "table";
}

export function MeetingSummaryList() {
  /* ── External open-from-quick-create signal ─────────────────── */
  const quickTarget = useQuickCreateStore((s) => s.target);
  const clearQuickCreate = useQuickCreateStore((s) => s.clear);

  /* ── Dialog state ───────────────────────────────────────────── */
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<MeetingSummary | null>(null);
  const [viewItem, setViewItem] = useState<MeetingSummary | null>(null);
  const [deleteItem, setDeleteItem] = useState<MeetingSummary | null>(null);
  const [spawnItem, setSpawnItem] = useState<MeetingSummary | null>(null);

  useEffect(() => {
    if (quickTarget === "meeting-summaries") {
      setCreateOpen(true);
      clearQuickCreate();
    }
  }, [quickTarget, clearQuickCreate]);

  /* ── Keyboard: ⌘⇧M opens new-summary dialog ─────────────────── */
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.shiftKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        setCreateOpen(true);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ── Filter / view state ────────────────────────────────────── */
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState<MeetingSavedView>("all");
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<MeetingViewMode>(getViewMode);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try { localStorage.setItem(VIEW_MODE_KEY, viewMode); } catch { /* noop */ }
  }, [viewMode]);

  /* ── Data ───────────────────────────────────────────────────── */
  const { data: allItems, error } = useAllMeetingSummaries();
  const { data: accounts } = useAccounts();
  const updateMutation = useUpdateMeetingSummary();
  const deleteMutation = useDeleteMeetingSummary();

  const accountNameMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts?.forEach((a) => map.set(a.accountid, a.name));
    return map;
  }, [accounts]);

  /* ── Active items (drives stats in the hero) ────────────────── */
  const activeItems = useMemo(
    () => (allItems ?? []).filter((it) => ((it as unknown as Record<string, number>).statecode ?? 0) === STATE_ACTIVE),
    [allItems],
  );

  /* ── View counts ────────────────────────────────────────────── */
  const viewCounts = useMemo<Record<MeetingSavedView, number>>(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let all = 0, mine = 0, thisWeek = 0, needsSummary = 0, pinned = 0, archived = 0;
    for (const it of allItems ?? []) {
      const state = (it as unknown as Record<string, number>).statecode ?? 0;
      if (state === STATE_ARCHIVED) { archived++; continue; }
      all++;
      mine++; // placeholder until current-user is plumbed
      if (it.tdvsp_date && new Date(it.tdvsp_date).getTime() >= weekAgo) thisWeek++;
      if (!it.tdvsp_summary?.trim()) needsSummary++;
      if (isPinned(it)) pinned++;
    }
    return { all, mine, "this-week": thisWeek, "needs-summary": needsSummary, pinned, archived };
  }, [allItems]);

  /* ── Filtered list ──────────────────────────────────────────── */
  const filtered = useMemo(() => {
    if (!allItems) return [] as MeetingSummary[];
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const searchLower = search.trim().toLowerCase();

    return allItems.filter((it) => {
      const state = (it as unknown as Record<string, number>).statecode ?? 0;
      const isArchived = state === STATE_ARCHIVED;

      switch (activeView) {
        case "archived":
          if (!isArchived) return false;
          break;
        case "this-week": {
          if (isArchived) return false;
          if (!it.tdvsp_date || new Date(it.tdvsp_date).getTime() < weekAgo) return false;
          break;
        }
        case "needs-summary":
          if (isArchived) return false;
          if (it.tdvsp_summary?.trim()) return false;
          break;
        case "pinned":
          if (isArchived) return false;
          if (!isPinned(it)) return false;
          break;
        case "mine":
        case "all":
        default:
          if (isArchived) return false;
          break;
      }

      if (accountFilter !== null) {
        const a = (it as unknown as Record<string, string>)._tdvsp_account_value;
        if (a !== accountFilter) return false;
      }

      if (searchLower) {
        const name = (it.tdvsp_name ?? "").toLowerCase();
        const summary = (it.tdvsp_summary ?? "").toLowerCase();
        if (!name.includes(searchLower) && !summary.includes(searchLower)) return false;
      }

      return true;
    });
  }, [allItems, activeView, accountFilter, search]);

  /* ── Group by account, sorted by date desc inside each group ── */
  const groups: MeetingGroup[] = useMemo(() => {
    const buckets = new Map<string, MeetingSummary[]>();
    const accountNameForId = new Map<string, string>();

    for (const it of filtered) {
      const aid = (it as unknown as Record<string, string>)._tdvsp_account_value ?? "";
      const key = aid || "__none__";
      const list = buckets.get(key) ?? [];
      list.push(it);
      buckets.set(key, list);
      if (aid && !accountNameForId.has(aid)) {
        accountNameForId.set(aid, it.tdvsp_accountname ?? accountNameMap.get(aid) ?? "Unknown account");
      }
    }

    for (const list of buckets.values()) {
      list.sort((a, b) => (b.tdvsp_date ?? "").localeCompare(a.tdvsp_date ?? ""));
    }

    // Ordered: accounts with most meetings first, "No account" bucket last
    const ordered = [...buckets.entries()]
      .sort((a, b) => {
        if (a[0] === "__none__") return 1;
        if (b[0] === "__none__") return -1;
        return b[1].length - a[1].length;
      })
      .map(([key, items]): MeetingGroup => ({
        accountId: key === "__none__" ? null : key,
        accountName: key === "__none__" ? "No account" : (accountNameForId.get(key) ?? "Unknown account"),
        items,
      }));

    return ordered;
  }, [filtered, accountNameMap]);

  /* ── Selection ──────────────────────────────────────────────── */
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
      return new Set(filtered.map((it) => it.tdvsp_meetingsummaryid));
    });
  }
  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;
  const selectedItems = useMemo(
    () => filtered.filter((it) => selectedIds.has(it.tdvsp_meetingsummaryid)),
    [filtered, selectedIds],
  );
  const allSelectedPinned = selectedItems.length > 0 && selectedItems.every(isPinned);

  /* ── Actions ────────────────────────────────────────────────── */
  function handleDelete() {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.tdvsp_meetingsummaryid, {
      onSuccess: () => {
        toast.success(`Deleted "${deleteItem.tdvsp_name}"`);
        setDeleteItem(null);
      },
      onError: (err) => toast.error(`Delete failed: ${err.message}`),
    });
  }

  async function handleBulkArchive() {
    if (selectedItems.length === 0) return;
    let successes = 0, failures = 0;
    for (const it of selectedItems) {
      try {
        await updateMutation.mutateAsync({
          id: it.tdvsp_meetingsummaryid,
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
    if (!window.confirm(`Delete ${selectedItems.length} meeting${selectedItems.length === 1 ? "" : "s"}? This cannot be undone.`)) {
      return;
    }
    let successes = 0, failures = 0;
    for (const it of selectedItems) {
      try {
        await deleteMutation.mutateAsync(it.tdvsp_meetingsummaryid);
        successes++;
      } catch {
        failures++;
      }
    }
    if (successes) toast.success(`Deleted ${successes}`);
    if (failures) toast.error(`${failures} failed to delete`);
    setSelectedIds(new Set());
  }

  async function handleBulkTogglePin() {
    if (selectedItems.length === 0) return;
    const target = !allSelectedPinned; // if all pinned → unpin all; else pin all
    let successes = 0, failures = 0;
    for (const it of selectedItems) {
      try {
        await updateMutation.mutateAsync({
          id: it.tdvsp_meetingsummaryid,
          fields: { tdvsp_pinned: target } as never,
        });
        successes++;
      } catch {
        failures++;
      }
    }
    if (successes) toast.success(`${target ? "Pinned" : "Unpinned"} ${successes}`);
    if (failures) toast.error(`${failures} failed`);
    setSelectedIds(new Set());
  }

  function handleBulkSpawn() {
    if (selectedItems.length !== 1) {
      toast.error("Pick a single meeting to spawn action items from");
      return;
    }
    setSpawnItem(selectedItems[0]!);
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        Failed to load meeting summaries: {error.message}
      </div>
    );
  }

  const totalForSubtoolbar = activeView === "archived" ? viewCounts.archived : viewCounts.all;

  return (
    <div
      style={{
        margin: -16, // cancel AppLayout padding for edge-to-edge
        background: "var(--dash-bg)",
        minHeight: "calc(100vh - 88px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <MeetingsHeader
        items={activeItems}
        onNew={() => setCreateOpen(true)}
        onUploadTranscript={() => {
          toast.info("Upload transcript coming soon — for now, paste it into the summary field when creating a meeting.");
        }}
      />

      <MeetingsToolbar search={search} onSearchChange={setSearch} />

      <MeetingsViewTabs active={activeView} onChange={setActiveView} counts={viewCounts} />

      <MeetingsSubtoolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        accountFilter={accountFilter}
        accountName={accountFilter ? accountNameMap.get(accountFilter) : undefined}
        onAccountClear={() => setAccountFilter(null)}
        resultCount={filtered.length}
        totalCount={totalForSubtoolbar}
      />

      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {viewMode === "table" && (
          <MeetingsTable
            groups={groups}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            allSelected={allSelected}
            onView={setViewItem}
            onEdit={setEditItem}
            onDelete={setDeleteItem}
            onSpawn={setSpawnItem}
            onAccountFilter={setAccountFilter}
            quickAdd={<MeetingsQuickAdd defaultAccountId={accountFilter} />}
          />
        )}
        {viewMode === "gallery" && (
          <MeetingsGallery
            groups={groups}
            onView={setViewItem}
            onEdit={setEditItem}
            onDelete={setDeleteItem}
            onSpawn={setSpawnItem}
            onAccountFilter={setAccountFilter}
          />
        )}
        {viewMode === "timeline" && (
          <MeetingsTimeline items={filtered} onView={setViewItem} />
        )}
      </div>

      <MeetingsBulkBar
        count={selectedIds.size}
        allPinned={allSelectedPinned}
        onSpawn={handleBulkSpawn}
        onTogglePin={handleBulkTogglePin}
        onArchive={handleBulkArchive}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedIds(new Set())}
      />

      {/* Dialogs */}
      <MeetingSummaryFormDialog open={createOpen} onOpenChange={setCreateOpen} mode="create" />
      <MeetingSummaryFormDialog
        open={!!editItem}
        onOpenChange={(open) => { if (!open) setEditItem(null); }}
        mode="edit"
        meetingSummary={editItem ?? undefined}
      />
      <MeetingSummaryDetailDialog
        open={!!viewItem}
        onOpenChange={(open) => { if (!open) setViewItem(null); }}
        meetingSummary={viewItem ?? undefined}
        onEdit={(item) => { setViewItem(null); setEditItem(item); }}
      />
      <MeetingSummaryDeleteDialog
        open={!!deleteItem}
        onOpenChange={(open) => { if (!open) setDeleteItem(null); }}
        itemName={deleteItem?.tdvsp_name ?? ""}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
      {spawnItem && (
        <ExtractActionItemsDialog
          open={!!spawnItem}
          onOpenChange={(open) => { if (!open) setSpawnItem(null); }}
          meetingSummary={spawnItem}
        />
      )}
    </div>
  );
}
