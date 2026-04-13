# Phase 9 — AI Action Item Extraction + Command Palette

> Two "wow" features to make the audience say "That's a Power App?!" Append with `/track name:1-ai-extract-and-command-palette`.

---

## Prompts

### Prompt 1
> i want to do something w the app that really pops and has the audience going "wow, that's a power app!?!?" any ideas?

### Prompt 2
> can you spin off an agent to do 1 and 2 simultaneously?

---

## 1. AI Meeting Summary → Extract Action Items

**Date:** 2026-03-22

### Goal

When viewing a meeting summary, click a button to send the notes to Azure OpenAI, which extracts action items. Preview in a table with checkboxes, confirm to create Dataverse records.

### What Was Built

**New file:** `src/lib/azure-openai.ts`
- Azure OpenAI Chat Completions API wrapper
- `isAoaiConfigured()` checks for Vite env vars
- `extractActionItems()` sends system prompt + meeting notes, parses JSON response
- `mapPriorityToDataverse()` maps AI strings to numeric choice keys
- Strips markdown code fences from AI response

**New file:** `src/components/meeting-summaries/extract-action-items-dialog.tsx`
- Multi-phase dialog: idle → extracting → preview → creating → done
- Animated sparkle icon + spinner during extraction
- Preview table with checkboxes, priority badges, due dates
- Bulk Dataverse create via sequential `mutateAsync` calls
- Links items to same account as meeting summary via `tdvsp_Customer@odata.bind`
- Toast notifications for success/failure
- TanStack Query cache invalidation

**New file:** `src/components/ui/checkbox.tsx`
- shadcn/ui Checkbox component (Radix primitive)

**New file:** `.env.example`
- Documents `VITE_AOAI_ENDPOINT`, `VITE_AOAI_API_KEY`, `VITE_AOAI_DEPLOYMENT`

**Modified:** `src/components/meeting-summaries/meeting-summary-detail-dialog.tsx`
- Added purple gradient "Extract Action Items" button with Sparkles icon
- Opens the extraction dialog

**New dependency:** `@radix-ui/react-checkbox`

### Configuration

Set env vars in `.env` file (see `.env.example`). If not configured, button shows a toast — graceful degradation.

---

## 2. Command Palette (Ctrl+K)

**Date:** 2026-03-22

### Goal

Global Ctrl+K search across all entities — Linear/Notion/VS Code style.

### What Was Built

**New file:** `src/components/command-palette.tsx`
- Global `keydown` listener for Ctrl+K / Cmd+K
- Uses `cmdk` library + Radix Dialog
- Searches TanStack Query cached data (zero API calls)
- Results grouped by entity: Accounts, Contacts, Action Items, Meetings, Ideas
- Lucide icons per entity, subtitle with account/email context
- Fuzzy matching (case-insensitive `includes`) with highlighted text
- Max 5 results per group
- Arrow keys navigate, Enter selects, Escape closes
- Navigates to entity list on selection

**Modified:** `src/App.tsx`
- Mounted `<CommandPalette />` at root level (inside HashRouter, outside Routes)

**Modified:** `src/components/layout/app-layout.tsx`
- Added Search icon import
- Added "Search Ctrl+K" button in sidebar footer
- Button dispatches synthetic KeyboardEvent to trigger palette

**New dependency:** `cmdk@1.1.1`

### Key Decisions
- Used cmdk rather than building from scratch — accessible, keyboard-native, tiny bundle
- Client-side search against cache = instant, no loading states needed
- Synthetic KeyboardEvent from sidebar button reuses the same listener

---

## Build Notes

- Attempted parallel agent builds in isolated worktrees — both agents were blocked by sandbox write permissions
- Built both features directly in main working directory instead
- TypeScript strict compilation passed on first fix pass (Map return type, contact ID fallback)
- Production build succeeds (578 KB JS — chunk size warning but acceptable for demo)
