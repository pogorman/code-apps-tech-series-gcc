# 5 Board Column Headers & Card Enhancement — Tracked Notes

> Append with `/track name:5-dboard-col-headers-and-card-enhance`.

---

## 1. Card Visual Polish (All 9 Enhancements)

**Date:** 2026-03-26

### User Prompt

> the cards on the board need to be more polished looking what can you do

### What Was Done

All 9 proposed enhancements were implemented in `board-dashboard.tsx` and `tile-colors.ts`:

**Hover lift + graduated shadows:**
- Cards get `-translate-y-0.5` on hover with `shadow-sm → shadow-md` escalation
- Drag state applies `scale-[1.03]`, `rotate-[1.5deg]`, `ring-2 ring-primary/40`, and `shadow-xl` for a tactile feel

**Card inner structure:**
- Thin `border-t border-border/30` divider separates title/metadata from badges
- Description indented with `pl-[1.375rem]` to align under title (past the icon)

**Entity type icons on cards:**
- Each card shows its entity icon inline with the title: `Briefcase` (action items), `FolderKanban` (projects), `Lightbulb` (ideas), `FileText` (meeting summaries)
- Parking lot cards use a `KIND_ICON` lookup map to render the correct icon per `kind`

**Description snippet:**
- 1-line truncated `tdvsp_description` shown below the title when available (`line-clamp-1`, `text-xs text-muted-foreground/80`)
- All four entity types have `tdvsp_description` on their generated models

**Subtle gradient cards:**
- New `tileGradient()` function in `tile-colors.ts` returns a `linear-gradient(to bottom, ...)` CSS value per priority color
- Applied via inline `style={{ backgroundImage: tileGradient(colorIdx) }}` alongside the existing `tileBgClass()` class
- Priority-tinted top-to-bottom fade: blue, orange, red, dark-red, or neutral white

**Glass-morphism column headers:**
- Sticky header with `bg-background/60 backdrop-blur-md border-b border-border/30`
- Outer column wrapper gets `backdrop-blur-sm`

**Column count badge:**
- Replaced plain text number with pill-shaped badge: `rounded-full`, accent-tinted background (`${accent}20`), accent-colored text

**Improved empty state:**
- Large faded column icon (`h-8 w-8`) with "No items" text centered in empty columns

### Build Fix

- `tileGradient()` initially returned `GRADIENT_STYLES[colorIndex] ?? GRADIENT_STYLES[0]` — TypeScript strict mode flags `Record<number, string>` index as `string | undefined`. Fixed by extracting `DEFAULT_GRADIENT` as a string literal.
- `pl-5.5` is not a standard Tailwind v4 utility — changed to `pl-[1.375rem]` arbitrary value.

---

## 2. Dynamic Work Column (Accent, Icon, Title per Filter)

**Date:** 2026-03-26

### User Prompt

> work vertical column. accent color should be red when it's work with the briefcase. when it's personal, it should be blue with a house icon, when is learning it should be magenta with a book icon. the filter capsule buttons should be smaller and on the same line as the title, eg work, personal, learning, all... but only use the first letter A, W, P, and L.

### What Was Done

**New filter config with accent + icon:**

| Filter | Letter | Accent | Icon |
|--------|--------|--------|------|
| All | A | `#6b7280` (gray) | `LayoutGrid` |
| Work | W | `#ef4444` (red) | `Briefcase` |
| Personal | P | `#3b82f6` (blue) | `House` |
| Learning | L | `#d946ef` (magenta) | `BookOpen` |

- `WORK_FILTERS` array expanded with `letter`, `accent`, and `icon` fields
- `workFilterConfig()` helper returns `{ accent, icon, title }` for any filter value
- Static `ACCENT.work` removed — accent is now dynamic

**Column header changes:**
- `SortableColumn` gained `headerInline` prop (replaces `headerExtra`) — renders content on the same row as the icon + title
- Filter pills are tiny `h-5 w-5` circles with single letters, pushed right via `ml-auto`
- Active pill uses its filter's accent color as background with white text
- `transition-colors duration-200` on accent bar, icon, and count badge for smooth filter transitions

**Title follows filter:**
- "all" when unfiltered, "work" / "personal" / "learning" when filtered
- Initially title said "work" for the All filter — fixed per user feedback to say "all"
- "All" icon initially `Briefcase` — changed to `LayoutGrid` (4-square grid) per user feedback

**Per-card task type selector updated:**
- Text pills replaced with tiny icon circles matching each filter's icon + accent color

---

## 3. Icon + Count Badge Overlap Pattern

**Date:** 2026-03-26

### User Prompt

> take the count pill and move it just slightly below and to the right but sorta overlapping the type icon, then have the text title. make sure you do the same w parking lot, projects, and ideas

### What Was Done

All four columns now use the same pattern in `SortableColumn`:

```tsx
<div className="relative shrink-0 mr-1">
  <Icon className="h-5 w-5" style={{ color: accent }} />
  <span className="absolute -bottom-1.5 -right-2 ... rounded-full border border-background"
        style={{ background: accent, color: "#fff" }}>
    {ids.length}
  </span>
</div>
<h2>{title}</h2>
```

- Icon bumped to `h-5 w-5` (from `h-4 w-4`) to give the badge room
- Count badge: `absolute -bottom-1.5 -right-2`, white text on accent background, `border border-background` for cutout effect
- Badge is `h-4` with `text-[9px] font-bold`
- Old `ml-auto` count span removed — count is now always overlapping the icon
- `hideDefaultCount` prop added then removed — final solution uses the overlapping badge for all columns uniformly

### Key Decision

The work column's `headerInline` only contains the filter pills (pushed right with `ml-auto`). The count is handled by the shared icon-overlap pattern in `SortableColumn`, same as every other column.
