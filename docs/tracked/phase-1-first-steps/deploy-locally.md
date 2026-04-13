# Deploy Locally — Tracked Notes

> Append with `/track name:deploy-locally`.

---

## 1. Local Development Setup

**Date:** 2026-03-14

### Prerequisites

- Node.js 20+
- Power Platform CLI (`pac`) installed
- Active `pac auth` profile pointing at a Dataverse environment (`pac auth list` to check)

### Two Terminals Required

**Terminal 1 — Vite dev server:**
```bash
npm run dev
```
Starts on port 3000 (configured in `vite.config.ts`).

**Terminal 2 — Power Platform connection proxy:**
```bash
pac code run
```
This proxy handles Dataverse authentication. It wraps your app in the Power Platform host iframe so the generated `AccountsService` calls work with real Dataverse data.

### Important

- Open the URL from `pac code run` output — **not** the Vite URL directly
- The Vite URL (`http://localhost:3000`) will load the app but Dataverse calls will fail because there's no auth context outside the Power Platform host iframe
- `power.config.json` has `localAppUrl: "http://localhost:3000/"` — this tells `pac code run` where to find your dev server

### Deploying to Power Platform

```bash
npm run build       # TypeScript check + Vite production build to dist/
pac code push       # Uploads dist/ to Power Platform
```

The app URL is returned by `pac code push` on first deploy. Subsequent pushes update the same app.

---
