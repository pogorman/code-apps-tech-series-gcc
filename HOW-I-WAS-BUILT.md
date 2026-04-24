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

## Phase 23 — Copilot Studio Connector Upgrade Attempt (Blocked in GCC)

**Prompt:** "read \inbox\copilot-studio-integration.txt and provide your thoughts on moving forward w an agent i have in the same power platform environment as our app."

**Why:** Phase 12 shipped a popup-window integration against the native Copilot Studio webchat URL — it works and is still the current demo pattern. A note in `inbox/copilot-studio-integration.txt` proposed an upgrade: drop the popup and use the native Code Apps → Copilot Studio **connector** (`shared_microsoftcopilotstudio`) with `pac code add-data-source` generating a typed `MicrosoftCopilotStudioService.ExecuteCopilotAsyncV2()` client, so the chat UI could live fully inside the React app. Cleaner architecture, multi-turn via `conversationId`, end-user Entra context inherited from the Code App host. Worth investigating before spending time on a chat panel component.

**What happened:**

1. **Grounded the proposal in Microsoft Learn.** Pulled `/power-apps/developer/code-apps/how-to/connect-to-copilot-studio` and `/microsoft-copilot-studio/requirements-licensing-gcc`. Copilot Studio itself is supported in GCC, at the dedicated endpoints `gcc.powerva.microsoft.us` and `gcc.api.powerva.microsoft.us`. **But the Code App → Copilot Studio integration article has no GCC section** — its only agent URL example is `{id}.environment.api.powerplatform.com`, the commercial hostname. First red flag: the supported path was documented against commercial only.

2. **User tried to create the connection in the GCC maker portal.** Connector card appeared in the UI at `make.gov.powerautomate.us` → Connections → New → Microsoft Copilot Studio. Clicking Create surfaced a red banner error (screenshot saved to `inbox/copilot-studio-connection-bug-in-gcc.png`):

   > **OAuth2Certificate Authorization Flow failed for service First Party Azure Active Directory. Failed to acquire token from AAD:** `{"error":"invalid_client","error_description":"AADSTS700030: Invalid certificate - the issuer of the certificate is from a different cloud instance...}`
   > Correlation ID: `f6f4fc79-9b04-4e82-8a94-7769d34158e2`
   > Trace ID: `b8e3d367-4a88-4a21-bd26-1ff362397000`

   Translation: the connector's backend First Party OAuth2 Certificate flow is presenting a **commercial-cloud-issued certificate** to **GCC Entra ID**, and Gov AAD rejects it because the issuer is from a different cloud authority. The connector card is published globally but the identity plumbing for GCC isn't wired up — or the runtime hard-codes the commercial cert issuer.

3. **Checked for a CLI fallback.** Ran `pac org who` (confirmed `og-code`), then `pac connection help`, `pac connection create help`, `pac connection list`, and `pac code help`. Findings:
   - `pac connection create` is Dataverse-only and service-principal-only (`--application-id` / `--client-secret`). No `--api-id` parameter for generic connectors.
   - `pac code` has no `connection create` subcommand — it only adds/removes data sources on existing connections.
   - `pac connection list` in `og-code` showed only the Dataverse connection (`shared_commondataserviceforapps`). No stale Copilot Studio connection hiding.
   - Microsoft Learn explicitly states: *"you must create one through the Power Apps maker portal UI."* The UI **is** the supported client. There's no sanctioned non-UI path to get around it.

   So the UI being broken isn't a UI-layer bug scenario where a different client could slip through. Any client hitting the same backend OAuth2 Certificate flow would hit the same `AADSTS700030`.

4. **Decision:** Leave the Phase 12 popup-window integration in place. It works today, it doesn't depend on the blocked connector, and it preserves the low-code-first narrative for the demo. Raise a Microsoft support ticket with the correlation ID / trace ID so the connector team can fix the GCC identity provisioning. If a deeper in-app chat experience is needed before that fix ships, fall back to a Power Automate detour: Code App → flow → Copilot Studio agent (Power Automate's GCC runtime handles its own token acquisition and sidesteps the broken connector entirely).

**Files changed:** none in the app. Documentation updates to `MEMORY.md`, `FAQ.md`, `ARCHITECTURE.md`, `HOW-I-WAS-BUILT.md`, and an auto-memory project file.

