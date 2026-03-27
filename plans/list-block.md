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
| `paginate` | boolean | Enable pagination (default `false`) |
| `pageSize` | number | Items per page when pagination is enabled (default `5`) |
| `urlState` | boolean | Persist page in `?page=N` URL param (default `false`) |
| `listStyle` | select | Visual layout: `card` \| `small` \| `medium` (default `card`) |

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

The block element gets two classes for CSS targeting:
- `list-sortby-{value}` — e.g. `list-sortby-lastmodified`
- `list-style-{value}` — e.g. `list-style-card`, `list-style-small`, `list-style-medium`

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
- **Lang-root page**: when the block is placed on the language root page (e.g. `/en.html`), the `.html` suffix was previously preventing `resolveJcrRoot` from finding the `en` segment in the URL. Fixed by stripping `.html` from `window.location.pathname` before splitting — `/en.html` → `/en`.
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

---

## Phase 2: Pagination

### Goal

Add optional client-side pagination to the list block. All items are fetched up front (unchanged); the block slices the array and renders Prev/Next controls to navigate between pages. The current page is stored in the URL (`?page=N`) so that sharing, refreshing, and browser back/forward all work correctly.

### New UE Fields

Three fields added to the block model **after** `limit` (rows 6, 7, and 8):

| Field | Type | Default | Description |
|---|---|---|---|
| `paginate` | boolean | `false` | Enable pagination. When `false`, all items render at once (current behavior). |
| `pageSize` | number | `5` | Items per page. Supports any positive integer (e.g. 5, 10, 20). Ignored when `paginate` is `false`. |
| `urlState` | boolean | `false` | Persist current page in `?page=N` URL param. Enables shareable links and browser back/forward. **Only meaningful when `paginate` is `true`** — ignored otherwise. Note: UE does not support conditional field visibility, so this field always appears in the property panel. |

**Interaction with `limit`:**
- `limit` caps the total items available (e.g. limit=20 means at most 20 items across all pages).
- `pageSize` controls how many of those items appear per page.
- Both can be set independently.

### Implementation — `blocks/list/list.js`

#### `readConfig` update

Add three new rows:

```js
paginate:  get(6) === 'true',
pageSize:  parseInt(get(7), 10) || 5,
urlState:  get(8) === 'true',
```

Row indices stay stable because the new fields are appended after the existing 6 fields.

#### New `renderPaginatedList(pages, config, block)` function

Branches on `urlState` to choose between URL-based and in-memory page tracking. Render logic and controls are identical in both paths.

```
renderPaginatedList(pages, config, block):
  { pageSize, urlState } = config
  totalPages = Math.ceil(pages.length / pageSize)

  // --- URL state path ---
  function getPageFromUrl():
    p = parseInt(new URLSearchParams(location.search).get('page'), 10) || 1
    return Math.max(1, Math.min(p, totalPages)) - 1   // clamp, convert to 0-based

  // --- In-memory path ---
  currentPage = 0   // used only when urlState is false

  function render(page):
    block.innerHTML = ''
    const slice = pages.slice(page * pageSize, (page + 1) * pageSize)
    block.append(renderList(slice, config))
    if totalPages > 1:
      block.append(buildPaginationControls(page, totalPages, onPageChange))

  function onPageChange(newPage):
    if urlState:
      const params = new URLSearchParams(location.search)
      params.set('page', newPage + 1)           // URL is 1-based
      history.pushState(null, '', `?${params}`)
    else:
      currentPage = newPage
    render(newPage)
    block.scrollIntoView({ behavior: 'smooth', block: 'start' })

  if urlState:
    window.addEventListener('popstate', () => render(getPageFromUrl()))
    render(getPageFromUrl())
  else:
    render(0)
```

**URL scheme (when `urlState` is `true`):** `?page=N` (1-based). Page 1 needs no param — clean URL on initial load.

#### `buildPaginationControls(currentPage, totalPages, onChange)` helper

Returns a `<nav class="list-pagination">` element:

```html
<nav class="list-pagination" aria-label="List pagination">
  <button class="list-pagination-btn list-pagination-prev" disabled?>← Previous</button>
  <span class="list-pagination-info">Page 1 of 3</span>
  <button class="list-pagination-btn list-pagination-next" disabled?>Next →</button>
</nav>
```

- Prev button disabled on page 0; Next button disabled on last page.
- Clicking fires `onChange(newPage)`.

#### `decorate` update

```js
const limited = limit > 0 ? sorted.slice(0, limit) : sorted;

if (paginate && limited.length > pageSize) {
  renderPaginatedList(limited, config, block);
} else {
  block.append(renderList(limited, config));
}
```

