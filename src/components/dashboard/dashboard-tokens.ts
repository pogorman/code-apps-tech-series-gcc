import type { Tdvsp_actionitemsModel } from "@/generated";

export type ActionItem = Tdvsp_actionitemsModel.Tdvsp_actionitems;

/* ── Semantic colour maps ───────────────────────────────────────── */

export const STATUS_COLORS: Record<string, string> = {
  Recognized: "var(--dash-slate)",
  "In Progress": "var(--dash-blue)",
  "Pending Comms": "var(--dash-amber)",
  "On Hold": "var(--dash-red)",
  "Wrapping Up": "var(--dash-violet)",
  Complete: "var(--dash-green)",
};

export const PRIORITY_COLORS: Record<string, string> = {
  Low: "var(--dash-blue)",
  Med: "var(--dash-slate)",
  High: "var(--dash-amber)",
  "Top Priority": "var(--dash-red)",
};

export const TYPE_COLORS: Record<string, string> = {
  Work: "var(--dash-red)",
  Personal: "var(--dash-pink)",
  Learning: "var(--dash-amber)",
};

export const ACCOUNT_PALETTE = [
  "var(--dash-blue)",
  "var(--dash-green)",
  "var(--dash-amber)",
  "var(--dash-violet)",
  "var(--dash-red)",
  "var(--dash-slate)",
];

/* ── Drilldown state ────────────────────────────────────────────── */

export interface Drilldown {
  title: string;
  items: ActionItem[];
}

/* ── Computed stats shape ───────────────────────────────────────── */

export interface StatusDatum {
  label: string;
  count: number;
  color: string;
}

export interface PriorityDatum {
  label: string;
  count: number;
  color: string;
}

export interface TypeDatum {
  label: string;
  count: number;
  color: string;
}

export interface AccountDatum {
  name: string;
  count: number;
  color: string;
  statusBreakdown: { label: string; count: number; color: string }[];
}

export interface DashboardStats {
  total: number;
  complete: number;
  inProgress: number;
  urgent: number;
  topCount: number;
  highCount: number;
  completionRate: number;
  weekDelta: number;
  statusCounts: StatusDatum[];
  priorityCounts: PriorityDatum[];
  typeCounts: TypeDatum[];
  accountCounts: AccountDatum[];
}
