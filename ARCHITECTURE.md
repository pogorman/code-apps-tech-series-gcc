# Architecture

## Overview

Single-page React app running inside a Power Platform Code App host iframe. All data access goes through generated Dataverse services provided by the `@microsoft/power-apps` SDK — no direct HTTP calls.

## Runtime Model

```
Browser
  └─ Power Platform host iframe
       └─ Code App (this SPA)
            └─ Generated services → Dataverse Web API (via host proxy)
```

The `pac code run` proxy bridges local dev to the Dataverse environment. In production, the Power Platform host handles auth and routing.

## Layers

### UI Components (`src/components/`)

- **`accounts/`** — Account list (table/card toggle), detail dialog, form dialog, delete confirmation
- **`contacts/`** — Contact list (table/card toggle), detail dialog, form dialog, delete confirmation
- **`action-items/`** — Action item list (table/card toggle) with task-type filter pills (All/Work/Personal/Learning) and inline type icons per row/card, detail dialog, form dialog, delete confirmation, shared label/variant helpers
- **`meeting-summaries/`** — Meeting Summary list (table/card toggle), detail dialog, form dialog, delete confirmation; account lookup + summary textarea; AI extraction dialog (`extract-action-items-dialog.tsx`) that calls Azure OpenAI to pull action items from meeting notes
- **`ideas/`** — Idea list (table/card toggle), detail dialog, form dialog, delete confirmation; category choice field + account, contact, and project lookups, shared label/variant helpers
- **`projects/`** — Project list (table/card toggle), detail dialog, form dialog, delete confirmation; account lookup, priority choice field, shared label/variant helpers
- **`dashboard/`** — Two views: (1) Analytics dashboard (`dashboard.tsx`) with staggered `dashRise` entry animation, accent-bordered KPI cards (left colored border, radial accent glow, icon in tinted badge), and `ChartCard` panels (top gradient accent line, vertical bar section indicator, frosted-glass tooltips). SVG donut (144px, 18px stroke, background track), pill-shaped gradient bars, segmented task-type overview bar with per-type icons. Hover tooltips preview underlying data; click any tile or sub-element to open a drilldown dialog (`drilldown-dialog.tsx`) showing a filtered table of action items. (2) Kanban board (`board-dashboard.tsx`) with staggered column entry animation and four drag-and-drop columns: parking lot (pinned items from any entity, green accent + Car icon), work (wider 2fr column with dynamic accent/icon/title based on active task-type filter), projects (`tdvsp_project` records, purple accent), and ideas (amber accent). Grid layout: `grid-cols-[1fr_2fr_1fr_1fr]`. Uses a single `@dnd-kit` `DndContext` with custom `CollisionDetection` (closestCenter for within-column reorder, pointerWithin for cross-column drops); `useDroppable` on columns; cross-column drag pins/unpins items via `tdvsp_pinned` field. Active drop-target columns highlight with an accent-colored ring, border, and glow. All cards are clickable — clicking opens the entity's edit form dialog. Floating `CardToolbar` on hover (compact: backdrop-blur, smaller padding) provides GripVertical (drag), color dots (priority), Pencil (edit), and Car icon (park/unpark) controls. Cards have hover lift (`-translate-y-0.5`), graduated shadows, entity-type icons inline with titles, 1-line description snippets, and priority-tinted gradient backgrounds via `tileGradient()` (dark-mode aware). Drag state adds `scale-[1.03]`, `rotate-[1.5deg]`, `ring-2 ring-primary/40` with elevated `z-index: 9999`. Glass-morphism sticky column headers (`backdrop-blur-md`, `bg-background/60`) with overlapping count badges. Outline-style priority/status/category pills (`priorityPillClass()`, `statusPillClass()`, `categoryPillClass()`) replace Badge components. Sort order persists in localStorage
- **`layout/`** — App shell with collapsible left vertical sidebar (Briefcase icon + "My Work" brand, grouped nav: insights, activity, capture, core). Sidebar collapses to 56px icon-only rail via a floating chevron toggle button; state persists in `localStorage`. When collapsed, nav items show centered icons with hover tooltips to the right; section labels become thin dividers; footer buttons show icons only. Nav icons are color-matched to quick creates (red, emerald, pink, violet, teal, sky). Dark mode toggle (Sun/Moon icon) in sidebar footer. Top horizontal quick create bar with colored pill buttons (dark-aware variants): work, personal, learning (task-type presets), idea, meeting, project, account, contact. Work/personal/learning pills pre-set `tdvsp_tasktype` on action item forms via `QuickCreatePayload`
- **`command-palette.tsx`** — Global Ctrl+K search dialog (cmdk + shadcn Dialog). Searches TanStack Query cache client-side across all entities. Must be rendered inside `<HashRouter>` because it uses `useNavigate()`
- **`copilot-chat.tsx`** — Floating Copilot Studio agent button. Opens the Copilot Studio webchat in a popup window (`window.open`) so the agent handles its own auth natively. No iframe, no Direct Line, no MSAL, no `botframework-webchat`. Blue gradient floating button (bottom-right, `MessageCircle` icon). Clicking opens a popup; clicking again focuses the existing popup or opens a new one if closed
- **`ui/`** — shadcn/ui primitives (Button, Dialog, Table, Select, etc.) + `ViewToggle` component for list/card view switching + `TileColorDots` component for priority color-coding on cards. Table component uses compact density (`h-8` headers, `py-1.5` cells)
- **`theme-provider.tsx`** — React context for light/dark theme toggling. Persists in localStorage, respects OS `prefers-color-scheme` on first visit. Toggles `.dark` class on `<html>`

