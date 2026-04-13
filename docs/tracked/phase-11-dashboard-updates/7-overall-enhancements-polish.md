# 7 Overall Enhancements & Polish — Tracked Notes

> Append with `/track name:7-overall-enhancements-polish`.

---

## 1. Outline-Style Priority/Status Pills on Board Cards

**Date:** 2026-03-26

### User Prompt

> check out the status and priority pill screenshot...that's how those should look and get rid of the hover capability for switching the type with the little icons you put in there

### What Was Done

**New pill class functions** in `labels.ts`:

- `priorityPillClass(p)` — returns semantic `border-<color> text-<color>` for each priority value (red for Top Priority, orange for High, zinc for Eh, blue for Low)
- `statusPillClass(s)` — returns semantic colors per status (blue for In Progress, amber for Pending Comms, emerald for Wrapping Up, green for Complete, zinc for others)
- `categoryPillClass(c)` added to `ideas/labels.ts` (violet for Copilot Studio, blue for Azure, red for AI General)

**Card pill layout** changed to match screenshot:
- Priority pill on the left, status pill on the right (`justify-between`)
- Outline style: colored border + colored text on transparent background
- Replaced shadcn `Badge` component with raw `<span>` elements using the pill classes

**Removed hover task-type selector** — the per-card Work/Personal/Learning icon buttons that appeared on hover were removed from `ActionItemCard`. The `onTaskTypeChange` prop and `handleTaskTypeChange` handler were also cleaned up.

---

## 2. Pills Positioned in Card Corners

**Date:** 2026-03-26

### User Prompt

> not quite, they need to sit lower and tighter in their respective corners and they need to have less corner radius.

### What Was Done

- Pills changed from flow layout to **absolute positioning**: `absolute bottom-1.5 left-2` (priority) and `absolute bottom-1.5 right-2` (status)
- Border radius reduced from `rounded-full` to `rounded-sm`
- Padding tightened from `px-2 py-0.5` to `px-1.5 py-px`
- Card containers changed from `py-3` to `pt-3 pb-7` to reserve space for the absolute-positioned pills
- Same treatment applied to ProjectCard (priority bottom-left) and IdeaCard (category bottom-left)
- Divider line (`border-t border-border/30`) removed — pills float independently

---

## 3. Board Renamed to My Board

**Date:** 2026-03-26

### User Prompt

> change board to my board

### What Was Done

- Sidebar nav label: "Board" → "My Board"
- Loading state heading: "Board" → "My Board"
- Main heading: "Board" → "My Board"

---

## 4. Left Nav Capture Group Reorder + Project Quick Create

**Date:** 2026-03-26

### User Prompt

> left nav capture group should be ideas, meetings, projects... and we need to add a quick create for project in bt meeting and account

### What Was Done

- Capture nav order changed: Ideas, Meetings, Projects (was Meetings, Ideas, Projects)
- Added project quick create button (violet, `FolderKanban` icon) between meeting and account

Quick create final order: work, personal, learning, idea, meeting, **project**, account, contact

---

## 5. Colored Left Nav Icons

**Date:** 2026-03-26

### User Prompt

> let's make the left nav colored like the quick creates

### What Was Done

- Added optional `color` field to `NavItem` interface
- Each nav item gets an inline `style={{ color }}` on its icon
- Color mapping: Action Items (#ef4444 red), Ideas (#059669 emerald), Meetings (#ec4899 pink), Projects (#7c3aed violet), Accounts (#0d9488 teal), Contacts (#0ea5e9 sky)
- Dashboard and My Board left uncolored (inherit default)

---

## 6. Smaller Card Title Text

**Date:** 2026-03-26

### User Prompt

> the code on the cards is too big

> not the icons, the header text

### What Was Done

- Card title text changed from `text-sm` to `text-xs` across all card types (ActionItemCard, ProjectCard, IdeaCard, ParkingLotCard)

---

## 7. Smaller Card Icons + Remove Parking Lot Type Labels

**Date:** 2026-03-26

### User Prompt

> the code on the cards is too big. and i don't need those labels for type on the parking lot cards

### What Was Done

- Entity type icons on cards shrunk from `h-3.5 w-3.5` to `h-3 w-3`, gap reduced from `gap-2` to `gap-1.5`, opacity from `/60` to `/50`
- Description indent adjusted from `pl-[1.375rem]` to `pl-[1.125rem]` to match
- Parking lot cards: removed the type label badge (`<Badge variant="secondary">{entry.label}</Badge>`) and its divider entirely
- `Badge` import removed from board-dashboard (no longer used)
