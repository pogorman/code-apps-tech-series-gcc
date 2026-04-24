import type { Tdvsp_meetingsummariesModel } from "@/generated";

type MeetingSummary = Tdvsp_meetingsummariesModel.Tdvsp_meetingsummaries;

export const STATE_ACTIVE = 0;
export const STATE_ARCHIVED = 1;

/* ── Pinned helpers ─────────────────────────────────────────── */

/** `tdvsp_pinned` is Yes/No in Dataverse but lands as either boolean true or numeric 1 at runtime. */
export function isPinned(item: MeetingSummary): boolean {
  const v = (item as unknown as Record<string, unknown>).tdvsp_pinned;
  return v === true || v === 1;
}

/* ── Account avatar palette (deterministic, matches Ideas page) ─ */

const AVATAR_COLORS = [
  { bg: "var(--dash-t-blue)",   color: "var(--dash-blue)" },
  { bg: "var(--dash-t-green)",  color: "var(--dash-green)" },
  { bg: "var(--dash-t-amber)",  color: "var(--dash-amber)" },
  { bg: "var(--dash-t-violet)", color: "var(--dash-violet)" },
  { bg: "var(--dash-t-pink)",   color: "var(--dash-pink)" },
  { bg: "var(--dash-t-cyan)",   color: "var(--dash-cyan)" },
];

export function accountAvatarColor(name: string): { bg: string; color: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

/* ── Date helpers ──────────────────────────────────────────── */

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function formatMonthDay(iso: string | null | undefined): { month: string; day: string } {
  if (!iso) return { month: "—", day: "—" };
  const d = new Date(iso);
  return { month: MONTHS[d.getMonth()]!, day: String(d.getDate()) };
}

export function relativeWhen(iso: string | null | undefined): { label: string; isToday: boolean; isFuture: boolean } {
  if (!iso) return { label: "—", isToday: false, isFuture: false };
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const d = new Date(iso);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((day - today) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return { label: "today", isToday: true, isFuture: false };
  if (diffDays === 1) return { label: "tomorrow", isToday: false, isFuture: true };
  if (diffDays === -1) return { label: "yesterday", isToday: false, isFuture: false };
  if (diffDays > 0 && diffDays < 7) return { label: `in ${diffDays}d`, isToday: false, isFuture: true };
  if (diffDays < 0 && diffDays > -7) return { label: `${Math.abs(diffDays)}d ago`, isToday: false, isFuture: false };
  if (diffDays >= 7 && diffDays < 30) return { label: `in ${Math.ceil(diffDays / 7)}w`, isToday: false, isFuture: true };
  if (diffDays <= -7 && diffDays > -30) return { label: `${Math.ceil(Math.abs(diffDays) / 7)}w ago`, isToday: false, isFuture: false };
  if (diffDays >= 30) return { label: `in ${Math.ceil(diffDays / 30)}mo`, isToday: false, isFuture: true };
  return { label: `${Math.ceil(Math.abs(diffDays) / 30)}mo ago`, isToday: false, isFuture: false };
}

export function isDatePast(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const d = new Date(iso);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return day < today;
}
