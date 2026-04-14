# User Guide

## Overview

This Code App provides a "My Work" interface for managing accounts, contacts, action items, meeting summaries, ideas, and projects stored in Dataverse. All views show active records only. The app uses a Microsoft Fluent Design-inspired theme with a left vertical sidebar for navigation and a top quick create bar for fast record creation.

The underlying Dataverse schema (`TheDataverseSolution`) is also wired up for natural-language discovery by a Copilot Studio agent using the Dataverse MCP server — every table and `tdvsp_*` custom column has a rich, synonym-aware description so the agent can route queries like "show me all tasks for Contoso" or "what's on the idea backlog" to the right entity without prompt engineering. See `ARCHITECTURE.md` and `FAQ.md` for details.

**Left Sidebar** — Collapsible. Briefcase icon + "My Work" brand at the top. Grouped navigation sections: insights (Dashboard, My Board), activity (Action Items), capture (Ideas, Meetings, Projects), core (Accounts, Contacts). Nav icons are colored to match their quick create counterparts. Active page is highlighted with a cyan left border. At the bottom of the sidebar: a dark/light mode toggle (Moon/Sun icon) and a Ctrl+K search hint. Click the small **chevron button** on the sidebar's right edge to collapse it to an icon-only rail. Hover any icon when collapsed to see the page name in a tooltip. Click the chevrons again to expand. Your preference is remembered across sessions.

**Quick Create Bar** — Colored pill buttons across the top of the content area. Buttons (left to right): work, personal, learning (these three open the action item form with the task type pre-selected), idea, meeting, project (violet), account, contact. Click any button to navigate to that entity's list and immediately open a new record form.

## Dark Mode

Click the **Moon** icon in the sidebar footer to switch to dark mode. The icon changes to a **Sun** — click it again to return to light mode. Your preference is saved in `localStorage` and persists across sessions. If no preference is saved, the app follows your OS setting (light or dark).

Dark mode inverts all colors: dark backgrounds, light text, and adjusted accent colors. The sidebar gradient changes from dark navy to a bright blue/cyan gradient.

## Dashboard

The Dashboard is the home view, showing action item analytics. KPI cards and chart panels use a glassmorphism surface (frosted blur, soft inset highlight, accent corner glow) and rise in with a subtle Framer Motion fade-up on load — header first, then KPIs, then chart cards. Animations are deliberately short (~450ms) so the page doesn't feel slow.

### KPI Cards (top row)

Four summary cards: Total Items, Completion Rate, In Progress, and High/Top Priority. Each card has a colored left accent border, a subtle glow, and an icon in a tinted glass badge. Hover any card to see a frosted-glass tooltip with item count and first 4 item names. Click to open a drilldown table showing all matching action items.

### Charts (bottom row)

Four chart panels: Status Breakdown (SVG donut with background track ring), Priority Distribution (**Recharts** animated horizontal bars, one per priority, with rounded ends and count labels), Task Types (segmented overview bar + per-type icons and progress bars), and Items by Account (progress bars). Each panel has a colored accent line at the top and a vertical bar indicator next to the section title.

**Priority bars:** Hover any bar to see an interactive Recharts tooltip (rendered in the same glass popover style as the rest of the dashboard) showing the priority label, exact count, and a "Click bar to drill down" hint. Click a bar to open the full drilldown dialog for that priority — same behavior as clicking any other dashboard element.

Every other chart sub-element is independently hoverable and clickable: hover for a frosted-glass tooltip preview, click for a full drilldown table.

### Drilldown Dialog

Clicking any dashboard element opens a dialog with a filtered table of action items. Columns: Name, Customer, Priority (color-coded badge), Status (color-coded badge), and Date. The dialog scrolls internally for long lists.

## Board (Kanban View)

Click **My Board** in the sidebar to open a Kanban-style view with four columns:

- **Parking Lot** (green accent, Car icon) — Items pinned from any entity. Cards show an entity-type icon (Briefcase, FolderKanban, Lightbulb, or FileText) inline with the title instead of a text badge.
- **Work** (dynamic accent) — All non-complete action items (excludes Complete only; Recognized and all other statuses are shown). Cards show name, 1-line description snippet, and outline-style priority/status pills. The column header has tiny circle filter pills (A/W/P/L). The column's accent color, icon, and title change based on the active filter: All (gray), Work (red), Personal (blue), Learning (magenta).
- **Projects** (purple accent, FolderKanban icon) — All project records. Cards show project name and priority pill.
- **Ideas** (amber accent, Lightbulb icon) — All ideas. Cards show idea name and category pill.

