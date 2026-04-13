# Ui Enhance Dashboard First Cut — Tracked Notes

> Append with `/track name:ui-enhance-dashboard-first-cut`.

---

## 1. Dashboard Home Page — First Cut

**Date:** 2026-03-14

### Prompt

> "any kind of dashboard you can think of that would allow us to use chart js and have it as our home page with some kpis or something around our action items?"

### What Was Done

**Packages installed:**
- `chart.js` (exact version) — charting library
- `react-chartjs-2` (exact version) — React wrapper for Chart.js

**Files created:**
- `src/components/dashboard/dashboard.tsx` — main dashboard component
- `src/components/dashboard/index.ts` — barrel export

**Files modified:**
- `src/App.tsx` — added `/` route pointing to `<Dashboard />`, changed catch-all redirect from `/accounts` to `/`
- `src/components/layout/app-layout.tsx` — added "Dashboard" as the first nav tile with `LayoutDashboard` icon, added `end` prop to the `/` NavLink so it doesn't stay active on sub-routes

### Dashboard Layout

**4 KPI cards (top row):**

| KPI | Source | Icon |
|-----|--------|------|
| Total Items | `items.length` | ClipboardCheck |
| Completion Rate | `complete / total * 100` (%) | TrendingUp |
| In Progress | status === 468510001 | Clock |
| High / Top Priority | priority === 468510002 or 468510003 | AlertTriangle |

**4 Chart.js charts (2×2 grid):**

| Chart | Type | Data Source |
|-------|------|-------------|
| Status Breakdown | Doughnut | `STATUS_LABELS` keys grouped by count |
| Priority Distribution | Bar (vertical) | `PRIORITY_LABELS` keys grouped by count |
| Work vs Personal | Pie | `TASK_TYPE_LABELS` keys grouped by count |
| Items by Account | Bar (horizontal) | `_tdvsp_customer_value` resolved via `tdvsp_customername` or `useAccounts()` fallback |

### Implementation Details

- Registered Chart.js modules: `ArcElement`, `BarElement`, `CategoryScale`, `LinearScale`, `Tooltip`, `Legend`
- Used existing hooks: `useActionItems()` for action item data, `useAccounts()` for account name resolution
- Reused existing label maps from `src/components/action-items/labels.ts` — no duplication
- Color palettes are hardcoded maps matching the status/priority labels to hex colors
- Skeleton loading state mirrors the final layout (4 card skeletons + 4 chart skeletons)
- Account chart height is dynamic: `Math.max(280, accountLabels.length * 40 + 60)` to avoid cramped bars
- Customer ID extraction uses the same `_tdvsp_customer_value` runtime field pattern as the action item list

### Routing Changes

- `/` → Dashboard (was previously a redirect to `/accounts`)
- `*` catch-all → redirects to `/` (was `/accounts`)
- Dashboard nav tile is first in the nav bar, uses `end` prop for exact-match active state
