# Code Apps for Power Platform — Slide Outline

Target audience: SLED (State, Local, Education) technical decision-makers and developers.
Session length: ~60 minutes (25 min slides, 30 min live demo, 5 min Q&A).

---

## Slide 1 — Title

**Code Apps for Power Platform**
Tech Series Session
[Presenter name / date / org]

---

## Slide 2 — What We'll Cover

1. What a Code App is
2. Where it fits alongside Canvas and Model-Driven Apps
3. Why it matters for SLED
4. Environment setup walkthrough
5. Live demo on real Dataverse data

*Walk away with practical setup knowledge and a real-world example under your belt.*

---

## Slide 3 — The Power Platform App Spectrum

| | Canvas Apps | Model-Driven Apps | Code Apps |
|---|---|---|---|
| **Builder** | Citizen dev / maker | Admin / configurator | Pro dev (or AI-assisted) |
| **UI** | Drag-and-drop | Auto-generated from data model | Full code control (React, HTML, CSS) |
| **Data** | 1,000+ connectors | Dataverse-native | Dataverse-native |
| **Customization** | Medium | Low–medium | Unlimited |
| **Governance** | Managed via CoE | Managed via CoE | Managed via CoE + source control |

Key point: Code Apps don't replace Canvas or Model-Driven — they complete the spectrum.

---

## Slide 4 — What Is a Code App?

- A React + TypeScript SPA that runs inside Power Platform
- Full local dev experience: VS Code, CLI, npm, Git
- Deployed and managed alongside your other Power Platform apps
- Same Dataverse data, same security model, same ALM
- Also available as a browser-based experience (Power Apps Studio) — AI-assisted, no local tooling required

---

## Slide 5 — Why Code Apps Matter for SLED

**Problem 1: "We need a custom UI but can't justify a standalone web app."**
- Code Apps deploy into Power Platform — no separate hosting, no extra Azure subscription
- Governed by existing Power Platform DLP and environment policies

**Problem 2: "Our developers feel locked out of Power Platform."**
- Full IDE experience: TypeScript, React, source control, CI/CD
- Developers use tools they already know

**Problem 3: "Our Canvas app hit a wall — complex UI, performance, or accessibility needs."**
- Code Apps give pixel-level control
- Modern framework (React 19, TanStack Query, Tailwind CSS)
- Build exactly what Canvas can't

**Problem 4: "We want AI to help, but we also want control."**
- Browser experience: AI scaffolds the app
- Local experience: AI assists via Claude Code / GitHub Copilot
- Either way, you own every line

---

## Slide 6 — When to Use What

| Scenario | Recommendation |
|---|---|
| Simple form over data, no dev team | Canvas App |
| Case management, approval workflows | Model-Driven App |
| Custom dashboard with charts and cross-entity views | **Code App** |
| Pixel-perfect UI for a public-facing portal | **Code App** |
| Complex relationships or logic beyond formula bar | **Code App** |
| Rapid prototype by a business user | Canvas App |
| Prototype that needs to scale to production quality | Start Canvas, graduate to **Code App** |

---

## Slide 7 — The Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript 5.9 (strict mode) |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Data | TanStack Query (caching, mutations, refetch) |
| State | Zustand (lightweight global state) |
| Icons | Lucide React |
| Platform CLI | `pac code` (init, add-data-source, run, push) |

All standard, open-source, well-documented. Nothing proprietary in the app layer.

---

## Slide 8 — Environment Setup

### Prerequisites
1. Node.js (LTS)
2. VS Code (or any editor)
3. Power Platform CLI (`pac`)
4. A Power Platform environment with Dataverse

### From Zero to Running
```
pac code init              # Scaffold the project
npm install                # Install dependencies
pac code add-data-source   # Connect to Dataverse tables
npm run dev                # Start Vite dev server
pac code run               # Connect to Power Platform
```

Two terminals: Vite serves the app, `pac code run` provides the Dataverse connection.

---

## Slide 9 — AI-Assisted Development

Two paths — same result:

**Browser (Power Apps Studio)**
- Describe what you want in natural language
- AI generates the initial app
- Iterate visually or drop into code view

**Local (VS Code + AI)**
- Use Claude Code or GitHub Copilot
- AI generates components, hooks, CRUD operations
- Full control, full Git history

Both produce a standard React + TypeScript project. No lock-in either way.

---

## Slide 10 — Deploy & Govern

```
npm run build       # TypeScript compile + Vite bundle
pac code push       # Deploy to Power Platform
```

- App appears in the Power Platform environment alongside Canvas and Model-Driven apps
- Same DLP policies, same environment security, same admin center
- Source control via Git — standard PR workflows, CI/CD pipelines
- No additional Azure resources required

---

## Slide 11 — Live Demo Transition

**What we're about to see:**

"My Work" — a real Code App running on live Dataverse data

- Dashboard with KPI cards and charts (pure CSS/SVG)
- Five entities: Accounts, Contacts, Action Items, Meeting Summaries, Ideas
- Full CRUD: create, read, update, delete
- Cross-entity relationships (Account -> Contacts, Account -> Action Items)
- Quick create bar for rapid data entry
- Global command palette (Ctrl+K) — instant search across all entities
- **AI-powered action item extraction** — Azure OpenAI reads meeting notes and creates Dataverse records

*Let's switch to the live app.*

---

## Slide 12 — Recap & Key Takeaways

1. Code Apps complete the Power Platform spectrum — they don't replace Canvas or Model-Driven
2. Standard React/TypeScript — your developers already know this stack
3. Same Dataverse data, same security, same governance
4. Two on-ramps: browser-based (AI-first) or local dev (full control)
5. Azure OpenAI integrates naturally — AI features inside a governed Power Platform app
6. Deploy with one command — no separate hosting to manage

---

## Slide 13 — Resources

- [Power Platform Code Apps documentation](https://learn.microsoft.com/power-apps/maker/code-apps/)
- [pac code CLI reference](https://learn.microsoft.com/power-platform/developer/cli/reference/code)
- Power Platform CLI: `winget install Microsoft.PowerAppsCLI`
- This demo's source code: [link to repo if sharing]

---

## Slide 14 — Q&A

Questions?
