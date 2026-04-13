# First Cut Action Items — Tracked Notes

> Phase 5: Adding the `tdvsp_actionitem` Dataverse table with full CRUD. Append with `/track name:first-cut-action-items`.

---

## 1. Action Items — Full CRUD Implementation

**Date:** 2026-03-14

### Prompt

> contacts and accounts are good for now, let's implement the tdvsp_actionitem table w full crud

### What Claude Did

**Step 1 — Add the data source**

Ran `pac code add-data-source -a dataverse -t tdvsp_actionitem` to generate the model and service files under `src/generated/`.

The generated model (`Tdvsp_actionitemsModel.ts`) revealed these key fields:

| Field | Type | Notes |
|-------|------|-------|
| `tdvsp_name` | string (required) | Action item title |
| `tdvsp_description` | string | Free-text body |
| `tdvsp_date` | string (date) | Due/target date |
| `tdvsp_priority` | choice | Eh, Low, High, Top Priority |
| `tdvsp_taskstatus` | choice | Recognized, In Progress, Pending Comms, On Hold, Wrapping Up, Complete |
| `tdvsp_tasktype` | choice | Personal, Work |
| `tdvsp_Customer@odata.bind` | OData bind (write) | Customer lookup → account |
| `_tdvsp_customer_value` | string (read) | Runtime GUID for the customer lookup |
| `tdvsp_customername` | string (read) | Runtime display name |
| `statecode` / `statuscode` | enum | Active / Inactive |

**Step 2 — Create the hook**

`src/hooks/use-action-items.ts` — follows the exact same TanStack Query pattern as accounts/contacts:
- `useActionItems(options?)` — list with optional filter/orderBy
- `useActionItem(id)` — single record
- `useCreateActionItem()` — create mutation, invalidates action-items key
- `useUpdateActionItem()` — update mutation
- `useDeleteActionItem()` — delete mutation

**Step 3 — Create the components**

All under `src/components/action-items/`:

| File | Purpose |
|------|---------|
| `labels.ts` | Human-readable labels for Priority, Status, Type choice fields + badge variant helpers |
| `action-item-list.tsx` | Table view with search, customer lookup, priority/status badges, date column |
| `action-item-form-dialog.tsx` | Create/edit form: Name, Customer (account selector), Date, Priority/Status/Type dropdowns, Description |
| `action-item-detail-dialog.tsx` | Read-only detail view with badges and edit button |
| `action-item-delete-dialog.tsx` | Delete confirmation dialog |
| `index.ts` | Barrel export |

**Step 4 — Wire up routing and nav**

- `src/App.tsx` — added `/action-items` route pointing to `ActionItemList`
- `src/components/layout/app-layout.tsx` — added "Action Items" nav item with `ClipboardList` icon from Lucide

### Key Design Decisions

- **Customer lookup** uses the same polymorphic pattern as contacts' `parentcustomerid`: write via `tdvsp_Customer@odata.bind` with `/accounts(guid)` format, read via `_tdvsp_customer_value` at runtime.
- **Choice fields** stored as numeric keys in form state (stringified), converted to `Number()` on submit. A shared `labels.ts` file maps enum keys to human-readable labels and badge variants.
- **Badge variants**: Top Priority = destructive red, High = default blue, Complete = default, In Progress = secondary. Keeps priority visually distinct from status.
- **No new lib helper needed** — unlike contacts, the `_tdvsp_customer_value` field is directly declared on the extended interface, so a cast to `Record<string, string>` suffices.

### Result

Clean `tsc --noEmit` — zero errors. Sidebar now shows three nav items: Accounts, Contacts, Action Items.
