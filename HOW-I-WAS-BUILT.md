# How I Was Built

An ELI5-style walkthrough of how this Code App was built, documenting prompts, execution, and fixes.

## Phase 1 — Scaffolding

**Prompt:** Set up a Power Platform Code App with React, TypeScript, Tailwind, and shadcn/ui.

**What happened:** Created the project with `pac code init`, added Vite + React + TypeScript + Tailwind v4 + shadcn/ui. Set up routing with HashRouter (required by Power Platform iframe host), app layout with sidebar, and the base configuration.

**Tracked notes:** `docs/tracked/phase-1-first-steps/`

## Phase 2 — Account CRUD

**Prompt:** Add full CRUD for the Dataverse account table.

**What happened:** Ran `pac code add-data-source -a dataverse -t account` to generate the service and model. Created `use-accounts.ts` hooks wrapping TanStack Query, then built list/detail/form/delete components in `src/components/accounts/`. Deployed with `npm run build && pac code push`.

**Tracked notes:** `docs/tracked/phase-1-first-steps/`

## Phase 3 — Contact CRUD

**Prompt:** Add contact CRUD with sidebar navigation.

**What happened:** Ran `pac code add-data-source -a dataverse -t contact`. Created `use-contacts.ts` hooks and `src/components/contacts/` components mirroring the account pattern. Added sidebar nav with Accounts/Contacts links.

**Tracked notes:** `docs/tracked/phase-1-first-steps/`

## Phase 3.5 — Account-Contact Relationships

**Prompt:** Add the relationship between accounts and contacts and reflect that in the UI. Need to be able to set the account for the contact, and add contacts to an account.

**What happened:**
- Added an Account dropdown (shadcn `Select`) to the contact form, setting `parentcustomerid` + `parentcustomeridtype` on save
- Added a Contacts section to the account detail dialog querying by `_parentcustomerid_value`
- Contact mutations now invalidate both contacts and accounts query caches

**Tracked notes:** `docs/tracked/phase-3-relationships/1-first-cut-accounts-contacts-relate.md`

## Fixes — Polymorphic Lookup Fields

**Problem:** Existing contacts with accounts showed "None" in the dropdown, and the account column/detail card were empty.

**Root cause:** Dataverse OData returns polymorphic lookup GUIDs as `_parentcustomerid_value` at runtime, but the generated TypeScript type only declares `parentcustomerid`. Similarly, `parentcustomeridname` isn't populated by the Power Apps SDK.

**Fix:**
1. Created `src/lib/get-parent-account-id.ts` — shared helper using `_parentcustomerid_value` fallback
2. Resolved account names by fetching all accounts via `useAccounts()` and building a lookup map instead of relying on `parentcustomeridname`

**Tracked notes:** `docs/tracked/phase-3-relationships/2-first-cut-fixes.md`, `docs/tracked/phase-3-relationships/4-step-2-fixes.md`

## UI Polish

**Prompt:** Replace Company column with Account, drop Phone and Status from contact list, show account on detail card, remove created/modified dates.

**What happened:** Renamed headers, removed columns, updated column counts, cleaned up unused imports.

**Tracked notes:** `docs/tracked/phase-3-relationships/3-step-2-contact-ui-enhance.md`

## Account List Simplification

**Prompt:** Remove City, Phone, Industry, Status from account list. Add a Contacts column stacked vertically. Add stub columns for CSA, CSAM, AE.

**What happened:**
- Removed four columns (City, Phone, Industry, Status) from the account table
- Added a Contacts column that fetches all contacts via `useContacts()`, builds a `contactsByAccount` map using `getParentAccountId()`, and renders contact names stacked vertically
- Added three placeholder columns (CSA, CSAM, AE) with em dash placeholders for future implementation

**Tracked notes:** `docs/tracked/phase-3-relationships/5-step-3-account-ui.md`

## Phase 4 — Microsoft Fluent Design Theme

**Prompt:** The UI is kind of drab. Spruce it up with Microsoft colors and an uber awesome theme.

