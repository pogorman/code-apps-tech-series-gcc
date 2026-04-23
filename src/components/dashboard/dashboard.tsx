import { useMemo, useState } from "react";
import { useActionItems } from "@/hooks/use-action-items";
import { useAccounts } from "@/hooks/use-accounts";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_TYPE_LABELS,
} from "@/components/action-items/labels";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard } from "lucide-react";
import { DrilldownDialog } from "./drilldown-dialog";
import type {
  ActionItem,
  Drilldown,
  DashboardStats,
} from "./dashboard-tokens";
import {
  STATUS_COLORS,
  PRIORITY_COLORS,
  TYPE_COLORS,
  ACCOUNT_PALETTE,
} from "./dashboard-tokens";
import { PageHeader } from "./page-header";
import { FocusStrip } from "./focus-strip";
import { KpiGrid } from "./kpi-card";
import { StatusBreakdown } from "./status-breakdown";
import { PriorityDistribution } from "./priority-distribution";
import { TaskTypes } from "./task-types";
import { ItemsByAccount } from "./items-by-account";

/* ── Reverse lookups (label → numeric key) ──────────────────────── */

const STATUS_KEY_BY_LABEL = Object.fromEntries(
  Object.entries(STATUS_LABELS).map(([k, v]) => [v, Number(k)])
) as Record<string, number>;

const PRIORITY_KEY_BY_LABEL = Object.fromEntries(
  Object.entries(PRIORITY_LABELS).map(([k, v]) => [v, Number(k)])
) as Record<string, number>;

const TYPE_KEY_BY_LABEL = Object.fromEntries(
  Object.entries(TASK_TYPE_LABELS).map(([k, v]) => [v, Number(k)])
) as Record<string, number>;

/* ── Main Dashboard ─────────────────────────────────────────────── */

