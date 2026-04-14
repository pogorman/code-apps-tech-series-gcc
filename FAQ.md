# FAQ

## Why can't I use `$select` in Dataverse queries?

Computed and formatted fields (like `statecodename`, `parentcustomeridname`) cause silent zero-row returns when included in `$select`. Omit `$select` entirely to get all fields.

## Why doesn't `parentcustomeridname` show the account name?

The Power Apps SDK doesn't populate `parentcustomeridname` on read for polymorphic lookups. We resolve account names by fetching all accounts via `useAccounts()` and matching by ID using `getParentAccountId()`.

## Why the double cast in `getParentAccountId()`?

TypeScript strict mode rejects a direct cast from `Contacts` to `Record<string, string>` because the types don't overlap. Casting through `unknown` first satisfies the compiler: `(contact as unknown as Record<string, string>)._parentcustomerid_value`.

## Why HashRouter instead of BrowserRouter?

Power Platform host iframes control the outer URL. HashRouter keeps routing within the fragment (`/#/accounts`) so it doesn't conflict with the host.

## Why do contact mutations invalidate the accounts query key?

The account detail dialog shows contacts linked to that account. When a contact is created, updated, or deleted, we invalidate the accounts cache so that list refreshes automatically.

## How do I add a new Dataverse table?

```bash
pac code add-data-source -a dataverse -t <logicalname>
```

Then create hooks in `src/hooks/use-<table>.ts` and components in `src/components/<table>/`.

## How is the Microsoft theme implemented?

All colors are CSS custom properties (HSL) in `src/index.css`, consumed by shadcn/ui components via Tailwind's `@theme inline` block. The title bar and nav tiles use direct Tailwind classes with hex colors for the dark gradient. No separate theme package is needed — just CSS variables.

## Why do dialogs scroll instead of growing?

`DialogContent` has `max-h-[85vh] overflow-y-auto` to prevent tall forms (like the contact form with 12 fields) from running off-screen. The entire dialog scrolls internally.

## How do action item choice fields (Priority, Status, Type) work?

Dataverse choice fields use numeric keys (e.g., `468510002` = "Top Priority"). The generated model has mangled display names that aren't user-friendly. A shared `labels.ts` file in `src/components/action-items/` maps these numeric keys to clean labels and assigns badge color variants (e.g., Top Priority = destructive red).

## How does the action item Customer lookup work?

Same polymorphic pattern as the contact → account relationship. Writes use `tdvsp_Customer@odata.bind` with OData bind syntax (`/accounts(guid)`). Reads come back as `_tdvsp_customer_value` (GUID) and `tdvsp_customername` (display name). The form populates an account dropdown; the list and detail views resolve via `tdvsp_customername` with a fallback to the accounts lookup map.

## How does the Meeting Summary Account lookup work?

Writes use `tdvsp_Account@odata.bind` with `/accounts(guid)` format. Reads return `_tdvsp_account_value` (GUID) and `tdvsp_accountname` (display name). Same OData bind pattern as the other entities.

## How does the Idea entity handle two lookups (Account + Contact)?

Ideas have both `tdvsp_Account@odata.bind` and `tdvsp_Contact@odata.bind` for writes. Reads use `_tdvsp_account_value` / `tdvsp_accountname` and `_tdvsp_contact_value` / `tdvsp_contactname`. The form shows both an account and a contact dropdown populated from `useAccounts()` and `useContacts()`.

## How do Idea category choice fields work?

Same pattern as action item Priority/Status/Type. The `tdvsp_category` field uses numeric keys (e.g., `468510000` = "Copilot Studio"). A shared `labels.ts` in `src/components/ideas/` maps these to clean labels: Copilot Studio, Canvas Apps, Model-Driven Apps, Power Automate, Power Pages, Azure, AI General, App General, Other.

## How do dashboard tooltips and drilldown cards work?

