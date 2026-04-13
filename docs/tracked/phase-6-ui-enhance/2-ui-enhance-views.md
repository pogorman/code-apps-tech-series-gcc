# Ui Enhance Views — Tracked Notes

> View-level UI polish for accounts, contacts, and action items. Append with `/track name:ui-enhance-views`.

---

## 1. View Updates — Icons, Column Widths & No-Wrap

**Date:** 2026-03-14

### Priority column no-wrap (Action Items)

- Added `whitespace-nowrap` to the Priority `<TableHead>` and `<TableCell>` in `action-item-list.tsx` so labels like "Top Priority" stay on one line

### Edit/Delete buttons → icon buttons (All three views)

- Replaced text "Edit" / "Delete" buttons with `Pencil` and `Trash2` Lucide icons across all three list views
- Changed `size="sm"` to `size="icon"` for compact square buttons
- Kept existing colors: black (default) for edit, `text-destructive` (red) for delete
- Files changed:
  - `src/components/action-items/action-item-list.tsx`
  - `src/components/accounts/account-list.tsx`
  - `src/components/contacts/contact-list.tsx`

### Account Name column width

- Set the Name column on the accounts view to `w-[39%]` to give account names more room
- File changed: `src/components/accounts/account-list.tsx`
