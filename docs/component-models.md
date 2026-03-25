# Component Models Guide

> Japanese version: [docs/ja/component-models.md](./ja/component-models.md)

## The Three JSON Files

| File | Purpose |
|------|---------|
| `component-definition.json` | Registers components in Universal Editor's insert panel |
| `component-models.json` | Field definitions (property panel UI) |
| `component-filters.json` | Composition rules (what can be nested where) |

> **Never edit the root `component-*.json` files directly** — they are generated. Edit the source files in `models/` and `blocks/`, then run `npm run build:json`.

---

## Source File Structure and Build

```
models/_component-definition.json  ──┐
blocks/hero/_hero.json               ├──▶ component-definition.json
blocks/cards/_cards.json             ┘

models/_component-models.json  ──────┐
blocks/hero/_hero.json               ├──▶ component-models.json
                                     ┘

models/_component-filters.json  ─────┐
blocks/cards/_cards.json             ┘──▶ component-filters.json
```

The `_component-definition.json` file uses a glob to pull in all block JSON:

```json
{
  "title": "Blocks",
  "id": "blocks",
  "components": [
    { "...": "../blocks/*/_*.json#/definitions" }
  ]
}
```

---

## component-definition.json — Component Registration

Defines what appears in the Universal Editor component picker.

### One component entry

```json
{
  "title": "My Block",
  "id": "my-block",
  "plugins": {
    "xwalk": {
      "page": {
        "resourceType": "core/franklin/components/block/v1/block",
        "template": { "name": "My Block", "model": "my-block" }
      }
    }
  }
}
```

### Component groups

| Group | ID | Contents |
|-------|----|----------|
| Default Content | `default` | Button, Image, Text, Title |
| Sections | `sections` | Section |
| Blocks | `blocks` | All blocks (auto-merged via glob) |
| Custom Form Components | `custom-form` | Form fields |
| Healthcare | `healthcare` | Find a Doctor |
| BFSI | `bfsi` | Forex |

---

## component-models.json — Field Definitions

Defines the property panel fields for each component.

### Model structure

```json
{
  "id": "my-block",
  "fields": [
    {
      "component": "text",
      "valueType": "string",
      "name": "title",
      "label": "Title",
      "required": false,
      "value": ""
    }
  ]
}
```

### Field types

#### Text

```json
{ "component": "text",     "valueType": "string", "name": "title",  "label": "Title" }
{ "component": "richtext", "valueType": "string", "name": "text",   "label": "Body" }
```

#### Select / Boolean

```json
{
  "component": "select", "name": "layout", "label": "Layout",
  "options": [{ "name": "Default", "value": "" }, { "name": "Dark", "value": "dark" }]
}
{ "component": "boolean", "name": "showTitle", "label": "Show Title", "value": "true", "valueType": "boolean" }
{ "component": "multiselect", "name": "tags", "label": "Tags", "options": [...] }
```

#### Assets / References

```json
{ "component": "reference",   "valueType": "string", "name": "image",    "label": "Image", "multi": false }
{ "component": "aem-content", "name": "fragment",    "label": "Content Fragment" }
{ "component": "aem-tag",     "name": "cq:tags",     "label": "Tags", "rootPath": "/content/cq:tags/my-project" }
```

#### UI

```json
{ "component": "tab", "label": "Settings", "name": "tab-settings" }
```

---

## component-filters.json — Composition Rules

Controls what child components can be added to a parent.

```json
{ "id": "cards",     "components": ["card"] }
{ "id": "accordion", "components": ["accordion-item"] }
{ "id": "columns",   "components": ["column"] }
{ "id": "tabs",      "components": ["tabs-item"] }
```

### Adding a new block to section

Edit `models/_component-filters.json`:

```json
{
  "id": "section",
  "components": ["accordion", "cards", "hero", "...", "my-new-block"]
}
```

---

## Full Block JSON Structure (`_{name}.json`)

```json
{
  "definitions": [
    {
      "title": "My Block",
      "id": "my-block",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": { "name": "My Block", "model": "my-block" }
          }
        }
      }
    }
  ],
  "models": [
    {
      "id": "my-block",
      "fields": [
        { "component": "text",      "name": "title",  "label": "Title",  "valueType": "string" },
        { "component": "richtext",  "name": "text",   "label": "Body",   "valueType": "string" },
        { "component": "reference", "name": "image",  "label": "Image",  "multi": false },
        {
          "component": "select", "name": "style", "label": "Style",
          "options": [{ "name": "Default", "value": "" }, { "name": "Dark", "value": "dark" }]
        }
      ]
    }
  ],
  "filters": []
}
```

---

## page-metadata Model

Defined in `models/_component-models.json`. Controls page properties in Universal Editor.

| Field | Type | Purpose |
|-------|------|---------|
| `jcr:title` | text | Page title (required) |
| `jcr:pagetitle` | text | Display title |
| `jcr:description` | text | Meta description |
| `cq:tags` | aem-tag | Tags |
| `theme` | select | Theme: `mango-haze`, `lavender-chill`, `meadow-light` |
| `pageName` | text | Page identifier |
| `pageCategory` | text | Page category |

> **Note:** Theme options also exist in `models/_page.json`. Both files must be updated when adding a new theme.

---

## Build Commands

```bash
npm run build:json               # Rebuild all three files
npm run build:json:definitions   # component-definition.json only
npm run build:json:models        # component-models.json only
npm run build:json:filters       # component-filters.json only
```