### Data Hooks (`src/hooks/`)

- `use-accounts.ts` — TanStack Query hooks wrapping `AccountsService` (CRUD + cache invalidation)
- `use-contacts.ts` — TanStack Query hooks wrapping `ContactsService` (CRUD + cross-entity cache invalidation for accounts)
- `use-action-items.ts` — TanStack Query hooks wrapping `Tdvsp_actionitemsService` (CRUD + cache invalidation)
- `use-meeting-summaries.ts` — TanStack Query hooks wrapping `Tdvsp_meetingsummariesService` (CRUD + cache invalidation)
- `use-ideas.ts` — TanStack Query hooks wrapping `Tdvsp_ideasService` (CRUD + cache invalidation)
- `use-projects.ts` — TanStack Query hooks wrapping `Tdvsp_projectsService` (CRUD + cache invalidation)
- `use-view-preference.ts` — localStorage-backed hook for persisting table/card view mode per entity

All entity hooks filter `statecode eq 0` to return only active records.

### Utilities (`src/lib/`)

- `utils.ts` — `cn()` helper for Tailwind class merging
- `get-parent-account-id.ts` — Extracts account GUID from a contact, working around Dataverse polymorphic lookup field naming
- `azure-openai.ts` — Azure OpenAI integration for AI action item extraction. Calls a chat completion endpoint to parse meeting notes into structured action items. Configured via Vite env vars (`VITE_AOAI_ENDPOINT`, `VITE_AOAI_API_KEY`, `VITE_AOAI_DEPLOYMENT`). Maps AI priority strings to Dataverse numeric choice keys
- `tile-colors.ts` — Priority-to-color mapping for card view color-coding. Defines 5 tile colors (clear, blue, orange, red, dark-red), background CSS classes with dark-mode variants (`dark:bg-*-950/40`), `tileGradient()` for subtle priority-tinted gradient backgrounds on board cards (detects `.dark` class on `<html>` for dark-aware gradients), and localStorage helpers for entities without a Dataverse priority field (e.g., accounts)

### Generated Code (`src/generated/`, `.power/`)

Auto-generated by `pac code add-data-source`. Read-only — do not edit.

- `services/AccountsService.ts`, `services/ContactsService.ts`, `services/Tdvsp_actionitemsService.ts`, `services/Tdvsp_meetingsummariesService.ts`, `services/Tdvsp_ideasService.ts`, `services/Tdvsp_projectsService.ts` — Typed CRUD operations (HVA service still present in generated code but unused)
- `models/AccountsModel.ts`, `models/ContactsModel.ts`, `models/Tdvsp_actionitemsModel.ts`, `models/Tdvsp_meetingsummariesModel.ts`, `models/Tdvsp_ideasModel.ts`, `models/Tdvsp_projectsModel.ts` — Dataverse entity types

## Data Flow

1. Component mounts → TanStack Query hook fires → Generated service calls Dataverse via host proxy
2. User submits form → Mutation fires → `onSuccess` invalidates relevant query keys (contacts mutations also invalidate accounts)
3. Query invalidation triggers automatic refetch → UI updates

## Routing