export function Dashboard() {
  const { data: items, isLoading, error } = useActionItems();
  const { data: accounts } = useAccounts();
  const [drilldown, setDrilldown] = useState<Drilldown | null>(null);

  const openDrilldown = (title: string, filtered: ActionItem[]) =>
    setDrilldown({ title, items: filtered });

  /* ── Compute stats ───────────────────────────────────────────── */

  const stats = useMemo<DashboardStats | null>(() => {
    if (!items) return null;

    const total = items.length;
    const complete = items.filter(
      (i) => i.tdvsp_taskstatus === 468510005
    ).length;
    const inProgress = items.filter(
      (i) => i.tdvsp_taskstatus === 468510001
    ).length;
    const topCount = items.filter(
      (i) => i.tdvsp_priority === 468510002
    ).length;
    const highCount = items.filter(
      (i) => i.tdvsp_priority === 468510003
    ).length;
    const urgent = topCount + highCount;
    const completionRate =
      total > 0 ? Math.round((complete / total) * 100) : 0;

    // Week-over-week delta
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const weekDelta = items.filter((i) => {
      const created = (i as unknown as Record<string, string>).createdon;
      return created ? new Date(created) >= startOfWeek : false;
    }).length;

    // Status breakdown
    const statusCounts = Object.entries(STATUS_LABELS)
      .map(([key, label]) => {
        const count = items.filter(
          (i) => i.tdvsp_taskstatus === Number(key)
        ).length;
        return {
          label,
          count,
          color: STATUS_COLORS[label] ?? "var(--dash-slate)",
        };
      })
      .filter((s) => s.count > 0);

    // Priority breakdown
    const priorityCounts = Object.entries(PRIORITY_LABELS)
      .map(([key, label]) => {
        const count = items.filter(
          (i) => i.tdvsp_priority === Number(key)
        ).length;
        return {
          label,
          count,
          color: PRIORITY_COLORS[label] ?? "var(--dash-slate)",
        };
      })
      .filter((p) => p.count > 0);

    // Type breakdown
    const typeCounts = Object.entries(TASK_TYPE_LABELS)
      .map(([key, label]) => {
        const count = items.filter(
          (i) => i.tdvsp_tasktype === Number(key)
        ).length;
        return {
          label,
          count,
          color: TYPE_COLORS[label] ?? "var(--dash-slate)",
        };
      })
      .filter((t) => t.count > 0);

    // Items per account with status breakdown
    const accountMap = new Map<string, string>();
    accounts?.forEach((a) => accountMap.set(a.accountid, a.name));

    const accountBuckets = new Map<
      string,
      { total: number; statuses: Map<string, number> }
    >();
    for (const item of items) {
      const custId = (item as unknown as Record<string, string>)
        ._tdvsp_customer_value;
      if (!custId) continue;
      const name =
        item.tdvsp_customername ?? accountMap.get(custId) ?? "Unknown";
      if (!accountBuckets.has(name)) {
        accountBuckets.set(name, { total: 0, statuses: new Map() });
      }
      const bucket = accountBuckets.get(name)!;
      bucket.total++;
      const statusLabel =
        item.tdvsp_taskstatus != null
          ? STATUS_LABELS[item.tdvsp_taskstatus] ?? "Unknown"
          : "Unknown";
      bucket.statuses.set(
        statusLabel,
        (bucket.statuses.get(statusLabel) ?? 0) + 1
      );
    }

    const accountCounts = [...accountBuckets.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, bucket], i) => ({
        name,
        count: bucket.total,
        color: ACCOUNT_PALETTE[i % ACCOUNT_PALETTE.length] ?? "var(--dash-slate)",
        statusBreakdown: [...bucket.statuses.entries()].map(
          ([label, count]) => ({
            label,
            count,
            color: STATUS_COLORS[label] ?? "var(--dash-slate)",
          })
        ),
      }));

    return {
      total,
      complete,
      inProgress,
      urgent,
      topCount,
      highCount,
      completionRate,
      weekDelta,
      statusCounts,
      priorityCounts,
      typeCounts,
      accountCounts,
    };
  }, [items, accounts]);

  /* ── Filter helpers ──────────────────────────────────────────── */

  const filterByStatus = (label: string) =>
    items?.filter(
      (i) => i.tdvsp_taskstatus === STATUS_KEY_BY_LABEL[label]
    ) ?? [];

  const filterByPriority = (label: string) =>
    items?.filter(
      (i) => i.tdvsp_priority === PRIORITY_KEY_BY_LABEL[label]
    ) ?? [];

  const filterByType = (label: string) =>
    items?.filter(
      (i) => i.tdvsp_tasktype === TYPE_KEY_BY_LABEL[label]
    ) ?? [];

  const filterByAccount = (name: string) =>
    items?.filter((i) => {
      const n = i.tdvsp_customername ?? "Unknown";
      return n === name;
    }) ?? [];

  /* ── Error state ─────────────────────────────────────────────── */

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 dark:bg-destructive/10 p-5 text-destructive">
        Failed to load dashboard data: {error.message}
      </div>
    );
  }

  /* ── Loading state ───────────────────────────────────────────── */

  if (isLoading || !stats) {
    return (
      <div className="space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg"
            style={{ background: "var(--dash-t-violet)" }}
          >
            <LayoutDashboard className="h-4 w-4" style={{ color: "var(--dash-violet)" }} />
          </div>
          <div>
            <Skeleton className="h-4 w-28 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[10px] p-3.5"
              style={{
                background: "var(--dash-surface)",
                border: "1px solid var(--dash-border)",
              }}
            >
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-8 w-14 mb-2" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
        <div className="grid gap-2.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[10px] p-4"
              style={{
                background: "var(--dash-surface)",
                border: "1px solid var(--dash-border)",
              }}
            >
              <Skeleton className="h-3 w-32 mb-5" />
              <Skeleton className="h-[180px] w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const allItems = items ?? [];

  /* ── Render ──────────────────────────────────────────────────── */

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "-0.005em" }}>
      <PageHeader />

      <FocusStrip
        items={allItems}
        onItemClick={(item) =>
          openDrilldown("Focus Item", [item])
        }
      />

      <KpiGrid
        stats={stats}
        allItems={allItems}
        onDrilldown={openDrilldown}
      />

      {/* Row 1: Status + Priority */}
      <div className="grid gap-2.5 mb-2.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <StatusBreakdown
          statusCounts={stats.statusCounts}
          weekDelta={stats.weekDelta}
          onStatusClick={(label) =>
            openDrilldown(`Status: ${label}`, filterByStatus(label))
          }
        />
        <PriorityDistribution
          priorityCounts={stats.priorityCounts}
          total={stats.total}
          urgent={stats.urgent}
          onPriorityClick={(label) =>
            openDrilldown(`Priority: ${label}`, filterByPriority(label))
          }
        />
      </div>

      {/* Row 2: Task Types + Items by Account */}
      <div className="grid gap-2.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <TaskTypes
          typeCounts={stats.typeCounts}
          total={stats.total}
          onTypeClick={(label) =>
            openDrilldown(`Type: ${label}`, filterByType(label))
          }
        />
        <ItemsByAccount
          accountCounts={stats.accountCounts}
          onAccountClick={(name) =>
            openDrilldown(`Account: ${name}`, filterByAccount(name))
          }
        />
      </div>

      {/* Drilldown dialog */}
      <DrilldownDialog
        open={drilldown !== null}
        onOpenChange={(open) => {
          if (!open) setDrilldown(null);
        }}
        title={drilldown?.title ?? ""}
        items={drilldown?.items ?? []}
      />
    </div>
  );
}
