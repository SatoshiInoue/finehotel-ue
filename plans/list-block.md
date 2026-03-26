# Plan: List Block

## Goal

Create a `list` block that dynamically renders child pages under a configurable root path — similar to the AEM Core Components List component. Authors configure the block in Universal Editor; the block fetches and renders pages at runtime.

---

## Reference

This block follows the same two-environment strategy established for dynamic navigation. See `plans/dynamic-navigation.md` for the full rationale. Key points:

- **Author** (`adobeaemcloud.com`): fetch from AEM JCR via Sling GET `.2.json` — shows all pages including drafts.
- **EDS/local/preview/live**: fetch from `/{lang}/query-index.json` via `ffetch` — shows published pages only.

---

## Authored Block Configuration (Universal Editor)

The block is placed on any page. In UE, the author configures the following fields:

| Field | Type | Description |
|---|---|---|
| `rootPath` | text | EDS-style path to list, e.g. `/en/news` |
| `sortBy` | select | `alphabetical` \| `lastModified` \| `listOrder` |
| `showDescription` | boolean | Include page description |
| `showImage` | boolean | Include featured image (`og:image`) |
| `showDate` | boolean | Include last modified / published date |
| `limit` | number | Maximum items to show (0 = no limit) |

### Example block in document

```
| list |
|---|
| /en/news | lastModified | showDescription showImage showDate | limit: 10 |
```

Or, in Universal Editor, each field has its own UE property panel input.

---

## Two-Environment Strategy

| Environment | Data source | Pages shown |
|---|---|---|
| Author (`adobeaemcloud.com`) | Sling GET `.2.json` on JCR path | All pages (drafts + published) |
| Local dev (`localhost:3000`) | `/{rootPath}/query-index.json` via ffetch | Published only |
| Preview (`*.aem.page`) | `/{rootPath}/query-index.json` via ffetch | Published only |
| Live (`*.aem.live`) | `/{rootPath}/query-index.json` via ffetch | Published only |

### Path resolution on the author

The EDS rootPath (e.g. `/en/news`) must be mapped to a JCR path. The author URL follows the pattern `/content/{site}/{country}/{lang}/...`. We extract the content root prefix from `window.location.pathname` (same technique used in `header.js`) and append the configured rootPath segments after the language code.

Example: if `window.location.pathname` is `/content/finehotel-ue/us/en/some-page.html` and `rootPath` is `/en/news`, the JCR fetch target becomes `/content/finehotel-ue/us/en/news.2.json`.

### Path-scoped query index on EDS (Option A)

On EDS environments, the block fetches a **path-scoped** query index (`/{rootPath}/query-index.json`) instead of the full language-root index (`/{lang}/query-index.json`).

For example, `rootPath=/en/news` → fetch `/en/news/query-index.json`.

This requires a dedicated index entry in `helix-query.yaml` per listing section (see Implementation Step 1). If no scoped index exists, the block falls back to the full language index with path-prefix filtering.

#### Performance impact

- **Payload**: The scoped index contains only pages under that path. A news section with 20 articles downloads ~20 entries instead of potentially hundreds of site-wide pages — significantly less data.
- **No pagination**: A small scoped index fits in a single response. No multi-chunk ffetch loop; the list renders in one round trip.
- **CDN cache efficiency**: The scoped index is a smaller, more targeted resource with better cache hit rates. On publish, only the affected scoped index is reindexed — not the full site index.

#### SEO / AIO impact

Option A is purely a performance optimization. It does **not** affect how crawlers see the list:

- The list is still rendered **client-side via JavaScript**. The initial HTML response contains no list items.
- Google does execute JavaScript but with a crawl delay — list items and their links may not be indexed promptly.
- AI crawlers used for AIO (AI-generated overviews) often do not execute JavaScript. The list content and internal links it generates are therefore invisible to AIO indexing.
- Internal link equity flowing through JS-rendered `<a href>` tags is less reliable than static HTML links.

**Accepted tradeoff**: The list block is treated as a **UX feature**, not an SEO feature. SEO discoverability of article pages is handled through other means: the sitemap, static navigation links, and strong internal linking within each article page itself. This is a reasonable position for a content listing block in an EDS project.

---

## Sort Options

| Sort mode | Author (JCR `.2.json`) | EDS query index |
|---|---|---|
| `alphabetical` | `jcr:content['jcr:title']` | `title` field |
| `lastModified` | `jcr:content['cq:lastModified']` | `lastModified` field |
| `listOrder` | `jcr:content.listOrder` (numeric) | `listOrder` field in index |

Sort priority for `listOrder`: pages with a numeric value sort ascending first; pages without a value sort alphabetically at the end (same pattern as `navOrder` in the header).

---

## New `listOrder` Index Property

A new `listOrder` page metadata field (numeric) mirrors `navOrder` but is scoped for use by the list block. This avoids coupling article order to nav order.

### `helix-query.yaml` addition

```yaml
listOrder:
  select: head > meta[name="list-order"]
  value: attribute(el, "content")
```

Added to the `&base-site` anchor so all language indices inherit it.

### Page metadata model addition

Add `listOrder` (number) to `models/_component-models.json` (page-metadata model) and `models/_page.json`, following the same pattern as `navOrder`.

---

## Rendered Output

Each list item is an `<li>` with a structured layout:

```html
<ul class="list-items">
  <li>
    <a href="/en/news/article-1">
      <picture><!-- og:image (if showImage) --></picture>
      <div class="list-item-body">
        <h3>Article Title</h3>
        <p class="list-item-description">Description text (if showDescription)</p>
        <p class="list-item-date"><time datetime="...">March 2026</time> (if showDate)</p>
      </div>
    </a>
  </li>
  ...
</ul>
```

