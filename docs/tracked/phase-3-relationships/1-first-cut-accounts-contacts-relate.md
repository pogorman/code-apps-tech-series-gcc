# First Cut — Accounts-Contacts Relationship

> Tracked notes for adding the account-contact relationship to the Code Apps CRM demo. Append with `/track name:phase-3-relationships/first-cut-accounts-contacts-relate`.

---

## 1. Add Account-Contact Relationship to UI

**Date:** 2026-03-14

### Prompt

> need to add the relationship between accounts and contacts and reflect that in the ui. need to be able to set the account for the contact, and add contacts to an account.

### What Was Done

#### 1. Contact Form — Account Selector (`contact-form-dialog.tsx`)

- Added an **Account dropdown** (`<Select>`) to the contact create/edit form, positioned between name fields and job title
- Fetches all accounts via `useAccounts()` and renders them as `<SelectItem>` options
- Includes a "None" option to clear the association
- On save, sets both `parentcustomerid` (the account GUID) and `parentcustomeridtype` (`"account"`) on the Dataverse record
- When editing an existing contact, pre-selects the current account using `contact.parentcustomerid`

**Key detail:** Dataverse polymorphic lookups require both the ID and the type fields. Setting `parentcustomeridtype: "account"` tells Dataverse the lookup targets the `account` table.

#### 2. Account Detail — Related Contacts Section (`account-detail-dialog.tsx`)

- Added a **Contacts section** to the account detail dialog showing all contacts linked to the account
- Queries contacts using OData filter: `_parentcustomerid_value eq '{accountid}'`
- Displays each contact as a clickable row with name and job title/email
- Shows a count badge, loading skeletons, and an empty-state message
- Clicking a contact closes the dialog and navigates to `/contacts`

#### 3. Account List — Contact Navigation (`account-list.tsx`)

- Wired the `onViewContact` callback from the account detail dialog
- Closes the detail dialog and navigates to the contacts page via `useNavigate()`

#### 4. Query Invalidation (`use-contacts.ts`)

- Contact create, update, and delete mutations now **also invalidate the `accounts` query key**
- This ensures the account detail dialog's contact list refreshes after any contact is linked/unlinked/deleted

### Files Changed

| File | Change |
|------|--------|
| `src/components/contacts/contact-form-dialog.tsx` | Added account `<Select>` dropdown, `parentcustomerid` form field, and submit logic |
| `src/components/accounts/account-detail-dialog.tsx` | Added contacts section with `useContacts` query filtered by account ID |
| `src/components/accounts/account-list.tsx` | Added `useNavigate` and `onViewContact` handler |
| `src/hooks/use-contacts.ts` | Added `ACCOUNTS_KEY` invalidation to all mutations |

### Dataverse Fields Used

| Field | Type | Purpose |
|-------|------|---------|
| `parentcustomerid` | Polymorphic lookup (string) | Stores the linked account GUID |
| `parentcustomeridtype` | String | Identifies the target table (`"account"`) |
| `parentcustomeridname` | Computed (read-only) | Display name of the linked account |
| `_parentcustomerid_value` | OData lookup value | Used in OData filters to query contacts by account |

### Build Status

TypeScript compiles clean — no errors.
