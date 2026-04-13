# 1 New Dash All Css — Tracked Notes

> Append with `/track name:1-new-dash-all-css`.

---

## 1. Drop Chart.js — Pure CSS/SVG Dashboard

**Date:** 2026-03-14

### Prompt

O'G had placed an example HTML file at `examples/crm_dashboard_v2.html` — a self-contained CRM dashboard that uses mostly CSS for visualizations (horizontal bars, progress rows, KPI cards with accent stripes) and only a single Chart.js `<canvas>` for a donut. He asked Claude to review the example versus the current `react-chartjs-2` dashboard and assess feasibility of switching. After confirming it was doable, the instruction was:

> **"drop chart js entirely and build it"**

### What Was Done

1. **Analyzed both implementations side-by-side:**
   - `examples/crm_dashboard_v2.html` — HTML/CSS/vanilla JS, Chart.js only for a donut, everything else is styled `<div>` bars
   - `src/components/dashboard/dashboard.tsx` — React component using `react-chartjs-2` with `Doughnut`, `Bar`, and `Pie` components, registering 6 Chart.js modules

2. **Rewrote `dashboard.tsx` from scratch** with zero chart library dependencies:
   - **SVG Donut (`SvgDonut`)** — replaced Chart.js `Doughnut` with an SVG using `<circle>` elements and `stroke-dasharray`/`stroke-dashoffset` for arc segments, center label showing total
   - **Status Breakdown (`StatusRow`)** — donut + side list of status rows with mini CSS progress bars (matching the example's layout)
   - **Priority Distribution (`HBar`)** — CSS horizontal bars with value labels rendered inside the fill, color-coded per priority level
   - **Work vs Personal** — simple bar comparison with percentage labels (replaced the Pie chart)
   - **Items by Account (`AccountRow`)** — thin CSS bars sorted by count, matching the example's `.account-bar-fill` pattern
   - **KPI Cards** — colored accent stripe at the bottom (matching example's `.kpi-accent` style)

3. **Removed dependencies:**
   ```bash
   npm uninstall chart.js react-chartjs-2
   ```
   This removed 3 packages from the bundle.

4. **Fixed a TypeScript strict-mode error** — array index access on `ACCOUNT_PALETTE` could return `undefined`, added `?? "#888780"` fallback.

5. **Verified clean build** — `npm run build` succeeded, bundle size dropped.

### Key Design Decisions

| Decision | Rationale |
|---|---|
| SVG donut instead of canvas | No external dependency, animates via CSS transitions, works in any React render cycle |
| CSS `width` transitions on bars | Smooth 0.4s cubic-bezier animations matching the example, no JS animation frame loops |
| Kept same data computation logic | `useMemo` with same Dataverse field lookups, same `_tdvsp_customer_value` pattern |
| Sorted accounts by count descending | Better visual hierarchy in the bar list |
| Color palette as const array | Cycles through 6 brand colors for accounts, deterministic assignment |

### Files Changed

- `src/components/dashboard/dashboard.tsx` — full rewrite (383 → ~510 lines)
- `package.json` / `package-lock.json` — removed `chart.js` and `react-chartjs-2`
