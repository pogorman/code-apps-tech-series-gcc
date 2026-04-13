# First Cut Fixes — Accounts-Contacts Relationship

> Bug fixes for the account-contact relationship feature. Append with `/track name:first-cut-fixes`.

---

## 1. Fix Account Dropdown Showing "None" for Existing Contacts

**Date:** 2026-03-14

### Prompt

> existing accounts have contacts in dataverse but you're not showing those in our code app. when i open a contact and it already has an account, the drop down shouldn't say "none" like it does now.

### Root Cause

The `contactToForm` function in `contact-form-dialog.tsx` was reading `contact.parentcustomerid` to populate the account dropdown. This field is defined in the generated `ContactsBase` type (the write model) as an optional string, but **Dataverse OData does not populate it on read**. Instead, the lookup GUID comes back at runtime as `_parentcustomerid_value` — a field that exists on the raw OData response but is **not declared** in the generated TypeScript type.

Other lookups in the `Contacts` interface follow the pattern of having both a navigation property (`object`) and a `_xxx_value` (`string`) field, but `parentcustomerid` is a polymorphic lookup and the generated code handles it differently — it omits the `_parentcustomerid_value` field from the type entirely.

### Fix

Updated `contactToForm` to fall back to `_parentcustomerid_value` from the raw runtime object:

```typescript
parentcustomerid:
  contact.parentcustomerid ??
  (contact as unknown as Record<string, string>)._parentcustomerid_value ??
  "",
```

The double cast (`unknown` then `Record<string, string>`) is required because TypeScript strict mode rejects a direct cast from `Contacts` to `Record` — the types don't overlap enough.

### Files Changed

| File | Change |
|------|--------|
| `src/components/contacts/contact-form-dialog.tsx` | `contactToForm` — added `_parentcustomerid_value` fallback for the account dropdown |

### Build Status

TypeScript compiles clean — no errors.