Hover any dashboard tile (KPI card or chart sub-element) to see a tooltip previewing the underlying data — item count, first 4 item names, and a "Click to view details" hint. Click to open a drilldown dialog showing a full filtered table of the action items behind that visualization. Tooltips use a pure CSS approach (Tailwind `group/tip` + `group-hover/tip`) — no tooltip library. KPI cards at the top use `position="below"` to avoid clipping off the viewport; chart sub-elements use `position="above"` (default). Reverse-lookup maps (`STATUS_KEY_BY_LABEL`, `PRIORITY_KEY_BY_LABEL`, `TYPE_KEY_BY_LABEL`) convert display labels back to Dataverse numeric choice keys for filtering.

## How does the "Extract Action Items with AI" feature work?

On the Meeting Summaries page, click the sparkle icon on any meeting summary row to open the AI extraction dialog. It sends the meeting notes to Azure OpenAI (configured via `VITE_AOAI_ENDPOINT`, `VITE_AOAI_API_KEY`, `VITE_AOAI_DEPLOYMENT` env vars). The AI returns a JSON array of action items with name, priority, due date, and notes. You can review, edit, or remove items before confirming. On confirm, each item is created in Dataverse as a `tdvsp_actionitem` with the meeting's account linked automatically. If the env vars aren't set, the button shows a toast instead.

## How does the Command Palette (Ctrl+K) work?

Press Ctrl+K (or Cmd+K on Mac) to open a global search dialog. It searches across all entities (accounts, contacts, action items, meeting summaries, ideas, projects) using the TanStack Query cache — no extra Dataverse API calls. Results are grouped by entity type with matching text highlighted. Select a result to navigate to that entity's list page.

## Why did the app show a white screen after adding the Command Palette?

`CommandPalette` uses React Router's `useNavigate()` hook, which requires a `<Router>` ancestor. It was initially rendered outside `<HashRouter>` in `App.tsx`, causing an uncaught error that crashed the entire React tree. The fix was moving `<CommandPalette />` inside `<HashRouter>`.

## How does the table/card view toggle work?

Each entity list (Accounts, Contacts, Action Items, Meeting Summaries, Ideas, Projects) has a toggle in the toolbar between the search bar and the "New" button. Click the list icon for table view or the grid icon for card view. Card view shows a responsive 3-column grid of shadcn `Card` components with the same click-to-view, edit, and delete actions. Your preference is saved per entity in `localStorage` via the `useViewPreference()` hook, so it persists across sessions.

## What is the Board view?

The Board (`/#/board`, labeled "My Board" in the sidebar) is a Kanban-style dashboard with four vertical columns pulling from multiple entities. **Parking lot** (green accent, Car icon) shows items pinned via `tdvsp_pinned` from any entity — identified by entity-type icons instead of text badges. **Work** has a dynamic accent color, icon, and title that change based on the active task-type filter (All=gray/LayoutGrid, Work=red/Briefcase, Personal=blue/House, Learning=magenta/BookOpen). **Projects** (purple accent, FolderKanban icon) shows all `tdvsp_project` records. **Ideas** (amber accent, Lightbulb icon) shows all ideas. Columns have glass-morphism sticky headers (`backdrop-blur-md`, `bg-background/60`) with overlapping accent-colored count badges and large faded icons for empty states. Cards show entity-type icons inline with titles (h-3 w-3), 1-line description snippets, priority-tinted gradient backgrounds via `tileGradient()`, hover lift (`-translate-y-0.5`), and graduated shadows (sm to md to xl for drag). Drag state adds `scale-[1.03]`, `rotate-[1.5deg]`, `ring-2 ring-primary/40`. Outline-style pills (priority bottom-left, status bottom-right) replace Badge components. Floating toolbar on hover: drag grip, priority color dots, edit pencil, pin toggle.

## How do the color dots on card views work?

Hover over any card in card view to reveal a row of 5 colored dots (clear, blue, orange, red, dark-red). Click a dot to set the card's priority color. For action items and ideas, clicking a dot immediately PATCHes the `tdvsp_priority` field in Dataverse — no save button needed. Accounts don't have a priority field in Dataverse, so their color is stored in localStorage. The card background color updates to reflect the chosen priority. Color mapping is in `src/lib/tile-colors.ts`.

