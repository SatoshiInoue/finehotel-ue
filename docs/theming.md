# Theming Guide

> Japanese version: [docs/ja/theming.md](./ja/theming.md)

## Two-Layer CSS Variable System

Brand colors are injected via `--brand-*` variables which fall back to project defaults:

```
--brand-*  (set by theme class on body)
    ↓ fallback
--main variable  (defined in styles/styles.css)
    ↓ used by
components
```

When a theme is selected in page properties, AEM applies it as a class on `<body>` (e.g. `body.mango-haze`). CSS scoped to that class overrides the `--brand-*` variables.

---

## CSS Custom Properties Reference

### Colors

```css
--background-color:  var(--brand-background-color, #ffffff)
--dark-color:        var(--brand-dark-color,        #131313)
--light-color:       var(--brand-light-color,       #dcdcdc)
--text-color:        var(--brand-text-color,        #131313)
--text-light:        var(--brand-light-text-color,  #ffffff)
--link-color:        var(--brand-link-color,        #131313)
--link-hover-color:  var(--brand-link-hover-color,  #F97316)
--main-accent-color: var(--brand-theme-color,       #FB923C)
```

### Header / Footer

```css
--nav-background-color:    var(--brand-nav-background-color,    #0000008c)
--nav-text-color:          var(--brand-nav-text-color,          #ffffff)
--footer-background-color: var(--brand-footer-background-color, #000)
--footer-text-color:       var(--brand-footer-text-color,       #ffffff)
--nav-height: 64px
```

### Fonts

```css
--body-font-family:    'Adobe Clean', roboto, sans-serif
--heading-font-family: 'Adobe Clean Bold', roboto-condensed, sans-serif
--light-font-family:   'Adobe Clean Light', roboto, sans-serif
--black-font-family:   'Adobe Clean Black', roboto, sans-serif  /* heaviest, used for hero headings */
```

### Font Sizes

```css
/* Mobile-first (≤900px) */
--heading-font-size-xxl: 55px   --body-font-size-m: 22px
--heading-font-size-xl:  44px   --body-font-size-s: 19px
--heading-font-size-l:   34px   --body-font-size-xs: 17px

/* Desktop (≥900px) — slightly smaller */
--heading-font-size-xxl: 45px   --body-font-size-m: 18px
```

### Spacing

```css
--spacing-none: 0       --spacing-small: 1rem    --spacing-large: 2.5rem
--spacing-xtiny: .125rem  --spacing-regular: 1.5rem  --spacing-xlarge: 3rem
--spacing-tiny: .25rem   --spacing-medium: 2rem   --spacing-xxlarge: 4rem
--spacing-xxsmall: .5rem                           --spacing-huge: 5rem
--spacing-xsmall: .75rem                           --spacing-xhuge: 6rem
```

### Border Radius

```css
--border-radius-none:    0
--border-radius-small:   0.125rem
--border-radius-base:    0.25rem
--border-radius-medium:  0.5rem
--border-radius-large:   1rem
--border-radius-x-large: 2rem
```

---

## Built-in Themes

| Theme name | value | Colors |
|-----------|-------|--------|
| Default | `""` | Orange accent (#FB923C) |
| Mango Haze | `mango-haze` | Warm mango tones |
| Lavender Chill | `lavender-chill` | Cool lavender tones |
| Meadow Light | `meadow-light` | Natural green tones |

---

## Adding a New Theme

### 1. Add CSS to `styles/styles.css`

The theme class is applied to `<body>` by `scripts/aem.js`. Scope all overrides accordingly:

```css
body.midnight-ocean {
  --brand-theme-color:         #0D9488;
  --brand-background-color:    #0F172A;
  --brand-dark-color:          #1E293B;
  --brand-light-color:         #334155;
  --brand-text-color:          #E2E8F0;
  --brand-light-text-color:    #F8FAFC;
  --brand-link-color:          #0D9488;
  --brand-link-hover-color:    #14B8A6;
  --brand-nav-background-color: #0F172A;
  --brand-footer-background-color: #0F172A;
}
```

### 2. Add option to `models/_component-models.json`

Find the `page-metadata` model's `theme` select field:

```json
{ "name": "Midnight Ocean", "value": "midnight-ocean" }
```

### 3. Also update `models/_page.json`

The `theme` select exists in both `_component-models.json` and `_page.json`. Update both.

### 4. Run the build

```bash
npm run build:json
```

> The CSS class value (`midnight-ocean`) must exactly match the JSON `value` field.

---

## Responsive Breakpoints

```css
/* Desktop ≥ 1024px */
@media (width >= 1024px) { }

/* Tablet / large mobile ≥ 900px */
@media (width >= 900px) { }

/* Tablet ≥ 768px */
@media (width >= 768px) { }

/* Tablet and below < 1024px */
@media (width < 1024px) { }

/* Mobile < 768px */
@media (width < 768px) { }
```

---

## Section Background Styles

Configured via the `backgroundstyle` field on a Section component:

| Value | Description |
|-------|-------------|
| `default` | Normal background |
| `color-primary` | Primary brand color |
| `color-secondary` | Secondary brand color |
| `color-tertiary` | Tertiary brand color |
| `image-background` | Background image (requires additional config) |
| `gradient-light` | Light gradient |
| `gradient-dark` | Dark gradient |

---

## Block-Level Theme Support

Blocks can independently support `theme-dark` / `theme-light` classes:

```css
/* block.css */
.my-block.theme-dark {
  background: var(--dark-color);
  color: var(--text-light);
}
.my-block.theme-light {
  background: var(--light-color);
  color: var(--text-color);
}
```

---

## Icons

Place SVGs in `icons/` and reference them with `:icon-name:` syntax in content. `decorateIcons()` in `aem.js` converts them to `<img>` elements.

```
icons/
├── arrow-right.svg
└── facebook.svg
```
