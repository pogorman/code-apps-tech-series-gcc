import type { Tdvsp_actionitemsModel } from "@/generated";

type Priority = Tdvsp_actionitemsModel.Tdvsp_actionitemstdvsp_priority;
type TaskStatus = Tdvsp_actionitemsModel.Tdvsp_actionitemstdvsp_taskstatus;

export const PRIORITY_LABELS: Record<Priority, string> = {
  468510001: "Med",
  468510000: "Low",
  468510003: "High",
  468510002: "Top Priority",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  468510000: "Recognized",
  468510001: "In Progress",
  468510002: "Pending Comms",
  468510003: "On Hold",
  468510004: "Wrapping Up",
  468510005: "Complete",
};

export const TASK_TYPE_LABELS: Record<number, string> = {
  468510000: "Personal",
  468510001: "Work",
  468510002: "Learning",
};

export function priorityVariant(p: Priority): "default" | "secondary" | "destructive" | "outline" {
  if (p === 468510002) return "destructive";
  if (p === 468510003) return "default";
  if (p === 468510000) return "secondary";
  return "outline";
}

export function statusVariant(s: TaskStatus): "default" | "secondary" | "destructive" | "outline" {
  if (s === 468510005) return "default";
  if (s === 468510001) return "secondary";
  return "outline";
}

/* ── Semantic pill colors (outline style for board cards) ──────── */

const PRIORITY_PILL: Record<Priority, string> = {
  468510002: "border-red-400 text-red-400",        // Top Priority
  468510003: "border-orange-400 text-orange-400",   // High
  468510001: "border-yellow-400 text-yellow-400",     // Med
  468510000: "border-blue-400 text-blue-400",       // Low
};

const STATUS_PILL: Record<TaskStatus, string> = {
  468510000: "border-zinc-400 text-zinc-400",       // Recognized
  468510001: "border-blue-400 text-blue-400",       // In Progress
  468510002: "border-amber-400 text-amber-400",     // Pending Comms
  468510003: "border-zinc-400 text-zinc-400",       // On Hold
  468510004: "border-emerald-400 text-emerald-400", // Wrapping Up
  468510005: "border-green-400 text-green-400",     // Complete
};

export function priorityPillClass(p: number): string {
  return PRIORITY_PILL[p as Priority] ?? "border-zinc-400 text-zinc-400";
}

export function statusPillClass(s: number): string {
  return STATUS_PILL[s as TaskStatus] ?? "border-zinc-400 text-zinc-400";
}
