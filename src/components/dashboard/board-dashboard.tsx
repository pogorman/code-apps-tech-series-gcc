import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useActionItems, useUpdateActionItem } from "@/hooks/use-action-items";
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
import { TileColorDots } from "@/components/ui/tile-color-dots";
import {
  priorityToColorIndex,
  tileBgClass,
  tileGradient,
  COLOR_TO_PRIORITY,
} from "@/lib/tile-colors";
import { cn } from "@/lib/utils";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_TYPE_LABELS,
  priorityPillClass,
  statusPillClass,
} from "@/components/action-items/labels";
import { CATEGORY_LABELS, categoryPillClass } from "@/components/ideas/labels";

import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Briefcase,
  Car,
  Columns3,
  FileText,
  FolderKanban,
  GripVertical,
  House,
  LayoutGrid,
  Lightbulb,
  Pencil,
  X,
} from "lucide-react";
import type { Tdvsp_actionitemsModel } from "@/generated";
import type { Tdvsp_ideasModel } from "@/generated";
import type { Tdvsp_projectsModel } from "@/generated";
import type { Tdvsp_meetingsummariesModel } from "@/generated";

type ActionItem = Tdvsp_actionitemsModel.Tdvsp_actionitems;
type Idea = Tdvsp_ideasModel.Tdvsp_ideas;
type Project = Tdvsp_projectsModel.Tdvsp_projects;
type MeetingSummary = Tdvsp_meetingsummariesModel.Tdvsp_meetingsummaries;

/* ── helpers ──────────────────────────────────────────────────── */

function isItemPinned(item: unknown): boolean {
  const val = (item as Record<string, unknown>).tdvsp_pinned;
  return val === true || val === 1;
}

/* ── status keys ──────────────────────────────────────────────── */

const COMPLETE = 468510005;
const TASK_TYPE_PERSONAL = 468510000;
const TASK_TYPE_WORK = 468510001;
const TASK_TYPE_LEARNING = 468510002;

const WORK_FILTERS = [
  { key: TASK_TYPE_WORK, letter: "W", label: "Work", accent: "#ef4444", icon: Briefcase },
  { key: TASK_TYPE_PERSONAL, letter: "P", label: "Personal", accent: "#3b82f6", icon: House },
  { key: TASK_TYPE_LEARNING, letter: "L", label: "Learning", accent: "#d946ef", icon: BookOpen },
] as const;

const WORK_ALL_ACCENT = "#6b7280";
const WORK_ALL_ICON = LayoutGrid;

function workFilterConfig(filter: number | null) {
  const match = WORK_FILTERS.find((f) => f.key === filter);
  return {
    accent: match?.accent ?? WORK_ALL_ACCENT,
    icon: match?.icon ?? WORK_ALL_ICON,
    title: match?.label.toLowerCase() ?? "all",
  };
}

/* ── column accent colours ────────────────────────────────────── */

const ACCENT = {
  parkingLot: "#22c55e",
  projects: "#8b5cf6",
  ideas: "#EF9F27",
} as const;

/* ── animation keyframes ──────────────────────────────────────── */

const BOARD_ANIM_CSS = `
@keyframes dashRise {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
`;

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

/* ── drag handle props ───────────────────────────────────────── */

type DragHandleProps = {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
};

/* ── sortable card wrapper (render-prop for drag handle) ─────── */

function SortableCard({
  id,
  children,
}: {
  id: string;
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
    ...(isDragging ? { position: "relative" as const, zIndex: 9999 } : {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group transition-all duration-200",
        isDragging
          ? "opacity-95 scale-[1.02] rotate-[1deg] ring-2 ring-primary/30 rounded-lg shadow-2xl"
          : "hover:-translate-y-0.5",
      )}
    >
      {children({ attributes, listeners })}
    </div>
  );
}

/* ── floating card toolbar ───────────────────────────────────── */

