# Phase 13 — UI Facelift: Dashboard, Board & Collapsible Sidebar

## What Changed

Three areas received a visual overhaul to create a cohesive "Precision Terminal" aesthetic across the app.

## Dashboard Redesign (`dashboard.tsx`)

- **KPI cards**: Left accent border (3px, colored per metric), subtle radial accent glow in top-right, icon in a tinted rounded badge that scales on hover, card lifts on hover with expanded shadow
- **Chart cards**: New `ChartCard` wrapper — gradient accent line fading along the top edge, colored vertical bar indicator before section titles, full-width separator below header
- **SVG donut**: Enlarged from 120px to 144px, thicker stroke (18px), background track ring for depth, bolder center number with uppercase "TOTAL" label
- **Bars**: Pill-shaped (rounded-full) with gradient fills, better hover highlight
- **Task types section**: Added segmented overview bar showing proportions at a glance, plus type-specific icons (Briefcase/House/BookOpen) with proper colors (red/blue/fuchsia matching the board)
- **Tooltips**: Frosted glass (`backdrop-blur-xl`, semi-transparent bg), refined typography
- **Animation**: All elements stagger in with `dashRise` keyframe (fade up + subtle scale), cascading from header through KPIs to chart cards
- **Bug fix**: `PRIORITY_COLORS` map had stale `Eh` key — updated to `Med` to match `labels.ts` rename
- **Added**: `TYPE_COLORS` and `TYPE_ICONS` maps for proper per-type visuals

## Board Redesign (`board-dashboard.tsx`)

- **Columns**: Staggered `dashRise` animation (60/135/210/285ms delays), lighter backgrounds, refined borders, smoother 300ms transitions. Drop target glow now double-layered for more dramatic effect
- **Column headers**: Vertical accent bar indicator added, upgraded to `backdrop-blur-xl`, title is uppercase with wide tracking
- **Cards**: Refined border opacity for dark mode, 300ms transitions, subtler entity icon opacity
- **CardToolbar**: `backdrop-blur-xl`, `rounded-lg`, better shadow treatment
- **Drag state**: Toned down from 1.5deg rotation to 1deg, 1.02 scale, `shadow-2xl`
- **Empty states**: Larger icon tinted with column accent, uppercase tracking text
- **Header**: Matches dashboard style — semibold tracking-tight title, uppercase subtitle

## Collapsible Sidebar (`app-layout.tsx`)

- **Toggle**: Floating chevron button on the sidebar's right edge, straddles the border
- **Collapsed width**: 56px (from 208px), smooth 300ms ease-in-out transition
- **Collapsed state**: Icons only, centered. Section labels become thin divider lines. Footer buttons show icons only. Hover tooltips appear to the right of nav icons
- **Persistence**: Collapsed/expanded state saved to `localStorage` key `sidebar-collapsed`
- **Active nav**: Uses background tint instead of left border when collapsed

## Content Padding Reduction

- Main content area: `p-8` (32px) reduced to `p-4` (16px)
- Quick create bar: `px-6 py-2` tightened to `px-4 py-1.5`
- Reclaims ~32px per side for board columns and dashboard cards

## Files Changed

- `src/components/dashboard/dashboard.tsx` — full visual redesign
- `src/components/dashboard/board-dashboard.tsx` — full visual redesign
- `src/components/layout/app-layout.tsx` — collapsible sidebar + padding reduction