**Key lessons:**
- **Connector availability in the GCC maker portal is not the same as connector functionality.** The card is surfaced globally because the swagger is published globally — but the backend First Party AAD identity plumbing has to be provisioned separately for Gov, and for `shared_microsoftcopilotstudio` it isn't.
- **The AADSTS700030 "different cloud instance" error is the signature** for this class of bug. If you see it on any First Party OAuth2 Certificate flow from a Gov portal, stop debugging your tenant config and go file a ticket — it's almost always a Microsoft-side provisioning gap.
- **Microsoft Learn's silence is a signal.** When the Code App → connector integration article has no GCC section and its URL examples are all commercial, the integration probably hasn't been certified for Gov yet. Don't assume parity.
- **PAC CLI's `pac connection create` is narrow by design** — Dataverse connections, SP auth only. Not a general-purpose "create any connection from the CLI" tool.

## Presentation Materials — Slide Outline & Live Demo Script

**Prompt:** Create a slide outline and live demo script for the Code Apps tech series presentation targeting SLED customers.

**What happened:**

1. Created `docs/slide-outline.md` — 14-slide outline covering: app spectrum comparison (Canvas vs Model-Driven vs Code Apps), what/why/when for SLED, the stack, environment setup, AI-assisted development, deploy & govern, live demo transition, recap, resources
2. Created `docs/live-demo-script.md` — 8-act live demo script (~30 min) with exact click/type/narrate instructions, pre-demo checklist, and recovery plays for common issues (Dataverse latency, create failures, Canvas vs Code Apps questions, licensing)

## Phase 24 — Dashboard & Board Modernization (Glassmorphism, Recharts, Framer Motion)

**Prompt:** "Modernize the dashboard and my board UI's with these three improvements: 1. Apply glassmorphism styling where it makes sense. 2. Replace the priority distribution bars with animated Recharts bars with tooltips. 3. Add Framer Motion entrance animations to the dashboard cards and kanban cards. Install any required packages. Keep animations subtle."

**Why:** The dashboard and board were built with hand-rolled CSS — a `dashRise` keyframe, a bespoke `HBar` row for the priority distribution, and plain `bg-card` surfaces. The stagger-in effect was decent for a demo but plateaued as soon as the app grew past five cards per row: no tooltip on the priority bars (you had to hover the wrapper to see the Tip preview, not the bar itself), no proper chart legend on click-through, and the "modern" glass feel only existed on the column headers. The modernization pass swaps in the industry-standard libraries so the vibe matches the rest of a 2026-era SLED demo.

**What happened:**

1. **Installed `framer-motion@12.23.12` and `recharts@2.15.4`** (exact-pinned per the project rules). `npm install --save-exact` — clean, no peer-dep conflicts with React 19.

