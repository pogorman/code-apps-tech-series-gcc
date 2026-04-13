# 3 Parking Lot & Pinned Column — Tracked Notes

> Append with `/track name:3-parking-lot-pinned-column`.

---

## 1. Parking Lot Column with Pin-to-Park Functionality

**Date:** 2026-03-26

Added a new "parking lot" column to the Board (Kanban) dashboard and a pin/unpin mechanism across all entity types. The user had already added `tdvsp_Pinned` (boolean/two-option) to the Dataverse tables for meeting summaries, action items, ideas, and projects.

---

### User Prompt

> i added tdvsp_Pinned to meeting summaries, action items, ideas and projects. we need to add another vertical column on the far left (to the left of work) called parking lot. you can see how this looks in the screenshot new-vertical-look. each card should have a pin/tack to the right of the dark red dot when hovering over it and when that pin is clicked, the item is updated so that it's pinned column is set to yes (1). pinned items should show up in the parking lot.

The user provided a screenshot (`screenshots/new-vertical-look.png`) showing the desired 4-column layout: parking lot | work | projects | ideas.

---

### What Was Done

**1. Screenshot analysis**

Read `screenshots/new-vertical-look.png` to understand the target layout:
- 4-column board with parking lot on the far left
- Parking lot cards show item name, entity type badge (e.g. "Task"), and an X button to unpin
- Cards in other columns gain a pin icon on hover, positioned to the right of the priority color dots
- Pinned items appear in parking lot AND remain in their original column

**2. Generated types gap**

The generated models in `src/generated/models/` don't include `tdvsp_pinned` (user added the column in Dataverse but hasn't re-run `pac code add-data-source`). Handled via:
- `isItemPinned()` helper that casts to `Record<string, unknown>` and checks for both `true` and `1` (covers Dataverse boolean vs. choice field edge case)
- Write mutations use `as never` cast (same pattern already used for priority updates)

**3. Board dashboard rewrite** (`src/components/dashboard/board-dashboard.tsx`)

Key changes:

| Area | Before | After |
|------|--------|-------|
| Grid | 3-column (`grid-cols-3`) | 4-column (`grid-cols-4`) |
| Columns | work, projects, ideas | parking lot, work, projects, ideas |
| Data sources | action items, projects, ideas | + meeting summaries |
| Card props | `onPriorityChange` | + `onPinToggle` |

**New components added to the file:**

- **`isItemPinned(item)`** — reads `tdvsp_pinned` from any entity record, returns boolean
- **`PinButton`** — hover-reveal pin icon; stays visible in red when item is pinned; click toggles pin state
- **`ParkingLotCard`** — simplified card for parking lot: name, entity type badge, X button to unpin
- **`ParkingLotEntry` type** — discriminated union across entity types with `kind`, `sortId` (prefixed to avoid ID collisions), `label`, and `onUnpin` callback

**Pin/unpin handlers:**

Four handlers (`handleActionItemPin`, `handleProjectPin`, `handleIdeaPin`, `handleMeetingSummaryPin`) that:
1. Find the item in the current query data
2. Toggle `tdvsp_pinned` (if currently pinned → unpin, else → pin)
3. Call the entity's existing update mutation

**Parking lot data assembly:**

Filters all pinned items from each entity type, maps them to `ParkingLotEntry` objects with prefixed sort IDs (`ai-`, `proj-`, `idea-`, `ms-`), and applies localStorage-based sort order (same pattern as other columns).

**4. Card modifications**

All three card components (`ActionItemCard`, `ProjectCard`, `IdeaCard`) updated:
- Added `onPinToggle` prop
- Wrapped `TileColorDots` + `PinButton` in a flex container positioned top-right
- Increased `pr-` padding on title text to `pr-14` to avoid overlap with dots + pin

**5. Loading skeleton** updated from 3 to 4 columns.

**6. Meeting summaries on the board** — imported `useMeetingSummaries` and `useUpdateMeetingSummary` hooks so pinned meeting summaries can appear in the parking lot (meeting summaries don't have their own column otherwise).

---

### Accent Colors

| Column | Color | Hex |
|--------|-------|-----|
| Parking Lot | Red | `#ef4444` |
| Work | Blue | `#378ADD` |
| Projects | Purple | `#8b5cf6` |
| Ideas | Amber | `#EF9F27` |

---

### Type-check result

`npx tsc --noEmit` — clean, no errors.
