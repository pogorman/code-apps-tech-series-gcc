/**
 * Shared constants, types, and config for the board sub-components.
 */

import {
  BookOpen,
  Briefcase,
  Car,
  CheckSquare,
  FileText,
  FolderKanban,
  House,
  LayoutGrid,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import type { Tdvsp_actionitemsModel } from "@/generated";
import type { Tdvsp_ideasModel } from "@/generated";
import type { Tdvsp_projectsModel } from "@/generated";
import type { Tdvsp_meetingsummariesModel } from "@/generated";

/* ── Entity type aliases ─────────────────────────────────────── */

export type ActionItem = Tdvsp_actionitemsModel.Tdvsp_actionitems;
export type Idea = Tdvsp_ideasModel.Tdvsp_ideas;
export type Project = Tdvsp_projectsModel.Tdvsp_projects;
export type MeetingSummary = Tdvsp_meetingsummariesModel.Tdvsp_meetingsummaries;

/* ── Status / priority constants ─────────────────────────────── */

export const STATUS_COMPLETE = 468510005;
export const STATUS_RECOGNIZED = 468510000;

export const TASK_TYPE_PERSONAL = 468510000;
export const TASK_TYPE_WORK = 468510001;
export const TASK_TYPE_LEARNING = 468510002;

export const PRIORITY_LOW = 468510000;
export const PRIORITY_MED = 468510001;
export const PRIORITY_TOP = 468510002;
export const PRIORITY_HIGH = 468510003;

/* ── Column accent colours ───────────────────────────────────── */

export const COLUMN_COLORS = {
  parkingLot: "#22c55e",
  work: "#64748b",
  projects: "#8b5cf6",
  ideas: "#ec4899",
} as const;

/* ── WIP limits ──────────────────────────────────────────────── */

export const WIP_LIMITS: Record<string, number | null> = {
  parkingLot: 8,
  work: 10,
  projects: 6,
  ideas: null,
};

/* ── Priority rail colours ───────────────────────────────────── */

export const PRIORITY_RAIL_COLORS: Record<number, string> = {
  [PRIORITY_TOP]: "var(--dash-red)",
  [PRIORITY_HIGH]: "var(--dash-amber)",
  [PRIORITY_MED]: "var(--dash-slate)",
  [PRIORITY_LOW]: "var(--dash-blue)",
};

/* ── Task type icon config (for cards) ───────────────────────── */

export const TASK_TYPE_ICON_CONFIG: Record<number, { icon: LucideIcon; bg: string; color: string }> = {
  [TASK_TYPE_WORK]: { icon: Briefcase, bg: "var(--dash-t-red)", color: "var(--dash-red)" },
  [TASK_TYPE_PERSONAL]: { icon: House, bg: "var(--dash-t-pink)", color: "var(--dash-pink)" },
  [TASK_TYPE_LEARNING]: { icon: BookOpen, bg: "var(--dash-t-violet)", color: "var(--dash-violet)" },
};

/* ── Entity icon config (parking lot / mixed) ────────────────── */

export const ENTITY_ICON_CONFIG: Record<string, { icon: LucideIcon; bg: string; color: string }> = {
  "action-item": { icon: CheckSquare, bg: "var(--dash-t-slate)", color: "var(--dash-slate)" },
  project: { icon: FolderKanban, bg: "var(--dash-t-blue)", color: "var(--dash-blue)" },
  idea: { icon: Lightbulb, bg: "var(--dash-t-amber)", color: "var(--dash-amber)" },
  "meeting-summary": { icon: FileText, bg: "var(--dash-t-cyan)", color: "var(--dash-cyan)" },
};

/* ── Column icons ────────────────────────────────────────────── */

export const COLUMN_ICONS = {
  parkingLot: Car,
  work: CheckSquare,
  projects: FolderKanban,
  ideas: Lightbulb,
} as const;

/* ── Pill inline styles (priority + status) ──────────────────── */

export const PRIORITY_PILL_STYLES: Record<number, { bg: string; color: string }> = {
  [PRIORITY_TOP]: { bg: "var(--dash-t-red)", color: "#b91c1c" },
  [PRIORITY_HIGH]: { bg: "var(--dash-t-amber)", color: "#b45309" },
  [PRIORITY_MED]: { bg: "var(--dash-t-slate)", color: "#475569" },
  [PRIORITY_LOW]: { bg: "var(--dash-t-blue)", color: "#1d4ed8" },
};

export const STATUS_PILL_STYLES: Record<number, { bg: string; color: string }> = {
  468510000: { bg: "var(--dash-t-slate)", color: "#475569" },   // Recognized
  468510001: { bg: "var(--dash-t-blue)", color: "#1d4ed8" },    // In Progress
  468510002: { bg: "var(--dash-t-amber)", color: "#b45309" },   // Pending Comms
  468510003: { bg: "var(--dash-t-red)", color: "#b91c1c" },     // On Hold
  468510004: { bg: "var(--dash-t-violet)", color: "#6d28d9" },  // Wrapping Up
  [STATUS_COMPLETE]: { bg: "var(--dash-t-green)", color: "#047857" },
};

/* ── Work column filter tabs ─────────────────────────────────── */

export const WORK_FILTERS = [
  { key: TASK_TYPE_WORK, letter: "W", label: "Work", accent: "#ef4444", icon: Briefcase },
  { key: TASK_TYPE_PERSONAL, letter: "P", label: "Personal", accent: "#3b82f6", icon: House },
  { key: TASK_TYPE_LEARNING, letter: "L", label: "Learning", accent: "#d946ef", icon: BookOpen },
] as const;

export const WORK_ALL_ACCENT = "#6b7280";
export const WORK_ALL_ICON = LayoutGrid;

export function workFilterConfig(filter: number | null) {
  const match = WORK_FILTERS.find((f) => f.key === filter);
  return {
    accent: match?.accent ?? WORK_ALL_ACCENT,
    icon: match?.icon ?? WORK_ALL_ICON,
    title: match?.label.toLowerCase() ?? "all",
  };
}

/* ── Edit dialog discriminated union ─────────────────────────── */

export type EditTarget =
  | { kind: "action-item"; item: ActionItem }
  | { kind: "project"; item: Project }
  | { kind: "idea"; item: Idea }
  | { kind: "meeting-summary"; item: MeetingSummary }
  | null;

/* ── Parking lot entry type ──────────────────────────────────── */

export type ParkingLotEntry = {
  kind: "action-item" | "project" | "idea" | "meeting-summary";
  id: string;
  sortId: string;
  name: string;
  description?: string;
  priority?: number | null;
  taskType?: number | null;
  modifiedOn?: string | null;
  onUnpin: () => void;
  onEdit: () => void;
};

/* ── Normalized card data shape ──────────────────────────────── */

export interface CardConfig {
  id: string;
  kind: "action-item" | "project" | "idea" | "meeting-summary";
  title: string;
  description?: string;
  priority?: number | null;
  status?: number | null;
  category?: number | null;
  taskType?: number | null;
  date?: string | null;
  customerName?: string | null;
  modifiedOn?: string | null;
  isPinned: boolean;
  onEdit: () => void;
  onPinToggle: () => void;
}
