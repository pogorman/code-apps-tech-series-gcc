# Dashboard Tooltips & Drilldown Cards

> Hover tooltips and click-to-drill-down for all dashboard tiles. Append with `/track name:4-tool-tips-and-blowouts-for-dash`.

---

## Prompts

### Prompt 1
> all of the tiles on the dashboard should allow me to hover over them and see some data that makes up the visualization, but then click on them and have a card open that shows the data that makes up those vis's

### Prompt 2 (fix)
> the top row of cards, ie total items, completion rate, etc... when hovering the card that pops up goes out of view on the top

---

## 1. Dashboard Hover Tooltips & Drilldown Cards

**Date:** 2026-03-19

### Goal

Every tile on the dashboard (4 KPI cards + 4 chart cards with their sub-elements) should:
1. **Hover** — show a floating tooltip previewing the underlying data (count + first 4 item names)
2. **Click** — open a dialog card with a full table of the action items behind that visualization

### What Was Built

**New file:** `src/components/dashboard/drilldown-dialog.tsx`
- Reusable dialog (Radix Dialog via shadcn/ui) showing a filtered table of action items
- Columns: Name, Customer, Priority (badge), Status (badge), Date
- Sticky header, scrollable body (max 60vh), wide layout (`max-w-3xl`)
- Reuses `priorityVariant()` and `statusVariant()` from `src/components/action-items/labels.ts`

**Modified:** `src/components/dashboard/dashboard.tsx`

#### Tip Component
- Generic `Tip` wrapper using Tailwind `group-hover/tip` for tooltip visibility
- Props: `items`, `label`, `onClick`, `position` (`"above"` | `"below"`)
- Shows: item count, first 4 item names (truncated), "+N more", "Click to view details"
- Fade + scale transition (150ms)
- Keyboard accessible: `Enter`/`Space` triggers click, `role="button"`, `tabIndex={0}`

#### KPI Cards (4) — clickable as whole card
| Card | Drilldown Filter |
|------|-----------------|
| Total Items | All action items |
| Completion Rate | `tdvsp_taskstatus === 468510005` (Complete) |
| In Progress | `tdvsp_taskstatus === 468510001` |
| High / Top Priority | `tdvsp_priority === 468510002 \|\| 468510003` |

#### Chart Sub-Elements — each row/bar clickable individually
| Chart Card | Clickable Element | Filter |
|------------|-------------------|--------|
| Status Breakdown | Each `StatusRow` | Items matching that status |
| Priority Distribution | Each `HBar` | Items matching that priority |
| Work vs Personal | Each type row | Items matching that task type |
| Items by Account | Each `AccountRow` | Items matching `tdvsp_customername` |

#### Reverse Lookups
- Created `STATUS_KEY_BY_LABEL`, `PRIORITY_KEY_BY_LABEL`, `TYPE_KEY_BY_LABEL` maps to convert display labels back to numeric Dataverse choice keys for filtering

#### Hover Styling
- All clickable sub-elements (`StatusRow`, `HBar`, `AccountRow`, type rows) got `cursor-pointer` + `hover:bg-muted/60` transition
- KPI cards got `hover:shadow-md` transition

### Gotcha: Tooltip Positioning

KPI cards are near the top of the scrollable content area. Tooltips positioned above (`bottom-full`) clip off-screen. Fix: added `position` prop to `Tip` — KPI cards use `position="below"` (tooltip drops under the card), all chart sub-elements use default `position="above"`.

### State Management

Simple `useState<{ title: string; items: ActionItem[] } | null>` — no complex filter types. Each click handler computes the filtered array inline and passes it directly. Drilldown dialog renders when state is non-null.
