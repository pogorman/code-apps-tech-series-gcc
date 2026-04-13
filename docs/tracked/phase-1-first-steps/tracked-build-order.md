# Tracked Build Order — Tracked Notes

> Append with `/track name:tracked-build-order`.

---

## 1. Build Strategy — First Cut vs. Incremental

**Date:** 2026-03-14

**Question:** Does it make sense to build the Code App in steps, or get a working first cut out and iterate from there?

**Answer:** First cut, then iterate. Three reasons:

1. **Too many unknowns.** Code Apps are brand new — the iframe sandbox, generated services, and `npx power-apps push` deployment all have gotchas we haven't hit yet. A step-by-step build risks perfecting the data layer only to discover a routing or deployment issue later that forces a rethink.

2. **Demo context.** Need something that works end-to-end before polishing anything. A vertical slice (one Dataverse table, list view, maybe a detail/edit modal) proves the whole stack — scaffold, SDK init, generated services, CRUD, routing, build, deploy. Once that's green, we know what's real and what the docs got wrong.

3. **The gotchas are the content.** For a tech series, the interesting stuff *is* the problems you hit and how you solved them. A first cut surfaces those fast. Step-by-step builds tend to front-load boilerplate and delay the "aha" moments.

**First cut target:**
- One Dataverse table (`account` — always available)
- List page with `getAll()`, detail view with `get()`
- One create or update to prove writes work
- `npx power-apps push` to prove deployment

This is enough to answer open questions empirically (`$select` behavior, CLI choice, CRUD depth) instead of hypothetically.
