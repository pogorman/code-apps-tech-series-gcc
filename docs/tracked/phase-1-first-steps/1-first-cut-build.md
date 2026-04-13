# First Cut Build — Tracked Notes

> Append with `/track name:first-cut-build`.

---

## 1. First Cut Build — Account Management Code App

**Date:** 2026-03-14

### What We Built

Full CRUD Code App on the Dataverse `account` table, deployed to og-dv via `pac code push`.

### Steps

1. **Scaffolded Vite + React + TS** — created config files manually (directory wasn't empty, had existing docs and package.json).

2. **Installed deps** — `npm install --save-exact` for all production and dev dependencies. Kept `md-to-pdf` from the existing package.json.

3. **Tailwind v4 setup** — npm resolved Tailwind v4 (not v3). Required switching from JS config + PostCSS to `@tailwindcss/vite` plugin + CSS-based config with `@theme inline` block.

4. **Vite version conflict** — Vite 8 installed by default, but `@tailwindcss/vite` only supports Vite 5–7 and `@vitejs/plugin-react@6` requires Vite 8. Fixed by pinning Vite 7 + `@vitejs/plugin-react@5`.

5. **`pac code init`** — created `power.config.json` targeting og-dv. Required `--displayName` and `--buildPath "dist"`.
   ```bash
   pac code init --displayName "Account Management Code App" --buildPath "dist" --fileEntryPoint "index.html"
   ```

6. **Registered account table** — generated typed services and models in `src/generated/`.
   ```bash
   pac code add-data-source -a dataverse -t account
   ```

7. **shadcn/ui components** — `npx shadcn@latest add` created a literal `@/` directory instead of resolving the path alias. Had to manually move files from `@/components/ui/` to `src/components/ui/`.

8. **Built the app layer:**
   - `src/hooks/use-accounts.ts` — TanStack Query hooks wrapping `AccountsService` (useAccounts, useAccount, useCreateAccount, useUpdateAccount, useDeleteAccount)
   - `src/components/accounts/account-list.tsx` — table with search, loading skeletons, row click for detail
   - `src/components/accounts/account-form-dialog.tsx` — create/edit form dialog
   - `src/components/accounts/account-detail-dialog.tsx` — read-only detail view
   - `src/components/accounts/account-delete-dialog.tsx` — delete confirmation
   - `src/components/layout/app-layout.tsx` — header with icon + title

9. **Type fix** — `AccountsBase` has required fields (`ownerid`, `owneridtype`, `statecode`) that the platform sets automatically. Used `as unknown as` cast on the create mutation.

10. **Build + deploy:**
    ```bash
    npx vite build    # 392 KB JS + 25 KB CSS
    pac code push      # deployed on first try
    ```

### Final Stack

| Layer | Package | Version |
|-------|---------|---------|
| Framework | react | 19.2.4 |
| Build | vite | 7.3.1 |
| Styling | tailwindcss | 4.2.1 |
| UI | shadcn/ui (radix primitives) | latest |
| Data | @tanstack/react-query | 5.90.21 |
| State | zustand | 5.0.11 |
| Dataverse | @microsoft/power-apps | 1.0.4 |
| Icons | lucide-react | 0.577.0 |
| Toasts | sonner | 2.0.7 |

### Key Gotchas Encountered

| Gotcha | Resolution |
|--------|-----------|
| `npx power-apps` doesn't exist | Use `pac code` for everything |
| Tailwind v4 needs Vite plugin, not PostCSS | Install `@tailwindcss/vite`, delete postcss.config.js and tailwind.config.ts |
| Vite 8 + `@tailwindcss/vite` incompatible | Pin Vite 7 + `@vitejs/plugin-react@5` |
| shadcn creates literal `@/` directory | Move files to `src/components/ui/` manually |
| `AccountsBase` required fields set by platform | Cast through `unknown` on create |

---
