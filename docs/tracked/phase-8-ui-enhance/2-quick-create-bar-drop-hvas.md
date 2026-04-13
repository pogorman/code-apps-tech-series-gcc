# 2 Quick Create Bar / Drop HVAs — Tracked Notes

> Append with `/track name:2-quick-create-bar-drop-hvas`.

---

## 1. Vertical Sidebar + Quick Create Bar

**Date:** 2026-03-14

### Prompt

O'G placed a reference screenshot at `screenshots/style-ideas-for-nav.png` showing a different app's UI with two navigation zones: a left vertical sidebar (white background, grouped nav items with small-caps section headers, active item highlighted with a cyan left border) and a top horizontal "quick create" bar (colored pill buttons that launch a new-record form for each table). The instruction was:

> **"the top horizontal bar is a quick create bar and launches a new card for whichever table button is selected. the left vertical is navigation. lets move our nav to the vertical left and a quick create bar across the top. mimic the styles too with colors and the left style is different than the top."**

### What We Did

Replaced the horizontal top-nav tile layout with a two-part navigation system inspired by a reference screenshot:

1. **Left vertical sidebar** — white background, 208px wide, grouped nav items with small-caps section headers
2. **Top horizontal quick create bar** — "quick create" label + colored pill buttons that navigate to a route and auto-open the create dialog

### Layout Changes (`app-layout.tsx` — full rewrite)

**Sidebar:**
- Brand area at top: gradient icon + "Acct Mgmt" title
- Three nav groups with uppercase section headers (`core`, `activity`, `capture`):
  - _(no header)_: Dashboard
  - **core**: Accounts, Contacts
  - **activity**: Action Items, HVAs
  - **capture**: Meetings, Ideas
- Active item: 3px cyan left border (`#00BCF2`), blue text (`#0078D4`), subtle tinted background
- Inactive items: muted foreground, hover → muted bg
- Footer: "Power Platform" label

**Quick Create Bar:**
- Fixed at top of main content area, below sidebar brand line
- 6 colored pill buttons, each with pastel bg + matching icon/text color:
  | Button | Color | Route |
  |--------|-------|-------|
  | task | coral/red | `/action-items` |
  | idea | emerald | `/ideas` |
  | HVA | violet | `/hvas` |
  | account | teal | `/accounts` |
  | contact | blue | `/contacts` |
  | summary | pink | `/meeting-summaries` |

### Quick Create Store (`src/stores/quick-create-store.ts` — new)

- Zustand store with `target` (which entity), `open(target)`, and `clear()`
- Layout sets the target and navigates; the list component picks it up via `useEffect` and opens its create dialog
- If already on the target route, just opens the dialog (no navigation needed)

### List Component Updates (6 files)

All list components (`account-list`, `contact-list`, `action-item-list`, `hva-list`, `meeting-summary-list`, `idea-list`) received the same 3-line addition:
1. Import `useQuickCreateStore`
2. Subscribe to `target` and `clear`
3. `useEffect` — if target matches, `setCreateOpen(true)` then `clearQuickCreate()`

### Files Changed

| File | Change |
|------|--------|
| `src/stores/quick-create-store.ts` | **New** — Zustand store |
| `src/components/layout/app-layout.tsx` | **Rewritten** — sidebar + quick create bar |
| `src/components/accounts/account-list.tsx` | Added quick create subscription |
| `src/components/contacts/contact-list.tsx` | Added quick create subscription |
| `src/components/action-items/action-item-list.tsx` | Added quick create subscription |
| `src/components/hvas/hva-list.tsx` | Added quick create subscription |
| `src/components/meeting-summaries/meeting-summary-list.tsx` | Added quick create subscription |
| `src/components/ideas/idea-list.tsx` | Added quick create subscription |

### Build Status

TypeScript and Vite build both pass clean.

---

## 2. Remove HVAs

**Date:** 2026-03-14

### Prompt

> **"drop hvas all together"**

### How It Was Handled

Removed every non-generated HVA reference from the codebase. Generated/read-only files (`.power/`, `src/generated/`) were left untouched.

**Deleted:**
- `src/components/hvas/` — entire directory (index, list, form dialog, detail dialog, delete dialog)
- `src/hooks/use-hvas.ts` — CRUD hooks

**Edited:**
- `src/App.tsx` — removed `/hvas` route and `HvaList` import
- `src/components/layout/app-layout.tsx` — removed HVAs from sidebar nav (activity group) and quick create bar (violet pill), removed `Zap` icon import
- `src/stores/quick-create-store.ts` — removed `"hvas"` from `QuickCreateTarget` union type

**Left alone (read-only / generated):**
- `src/generated/services/Tdvsp_hvasService.ts`
- `src/generated/models/Tdvsp_hvasModel.ts`
- `.power/schemas/dataverse/hvas.Schema.json`
- `power.config.json`

Build passes clean after removal.
