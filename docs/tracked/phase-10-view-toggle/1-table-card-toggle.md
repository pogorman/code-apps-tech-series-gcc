# Phase 10 — Table/Card View Toggle + CommandPalette Fix

> Table and card view modes for all entity lists, plus a critical HashRouter fix. Append with `/track name:1-table-card-toggle`.

---

## Prompts

_(Prompts from this session were not captured — reconstructed from git history.)_

### Prompt 1 (approximate)
> Add a table/card view toggle to all entity list pages so users can switch between a dense table view and a card-based grid view.

### Prompt 2 (approximate)
> The app is showing a white screen after loading. Fix it.

---

## 1. CommandPalette HashRouter Fix

**Date:** 2026-03-22
**Commit:** `8eeb1e4`

### Problem

The app crashed to a white screen on load. `CommandPalette` uses `useNavigate()` from react-router-dom, which requires a `<Router>` ancestor. It was rendered **outside** `<HashRouter>` in `App.tsx`, so the entire React tree unmounted.

### Fix

Moved `<CommandPalette />` from outside `<HashRouter>` to inside it (but outside `<Routes>`), so it has access to the router context while remaining globally mounted.

**Modified:** `src/App.tsx` — single line move

### Lesson

Any component using router hooks (`useNavigate`, `useLocation`, `useParams`) must be a descendant of the Router provider. This is easy to miss with globally-mounted components like command palettes or modals.

---

## 2. Table/Card View Toggle

**Date:** 2026-03-23
**Commit:** `effb8c9`

### Goal

Give every entity list page a toggle between dense table view and visual card view. Persist the user's preference per entity.

### What Was Built

**New file:** `src/hooks/use-view-preference.ts`
- Custom hook wrapping `localStorage` for per-entity view mode persistence
- `ViewMode` type: `"table" | "card"`
- Storage key pattern: `view-mode-{entity}`
- Defaults to `"table"` if no preference stored

**New file:** `src/components/ui/view-toggle.tsx`
- Toggle button group using Lucide `List` and `LayoutGrid` icons
- Uses shadcn `Button` with `secondary`/`ghost` variants for active state
- Accessible `aria-label` on each button

**Modified entity lists (all five):**
- `src/components/accounts/account-list.tsx`
- `src/components/contacts/contact-list.tsx`
- `src/components/action-items/action-item-list.tsx`
- `src/components/meeting-summaries/meeting-summary-list.tsx`
- `src/components/ideas/idea-list.tsx`

Each list was refactored to:
1. Import `useViewPreference` and `ViewToggle`
2. Add the toggle in the page header next to the "New" button
3. Conditionally render either a `<table>` or a responsive card grid
4. Card view uses a CSS grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) with shadcn `Card` components
5. Cards show the same data as table rows — name/title as header, metadata as description items
6. Both views wire up the same click handler to open the detail dialog

### Key Decisions

- **localStorage over Zustand** — view preference is UI chrome, not app state. No need to put it in the global store or sync across tabs.
- **Per-entity persistence** — switching accounts to cards doesn't force contacts to cards.
- **Table as default** — denser, more information at a glance; cards are the "browse" option.
- **No animation** — instant swap keeps the demo snappy and avoids layout shift.

### Stats

- 856 lines added, 402 removed across 14 files (including doc updates)
- Zero new dependencies

---

## Build Notes

- Both features built and deployed in a single session
- TypeScript strict compilation passed cleanly
- Production build succeeds — no new chunk size warnings beyond existing 578 KB bundle
