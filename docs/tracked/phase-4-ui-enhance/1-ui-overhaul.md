# UI Overhaul — Tracked Notes

> Phase 4: Microsoft Fluent Design theme overhaul. Append with `/track name:ui-overhaul`.

---

## 1. Microsoft Theme Overhaul

**Date:** 2026-03-14

### Prompt

> the ui is kind of drab. can you spruce it up with microsoft colors and an uber awesome theme

### What Changed

Four files modified to transform the default shadcn/slate theme into a Microsoft Fluent Design-inspired look.

#### 1. Color Palette (`src/index.css`)

Replaced all CSS custom properties with Microsoft-aligned HSL values:

| Token | Before (slate) | After (Microsoft) |
|-------|----------------|-------------------|
| `--primary` | `222.2 47.4% 11.2%` (dark navy) | `207 100% 42%` (Microsoft Blue #0078D4) |
| `--primary-foreground` | off-white | pure white |
| `--background` | pure white | `225 20% 97%` (light blue-gray) |
| `--accent` | same as secondary | `207 90% 94%` (light blue tint) |
| `--accent-foreground` | navy | `207 100% 30%` (dark blue) |
| `--ring` | dark navy | Microsoft Blue (matches primary) |
| `--foreground` | near-black | `213 35% 16%` (deep navy text) |

Added sidebar gradient tokens (`--sidebar-from: #0C2340`, `--sidebar-to: #1B3A5C`) and `antialiased` text rendering.

#### 2. Sidebar Redesign (`src/components/layout/app-layout.tsx`)

- **Top accent bar**: 1px gradient stripe across the full page width (`#0078D4 → #50E6FF → #00BCF2`)
- **Dark gradient sidebar**: `bg-gradient-to-b from-[#0C2340] to-[#1B3A5C]`, widened from `w-56` to `w-64`
- **Branded icon**: Blue rounded-lg badge with shadow behind the LayoutGrid icon
- **Active nav items**: Left blue border indicator (`border-l-[3px] border-[#0078D4]`) + frosted glass (`bg-white/15`) + white text
- **Inactive nav items**: Translucent white text (`text-white/70`) with hover glow (`hover:bg-white/10`)
- **Footer**: "Power Platform" label in `text-white/40`

#### 3. Table Headers (`src/components/ui/table.tsx`)

- `TableHeader`: Background changed to `bg-primary` (Microsoft Blue), border removed
- `TableHead`: Text styled as `text-xs font-semibold uppercase tracking-wider text-primary-foreground` — white uppercase on blue

#### 4. Page Headers (`src/components/accounts/account-list.tsx`, `src/components/contacts/contact-list.tsx`)

Each list page gained:
- Icon badge: `rounded-xl bg-primary/10` with the page's Lucide icon in primary color
- Title: `text-2xl font-bold tracking-tight` with subtitle in muted
- Table wrapper: `overflow-hidden rounded-lg border bg-card shadow-sm` (card elevation + clipped corners so blue header fills to edges)
- Spacing bumped from `space-y-4` to `space-y-6`

### Build Result

Clean build, no errors. Bundle: 29.84 kB CSS / 497.89 kB JS (gzipped: 6 kB / 152 kB).
