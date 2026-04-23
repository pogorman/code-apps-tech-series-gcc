import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useActionItems, useCreateActionItem, useUpdateActionItem } from "@/hooks/use-action-items";
import { useProjects, useUpdateProject } from "@/hooks/use-projects";
import { useIdeas, useUpdateIdea } from "@/hooks/use-ideas";
import {
  useMeetingSummaries,
  useUpdateMeetingSummary,
} from "@/hooks/use-meeting-summaries";
import { ActionItemFormDialog } from "@/components/action-items";
import { IdeaFormDialog } from "@/components/ideas";
import { MeetingSummaryFormDialog } from "@/components/meeting-summaries";
import { ProjectFormDialog } from "@/components/projects";
import { Skeleton } from "@/components/ui/skeleton";
import { Columns3 } from "lucide-react";

import {
  COLUMN_COLORS,
  COLUMN_ICONS,
  STATUS_COMPLETE,
  STATUS_RECOGNIZED,
  PRIORITY_MED,
  TASK_TYPE_WORK,
  WORK_FILTERS,
  workFilterConfig,
  type EditTarget,
  type ParkingLotEntry,
  type CardConfig,
  type ActionItem,
  type Idea,
  type Project,
} from "./board-tokens";
import { BoardToolbar } from "./board-toolbar";
import { BoardCard, ParkingLotCard } from "./board-card";
import { BoardColumn } from "./board-column";

/* ── helpers ──────────────────────────────────────────────────── */

function isItemPinned(item: unknown): boolean {
  const val = (item as Record<string, unknown>).tdvsp_pinned;
  return val === true || val === 1;
}

/* ── localStorage sort order helpers ─────────────────────────── */

const ORDER_PREFIX = "board-order-";

