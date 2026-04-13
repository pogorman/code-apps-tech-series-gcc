# Resolving First Cut Errors — Tracked Notes

> Append with `/track name:resolving-first-cut-errors`.

---

## 1. Blank White Screen After `pac code push`

**Date:** 2026-03-14

### Symptom

After deploying via `pac code push`, the app rendered a blank white screen in Power Platform. The browser console showed:

```
GET https://0582014c9a6de35b87055168c385f4.13.environment.api.powerplatform.com/powerapps/appExtendedMetadata/08587a10-83ed-43d0-8be4-8b145f5a7ee3?api-version=1 404 (Not Found)
```

The local version worked perfectly — running `npm run dev` + `pac code run` showed accounts and full CRUD operated normally.

### Root Cause

Vite's default `base` setting is `"/"`, which generates **absolute** asset paths in the built `dist/index.html`:

```html
<script type="module" crossorigin src="/assets/index-DYzpMpBK.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-Bhe7tF5u.css">
```

Power Platform Code Apps are served from a nested path inside the platform's hosting infrastructure — not from the domain root. The browser requested `/assets/...` from the root, got nothing back, and the app never loaded (blank white screen with no visible error).

### Why Local Dev Wasn't Affected

`pac code run` proxies to your Vite dev server at `http://localhost:3000/`, where Vite serves assets from the root naturally. The mismatch only surfaces after `pac code push` places the built files under a nested hosting path.

### Fix

Added `base: "./"` to `vite.config.ts`:

```typescript
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  // ...
});
```

This changes the built output to use **relative** paths:

```html
<script type="module" crossorigin src="./assets/index-CkWawzxI.js"></script>
<link rel="stylesheet" crossorigin href="./assets/index-BeA1V6kd.css">
```

Relative paths resolve correctly regardless of where the app is hosted.

### The `appExtendedMetadata` 404

This is a separate Power Platform host call — the platform itself requesting metadata about the registered app. It's not caused by application code and may be transient (e.g., the app registration hadn't fully propagated). The blank screen was caused by the missing JS/CSS, not this metadata call.

### Lesson

Any SPA deployed to a non-root hosting path needs a relative or explicit base path. For Power Platform Code Apps, always set `base: "./"` in `vite.config.ts`.

---
