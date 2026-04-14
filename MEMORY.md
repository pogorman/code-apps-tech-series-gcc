# MEMORY

Persistent notes and learnings for this repo that don't fit neatly in code comments or commit messages. This is the "what we found out the hard way" file — read it before tackling anything non-obvious.

## Target environment

- **Environment:** `og-code` (US Gov L4 / GCC High style, region `crm9`)
- **URL:** `https://og-code.crm9.dynamics.com/`
- **Tenant ID:** `426a6ef4-2476-4eab-ae1c-1c9dc2bfca80`
- **User:** `patrick.ogorman@testtestmsftgccfo.onmicrosoft.com`
- **PAC auth profile name:** `og-code` (index `[5]` in `pac auth list` at time of writing — order can change)
- **Solution:** `TheDataverseSolution` (friendly name "The Dataverse Solution", publisher prefix `tdvsp_`)
- **Code App ID:** `b66395f5-3497-4ee0-95ff-ea6f22028478`

This is **not** a commercial-cloud GCC tenant. The older FAQ entry "Does GCC Power Platform use Azure Government?" is true only for the earlier commercial-Azure GCC setup — the Python SDK path through `scripts/auth.py` here authenticates against `login.microsoftonline.us`, not `login.microsoftonline.com`.

## Dataverse metadata writes — read-modify-write PUT only

`PATCH EntityDefinition(...)` → `405 Operation not supported on EntityMetadata`.
`PUT .../Description` (property path) → `400 Argument must be of type...`.

The only working pattern is:

1. `GET` the full `EntityDefinition` (or `AttributeDefinition` with a concrete type cast like `/Attributes({id})/Microsoft.Dynamics.CRM.StringAttributeMetadata`)
2. Mutate the field you want
3. `PUT` the whole body back with headers `MSCRM.MergeLabels: true` + `MSCRM.SolutionName: TheDataverseSolution`
4. Call `POST /PublishAllXml` once all writes succeed

See `scripts/apply-descriptions.py` for the canonical implementation. Per Microsoft Learn, *"you can't update individual properties"* on data-model entities via the Web API.

## Dataverse `$filter` gotchas

- `$filter startswith(LogicalName, 'tdvsp_')` against `MetadataEntities` → `501 Not supported`. Filter client-side.
- `$select` on computed/formatted fields (e.g. `statecodename`, `parentcustomeridname`) silently returns zero rows. Omit `$select` entirely on record queries and use field labels in TypeScript.

## Polymorphic lookups

The generated TypeScript only declares `parentcustomerid`, but the Power Apps SDK returns the GUID as `_parentcustomerid_value` at runtime, and `parentcustomeridname` is never populated on read. Always use `src/lib/get-parent-account-id.ts` to extract the GUID (double-casts through `unknown`), and resolve display names by joining with `useAccounts()`. Same pattern for `tdvsp_Customer`, `tdvsp_Account`, `tdvsp_Contact`, `tdvsp_Project` lookups — writes use `@odata.bind` with `/accounts(guid)` or `/tdvsp_projects(guid)` format, reads come back as `_<field>_value`.

## `scripts/auth.py` is Gov-patched — don't overwrite it

The version in `scripts/auth.py` is a divergence from the stock `dataverse` skill plugin's `auth.py`. It:

- Detects Gov Cloud from `DATAVERSE_URL` (`crm9` or `crm.microsoftdynamics.us`)
- Sets `authority=AzureAuthorityHosts.AZURE_GOVERNMENT` on `DeviceCodeCredential` / `ClientSecretCredential`
- Persists `AuthenticationRecord` to a separate file (`dataverse_cli_auth_record_gov.json`) so it doesn't collide with commercial-cloud records on the same machine
- Skips passing `authority=` when an existing `AuthenticationRecord` is loaded (the record encodes its own authority; passing it again throws `TypeError: got multiple values for keyword argument 'authority'`)

If you re-run the `dataverse:dv-connect` skill, **don't let it overwrite `scripts/auth.py`** without re-applying these patches.

## Power Platform `region` value must be `gccmoderate`

In `power.config.json`, `"region": "gccmoderate"` — not `"gcc"`, not `"usgov"`, not omitted. The PAC CLI maps this to `apps.gov.powerapps.us`. Any other value maps to `undefined` and `pac code push` fails with `getaddrinfo ENOTFOUND undefined`. The other valid values are `prod`, `gcchigh`, `dod`.

## Node path doesn't persist across bash sessions

NVM for Windows doesn't export its active version path into the shell environment that Claude Code bash tool calls use. Every build/run command needs:

```bash
export PATH="/c/Users/pogorman/AppData/Local/nvm/v22.22.0:$PATH"
```

Prepend it directly; don't try `nvm use`.

## Copilot Studio connector (`shared_microsoftcopilotstudio`) is blocked in `og-code`

**Do not try to add the Copilot Studio data source to this Code App.** The native upgrade path from the Phase 12 popup-window integration — `pac code add-data-source -a shared_microsoftcopilotstudio -c <id>` with the generated `MicrosoftCopilotStudioService.ExecuteCopilotAsyncV2()` client — requires a `shared_microsoftcopilotstudio` connection, and creating one from the `make.gov.powerautomate.us` maker portal fails in GCC with:

> **AADSTS700030: Invalid certificate - the issuer of the certificate is from a different cloud instance.** (First Party OAuth2 Certificate flow, error `invalid_client`)

The connector card ships globally but the backend First Party AAD identity is presenting a commercial-cloud-issued certificate to GCC Entra ID. There is no user-side config fix and **no CLI fallback** — `pac connection create` is Dataverse-only (SP auth, `--application-id` / `--client-secret`), and Microsoft Learn states the connection "must be created through the Power Apps maker portal UI." This is a Microsoft-side provisioning gap in GCC.

**If you need the evidence for a support ticket**, the failing screenshot is in `inbox/copilot-studio-connection-bug-in-gcc.png`. Correlation ID `f6f4fc79-9b04-4e82-8a94-7769d34158e2`, trace ID `b8e3d367-4a88-4a21-bd26-1ff362397000` — though a fresh repro will give newer IDs.

**What to use instead:**

1. **The existing Phase 12 popup-window integration** (`src/components/copilot-chat.tsx`) still works. It opens the native Copilot Studio webchat URL in a new browser window so the agent authenticates itself. No connector required. This is the default for the demo.
2. **If a deeper in-app chat is required**, fall back to a Power Automate detour: Code App → flow → "Send a message to Copilot Studio agent" action. Power Automate's GCC runtime handles its own token flow and sidesteps the broken connector.

Details in `FAQ.md` → "Why not use the Microsoft Copilot Studio connector…" and `HOW-I-WAS-BUILT.md` → Phase 23.

## After any metadata change, pull the solution

Per the `dataverse` skill plugin's mandatory post-change step:

```bash
pac solution export --name TheDataverseSolution --path ./solutions/TheDataverseSolution.zip --managed false --overwrite
pac solution unpack --zipfile ./solutions/TheDataverseSolution.zip --folder ./solutions/TheDataverseSolution --allowDelete --allowWrite
rm ./solutions/TheDataverseSolution.zip
```

The unpacked XML under `solutions/TheDataverseSolution/` is the source of truth for what the Copilot Studio agent (via the Dataverse MCP server) sees — if a description looks wrong in chat, check `Entities/<Name>/Entity.xml` before trusting the live environment.