## How does drag-and-drop work on the Board?

The Board uses a single `@dnd-kit` `DndContext` with `useDroppable` on each column. **Within-column drag** reorders cards via `SortableContext` + `arrayMove`; order persists in localStorage per column. **Cross-column drag** pins and unpins items: dragging a card from work/projects/ideas into parking lot sets `tdvsp_pinned = true` in Dataverse; dragging a parking lot card to any other column sets `tdvsp_pinned = false`. Cross-column drag does not change status or move records between entity types.

## Why does the Projects column show `tdvsp_project` records instead of accounts?

The Board was updated to show actual project records from the `tdvsp_project` Dataverse table instead of accounts. Projects have name, description, priority, and an account lookup — they represent discrete workstreams better than raw account records for Kanban tracking.

## How does the floating card toolbar work on the Board?

Hovering over any card on the Board reveals a floating `CardToolbar` in the top-right corner of the card (`-top-2.5 -right-2.5`). The toolbar contains (left to right): a GripVertical drag handle, 5 priority color dots, a separator, a Pencil edit button, and a Car icon button. The Car button is green when the item is parked. Click the pencil to open the entity's edit form dialog. Click the Car to toggle the `tdvsp_pinned` field in Dataverse. The toolbar uses `opacity-0 group-hover:opacity-100` for show/hide transitions. You can also **click any card directly** to open its edit form — no need to hover for the toolbar pencil.

## How does the Work column task type filter work?

The Work column header shows tiny h-5 w-5 circle filter pills with single letters (A/W/P/L) pushed to the right. Click a pill to filter the work column to only show action items of that task type. "A" (All) shows all active action items regardless of type. The column dynamically changes its accent color, icon, and title based on the active filter: All = gray/LayoutGrid/"all", Work = red/Briefcase/"work", Personal = blue/House/"personal", Learning = magenta/BookOpen/"learning". The `workFilterConfig()` helper returns the accent/icon/title for each filter state.

## What is the `tdvsp_pinned` field?

`tdvsp_pinned` is a boolean (Yes/No) field on Dataverse entities used to pin items to the parking lot column on the Board. It is not yet in the generated TypeScript types, so it is accessed via casting: `(item as Record<string, unknown>).tdvsp_pinned`. The `isItemPinned()` helper in `board-dashboard.tsx` handles both `true` and `1` values.

## Why do I only see active records?

All entity hooks filter by `statecode eq 0`, which returns only active records from Dataverse. Deactivated or deleted records are excluded from all list views, dashboards, card views, and the Board. This is intentional — the app shows your current work, not historical records.

## How does the project lookup work on Ideas and Meeting Summaries?

Ideas and meeting summaries gained a `tdvsp_Project@odata.bind` field. Writes use `/tdvsp_projects(guid)` format. Reads return the GUID as `_tdvsp_project_value`. The form shows a project dropdown populated from `useProjects()`. Same OData bind pattern as the account and contact lookups.

## How do the quick create task-type presets work?

The quick create bar has three separate pills for action items: **work**, **personal**, and **learning**. Each opens the action item form with the task type pre-selected via the `QuickCreatePayload` type in the Zustand store (`src/stores/quick-create-store.ts`). The `ActionItemFormDialog` accepts a `defaultTaskType` prop that the list component passes through when the quick create store has a payload. The full quick create order is: work, personal, learning, idea, meeting, project, account, contact.

## What are the outline-style pills on board cards?

Board cards use outline-style pills instead of solid Badge components. `priorityPillClass()` and `statusPillClass()` in `src/components/action-items/labels.ts` return `rounded-sm border` classes with semantic colors (red for top priority, blue for in progress, amber for pending, etc.). `categoryPillClass()` in `src/components/ideas/labels.ts` does the same for idea categories. Pills are absolutely positioned: priority bottom-left, status bottom-right.

## How is the left sidebar organized?