function CardToolbar({
  colorIdx,
  onPriorityChange,
  pinned,
  onPinToggle,
  onEdit,
  dragHandle,
}: {
  colorIdx: number;
  onPriorityChange: (idx: number) => void;
  pinned: boolean;
  onPinToggle: () => void;
  onEdit?: () => void;
  dragHandle: DragHandleProps;
}) {
  return (
    <div
      className={cn(
        "absolute -top-2.5 -right-2.5 z-10 flex items-center gap-1.5",
        "rounded-lg border border-border/50 bg-popover/90 backdrop-blur-xl px-2 py-1",
        "shadow-lg shadow-black/8 dark:shadow-black/25 opacity-0 group-hover:opacity-100 transition-all duration-200",
      )}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* drag grip */}
      <div
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
        {...dragHandle.attributes}
        {...dragHandle.listeners}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* priority color dots */}
      <TileColorDots
        activeIndex={colorIdx}
        onChange={onPriorityChange}
        className="!opacity-100"
      />

      {/* separator */}
      <div className="h-4 w-px bg-border/50 shrink-0" />

      {/* edit */}
      {onEdit && (
        <button
          type="button"
          title="Edit"
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}

      {/* park / unpark */}
      <button
        type="button"
        title={pinned ? "Remove from parking lot" : "Park this item"}
        className={cn(
          "shrink-0 transition-colors",
          pinned
            ? "text-green-500 hover:text-green-400"
            : "text-muted-foreground hover:text-foreground",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onPinToggle();
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Car className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ── action-item card ─────────────────────────────────────────── */

function ActionItemCard({
  item,
  showStatus,
  onPriorityChange,
  onPinToggle,
  onEdit,
  dragHandle,
}: {
  item: ActionItem;
  showStatus: boolean;
  onPriorityChange: (id: string, priority: number | null) => void;
  onPinToggle: (id: string) => void;
  onEdit: (item: ActionItem) => void;
  dragHandle: DragHandleProps;
}) {
  const date = item.tdvsp_date
    ? new Date(item.tdvsp_date).toLocaleDateString()
    : null;
  const customer = item.tdvsp_customername;
  const priority =
    item.tdvsp_priority != null
      ? PRIORITY_LABELS[item.tdvsp_priority]
      : null;
  const status =
    item.tdvsp_taskstatus != null
      ? STATUS_LABELS[item.tdvsp_taskstatus]
      : null;
  const colorIdx = priorityToColorIndex(item.tdvsp_priority);
  const pinned = isItemPinned(item);

  const description = item.tdvsp_description;

  return (
    <div
      className={cn(
        "relative rounded-lg border border-border/40 dark:border-border/25 bg-card px-3.5 pt-3 pb-7 cursor-pointer",
        "shadow-sm hover:shadow-md transition-all duration-300",
        tileBgClass(colorIdx),
      )}
      style={{ backgroundImage: tileGradient(colorIdx) }}
      onClick={() => onEdit(item)}
    >
      <CardToolbar
        colorIdx={colorIdx}
        onPriorityChange={(idx) => onPriorityChange(item.tdvsp_actionitemid, COLOR_TO_PRIORITY[idx] ?? null)}
        pinned={pinned}
        onPinToggle={() => onPinToggle(item.tdvsp_actionitemid)}
        onEdit={() => onEdit(item)}
        dragHandle={dragHandle}
      />
      <div className="flex items-start gap-1.5">
        <Briefcase className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground/40" />
        <p className="text-xs font-medium leading-snug line-clamp-2">
          {item.tdvsp_name}
        </p>
      </div>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground/70 line-clamp-1 pl-[1.125rem]">
          {description}
        </p>
      )}
      {(date || customer) && (
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground/60 pl-[1.125rem]">
          {date && <span>{date}</span>}
          {date && customer && <span>·</span>}
          {customer && <span className="truncate">{customer}</span>}
        </div>
      )}
      {priority && (
        <span className={cn("absolute bottom-1.5 left-2 inline-flex items-center rounded-sm border px-1.5 py-px text-[10px] font-semibold", priorityPillClass(item.tdvsp_priority!))}>
          {priority}
        </span>
      )}
      {showStatus && status && (
        <span className={cn("absolute bottom-1.5 right-2 inline-flex items-center rounded-sm border px-1.5 py-px text-[10px] font-semibold", statusPillClass(item.tdvsp_taskstatus!))}>
          {status}
        </span>
      )}
    </div>
  );
}

/* ── project card ─────────────────────────────────────────────── */

function ProjectCard({
  project,
  onPriorityChange,
  onPinToggle,
  onEdit,
  dragHandle,
}: {
  project: Project;
  onPriorityChange: (id: string, priority: number | null) => void;
  onPinToggle: (id: string) => void;
  onEdit: (project: Project) => void;
  dragHandle: DragHandleProps;
}) {
  const colorIdx = priorityToColorIndex(project.tdvsp_priority);
  const priority =
    project.tdvsp_priority != null
      ? PRIORITY_LABELS[project.tdvsp_priority as keyof typeof PRIORITY_LABELS]
      : null;
  const pinned = isItemPinned(project);

  const description = project.tdvsp_description;

  return (
    <div
      className={cn(
        "relative rounded-lg border border-border/40 dark:border-border/25 bg-card px-3.5 pt-3 pb-7 cursor-pointer",
        "shadow-sm hover:shadow-md transition-all duration-300",
        tileBgClass(colorIdx),
      )}
      style={{ backgroundImage: tileGradient(colorIdx) }}
      onClick={() => onEdit(project)}
    >
      <CardToolbar
        colorIdx={colorIdx}
        onPriorityChange={(idx) => onPriorityChange(project.tdvsp_projectid, COLOR_TO_PRIORITY[idx] ?? null)}
        pinned={pinned}
        onPinToggle={() => onPinToggle(project.tdvsp_projectid)}
        onEdit={() => onEdit(project)}
        dragHandle={dragHandle}
      />
      <div className="flex items-start gap-1.5">
        <FolderKanban className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground/40" />
        <p className="text-xs font-medium leading-snug line-clamp-2">
          {project.tdvsp_name}
        </p>
      </div>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground/70 line-clamp-1 pl-[1.125rem]">
          {description}
        </p>
      )}
      {priority && (
        <span className={cn("absolute bottom-1.5 left-2 inline-flex items-center rounded-sm border px-1.5 py-px text-[10px] font-semibold", priorityPillClass(project.tdvsp_priority!))}>
          {priority}
        </span>
      )}
    </div>
  );
}

