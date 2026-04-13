# First-Cut Contacts

**Date:** 2026-03-14

---

## 1. The Prompt

> add contacts w full crud to the code app following the same pattern we did for accounts. add modern navigation.

---

## 2. Dataverse Data Source Registration

Before any code was written, the contact table was registered with:

```bash
pac code add-data-source -a dataverse -t contact
```

This generated two files in `src/generated/`:

| File | Purpose |
|------|---------|
| `models/ContactsModel.ts` | TypeScript interfaces for `ContactsBase` (writable fields) and `Contacts` (full record with computed fields). Includes option-set enums for statecode, statuscode, accountrolecode, gendercode, familystatuscode, preferredcontactmethodcode, etc. |
| `services/ContactsService.ts` | Static CRUD class: `create()`, `get()`, `getAll()`, `update()`, `delete()`, `getMetadata()`. Uses `getClient(dataSourcesInfo)` under the hood — same pattern as `AccountsService`. |

The generated `index.ts` was automatically updated to export both `ContactsModel` and `ContactsService`.

**Key difference from AccountsService:** The `create` and `update` methods omit `address1_addressid` (not `contactid`). The Accounts equivalents omit `accountid`. This is a quirk of the code generation — Dataverse handles primary key assignment on create regardless.

**Reminder:** No `$select` on Dataverse queries. Computed fields cause silent zero-row returns. The hooks omit `select` entirely, matching the accounts pattern.

---

## 3. What Was Built

### Hook: `src/hooks/use-contacts.ts`

Mirrors `use-accounts.ts` exactly. Five exports:

- `useContacts(options?)` — query all with OData filter/orderBy, defaults to `lastname asc`
- `useContact(id)` — single record query, enabled only when id is truthy
- `useCreateContact()` — mutation, invalidates `["contacts"]` cache on success
- `useUpdateContact()` — mutation with `{ id, fields }` signature
- `useDeleteContact()` — mutation by id

All use TanStack Query with the same cache invalidation pattern as accounts.

### Components: `src/components/contacts/`

| File | What It Does |
|------|-------------|
| `contact-list.tsx` | Main view. Search bar (filters on `firstname` OR `lastname` via OData `contains()`), data table with 7 columns (Name, Company, Email, Phone, Job Title, Status, Actions), loading skeletons, empty state, 4 dialog states (create, edit, view, delete). |
| `contact-form-dialog.tsx` | Create/edit form. Fields: First Name, Last Name*, Job Title, Email, Phone, Mobile, Street, City, State, Zip, Description. Last name is required. Reuses same controlled-form pattern as account form. |
| `contact-detail-dialog.tsx` | Read-only detail view. Shows status/job-title badges, company, contact info, address (conditional), description (conditional), audit fields (owner, created, modified). Edit button transitions to form dialog. |
| `contact-delete-dialog.tsx` | Confirmation dialog using AlertDialog. Shows contact name, disables buttons during deletion. |
| `index.ts` | Barrel exports for all four components. |

Contact display name uses `fullname` (computed) with fallback to `firstname + lastname`.

### Navigation: Sidebar + Routing

**`src/components/layout/app-layout.tsx`** — Replaced the header-only layout with a sidebar:
- 56px-wide left sidebar with app title ("CRM Demo" + LayoutGrid icon)
- NavLink items for Accounts (Building2 icon) and Contacts (Users icon)
- Active state: `bg-primary/10 text-primary`
- Hover state: `bg-muted text-foreground`

**`src/App.tsx`** — Added `HashRouter` with routes:
- `/accounts` → `<AccountList />`
- `/contacts` → `<ContactList />`
- `*` → redirect to `/accounts`

Used `HashRouter` (not `BrowserRouter`) because the app runs inside a Power Platform iframe — no server-side routing available.

---

## 4. Files Changed

| File | Change |
|------|--------|
| `src/generated/models/ContactsModel.ts` | **Generated** by `pac code add-data-source` |
| `src/generated/services/ContactsService.ts` | **Generated** by `pac code add-data-source` |
| `src/generated/index.ts` | **Updated** by `pac code add-data-source` — added ContactsModel + ContactsService exports |
| `src/hooks/use-contacts.ts` | **New** — TanStack Query hooks for contacts CRUD |
| `src/components/contacts/contact-list.tsx` | **New** — main contacts list view |
| `src/components/contacts/contact-form-dialog.tsx` | **New** — create/edit form |
| `src/components/contacts/contact-detail-dialog.tsx` | **New** — read-only detail dialog |
| `src/components/contacts/contact-delete-dialog.tsx` | **New** — delete confirmation |
| `src/components/contacts/index.ts` | **New** — barrel exports |
| `src/components/layout/app-layout.tsx` | **Rewritten** — header → sidebar with NavLink navigation |
| `src/App.tsx` | **Rewritten** — added HashRouter, Routes, contacts route, default redirect |

---

## 5. Build Verification

`npm run build` — clean, no errors. Output: 441 KB JS, 25 KB CSS (gzipped: 132 KB / 5.4 KB).
