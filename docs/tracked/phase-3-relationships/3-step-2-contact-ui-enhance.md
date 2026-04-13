# Step 2 — Contact UI Enhancements

> UI cleanup for the contacts list and detail views. Append with `/track name:step-2-contact-ui-enhance`.

---

## 1. Replace Company Column with Account, Drop Phone & Status

**Date:** 2026-03-14

### Prompt

> contacts main view has a company column but not sure what that's for. let's replace that w an account column and show their account when set. on the view contact form we need to show the account, but not the created and modified dates. drop phone and status from contact view.

### What Was Done

#### 1. Contact List Table (`contact-list.tsx`)

- **Renamed "Company" column header to "Account"** — the data cell already used `contact.parentcustomeridname`, so the display value was correct; only the header label was wrong
- **Removed "Phone" column** — dropped the `<TableHead>Phone</TableHead>` and the corresponding `<TableCell>{contact.telephone1}</TableCell>`
- **Removed "Status" column** — dropped the `<TableHead>Status</TableHead>` and the `<Badge>` cell that showed `statecodename`
- **Updated skeleton/empty-state column counts** from 7 to 5 (Name, Account, Email, Job Title, Actions)
- **Removed unused `Badge` import** — no longer needed after dropping the Status column

#### 2. Contact Detail Dialog (`contact-detail-dialog.tsx`)

- **Renamed "Company" label to "Account"** — the `<DetailRow label="Company">` now reads `label="Account"`, still using `contact.parentcustomeridname` for the value
- **Removed "Created" and "Modified" date rows** — dropped `<DetailRow label="Created" value={contact.createdon} />` and `<DetailRow label="Modified" value={contact.modifiedon} />`, keeping only the "Owner" row in that section

### Files Changed

| File | Change |
|------|--------|
| `src/components/contacts/contact-list.tsx` | Renamed Company→Account header, removed Phone and Status columns, updated colSpan/skeleton counts to 5, removed `Badge` import |
| `src/components/contacts/contact-detail-dialog.tsx` | Renamed Company→Account label, removed Created/Modified detail rows |

### Build Status

TypeScript compiles clean — no errors.