/* ── idea card ────────────────────────────────────────────────── */

function IdeaCard({
  idea,
  onPriorityChange,
  onPinToggle,
  onEdit,
  dragHandle,
}: {
  idea: Idea;
  onPriorityChange: (id: string, priority: number | null) => void;
  onPinToggle: (id: string) => void;
  onEdit: (idea: Idea) => void;
  dragHandle: DragHandleProps;
}) {
  const category =
    idea.tdvsp_category != null
      ? CATEGORY_LABELS[idea.tdvsp_category]
      : null;
  const priority = (idea as unknown as Record<string, number>).tdvsp_priority;
  const colorIdx = priorityToColorIndex(priority);
  const pinned = isItemPinned(idea);

  const description = idea.tdvsp_description;

  return (
    <div
      className={cn(
        "relative rounded-lg border border-border/40 dark:border-border/25 bg-card px-3.5 pt-3 pb-7 cursor-pointer",
        "shadow-sm hover:shadow-md transition-all duration-300",
        tileBgClass(colorIdx),
      )}
      style={{ backgroundImage: tileGradient(colorIdx) }}
      onClick={() => onEdit(idea)}
    >
      <CardToolbar
        colorIdx={colorIdx}
        onPriorityChange={(idx) => onPriorityChange(idea.tdvsp_ideaid, COLOR_TO_PRIORITY[idx] ?? null)}
        pinned={pinned}
        onPinToggle={() => onPinToggle(idea.tdvsp_ideaid)}
        onEdit={() => onEdit(idea)}
        dragHandle={dragHandle}
      />
      <div className="flex items-start gap-1.5">
        <Lightbulb className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground/40" />
        <p className="text-xs font-medium leading-snug line-clamp-2">
          {idea.tdvsp_name}
        </p>
      </div>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground/70 line-clamp-1 pl-[1.125rem]">
          {description}
        </p>
      )}
      {category && (
        <span className={cn("absolute bottom-1.5 left-2 inline-flex items-center rounded-sm border px-1.5 py-px text-[10px] font-semibold", categoryPillClass(idea.tdvsp_category!))}>
          {category}
        </span>
      )}
    </div>
  );
}

/* ── parking-lot card (mixed entity, shows type + X to unpin) ── */

type ParkingLotEntry = {
  kind: "action-item" | "project" | "idea" | "meeting-summary";
  id: string;
  sortId: string;
  name: string;
  label: string;
  colorIdx: number;
  onUnpin: () => void;
  onEdit: () => void;
};

