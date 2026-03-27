# List Block — Usage Guide

The List block dynamically fetches and displays child pages under a configurable root path. Authors configure it entirely through Universal Editor — no code changes needed.

---

## Universal Editor Configuration

Place a `List` block on a page and configure the following fields in the right panel.

| Field | Type | Description |
|---|---|---|
| **Root Path** | Text | EDS path whose direct children to list, e.g. `/en/news`. |
| **Sort By** | Select | `Alphabetical` (title A–Z), `Last Modified` (newest first), `List Order` (numeric). |
| **Show Description** | Toggle | Display the page description below the title. |
| **Show Image** | Toggle | Display the page thumbnail (`og:image`). |
| **Show Date** | Toggle | Display the last modified date. |
| **Max Items** | Number | Maximum items to show. `0` means no limit. |
| **Enable Pagination** | Toggle | Split the list across multiple pages with Prev/Next controls. |
| **Items Per Page** | Number | Items shown per page (default: `5`). Only used when pagination is enabled. |
| **Persist Page in URL** | Toggle | Store the current page number as `?page=N` so links are shareable and browser back/forward works. Only meaningful when pagination is enabled. |
| **List Style** | Select | Visual layout: `Card`, `Small`, or `Medium`. |

---

## List Styles

### Card (default)

Responsive grid layout. Image shown above the text at 16:9 aspect ratio.

- Mobile: 1 column
- Tablet (600px+): 2 columns
- Desktop (900px+): 3 columns

### Small

Compact vertical list. A small square thumbnail (3 rem) appears on the left of each row. Best for long lists or space-constrained layouts.

### Medium

Horizontal card list. A wider image (10–12 rem) on the left, title/description/date on the right. Each row has a border and a hover shadow.

---

## Sort Modes

### Alphabetical

Items sorted ascending by title (locale-aware).

### Last Modified

Items sorted descending by last-modified date — newest first. Suited to news or announcement listings.

### List Order

Items sorted ascending by each page's `listOrder` metadata value (number). Pages without a value sort alphabetically at the end.

To set `listOrder`, open the page in Universal Editor, go to **Page Properties**, and enter a number in the **List Order** field.

---

## Environment Behaviour

The block automatically selects the right data source depending on where it runs.

| Environment | Data source | Pages shown |
|---|---|---|
| Author (`adobeaemcloud.com`) | AEM JCR (Sling GET `.2.json`) | All pages, including drafts |
| EDS (`*.aem.page` / `*.aem.live`) | `{rootPath}/query-index.json` (ffetch) | Published pages only |
| Local dev (`localhost:3000`) | Same as EDS | Published pages only |

On the author tier, draft pages are also visible — the same approach used by the dynamic navigation.

---

## Pagination

Enable **Enable Pagination** to split the list into pages with `← Previous` and `Next →` buttons.

- **Max Items** and **Items Per Page** work independently. Example: Max Items = 20, Items Per Page = 5 → at most 4 pages.
- If all items fit on one page (total ≤ Items Per Page), the pagination controls are hidden.
- **Persist Page in URL**: when on, the current page number is appended as `?page=N` (1-based). Page 1 has no parameter — clean URL on load.

> **Note:** Use Persist Page in URL only when a single List block is on the page. Multiple List blocks on the same page would share the `?page=N` parameter and interfere with each other.

---

## Adding a New List Path (`helix-query.yaml`)

On EDS, the block first tries a scoped index at `{rootPath}/query-index.json`. This file is **not generated automatically** — it requires an explicit entry in `helix-query.yaml`.

### When to add an entry

Any time you configure a new Root Path that does not already have a dedicated index, add a matching entry to `helix-query.yaml`.

### Example entry

```yaml
events-en:
  include:
    - '/en/events/**'
  target: /en/events/query-index.json
  properties:
    <<: *base-site
```

- `include` — path pattern for pages to index
- `target` — output path for the index file (Root Path + `/query-index.json`)
- `properties: <<: *base-site` — inherits shared properties (`title`, `description`, `image`, `lastModified`, `listOrder`, etc.)

A separate entry is required per language. For `/ja/events`, add an `events-ja` entry with the same structure.

### Fallback behaviour (no entry)

If `{rootPath}/query-index.json` does not exist, the block falls back to `/{lang}/query-index.json` and filters by path prefix. The list still renders, but the full language index is downloaded — higher payload. Use scoped indices in production.

---

## Limitations

- Only **direct children** of Root Path are listed. Grandchild pages are not included.
- The list is **JavaScript-rendered**. Crawlers that do not execute JavaScript (including most AI/AIO crawlers) will not see the list items or their links. Ensure important internal links are also present in static HTML (e.g. in the nav or within article content).
- **Newly published pages** appear only after EDS re-indexes them — not in real time.
- The **language root page** (`/en.html`) works correctly as an authoring context — the `.html` suffix is stripped automatically.

---

## Configuration Examples

### News listing (image + date, newest first, paginated)

| Field | Value |
|---|---|
| Root Path | `/en/news` |
| Sort By | `Last Modified` |
| Show Image | On |
| Show Date | On |
| Enable Pagination | On |
| Items Per Page | `10` |
| List Style | `Card` |

### Compact link list

| Field | Value |
|---|---|
| Root Path | `/en/services` |
| Sort By | `Alphabetical` |
| List Style | `Small` |

### Featured articles (capped count, manual order)

| Field | Value |
|---|---|
| Root Path | `/en/news` |
| Sort By | `List Order` |
| Show Description | On |
| Show Image | On |
| Max Items | `4` |
| List Style | `Medium` |