2. **Dashboard (`src/components/dashboard/dashboard.tsx`):**
   - Added shared motion tokens at the top of the file — `MOTION_RISE` (`opacity 0→1, y 14→0`), `MOTION_TRANSITION` (450ms, `cubic-bezier(0.16, 1, 0.3, 1)`), and a `GLASS_CARD` class token: a light-to-dark gradient of `white/75→white/35` (or `white/[0.06]→white/[0.01]` in dark mode) over `backdrop-blur-xl`, with a `white/50` border and a two-layer shadow (inset highlight + outer lift).
   - Deleted the `ANIM_CSS` keyframe block and the inline `<style>{ANIM_CSS}</style>` tag. The page header, all four KPI cards, and all four chart cards are now `motion.div` wrappers with staggered delays (header at 0s, KPIs at 60–285ms, charts at 360–585ms — the same cadence as the old CSS, but via Framer Motion's `transition.delay`).
   - Replaced the hand-rolled `HBar` priority rows with a new **`PriorityBars` component** using Recharts — a vertical-layout `BarChart` inside a `ResponsiveContainer`, one `Cell` per priority color, `radius={[6,6,6,6]}` rounded corners, `isAnimationActive` with a 750ms ease-out entrance, and `LabelList` for the count printed to the right of each bar. Cursor changes to a pointer on hover and clicking a bar fires the existing drilldown via an `onClick={(entry) => onBarClick(entry.label)}` shim that maps the bar back to `filterByPriority()`. Custom `PriorityTooltipContent` component renders a glass popover (`popover/92` + `backdrop-blur-xl` + border + 2xl shadow) showing the priority label, count, and a "Click bar to drill down" hint.
   - Tooltip uses `cursor={{ fill: "currentColor", fillOpacity: 0.05 }}` so the hover highlight band respects the current text color (works in both themes). The Y-axis tick text gets `fillOpacity: 0.65` against `currentColor` for the same reason.
   - KPI card borders keep their `borderLeft: 3px solid ${kpi.accent}` accent but now also inherit the `GLASS_CARD` class via `cn()` — `twMerge` correctly resolves the `bg-gradient-*` override against the base Card's `bg-card`.
   - ChartCard gets a subtle accent radial glow in the top-right corner (`-top-12 -right-12 h-40 w-40 rounded-full opacity-[0.07] blur-3xl`), layered behind the content with `pointer-events-none`.
   - Removed the now-unused `priorityMax` memo since Recharts scales its own X axis.

3. **Board (`src/components/dashboard/board-dashboard.tsx`):**
   - Same motion tokens pattern — `MOTION_RISE` (450ms) for columns, a separate `CARD_MOTION` (320ms, `y 6→0`) for the smaller per-card entrance.
   - Two new glass tokens: `GLASS_COLUMN` (deeper multi-stop gradient, `backdrop-blur-xl`, inset + outer shadow) and `GLASS_CARD_SURFACE` (lighter `backdrop-blur-md` + inset shadow for the cards floating on top of the column).
   - `SortableColumn` is now a `motion.div` directly — the outer sortable wrapper stays unchanged (dnd-kit's `setNodeRef` / transform stays on a plain `div` above the motion level, not on `motion.div`, so there's no conflict between the dnd-kit transform and Framer Motion's animate transform).
   - `SortableCard` gained an `index` prop. Inside the dnd-kit wrapper div, a `motion.div` applies `CARD_MOTION` with `delay = min(index, 12) * 0.035` — subtle stagger that caps at the 12th card so long work columns don't have a "piano roll" effect when they mount.
   - `ActionItemCard`, `ProjectCard`, `IdeaCard`, and `ParkingLotCard` all swapped their `bg-card` / `border-border/40` surfaces for `bg-card/70 dark:bg-card/40` over the `GLASS_CARD_SURFACE` token. Borders moved to `border-white/40 dark:border-white/[0.06]` for a softer edge.
   - The sticky column header is now `bg-white/55 dark:bg-background/55 backdrop-blur-2xl` with a matching white-alpha border — more pronounced glass than the old `bg-background/70 backdrop-blur-xl`.
   - Deleted `BOARD_ANIM_CSS` and the `<style>` tag. Board header became a `motion.div`; added the backdrop-blur-xl treatment to its icon badge to match the dashboard header.
   - Passed `index={idx}` to every `SortableCard` from all four columns' `.map()` calls.

4. **Validated + deployed:**
   - `npm run build` → green, 31s, one pre-existing chunk-size warning (1.19MB bundle, 346KB gzip — the recharts + framer-motion add-on is absorbed into the same vendor chunk). The warning is cosmetic and has been in place since well before this phase.
   - `pac org who` → confirmed `og-code` target before the push.
   - `pac code push` → success. App URL unchanged: `https://apps.gov.powerapps.us/play/e/efacb6cc-fa92-e0d7-b073-e02733c4b337/app/b66395f5-3497-4ee0-95ff-ea6f22028478`.

**Files changed:**
- `package.json`, `package-lock.json` — added `framer-motion` + `recharts`
- `src/components/dashboard/dashboard.tsx`
- `src/components/dashboard/board-dashboard.tsx`
- Docs: `README.md`, `ARCHITECTURE.md`, `USER-GUIDE.md`, `FAQ.md`, `HOW-I-WAS-BUILT.md`

**Key lessons:**
- **`twMerge` handles Tailwind override conflicts cleanly** — passing `cn(GLASS_CARD)` to a shadcn `Card` that already has `bg-card` on it correctly resolves to the gradient-bg version. No need to build a custom `glass-card` variant at the primitive level.
- **Framer Motion + dnd-kit composes fine as long as you keep their transforms on different DOM nodes.** Put `setNodeRef` + the dnd-kit CSS transform on the outer div, wrap children in a `motion.div` for the entrance. Wrapping dnd-kit's ref node *with* `motion.div` would mix animation transforms and drag transforms and cause drift.
- **Recharts `onClick` on a `Bar` gets the datum, not a DOM event** — the second arg is the chart click state. `onClick={(entry) => onBarClick(entry.label)}` is the clean pattern; typing it as `(entry: PriorityDatum)` works because Recharts narrows the payload to your data type.
- **Cap per-card stagger on lists that can grow.** `Math.min(index, 12) * 0.035` keeps the total entrance under ~420ms no matter how many cards — important for the work column in the board, which can easily hit 20+ items.
- **Stock chunk-size warnings are not a bug to fix in a UI PR.** The `> 500 kB` warning is Vite's default threshold; for an enterprise SPA with recharts + framer-motion + shadcn + TanStack Query, 1.2MB (346KB gzipped) is fine. Revisit with `manualChunks` only if the demo ever starts feeling slow on first paint.

## Phase 25 — Dashboard Redesign: Stripe/Retool Style

**Prompt:** "Implement the dashboard redesign plan — Stripe/Retool style with decomposed sub-components, pure SVG/CSS charts, FocusStrip, semantic colors, Inter font, and dark mode support."

**Why:** The Phase 24 glassmorphism dashboard with Framer Motion and Recharts was visually polished but didn't match the dense, data-forward Stripe/Retool aesthetic defined in the design brief (`inbox/My Work Dashboard.html`). The 1025-line monolithic `dashboard.tsx` was also hard to maintain. The redesign brings a cleaner visual language (flat surfaces, 1px borders, Inter font, semantic color usage) and a properly decomposed component architecture.

**What happened:**

1. **Added Inter font** (`index.html`) — Google Fonts CDN link for Inter 400/500/600/700. Scoped to the dashboard container via inline `fontFamily`; body stays JetBrains Mono.

2. **Added `--dash-*` CSS custom properties** (`src/index.css`) — Full set of dashboard-specific design tokens for both `:root` (light) and `.dark` (dark): surface colors, border colors, ink colors (4 levels), semantic colors (blue, green, amber, red, violet, pink, cyan, slate), tint backgrounds, and shadow scales. Also added `@keyframes dash-pulse` for the FocusStrip's pulsing dot. Separate from the app's existing shadcn/ui HSL variables.

3. **Created `dashboard-tokens.ts`** — Shared types (`ActionItem`, `Drilldown`, `DashboardStats`, `StatusDatum`, `PriorityDatum`, `TypeDatum`, `AccountDatum`) and semantic color maps (`STATUS_COLORS`, `PRIORITY_COLORS`, `TYPE_COLORS`, `ACCOUNT_PALETTE`) using CSS variable references.

4. **Created 7 sub-components:**
   - `page-header.tsx` — Icon tile + eyebrow + h1 + segmented time control + buttons (visual-only)
   - `focus-strip.tsx` — Dark gradient band, top 3 urgent items, pulse dot, CTA
   - `kpi-card.tsx` — 4 variants: total (sparkline), rate (ratio bar), progress (histogram), high (stacked bar)
   - `status-breakdown.tsx` — SVG donut (r=48) + center total + "+N wk" delta + side list; exports `CardShell`
   - `priority-distribution.tsx` — 18px CSS bars with inline white text + dashed footer
   - `task-types.tsx` — 8px stacked composition bar + individual rows
   - `items-by-account.tsx` — Avatar initials + stacked status bars per account + legend

5. **Rewrote `dashboard.tsx`** — 1025 → ~225 lines. Centralized stats computation (including per-account status breakdown and week-over-week delta). Removed Framer Motion, Recharts, glassmorphism.

**Files changed:** `index.html`, `src/index.css`, `src/components/dashboard/dashboard.tsx`
**Files created:** 8 new files under `src/components/dashboard/`

**Key lessons:**
- **CSS custom properties beat Tailwind classes for a localized design system.** The `--dash-*` vars give the dashboard its own visual language without conflicting with shadcn/ui's HSL variables.
- **Per-account status breakdown requires a two-level bucket.** `Map<accountName, Map<statusLabel, count>>` — compute once, pass as `statusBreakdown` on each `AccountDatum`.
- **`createdon` isn't in generated types** but exists at runtime. Access via double-cast: `(item as unknown as Record<string, string>).createdon`.

## Phase 26 — Board Decomposition: Stripe/Retool Style

**Prompt:** "Apply the same Stripe/Retool `--dash-*` design system from Phase 25 to the Board (kanban) view. Decompose the monolithic `board-dashboard.tsx` into sub-components."

**Why:** The board was a single 800+ line file with glassmorphism styling that didn't match the new flat `--dash-*` dashboard aesthetic. It needed the same decomposition treatment as the dashboard.

**What happened:**

1. **Created `board-tokens.ts`** — Shared constants, types, and config: entity type aliases, status/priority constants, column accent colors, WIP limits, `PRIORITY_RAIL_COLORS`, `TASK_TYPE_ICON_CONFIG`, `ENTITY_ICON_CONFIG`, `PRIORITY_PILL_STYLES`, `STATUS_PILL_STYLES`, work filter config, edit target discriminated union, parking lot entry type, and normalized `CardConfig` shape. All using `--dash-*` CSS variable references.

2. **Created `board-card.tsx`** — `BoardCard` and `ParkingLotCard` components. Cards use `--dash-surface` bg, 3px priority rail, 18×18 type-icon tile, inline `Pill` component with JetBrains Mono font, overdue badges, activity dots (blue dot if `modifiedon` < 24h), and a hover toolbar (GripVertical + Pencil + Car pin toggle). No glassmorphism — flat surfaces with subtle shadows.

3. **Created `board-column.tsx`** — `BoardColumn` component wrapping `@dnd-kit` sortable context. Sticky column header with accent stripe, icon tile, count badge, WIP limit badge. Framer Motion entrance animation. Drop target highlight with accent glow.

4. **Created `board-toolbar.tsx`** — `BoardToolbar` with icon tile + eyebrow + h1, filter pills, segmented view control, and "New Item" button — matching the dashboard `page-header.tsx` pattern.

5. **Rewrote `board-dashboard.tsx`** — Reduced to an orchestrator importing the sub-components. Data fetching, drag-and-drop logic, and edit dialog state remain in the orchestrator.

**Files created:** `board-tokens.ts`, `board-card.tsx`, `board-column.tsx`, `board-toolbar.tsx`
**Files modified:** `board-dashboard.tsx`, `index.css`

## Phase 27 — Action Items List View Redesign

**Prompt:** "Apply the Stripe/Retool `--dash-*` design system to the Action Items list view, matching the mockup in `inbox/Action Items.html`."

**Why:** The action items list still used the old shadcn Table + Card dual-view layout with basic type filtering. The dashboard (Phase 25) and board (Phase 26) had been restyled — the action items list was the last major view using the old aesthetic.

**What happened:**

1. **Created `action-items-toolbar.tsx`** — Page header with CheckSquare icon tile (violet), "Track and manage your tasks" eyebrow, "Action Items" h1, search input with `/` kbd hint, Export button (visual-only), and "New Action Item" primary dark button. All `--dash-*` inline styles.

2. **Created `action-items-table.tsx`** — Main table component with three sub-components:
   - **`ActionItemsTable`** — Sticky header with sortable columns (Name, Priority, Status, Due, Updated, Actions). Click column header to sort asc → desc → clear. Select-all checkbox. Empty state.
   - **`GroupSection`** (GroupRow) — Collapsible account group header with chevron toggle, 2-letter colored avatar (deterministic color from name hash across 6 semantic colors), account name, count pill, mini 4px status distribution bar, "N open · M overdue" text.
   - **`ItemRow`** — Checkbox, 3px priority rail (`PRIORITY_RAIL_COLORS`), 18×18 type-icon tile (`TASK_TYPE_ICON_CONFIG`), name + description meta-line (Rich mode), priority pill, status pill, due date + overdue/soon badge, relative time ("2h", "1d", "2w") + blue activity dot, edit/delete hover actions.

3. **Created `action-items-bulk-bar.tsx`** — Floating bottom-center bar with Framer Motion `AnimatePresence` (slide-up on appear, slide-down on disappear). Dark bg, "N selected" count pill, Mark complete button, Delete button (red), clear selection × button.

4. **Rewrote `action-item-list.tsx`** — From 385-line monolith with shadcn Table/Card dual view to ~310-line orchestrator:
   - **Saved-view tabs:** All, Overdue (red count pill), High priority, Due this week — computed client-side with live counts
   - **Subtoolbar:** Group by Account toggle, Type/Priority/Status dropdown filter pills, "Add filter" (visual-only), density toggle (Compact/Rich, persisted to localStorage), item count
   - **Data pipeline:** `useMemo` chain: view preset → facet filters → sort → group by account → `GroupData[]`
   - **Row selection:** Per-item checkboxes + select-all with bulk Mark complete (fires confetti via existing hook) and Delete
   - **Removed:** shadcn Table, Card, Badge, ViewToggle, TileColorDots imports. No card view — table-only with density modes

**Files created:** `action-items-toolbar.tsx`, `action-items-table.tsx`, `action-items-bulk-bar.tsx`
**Files modified:** `action-item-list.tsx`
**Files unchanged:** `action-item-form-dialog.tsx`, `action-item-detail-dialog.tsx`, `action-item-delete-dialog.tsx`, `labels.ts`, `use-action-items.ts`, `board-tokens.ts`

## Phase 28 — Ideas & Meetings List View Redesign

**Prompt:** Two standalone briefs in `inbox/` — `Claude Code Brief - Ideas.md` + `Ideas.html`, and `Claude Code Brief - Meetings.md` + `Meetings.html` — specifying a full redesign of the `/ideas` and `/meeting-summaries` routes using the `--dash-*` Stripe/Retool design system that Phases 25–27 established.

**Why:** Ideas and Meeting Summaries were the last two entity pages still using the old shadcn Table + Card dual-view layout. They hadn't been touched since the initial Phase builds and felt visibly out-of-step with the Dashboard, Board, and Action Items views. The briefs also introduced categorical UX specific to each page: a capture-first "sketchbook" feel for Ideas (warm yellow accent, floating composer, category-grouped views) versus an institutional "evidence" feel for Meetings (teal accent, date tiles, weekly sparkline, 7-day timeline).

**What happened:**

1. **Token extensions (`src/index.css`)** — Added `--dash-yellow`, `--dash-indigo`, `--dash-teal`, matching `--dash-t-*` tints, `--dash-idea-soft` (warm yellow tint used on idea surfaces) and `--dash-meet-soft` (soft teal tint used on date tiles + timeline events). Light + dark variants both.

2. **Ideas rebuild (`src/components/ideas/`)** — Replaced the list component and added 10 sub-components plus a capture composer and promote dialog:
   - **`ideas-header.tsx`** — Hero with yellow gradient icon tile + stats (total / this week / high potential) + dynamic CategoryStrip (pills w/ colored dot + live count, click to filter). Suppresses categories with zero items.
   - **`ideas-toolbar.tsx`** — Capture-row search input + Export (visual-only) + gradient-yellow "New Idea" button.
   - **`ideas-view-tabs.tsx`** — Saved views: All / Mine / New this week / High potential / Archived. Live count pills.
   - **`ideas-subtoolbar.tsx`** — Filter pills (category / priority / account) + view-mode segment (Table / Gallery / Kanban) + result count.
   - **`ideas-table.tsx`** — Category-grouped table with collapsible group headers, category badge + count pill, bulb-icon row tile, hover-reveal actions (Promote / Edit / Delete). Includes reusable `IdeaRow`, custom `Checkbox`, `AccountAvatar` (deterministic color from name hash), and relative-age helper.
   - **`ideas-gallery.tsx`** — Responsive card grid grouped by category, 300px min-width cards, 10px radius, 2-line name + 2-line description clamps, hover lift + shadow.
   - **`ideas-kanban.tsx`** — Priority-column kanban (Top / High / Low / Eh / Unset) substituting for the brief's stage-status columns (no stage field in Dataverse). Non-draggable v1; click card to open detail dialog.
   - **`ideas-quick-add.tsx`** — Sticky inline "+" row at the top of the table view; single input, ↵ to save, pre-binds to the active category filter.
   - **`ideas-bulk-bar.tsx`** — Framer-motion bottom-centered bar with yellow Promote button, Archive, Delete, clear.
   - **`capture-composer.tsx`** — Persistent floating composer (bottom-right), defining element of the page. `⌘⇧I` focus hotkey, `⌘↵` to capture, minimizable FAB, draft autosave to `localStorage` every 500ms, category + account chip popovers with click-outside close.
   - **`promote-dialog.tsx`** — Bulk-promote preview. For each selected idea, creates a new Work action item (status Recognized, priority copied, account carried via `tdvsp_Customer@odata.bind`). Optional "archive idea after promoting" toggle. Uses sequential `mutateAsync` to keep the success/failure count accurate.
   - **`labels.ts` (rewritten)** — Added `CATEGORY_DOT`, `CATEGORY_TINT`, `CATEGORY_ORDER`, `CATEGORY_SHORT_LABELS`, `IDEA_PRIORITY_PILL`, `HIGH_POTENTIAL_PRIORITIES`, `STATE_ACTIVE`, `STATE_ARCHIVED`.

3. **Meetings rebuild (`src/components/meeting-summaries/`)** — Same structural approach, teal-accented:
   - **`meetings-header.tsx`** — Hero with teal gradient icon tile + 4-card stats strip: Total / This week / With summary / 8-week cadence sparkline (pure SVG path + gradient fill, ending dot highlighted).
   - **`meetings-toolbar.tsx`** — Search + Export.
   - **`meetings-view-tabs.tsx`** — Saved views: All / Mine / This week / Needs summary (no summary text) / Pinned / Archived.
   - **`meetings-subtoolbar.tsx`** — Account filter pill (teal when active) + view-mode segment (Table / Gallery / Timeline) + count.
   - **`meetings-table.tsx`** — Grouped by account with collapsible group headers (click group name to filter to just that account). Date tile (42×42, teal for upcoming, muted for past) + pin indicator + first-sentence summary + when-label ("today" in teal). Exports `DateTile` + `AccountAvatar` for reuse.
   - **`meetings-gallery.tsx`** — Responsive card grid grouped by account; 300px+ cards with date tile top-left, pin/title/relative-when, 3-line summary clamp.
   - **`meetings-timeline.tsx`** — Monday–Sunday week grid centered on today. Today column outlined in teal with soft halo. Per-event cards: time-of-day + title + account avatar. Off-week meetings render in an overflow list below.
   - **`meetings-quick-add.tsx`** — Sticky inline row in the table view: title input + today-defaulted date picker, ↵ to save, pre-binds active account filter.
   - **`meetings-bulk-bar.tsx`** — Framer-motion bar with teal-gradient Spawn action items (requires single selection; routes into the existing `ExtractActionItemsDialog` / Azure OpenAI extraction), smart Pin/Unpin toggle (pins if any unpinned, otherwise unpins), Archive, Delete, clear.
   - **`labels.ts`** — Pinned detection (`true` OR `1`), `accountAvatarColor`, `formatMonthDay`, `relativeWhen`, `isDatePast`, state constants.
   - **`⌘⇧M` shortcut** — Opens the new-summary dialog from anywhere.

4. **Hook additions (`src/hooks/`)** — Added `useAllIdeas` and `useAllMeetingSummaries` variants that skip the `statecode eq 0` filter. The orchestrators use these single sources to power both active tabs and the Archived tab from one client-side cache.

5. **Pragmatic v1 schema gaps** — Documented and worked around:
   - Ideas: no stage field → `Archived` = `statecode=1`, stage collapsed to active/archived only; `Promoted` saved view dropped (no back-link field on action items); kanban substitutes priority for stage.
   - Meetings: no type / outcome / attendees / keyQuote / duration / tags / transcriptUrl / recordingUrl / spawnedActionItemIds / relatedIdeaIds fields → those columns + views are omitted; "Needs summary" substitutes for "Has open follow-ups"; type/outcome pills omitted.
   - "Mine" tabs on both pages are placeholders (no current-user id plumbed through yet) — they currently mirror "All."

**Files created (Ideas):** `ideas-header.tsx`, `ideas-toolbar.tsx`, `ideas-view-tabs.tsx`, `ideas-subtoolbar.tsx`, `ideas-table.tsx`, `ideas-gallery.tsx`, `ideas-kanban.tsx`, `ideas-quick-add.tsx`, `ideas-bulk-bar.tsx`, `capture-composer.tsx`, `promote-dialog.tsx`
**Files created (Meetings):** `meetings-header.tsx`, `meetings-toolbar.tsx`, `meetings-view-tabs.tsx`, `meetings-subtoolbar.tsx`, `meetings-table.tsx`, `meetings-gallery.tsx`, `meetings-timeline.tsx`, `meetings-quick-add.tsx`, `meetings-bulk-bar.tsx`, `labels.ts` (new file in meeting-summaries)
**Files modified:** `src/components/ideas/idea-list.tsx` (rewrite as orchestrator), `src/components/ideas/labels.ts` (major expansion), `src/components/meeting-summaries/meeting-summary-list.tsx` (rewrite as orchestrator), `src/hooks/use-ideas.ts` (added `useAllIdeas`), `src/hooks/use-meeting-summaries.ts` (added `useAllMeetingSummaries`), `src/index.css` (added teal + yellow + indigo tokens, light + dark)
**Files unchanged:** The per-entity form / detail / delete dialogs were kept as-is; they work fine and rebuilding them wasn't required for the brief's layout.