**What happened:**
- Replaced the default shadcn/slate color palette with Microsoft Fluent Design colors — Microsoft Blue (#0078D4) as primary, light blue-gray background, blue accents and focus rings
- Redesigned the sidebar: dark navy gradient (#0C2340 → #1B3A5C), branded icon badge, blue left-border active indicator, translucent white text
- Added a gradient accent bar at the top of the page (#0078D4 → #50E6FF → #00BCF2)
- Styled table headers with Microsoft Blue background and white uppercase text
- Added page headers with icon badges and subtitles to Accounts and Contacts pages
- Wrapped data tables in card-elevated containers with shadows and clipped corners

**Tracked notes:** `docs/tracked/phase-4-ui-enhance/1-ui-overhaul.md`

## Fix — Contact Form Overflow

**Prompt:** The new and edit forms for contact are too tall and run off the screen.

**What happened:**
- Added `max-h-[85vh] overflow-y-auto` to `DialogContent` so all dialogs scroll internally instead of clipping
- Compacted the contact form by combining Account + Job Title and Mobile + Street into side-by-side rows

**Tracked notes:** `docs/tracked/phase-4-ui-enhance/2-adjust-contact-form-height.md`

## Phase 5 — Action Items CRUD

**Prompt:** contacts and accounts are good for now, let's implement the tdvsp_actionitem table w full crud

**What happened:**
1. Ran `pac code add-data-source -a dataverse -t tdvsp_actionitem` to generate model + service
2. Created `src/hooks/use-action-items.ts` — TanStack Query hooks for CRUD with cache invalidation
3. Created `src/components/action-items/labels.ts` — human-readable labels for Priority, Status, Type choice fields + badge variant helpers (the generated enum names are mangled and not display-friendly)
4. Created `src/components/action-items/` — list, form dialog, detail dialog, delete dialog following the exact same pattern as accounts/contacts
5. Customer lookup uses OData bind syntax (`tdvsp_Customer@odata.bind` → `/accounts(guid)`) for writes, `_tdvsp_customer_value` for reads — same polymorphic pattern as contacts
6. Wired up `/action-items` route in `App.tsx` and "Action Items" nav item with ClipboardList icon in the sidebar

**Tracked notes:** `docs/tracked/phase-5-action-items/1-first-cut-action-items.md`

## Phase 6 — Navigation Rework (Sidebar → Top Tiles)

**Prompt:** i need more horizontal space, rework the navigation to be evenly spaced tiles across the top under the main title bar no more than maybe 125px tall.

**What happened:**
1. Removed the 256px-wide dark sidebar entirely
2. Split layout into: gradient accent bar → title bar (48px, logo + "Account Management") → nav tile row → full-width content
3. Nav tiles are left-aligned 50px squares with icon + label, active tile highlighted in Microsoft Blue
4. Tiles use `min-w-[50px]` with padding so longer labels like "Action Items" stretch gracefully
5. Full viewport width is now available for content

**Follow-up fixes:**
- Halved tile height and made them square, left-aligned with `flex` instead of `grid`
- Added `min-w` + `px-3` + `whitespace-nowrap` to fix centering on longer labels

**Tracked notes:** `docs/tracked/phase-6-ui-enhance/1-ui-enhance-navigation.md`

## Phase 6b — View Polish

**Prompts:** Rename header title, uniform tile sizing, icon action buttons, column width tuning.

**What happened:**
1. Renamed header from "CRM Demo" to "Account Management"
2. Set all nav tiles to fixed `w-[100px]` so Accounts, Contacts, and Action Items are the same width
3. Equalized nav tile vertical spacing (`py-2` instead of `pb-3 pt-1`)
4. Added `whitespace-nowrap` to Priority column header and cells so "Top Priority" doesn't wrap
5. Replaced text "Edit"/"Delete" buttons with Pencil and Trash2 Lucide icons across all three list views (accounts, contacts, action items) — black for edit, red for delete
6. Set Account Name column to `w-[39%]` for more room

**Tracked notes:** `docs/tracked/phase-6-ui-enhance/1-ui-enhance-navigation.md`, `docs/tracked/phase-6-ui-enhance/2-ui-enhance-views.md`

## Phase 6c — Dashboard

**Prompt:** Build a dashboard view.

**What happened:** Added a Dashboard component with Chart.js (Doughnut, Bar, Pie) showing action item analytics: KPI cards (total, completion rate, in progress, urgent), status breakdown, priority distribution, work vs personal, and items by account. Wired up as the home route (`/`).

**Tracked notes:** `docs/tracked/phase-6-ui-enhance/3-ui-enhance-dashboard-first-cut.md`

## Phase 7 — HVA, Meeting Summary & Idea CRUD

**Prompt:** add full crud for tdvsp_hva, tdvsp_meetingsummary, tdvsp_idea and build the navigation

**What happened:**

1. Generated Dataverse types for all three tables via `pac code add-data-source`
2. Created TanStack Query hooks: `use-hvas.ts`, `use-meeting-summaries.ts`, `use-ideas.ts`
3. Built full CRUD component sets for each entity:
   - **HVAs** (`src/components/hvas/`) — list, form (name, customer, date, description), detail, delete; customer lookup via `tdvsp_Customer@odata.bind`
   - **Meeting Summaries** (`src/components/meeting-summaries/`) — list, form (title, account, date, summary textarea), detail, delete; account lookup via `tdvsp_Account@odata.bind`
   - **Ideas** (`src/components/ideas/`) — list, form (name, category choice, account, contact, description), detail, delete; dual lookups (`tdvsp_Account@odata.bind` + `tdvsp_Contact@odata.bind`); `labels.ts` for 9 category choices (Copilot Studio, Canvas Apps, Model-Driven Apps, Power Automate, Power Pages, Azure, AI General, App General, Other)
4. Updated navigation to 7 tiles: Dashboard, Accounts, Contacts, Action Items, HVAs (Zap), Meetings (FileText), Ideas (Lightbulb)
5. Added routes: `/hvas`, `/meeting-summaries`, `/ideas`

**Tracked notes:** `docs/tracked/phase-7-idea-meet-hva-crud/1-idea-meet-hva-crud.md`

> **Note:** HVAs were later removed in Phase 9.

## Phase 8 — Dashboard CSS Rewrite (Drop Chart.js)

**Prompt:** Drop Chart.js entirely and rebuild the dashboard using pure CSS/SVG, based on the example in `examples/crm_dashboard_v2.html`.

**What happened:**
1. Rewrote `src/components/dashboard/dashboard.tsx` from scratch — no chart library dependencies
2. SVG donut replaces Chart.js Doughnut (uses `stroke-dasharray` arcs)
3. CSS horizontal bars replace Chart.js Bar charts (priority distribution, items by account)
4. CSS progress bars replace Chart.js Pie (work vs personal)
5. KPI cards now have colored accent stripes matching the example design
6. Removed `chart.js` and `react-chartjs-2` from package.json (3 packages dropped)

**Tracked notes:** `docs/tracked/phase-8-ui-enhance/1-new-dash-all-css.md`

## Phase 9 — Left Sidebar, Quick Create Bar & Drop HVAs

**Prompt:** Move navigation to a vertical left sidebar and add a quick create bar across the top, mimicking a reference screenshot. Then drop HVAs entirely.

**What happened:**

1. Rewrote `app-layout.tsx` — replaced horizontal nav tiles with a left vertical sidebar (208px, white background, grouped nav sections: core, activity, capture) and a top quick create bar (colored pill buttons)
2. Created `src/stores/quick-create-store.ts` — Zustand store that signals which entity's create dialog to open. Layout sets the target + navigates; list component picks it up via `useEffect` and auto-opens the form
3. Updated all list components to subscribe to the quick create store
4. Removed HVAs: deleted `src/components/hvas/` and `src/hooks/use-hvas.ts`, removed route, nav item, and quick create button. Generated code left untouched (read-only)

**Tracked notes:** `docs/tracked/2-quick-create-bar-drop-hvas.md`

## Phase 10 — Multiple Minor UI Tweaks

**Prompts:**
1. "rearrange the quick create to match the left nav"
2. "change acct mgmt to Cx Mgt and use an icon that looks more like cxmgr-logo in your screenshots folder"
3. "change cx mgt to My Work and come up with a better icon"

**What happened:**

1. Reordered `QUICK_CREATE_BUTTONS` to match the left sidebar nav order: account → contact → task → summary → idea (was task → idea → account → contact → summary)
2. Replaced the `LayoutGrid` brand icon with `UserCog` (person + gear, matching the cxmgr-logo.jpg style) and renamed "Acct Mgmt" to "Cx Mgt"
3. Settled on `Briefcase` icon + "My Work" as the final brand — cleaner, universally recognized

All changes in `src/components/layout/app-layout.tsx`.

**Tracked notes:** `docs/tracked/phase-8-ui-enhance/3-multiple-minor-ui-tweaks.md`

## Phase 11 — Dashboard Tooltips & Drilldown Cards

**Prompt:** "all of the tiles on the dashboard should allow me to hover over them and see some data that makes up the visualization, but then click on them and have a card open that shows the data that makes up those vis's"

**What happened:**

1. Created `src/components/dashboard/drilldown-dialog.tsx` — reusable Radix Dialog showing a filtered table of action items (Name, Customer, Priority badge, Status badge, Date). Sticky header, scrollable body (`max-h-[60vh]`), wide layout (`max-w-3xl`)
2. Added a `Tip` component to `dashboard.tsx` — generic CSS tooltip wrapper using Tailwind `group/tip` + `group-hover/tip` (no tooltip library). Shows item count, first 4 names, "+N more", "Click to view details". Supports `position` prop (`"above"` | `"below"`)
3. Made all 4 KPI cards clickable with hover tooltips (`position="below"` to avoid viewport clipping)
4. Made all chart sub-elements (`StatusRow`, `HBar`, `AccountRow`, type rows) independently clickable with hover tooltips
5. Created reverse-lookup maps (`STATUS_KEY_BY_LABEL`, `PRIORITY_KEY_BY_LABEL`, `TYPE_KEY_BY_LABEL`) to convert display labels back to Dataverse numeric choice keys for filtering
6. Added hover styling: `cursor-pointer hover:bg-muted/60` on sub-elements, `hover:shadow-md` on KPI cards

**Fix:** KPI tooltips positioned above (`bottom-full`) clipped off-screen. Added `position` prop — KPI cards use `"below"` (renders with `top-full mt-2`), chart sub-elements use default `"above"`.

**Tracked notes:** `docs/tracked/phase-8-ui-enhance/4-tool-tips-and-blowouts-for-dash.md`

## Phase 12 — AI Action Item Extraction & Command Palette

**Prompt:** Add AI-powered action item extraction from meeting notes and a Ctrl+K command palette for global search.

**What happened:**

1. Created `src/lib/azure-openai.ts` — Azure OpenAI integration that sends meeting notes to a chat completion endpoint and parses the response into structured action items (name, priority, due date, notes). Maps AI priority strings ("High", "Medium", "Low") to Dataverse numeric choice keys. Gracefully checks for env var configuration
2. Created `src/components/meeting-summaries/extract-action-items-dialog.tsx` — dialog triggered by a sparkle icon on each meeting summary row. Shows extracted items in a reviewable list; user can edit or remove before confirming. On confirm, bulk-creates action items in Dataverse with the meeting's account linked
3. Created `src/components/command-palette.tsx` — global Ctrl+K search using cmdk + shadcn Dialog. Searches TanStack Query cache client-side (no extra API calls). Results grouped by entity with highlighted matches. Select to navigate
4. Added `.env.example` documenting the three Azure OpenAI env vars
5. Added Ctrl+K hint to sidebar footer

**Tracked notes:** `docs/tracked/phase-9-ai-command-palette/`

## Fix — CommandPalette Outside HashRouter (White Screen)

**Problem:** After deploying the command palette, the app showed a blank white screen in Power Platform.

**Root cause:** `CommandPalette` uses `useNavigate()` from react-router-dom, which requires a `<Router>` ancestor. It was rendered outside `<HashRouter>` in `App.tsx`, causing an uncaught error that crashed the entire React tree.

**Fix:** Moved `<CommandPalette />` inside `<HashRouter>` in `App.tsx`. Redeployed via `npm run build && pac code push`.

**Lesson:** Any component using React Router hooks (`useNavigate`, `useLocation`, `useParams`, etc.) must be rendered inside the Router provider. In a Power Platform Code App, there's no browser DevTools fallback — you just get a white screen.

## Phase 13 — Table/Card View Toggle

**Prompt:** "i want my table views to have a selector for list/grid view and card view"

**What happened:**

1. Created `src/hooks/use-view-preference.ts` — localStorage-backed hook that persists the selected view mode (`"table"` | `"card"`) per entity across sessions
2. Created `src/components/ui/view-toggle.tsx` — toggle button group with List and LayoutGrid Lucide icons, using shadcn Button with secondary/ghost variants
3. Updated all 5 entity list components (`account-list.tsx`, `contact-list.tsx`, `action-item-list.tsx`, `idea-list.tsx`, `meeting-summary-list.tsx`):
   - Added ViewToggle in toolbar between search bar and "New" button
   - Added card view: responsive 3-column grid (`sm:grid-cols-2 lg:grid-cols-3`) of shadcn Card components
   - Cards show entity-specific fields (badges for priority/status/category, account names, dates, contacts)
   - Edit/delete buttons on each card header
   - Cards are clickable to open detail dialog (same as table rows)
   - Loading skeleton and empty states handled for both views

## Phase 14 — Board (Kanban Dashboard)

**Prompt:** "I want the dashboard to look like that [screenshot]. Parking lot, work, projects, and ideas in vertical columns."

**What happened:**

1. Created `src/components/dashboard/board-dashboard.tsx` — a Kanban-style board with 4 vertical columns pulling from 4 data sources (action items, projects, ideas, meeting summaries)
2. **Parking lot** column (green accent, Car icon): Items pinned via `tdvsp_pinned` from any entity. Shows name + entity type badge. Minimal toolbar (grip + X to unpin)
3. **Work** column (blue accent, Briefcase icon): All non-complete action items (excludes Complete only). Shows name, date, customer, status/priority badges. Task type filter pills in header (All/Work/Personal/Learning). Per-card task type selector on hover
4. **Projects** column (purple accent, FolderKanban icon): All `tdvsp_project` records. Shows project name and priority badge
5. **Ideas** column (amber accent, Lightbulb icon): All ideas. Shows idea name and category badge
6. Column accent bars run vertically on the left side (not bottom). Each column is a scrollable container with header (icon + title + count)
7. Single `DndContext` wraps all columns with `useDroppable` per column. Within-column reorder via `SortableContext` + `arrayMove`. Cross-column: drag to parking lot pins, drag from parking lot unpins
8. Floating `CardToolbar` on hover: GripVertical (drag), priority color dots, Pencil (edit), Pin toggle. Edit pencil works for all entity types (action items, projects, ideas, meeting summaries)
9. `tdvsp_pinned` is a boolean field not yet in generated types — accessed via casting to `Record<string, unknown>`
10. Added `/board` route in `App.tsx` and "Board" nav item with `Columns3` icon in sidebar alongside Dashboard
11. Kept the existing analytics dashboard intact at `/` — no changes to that view

## Phase 15 — Projects CRUD

**Prompt:** Add full CRUD for the `tdvsp_project` table with list view, form dialog, detail dialog, and delete dialog.

**What happened:**

1. Ran `pac code add-data-source -a dataverse -t tdvsp_project` to generate model + service
2. Created `src/hooks/use-projects.ts` — TanStack Query hooks for CRUD with cache invalidation
3. Created `src/components/projects/labels.ts` — priority labels + badge variant helpers (same numeric keys as action items)
4. Created `src/components/projects/` — list (table/card toggle), form dialog (name, account, priority, description), detail dialog, delete dialog, barrel export. FolderKanban icon
5. Account lookup via `tdvsp_Account@odata.bind` → `/accounts(guid)` for writes, `_tdvsp_account_value` for reads
6. Added `/projects` route in `App.tsx`, "Projects" nav item in sidebar (capture section), and violet quick create pill in the top bar
7. Updated Board to show `tdvsp_project` records in the Projects column instead of accounts

## Phase 16 — Board Visual Polish, Dynamic Work Column, Quick Create Presets & Nav Reorg

**Prompt:** Polish the board cards, make the work column dynamic, add task-type presets to quick create, and reorganize the left nav.

**What happened:**

1. **Board card visual polish** (`board-dashboard.tsx`, `tile-colors.ts`):
   - Cards have hover lift (`-translate-y-0.5`), graduated shadows (sm to md to xl for drag)
   - Drag state: `scale-[1.03]`, `rotate-[1.5deg]`, `ring-2 ring-primary/40`
   - Entity-type icons (h-3 w-3) inline with card titles: Briefcase (action items), FolderKanban (projects), Lightbulb (ideas), FileText (meeting summaries)
   - 1-line description snippets below titles when available
   - Subtle priority-tinted gradient backgrounds via `tileGradient()` in `tile-colors.ts`
   - Glass-morphism sticky column headers (`backdrop-blur-md`, `bg-background/60`) with overlapping accent-colored count badges
   - Improved empty state with large faded icon
   - Card titles use `text-xs` for compact display

2. **Outline-style priority/status pills** (`action-items/labels.ts`, `ideas/labels.ts`):
   - New `priorityPillClass()` and `statusPillClass()` in action-items labels
   - New `categoryPillClass()` in ideas labels
   - Pills are absolute positioned: priority bottom-left, status bottom-right
   - `rounded-sm border` style with semantic colors (red, blue, amber, etc.)
   - Removed Badge component from board (raw spans now)

3. **Dynamic work column** (`board-dashboard.tsx`):
   - Column accent color, icon, and title change based on active filter via `workFilterConfig()` helper
   - All: gray/LayoutGrid/"all", Work: red/Briefcase/"work", Personal: blue/House/"personal", Learning: magenta/BookOpen/"learning"
   - Filter pills are tiny h-5 w-5 circles with single letters (A/W/P/L) pushed to the right
   - Removed per-card hover task-type selector icons

4. **Quick create reorder + task-type presets** (`quick-create-store.ts`, `app-layout.tsx`, `action-item-form-dialog.tsx`, `action-item-list.tsx`):
   - Quick create store gained `payload` field (`QuickCreatePayload` type)
   - `ActionItemFormDialog` gained `defaultTaskType` prop
   - Quick create order: work, personal, learning, idea, meeting, project, account, contact
   - Work/personal/learning each pre-set the task type on the action item form
   - "summary" renamed to "meeting"
   - Added project quick create (violet, FolderKanban)

5. **Left nav reorganization** (`app-layout.tsx`):
   - Section order: insights (Dashboard, My Board), activity, capture, core
   - "Board" renamed to "My Board" everywhere
   - Capture order: Ideas, Meetings, Projects
   - Nav icons colored to match quick creates (red, emerald, pink, violet, teal, sky)
   - `NavItem` interface gained optional `color` field

6. **Parking lot cards** (`board-dashboard.tsx`):
   - Removed type label badge and divider
   - Entity icon identifies the type instead

**Files changed:** `board-dashboard.tsx` (major), `tile-colors.ts`, `action-items/labels.ts`, `ideas/labels.ts`, `action-item-form-dialog.tsx`, `action-item-list.tsx`, `app-layout.tsx`, `quick-create-store.ts`

## Phase 17 — Dark Mode, Monospace Font, Board Improvements & Action Item Filters

**Prompt:** Add dark mode support, switch to monospace font, improve board UX (wider work column, clickable cards, Car icon for parking, custom collision detection, drop target glow, toolbar repositioning), add task-type filter pills on the action items list, rename "Eh" to "Med", tighten table density, and fix Tailwind v4 dark mode.

**What happened:**

1. **Dark mode with ThemeProvider** (`src/components/theme-provider.tsx`, `src/App.tsx`):
   - Created `ThemeProvider` context with `useTheme()` hook
   - Stores preference in `localStorage`, falls back to OS `prefers-color-scheme`
   - Toggles `.dark` class on `<html>` to activate dark CSS variables
   - Dark mode color palette defined in `src/index.css` under `.dark` — inverted backgrounds, adjusted accent colors, bright blue/cyan sidebar gradient
   - Moon/Sun toggle button added to sidebar footer in `app-layout.tsx`

2. **Tailwind v4 dark mode fix** (`src/index.css`):
   - Tailwind v4 removed `darkMode: "class"` from config
   - Added `@custom-variant dark (&:where(.dark, .dark *));` at the top of `index.css` to tell Tailwind that `dark:` utilities activate on `.dark` class ancestors
   - Without this line, all `dark:` classes were silently ignored

3. **Monospace font** (`src/index.css`):
   - Set body font to `"JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", ui-monospace, monospace`
   - Gives the app a developer-tool aesthetic fitting a Code Apps demo

4. **Board improvements** (`board-dashboard.tsx`):
   - **Wider work column:** Grid changed to `grid-cols-[1fr_2fr_1fr_1fr]` — work column gets 2x width
   - **Clickable cards:** All card types have `cursor-pointer` and clicking the card body opens the entity's edit form dialog via `setEditTarget()`
   - **Car icon replaces Pin:** The `CardToolbar` pin toggle now uses a Car icon (`lucide-react/Car`) instead of a generic pin. Green when parked
   - **Toolbar repositioned:** Moved from floating above (`-top-8`) to top-right corner of card (`-top-2.5 -right-2.5`) for better visibility
   - **Custom collision detection:** Hybrid strategy using `closestCenter` for within-column card reorder + `pointerWithin` for cross-column drops. `getColumnForId()` helper determines whether active and over items are in the same column
   - **Drop target glow:** `isDropTarget` prop on `SortableColumn` — when a card is dragged over a column, the column gets `border-2 ring-2 ring-offset-1 scale-[1.01] shadow-lg` with accent-colored `boxShadow` glow. Tracked via `overColumn` state set in `handleBoardDragOver`
   - **`onDragCancel` handler:** Clears `overColumn` state when drag is cancelled

5. **Action item type filters** (`action-item-list.tsx`):
   - Added `typeFilter` state (numeric Dataverse key or `null` for All)
   - Four filter pills below search bar: All (dark inverted), Work (red + Briefcase), Personal (blue + House), Learning (magenta + BookOpen)
   - Active pill: solid fill with white text. Inactive: outline style with entity-specific colors
   - `TASK_TYPE_ICON` map associates each numeric key with an icon + color
   - Each table row and card shows a colored task-type icon inline with the name
   - Dark mode variants on pill styles (`dark:bg-*-950/60 dark:border-*-800`)

6. **"Eh" renamed to "Med"** (`action-items/labels.ts`):
   - `PRIORITY_LABELS[468510001]` changed from `"Eh"` to `"Med"` for clarity

7. **Customer column removed** (`action-item-list.tsx`):
   - Removed the Customer column from the action items table view to free horizontal space
   - Customer is still visible in detail dialog, form, and card view

8. **Tighter table density** (action-item-list.tsx and other list components):
   - Reduced vertical padding on table cells for a more compact list appearance

**Files changed:** `theme-provider.tsx` (new), `index.css`, `App.tsx`, `app-layout.tsx`, `board-dashboard.tsx`, `action-item-list.tsx`, `action-items/labels.ts`

## Phase 18 — Copilot Studio Agent Integration

**Prompt:** Add a Copilot Studio agent to the Code App, reusing the same agent from the `dv-front-end` repo.

**What happened:**

1. Investigated the `dv-front-end` repo's approach: `botframework-webchat` + Direct Line + MSAL SSO token exchange. That pattern requires MSAL for Bearer tokens, which the Code App doesn't have — its `@microsoft/power-apps` SDK uses custom `paauth`/`dynamicauth` tokens with no public API to extract a standard OAuth token
2. Pivoted to the **iframe embed** approach: Copilot Studio provides a hosted webchat URL that handles SSO natively within the Power Platform context. Since both the Code App and the agent are in the same environment (`0582014c-9a6d-e35b-8705-5168c385f413`), the authenticated session flows through
3. Created `src/components/copilot-chat.tsx` — floating blue gradient button (bottom-right, `MessageCircle` icon) that opens a 400x600 chat panel with the Copilot Studio iframe. Header has refresh (remount iframe) and close buttons. Dark mode aware via `useTheme()`
4. Added `<CopilotChat />` to `App.tsx` alongside `<CommandPalette />` (outside `AppLayout`, inside `HashRouter`)
5. No new dependencies — zero packages added

**Key decision:** Iframe over Direct Line because the Power Platform host's custom auth tokens aren't compatible with Direct Line's SSO token exchange. The iframe embed was simpler, dependency-free, and handled auth natively.

**Tracked notes:** `docs/tracked/phase-12-adding-agent/1-adding-my-copilot-studio-agent.md`

## Phase 18b — Copilot Chat Simplified to Popup Window

**Prompt:** Simplify the Copilot chat — the iframe approach still had friction. Just open it in a popup window.

**What happened:**

1. Rewrote `src/components/copilot-chat.tsx` from a full iframe-based chat panel (400x600, header with refresh/close, dark mode support, `iframeKey` remounting) to a minimal floating button that calls `window.open()` with the Copilot Studio webchat URL
2. Removed `@azure/msal-browser` and `botframework-webchat` from `package.json` — these were dead dependencies left over from the Direct Line experiment that never worked in the Code App context
3. Removed `VITE_COPILOT_DIRECT_LINE_SECRET` from `.env.example`
4. The popup window approach lets Copilot Studio handle its own auth in its own browsing context — no iframe CSP issues, no token exchange, no dependencies

**Key decision:** The evolution was Direct Line + MSAL (failed due to `paauth`/`dynamicauth` tokens) -> iframe embed (worked but had friction) -> popup window (simplest, zero dependencies). The popup window is the right answer for Code Apps where the host SDK's auth is incompatible with standard OAuth flows.

## Phase 19 — "Under the Hood" Presentation Deck (Agentic Generation)

**Prompt:** Analyze the deployed Code App's runtime using a browser DevTools HTML export, then generate a companion slide deck and talk track for the tech series.

**What happened:**

1. **Runtime analysis** — The `inbox/08587a10-83ed-43d0-8be4-8b145f5a7ee3.devtools` file (a full HTML export from browser DevTools of the deployed app) was analyzed by Claude Code to extract runtime facts: 77 scripts loaded, 230KB of localization data, ClassicCanvasApp iframe classification, 55 feature gates, server-side auth via `paauth`/`dynamicauth`, Copilot sidecar injection, sovereign cloud readiness, and accessibility annotations
2. **Slide content authoring** — Claude Code drafted 6 slides of content: runtime internals, two gotcha stories (Dataverse polymorphic lookups where writes worked but reads silently failed; Copilot Studio Direct Line + MSAL working locally but failing deployed due to custom auth — pivoted to iframe), the 18-phase agentic build story, reusable patterns (TanStack Query cache powering Ctrl+K, 27-line Zustand quick-create store, dnd-kit + Dataverse mutations, Tailwind v4 class-based dark mode), and a 7-beat live demo transition
3. **Programmatic generation** — Created `demo-materials/generate-deck.py` using `python-pptx` (for the `.pptx` deck) and `fpdf2` (for the speaker notes PDF). The script is the single source of truth — edit content there, run `python generate-deck.py` to regenerate both outputs
4. **Output** — `demo-materials/code-apps-under-the-hood.pptx` (6 slides) and `demo-materials/code-apps-under-the-hood-talk-track.pdf` (full talk track)

**Key detail:** No manual PowerPoint editing. The entire deck — including layout, fonts, colors, and content — is generated programmatically from the Python script, keeping it version-controllable and reproducible.

## Phase 20 — UI Facelift: Dashboard, Board & Collapsible Sidebar

**Prompt:** "build a more enhanced dashboard with better looking tiles", "let's give the my board a face lift too", "make the left nav bar collapsible and reduce padding"

**What happened:**

1. **Dashboard redesign** (`dashboard.tsx`) — "Precision Terminal" aesthetic. KPI cards got left accent borders, radial accent glows, icons in tinted badges, hover lift + shadow expansion. New `ChartCard` wrapper with top gradient accent line and vertical bar section indicator. SVG donut enlarged (144px, 18px stroke) with background track ring. Bars became pill-shaped with gradient fills. Task Types section gained a segmented overview bar and per-type icons (Briefcase/House/BookOpen). Tooltips upgraded to frosted glass (`backdrop-blur-xl`). All elements stagger in with `dashRise` animation. Fixed stale `Eh` → `Med` in `PRIORITY_COLORS`. Added `TYPE_COLORS` and `TYPE_ICONS` maps
2. **Board redesign** (`board-dashboard.tsx`) — Matching visual style. Columns stagger in with `dashRise` animation (60/135/210/285ms delays). Column headers gained vertical accent bar indicator, upgraded to `backdrop-blur-xl`, uppercase tracking titles. Drop target glow doubled (`24px + 48px`). CardToolbar upgraded to `backdrop-blur-xl` with better shadow. Drag state softened (1deg rotation, 1.02 scale). Empty states enlarged with accent-tinted icons
3. **Collapsible sidebar** (`app-layout.tsx`) — Floating chevron toggle button on sidebar edge. Collapses from 208px to 56px with 300ms transition. Collapsed: icon-only with hover tooltips, section dividers, footer icons only. State persists in `localStorage` (`sidebar-collapsed`)
4. **Padding reduction** — Main content `p-8` → `p-4`, quick create bar `px-6 py-2` → `px-4 py-1.5`. Reclaims ~32px per side

**Tracked notes:** `docs/tracked/phase-13-ui-facelift/1-dashboard-board-layout-facelift.md`

## Phase 21 — Board Work Column Status Filter Fix

**Fix:** The work column was filtering out action items with status "Recognized" (Dataverse choice key `468510000`). Since Recognized is the default status when a new action item is created, this meant freshly created items were invisible on the board until their status was manually changed. The filter now excludes only "Complete" — all other statuses (Recognized, In Progress, Pending Comms, On Hold, Wrapping Up) are shown.

**What happened:**

1. Removed the `RECOGNIZED` status exclusion from the work column filter in `src/components/dashboard/board-dashboard.tsx`
2. Work column now shows all active action items except Complete

**Files changed:** `board-dashboard.tsx`

## Phase 22 — Dataverse Description Enrichment for Copilot Studio Agent

**Prompt:** "use my active pac auth profile for https://og-code.crm9.dynamics.com/. There is a solution called The Dataverse Solution. It hosts the tables that our app in this project interact w. Each table in that solution need to have an awesome description added to them so a copilot studio agent using the dataverse mcp server tool can better find things. We also need to do any custom column, ie any column that starts with tdvsp_ needs a good description (in those custom tables that also start with tdvsp_)."

**Why:** A Copilot Studio agent pointed at the same environment uses the Dataverse MCP server to discover and query entities. With blank or generic descriptions, the agent struggles to pick the right table when a user asks natural-language questions like "show me all tasks for Contoso" or "what ideas do we have in the backlog". Rich, synonym-heavy descriptions give it enough signal to route queries correctly without custom prompt engineering.

**What happened:**

1. **Workspace bootstrap** — The repo was not yet set up for the Python `dataverse` skill plugin. Ran the plugin's connect flow: installed `azure-identity`, `requests`, `PowerPlatform-Dataverse-Client`, and `pandas`; created `scripts/` with `auth.py` + `enable-mcp-client.py`; wrote `.env` with `DATAVERSE_URL=https://og-code.crm9.dynamics.com/` and `TENANT_ID=426a6ef4-2476-4eab-ae1c-1c9dc2bfca80` (probed from the Dataverse WWW-Authenticate header).

2. **Gov Cloud auth patch** — The stock `scripts/auth.py` assumed commercial cloud (`login.microsoftonline.com`) and persisted its `AuthenticationRecord` to a single shared file. Both assumptions break for `crm9` (US Gov L4):
   - Added `_is_gov_cloud()` detection from `DATAVERSE_URL`
   - Set `authority=AzureAuthorityHosts.AZURE_GOVERNMENT` on `DeviceCodeCredential` / `ClientSecretCredential` when Gov
   - Persisted to a separate `dataverse_cli_auth_record_gov.json` so the Gov record coexists with any commercial-cloud record from other projects on the same machine
   - Guarded against `got multiple values for keyword argument 'authority'` when an `authentication_record` is already present (the record encodes its own authority — only pass the `authority` kwarg on first login)

3. **Solution + table discovery** (`scripts/list-solution-tables.py`) — SDK query for `solution` filtered to `ismanaged eq false`, matched `friendlyname == "The Dataverse Solution"` (uniquename: `TheDataverseSolution`, version 1.0.0.5). Queried `solutioncomponent` where `_solutionid_value eq ... and componenttype eq 1` to get 8 entity components: `account`, `contact`, `tdvsp_actionitem`, `tdvsp_hva`, `tdvsp_idea`, `tdvsp_impact`, `tdvsp_meetingsummary`, `tdvsp_project`. For each `tdvsp_*` table, pulled all `Attributes` and filtered client-side (Dataverse rejects `$filter startswith` on MetadataEntities with `501`). Wrote `solution-tables.json`.

4. **Drafting descriptions** — Ran a parallel Explore subagent over `src/` to ground the descriptions in actual app usage. The agent mapped each table to its React components, hooks, choice values, and lookup patterns (e.g., `tdvsp_priority` = 468510002 Top Priority / 468510003 High / 468510001 Medium / 468510000 Low). Authored rich multi-sentence descriptions for all 8 tables (overriding the stock `account` / `contact` OOB descriptions with app-specific ones at user's request) and 35 `tdvsp_*` custom columns — skipping auto-generated `*name` / `*yominame` / `*id` / virtual columns. Saved as `descriptions-plan.json`.

5. **Metadata PUT loop** (`scripts/apply-descriptions.py`) — First attempt used `PATCH EntityDefinition(...)` and got `405 Operation not supported on EntityMetadata`. Second attempt switched to `PUT .../Description` and got `400 Argument must be of type...`. Microsoft Learn confirmed: metadata endpoints mirror the .NET SDK's `UpdateEntityRequest` / `UpdateAttributeRequest` — *you can't update individual properties*. The working pattern is **read-modify-write PUT**:
   - GET the full entity (`EntityDefinitions(LogicalName='x')`)
   - For attributes, GET with a concrete type cast (`.../Attributes({id})/Microsoft.Dynamics.CRM.StringAttributeMetadata`, `MemoAttributeMetadata`, `LookupAttributeMetadata`, `PicklistAttributeMetadata`, `BooleanAttributeMetadata`, `DateTimeAttributeMetadata`)
   - Mutate `Description` in the returned JSON
   - PUT the whole thing back with headers `MSCRM.MergeLabels: true` + `MSCRM.SolutionName: TheDataverseSolution`
   - Call `POST /PublishAllXml` once all writes succeed
   - Third attempt: **8 tables + 35 columns updated, 0 failures, customizations published**.

6. **Solution pull** — Per the plugin's mandatory post-change step, exported the unmanaged solution and unpacked it into `./solutions/TheDataverseSolution/` so the XML is the source of truth:
   ```bash
   pac solution export --name TheDataverseSolution --path ./solutions/TheDataverseSolution.zip --managed false --overwrite
   pac solution unpack --zipfile ./solutions/TheDataverseSolution.zip --folder ./solutions/TheDataverseSolution --allowDelete --allowWrite
   rm ./solutions/TheDataverseSolution.zip
   ```
   Verified the new `<Descriptions>` blocks appear in `Entities/tdvsp_ActionItem/Entity.xml` (and the others).

**Commit:** `feat: add agent-friendly descriptions to Dataverse tables/columns` — 106 files, includes `scripts/`, `descriptions-plan.json`, `solution-tables.json`, and the full unpacked `solutions/TheDataverseSolution/`. Also added `scripts/__pycache__/` to `.gitignore`.

**Files changed/added:**
- `.env` (local only, gitignored)
- `.gitignore` (added `scripts/__pycache__/`)
- `scripts/auth.py`, `scripts/enable-mcp-client.py`, `scripts/list-solution-tables.py`, `scripts/apply-descriptions.py`
- `descriptions-plan.json`, `solution-tables.json`
- `solutions/TheDataverseSolution/**` (unpacked unmanaged solution)

**Key lessons:**
- Dataverse metadata writes **require read-modify-write PUT**, not PATCH and not per-property PUT. The endpoint expects the entire entity body on every call.
- US Gov Cloud Dataverse (`crm9`) uses `login.microsoftonline.us`, not the default `login.microsoftonline.com`. Azure Identity `DeviceCodeCredential` needs `authority=AzureAuthorityHosts.AZURE_GOVERNMENT` — but only on first login, because once an `AuthenticationRecord` is persisted it encodes its own authority and passing the kwarg again is a `TypeError`.
- For attribute metadata, the GET URL **must** include a concrete type cast (`.../Microsoft.Dynamics.CRM.StringAttributeMetadata`, etc.) or the response strips all type-specific properties and the round-trip PUT returns `400`.
- The Dataverse `$filter` on MetadataEntities doesn't support `startswith` — filter client-side.
- After any metadata change, pull the solution into the repo. The unpacked XML is the audit trail for what the Copilot Studio agent actually sees.

## Presentation Materials — Slide Outline & Live Demo Script

**Prompt:** Create a slide outline and live demo script for the Code Apps tech series presentation targeting SLED customers.

**What happened:**

1. Created `docs/slide-outline.md` — 14-slide outline covering: app spectrum comparison (Canvas vs Model-Driven vs Code Apps), what/why/when for SLED, the stack, environment setup, AI-assisted development, deploy & govern, live demo transition, recap, resources
2. Created `docs/live-demo-script.md` — 8-act live demo script (~30 min) with exact click/type/narrate instructions, pre-demo checklist, and recovery plays for common issues (Dataverse latency, create failures, Canvas vs Code Apps questions, licensing)
