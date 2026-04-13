/**
 * Priority ↔ color-dot mapping for tile color-coding.
 *
 * Entities WITH a priority field (action items, ideas):
 *   dot click → PATCH priority → background derived from priority value.
 *
 * Entities WITHOUT a priority field (accounts/projects):
 *   dot click → localStorage → background derived from stored color index.
 */

/* ── Dataverse priority choice keys ─────────────────────────────── */

export const PRIORITY_EH = 468510001;
export const PRIORITY_LOW = 468510000;
export const PRIORITY_HIGH = 468510003;
export const PRIORITY_TOP = 468510002;

/* ── Color-dot spectrum (left → right) ──────────────────────────── */

export const COLOR_DOTS = [
  { index: 0, hex: "transparent", ring: "#a1a1aa", label: "Clear" },
  { index: 1, hex: "#93c5fd", ring: "#93c5fd", label: "Low" },       // blue
  { index: 2, hex: "#fde047", ring: "#fde047", label: "Eh" },        // yellow
  { index: 3, hex: "#fb923c", ring: "#fb923c", label: "High" },      // orange
  { index: 4, hex: "#b91c1c", ring: "#b91c1c", label: "Top Priority" }, // dark red
] as const;

/* ── Color index ↔ priority mapping ─────────────────────────────── */

export const COLOR_TO_PRIORITY: Record<number, number | null> = {
  0: null,
  1: PRIORITY_LOW,
  2: PRIORITY_EH,
  3: PRIORITY_HIGH,
  4: PRIORITY_TOP,
};

export const PRIORITY_TO_COLOR: Record<number, number> = {
  [PRIORITY_LOW]: 1,
  [PRIORITY_EH]: 2,
  [PRIORITY_HIGH]: 3,
  [PRIORITY_TOP]: 4,
};

export function priorityToColorIndex(priority: number | null | undefined): number {
  if (priority == null) return 0;
  return PRIORITY_TO_COLOR[priority] ?? 0;
}

/* ── Tile background class from color index ─────────────────────── */

const BG_CLASSES: Record<number, string> = {
  0: "",
  1: "bg-blue-50 dark:bg-blue-950/40",
  2: "bg-yellow-50 dark:bg-yellow-950/40",
  3: "bg-orange-50 dark:bg-orange-950/40",
  4: "bg-red-100 dark:bg-red-950/60",
};

export function tileBgClass(colorIndex: number): string {
  return BG_CLASSES[colorIndex] ?? "";
}

/* ── Gradient backgrounds for board cards ──────────────────────────── */

const GRADIENT_STYLES: Record<number, string> = {
  0: "linear-gradient(to bottom, hsl(0 0% 100% / 0.7), hsl(0 0% 98% / 0.4))",
  1: "linear-gradient(to bottom, hsl(213 97% 87% / 0.35), hsl(213 97% 87% / 0.08))",
  2: "linear-gradient(to bottom, hsl(53 96% 64% / 0.3), hsl(53 96% 64% / 0.06))",
  3: "linear-gradient(to bottom, hsl(27 96% 61% / 0.3), hsl(27 96% 61% / 0.06))",
  4: "linear-gradient(to bottom, hsl(0 73% 41% / 0.2), hsl(0 73% 41% / 0.05))",
};

const DARK_GRADIENT_STYLES: Record<number, string> = {
  0: "linear-gradient(to bottom, hsl(222 20% 15% / 0.6), hsl(222 20% 13% / 0.3))",
  1: "linear-gradient(to bottom, hsl(213 80% 30% / 0.25), hsl(213 80% 30% / 0.06))",
  2: "linear-gradient(to bottom, hsl(53 80% 30% / 0.25), hsl(53 80% 30% / 0.06))",
  3: "linear-gradient(to bottom, hsl(27 80% 35% / 0.25), hsl(27 80% 35% / 0.06))",
  4: "linear-gradient(to bottom, hsl(0 73% 25% / 0.3), hsl(0 73% 25% / 0.08))",
};

const DEFAULT_GRADIENT = "linear-gradient(to bottom, hsl(0 0% 100% / 0.7), hsl(0 0% 98% / 0.4))";
const DEFAULT_DARK_GRADIENT = "linear-gradient(to bottom, hsl(222 20% 15% / 0.6), hsl(222 20% 13% / 0.3))";

export function tileGradient(colorIndex: number): string {
  const isDark = document.documentElement.classList.contains("dark");
  if (isDark) return DARK_GRADIENT_STYLES[colorIndex] ?? DEFAULT_DARK_GRADIENT;
  return GRADIENT_STYLES[colorIndex] ?? DEFAULT_GRADIENT;
}

/* ── localStorage helpers for entities without priority ──────────── */

const STORAGE_PREFIX = "tile-color-";

export function getTileColor(entity: string, id: string): number {
  try {
    const v = localStorage.getItem(`${STORAGE_PREFIX}${entity}-${id}`);
    return v ? Number(v) : 0;
  } catch {
    return 0;
  }
}

export function setTileColor(entity: string, id: string, colorIndex: number): void {
  try {
    if (colorIndex === 0) {
      localStorage.removeItem(`${STORAGE_PREFIX}${entity}-${id}`);
    } else {
      localStorage.setItem(`${STORAGE_PREFIX}${entity}-${id}`, String(colorIndex));
    }
  } catch {
    // localStorage unavailable
  }
}
