# UI Improvement Prompts — Session Reference

Prompts from the session that added tile color-coding, priority dots, and new Dataverse fields. Adapt entity names, field names, and table prefixes for your target app.

---

## 1. Tile Color-Coding

> give me the ability to color code tiles, light blue, light orange, light red

**What it does:** Adds small colored dots to tile views. Hover over a tile to reveal dots in the top-right corner. Click a dot to tint the tile background. Stored in localStorage.

---

## 2. Add Color Dots to Dashboard Tiles Too

> perfect but need those on dashboard tiles too

**What it does:** Extends the tile color picker to dashboard column items (not just entity page tile views).

---

## 3. Scope Colors to Specific Entities

> only ideas, projects, and action items need the colors. you can remove them from the other tables.

**What it does:** Removes color-coding from entity pages that don't need it (e.g., Accounts, Contacts, Impacts, Meeting Summaries).

---

## 4. Add New Lookup and Choice Fields

> need to add some new fields to the new, edit, and view forms for ideas. idea now has project lookup to the projects table. it also has a priority (task priority choice list) and meeting summaries have a project lookup now too. i put a customizations.xml file in a new folder named inbox... you should be able to get exact schema names there

**What it does:** Adds new Dataverse fields to the TypeScript types, service layer (OData queries, create/update functions), and all form dialogs (new, view, edit). Uses the customizations.xml as the source of truth for schema names and navigation properties.

---

## 5. Sync Quick Create Forms with Entity Page Forms

> the quick create forms need to match the other forms launched from the table views

**What it does:** Adds the same new fields (Priority, Project dropdowns) to the dashboard's quick create dialogs so they match the full forms on the entity pages.

---

## 6. Add Personal Page Colors

> personal tasks need the colors too

**What it does:** Extends tile color-coding to the Personal page (which shows the same action items as Tasks, filtered to personal type).

---

## 7. Expand the Color Spectrum

> add 2 more dots in the color spectrum. an empty dot on the far left so i can reset it, and a darker red dot on the far right.

**What it does:** Adds a clear/reset dot (hollow circle) on the left and a dark red dot on the right. Full spectrum: clear, blue, orange, red, dark red.

---

## 8. Color Dots = Priority (the big one)

> here's the big one. those color dots should not only change the color of the tile, they should set the priority of the item, e.g. "eh..", "low..", "high..", "top..."... and when one is selected you should update the record w the appropriate priority immediately.

**What it does:** Maps each color dot to a priority value. Clicking a dot immediately PATCHes the record's priority field in the backend and refreshes the data. The tile background color is now derived from the item's priority, not localStorage. Entities without a priority field (e.g., Projects) keep localStorage-based colors.

**Color-to-priority mapping:**
| Dot | Color | Priority |
|-----|-------|----------|
| (empty) | clear | no priority |
| blue | light blue | Low |
| orange | light orange | Eh |
| red | light red | High |
| dark red | darker red | Top Priority |
