import type { Tdvsp_ideasModel } from "@/generated";

type Category = Tdvsp_ideasModel.Tdvsp_ideastdvsp_category;

export const CATEGORY_LABELS: Record<Category, string> = {
  468510000: "Copilot Studio",
  468510001: "Canvas Apps",
  468510002: "Model-Driven Apps",
  468510003: "Power Automate",
  468510004: "Power Pages",
  468510005: "Azure",
  468510006: "AI General",
  468510007: "App General",
  468510008: "Other",
};

export function categoryVariant(c: Category): "default" | "secondary" | "destructive" | "outline" {
  if (c === 468510005) return "default";       // Azure
  if (c === 468510000) return "secondary";     // Copilot Studio
  if (c === 468510006) return "destructive";   // AI General
  return "outline";
}

export function categoryPillClass(c: number): string {
  if (c === 468510005) return "border-blue-400 text-blue-400";       // Azure
  if (c === 468510000) return "border-violet-400 text-violet-400";   // Copilot Studio
  if (c === 468510006) return "border-red-400 text-red-400";         // AI General
  return "border-zinc-400 text-zinc-400";
}

/* ── Priority (same global choice list as action items) ──────────── */

export const IDEA_PRIORITY_LABELS: Record<number, string> = {
  468510001: "Eh",
  468510000: "Low",
  468510003: "High",
  468510002: "Top Priority",
};

export function ideaPriorityVariant(p: number): "default" | "secondary" | "destructive" | "outline" {
  if (p === 468510002) return "destructive";
  if (p === 468510003) return "default";
  if (p === 468510000) return "secondary";
  return "outline";
}
