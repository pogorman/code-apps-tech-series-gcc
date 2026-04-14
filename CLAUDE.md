# CLAUDE.md

Project-specific instructions for Claude Code working in this repo. Read `MEMORY.md` first for the "what we learned the hard way" notes.

## What this repo is

A Power Platform Code App (React 19 + TypeScript + Vite) deployed to **US Gov `og-code`** at `https://og-code.crm9.dynamics.com/`. Cloned from the commercial `code-apps-tech-series` repo and repointed at GCC. The full phase history is in `HOW-I-WAS-BUILT.md`.

## Hard rules (non-negotiable)

1. **This repo only.** Do not touch files under `code-apps-tech-series` (the commercial-cloud source repo). Confirm `pwd` is `/c/Users/pogorman/source/repos/code-apps-tech-series-gcc` before making changes.
2. **`scripts/auth.py` is Gov-patched.** Don't overwrite it with the stock `dataverse:dv-connect` plugin version without re-applying the Gov Cloud patches (see `MEMORY.md`). If `dv-connect` runs the init, check the file diff before accepting changes.
3. **Dataverse metadata writes use read-modify-write PUT** — never PATCH, never per-property PUT. `scripts/apply-descriptions.py` is the canonical pattern; follow it.
4. **Multi-environment safety.** Before any command that writes to Dataverse or pushes a Code App, confirm the target with `pac org who`. This repo targets `og-code` only.
5. **Node path trick** — every build/dev command needs `export PATH="/c/Users/pogorman/AppData/Local/nvm/v22.22.0:$PATH"` prepended. NVM state doesn't survive across Claude Code bash sessions.

## Tool priority for Dataverse work

Follow the `dataverse` skill plugin's order:

1. **MCP server** — preferred for ad-hoc reads and ≤10-record writes
2. **Python SDK** (`PowerPlatform.Dataverse.client.DataverseClient`) — for scripted CRUD, bulk operations, analytics
3. **Raw Web API** via `requests` + `scripts/auth.py` — only for operations the SDK doesn't cover: forms, views, global option sets, `$ref` N:N associations, `$apply` aggregation, and **metadata writes** (EntityDefinition / AttributeDefinition updates)
4. **PAC CLI** — for solution lifecycle (export, unpack, push, pull), environment management

Never improvise raw HTTP for something the SDK supports.

## Common commands

```bash
# Verify auth + environment
pac org who

# Python: list what's in The Dataverse Solution
python scripts/list-solution-tables.py

# Python: apply descriptions from descriptions-plan.json and publish
python scripts/apply-descriptions.py

# After any metadata change, pull the solution into the repo
pac solution export --name TheDataverseSolution --path ./solutions/TheDataverseSolution.zip --managed false --overwrite
pac solution unpack --zipfile ./solutions/TheDataverseSolution.zip --folder ./solutions/TheDataverseSolution --allowDelete --allowWrite
rm ./solutions/TheDataverseSolution.zip

# Code App build + deploy
export PATH="/c/Users/pogorman/AppData/Local/nvm/v22.22.0:$PATH"
npm run build
pac code push

# Local dev (two terminals)
export PATH="/c/Users/pogorman/AppData/Local/nvm/v22.22.0:$PATH"
npm run dev                               # terminal 1 (Vite on 3001)
pac code run --appUrl http://localhost:3001   # terminal 2 (Power Platform proxy)
```

## Conventions specific to this app

- **All entity queries filter `statecode eq 0`** — active records only, everywhere. Don't add a hook that forgets this.
- **Choice field labels live in `labels.ts` next to each entity's components.** Dataverse choice enums use numeric keys (e.g. `468510002 = Top Priority`). The generated display names are mangled — use the shared `PRIORITY_LABELS` / `STATUS_LABELS` / `CATEGORY_LABELS` maps and their matching `priorityPillClass()` / `statusPillClass()` / `categoryPillClass()` helpers.
- **`@odata.bind` writes + `_<field>_value` reads** for all polymorphic lookups (`tdvsp_Customer`, `tdvsp_Account`, `tdvsp_Contact`, `tdvsp_Project`).
- **`tdvsp_pinned` is not in the generated TypeScript.** Access via cast: `(item as Record<string, unknown>).tdvsp_pinned`. Both `true` and `1` mean pinned (handled by `isItemPinned()` in `board-dashboard.tsx`).
- **HashRouter only.** Any component using `useNavigate()` must be rendered inside `<HashRouter>` or it crashes the tree with a white screen.
- **Dialogs cap at `85vh`** with internal scroll. New form dialogs should follow the pattern in `action-item-form-dialog.tsx`.

## Where to find things

| What | Where |
|---|---|
| Schema source of truth | `solutions/TheDataverseSolution/Entities/` |
| Description drafts | `descriptions-plan.json` |
| Python tooling | `scripts/` |
| App components | `src/components/` (per-entity folders) |
| Data hooks | `src/hooks/use-*.ts` |
| Generated Dataverse clients | `src/generated/` (do not edit) |
| Tracked phase notes | `docs/tracked/` |
| Demo deck + talk track | `demo-materials/` |

## Documentation rules

When the user says "update your files" or "update your docs":

- Update the full set: `README.md`, `ARCHITECTURE.md`, `FAQ.md`, `USER-GUIDE.md`, `MEMORY.md`, `CLAUDE.md`, `HOW-I-WAS-BUILT.md`
- Add a new phase entry to `HOW-I-WAS-BUILT.md` for substantive changes (not every tweak)
- Touch only the docs that reflect actually-changed behavior — don't rewrite sections that are still accurate
- Never create additional `.md` files in the root without asking first
