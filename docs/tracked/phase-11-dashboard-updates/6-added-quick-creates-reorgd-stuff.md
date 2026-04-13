# 6 Added Quick Creates & Reorg'd Stuff — Tracked Notes

> Append with `/track name:6-added-quick-creates-reorgd-stuff`.

---

## 1. Quick Create Reorder, Task-Type Presets & Nav Reorg

**Date:** 2026-03-26

### User Prompt

> quick creates should be in this order. work (action item with type already set to work), personal (action item with type already set to personal), learning (action item w type already set to learning), idea, meeting (change from summary to meeting), account, contact. left nav should have activity group first, then capture, then core

### What Was Done

**Quick create bar — new order with task-type presets:**

| # | Label | Entity | Icon | Preset | Color |
|---|-------|--------|------|--------|-------|
| 1 | work | action-items | `Briefcase` | `taskType: 468510001` | red |
| 2 | personal | action-items | `House` | `taskType: 468510000` | blue |
| 3 | learning | action-items | `BookOpen` | `taskType: 468510002` | fuchsia |
| 4 | idea | ideas | `Lightbulb` | — | emerald |
| 5 | meeting | meeting-summaries | `FileText` | — | pink |
| 6 | account | accounts | `Building2` | — | teal |
| 7 | contact | contacts | `Users` | — | sky |

- Old single "task" button split into 3 type-specific buttons (work/personal/learning)
- "summary" renamed to "meeting"
- Button key changed from `btn.target` to `` `${btn.target}-${btn.label}` `` since multiple buttons share the `action-items` target

**Quick-create store payload mechanism:**

New `payload` field added to `useQuickCreateStore`:

```typescript
export type QuickCreatePayload = Record<string, unknown> | null;

interface QuickCreateState {
  target: QuickCreateTarget;
  payload: QuickCreatePayload;
  open: (target, payload?) => void;
  clear: () => void;  // resets both target and payload
}
```

- `QuickCreateButton` gained optional `payload` field
- `handleQuickCreate()` passes `btn.payload` to `openQuickCreate()`
- `ActionItemList` reads `quickPayload?.taskType` and passes it to `ActionItemFormDialog` as `defaultTaskType`
- `ActionItemFormDialog` gained `defaultTaskType?: number` prop — merges into `EMPTY_FORM` on create-mode open

**Build fix:** default parameter `payload = null` didn't satisfy `Record<string, unknown> | undefined`. Changed to `(target, payload) => set({ target, payload: payload ?? null })`.

**Left nav reorder:**

| Position | Section |
|----------|---------|
| 1 | *(unnamed)* — Dashboard, Board |
| 2 | activity — Action Items |
| 3 | capture — Meetings, Ideas, Projects |
| 4 | core — Accounts, Contacts |

Previously: core was 2nd, activity 3rd. Now activity leads, core is last.

### Files Changed

| File | Change |
|------|--------|
| `stores/quick-create-store.ts` | Added `payload` field + `QuickCreatePayload` type |
| `components/layout/app-layout.tsx` | Reordered quick-create buttons, added payload + icons (`House`, `BookOpen`, `Briefcase`), renamed "summary" → "meeting", reordered nav sections, unique button keys |
| `components/action-items/action-item-form-dialog.tsx` | Added `defaultTaskType` prop, applied to form state on create-mode open |
| `components/action-items/action-item-list.tsx` | Reads `quickPayload` from store, passes `createTaskType` to form dialog, clears on close |