function getSavedOrder(column: string): string[] {
  try {
    const raw = localStorage.getItem(`${ORDER_PREFIX}${column}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOrder(column: string, ids: string[]): void {
  try {
    localStorage.setItem(`${ORDER_PREFIX}${column}`, JSON.stringify(ids));
  } catch {
    // localStorage unavailable
  }
}

function applyOrder<T>(items: T[], getId: (item: T) => string, savedOrder: string[]): T[] {
  if (savedOrder.length === 0) return items;
  const posMap = new Map(savedOrder.map((id, i) => [id, i]));
  const sorted = [...items];
  sorted.sort((a, b) => {
    const posA = posMap.get(getId(a)) ?? Infinity;
    const posB = posMap.get(getId(b)) ?? Infinity;
    return posA - posB;
  });
  return sorted;
}

/* ── drag handle types ───────────────────────────────────────── */

type DragHandleProps = {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
};

/* ── sortable card wrapper ───────────────────────────────────── */

const CARD_MOTION = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
} as const;

const CARD_TRANSITION = {
  duration: 0.32,
  ease: [0.16, 1, 0.3, 1] as const,
};

function SortableCard({
  id,
  index = 0,
  children,
}: {
  id: string;
  index?: number;
  children: (handle: DragHandleProps) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging
      ? {
          position: "relative" as const,
          zIndex: 9999,
          rotate: "-1.2deg",
          boxShadow: "var(--dash-shadow-drag)",
          borderColor: "var(--dash-violet)",
          borderWidth: "2px",
          borderStyle: "solid",
          borderRadius: "8px",
        }
      : {}),
  };

  const staggerDelay = Math.min(index, 12) * 0.035;

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        initial={CARD_MOTION.initial}
        animate={CARD_MOTION.animate}
        transition={{ ...CARD_TRANSITION, delay: staggerDelay }}
      >
        {children({ attributes, listeners })}
      </motion.div>
    </div>
  );
}

/* ── card config builders ────────────────────────────────────── */

function toActionItemConfig(
  item: ActionItem,
  onEdit: () => void,
  onPinToggle: () => void,
): CardConfig {
  return {
    id: item.tdvsp_actionitemid,
    kind: "action-item",
    title: item.tdvsp_name,
    description: item.tdvsp_description ?? undefined,
    priority: item.tdvsp_priority ?? undefined,
    status: item.tdvsp_taskstatus ?? undefined,
    taskType: item.tdvsp_tasktype ?? undefined,
    date: item.tdvsp_date ?? undefined,
    customerName: item.tdvsp_customername ?? undefined,
    modifiedOn: (item as unknown as Record<string, string>).modifiedon ?? undefined,
    isPinned: isItemPinned(item),
    onEdit,
    onPinToggle,
  };
}

function toProjectConfig(
  project: Project,
  onEdit: () => void,
  onPinToggle: () => void,
): CardConfig {
  return {
    id: project.tdvsp_projectid,
    kind: "project",
    title: project.tdvsp_name,
    description: project.tdvsp_description ?? undefined,
    priority: project.tdvsp_priority ?? undefined,
    modifiedOn: (project as unknown as Record<string, string>).modifiedon ?? undefined,
    isPinned: isItemPinned(project),
    onEdit,
    onPinToggle,
  };
}

function toIdeaConfig(
  idea: Idea,
  onEdit: () => void,
  onPinToggle: () => void,
): CardConfig {
  const priority = (idea as unknown as Record<string, number>).tdvsp_priority;
  return {
    id: idea.tdvsp_ideaid,
    kind: "idea",
    title: idea.tdvsp_name,
    description: idea.tdvsp_description ?? undefined,
    priority: priority ?? undefined,
    category: idea.tdvsp_category ?? undefined,
    modifiedOn: (idea as unknown as Record<string, string>).modifiedon ?? undefined,
    isPinned: isItemPinned(idea),
    onEdit,
    onPinToggle,
  };
}

/* ── main board dashboard ────────────────────────────────────── */

export function BoardDashboard() {
  const {
    data: actionItems,
    isLoading: loadingItems,
    error: itemsError,
  } = useActionItems();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: ideas, isLoading: loadingIdeas } = useIdeas();
  const { data: meetingSummaries, isLoading: loadingMeetings } = useMeetingSummaries();
  const updateActionItem = useUpdateActionItem();
  const updateProject = useUpdateProject();
  const updateIdea = useUpdateIdea();
  const updateMeetingSummary = useUpdateMeetingSummary();
  const createActionItem = useCreateActionItem();

  /* work column task-type filter */
  const [workFilter, setWorkFilter] = useState<number | null>(null);

  /* edit dialog state */
  const [editTarget, setEditTarget] = useState<EditTarget>(null);

  /* create dialog state (for Projects / Ideas quick-add) */
  const [createDialog, setCreateDialog] = useState<"project" | "idea" | null>(null);

  /* drag-over column highlight */
  const [overColumn, setOverColumn] = useState<string | null>(null);

  /* sort order state */
  const [orders, setOrders] = useState<Record<string, string[]>>(() => ({
    parkingLot: getSavedOrder("parkingLot"),
    work: getSavedOrder("work"),
    projects: getSavedOrder("projects"),
    ideas: getSavedOrder("ideas"),
  }));

  const handleReorder = useCallback((columnKey: string, newIds: string[]) => {
    setOrders((prev) => ({ ...prev, [columnKey]: newIds }));
    saveOrder(columnKey, newIds);
  }, []);

  /* pin/unpin handlers */
  const handleActionItemPin = (id: string) => {
    const item = actionItems?.find((i) => i.tdvsp_actionitemid === id);
    const newVal = item ? !isItemPinned(item) : true;
    updateActionItem.mutate({ id, fields: { tdvsp_pinned: newVal } as never });
  };

  const handleProjectPin = (id: string) => {
    const item = projects?.find((p) => p.tdvsp_projectid === id);
    const newVal = item ? !isItemPinned(item) : true;
    updateProject.mutate({ id, fields: { tdvsp_pinned: newVal } as never });
  };

  const handleIdeaPin = (id: string) => {
    const item = ideas?.find((i) => i.tdvsp_ideaid === id);
    const newVal = item ? !isItemPinned(item) : true;
    updateIdea.mutate({ id, fields: { tdvsp_pinned: newVal } as never });
  };

  const handleMeetingSummaryPin = (id: string) => {
    const item = meetingSummaries?.find((m) => m.tdvsp_meetingsummaryid === id);
    const newVal = item ? !isItemPinned(item) : true;
    updateMeetingSummary.mutate({ id, fields: { tdvsp_pinned: newVal } as never });
  };

  /* quick add handler for action items */
  const handleQuickAddActionItem = (name: string) => {
    createActionItem.mutate({
      tdvsp_name: name,
      tdvsp_priority: PRIORITY_MED,
      tdvsp_taskstatus: STATUS_RECOGNIZED,
      tdvsp_tasktype: workFilter ?? TASK_TYPE_WORK,
    } as never);
  };

  const isLoading = loadingItems || loadingProjects || loadingIdeas || loadingMeetings;

  /* ── build parking lot ─────────────────────────────────────── */
  const parkingLotEntries: ParkingLotEntry[] = [];

  (actionItems ?? []).filter(isItemPinned).forEach((item) => {
    parkingLotEntries.push({
      kind: "action-item",
      id: item.tdvsp_actionitemid,
      sortId: `ai-${item.tdvsp_actionitemid}`,
      name: item.tdvsp_name,
      description: item.tdvsp_description ?? undefined,
      priority: item.tdvsp_priority ?? undefined,
      taskType: item.tdvsp_tasktype ?? undefined,
      modifiedOn: (item as unknown as Record<string, string>).modifiedon ?? undefined,
      onUnpin: () => handleActionItemPin(item.tdvsp_actionitemid),
      onEdit: () => setEditTarget({ kind: "action-item", item }),
    });
  });

  (projects ?? []).filter(isItemPinned).forEach((project) => {
    parkingLotEntries.push({
      kind: "project",
      id: project.tdvsp_projectid,
      sortId: `proj-${project.tdvsp_projectid}`,
      name: project.tdvsp_name,
      description: project.tdvsp_description ?? undefined,
      priority: project.tdvsp_priority ?? undefined,
      modifiedOn: (project as unknown as Record<string, string>).modifiedon ?? undefined,
      onUnpin: () => handleProjectPin(project.tdvsp_projectid),
      onEdit: () => setEditTarget({ kind: "project", item: project }),
    });
  });

  (ideas ?? []).filter(isItemPinned).forEach((idea) => {
    const priority = (idea as unknown as Record<string, number>).tdvsp_priority;
    parkingLotEntries.push({
      kind: "idea",
      id: idea.tdvsp_ideaid,
      sortId: `idea-${idea.tdvsp_ideaid}`,
      name: idea.tdvsp_name,
      description: idea.tdvsp_description ?? undefined,
      priority: priority ?? undefined,
      modifiedOn: (idea as unknown as Record<string, string>).modifiedon ?? undefined,
      onUnpin: () => handleIdeaPin(idea.tdvsp_ideaid),
      onEdit: () => setEditTarget({ kind: "idea", item: idea }),
    });
  });

  (meetingSummaries ?? []).filter(isItemPinned).forEach((ms) => {
    parkingLotEntries.push({
      kind: "meeting-summary",
      id: ms.tdvsp_meetingsummaryid,
      sortId: `ms-${ms.tdvsp_meetingsummaryid}`,
      name: ms.tdvsp_name,
      modifiedOn: (ms as unknown as Record<string, string>).modifiedon ?? undefined,
      onUnpin: () => handleMeetingSummaryPin(ms.tdvsp_meetingsummaryid),
      onEdit: () => setEditTarget({ kind: "meeting-summary", item: ms }),
    });
  });

  const sortedParkingLot = applyOrder(parkingLotEntries, (e) => e.sortId, orders.parkingLot ?? []);
  const parkingLotIds = sortedParkingLot.map((e) => e.sortId);

  /* ── build other columns ───────────────────────────────────── */
  const work = applyOrder(
    actionItems?.filter(
      (i) =>
        i.tdvsp_taskstatus !== STATUS_COMPLETE &&
        (workFilter === null || i.tdvsp_tasktype === workFilter)
    ) ?? [],
    (i) => i.tdvsp_actionitemid,
    orders.work ?? [],
  );
  const projectList = applyOrder(projects ?? [], (p) => p.tdvsp_projectid, orders.projects ?? []);
  const ideaList = applyOrder(ideas ?? [], (i) => i.tdvsp_ideaid, orders.ideas ?? []);

  const workIds = work.map((i) => i.tdvsp_actionitemid);
  const projectIds = projectList.map((p) => p.tdvsp_projectid);
  const ideaIds = ideaList.map((i) => i.tdvsp_ideaid);

  /* ── DnD setup ─────────────────────────────────────────────── */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const workIdSet = new Set(workIds);
  const projectIdSet = new Set(projectIds);
  const ideaIdSet = new Set(ideaIds);
  const parkingLotIdSet = new Set(parkingLotIds);

  const getColumnForId = useCallback((id: string): string | null => {
    if (id.startsWith("col-")) return id.slice(4);
    if (workIdSet.has(id)) return "work";
    if (projectIdSet.has(id)) return "projects";
    if (ideaIdSet.has(id)) return "ideas";
    if (parkingLotIdSet.has(id)) return "parkingLot";
    return null;
  }, [workIdSet, projectIdSet, ideaIdSet, parkingLotIdSet]);

  const collisionDetection: CollisionDetection = useCallback((args) => {
    const centerHits = closestCenter(args);
    if (centerHits.length > 0) {
      const activeCol = getColumnForId(String(args.active.id));
      const overCol = centerHits[0] ? getColumnForId(String(centerHits[0].id)) : null;
      if (activeCol && activeCol === overCol) return centerHits;
    }
    const pointerHits = pointerWithin(args);
    const colHit = pointerHits.find((h) => String(h.id).startsWith("col-"));
    if (colHit) return [colHit];
    return centerHits;
  }, [getColumnForId]);

  const handleBoardDragOver = (event: DragOverEvent) => {
    const overId = event.over ? String(event.over.id) : null;
    setOverColumn(overId ? getColumnForId(overId) : null);
  };

  const handleBoardDragEnd = (event: DragEndEvent) => {
    setOverColumn(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const srcCol = getColumnForId(activeId);
    const dstCol = getColumnForId(overId);
    if (!srcCol || !dstCol) return;

    /* same column → reorder */
    if (srcCol === dstCol) {
      const colIds =
        srcCol === "work" ? workIds :
        srcCol === "projects" ? projectIds :
        srcCol === "ideas" ? ideaIds :
        srcCol === "parkingLot" ? parkingLotIds : [];
      const oldIdx = colIds.indexOf(activeId);
      const newIdx = colIds.indexOf(overId);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        handleReorder(srcCol, arrayMove([...colIds], oldIdx, newIdx));
      }
      return;
    }

    /* cross-column: → parking lot = pin */
    if (dstCol === "parkingLot" && srcCol !== "parkingLot") {
      if (srcCol === "work") updateActionItem.mutate({ id: activeId, fields: { tdvsp_pinned: true } as never });
      else if (srcCol === "projects") updateProject.mutate({ id: activeId, fields: { tdvsp_pinned: true } as never });
      else if (srcCol === "ideas") updateIdea.mutate({ id: activeId, fields: { tdvsp_pinned: true } as never });
      return;
    }

    /* cross-column: parking lot → elsewhere = unpin */
    if (srcCol === "parkingLot" && dstCol !== "parkingLot") {
      if (activeId.startsWith("ai-")) updateActionItem.mutate({ id: activeId.slice(3), fields: { tdvsp_pinned: false } as never });
      else if (activeId.startsWith("proj-")) updateProject.mutate({ id: activeId.slice(5), fields: { tdvsp_pinned: false } as never });
      else if (activeId.startsWith("idea-")) updateIdea.mutate({ id: activeId.slice(5), fields: { tdvsp_pinned: false } as never });
      else if (activeId.startsWith("ms-")) updateMeetingSummary.mutate({ id: activeId.slice(3), fields: { tdvsp_pinned: false } as never });
    }
  };

  /* ── error state ───────────────────────────────────────────── */
  if (itemsError) {
    return (
      <div
        className="rounded-xl p-5"
        style={{
          border: "1px solid var(--dash-red)",
          background: "var(--dash-t-red)",
          color: "var(--dash-red)",
        }}
      >
        Failed to load board data: {itemsError.message}
      </div>
    );
  }

  /* ── loading state ─────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div
        className="h-full flex flex-col"
        style={{ fontFamily: "'Inter', sans-serif", background: "var(--dash-bg)" }}
      >
        <div className="flex items-center gap-3 p-4">
          <div
            className="w-7 h-7 rounded-[7px] grid place-items-center"
            style={{ background: "var(--dash-t-violet)", color: "var(--dash-violet)" }}
          >
            <Columns3 className="h-4 w-4" />
          </div>
          <div>
            <Skeleton className="h-5 w-28 mb-1.5" />
            <Skeleton className="h-3 w-52" />
          </div>
        </div>
        <div
          className="grid flex-1 min-h-0 gap-3 px-[18px] pb-[18px]"
          style={{ gridTemplateColumns: "1fr 2fr 1fr 1fr" }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{ background: "var(--dash-surface-2)", border: "1px solid var(--dash-border)" }}
            >
              <Skeleton className="h-4 w-20 mb-1" />
              <div className="h-px mb-4" style={{ background: "var(--dash-border)" }} />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── work column filter tabs (headerInline) ────────────────── */
  const workHeaderInline = (
    <div className="flex items-center gap-1.5 mt-0.5">
      <button
        type="button"
        title="All"
        className="text-[10px] font-semibold px-[7px] py-[3px] rounded cursor-pointer border"
        style={{
          fontFamily: "inherit",
          background: workFilter === null ? "var(--dash-ink-1)" : "var(--dash-surface)",
          color: workFilter === null ? "#fff" : "var(--dash-ink-3)",
          borderColor: workFilter === null ? "var(--dash-ink-1)" : "var(--dash-border-strong)",
        }}
        onClick={() => setWorkFilter(null)}
      >
        A
      </button>
      {WORK_FILTERS.map((f) => (
        <button
          key={f.key}
          type="button"
          title={f.label}
          className="text-[10px] font-semibold px-[7px] py-[3px] rounded cursor-pointer border"
          style={{
            fontFamily: "inherit",
            background: workFilter === f.key ? f.accent : "var(--dash-surface)",
            color: workFilter === f.key ? "#fff" : "var(--dash-ink-3)",
            borderColor: workFilter === f.key ? f.accent : "var(--dash-border-strong)",
          }}
          onClick={() => setWorkFilter(f.key)}
        >
          {f.letter}
        </button>
      ))}
    </div>
  );

  const wfc = workFilterConfig(workFilter);

  return (
    <div
      className="h-full flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif", background: "var(--dash-bg)" }}
    >
      {/* Toolbar */}
      <BoardToolbar
        onNewItem={() => setEditTarget({ kind: "action-item", item: undefined as unknown as ActionItem })}
      />

      {/* Board grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragOver={handleBoardDragOver}
        onDragEnd={handleBoardDragEnd}
        onDragCancel={() => setOverColumn(null)}
      >
        <div
          className="grid flex-1 min-h-0"
          style={{
            gridTemplateColumns: "1fr 2fr 1fr 1fr",
            gap: "12px",
            padding: "14px 18px 18px",
          }}
        >
          {/* Parking Lot */}
          <BoardColumn
            columnKey="parkingLot"
            title="Parking Lot"
            icon={COLUMN_ICONS.parkingLot}
            accent={COLUMN_COLORS.parkingLot}
            ids={parkingLotIds}
            isDropTarget={overColumn === "parkingLot"}
            delay={60}
            quickAddPlaceholder="Add to parking lot…"
          >
            {sortedParkingLot.map((entry, idx) => (
              <SortableCard key={entry.sortId} id={entry.sortId} index={idx}>
                {(handle) => <ParkingLotCard entry={entry} dragHandle={handle} />}
              </SortableCard>
            ))}
          </BoardColumn>

          {/* Work (Action Items) */}
          <BoardColumn
            columnKey="work"
            title={wfc.title}
            icon={wfc.icon}
            accent={wfc.accent}
            ids={workIds}
            isDropTarget={overColumn === "work"}
            delay={135}
            headerInline={workHeaderInline}
            quickAddPlaceholder="Add action item…"
            onQuickAdd={handleQuickAddActionItem}
          >
            {work.map((item, idx) => (
              <SortableCard key={item.tdvsp_actionitemid} id={item.tdvsp_actionitemid} index={idx}>
                {(handle) => (
                  <BoardCard
                    config={toActionItemConfig(
                      item,
                      () => setEditTarget({ kind: "action-item", item }),
                      () => handleActionItemPin(item.tdvsp_actionitemid),
                    )}
                    dragHandle={handle}
                  />
                )}
              </SortableCard>
            ))}
          </BoardColumn>

          {/* Projects */}
          <BoardColumn
            columnKey="projects"
            title="Projects"
            icon={COLUMN_ICONS.projects}
            accent={COLUMN_COLORS.projects}
            ids={projectIds}
            isDropTarget={overColumn === "projects"}
            delay={210}
            quickAddPlaceholder="Add project…"
            onQuickAddClick={() => setCreateDialog("project")}
          >
            {projectList.map((project, idx) => (
              <SortableCard key={project.tdvsp_projectid} id={project.tdvsp_projectid} index={idx}>
                {(handle) => (
                  <BoardCard
                    config={toProjectConfig(
                      project,
                      () => setEditTarget({ kind: "project", item: project }),
                      () => handleProjectPin(project.tdvsp_projectid),
                    )}
                    dragHandle={handle}
                  />
                )}
              </SortableCard>
            ))}
          </BoardColumn>

          {/* Ideas */}
          <BoardColumn
            columnKey="ideas"
            title="Ideas"
            icon={COLUMN_ICONS.ideas}
            accent={COLUMN_COLORS.ideas}
            ids={ideaIds}
            isDropTarget={overColumn === "ideas"}
            delay={285}
            quickAddPlaceholder="Capture an idea…"
            onQuickAddClick={() => setCreateDialog("idea")}
          >
            {ideaList.map((idea, idx) => (
              <SortableCard key={idea.tdvsp_ideaid} id={idea.tdvsp_ideaid} index={idx}>
                {(handle) => (
                  <BoardCard
                    config={toIdeaConfig(
                      idea,
                      () => setEditTarget({ kind: "idea", item: idea }),
                      () => handleIdeaPin(idea.tdvsp_ideaid),
                    )}
                    dragHandle={handle}
                  />
                )}
              </SortableCard>
            ))}
          </BoardColumn>
        </div>
      </DndContext>

      {/* ── Edit dialogs ─────────────────────────────────────── */}
      <ActionItemFormDialog
        open={editTarget?.kind === "action-item"}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        mode="edit"
        actionItem={editTarget?.kind === "action-item" ? editTarget.item : undefined}
      />
      <IdeaFormDialog
        open={editTarget?.kind === "idea" || createDialog === "idea"}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setCreateDialog(null);
          }
        }}
        mode={createDialog === "idea" ? "create" : "edit"}
        idea={editTarget?.kind === "idea" ? editTarget.item : undefined}
      />
      <ProjectFormDialog
        open={editTarget?.kind === "project" || createDialog === "project"}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setCreateDialog(null);
          }
        }}
        mode={createDialog === "project" ? "create" : "edit"}
        project={editTarget?.kind === "project" ? editTarget.item : undefined}
      />
      <MeetingSummaryFormDialog
        open={editTarget?.kind === "meeting-summary"}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        mode="edit"
        meetingSummary={editTarget?.kind === "meeting-summary" ? editTarget.item : undefined}
      />
    </div>
  );
}
