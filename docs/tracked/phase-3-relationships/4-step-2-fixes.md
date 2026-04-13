# Step 2 Fixes — Accounts-Contacts Relationship

> Fixes for account name resolution in the contacts UI. Append with `/track name:step-2-fixes`.

---

## 1. Account Name Not Showing in Contact List or Detail Card

**Date:** 2026-03-14

### Prompt

> account needs to be on the read only contact card that shows when we click on a contact. also, the account column on the contact view isn't populated with accounts

### Root Cause

Same underlying issue as the dropdown bug (first-cut-fixes #1): the Power Apps SDK does not populate `parentcustomeridname` on read. The contact list was rendering `contact.parentcustomeridname ?? "—"` (always showing "—"), and the detail dialog used the same field for the Account row (never rendering because `DetailRow` returns `null` when `value` is falsy).

### What Was Done

#### 1. Shared Helper — `getParentAccountId` (`src/lib/get-parent-account-id.ts`)

Created a reusable function that extracts the parent account GUID from a contact, using `parentcustomerid` with fallback to `_parentcustomerid_value`:

```typescript
export function getParentAccountId(
  contact: ContactsModel.Contacts
): string | undefined {
  return (
    contact.parentcustomerid ??
    (contact as unknown as Record<string, string>)._parentcustomerid_value ??
    undefined
  );
}
```

#### 2. Contact List (`contact-list.tsx`)

- Added `useAccounts()` hook to fetch all accounts
- Built a `Map<string, string>` (`accountid → name`) via `useMemo` for efficient lookup
- Replaced `contact.parentcustomeridname` with `accountNameMap.get(getParentAccountId(contact) ?? "")` in the Account table cell

#### 3. Contact Detail Dialog (`contact-detail-dialog.tsx`)

- Added `useAccounts()` hook
- Resolved account name by finding the matching account from the accounts list using `getParentAccountId(contact)`
- Passed resolved `accountName` to the Account `<DetailRow>` instead of `contact.parentcustomeridname`

#### 4. Contact Form Dialog (`contact-form-dialog.tsx`)

- Refactored `contactToForm` to use the shared `getParentAccountId()` helper instead of inline fallback logic

### Files Changed

| File | Change |
|------|--------|
| `src/lib/get-parent-account-id.ts` | **New** — shared helper to extract account GUID from contact with `_parentcustomerid_value` fallback |
| `src/components/contacts/contact-list.tsx` | Added `useAccounts`, account name map, resolved account names in table |
| `src/components/contacts/contact-detail-dialog.tsx` | Added `useAccounts`, resolved account name for detail card |
| `src/components/contacts/contact-form-dialog.tsx` | Refactored to use shared `getParentAccountId` helper |

### Build Status

TypeScript compiles clean — no errors.