The sidebar groups nav items into four sections: **insights** (Dashboard, My Board), **activity** (Action Items), **capture** (Ideas, Meetings, Projects), and **core** (Accounts, Contacts). Nav icons are colored to match their quick create counterparts (e.g., red for work action items, emerald for ideas, violet for projects). The `NavItem` interface has an optional `color` field for this.

## How does dark mode work?

The app uses a `ThemeProvider` context (`src/components/theme-provider.tsx`) that manages a `"light"` or `"dark"` theme state. On mount, it checks `localStorage` first; if no stored preference, it falls back to the OS preference via `window.matchMedia("(prefers-color-scheme: dark)")`. Toggling the theme adds or removes the `dark` class on `<html>` and persists the choice in `localStorage`. All colors are CSS custom properties (HSL) defined in `src/index.css` under `:root` (light) and `.dark` (dark), consumed by shadcn/ui and Tailwind. The dark sidebar gradient inverts from navy to a bright Microsoft Blue/cyan.

## How do I switch themes?

Click the Moon/Sun button in the sidebar footer — below the Ctrl+K hint. Moon icon switches to dark mode; Sun icon switches back to light mode. The label reads "Dark mode" or "Light mode" depending on the current state.

## Why use `@custom-variant` instead of a media query for dark mode?

Tailwind v4 dropped the `darkMode: "class"` config option from `tailwind.config.ts`. The equivalent in v4 is `@custom-variant dark (&:where(.dark, .dark *));` at the top of `src/index.css`. This tells Tailwind that `dark:` utility classes should activate when the `.dark` class is present on an ancestor element, which is what the `ThemeProvider` toggles. Without this line, all `dark:` classes in the app would be silently ignored.

## How do the action item type filters work?

The Action Items list page has four filter pills below the header: **All**, **Work** (red, Briefcase icon), **Personal** (blue, House icon), and **Learning** (magenta, BookOpen icon). Clicking a pill sets a `typeFilter` state variable to the corresponding Dataverse numeric choice key (or `null` for All). The displayed list is filtered client-side via `useMemo`. Active pills invert to solid fill with white text; inactive pills show an outline style. Each table row also displays a small colored task-type icon (Briefcase, House, or BookOpen) inline with the action item name.

## Why was the Customer column removed from the action items list?

The Customer column added visual clutter without providing much value in a compact list view. Customer info is still visible in the action item detail dialog, form, and card view. Removing it freed up horizontal space for the task-type icon + name, priority badge, status badge, and date columns to breathe.

## Why the monospace font?

The body font is set to a monospace stack: `"JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", ui-monospace, monospace`. This gives the app a "developer tool" aesthetic that feels native to a Code Apps demo targeting technical audiences. It also improves table column alignment since all characters are the same width.

## What is the correct `region` value for GCC in `power.config.json`?

Use `"gccmoderate"`. This is NOT documented in the PAC CLI public docs — it was found by reading the PAC CLI source code at `node_modules/@microsoft/power-apps-cli/lib/CliUtils.js`. The switch statement maps region strings to Power Apps host URLs:

- `prod` → `https://apps.powerapps.com`
- `gccmoderate` → `https://apps.gov.powerapps.us`
- `gcchigh` → `https://apps.high.powerapps.us`
- `dod` → `https://play.apps.appsplatform.us`

Using `"gcc"`, `"usgov"`, or any other value maps to `undefined`, causing `pac code push` to fail with `getaddrinfo ENOTFOUND undefined`.

## Does GCC Power Platform use Azure Government?

No. GCC moderate Power Platform uses **commercial Azure AD** (`login.microsoftonline.com`), not Azure Government (`login.microsoftonline.us`). The GCC tenant is a separate commercial Azure tenant. When authenticating via Azure CLI for Dataverse API access, use `az cloud set --name AzureCloud` (not AzureUSGovernment) and log in to the GCC tenant: `az login --tenant <tenant-id> --scope https://<env>.crm9.dynamics.com/.default`.

## How do I collapse the sidebar?

Click the small chevron button floating on the sidebar's right edge. The sidebar collapses from 208px to a 56px icon-only rail. Hover any icon to see a tooltip with the page name. Click the chevrons again to expand. Your preference persists in `localStorage` under the key `sidebar-collapsed`.

