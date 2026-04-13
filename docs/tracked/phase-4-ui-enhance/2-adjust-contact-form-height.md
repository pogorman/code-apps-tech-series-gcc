# Adjust Contact Form Height — Tracked Notes

> Append with `/track name:adjust-contact-form-height`.

---

## 1. Fix Contact Form Overflow

**Date:** 2026-03-14

### Prompt

> the new and edit forms for contact are too tall and run off the screen. fix it

### What Changed

1. **DialogContent** (`src/components/ui/dialog.tsx`) — Added `max-h-[85vh] overflow-y-auto` so all dialogs cap at 85% viewport height and scroll internally instead of clipping off-screen.

2. **Contact form layout** (`src/components/contacts/contact-form-dialog.tsx`) — Combined two pairs of single-column fields into side-by-side rows:
   - Account + Job Title → `grid-cols-2`
   - Mobile + Street → `grid-cols-2`

   This removes two full vertical rows from the form, keeping it shorter and more compact.
