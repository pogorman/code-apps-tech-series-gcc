# Phase 14 — Board (Kanban Dashboard)

> Phase 14 — Board (Kanban Dashboard)
> Append with `/track name:phase-14-board-dashboard`.

---

## 2026-03-24 — Board Dashboard Build

### Prompt 1

> "in your screenshots folder is a new file called new-vertical-look. i want the dashboard to look like that. parking lot, work, projects, and ideas in vertical columns. let me know if you have any questions. ignore the little rocketship in the bottom right of the screenshot"

Reviewed `screenshots/new-vertical-look.png` — a Kanban-style board with 4 vertical columns (parking lot, work, projects, ideas), each with colored accent bars and card-based items.

### Prompt 2

> "keep the dashboard as it is now, but then have a second dashboard with the layout in the screenshot for my tables"

Changed approach: keep the existing analytics dashboard at `/`, add a new Board view at `/board`.

### What was built

1. **`src/components/dashboard/board-dashboard.tsx`** — Kanban board with 4 columns:
   - **Parking lot** (red `#E24B4A` accent) — Action items with status `Recognized` (468510000). Cards show name, date, customer, priority badge, task type badge
   - **Work** (blue `#378ADD` accent) — Action items in active statuses (not Recognized, not Complete). Cards show name, date, customer, status badge
   - **Projects** (purple `#8b5cf6` accent) — All accounts. Cards show account name + customer type badge
   - **Ideas** (amber `#EF9F27` accent) — All ideas. Cards show idea name + category badge
2. Each column uses a `Column` wrapper component with icon, title, count, scrollable card list, and colored bottom accent bar
3. Three separate card components: `ActionItemCard`, `AccountCard`, `IdeaCard`
4. Uses existing hooks: `useActionItems()`, `useAccounts()`, `useIdeas()`
5. Exported from `src/components/dashboard/index.ts`
6. Route added: `/board` in `App.tsx`
7. Sidebar nav item: "Board" with `Columns3` Lucide icon, placed alongside "Dashboard" in the root nav section

### Local dev port issues

> "run it locally but don't use 3000 i have another app using that port"

Vite was already configured for port 3001 in `vite.config.ts`. But `pac code run` defaults to looking for port 3000.

> "it wont run b/c it's trying to load on port 3000"

Discovered `pac code run` needs `--appUrl http://localhost:3001` flag. Also port 8080 and 8181 were occupied — had to use `--port 8282`.

Final working command: `pac code run --appUrl http://localhost:3001 --port 8282`

### Deployment

Auth was pointing at wrong environment (`og-ai` instead of `og-dv`). Switched with `pac auth select --index 2`, then `npm run build && pac code push`.

### Docs updated

- **README.md** — dashboard folder description
- **ARCHITECTURE.md** — board component docs, route, design decision table entry
- **FAQ.md** — "What is the Board view?" entry
- **USER-GUIDE.md** — Board section with column descriptions
- **HOW-I-WAS-BUILT.md** — Phase 14 entry
- **CLAUDE.md** — Board section, fixed local dev port from 5173 to 3001, added `--appUrl` to pac code run instructions
