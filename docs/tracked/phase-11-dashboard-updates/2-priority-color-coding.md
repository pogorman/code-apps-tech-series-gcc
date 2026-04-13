# 2 Priority Color Coding — Tracked Notes

> Append with `/track name:2-priority-color-coding`.

---

## 1. Priority-Driven Tile Color-Coding — Full Implementation

**Date:** 2026-03-24

Implemented an 8-prompt sequence from `docs/inbox/SESSION-PROMPTS.md` that adds priority-driven color-coded tiles across the app. Below are the prompts, what each called for, and what was done.

---

### Prompt 1 — Tile Color-Coding

> "give me the ability to color code tiles, light blue, light orange, light red"

**What was done:** Created two new shared modules:
- `src/lib/tile-colors.ts` — priority-to-color mapping, color-to-priority mapping, background CSS classes, localStorage helpers for entities without a priority field.
- `src/components/ui/tile-color-dots.tsx` — reusable `TileColorDots` component that renders a row of colored dots in the top-right of a card on hover. Uses `group`/`group-hover` Tailwind pattern.

---

### Prompt 2 — Dashboard Tiles Too

> "perfect but need those on dashboard tiles too"

**What was done:** Added `TileColorDots` to all card types in `src/components/dashboard/board-dashboard.tsx`:
- `ActionItemCard` — priority-driven dots + background
- `AccountCard` — localStorage-driven dots + background
- `IdeaCard` — priority-driven dots + background

Each board card got `group relative` class and an absolutely positioned dot row in top-right.

---

### Prompt 3 — Scope Colors to Specific Entities

> "only ideas, projects, and action items need the colors. you can remove them from the other tables."

**What was done:** Color dots were only added to:
- **Action items** (entity list cards + board cards)
- **Ideas** (entity list cards + board cards)
- **Accounts/Projects** (entity list cards + board cards)

Contacts and meeting summaries do **not** have color dots.

---

### Prompt 4 — Add New Lookup and Choice Fields

> "need to add some new fields... idea now has project lookup to the projects table. it also has a priority (task priority choice list) and meeting summaries have a project lookup now too."

**What was done:**

**Ideas — new fields:**
- `tdvsp_priority` (choice field, same global choice list as action items: 468510000=Low, 468510001=Eh, 468510002=Top Priority, 468510003=High)
- `tdvsp_Project@odata.bind` → `/accounts(guid)` (lookup to accounts table, read via `_tdvsp_project_value`)
- Updated: `idea-form-dialog.tsx` (form data, submit handler, UI fields), `idea-detail-dialog.tsx` (display priority + project), `idea-list.tsx` (table column + card badge), `labels.ts` (added `IDEA_PRIORITY_LABELS` + `ideaPriorityVariant`)

**Meeting Summaries — new fields:**
- `tdvsp_Project@odata.bind` → `/accounts(guid)` (lookup to accounts table, read via `_tdvsp_project_value`)
- Updated: `meeting-summary-form-dialog.tsx` (form data, submit handler, Project dropdown), `meeting-summary-detail-dialog.tsx` (display project name)

---

### Prompt 5 — Sync Quick Create Forms with Entity Page Forms

> "the quick create forms need to match the other forms launched from the table views"

**What was done:** No separate work needed — quick create buttons in the top bar trigger the same form dialog components (`IdeaFormDialog`, `MeetingSummaryFormDialog`) via the `useQuickCreateStore`. Since prompt 4 already updated those dialogs, quick create automatically includes the new fields.

---

### Prompt 6 — Personal Page Colors

> "personal tasks need the colors too"

**What was done:** No separate work needed — "Personal" and "Work" are task type filters on the same action item entity. Since action items already got color dots in prompt 3, both Personal and Work action items are covered on the entity list and board.

---

### Prompt 7 — Expand the Color Spectrum

> "add 2 more dots in the color spectrum. an empty dot on the far left so i can reset it, and a darker red dot on the far right."

**What was done:** The `COLOR_DOTS` array in `src/lib/tile-colors.ts` was built with 5 dots from the start:

| Index | Color | Hex | Label |
|-------|-------|-----|-------|
| 0 | transparent (dashed border) | — | Clear |
| 1 | light blue | `#93c5fd` | Low |
| 2 | light orange | `#fdba74` | Eh |
| 3 | light red | `#fca5a5` | High |
| 4 | dark red | `#b91c1c` | Top Priority |

The clear dot renders as a hollow dashed circle.

---

### Prompt 8 — Color Dots = Priority (the big one)

> "those color dots should not only change the color of the tile, they should set the priority of the item... and when one is selected you should update the record w the appropriate priority immediately."

**What was done:**

**Priority-driven entities (action items, ideas):**
- Clicking a dot immediately calls `useUpdateActionItem` / `useUpdateIdea` mutation to PATCH `tdvsp_priority` in Dataverse
- Tile background color is derived from the item's `tdvsp_priority` value (not localStorage)
- TanStack Query invalidation refreshes the list after the PATCH

**localStorage entities (accounts/projects):**
- No priority field in Dataverse, so color is stored in localStorage with key `tile-color-account-{guid}`
- Component-level `useState` keeps the UI in sync

---

### Files Created

| File | Purpose |
|------|---------|
| `src/lib/tile-colors.ts` | Color constants, priority mapping, bg classes, localStorage helpers |
| `src/components/ui/tile-color-dots.tsx` | Reusable 5-dot color picker component |

### Files Modified

| File | Changes |
|------|---------|
| `src/components/action-items/action-item-list.tsx` | Added color dots + priority bg to card view |
| `src/components/ideas/idea-list.tsx` | Added color dots + priority bg to card view, priority column in table |
| `src/components/ideas/idea-form-dialog.tsx` | Added Priority + Project fields |
| `src/components/ideas/idea-detail-dialog.tsx` | Added Priority + Project display |
| `src/components/ideas/labels.ts` | Added `IDEA_PRIORITY_LABELS`, `ideaPriorityVariant` |
| `src/components/accounts/account-list.tsx` | Added localStorage color dots to card view via `AccountCardItem` |
| `src/components/meeting-summaries/meeting-summary-form-dialog.tsx` | Added Project field |
| `src/components/meeting-summaries/meeting-summary-detail-dialog.tsx` | Added Project display |
| `src/components/dashboard/board-dashboard.tsx` | Added color dots to all 3 card types (action items, accounts, ideas) |
