# 4 Drag-Drop to Parking Lot, Hover Menu & Colors — Tracked Notes

> Append with `/track name:4-ddrop-to-lot-hover-menu-colors`.

---

## 1. Parking Lot Green Accent + Car Icon, Work Column Type Filter

**Date:** 2026-03-26

### User Prompt

> parking lot should have green accents and use a car for an icon. work column should have a filter for work, personal, and learning and when selected the card should update to that type

### What Was Done

**Parking lot styling:**
- Accent color changed from `#ef4444` (red) to `#22c55e` (green)
- Column header icon changed from `Pin` to `Car` (lucide-react)

**Work column task-type filter:**
- Added filter pill buttons in the column header: **All | Work | Personal | Learning**
- Clicking a pill filters the column to that task type; "All" shows all non-recognized/non-complete items
- Removed the hard-coded `TASK_TYPE_WORK` filter — column now shows all types by default
- Added task type constants: `TASK_TYPE_PERSONAL = 468510000`, `TASK_TYPE_WORK = 468510001`, `TASK_TYPE_LEARNING = 468510002`

**Per-card task type selector:**
- Each action item card in the work column shows three small pill buttons (Work | Personal | Learning) on hover
- Clicking a pill updates the card's `tdvsp_tasktype` in Dataverse
- Active type is highlighted with `bg-primary`

**Column header refactor:**
- `SortableColumn` gained a `headerExtra` prop for injecting content below the title row

---

## 2. Parking Lot Cards Reflect Priority Colors

**Date:** 2026-03-26

### User Prompt

> when items are moved to the parking lot, the card should still reflect the color of the card based on status

### What Was Done

- Added `colorIdx` field to `ParkingLotEntry` type
- Each entity populates `colorIdx` via `priorityToColorIndex()` when building parking lot entries
- `ParkingLotCard` applies `tileBgClass(entry.colorIdx)` for the same blue/orange/red/dark-red backgrounds as source columns

---

## 3. Vertical Color Dots (Attempted & Reverted)

**Date:** 2026-03-26

### User Prompt

> let's have the pin still at the top right, but then the color coded dots going down the right border from least prio to highest

### What Was Done

- Added `vertical` prop to `TileColorDots` component
- Restructured all card layouts: pin at top-right absolute, color dots in a vertical column along the right edge
- Cards got `pr-8` right padding to accommodate the vertical strip

### User Feedback

> that looks awful

Reverted immediately. The vertical dots approach was scrapped.

---

## 4. Floating Card Toolbar (Hover Popover)

**Date:** 2026-03-26

### User Prompt

> when you hover over an item, a pop up kind of hovers above the card but can span from the top right of the card off the right border of the card so that it's split half over the card and half not. it can have a border and fill color, then it can have the following from left to right, 3 vertical dots for dragging dropping, then the status dots, then an edit pencil which loads the edit window for the record, then the pin.

### What Was Done

**New `CardToolbar` component** — floating popover at `-top-3 right-1` with `bg-popover`, `border-border`, `shadow-lg`. Contents L→R:

| Element | Purpose |
|---------|---------|
| `GripVertical` | Drag handle (only this element triggers drag via `useSortable` listeners) |
| Separator | Visual divider |
| `TileColorDots` | Horizontal priority dots with `!opacity-100` override |
| Separator | Visual divider |
| `Pencil` | Opens entity's form dialog in edit mode |
| `Pin` | Pin/unpin to parking lot (green when pinned) |

**Drag handle isolation:**
- `SortableCard` changed from `children: ReactNode` to `children: (handle: DragHandleProps) => ReactNode` (render prop)
- Only the `GripVertical` icon receives `attributes`/`listeners` from `useSortable`
- Rest of card is not draggable — toolbar buttons work without triggering drag

**Edit dialogs on the board:**
- Imported `ActionItemFormDialog`, `IdeaFormDialog`, `MeetingSummaryFormDialog`
- Added `EditTarget` discriminated union state
- Pencil click sets `editTarget`, opening the appropriate form dialog
- Projects had no form dialog at this point — pencil omitted

**`TileColorDots` reverted** back to original horizontal-only component (removed `vertical` prop). The `opacity-0 group-hover:opacity-100` transition was restored for list views; the toolbar overrides with `!opacity-100`.

**Parking lot cards** got a simpler toolbar: just `GripVertical` + `X` (unpin).

---

## 5. Cross-Column Drag-Drop to Parking Lot

**Date:** 2026-03-26

### User Prompt

> give me the ability to drag drop to the parking lot. this should also set the pinned column on the record

### What Was Done

**Architecture change: single top-level `DndContext`**

Before: each column had its own `DndContext` (within-column reorder only).
After: one `DndContext` wraps all four columns. Each column registers as a `useDroppable` zone.

**`SortableColumn` changes:**
- Removed per-column `DndContext`, sensors, and `handleDragEnd`
- Removed `onReorder` prop
- Added `useDroppable({ id: \`col-\${columnKey}\` })` on the card list container

**Top-level `handleBoardDragEnd`:**

| Scenario | Behavior |
|----------|----------|
| Same column | Reorder via `arrayMove` + localStorage |
| Any column → parking lot | `PATCH tdvsp_pinned: true` on the record |
| Parking lot → any column | `PATCH tdvsp_pinned: false` (unpin) |

**ID-to-column lookup:**
- Built `Set` lookups for work/project/idea IDs
- Parking lot IDs detected by prefix (`ai-`, `proj-`, `idea-`, `ms-`)
- Column droppable zones detected by `col-` prefix

---

## 6. Accent Bar: Left Side Instead of Bottom

**Date:** 2026-03-26

### User Prompt

> have that colored line for each vertical card going down the left hand side not across the bottom

### What Was Done

- Changed `SortableColumn` layout from `flex-col` to `flex` (horizontal)
- Accent bar moved from `h-[3px]` bottom strip to `w-[3px]` left strip with `rounded-l-xl`
- Column content wrapped in a nested `flex-col flex-1 min-w-0` div

---

## 7. Full Projects CRUD + Nav + Quick Create + Board Pencil

**Date:** 2026-03-26

### User Prompt

> projects need left nav menu, quick create button, and yeah all forms

### What Was Done

**New files** (`src/components/projects/`):

| File | Purpose |
|------|---------|
| `labels.ts` | `PROJECT_PRIORITY_LABELS` + `projectPriorityVariant()` |
| `project-form-dialog.tsx` | Create/edit dialog — name, description, priority, account |
| `project-detail-dialog.tsx` | Read-only detail view with Edit button |
| `project-delete-dialog.tsx` | Confirmation alert dialog |
| `project-list.tsx` | Table/card toggle, search, color-coded tiles, quick-create support |
| `index.ts` | Barrel exports |

**Updated files:**

| File | Change |
|------|--------|
| `stores/quick-create-store.ts` | Added `"projects"` to `QuickCreateTarget` union |
| `components/layout/app-layout.tsx` | Added `FolderKanban` import; Projects in sidebar nav (capture section); violet quick-create pill |
| `App.tsx` | Added `/projects` route + `ProjectList` import |
| `board-dashboard.tsx` | Imported `ProjectFormDialog`; added `"project"` to `EditTarget`; `ProjectCard` now accepts `onEdit` and shows pencil in toolbar; renders `ProjectFormDialog` for edit |
