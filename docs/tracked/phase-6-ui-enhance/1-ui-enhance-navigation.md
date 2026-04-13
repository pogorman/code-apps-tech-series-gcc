# UI Enhance Navigation — Tracked Notes

> Phase 6 UI enhancements: navigation rework. Append with `/track name:ui-enhance-navigation`.

---

## 1. Navigation Rework — Sidebar to Top Tiles

**Date:** 2026-03-14

### Prompt 1

> i need more horizontal space, rework the navigation to be evenly spaced tiles across the top under the main title bar no more than maybe 125px tall.

**What was done:**

- Removed the 256px-wide dark sidebar entirely
- Split the old sidebar into two horizontal bands:
  - **Title bar** (`header`): 48px tall, dark gradient background, logo + "CRM Demo" left-aligned, "Power Platform" right-aligned
  - **Nav tiles** (`nav`): a `grid auto-cols-fr grid-flow-col` row of tiles, each with icon + label, max 100px tall
- Active tile gets `bg-[#0078D4]` with a blue glow shadow; inactive tiles are `bg-white/10`
- Full viewport width now available for content (`main` is no longer beside a sidebar)

### Prompt 2

> buttons should be 50% of the current height and squares aligned left. we'll add more later so blank space to the right of them is ok

**What was done:**

- Changed tiles from ~100px tall grid-stretch to fixed `h-[50px] w-[50px]` squares
- Switched nav from `grid auto-cols-fr` to `flex` so tiles left-align with natural blank space to the right
- Reduced icon to `h-5 w-5`, label to `text-[10px]`

### Prompt 3

> action items button text isnt centered and the icon is smashed against the top

**What was done:**

- Changed `w-[50px]` to `min-w-[50px]` so tiles can stretch for longer labels like "Action Items"
- Added `px-3` horizontal padding for breathing room
- Added `whitespace-nowrap` to prevent label wrapping that broke centering

### File Changed

- `src/components/layout/app-layout.tsx` — full rewrite of layout from sidebar to horizontal top-nav

---

## 2. Navigation Polish — Title, Tile Width & Spacing

**Date:** 2026-03-14

### Changes

- **Header title:** Renamed "CRM Demo" to "Account Management"
- **Tile width:** Changed from `min-w-[50px]` to a fixed `w-[100px]` so all three nav tiles (Accounts, Contacts, Action Items) are the same width
- **Tile vertical spacing:** Changed nav padding from `pb-3 pt-1` to `py-2` so spacing above and below the tiles is equal

### File Changed

- `src/components/layout/app-layout.tsx`
