# Claude Code Brief — Ideas

Companion to the Dashboard, Board, and Action Items briefs. Reuses shared tokens and components. This doc covers ONLY the Ideas page.

---

## Route
`/ideas` — under the "Capture" sidebar section. Capture-first UX: friction to capture should be near-zero; structure is optional and can be added later.

---

## Design posture
Lighter and more exploratory than Action Items. Warm yellow idea accents (`--idea: #eab308`), softer backgrounds (`--bg: #faf9fb`), compact default density. The page should feel like a sketchbook, not a ticketing system.

---

## Data

```ts
interface Idea {
  id: string;
  name: string;
  description?: string;
  category: 'ai_general' | 'azure' | 'copilot_studio' | 'canvas_apps'
          | 'model_driven' | 'power_automate' | 'power_pages'
          | 'app_general' | 'other';
  status: 'new' | 'validating' | 'planned' | 'archived';
  priority?: 'top' | 'high' | 'med' | 'low'; // optional — ideas may have none
  account?: Account;                           // optional
  tags: string[];
  linkedActionItemIds: string[];               // for "Promoted" filter + count
  capturedAt: string;                          // ISO
  capturedBy: User;
}
```

---

## Page structure

```
┌─ QuickCreate chips                                     ─┐
├─ Hero: title · stats · category distribution pills     ─┤
├─ Capture row: big search + export                      ─┤
├─ Saved-view tabs                                       ─┤
├─ Subtoolbar: filters · view-mode seg · column settings ─┤
├─ Content area (one of):                                 │
│   · Table view (default) — quick-add row + grouped rows │
│   · Gallery view — cards grouped by category            │
│   · Kanban view — columns by status                     │
└─ Fixed: bulk bar (when selection) · capture composer   ─┘
```

---

## Components

### `<CategoryStrip>`
Pills above the capture row. Each pill: colored dot · label · count.
- First pill is `All categories` (active = black bg). Filter by category on click.
- Category colors (dot + group badge tint):
  - AI General → red · Azure → blue · Copilot Studio → violet · Canvas → cyan
  - Model-Driven → indigo · Power Automate → amber · Power Pages → pink
  - App General → green · Other → slate

### `<CaptureComposer>` (floating, bottom-right, persistent)
Always visible on the Ideas route — this is the page's defining element.
- Yellow header: bulb icon · "Capture an idea" · `⌘⇧I` kbd hint.
- Textarea with casual placeholder ("What's the spark? No formatting, no pressure…").
- Foot row: Category chip (defaults to AI General, user-changeable), Account chip, Tag chip, Capture button.
- `⌘⇧I` from anywhere focuses textarea. `⌘↵` or the button captures.
- On capture: optimistically prepend to the current view's relevant group with a subtle flash animation; clear textarea.
- Can be minimized to a FAB (collapsed state remembered per user).

### `<QuickAdd>` (inline, sticky top of table)
Secondary capture surface inside table view. Dashed plus icon · single input · hint `↵ save · Tab add category`.

### `<SavedViewTabs>`
Defaults: `All`, `Mine`, `New this week`, `High potential`, `Promoted`, `Archived`.
- `High potential`: filter = status ∈ {new, validating} AND priority ∈ {top, high}.
- `Promoted`: filter = `linkedActionItemIds.length > 0`.
- `Archived`: filter = status = archived (hidden from other views by default).

### `<ViewModeSegment>`
Three icons: table, gallery, kanban. Persist per saved view.

### Table view `<IdeaRow>`
Compact by default (26px row). Columns:
1. Checkbox
2. **Idea** — bulb tile · name · description (single-line truncate)
3. **Account** — avatar + name, or dashed blank "— No account"
4. **Status** pill (`New`, `Validating`, `Planned`, `Archived`)
5. **Priority** pill (or muted "—" if unset)
6. **Tags** — 2–3 chip max, overflow hidden
7. **Linked** — count pill with link-icon if > 0, else em-dash
8. **Captured** — relative age (3d, 1w, 2mo)
9. **Actions** — hover-reveal `↗ Promote` (yellow) · delete (red)

