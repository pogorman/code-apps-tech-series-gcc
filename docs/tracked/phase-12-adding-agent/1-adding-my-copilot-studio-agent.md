# Adding My Copilot Studio Agent — Tracked Notes

> Phase 12: Embedding a Copilot Studio agent into the Code App. Append with `/track name:1-adding-my-copilot-studio-agent`.

---

## 1. Initial Discussion — Copilot Studio Integration Options

**Date:** 2026-03-27

### Prompt
> I have a Copilot Studio agent in the same environment as this code app. I want to add it to my code app. Is this possible?

### Response
Three approaches were identified:

1. **Embed via Web Chat (botframework-webchat + Direct Line)** — most customizable, requires Direct Line secret and token exchange
2. **Copilot Studio iframe embed** — simplest, Copilot Studio hosts the webchat and handles auth natively
3. **Direct Line API (raw)** — full UI control, most work

Key consideration: the Code App runs inside Power Platform's host, so the user is already authenticated. SSO could flow naturally with the iframe approach.

---

## 2. Reusing the dv-front-end Pattern

**Date:** 2026-03-27

### Prompt
> I want to use the same setup as I used in repo dv-front-end. Same agent, everything. Can you check that out and figure it out?

### Response
Explored the `dv-front-end` repo at `C:/Users/pogorman/source/repos/dv-front-end`. Found:

- **Floating rocket button** (bottom-right) opening a 400x600 chat panel
- **botframework-webchat** with Direct Line connection
- **MSAL-based SSO token exchange** — acquires token for bot scope (`api://3c6a1f01-09c5-49c7-8be7-48c33e177432/mcs-read-scope`), exchanges Direct Line secret for conversation token, Redux middleware intercepts `signin/tokenExchange` invoke activities
- **Direct Line secret** in `.env` (`REACT_APP_COPILOT_DIRECT_LINE_SECRET`)
- Dark/light theme adaptation in Web Chat `styleOptions`

**Key difference:** `dv-front-end` is a standalone Azure Static Web App with MSAL. The Code App runs inside Power Platform's host — no MSAL available, and the SDK uses custom `paauth`/`dynamicauth` tokens (not standard Bearer tokens).

---

## 3. Auth Challenge — Bot Identity for Dataverse Access

**Date:** 2026-03-27

### Prompt
> If the bot doesn't know it's me, how will it pull data from Dataverse?

### Response
Investigated how the Code App handles auth:

- Uses `@microsoft/power-apps` SDK v1.0.4 — token acquisition is internal via `PowerOperationExecutor`
- Tokens use custom schemes (`paauth`, `dynamicauth`), not standard OAuth Bearer tokens
- No public API to extract a Bearer token for bot SSO exchange
- `getContext()` from `@microsoft/power-apps/app` provides user info (objectId, UPN, tenantId) but not tokens

**Decision:** Since the bot uses federated credentials via an app registration with SSO configured in `dv-front-end`, and the Code App can't do MSAL token exchange, we pivoted to the **iframe embed approach**.

---

## 4. Iframe Embed — Implementation

**Date:** 2026-03-27

### Prompt
> This is the iframe code from the agent though... you think it would work?
> ```html
> <iframe src="https://copilotstudio.microsoft.com/environments/0582014c-9a6d-e35b-8705-5168c385f413/bots/auto_agent_s82bp/webchat?__version__=2" ...></iframe>
> ```

### Response
The iframe approach is the cleanest path because:
- Same Power Platform environment (`0582014c-9a6d-e35b-8705-5168c385f413`)
- User is already authenticated in the host context
- Copilot Studio iframe handles SSO natively
- No dependencies to install (no botframework-webchat, no MSAL)

**Potential risk:** Nested iframes (Code App is already in a Power Platform iframe). Both are Microsoft domains so CSP should allow it.

### What was built

**New file:** `src/components/copilot-chat.tsx`
- Floating blue gradient button (bottom-right, `MessageCircle` icon from Lucide)
- 400x600 chat panel with header (gradient matching app brand) and iframe body
- Header has refresh (restart conversation) and close buttons
- Dark mode aware via `useTheme()` hook
- `iframeKey` state for conversation reset (remounts iframe)
- No external dependencies added

**Modified file:** `src/App.tsx`
- Imported `CopilotChat` component
- Rendered alongside `CommandPalette` (outside `AppLayout`, inside `HashRouter`)

### Testing
```bash
npm run dev                                    # port 3003
pac code run --appUrl http://localhost:3003 --port 8081
```

**Result:** Works. The Copilot Studio iframe loads inside the Code App, SSO is handled by the platform, and the bot can query Dataverse with the user's identity.