When `paginate` is `true` but all items fit on one page (`limited.length <= pageSize`), no controls are rendered — the pagination nav is omitted entirely.

### Implementation — `blocks/list/list.css`

```css
.list .list-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-gray, #e0e0e0);
}

.list .list-pagination-btn {
  padding: 0.5rem 1.25rem;
  border: 1px solid var(--color-gray, #e0e0e0);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: var(--body-font-size-s, 0.9rem);
  color: var(--link-color, #035fe6);
  transition: background 0.15s ease, color 0.15s ease;
}

.list .list-pagination-btn:hover:not(:disabled) {
  background: var(--link-color, #035fe6);
  color: #fff;
}

.list .list-pagination-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.list .list-pagination-info {
  font-size: var(--body-font-size-s, 0.9rem);
  color: var(--color-gray-dark, #666);
  min-width: 6rem;
  text-align: center;
}
```

### Implementation — `blocks/list/_list.json`

Append two fields to the `models[0].fields` array and add defaults to the `definitions` template:

```json
// in models[0].fields (after "limit"):
{
  "component": "boolean",
  "valueType": "boolean",
  "name": "paginate",
  "label": "Enable Pagination",
  "description": "Show items across multiple pages instead of all at once.",
  "value": false
},
{
  "component": "number",
  "valueType": "number",
  "name": "pageSize",
  "label": "Items Per Page",
  "description": "Number of items per page (e.g. 5 or 10). Ignored when pagination is disabled.",
  "value": 5
},
{
  "component": "boolean",
  "valueType": "boolean",
  "name": "urlState",
  "label": "Persist Page in URL",
  "description": "Store the current page in ?page=N so links are shareable and back/forward works. Only applies when pagination is enabled.",
  "value": false
}

// in definitions[0].plugins.xwalk.page.template:
"paginate": false,
"pageSize": 5,
"urlState": false
```

### Build Step

After editing `_list.json`:

```bash
npm run build:json
```

### Files Changed (Phase 2)

| File | Change |
|---|---|
| `blocks/list/_list.json` | Add `paginate`, `pageSize`, `urlState` fields + template defaults |
| `blocks/list/list.js` | Update `readConfig`, add `buildPaginationControls`, add `renderPaginatedList`, update `decorate` |
| `blocks/list/list.css` | Add `.list-pagination*` styles |
| `component-models.json` | Generated — rebuilt by `npm run build:json` |
| `component-definition.json` | Generated — rebuilt by `npm run build:json` |

### Known Limitations (Phase 2)

- `urlState` is always visible in the UE property panel regardless of whether `paginate` is enabled. It is silently ignored in JS when `paginate` is `false` — UE does not support conditional field visibility.
- When `urlState` is `true`, multiple list blocks on the same page would share the `?page=N` param and both respond to it. Use `urlState` only on pages with a single list block.
- On the author tier, `history.pushState` is a no-op inside the UE iframe; pagination still works visually but the URL won't update. This is acceptable for authoring.
- `pageSize` accepts any positive integer via the UE number input; no min/max validation is enforced in the model.

---

## Phase 3: List Style Variants

### Goal

Add a `listStyle` select field so authors can choose the visual layout of the list without custom CSS.

### New UE Field

One field appended after `urlState` (row 9):

| Field | Type | Default | Options |
|---|---|---|---|
| `listStyle` | select | `card` | `card`, `small`, `medium` |

### Style Descriptions

| Value | Layout |
|---|---|
| `card` | Responsive grid (1 → 2 → 3 columns). Full-width 16:9 image above the text body. Default behavior. |
| `small` | Vertical list with a small 3 rem square thumbnail on the left. Compact row, minimal padding. |
| `medium` | Vertical list with a wider image on the left (10–12 rem). Border + hover shadow. Chevron vertically centred via `align-self: center`. |

### Implementation

- `readConfig`: add `listStyle: get(9) || 'card'`
- `decorate`: add `block.classList.add(\`list-style-\${listStyle}\`)`
- CSS: base styles are shared; each variant is scoped under `.list.list-style-{value}`

### Files Changed (Phase 3)

| File | Change |
|---|---|
| `blocks/list/_list.json` | Add `listStyle` field + template default |
| `blocks/list/list.js` | Read `listStyle` from row 9, add class in `decorate` |
| `blocks/list/list.css` | Refactor into shared base + three scoped variant sections |
| `component-models.json` | Generated |
| `component-definition.json` | Generated |
