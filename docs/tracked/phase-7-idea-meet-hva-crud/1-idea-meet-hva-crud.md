# Idea, Meeting Summary & HVA CRUD — Tracked Notes

> Append with `/track name:1-idea-meet-hva-crud`.

---

## 1. Full CRUD for tdvsp_hva, tdvsp_meetingsummary, tdvsp_idea

**Date:** 2026-03-14

### Prompt

> add full crud for tdvsp_hva, tdvsp_meetingsummary, tdvsp_idea and build the navigation

### What Was Done

#### 1. Generated Dataverse Types

Ran `pac code add-data-source -a dataverse -t <table>` for all three tables. This produced generated models and services in `src/generated/`:

| Table | Model | Service | ID Field |
|-------|-------|---------|----------|
| `tdvsp_hva` | `Tdvsp_hvasModel` | `Tdvsp_hvasService` | `tdvsp_hvaid` |
| `tdvsp_meetingsummary` | `Tdvsp_meetingsummariesModel` | `Tdvsp_meetingsummariesService` | `tdvsp_meetingsummaryid` |
| `tdvsp_idea` | `Tdvsp_ideasModel` | `Tdvsp_ideasService` | `tdvsp_ideaid` |

#### 2. Table Field Summary

**HVA (High Value Activities)**
- `tdvsp_name` (required), `tdvsp_description`, `tdvsp_date`
- Customer lookup: `tdvsp_Customer@odata.bind` (write) / `_tdvsp_customer_value` (read GUID) / `tdvsp_customername` (read name)

**Meeting Summary**
- `tdvsp_name` (required), `tdvsp_summary` (textarea), `tdvsp_date`
- Account lookup: `tdvsp_Account@odata.bind` (write) / `_tdvsp_account_value` (read GUID) / `tdvsp_accountname` (read name)

**Idea**
- `tdvsp_name` (required), `tdvsp_description`, `tdvsp_category` (9-value choice field)
- Account lookup: `tdvsp_Account@odata.bind` / `_tdvsp_account_value` / `tdvsp_accountname`
- Contact lookup: `tdvsp_Contact@odata.bind` / `_tdvsp_contact_value` / `tdvsp_contactname`
- Category choices: Copilot Studio, Canvas Apps, Model-Driven Apps, Power Automate, Power Pages, Azure, AI General, App General, Other

#### 3. Files Created

**Hooks** (TanStack Query — list, get, create, update, delete):
- `src/hooks/use-hvas.ts`
- `src/hooks/use-meeting-summaries.ts`
- `src/hooks/use-ideas.ts`

**HVA Components** (`src/components/hvas/`):
- `hva-list.tsx` — search, table with customer name + date, CRUD dialogs
- `hva-form-dialog.tsx` — name, customer (account select), date, description
- `hva-detail-dialog.tsx` — read-only view with edit button
- `hva-delete-dialog.tsx` — confirmation dialog
- `index.ts` — barrel exports

**Meeting Summary Components** (`src/components/meeting-summaries/`):
- `meeting-summary-list.tsx` — search, table with account name + date
- `meeting-summary-form-dialog.tsx` — title, account select, date, summary textarea (5 rows)
- `meeting-summary-detail-dialog.tsx` — read-only view
- `meeting-summary-delete-dialog.tsx` — confirmation dialog
- `index.ts` — barrel exports

**Idea Components** (`src/components/ideas/`):
- `idea-list.tsx` — search, table with account name + category badge
- `idea-form-dialog.tsx` — name, category select, account select, contact select, description
- `idea-detail-dialog.tsx` — read-only view with category + account + contact
- `idea-delete-dialog.tsx` — confirmation dialog
- `labels.ts` — `CATEGORY_LABELS` map + `categoryVariant()` for badge styling
- `index.ts` — barrel exports

#### 4. Navigation & Routing Updates

**`src/App.tsx`** — added 3 routes: `/hvas`, `/meeting-summaries`, `/ideas`

**`src/components/layout/app-layout.tsx`** — 7 nav tiles:
- Dashboard, Accounts, Contacts, Action Items, **HVAs** (Zap icon), **Meetings** (FileText icon), **Ideas** (Lightbulb icon)

#### 5. Patterns Followed

All three entities follow the exact same conventions as the existing `action-items` CRUD:

- **Lookup writes**: `@odata.bind` with `/accounts(guid)` or `/contacts(guid)` format
- **Lookup reads**: cast to `Record<string, string>` and access `_fieldname_value` for GUID, fallback to `fieldname_name` for display
- **Account name resolution**: `useAccounts()` → `accountNameMap` for table display
- **Choice fields**: numeric keys in model, human labels in `labels.ts`, `Badge` with variant function
- **Form state**: `EMPTY_FORM` const, `entityToForm()` converter, `useEffect` reset on dialog open
- **Search**: OData `contains()` filter with single-quote escaping

#### 6. Bonus Fix

Fixed pre-existing unused type alias `ActionItem` in `dashboard.tsx` that was causing `tsc -b` to fail (TS6196).

### Build Result

- `npx tsc --noEmit` — zero errors
- `npm run build` — clean (only the standard chunk-size warning for the SPA bundle)
