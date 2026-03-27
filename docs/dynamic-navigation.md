# Dynamic Navigation — Usage Guide

Dynamic navigation auto-populates the header nav from the AEM page hierarchy instead of requiring manually maintained links in `nav.html`. Any page created under the language root appears in the nav automatically.

---

## How It Works

The data source differs by environment.

| Environment | Data source | Pages shown |
|---|---|---|
| Author (`adobeaemcloud.com`) | AEM JCR (Sling GET `.2.json`) | All pages, including drafts |
| EDS Preview (`*.aem.page`) | `/{lang}/query-index.json` | Published pages only |
| EDS Live (`*.aem.live`) | `/{lang}/query-index.json` | Published pages only |
| Local dev (`localhost:3000`) | `/{lang}/query-index.json` | Published pages only |

On the author tier, draft (unpublished) pages are visible in the nav — this is intentional, matching how traditional AEM works.

---

## Activation

Empty the `<ul>` list inside the Text block in `nav.html`. That is the only change needed.

- List is empty → dynamic nav (auto-generated from page hierarchy)
- List has items → static nav (backward compatible)

Once `nav.html` is published with an empty list, dynamic mode is permanent unless you add items back.

---

## Controlling Nav Items

Set the following fields on each page via **Page Properties** in Universal Editor (click "Page" at the top of the right panel).

| Field | Type | Description |
|---|---|---|
| **Nav Order** | Number | Position in the nav (ascending). Pages without a value sort alphabetically at the end. |
| **Hide in Nav** | Toggle | When `true`, the page is excluded from the nav entirely. |

### Sort priority

1. Pages with a `navOrder` value — sorted ascending (1, 2, 3 …)
2. Pages without a `navOrder` value — sorted alphabetically, appended at the end

**Example:** Set `navOrder = 1` on About Us, `navOrder = 2` on News, and leave Campaigns unset. Result: `About Us → News → Campaigns`.

---

## Setting Page Properties

1. Open the page in Universal Editor.
2. Click **Page** at the top of the right panel to open page properties.
3. Set **Nav Order** (number) and/or **Hide in Nav** (toggle).
4. Save and publish the page to EDS.

> **Important:** Changes to `navOrder` or `hideInNav` are only reflected in the EDS query index after the page is re-published. The author environment reflects changes immediately.

---

## `helix-query.yaml` Configuration

For `navOrder` and `hideInNav` to appear in the EDS query index, the following properties must be present in `helix-query.yaml` under the `&base-site` anchor.

```yaml
navOrder:
  select: head > meta[name="navorder"]
  value: attribute(el, "content")
hideInNav:
  select: head > meta[name="hideinnav"]
  value: attribute(el, "content")
```

> **Important:** AEM XWalk renders JCR page property names as **all-lowercase** meta tag names with no hyphens (e.g. `navOrder` → `<meta name="navorder">`). Selectors using kebab-case (`nav-order`) or camelCase (`navOrder`) will not match.

Defining these properties on the `&base-site` anchor means all language indices (`site-en`, `site-ja`, etc.) inherit them automatically via `<<: *base-site`.

---

## Adding a New Language

To support dynamic nav for a new language (e.g. `/de`), add a language index entry to `helix-query.yaml`.

```yaml
site-de:
  <<: *base-site
  include:
    - '/de'
    - '/de/**'
  exclude:
    - /de/nav
    - /de/footer
    - /de/search
  target: /de/query-index.json
```

The `<<: *base-site` merge key inherits all properties including `navOrder` and `hideInNav`.

---

## Limitations

- Only **direct children** of the language root are shown. Sub-pages are not supported.
- The **language root page itself** (`/en.html`) works correctly as an authoring context — the `.html` suffix is stripped automatically during JCR path resolution.
- **Newly published pages** appear in the nav only after EDS re-indexes them (not real-time on preview/live).
- **`navOrder` / `hideInNav` changes** take effect on EDS only after the page is re-published. On the author they are immediate.
- **Sub-navigation** (nested dropdowns) is out of scope — top-level pages only.
- **Directory order** (drag-and-drop order in the AEM Sites console) is not exposed in the EDS query index and therefore cannot be used as a sort mode. Use explicit `navOrder` values instead.

---

## Author Workflow

1. Create a page under `/content/.../en/` in the AEM Sites console or Universal Editor — it appears in the nav on the author immediately.
2. Optionally set **Nav Order** and/or **Hide in Nav** in page properties.
3. Publish the page to EDS — the query index updates and the live nav reflects the change.
4. To pin a page to a specific position, set a `navOrder` number. Pages with no number sort alphabetically after all pinned pages.
