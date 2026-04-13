# Tracked Notes

> Catch-all tracking document. Append with `/track`. Start a new version with `/tracknew`.

---

## 1. What Are Code Apps?

**Date:** 2026-03-14

A brand new app type on Power Platform — not canvas, not model-driven, not Power Pages. You write a real SPA (React, Vue, whatever) in your IDE, and it runs inside Power Platform's managed host.

**What you get for free:**
- Entra ID authentication handled by the host (no token management)
- Dataverse + 1,500+ connectors callable from JS via generated service classes
- Managed platform governance — DLP, Conditional Access, sharing limits, app quarantine
- Power Apps Premium license required for end users

**Runtime model:** The app runs in a sandboxed iframe inside the Power Apps host. You cannot make raw `fetch()` calls to Dataverse — you must go through the generated services the SDK provides.

---

## 2. Dataverse Connectivity — The Critical Decision

There are two data access paths. For Dataverse, only one is correct.

### Database References (correct for Dataverse)

```bash
pac code add-data-source -a dataverse -t account
```

- Adds `databaseReferences` in `power.config.json`
- Generates typed `AccountsService.ts` + `AccountsModel.ts` in `src/generated/`
- CRUD: `AccountsService.create()`, `.get()`, `.getAll()`, `.update()`, `.delete()`
- Supports OData filter, orderBy, top, skip, skipToken, select
- No connection IDs needed — first-class Dataverse path

### Connector References (for SQL, O365, SharePoint, etc.)

```bash
pac code add-data-source -a "shared_sql" -c <connectionId> -t "[dbo].[Table]" -d "server,db"
```

- Requires pre-creating connections in make.powerapps.com
- Adds `connectionReferences` in `power.config.json`
- Also generates typed services, but plumbing differs

### What NOT to do

- `pac code add-data-source -a "shared_commondataserviceforapps"` — compiles but silently fails at runtime
- Raw `fetch()` / `XMLHttpRequest` — sandboxed iframe has no auth tokens
- Any pattern involving `MicrosoftDataverseService`, `connectionReferences`, or `connectorOperation` for Dataverse

---

## 3. Scaffolding Plan (From Scratch)

Not using the starter repo — building from zero.

1. **Bootstrap Vite + React + TS** — `npm create vite@latest`
2. **Install Power Apps SDK** — `npm install @microsoft/power-apps --save-exact`
3. **Initialize as Code App** — `npx power-apps init --displayName "..." --environmentId <id>`
4. **Add stack** — react-router-dom, @tanstack/react-query, zustand, lucide-react, sonner, shadcn/ui
5. **Register Dataverse tables** — `pac code add-data-source -a dataverse -t <table>` for each table
6. **Build architecture layer:**
   - `src/lib/dataverse.ts` — serviceMap wrapping generated services
   - `src/hooks/use-dataverse.ts` — TanStack Query hooks
   - `src/types/entities.ts` — EntityConfig objects driving generic UI
   - Generic components: entity-list-page, record-form-dialog, sidebar-nav
   - Routing with iframe basename fix
7. **Build & deploy** — `npm run build && npx power-apps push`

---

## 4. Key Gotchas

| Gotcha | Detail |
|--------|--------|
| `$select` + computed fields | Including formatted values or `_value` fields in `$select` causes silent zero-row returns |
| Routing basename | App runs in iframe; must compute basename from `location.href` dynamically |
| Generated TS files | Parameter names with dots (e.g., `MSCRM.IncludeMipSensitivityLabel`) are invalid TS — replace with underscores |
| Lookups | Writes use `@odata.bind` syntax; reads use `_value` / `FormattedValue` pattern. MS says improvements coming. |
| No agentic plugin | Power Pages has an MCP-based coding tool plugin. Code Apps don't yet — we're doing the scaffolding work manually. |
| New npm CLI vs pac code | `npx power-apps init/run/push` (SDK v1.0.4+) replacing `pac code`. But `pac code add-data-source` still needed for Dataverse table registration. |

---

## Open Questions

- [ ] Which Dataverse tables to target?
- [ ] New npm CLI or pac code for the demo flow?
- [ ] `$select` strategy — omit entirely (safer) vs. use it (official recommendation)?
- [ ] CRUD depth — full modals or read-heavy demo?
