# Step 3 Account UI — Tracked Notes

> Append with `/track name:step-3-account-ui`.

---

## 1. Simplify Account List Columns

**Date:** 2026-03-14

### Prompt 1

> "accounts view. get rid of city, phone, industry, status and add contacts and stack the contacts on top of each other vertically in a single col"

**What was done:**

- Removed four columns from the account list table: City, Phone, Industry, Status
- Added a **Contacts** column that shows all contacts linked to each account, stacked vertically
- Fetched all contacts with `useContacts()` and built a `contactsByAccount` lookup map using `useMemo` + `getParentAccountId()` — same pattern used elsewhere for polymorphic lookup resolution
- Each account row renders its contacts as a vertical stack (`flex flex-col`) of `<span>` elements
- Accounts with no contacts show an em dash
- Removed unused `Badge` import
- Updated skeleton loader and empty-state `colSpan` to match the new 3-column layout

### Prompt 2

> "add columns for CSA, CSAM, AE ... we'll add to those later"

**What was done:**

- Added three new table header columns: **CSA**, **CSAM**, **AE**
- Added placeholder cells with em dashes (`—`) in `text-muted-foreground` for each account row
- Updated skeleton loader column count to 6 and empty-state `colSpan` to 6
- These are stub columns — no data source wired yet, ready for future implementation

### Final column layout

| Name | Contacts | CSA | CSAM | AE | Actions |
|------|----------|-----|------|----|---------|
| Account name | Stacked contact names | — | — | — | Edit / Delete |
