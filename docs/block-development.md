# Block Development Guide

> Japanese version: [docs/ja/block-development.md](./ja/block-development.md)

## Block Structure

Each block lives in `blocks/{name}/` with three files:

```
blocks/my-block/
├── my-block.js      # Decorator — called by AEM EDS on page load
├── my-block.css     # Styles
└── _my-block.json   # Universal Editor component definition
```

---

## Decorator Function (JS)

AEM EDS calls the `default export` function from `blocks/{name}/{name}.js` when decorating a page.

### Minimal pattern

```javascript
export default function decorate(block) {
  // block = the .my-block div element
  // Manipulate the DOM here to render the block
}
```

### DOM structure

AEM EDS generates this structure from content:

```html
<div class="my-block block" data-block-name="my-block">
  <div>              <!-- Row 1 -->
    <div>Field 1 value</div>
    <div>Field 2 value</div>
  </div>
  <div>              <!-- Row 2 -->
    <div>...</div>
  </div>
</div>
```

- Outer `div` = row (one model instance)
- Inner `div` = field (in model field order)

---

## Pattern: Reading config fields and applying CSS classes

From `blocks/hero/hero.js` — reads a field value and adds it as a CSS class:

```javascript
export default function decorate(block) {
  // Read field at position N (1-indexed nth-child)
  const layoutStyle = block.querySelector(':scope div:nth-child(4) > div')
    ?.textContent?.trim() || 'overlay';

  // Add as class — CSS handles the rest
  block.classList.add(layoutStyle);

  // Hide config div to keep DOM clean
  block.querySelector(':scope div:nth-child(4)')?.style.setProperty('display', 'none');
}
```

CSS then targets `.hero.fullscreen-vertical { ... }`, `.hero.image-left { ... }`, etc.

---

## Pattern: Restructuring DOM (table → list)

From `blocks/cards/cards.js` — transforms rows into a `<ul>`:

```javascript
import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');

    // Preserve Universal Editor data-aue-* attributes — required!
    moveInstrumentation(row, li);

    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div, index) => {
      if (index === 0) div.className = 'cards-card-image';
      else if (index === 1) div.className = 'cards-card-body';
      else div.style.display = 'none'; // hide config fields
    });

    ul.append(li);
  });

  // Optimize images
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(ul);
}
```

---

## Universal Editor: `moveInstrumentation`

Universal Editor attaches `data-aue-*` attributes to DOM elements to identify components for in-context editing. Always call `moveInstrumentation()` when moving an element to a new container — without it, editing overlays break.

```javascript
import { moveInstrumentation } from '../../scripts/scripts.js';

// Move attributes from original row to new li
moveInstrumentation(row, li);
```

Transfers all `data-aue-*` and `data-richtext-*` attributes.

### Detecting author environment

```javascript
import { isAuthorEnvironment } from '../../scripts/scripts.js';

if (isAuthorEnvironment()) {
  // Author-only logic
}
```

---

## Block JSON (`_{name}.json`)

Three sections: `definitions` (UE registration), `models` (field definitions), `filters` (composition rules).

### Minimal example

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
        { "component": "text",      "valueType": "string", "name": "title",  "label": "Title" },
        { "component": "richtext",  "valueType": "string", "name": "text",   "label": "Body" },
        { "component": "reference", "valueType": "string", "name": "image",  "label": "Image", "multi": false },
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

### With child components (e.g. Cards → Card)

```json
{
  "filters": [
    { "id": "cards", "components": ["card"] }
  ]
}
```

---

## Field Component Types

| Component | Use | Key options |
|-----------|-----|-------------|
| `text` | Single-line text | `valueType: "string"` |
| `richtext` | Rich text | `valueType: "string"` |
| `boolean` | Checkbox | `value: "true"/"false"` |
| `select` | Dropdown | `options: [{name, value}]` |
| `multiselect` | Multi-select | `options` |
| `reference` | Image / asset | `multi: false/true` |
| `aem-content` | AEM content path | — |
| `aem-tag` | Tag browser | `rootPath` |
| `tab` | Tab separator (UI only) | — |

---

## Useful `aem.js` Utilities

```javascript
import {
  createOptimizedPicture,  // Responsive <picture> from img URL
  decorateButtons,         // Wrap <a> tags with .button class
  decorateIcons,           // Convert :icon-name: to <img>
  getMetadata,             // Get page metadata value
  loadCSS,                 // Dynamically load a CSS file
  loadScript,              // Dynamically load a JS file
  fetchPlaceholders,       // Get i18n text map
  readBlockConfig,         // Read key-value table from block
  toClassName,             // Convert string to CSS class name
} from '../../scripts/aem.js';
```

---

## CSS Naming Convention

```css
.my-block { }                    /* block wrapper */
.my-block .my-block-image { }   /* image area */
.my-block .my-block-body { }    /* content area */
.my-block.dark { }              /* variant via class combo */

@media (width >= 900px) { }     /* desktop */
@media (width < 768px) { }      /* mobile */
```

---

## Adding a New Block: Step-by-Step

1. **Create the directory and files**
   ```bash
   mkdir blocks/my-block
   touch blocks/my-block/my-block.js
   touch blocks/my-block/my-block.css
   touch blocks/my-block/_my-block.json
   ```

2. **Write `_my-block.json`** — definitions, models, filters

3. **Update `models/_component-filters.json`** — add block name to the `section` filter:
   ```json
   { "id": "section", "components": ["...", "my-block"] }
   ```

4. **Run the build**
   ```bash
   npm run build:json
   ```

5. **Implement `my-block.js` and `my-block.css`**