## Why do dashboard tiles animate on load?

The dashboard uses a `dashRise` CSS keyframe animation (fade up + subtle scale) with staggered delays — KPI cards animate first, then chart panels cascade in. The board columns use the same animation with their own stagger. This creates a polished "data loading" feel for enterprise demos without requiring a motion library.

## What ports does local dev use?

Vite runs on port 3001 (`npm run dev`). The Power Platform proxy (`pac code run`) runs on its own port — use the URL it prints, not the Vite URL directly.

## What is in the `demo-materials/` folder?

A companion presentation deck for the Code Apps tech series. `code-apps-under-the-hood.pptx` is a 6-slide deck covering runtime internals, Dataverse gotcha stories, the AI-agent build process, and reusable patterns. `code-apps-under-the-hood-talk-track.pdf` is the full speaker notes. Both are generated by `generate-deck.py` using python-pptx and fpdf2.

## How do I regenerate the slide deck?

Run `pip install python-pptx fpdf2 && python generate-deck.py` from the `demo-materials/` folder. The script overwrites both the `.pptx` and `.pdf` files in place. Edit the slide content directly in `generate-deck.py` — it is the single source of truth for both outputs.

## What is the DevTools export in `inbox/`?

The file `inbox/08587a10-83ed-43d0-8be4-8b145f5a7ee3.devtools` is an HTML export from the browser DevTools of the deployed Power Platform Code App. It was analyzed to produce the "What's Actually Running" slide — documenting 77 scripts, 230KB of localization data, ClassicCanvasApp classification, 55 feature gates, server-side auth flows, the Copilot sidecar, sovereign cloud support, and accessibility annotations.

## What does the "Under the Hood" deck cover?

Six slides: (1) Title, (2) Runtime analysis from the DevTools export, (3) Two gotcha stories — Dataverse polymorphic lookups and Copilot Studio auth in Code Apps, (4) 18-phase agentic build with Claude Code, (5) Reusable patterns (TanStack Query cache, Zustand, dnd-kit + Dataverse, Tailwind v4 dark mode), (6) Live demo transition with 7 beats.

## Why do the Dataverse tables have such long descriptions?

Every table and `tdvsp_*` column in `TheDataverseSolution` has a rich, intent-oriented Description specifically written so a Copilot Studio agent using the Dataverse MCP server tool can discover them by natural language. Descriptions list synonyms ("task", "to-do", "follow-up"), call out relationships ("every action item belongs to one customer via `_tdvsp_customer_value`"), and spell out choice-field numeric keys inline (`468510002 = Top Priority`). The goal is that a user asking "show me all tasks due today for Contoso" gives the agent enough signal to pick `tdvsp_actionitem` and filter correctly without needing field-level prompt engineering.

## How do I update a table or column description?

Edit `descriptions-plan.json` in the repo root, then run `python scripts/apply-descriptions.py`. It does read-modify-write via the Web API, publishes customizations, and you should then re-export + unpack the solution to keep `./solutions/TheDataverseSolution/` in sync (see README).

## Why doesn't `PATCH EntityDefinition(...)` work for metadata updates?

Dataverse metadata endpoints mirror the .NET SDK's `UpdateEntityRequest` / `UpdateAttributeRequest`, which replace the entire object. `PATCH` returns `405 Operation not supported on EntityMetadata`, and a per-property PUT like `PUT .../Description` returns `400 Argument must be of type...` because the endpoint expects a full entity body. The working pattern is: GET the full object (for attributes, with a concrete type cast in the URL like `/Attributes({id})/Microsoft.Dynamics.CRM.StringAttributeMetadata`), mutate the field you want to change, and PUT the whole thing back with headers `MSCRM.MergeLabels: true` and `MSCRM.SolutionName: <UniqueName>`. This is exactly what `scripts/apply-descriptions.py` does.

## Why does `scripts/auth.py` have a separate auth-record file for Gov Cloud?