No priority rail (ideas are fluid). No progress bar (no checklists on ideas).

Group rows: chevron · colored `<CategoryBadge>` · count. Same colors as the CategoryStrip.

### Gallery view `<IdeaCard>`
3-column grid per category group.
- Card: 10px radius, 12px padding, 130px min-height.
- Layout: bulb + name (2-line clamp) · description (2-line clamp) · foot row (status pill · priority pill · age, right-aligned).
- Hover: lift 1px + deeper shadow.
- Click card → open detail pane.

### Kanban view `<IdeaKanban>`
Columns fixed as status: `New · Validating · Planned · Archived`.
- Column: soft surface bg, 10px radius, count pill in header.
- Card: compact (name + tiny category badge + age).
- Drag to change status. Archived column shows items at 55% opacity.
- No WIP limits (ideas should flow freely).

### `<BulkBar>`
Reuses Action Items pattern but with idea-specific actions:
- `N selected` · **Promote to Action Items** (yellow) · Set category · Set account · Archive · Delete · ×
- Promote opens a confirm sheet showing which Ideas will become what type of Action Items.

---

## Promote → Action Item flow

Core capture→commit ritual. When promoting:
1. Confirm sheet: preview target Action Item for each selected Idea (editable before commit).
2. Default mapping:
   - `Idea.name` → `ActionItem.name`
   - `Idea.description` → `ActionItem.description`
   - `Idea.category` → `ActionItem.type` = `work`, tag = category label
   - `Idea.tags` → `ActionItem.tags`
   - `Idea.account` → `ActionItem.account`
   - `Idea.priority` → `ActionItem.priority` (default `med` if unset)
3. On commit:
   - Create Action Item(s); add `idea.id` to their `linkedIdeaId`.
   - Add new Action Item ID(s) to `idea.linkedActionItemIds`.
   - Idea status → `planned`.
   - Toast: "Promoted N ideas — view in Action Items" with link.

Promoted ideas stay searchable; nothing is deleted.

---

## Capture-first keyboard

- `⌘⇧I` (or `I` when no input focused): focus composer.
- `⌘↵` in composer: capture.
- `Esc` in composer: blur (does not clear draft).
- `/` focus page search · `F` focus filter bar · `V` cycle view mode.
- In table: `↑/↓` move cursor · `Space` select · `P` promote · `A` archive.

---

## Empty states

- Nothing captured yet: full-bleed illustration, warm yellow tones, CTA "Capture your first idea" wired to composer.
- No matches for filter: single-line "No ideas match these filters" + clear-filters.
- Category with 0 ideas is hidden.

---

## Tokens

Pulls shared tokens from `tokens.css` plus these Ideas-specific additions:

```css
--idea: #eab308;
--idea-soft: #fefce8;
--bg: #faf9fb;       /* slightly warmer than the rest of the app */
```

Category badge backgrounds use the `--t-*` tints; borders use corresponding `-200` tokens.

---

## Performance

- Virtualize table rows when count > 200.
- Gallery view: virtualize per-category lazily when total > 120.
- Kanban view: render all columns eagerly but cap each column body at 60 cards with "Show N more" footer.
- Composer textarea auto-saves draft to `localStorage['ideas.draft']` every 500ms.

---

## Accessibility

- Composer is a single `<form role="region" aria-label="Capture an idea">`; always in tab order.
- Category pills: `role="tablist"` / `role="tab"` with `aria-selected`.
- View segment: `role="tablist"` linking to the three panels via `aria-controls`.
- Kanban: drag targets expose `aria-dropeffect`; keyboard alternative via `Space` to grab + `←/→` to move + `Enter` to drop.
- Never convey category or status with color alone — label text always present.
