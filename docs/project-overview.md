# Project Overview — finehotel-ue

> Japanese version: [docs/ja/project-overview.md](./ja/project-overview.md)

## Architecture

```
AEM Author (Cloud Service)
    │  Content editing via Universal Editor
    ▼
AEM EDS (Edge Delivery Services)
    │  Franklin Delivery API serves content as HTML
    │  Mount point configured in fstab.yaml
    ▼
CDN Edge
    │  Caches static JS/CSS/HTML
    ▼
Browser
    │  aem.js + scripts.js decorate blocks
    ▼
```

### Content Flow

1. **Edit:** Author content in AEM via Universal Editor
2. **Preview:** Verify on `*.aem.page`
3. **Publish:** Serve from `*.aem.live`

---

## Directory Structure

### `blocks/`

Each block is a self-contained directory.

```
blocks/
├── hero/
│   ├── hero.js          # Decorator (required)
│   ├── hero.css         # Styles (required)
│   └── _hero.json       # UE component definition (required)
├── cards/
│   ├── cards.js
│   ├── cards.css
│   └── _cards.json
└── ... (26 blocks total)
```

**All blocks:**

| Block | Purpose |
|-------|---------|
| accordion | Collapsible sections |
| action-button | Action button |
| cards | Card grid |
| carousel | Image/content carousel |
| columns | Multi-column layout |
| content-fragment | AEM Content Fragment |
| dynamic-media-image | Dynamic Media image |
| dynamic-media-video | Dynamic Media video |
| dynamicmedia-image | DM image (alternate) |
| dynamicmedia-template | DM template rendering |
| embed-adaptive-form | Embedded AEM Forms |
| find-a-doctor | Healthcare specialty search |
| footer | Site footer |
| forex | Foreign exchange rates |
| form | Adaptive Forms integration |
| fragment | Content fragment reference |
| header | Site header / navigation |
| hero | Hero section (8 layout variants) |
| iframe | Embedded iframe |
| quote | Quote / testimonial |
| search | Search functionality |
| separator | Visual divider |
| tabs | Tab navigation |
| teaser | Teaser / CTA |
| video | Video player |

---

### `models/`

Source files for Universal Editor component definitions (`_*.json`).
Built into the root `component-*.json` files via `npm run build:json`.

```
models/
├── _component-definition.json  # Component group definitions
├── _component-models.json      # Shared models (page-metadata, image, title, etc.)
├── _component-filters.json     # Composition rules
├── _image.json
├── _text.json
├── _title.json
├── _button.json
├── _section.json
└── _page.json
```

> **Note:** `blocks/**/_*.json` files are also merged automatically via glob.

---

### `scripts/`

| File | Purpose |
|------|---------|
| `aem.js` | AEM EDS core library (block decoration, DOM helpers) |
| `scripts.js` | App entry point (page init, theme application) |
| `utils.js` | Utilities (language detection, date formatting) |
| `ffetch.js` | Content fetching abstraction |
| `dom-helpers.js` | DOM utilities |
| `editor-support.js` | Universal Editor support |
| `delayed.js` | Lazy load handler |
| `slider.js` | Slider/carousel logic |

---

### `styles/`

| File | Purpose |
|------|---------|
| `styles.css` | Global styles and CSS custom properties |
| `fonts.css` | Font declarations |
| `slider.css` | Carousel-specific styles |
| `lazy-styles.css` | Deferred styles |

---

## Configuration Files

### `fstab.yaml`

Content mount point from AEM Author.

```yaml
mountpoints:
  /:
    url: "https://author-p161901-e1740392.adobeaemcloud.com/bin/franklin.delivery/SatoshiInoue/finehotel-ue/main"
    type: "markup"
    suffix: ".html"
```

### `paths.json`

Multi-language URL mapping.

```json
{
  "/":    "/content/finehotel-ue/us/en",
  "/en/": "/content/finehotel-ue/us/en",
  "/fr/": "/content/finehotel-ue/us/fr",
  "/es/": "/content/finehotel-ue/us/es",
  "/de/": "/content/finehotel-ue/us/de",
  "/ja/": "/content/finehotel-ue/us/ja"
}
```

### `helix-query.yaml`

Query index config. Provides page metadata as JSON at `/query-index.json` per language, used for card listings and sitemaps.

---

## Page / Component Hierarchy

```
Page  (page-metadata model)
└── Section  (spacing, background controls)
    ├── Hero
    ├── Cards
    │   └── Card  (1-to-many)
    ├── Columns
    │   └── Column  (1-to-many)
    │       ├── Button / Image / Text
    ├── Accordion
    │   └── Accordion Item
    ├── Tabs
    │   └── Tab Item
    └── ... (20+ other blocks)
```

---

## Build System

`npm run build:json` uses `merge-json-cli` to merge source JSON into the root files that Universal Editor reads.

```
models/_component-definition.json ──┐
blocks/hero/_hero.json              ├──▶ component-definition.json
blocks/cards/_cards.json            ┘

models/_component-models.json ──────┐
blocks/hero/_hero.json (models)     ├──▶ component-models.json
                                    ┘

models/_component-filters.json ─────┐
blocks/cards/_cards.json (filters)  ┘──▶ component-filters.json
```

---

## i18n

Supported languages: EN / FR / ES / DE / JA

- Language detection via `getLanguage()` / `PATH_PREFIX` in `scripts/utils.js`
- i18n text via `scripts/placeholders.js`
- Each language has its own `query-index.json`