HashRouter (`/#/accounts`, `/#/contacts`, `/#/action-items`, `/#/meeting-summaries`, `/#/ideas`, `/#/projects`, `/#/board`) — required by Power Platform host iframe which controls the outer URL.

## Theming

The app uses a Microsoft Fluent Design-inspired theme built on CSS custom properties (HSL) in `src/index.css`:

- **Primary:** Microsoft Blue (`#0078D4`) — buttons, focus rings, table headers, active states
- **Sidebar:** White/card background, collapsible from 208px to 56px via a floating chevron toggle (state persists in `localStorage`). Briefcase icon + "My Work" brand, grouped nav items with small-caps section headers (insights, activity, capture, core). Collapsed state shows icon-only with hover tooltips to the right; section labels become thin dividers. Nav icons are colored to match their quick create counterparts (red, emerald, pink, violet, teal, sky). Active item has a 3px cyan left border (`#00BCF2`) and blue text (or background tint when collapsed). "Board" is renamed to "My Board" in the insights section
- **Quick Create Bar:** Horizontal bar at top of content area with colored pill buttons (pastel backgrounds, dark-aware variants) for creating records. Order: work, personal, learning (task-type presets that pre-set `tdvsp_tasktype`), idea, meeting, project (violet), account, contact. Work/personal/learning pills open the action item form with the task type pre-selected via `QuickCreatePayload`
- **Background:** Light blue-gray (`hsl(225, 20%, 97%)`) in light mode; dark slate (`hsl(222, 20%, 10%)`) in dark mode
- **Tables:** Blue header band with white uppercase text, card-elevated wrapper with shadow. Compact density: `h-8` headers, `py-1.5` cells
- **Dialogs:** Capped at `85vh` with internal scroll for long forms
- **Typography:** Monospace font stack (JetBrains Mono, Fira Code, Cascadia Code, Consolas, system monospace) on `<body>` for a developer-tooling aesthetic

All colors flow through CSS variables consumed by shadcn/ui components via the `@theme inline` block in `index.css`.

### Dark Mode

Dark mode is implemented via a `ThemeProvider` context (`src/components/theme-provider.tsx`) wrapping the entire app in `App.tsx`. It toggles a `.dark` class on `<html>` and persists the choice in `localStorage`. On first visit, it respects the OS `prefers-color-scheme` media query.

Tailwind v4 integration uses `@custom-variant dark (&:where(.dark, .dark *))` in `index.css` so that `dark:` utility classes work with the class-based strategy (no `prefers-color-scheme` media query at the Tailwind level).

The dark color palette is a complete set of CSS custom properties in `index.css .dark {}` — background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, and sidebar gradient. Quick create pill buttons, tile background classes, and `tileGradient()` in `tile-colors.ts` all include dark-aware variants.

A toggle button (Sun/Moon icon) sits in the sidebar footer beneath the Ctrl+K shortcut hint.

## Dataverse Metadata Tooling (`scripts/`)

Python-based tooling for managing `TheDataverseSolution` schema from the repo. The plugin's stock `dv-connect` Python SDK is preferred for record CRUD and table/column creation; these scripts specifically cover metadata description writes, which the SDK doesn't yet expose.