Columns themselves are glassmorphism surfaces — a soft gradient fill over `backdrop-blur-xl` with a subtle inset highlight and lift shadow. Sticky column headers add a stronger `backdrop-blur-2xl` so they stay legible over scrolling content. Each column also fades up on mount via Framer Motion, and the cards inside stagger in with a short per-card entrance (capped at the 12th card so long work columns mount quickly). The work column is wider than the others (2x width) to accommodate more detail. Empty columns show a large faded icon. Cards have subtle priority-tinted gradient backgrounds over a frosted card surface, hover lift animation, and compact `text-xs` titles. **Click any card** to open its edit form dialog directly — no need to use the toolbar pencil.

### Floating Card Toolbar

Hover over any card to reveal a floating toolbar in the top-right corner of the card. The toolbar contains: a drag grip handle (GripVertical), priority color dots (5 colors), an edit pencil button, and a Car icon for parking. Click the pencil to open the entity's edit form. Click the Car icon to toggle the item in/out of parking lot. The Car button is green when parked.

### Drag-and-Drop

**Within-column:** Grab any card and drag it up or down to reorder. The sort order is saved in localStorage and persists across sessions.

**Cross-column:** Drag a card from work, projects, or ideas into the parking lot to pin it. Drag a parking lot card to any other column to unpin it. Cross-column drag does not change record status or move items between entity types. When dragging a card over a column, the target column glows with its accent color (colored border, ring, and box shadow) to indicate it will accept the drop. The board uses a custom collision detection strategy: `closestCenter` for within-column reorder, `pointerWithin` for cross-column drops.

## View Toggle (Table / Card)

All entity lists (including Projects) include a view toggle in the toolbar (between the search bar and the "New" button). Two modes are available:

- **Table view** (list icon) — Traditional data table with column headers. Default view.
- **Card view** (grid icon) — Responsive card grid (up to 3 columns). Each card shows key fields, edit/delete buttons, and is clickable to open the detail dialog.

Your preference is saved per entity and persists across sessions.

## Priority Color-Coding (Card View)

In card view, hover over any card to reveal a row of 5 colored dots at the top:

- **Clear** — no color (default)
- **Blue** — low priority
- **Orange** — medium priority
- **Red** — high priority
- **Dark Red** — top priority

Click a dot to set the card's color. For **action items** and **ideas**, clicking a dot immediately updates the `tdvsp_priority` field in Dataverse — no save needed. For **accounts**, the color is saved in localStorage (accounts don't have a priority field in Dataverse). The card background updates to reflect the chosen priority color.

## Accounts

### Viewing Accounts

The Accounts page shows a page header with icon, a search bar, a view toggle, and a data table with Microsoft Blue column headers. Columns: Name, Contacts, CSA, CSAM, AE, and Actions. The Contacts column lists all contacts linked to the account, stacked vertically. CSA, CSAM, and AE are placeholder columns for future use. Click any row to open the account detail card. In card view, each card shows the account name and linked contacts.

### Account Detail Card

Shows account info (phone, email, website, address, description) plus a **Contacts** section listing all contacts linked to this account. Click a contact to navigate to the Contacts page.

### Creating an Account

Click **New Account** to open the form. Fill in the fields and click **Create**. Only the Name field is required.

### Editing / Deleting

Use the pencil (edit) and trash (delete) icons in the Actions column, or click **Edit** from the detail card.

## Contacts

### Viewing Contacts

The Contacts page shows a page header with icon, a search bar, a view toggle, and a data table with Microsoft Blue column headers. Columns: Name, Account, Email, Job Title, and Actions. Click any row to open the contact detail card. In card view, each card shows name, account, email, and job title.

### Contact Detail Card

Shows contact info (account, job title, email, phone, mobile, address, description) and the record owner.

### Creating a Contact

Click **New Contact** to open the form. Select an **Account** from the dropdown to link the contact. Last Name is required.

### Setting the Account

The Account dropdown in the contact form shows all accounts. Select one to link, or choose "None" to clear the association. Changes are saved to Dataverse on submit.

### Editing / Deleting

Use the pencil (edit) and trash (delete) icons in the Actions column, or click **Edit** from the detail card.

## Action Items

### Viewing Action Items

The Action Items page shows a page header with icon, a search bar, task-type filter pills, a view toggle, and a data table. Columns: Name, Priority, Status, Date, and Actions. Priority and Status display as color-coded badges. Each row shows a small colored task-type icon (Briefcase for Work, House for Personal, BookOpen for Learning) inline with the action item name. Click any row to open the detail card. In card view, each card shows name, priority/status badges, date, and a task-type icon.

### Task-Type Filter Pills

Below the search bar, four filter pills let you narrow the list by task type:

- **All** (dark/inverted when active) — shows all action items
- **Work** (red, Briefcase icon) — shows only Work items
- **Personal** (blue, House icon) — shows only Personal items
- **Learning** (magenta, BookOpen icon) — shows only Learning items

Filters are applied client-side. The active pill is solid-filled; inactive pills show an outline style.

### Action Item Detail Card

Shows action item info with badges for state, priority, status, and type. Displays customer, date, and description. Click **Edit** to modify.

