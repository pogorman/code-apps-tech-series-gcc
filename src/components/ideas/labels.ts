import type { Tdvsp_ideasModel } from "@/generated";

type Category = Tdvsp_ideasModel.Tdvsp_ideastdvsp_category;

/* ── Category ──────────────────────────────────────────────────── */

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

/** Shorter variant for pills where space is tight. */
export const CATEGORY_SHORT_LABELS: Record<Category, string> = {
  468510000: "Copilot Studio",
  468510001: "Canvas",
  468510002: "Model-Driven",
  468510003: "Power Automate",
  468510004: "Power Pages",
  468510005: "Azure",
  468510006: "AI General",
  468510007: "App General",
  468510008: "Other",
};

/** Dot color (solid) for category — used in CategoryStrip pills. */
export const CATEGORY_DOT: Record<Category, string> = {
  468510006: "var(--dash-red)",     // AI General
  468510005: "var(--dash-blue)",    // Azure
  468510000: "var(--dash-violet)",  // Copilot Studio
  468510001: "var(--dash-cyan)",    // Canvas Apps
  468510002: "var(--dash-indigo)",  // Model-Driven
  468510003: "var(--dash-amber)",   // Power Automate
  468510004: "var(--dash-pink)",    // Power Pages
  468510007: "var(--dash-green)",   // App General
  468510008: "var(--dash-slate)",   // Other
};

/** Badge tint { bg, color, border } for category group headers + gallery chips. */
export const CATEGORY_TINT: Record<Category, { bg: string; color: string; border: string }> = {
  468510006: { bg: "var(--dash-t-red)",    color: "#b91c1c", border: "#fecaca" },
  468510005: { bg: "var(--dash-t-blue)",   color: "#1d4ed8", border: "#bfdbfe" },
  468510000: { bg: "var(--dash-t-violet)", color: "#6d28d9", border: "#ddd6fe" },
  468510001: { bg: "var(--dash-t-cyan)",   color: "#0e7490", border: "#a5f3fc" },
  468510002: { bg: "var(--dash-t-indigo)", color: "#4338ca", border: "#c7d2fe" },
  468510003: { bg: "var(--dash-t-amber)",  color: "#b45309", border: "#fde68a" },
  468510004: { bg: "var(--dash-t-pink)",   color: "#be185d", border: "#fbcfe8" },
  468510007: { bg: "var(--dash-t-green)",  color: "#047857", border: "#a7f3d0" },
  468510008: { bg: "var(--dash-t-slate)",  color: "#475569", border: "#cbd5e1" },
};

/** Order used when grouping/rendering category sections (most → least common demo categories first). */
export const CATEGORY_ORDER: Category[] = [
  468510006, // AI General
  468510005, // Azure
  468510000, // Copilot Studio
  468510001, // Canvas Apps
  468510002, // Model-Driven Apps
  468510003, // Power Automate
  468510004, // Power Pages
  468510007, // App General
  468510008, // Other
];

export function categoryVariant(c: Category): "default" | "secondary" | "destructive" | "outline" {
  if (c === 468510005) return "default";
  if (c === 468510000) return "secondary";
  if (c === 468510006) return "destructive";
  return "outline";
}

export function categoryPillClass(c: number): string {
  if (c === 468510005) return "border-blue-400 text-blue-400";
  if (c === 468510000) return "border-violet-400 text-violet-400";
  if (c === 468510006) return "border-red-400 text-red-400";
  return "border-zinc-400 text-zinc-400";
}

/* ── Priority ──────────────────────────────────────────────────── */

export const IDEA_PRIORITY_LABELS: Record<number, string> = {
  468510001: "Eh",
  468510000: "Low",
  468510003: "High",
  468510002: "Top Priority",
};

export const IDEA_PRIORITY_SHORT: Record<number, string> = {
  468510001: "Eh",
  468510000: "Low",
  468510003: "High",
  468510002: "Top",
};

export const IDEA_PRIORITY_PILL: Record<number, { bg: string; color: string }> = {
  468510002: { bg: "var(--dash-t-red)",    color: "#b91c1c" },
  468510003: { bg: "var(--dash-t-amber)",  color: "#b45309" },
  468510000: { bg: "var(--dash-t-blue)",   color: "#1d4ed8" },
  468510001: { bg: "var(--dash-t-slate)",  color: "#475569" },
};

/** High-potential priority set (used by the saved view + filters). */
export const HIGH_POTENTIAL_PRIORITIES = new Set<number>([468510002, 468510003]);

export function ideaPriorityVariant(p: number): "default" | "secondary" | "destructive" | "outline" {
  if (p === 468510002) return "destructive";
  if (p === 468510003) return "default";
  if (p === 468510000) return "secondary";
  return "outline";
}

/* ── State (active vs archived) ──────────────────────────────── */

export const STATE_ACTIVE = 0;
export const STATE_ARCHIVED = 1;