const KIND_ICON: Record<ParkingLotEntry["kind"], typeof Briefcase> = {
  "action-item": Briefcase,
  project: FolderKanban,
  idea: Lightbulb,
  "meeting-summary": FileText,
};

function ParkingLotCard({ entry, dragHandle }: { entry: ParkingLotEntry; dragHandle: DragHandleProps }) {
  const KindIcon = KIND_ICON[entry.kind];

  return (
    <div
      className={cn(
        "relative rounded-lg border border-border/40 dark:border-border/25 bg-card px-3.5 py-3 cursor-pointer",
        "shadow-sm hover:shadow-md transition-all duration-300",
        tileBgClass(entry.colorIdx),
      )}
      style={{ backgroundImage: tileGradient(entry.colorIdx) }}
      onClick={() => entry.onEdit()}
    >
      {/* minimal toolbar: grip + unpin */}
      <div
        className={cn(
          "absolute -top-2.5 -right-2.5 z-10 flex items-center gap-1.5",
          "rounded-lg border border-border/50 bg-popover/90 backdrop-blur-xl px-2 py-1",
          "shadow-lg shadow-black/8 dark:shadow-black/25 opacity-0 group-hover:opacity-100 transition-all duration-200",
        )}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          {...dragHandle.attributes}
          {...dragHandle.listeners}
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="h-4 w-px bg-border/50 shrink-0" />
        <button
          type="button"
          title="Remove from parking lot"
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            entry.onUnpin();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex items-start gap-1.5">
        <KindIcon className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground/40" />
        <p className="text-xs font-medium leading-snug line-clamp-2">
          {entry.name}
        </p>
      </div>
    </div>
  );
}

/* ── sortable column ─────────────────────────────────────────── */

