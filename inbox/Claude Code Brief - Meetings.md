# Claude Code Brief — Meetings

## Route
`/meetings` — "Capture" section.

## Visual character
Teal accent (`--meet: #0e7490`, `--meet-2: #06b6d4`, `--meet-soft: #ecfeff`). Distinct from Ideas (yellow) and Action Items (neutral). Cooler, more institutional feel — meetings are evidence/record, not creative sparks.

## Data
```ts
interface Meeting {
  id: string;
  title: string;
  summary?: string;           // 1–2 line summary
  keyQuote?: string;          // optional pull quote (shown in italics)
  type: 'discovery' | 'review' | 'strategy' | 'sync' | 'pitch';
  outcome: 'decisions' | 'follow_ups' | 'blocked' | 'info_only';
  account?: Account;
  attendees: User[];
  date: string;               // ISO
  duration?: number;          // minutes
  tags: string[];
  notes?: string;             // long-form
  transcriptUrl?: string;
  recordingUrl?: string;
  spawnedActionItemIds: string[];
  relatedIdeaIds: string[];
  capturedBy: User;
}
```

## Components

### Hero stats strip
4-card row: Total summaries · This week · Action items spawned · 8-week sparkline with filled gradient. Sparkline uses teal colors matching the accent.

### `<MeetingRow>` (rich by default)
- Date tile (42px, Mon/27 style) — past meetings use muted surface, upcoming use teal
- Title row: name · type pill (Discovery/Review/Strategy/Sync/Pitch)
- Summary line OR key quote (italicized)
- Type pill column (color-coded)
- Attendee avatar stack (max 3 + "+N")
- Outcome pill (Decisions green / Follow-ups blue / Blocked red / Info only slate)
- Spawned count (teal pill with checkmark icon, linking to filtered Action Items)
- Date + relative ("2w ago")
- Actions: Open (teal) · Delete

### View modes
- **Table** (default) — grouped by account
- **Gallery** — summary cards grouped by account, 3-col grid, date tile top-left
- **Timeline** — week-view calendar strip (Mon–Sun), color-coded events, "today" column highlighted; recent past shown below

### Saved views (auto-picked)
- All · This week · Needs summary · Has open follow-ups · Mine

### Spawn flow
Spawn action items from a meeting:
1. Open detail, select decisions/follow-ups text
2. Right-click → "Create action item"
3. Pre-fills: account (from meeting), tags (meeting type), linked meeting id
4. Bulk bar has "Spawn action items" as primary action (teal button)
5. Action item retains `sourceMeetingId`; meeting gets entry in `spawnedActionItemIds`

### Detail panel (future)
Side drawer. Sections: Attendees (with roles) · Key decisions (bulleted) · Follow-up action items (linked) · Raw notes / transcript · Related ideas · AI "Generate summary" button.

## Keyboard
- `⌘⇧M` new meeting summary
- `/` search · `V` cycle view mode
- In row: `Enter` open detail · `S` spawn action item · `A` archive

## Tokens (meetings-specific)
```css
--meet: #0e7490;
--meet-2: #06b6d4;
--meet-soft: #ecfeff;
--bg: #f6f8fa;   /* cooler gray than Ideas */
```

Type-pill colors: Discovery→blue, Review→violet, Strategy→amber, Sync→slate, Pitch→pink.
Outcome-pill colors: Decisions→green, Follow-ups→blue, Blocked→red, Info only→slate.