### Creating an Action Item

Click **New Action Item** to open the form. Fields:
- **Name** (required) — the action item title
- **Customer** — select an account from the dropdown
- **Date** — target or due date
- **Priority** — Med, Low, High, or Top Priority
- **Status** — Recognized, In Progress, Pending Comms, On Hold, Wrapping Up, or Complete
- **Type** — Work, Personal, or Learning
- **Description** — free-text notes

### Editing / Deleting

Use the pencil (edit) and trash (delete) icons in the Actions column, or click **Edit** from the detail card.

## Meeting Summaries

### Viewing Meeting Summaries

The Meetings page shows a page header with a FileText icon, a search bar, a view toggle, and a data table. Columns: Title, Account, Date, and Actions. Click any row to open the detail card. In card view, each card shows title, account, and date.

### Meeting Summary Detail Card

Shows meeting info with active/inactive badge, account name, date, and summary text. Click **Edit** to modify.

### Creating a Meeting Summary

Click **New Summary** to open the form. Fields:
- **Title** (required) — the meeting title
- **Account** — select an account from the dropdown
- **Date** — meeting date
- **Summary** — detailed meeting notes (large text area)

### Extract Action Items with AI

On the Meetings list, click the sparkle (AI) icon on any row to extract action items from the meeting notes using Azure OpenAI. A dialog shows the extracted items with name, priority, due date, and notes. You can edit or remove items before confirming. On confirm, each item is created as an action item in Dataverse, linked to the meeting's account.

> **Note:** This feature requires Azure OpenAI to be configured. If not configured, a toast notification will appear instead.

### Editing / Deleting

Use the pencil (edit) and trash (delete) icons in the Actions column, or click **Edit** from the detail card.

## Projects

### Viewing Projects

The Projects page shows a page header with a FolderKanban icon, a search bar, a view toggle, and a data table. Columns: Name, Account, Priority (as a color-coded badge), and Actions. Click any row to open the detail card. In card view, each card shows name, account, and priority badge.

### Project Detail Card

Shows project info with account name, priority, and description. Click **Edit** to modify.

### Creating a Project

Click **New Project** to open the form. Fields:
- **Name** (required) — the project title
- **Account** — select an account from the dropdown
- **Priority** — Med, Low, High, or Top Priority
- **Description** — free-text notes

### Editing / Deleting

Use the pencil (edit) and trash (delete) icons in the Actions column, or click **Edit** from the detail card.

## Regenerating the Presentation Deck

The `demo-materials/` folder contains a "Code Apps: Under the Hood" slide deck and talk track. Both files are generated from a single Python script.

### Prerequisites

- Python 3.10+
- `pip install python-pptx fpdf2`

### Regenerate

```bash
cd demo-materials
python generate-deck.py
```

This overwrites `code-apps-under-the-hood.pptx` and `code-apps-under-the-hood-talk-track.pdf` in place. To change slide content, edit the content directly in `generate-deck.py` — it is the single source of truth.

## Command Palette (Ctrl+K)

Press **Ctrl+K** (or **Cmd+K** on Mac) anywhere in the app to open a global search dialog. Type to search across all records — accounts, contacts, action items, meeting summaries, ideas, and projects. Results are grouped by entity type with matching text highlighted in purple. Click a result to navigate to that entity's page. Press **Esc** to close. A "Ctrl+K to search" hint appears in the sidebar footer.

## Copilot Studio Agent

A floating **blue chat button** appears in the bottom-right corner of every page. Click it to open the Copilot Studio agent in a popup window. The agent can query your Dataverse data — ask it questions about your accounts, contacts, action items, and more.

- **Open:** Click the blue gradient circle (chat bubble icon) in the bottom-right — this opens a popup window with the agent
- **Reopen / Focus:** Click the button again to focus the existing popup, or open a new one if you closed it
- **Close:** Close the popup window directly

The agent authenticates automatically in the popup — no sign-in needed.

## Ideas

### Viewing Ideas

The Ideas page shows a page header with a Lightbulb icon, a search bar, a view toggle, and a data table. Columns: Name, Account, Category (as a color-coded badge), and Actions. Click any row to open the detail card. In card view, each card shows name, account, and category badge.

### Idea Detail Card

Shows idea info with active/inactive badge and category badge. Displays account, contact, and description. Click **Edit** to modify.

### Creating an Idea

Click **New Idea** to open the form. Fields:
- **Name** (required) — the idea title
- **Category** — Copilot Studio, Canvas Apps, Model-Driven Apps, Power Automate, Power Pages, Azure, AI General, App General, or Other
- **Account** — select an account from the dropdown
- **Contact** — select a contact from the dropdown
- **Description** — free-text notes

### Editing / Deleting

Use the pencil (edit) and trash (delete) icons in the Actions column, or click **Edit** from the detail card.