The block element itself gets a `list-sortby-{value}` class (e.g. `list-sortby-lastmodified`) to allow CSS targeting by sort mode.

---

## Implementation Plan

### Step 1 — `helix-query.yaml`

Two changes:

1. Add `listOrder` property to the `&base-site` anchor (inherited by all language indices).
2. Add a **path-scoped index entry** for each section that will use the list block. Example for `/en/news`:

```yaml
news-en:
  include:
    - '/en/news/**'
  target: /en/news/query-index.json
  properties:
    <<: *base-site
```

This scoped index is what the block fetches on EDS environments. A new entry is required per section path per language. Without a scoped index entry, the block falls back to the full language index.

### Step 2 — `models/_component-models.json` and `models/_page.json`

Add `listOrder` number field to the `page-metadata` model in both files. This gives authors a "List Order" input in the UE page properties panel.

### Step 3 — `blocks/list/_list.json`

Define the block model (UE component definition):

```json
{
  "definitions": [...],   // component definition for UE palette
  "models": {
    "list": {
      "fields": [
        { "component": "text",   "name": "rootPath",        "label": "Root Path",        "valueType": "string" },
        { "component": "select", "name": "sortBy",          "label": "Sort By",          "valueType": "string",
          "options": [
            { "name": "Alphabetical",   "value": "alphabetical" },
            { "name": "Last Modified",  "value": "lastModified" },
            { "name": "List Order",     "value": "listOrder" }
          ]
        },
        { "component": "boolean","name": "showDescription", "label": "Show Description", "valueType": "boolean" },
        { "component": "boolean","name": "showImage",       "label": "Show Image",       "valueType": "boolean" },
        { "component": "boolean","name": "showDate",        "label": "Show Date",        "valueType": "boolean" },
        { "component": "number", "name": "limit",           "label": "Max Items",        "valueType": "number" }
      ]
    }
  }
}
```

### Step 4 — `blocks/list/list.js`

Key functions:

- `readBlockConfig(block)` — parses UE-authored field values from the block's DOM cells.
- `resolveJcrRoot(rootPath)` — maps an EDS rootPath to a JCR content path using `window.location.pathname`.
- `fetchAuthorListPages(rootPath, langCode)` — fetches `{jcrPath}.2.json`, filters `cq:Page` nodes, returns page objects with title, description (from `jcr:description`), image, date, listOrder.
- `fetchPublishedListPages(rootPath, langCode)` — uses `ffetch` to load `/{rootPath}/query-index.json` (scoped index); falls back to `/{lang}/query-index.json` with path-prefix filtering if the scoped index returns a 404.
- `sortPages(pages, sortBy)` — sorts by the configured mode.
- `renderList(pages, config)` — builds the `<ul>` DOM.
- `decorate(block)` — entry point: reads config → fetches pages (env branch) → sorts → renders.

### Step 5 — `blocks/list/list.css`

Minimal default styles:
- `.list-items` — resets list style, grid or flex layout for image+text cards.
- `.list-item-body` — text flow beside/below image.
- `.list-item-date` — muted color, smaller font.
- Responsive: single column on mobile, 2–3 columns on wider screens.

### Step 6 — `models/_component-filters.json`

Add `"list"` to the `section` filter's `components` array.

### Step 7 — `npm run build:json`

Run after all `_*.json` edits to regenerate `component-definition.json`, `component-models.json`, `component-filters.json`.

---

## Files to Create / Modify

| File | Action | Change |
|---|---|---|
| `helix-query.yaml` | Modify | Add `listOrder` property to `&base-site` |
| `models/_component-models.json` | Modify | Add `listOrder` number field to `page-metadata` |
| `models/_page.json` | Modify | Same |
| `models/_component-filters.json` | Modify | Add `"list"` to `section.components` |
| `blocks/list/_list.json` | Create | Block model (definition + fields) |
| `blocks/list/list.js` | Create | Block decorator with two-env fetch logic |
| `blocks/list/list.css` | Create | Default layout styles |
| `component-definition.json` | Generated | Rebuilt by `npm run build:json` |
| `component-models.json` | Generated | Rebuilt by `npm run build:json` |
| `component-filters.json` | Generated | Rebuilt by `npm run build:json` |

---

## Known Limitations

- Only **direct children** of `rootPath` are listed (`.2.json` depth = 2 gives one level of children). Recursive listing is out of scope.
- On EDS, the block fetches a **path-scoped index** (`/{rootPath}/query-index.json`). A `helix-query.yaml` entry must exist for each section path used. Without one, the block falls back to the full language index with path-prefix filtering (higher payload). Cross-language listing is not supported.
- The list is **JS-rendered** — list items and their links are invisible to crawlers that do not execute JavaScript, including most AI/AIO crawlers. Article discoverability depends on the sitemap and static internal links, not on this block.
- `listOrder` on the author only becomes visible in UE page properties after `npm run build:json` is run and the model is deployed / reflected in the author.
- Images come from `og:image` meta (query index) or from `jcr:content` properties on the author. If a page has no featured image, the image slot is skipped regardless of `showImage`.
- Newly published pages appear in the list only after EDS indexes them (not real-time on preview/live).

---

## Author Workflow

1. Author creates pages under `/en/news/` with optional `listOrder` set in page properties.
2. Author places a `List` block on a section page.
3. In UE, author sets Root Path to `/en/news`, chooses sort mode, toggles display options.
4. On save/preview, the block fetches and renders the list.
5. On the author tier, draft (unpublished) pages are also visible — same as the navigation behavior.