The og-code environment is US Gov Cloud (`crm9.dynamics.com`) — it authenticates against `login.microsoftonline.us`, not the default `login.microsoftonline.com`. The stock plugin `auth.py` from the `dataverse` skill plugin targets the commercial cloud, and its persisted `AuthenticationRecord` encodes the authority. If you share one record file between a commercial tenant and a Gov tenant, `DeviceCodeCredential` refuses to start (`got multiple values for keyword argument 'authority'`). The patched `auth.py` in this repo auto-detects Gov from the `DATAVERSE_URL`, sets `AzureAuthorityHosts.AZURE_GOVERNMENT`, and writes its record to `dataverse_cli_auth_record_gov.json` so it coexists with commercial-cloud auth records for other projects. Don't overwrite `scripts/auth.py` with the vanilla plugin version without re-applying the Gov patches.

## Why not use the Microsoft Copilot Studio connector for the agent integration?

Because it is **broken in GCC** as of 2026-04-13. The "native" Code App → Copilot Studio integration pattern (Microsoft Learn: *How to: Connect your code app to Microsoft Copilot Studio agents*) has you run:

```bash
pac code add-data-source -a "shared_microsoftcopilotstudio" -c <connectionId>
```

which generates a typed `MicrosoftCopilotStudioService.ExecuteCopilotAsyncV2()` client you can call from React. It would be a cleaner upgrade from this app's current popup-window integration — the chat UI could live fully inside the app, multi-turn would round-trip via `conversationId`, and auth would inherit from the Code App host.

**The blocker:** creating a `shared_microsoftcopilotstudio` connection in the GCC maker portal (`make.gov.powerautomate.us`) fails with:

> **AADSTS700030: Invalid certificate - the issuer of the certificate is from a different cloud instance.** (First Party OAuth2 Certificate flow, `invalid_client`)

The connector card is published globally — it appears in the Gov portal — but its backend First Party AAD identity is presenting a commercial-cloud-issued certificate to GCC Entra ID, which Gov rejects because the cert was issued by a different cloud authority. Microsoft Learn's Code App → Copilot Studio article has no GCC section at all and all its URL examples use the commercial `{id}.environment.api.powerplatform.com` hostname — a hint that the integration path was never certified for Gov.

**There is no CLI escape hatch.** `pac connection create` is Dataverse-only (service-principal auth, `--application-id` / `--client-secret` — no `--api-id` parameter for generic connectors), `pac code` has no `connection create` subcommand, and Microsoft Learn explicitly states the connection "must be created through the Power Apps maker portal UI." Any client hitting the same backend would hit the same OAuth2 Certificate flow and the same `AADSTS700030`.

**What we use instead:** the Phase 12 popup-window pattern (`src/components/copilot-chat.tsx`) — a floating button that opens the native Copilot Studio webchat URL via `window.open`. The agent handles its own auth natively, so no connector is required. If a deeper in-app chat is ever needed before Microsoft ships a GCC fix, the fallback is a Power Automate detour (Code App → flow → "Send a message to Copilot Studio agent"), since Power Automate's GCC runtime handles token acquisition differently and sidesteps the broken connector.

See `MEMORY.md` → "Copilot Studio connector is blocked in og-code" and `HOW-I-WAS-BUILT.md` → Phase 23 for the full investigation. Screenshot of the failing connection dialog is in `inbox/copilot-studio-connection-bug-in-gcc.png`.

## I see GCC Power Platform uses commercial Azure AD — why does Dataverse here use Gov?

That FAQ entry above ("Does GCC Power Platform use Azure Government?") was written when the app was pointed at a commercial-cloud GCC tenant via `az login`. This repo now targets a genuine **US Gov L4 / GCC High**-style environment at `https://og-code.crm9.dynamics.com/`, and the Python SDK path through `scripts/auth.py` does use the Gov authority. The commercial-Azure note still applies to the PAC CLI flow and to the seed-data PowerShell script. If you're confused about which authority applies, ask: *"am I authing as PAC CLI (commercial) or as the Python SDK (Gov)?"*
