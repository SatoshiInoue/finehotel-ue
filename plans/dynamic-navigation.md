# Plan: Dynamic Navigation

## Goal

Replace the hard-coded bulleted list in `nav.html` with a navigation that auto-populates
from the actual page hierarchy — similar to how AEM's List component dynamically renders
child pages in traditional AEM.

---

## Do We Need a Separate AEM Archetype Project?

**No.** This is an AEM EDS XWalk project, so:

- All frontend changes live in this git repo (`header.js`, etc.)
- The `.2.json` endpoint used for author-side page listing is a built-in AEM Sling GET
  servlet — it requires no Java code, no OSGi bundles, no Maven build
- The author instance is a standard AEM Cloud Service; authenticated same-origin requests
  to `/content/.../.2.json` work out of the box for logged-in users
- No deployment to a separate AEM archetype project is needed

The only caveat: if AEM Cloud Service has the Sling GET servlet restricted for `.json`
selectors (uncommon on the author tier), a one-line OSGi config would be needed. If that
becomes a blocker we can revisit, but it should not be assumed up front.

---

## Two-Environment Strategy

The query index (`/en/query-index.json`) only contains **published** pages. Authors need
to see **all** pages including drafts. The approach therefore differs by environment:

| Environment | Data source | Pages shown |
|---|---|---|
| Author (`adobeaemcloud.com`) | AEM Sling GET API — `{contentRoot}.2.json` | All pages (published + drafts) |
| Local dev (`localhost:3000`) | EDS query index | Published pages only |
| Preview (`*.aem.page`) | EDS query index | Published pages only |
| Live (`*.aem.live`) | EDS query index | Published pages only |

This matches how traditional AEM works: the authoring environment shows all pages,
the delivery tier shows only what is published.

---

## What Is Already Done

### 1. `helix-query.yaml` — index properties added to `&base-site`

```yaml
navOrder:
  select: head > meta[name="nav-order"]
  value: attribute(el, "content")
hideInNav:
  select: head > meta[name="hide-in-nav"]
  value: attribute(el, "content")
```

### 2. `models/_component-models.json` and `models/_page.json`

Both files have `hideInNav` (boolean) and `navOrder` (number) added to the
`page-metadata` model, giving authors these controls in Universal Editor page properties.

### 3. `blocks/header/header.js` — dynamic nav implemented

- `fetchAuthorNavPages(langCode)` — fetches `{contentRoot}.2.json` on the author,
  parses child `cq:Page` nodes, returns a page list.
- `populateDynamicNav(navSections, langCode)` — branches by environment:
  - **Author** → calls `fetchAuthorNavPages` (all pages including drafts)
  - **All other envs** → fetches `/{lang}/query-index.json` via ffetch (published only)
- Triggered in `decorate()` when the nav list in nav.html is empty.

### 4. Verified working

- **Local dev (`aem up`)**: nav populates from query index — About Us, Campaigns, FAQs,
  News visible sorted alphabetically.
- **Author**: JCR fetch works; all pages including drafts appear.

---

## Sorting — Current State and Planned Improvement

### Current state (implemented)

Sort priority:
1. Explicit `navOrder` number (ascending) — set per page in page properties
2. Alphabetical by title (fallback when `navOrder` is unset or equal)

### Problem

Maintaining a numeric `navOrder` on every page is burdensome. In classic AEM, the List
component sorts by **directory order** (the drag-and-drop order in the Sites console),
**last modified date**, or **alphabetical** — all automatic, no per-page numbers needed.

### What is available by environment

| Sort option | Author (JCR `.2.json`) | EDS query index |
|---|---|---|
| Directory order (Sites console drag order) | ✓ `Object.entries()` preserves JCR node order | ✗ not exposed |
| Last modified date | ✓ `jcr:content['cq:lastModified']` | ✓ `lastModified` field |
| Alphabetical | ✓ `jcr:content['jcr:title']` | ✓ `navTitle` / `title` |
| Created date | ✓ `jcr:content['jcr:created']` | ✗ not in query index |

**Key gap:** JCR directory order is the most natural for authors (drag to reorder in Sites
console) but is not exposed in the EDS query index — it is a JCR-only concept.

### Accepted sort strategy

The `navOrder` numeric field per page is the accepted approach. It works identically in
both the author (JCR) and EDS (query index) environments, which is the priority.

Sort priority:
1. `navOrder` ascending (pages with a number appear first, in that order)
2. Alphabetical by title (pages with no number sort last)

**Why not JCR directory order:** JCR node order (drag-and-drop in the Sites console) is
not exposed in the EDS query index. Implementing it only for the author environment would
create a discrepancy between what authors see and what visitors see on the live site.
Since consistent behaviour across environments is more important, directory-order sorting
is out of scope.

**Why not a configurable sort mode (`navSortOrder`):** Adding a separate sort mode
configuration (e.g. "alphabetical", "modified", "directory") was considered but rejected
— it adds complexity without eliminating the maintenance trade-off. The navOrder field is
sufficient, and pages that need no specific position simply leave it unset (they sort
alphabetically at the end).

---

## Implementation Complete

All planned changes have been implemented and pushed to the `main` branch.

---

## Author Workflow After Full Implementation

1. Author creates a page under `/content/finehotel-ue/us/{lang}/` — it appears in nav
   immediately, no publish required.
2. Author drags pages to reorder them in the Sites console → nav reflects new order.
3. `hideInNav` checkbox on a page → page disappears from nav.
4. Optional `navOrder` pin on a page → page is always shown at that position.
5. `navSortOrder` on nav.html → controls global sort mode.
6. On publish, the EDS query index is updated and live site reflects changes.

---

## Activation (nav.html)

The dynamic mode is triggered by the absence of nav items. The author empties (or never
adds) a `<ul>` in the Text block of `nav.html`. Once empty and published, the nav is
dynamic forever. Restoring a list to `nav.html` reverts to static mode (backward
compatible).

---

## Files Changed

| File | Status | Change |
|---|---|---|
| `helix-query.yaml` | Done | Added `navOrder` and `hideInNav` index properties |
| `models/_component-models.json` | Done | Added `hideInNav` and `navOrder` fields to `page-metadata` |
| `models/_page.json` | Done | Same fields mirrored here |
| `blocks/header/header.js` | Done | `fetchAuthorNavPages` + `populateDynamicNav` with env branching |

---

## Known Limitations

- Sub-navigation (nested dropdowns) is not in scope — only top-level pages.
- On preview/live, newly published pages appear after EDS indexes the page (per-page, not
  real time).
- Directory order sort on EDS falls back to alphabetical — JCR order is not available in
  the query index and would require a separate mechanism to replicate it.