function SortableColumn({
  columnKey,
  title,
  icon: Icon,
  accent,
  ids,
  headerInline,
  isDropTarget,
  delay,
  children,
}: {
  columnKey: string;
  title?: string;
  icon: typeof Briefcase;
  accent: string;
  ids: string[];
  headerInline?: React.ReactNode;
  isDropTarget?: boolean;
  delay?: number;
  children: React.ReactNode;
}) {
  /* Make the card list a drop target so items can be dropped here even when empty */
  const { setNodeRef } = useDroppable({ id: `col-${columnKey}` });

  return (
    <div
      className={cn(
        "flex min-w-0 rounded-xl border bg-muted/20 dark:bg-muted/10 backdrop-blur-sm transition-all duration-300",
        isDropTarget
          ? "border-2 ring-2 ring-offset-1 scale-[1.01] shadow-xl"
          : "border-border/40 dark:border-border/25",
      )}
      style={{
        ...(isDropTarget ? { borderColor: accent, boxShadow: `0 0 24px ${accent}30, 0 0 48px ${accent}15` } : {}),
        ...(delay != null ? { animation: `dashRise 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both` } : {}),
      }}
    >
      {/* accent left bar */}
      <div className="w-[3px] shrink-0 rounded-l-xl transition-colors duration-300" style={{ background: accent }} />
      <div className="flex flex-col min-w-0 flex-1">
        {/* glass-morphism header */}
        <div className="sticky top-0 z-[5] px-4 py-3 bg-background/70 backdrop-blur-xl border-b border-border/20 dark:border-border/15 rounded-tr-xl">
          <div className="flex items-center gap-2">
            {/* accent vertical bar indicator */}
            <div className="w-1 h-5 rounded-full shrink-0" style={{ background: accent }} />
            {/* icon + overlapping count badge */}
            <div className="relative shrink-0 mr-1">
              <Icon className="h-5 w-5 transition-colors duration-200" style={{ color: accent }} />
              <span
                className="absolute -bottom-1.5 -right-2 inline-flex items-center justify-center min-w-[1rem] h-4 px-1 rounded-full text-[9px] font-bold tabular-nums border border-background transition-colors duration-200"
                style={{ background: accent, color: "#fff" }}
              >
                {ids.length}
              </span>
            </div>
            {title && (
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground truncate">
                {title}
              </h2>
            )}
            {headerInline}
          </div>
        </div>
        {/* sortable card list */}
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div ref={setNodeRef} className="flex-1 overflow-y-auto px-3 pt-2 pb-3 space-y-2.5">
            {children}
            {ids.length === 0 && (
              <div className="flex flex-col items-center py-10 text-muted-foreground/30">
                <Icon className="h-10 w-10 mb-3 opacity-40" style={{ color: accent }} />
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
                  No items
                </p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

/* ── edit dialog state ────────────────────────────────────────── */

type EditTarget =
  | { kind: "action-item"; item: ActionItem }
  | { kind: "project"; item: Project }
  | { kind: "idea"; item: Idea }
  | { kind: "meeting-summary"; item: MeetingSummary }
  | null;

/* ── main board dashboard ─────────────────────────────────────── */

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

  /* work column task-type filter */
  const [workFilter, setWorkFilter] = useState<number | null>(null);

  /* edit dialog state */
  const [editTarget, setEditTarget] = useState<EditTarget>(null);

  /* drag-over column highlight */
  const [overColumn, setOverColumn] = useState<string | null>(null);

  /* sort order state — seeded from localStorage on first render */
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

  /* priority handlers */
  const handleActionItemPriority = (id: string, priority: number | null) => {
    updateActionItem.mutate({ id, fields: { tdvsp_priority: priority } as never });
  };

  const handleProjectPriority = (id: string, priority: number | null) => {
    updateProject.mutate({ id, fields: { tdvsp_priority: priority } as never });
  };

  const handleIdeaPriority = (id: string, priority: number | null) => {
    updateIdea.mutate({ id, fields: { tdvsp_priority: priority } as never });
  };



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

  const isLoading = loadingItems || loadingProjects || loadingIdeas || loadingMeetings;

  /* ── build parking lot (all pinned items across entities) ──── */
  const parkingLotEntries: ParkingLotEntry[] = [];

  (actionItems ?? []).filter(isItemPinned).forEach((item) => {
    const taskType = (item.tdvsp_tasktype != null ? TASK_TYPE_LABELS[item.tdvsp_tasktype] : undefined) ?? "Task";
    parkingLotEntries.push({
      kind: "action-item",
      id: item.tdvsp_actionitemid,
      sortId: `ai-${item.tdvsp_actionitemid}`,
      name: item.tdvsp_name,
      label: taskType,
      colorIdx: priorityToColorIndex(item.tdvsp_priority),
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
      label: "Project",
      colorIdx: priorityToColorIndex(project.tdvsp_priority),
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
      label: "Idea",
      colorIdx: priorityToColorIndex(priority),
      onUnpin: () => handleIdeaPin(idea.tdvsp_ideaid),
      onEdit: () => setEditTarget({ kind: "idea", item: idea }),
    });
  });

  (meetingSummaries ?? []).filter(isItemPinned).forEach((ms) => {
    const priority = (ms as unknown as Record<string, number>).tdvsp_priority;
    parkingLotEntries.push({
      kind: "meeting-summary",
      id: ms.tdvsp_meetingsummaryid,
      sortId: `ms-${ms.tdvsp_meetingsummaryid}`,
      name: ms.tdvsp_name,
      label: "Meeting",
      colorIdx: priorityToColorIndex(priority),
      onUnpin: () => handleMeetingSummaryPin(ms.tdvsp_meetingsummaryid),
      onEdit: () => setEditTarget({ kind: "meeting-summary", item: ms }),
    });
  });

  const sortedParkingLot = applyOrder(
    parkingLotEntries,
    (e) => e.sortId,
    orders.parkingLot ?? [],
  );
  const parkingLotIds = sortedParkingLot.map((e) => e.sortId);

  /* ── build other columns ───────────────────────────────────── */
  const work = applyOrder(
    actionItems?.filter(
      (i) =>
        i.tdvsp_taskstatus !== COMPLETE &&
        (workFilter === null || i.tdvsp_tasktype === workFilter)
    ) ?? [],
    (i) => i.tdvsp_actionitemid,
    orders.work ?? [],
  );
  const projectList = applyOrder(
    projects ?? [],
    (p) => p.tdvsp_projectid,
    orders.projects ?? [],
  );
  const ideaList = applyOrder(
    ideas ?? [],
    (i) => i.tdvsp_ideaid,
    orders.ideas ?? [],
  );

  const workIds = work.map((i) => i.tdvsp_actionitemid);
  const projectIds = projectList.map((p) => p.tdvsp_projectid);
  const ideaIds = ideaList.map((i) => i.tdvsp_ideaid);

  /* ── top-level DnD ─────────────────────────────────────────── */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  /* Use pointerWithin first (precise for columns), fall back to closestCenter (for sortable reorder) */
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

  /* closestCenter for within-column reorder; pointerWithin column droppable for cross-column */
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const centerHits = closestCenter(args);
    if (centerHits.length > 0) {
      const activeCol = getColumnForId(String(args.active.id));
      const overCol = centerHits[0] ? getColumnForId(String(centerHits[0].id)) : null;
      // Same column → use closestCenter so cards can reorder
      if (activeCol && activeCol === overCol) return centerHits;
    }
    // Different column or no sortable hit → detect which column the pointer is in
    const pointerHits = pointerWithin(args);
    const colHit = pointerHits.find((h) => String(h.id).startsWith("col-"));
    if (colHit) return [colHit];
    return centerHits;
  }, [getColumnForId]);

  const handleBoardDragOver = (event: DragOverEvent) => {
    const overId = event.over ? String(event.over.id) : null;
    const col = overId ? getColumnForId(overId) : null;
    setOverColumn(col);
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

    /* ── same column → reorder ───────────────────────────── */
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

    /* ── cross-column: → parking lot = pin ───────────────── */
    if (dstCol === "parkingLot" && srcCol !== "parkingLot") {
      if (srcCol === "work") {
        updateActionItem.mutate({ id: activeId, fields: { tdvsp_pinned: true } as never });
      } else if (srcCol === "projects") {
        updateProject.mutate({ id: activeId, fields: { tdvsp_pinned: true } as never });
      } else if (srcCol === "ideas") {
        updateIdea.mutate({ id: activeId, fields: { tdvsp_pinned: true } as never });
      }
      return;
    }

    /* ── cross-column: parking lot → elsewhere = unpin ───── */
    if (srcCol === "parkingLot" && dstCol !== "parkingLot") {
      if (activeId.startsWith("ai-")) {
        updateActionItem.mutate({ id: activeId.slice(3), fields: { tdvsp_pinned: false } as never });
      } else if (activeId.startsWith("proj-")) {
        updateProject.mutate({ id: activeId.slice(5), fields: { tdvsp_pinned: false } as never });
      } else if (activeId.startsWith("idea-")) {
        updateIdea.mutate({ id: activeId.slice(5), fields: { tdvsp_pinned: false } as never });
      } else if (activeId.startsWith("ms-")) {
        updateMeetingSummary.mutate({ id: activeId.slice(3), fields: { tdvsp_pinned: false } as never });
      }
    }
  };

  if (itemsError) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 dark:bg-destructive/10 p-5 text-destructive">
        Failed to load board data: {itemsError.message}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/15">
            <Columns3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <Skeleton className="h-5 w-28 mb-1.5" />
            <Skeleton className="h-3 w-52" />
          </div>
        </div>
        <div className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-3 h-[calc(100vh-12rem)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/40 dark:border-border/25 bg-muted/20 dark:bg-muted/10 p-4">
              <Skeleton className="h-4 w-20 mb-1" />
              <div className="h-px bg-border/30 mb-4" />
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

  return (
    <>
      <style>{BOARD_ANIM_CSS}</style>
      <div className="space-y-5 h-full flex flex-col">
        {/* Header */}
        <div
          className="flex items-center gap-3 shrink-0"
          style={{ animation: "dashRise 0.55s cubic-bezier(0.16, 1, 0.3, 1) both" }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/15">
            <Columns3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">My Board</h1>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
              Kanban view across action items, projects &amp; ideas
            </p>
          </div>
        </div>

        {/* 4-column board — single DndContext for cross-column drag */}
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragOver={handleBoardDragOver}
          onDragEnd={handleBoardDragEnd}
          onDragCancel={() => setOverColumn(null)}
        >
        <div className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-3 flex-1 min-h-0">
          {/* Parking Lot */}
          <SortableColumn
            columnKey="parkingLot"
            title="parking lot"
            icon={Car}
            accent={ACCENT.parkingLot}
            ids={parkingLotIds}
            isDropTarget={overColumn === "parkingLot"}
            delay={60}
          >
            {sortedParkingLot.map((entry) => (
              <SortableCard key={entry.sortId} id={entry.sortId}>
                {(handle) => <ParkingLotCard entry={entry} dragHandle={handle} />}
              </SortableCard>
            ))}
          </SortableColumn>

          {/* Work — accent + icon shift with active filter */}
          <SortableColumn
            columnKey="work"
            title={workFilterConfig(workFilter).title}
            icon={workFilterConfig(workFilter).icon}
            accent={workFilterConfig(workFilter).accent}
            ids={workIds}
            isDropTarget={overColumn === "work"}
            delay={135}
            headerInline={
              <div className="ml-auto flex items-center gap-0.5">
                <button
                  type="button"
                  title="All"
                  className={cn(
                    "h-5 w-5 rounded-full text-[9px] font-bold leading-none transition-all duration-200",
                    workFilter === null
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  )}
                  onClick={() => setWorkFilter(null)}
                >
                  A
                </button>
                {WORK_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    title={f.label}
                    className={cn(
                      "h-5 w-5 rounded-full text-[9px] font-bold leading-none transition-all duration-200",
                      workFilter === f.key
                        ? "text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                    )}
                    style={workFilter === f.key ? { background: f.accent } : undefined}
                    onClick={() => setWorkFilter(f.key)}
                  >
                    {f.letter}
                  </button>
                ))}
              </div>
            }
          >
            {work.map((item) => (
              <SortableCard key={item.tdvsp_actionitemid} id={item.tdvsp_actionitemid}>
                {(handle) => (
                  <ActionItemCard
                    item={item}
                    showStatus={true}
                    onPriorityChange={handleActionItemPriority}
                    onPinToggle={handleActionItemPin}
                    onEdit={(ai) => setEditTarget({ kind: "action-item", item: ai })}
                    dragHandle={handle}
                  />
                )}
              </SortableCard>
            ))}
          </SortableColumn>

          {/* Projects */}
          <SortableColumn
            columnKey="projects"
            title="projects"
            icon={FolderKanban}
            accent={ACCENT.projects}
            ids={projectIds}
            isDropTarget={overColumn === "projects"}
            delay={210}
          >
            {projectList.map((project) => (
              <SortableCard key={project.tdvsp_projectid} id={project.tdvsp_projectid}>
                {(handle) => (
                  <ProjectCard
                    project={project}
                    onPriorityChange={handleProjectPriority}
                    onPinToggle={handleProjectPin}
                    onEdit={(p) => setEditTarget({ kind: "project", item: p })}
                    dragHandle={handle}
                  />
                )}
              </SortableCard>
            ))}
          </SortableColumn>

          {/* Ideas */}
          <SortableColumn
            columnKey="ideas"
            title="ideas"
            icon={Lightbulb}
            accent={ACCENT.ideas}
            ids={ideaIds}
            isDropTarget={overColumn === "ideas"}
            delay={285}
          >
            {ideaList.map((idea) => (
              <SortableCard key={idea.tdvsp_ideaid} id={idea.tdvsp_ideaid}>
                {(handle) => (
                  <IdeaCard
                    idea={idea}
                    onPriorityChange={handleIdeaPriority}
                    onPinToggle={handleIdeaPin}
                    onEdit={(i) => setEditTarget({ kind: "idea", item: i })}
                    dragHandle={handle}
                  />
                )}
              </SortableCard>
            ))}
          </SortableColumn>
        </div>
        </DndContext>

        {/* ── edit dialogs ─────────────────────────────────────── */}
        <ActionItemFormDialog
          open={editTarget?.kind === "action-item"}
          onOpenChange={(open) => { if (!open) setEditTarget(null); }}
          mode="edit"
          actionItem={editTarget?.kind === "action-item" ? editTarget.item : undefined}
        />
        <IdeaFormDialog
          open={editTarget?.kind === "idea"}
          onOpenChange={(open) => { if (!open) setEditTarget(null); }}
          mode="edit"
          idea={editTarget?.kind === "idea" ? editTarget.item : undefined}
        />
        <ProjectFormDialog
          open={editTarget?.kind === "project"}
          onOpenChange={(open) => { if (!open) setEditTarget(null); }}
          mode="edit"
          project={editTarget?.kind === "project" ? editTarget.item : undefined}
        />
        <MeetingSummaryFormDialog
          open={editTarget?.kind === "meeting-summary"}
          onOpenChange={(open) => { if (!open) setEditTarget(null); }}
          mode="edit"
          meetingSummary={editTarget?.kind === "meeting-summary" ? editTarget.item : undefined}
        />
      </div>
    </>
  );
}