- **`scripts/auth.py`** — Azure Identity credential helper shared by every Python script. Patched for **US Gov Cloud**: detects `crm9` in `DATAVERSE_URL` and uses `AzureAuthorityHosts.AZURE_GOVERNMENT` + a separate persisted auth-record file (`dataverse_cli_auth_record_gov.json`) so the GCC login doesn't collide with a commercial-cloud record on the same machine. Device code flow caches into OS credential storage; new processes silently refresh. **Do not overwrite** this file with the vanilla plugin `auth.py` without re-applying the Gov patches.
- **`scripts/list-solution-tables.py`** — SDK-based discovery. Queries `solution` where `friendlyname == "The Dataverse Solution"`, reads `solutioncomponent` rows filtered to `componenttype eq 1` (Entity), then resolves each `objectid` (MetadataId) via `/api/data/v9.2/EntityDefinitions({id})`. For `tdvsp_` tables it pulls the full attribute list (Dataverse `$filter startswith` isn't supported on MetadataEntities, so filtering is client-side). Writes a structured JSON snapshot to `solution-tables.json`.
- **`scripts/apply-descriptions.py`** — Read-modify-write loop. Reads `descriptions-plan.json`, then for each table GETs the full `EntityDefinition`, injects the new Description label, and PUTs the whole object back. Attribute descriptions require a typed cast URL (e.g. `/Attributes({MetadataId})/Microsoft.Dynamics.CRM.StringAttributeMetadata`). Both requests send `MSCRM.MergeLabels: true` (preserve other-language labels) and `MSCRM.SolutionName: TheDataverseSolution` (track the change in the unmanaged solution). After all writes succeed it calls `PublishAllXml`. Failures halt the publish step.

### Why read-modify-write (not PATCH or per-property PUT)

Dataverse metadata endpoints have parity with the .NET SDK's `UpdateEntityRequest` / `UpdateAttributeRequest`, which replace the entire object. Per Microsoft Learn: *"You can't use PATCH to update data model entities… you must use PUT… and include all the existing properties that you don't intend to change. You can't update individual properties."* Attempting `PATCH EntityDefinition(...)` returns `405 Operation not supported on EntityMetadata`, and `PUT .../Description` returns `400 Argument must be of type...` because the endpoint expects a full entity body. The working pattern is: GET full object → mutate the one field → PUT the whole thing back.

## Dataverse Solution as Source of Truth

`TheDataverseSolution` is exported (unmanaged) and unpacked into `./solutions/TheDataverseSolution/` after every metadata change. The XML under `Entities/<EntityName>/Entity.xml` holds the authoritative `<Descriptions>` block for each table and column — if you need to audit what a Copilot Studio agent sees, read the solution XML rather than trusting the live environment.

```
solutions/TheDataverseSolution/
  Entities/
    Account/Entity.xml
    Contact/Entity.xml
    tdvsp_ActionItem/Entity.xml
    tdvsp_HVA/Entity.xml
    tdvsp_Idea/Entity.xml
    tdvsp_Impact/Entity.xml
    tdvsp_MeetingSummary/Entity.xml
    tdvsp_Project/Entity.xml
  OptionSets/                  # tdvsp_ideacategory, tdvsp_taskpriority, tdvsp_taskstatus, tdvsp_tasktype
  Other/                       # Customizations.xml, Relationships.xml, Solution.xml
  AppModules/ + AppModuleSiteMaps/  # tdvsp_OGsApp (model-driven app stub)
  WebResources/                # tile icons (blueprint, briefcase, checklist, etc.)
```

## Non-App Artifacts

### `demo-materials/`

Companion presentation for the tech series — "Code Apps: Under the Hood." Contains `generate-deck.py` (python-pptx + fpdf2), which produces `code-apps-under-the-hood.pptx` (6-slide deck) and `code-apps-under-the-hood-talk-track.pdf` (speaker notes). The script is the single source of truth for both outputs. Slide content draws on runtime analysis from the DevTools export in `inbox/`.

### `inbox/`

Raw source artifacts. Currently contains `08587a10-83ed-43d0-8be4-8b145f5a7ee3.devtools` — an HTML export from browser DevTools of the deployed Code App, analyzed to extract runtime facts (77 scripts, 230KB localization, ClassicCanvasApp classification, 55 feature gates, `paauth`/`dynamicauth` auth, Copilot sidecar, sovereign cloud support, a11y).

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| No `$select` on queries | Computed/formatted fields return zero rows when selected — omit to get all fields |
| Cross-entity cache invalidation | Contact mutations invalidate accounts queries so the account detail contact list stays fresh |
| `getParentAccountId()` helper | Dataverse returns polymorphic lookup GUIDs as `_parentcustomerid_value` at runtime, but the generated type only declares `parentcustomerid` |
| Account name resolution via `useAccounts()` | `parentcustomeridname` isn't populated by the Power Apps SDK on read — resolve names by joining with accounts data |
| Choice field labels in `labels.ts` | Dataverse choice enums use numeric keys with mangled display names — a shared labels file maps keys to human-readable strings and badge variants |
| Dashboard tooltips via CSS `group-hover` | No tooltip library installed — uses Tailwind `group/tip` + `group-hover/tip` for zero-dependency hover tooltips. `position` prop controls above/below placement to avoid viewport clipping |
| Dashboard drilldown via inline filter | Each click handler computes a filtered `ActionItem[]` inline and passes it to a shared `DrilldownDialog`. Reverse-lookup maps (`STATUS_KEY_BY_LABEL`, etc.) convert display labels back to Dataverse numeric keys |
| Customer lookup via OData bind | Action items use `tdvsp_Customer@odata.bind` with `/accounts(guid)` format for writes, `_tdvsp_customer_value` for reads — same polymorphic pattern as contacts |
| Account/Contact lookups on Ideas | Ideas use both `tdvsp_Account@odata.bind` and `tdvsp_Contact@odata.bind` for writes, with `_tdvsp_account_value` / `_tdvsp_contact_value` for reads |
| Meeting Summary account lookup | Uses `tdvsp_Account@odata.bind` for writes, `_tdvsp_account_value` for reads |
| Idea category labels in `labels.ts` | Same pattern as action item choice fields — numeric keys mapped to human-readable labels (Copilot Studio, Canvas Apps, Azure, etc.) |
| AI extraction via Azure OpenAI | Meeting summary detail view offers "Extract Action Items with AI" — calls Azure OpenAI chat completion, parses JSON response into structured action items, maps priority strings to Dataverse choice keys, and bulk-creates via the action items mutation. Gracefully degrades with a toast if env vars aren't configured |
| Command palette inside HashRouter | `CommandPalette` uses `useNavigate()` so it must be rendered inside `<HashRouter>`. Rendering it outside crashes React with a white screen |
| Client-side command palette search | Ctrl+K searches TanStack Query cache — no extra Dataverse API calls. Results grouped by entity with highlighted matches |
| Table/card view toggle | All 5 entity lists support a toggle between table and card views. Preference is stored per entity in `localStorage` via `useViewPreference()`. Card view uses a responsive 3-column grid of shadcn `Card` components |
| Priority tile color-coding | Card views show a 5-dot color picker (clear/blue/orange/red/dark-red) on hover. For action items and ideas, clicking a dot PATCHes `tdvsp_priority` in Dataverse immediately. Accounts use localStorage since they lack a priority field. Background color derived from priority via `tile-colors.ts` |
| Board (Kanban) view | A cross-entity Kanban board showing 4 columns: parking lot (pinned items, green/Car), work (wider 2fr column, dynamic accent/icon/title per active filter), projects, ideas. Cards are clickable (open edit dialogs). Custom collision detection combines closestCenter (within-column reorder) and pointerWithin (cross-column drops). Drop-target columns glow with accent color. Compact card toolbar with backdrop-blur. Car icon for park/unpark (replaces Pin). Dark-mode-aware gradients. Sort order persists in localStorage |
| Active records only | All entity hooks filter `statecode eq 0` to exclude inactive/deactivated records from all list views, dashboards, and lookups |
| Project lookups on Ideas/Meetings | Ideas and meeting summaries use `tdvsp_Project@odata.bind` → `/tdvsp_projects(guid)` for writes, `_tdvsp_project_value` for reads |
| Dark mode via class strategy | `ThemeProvider` toggles `.dark` on `<html>`, persists in localStorage, respects OS preference. Tailwind v4 `@custom-variant dark (&:where(.dark, .dark *))` enables `dark:` utilities without a media query. Full CSS variable palette in `.dark {}` block |
| Monospace font stack | JetBrains Mono > Fira Code > Cascadia Code > Consolas > system monospace — developer-tooling aesthetic that reads well in data-dense tables |
| Action item type filters | Client-side pill filters (All/Work/Personal/Learning) on the action items list toolbar. Filters on `tdvsp_tasktype` field. Inline type icons (Briefcase, House, BookOpen) replace the Customer column for a more compact, scannable table |
| Compact table density | `TableHead` reduced to `h-8 px-3`, `TableCell` to `px-3 py-1.5` — fits more rows on screen without scroll, important for demo flow |
| Custom board collision detection | Combines `closestCenter` (within-column sortable reorder) with `pointerWithin` (cross-column droppable detection). Prevents cards from "jumping" to the wrong column during drag |
| Clickable board cards | All board cards have `cursor-pointer` and `onClick` that opens the entity's edit form dialog, providing a fast path to editing without needing the pencil toolbar button |
| Copilot Studio via popup window | The agent opens in a popup window (`window.open`) instead of an iframe or Direct Line embed. The Code App's `@microsoft/power-apps` SDK uses custom `paauth`/`dynamicauth` tokens incompatible with Direct Line's SSO token exchange, and iframe embedding had CSP/auth friction. A popup window lets Copilot Studio handle its own auth natively with zero dependencies |
