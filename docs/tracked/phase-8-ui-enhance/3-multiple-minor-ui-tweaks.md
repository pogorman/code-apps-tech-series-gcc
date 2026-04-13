# 3 Multiple Minor UI Tweaks — Tracked Notes

> Phase 8 continuation — small UI refinements. Append with `/track name:3-multiple-minor-ui-tweaks`.

---

## 1. Reorder Quick Create Bar to Match Left Nav

**Date:** 2026-03-14

**Prompt:** "rearrange the quick create to match the left nav"

**What was done:**

The quick create pill buttons in the top bar were in a different order than the left sidebar navigation sections. Reordered `QUICK_CREATE_BUTTONS` in `src/components/layout/app-layout.tsx` to match the nav:

| Before | After (matches nav) |
|--------|---------------------|
| task | account |
| idea | contact |
| account | task |
| contact | summary |
| summary | idea |

Dashboard was skipped since it has no create action.

---

## 2. Rename Brand Title and Icon — Acct Mgmt → Cx Mgt

**Date:** 2026-03-14

**Prompt:** "change acct mgmt to Cx Mgt and use an icon that looks more like cxmgr-logo in your screenshots folder"

**What was done:**

- Viewed `screenshots/cxmgr-logo.jpg` — a person silhouette with a checkmark and gear, surrounded by connected nodes on a blue-to-green gradient rounded square.
- Swapped the sidebar brand icon from `LayoutGrid` to `UserCog` (closest Lucide match: person + gear).
- Changed brand title from "Acct Mgmt" to "Cx Mgt".

---

## 3. Rename Brand Title and Icon — Cx Mgt → My Work

**Date:** 2026-03-14

**Prompt:** "change cx mgt to My Work and come up with a better icon"

**What was done:**

- Changed the sidebar brand icon from `UserCog` to `Briefcase` — clean, universally recognized "work" icon.
- Changed brand title from "Cx Mgt" to "My Work".

All changes in `src/components/layout/app-layout.tsx`.
