# CLAUDE.md — finehotel-ue

> Japanese guide: [docs/ja/claude-guide.md](./docs/ja/claude-guide.md)

## Project

**finehotel-ue** — AEM Edge Delivery Services (EDS) + Universal Editor (XWalk) website.

- **Content delivery:** AEM EDS (CDN edge)
- **Content authoring:** AEM Universal Editor
- **Content source:** AEM Author (`author-p161901-e1740392.adobeaemcloud.com`)

## Directory Structure

```
blocks/    # Block components — each has {name}.js, {name}.css, _{name}.json
models/    # UE component definition sources (_*.json) — edit these, not root files
scripts/   # Core scripts (aem.js, scripts.js, utils.js)
styles/    # Global styles and CSS variables (styles.css, fonts.css)
docs/      # Developer documentation (EN: docs/*.md, JA: docs/ja/*.md)
.claude/skills/eds/  # Claude skill for EDS block development
```

## Key Commands

```bash
npm run build:json   # Merge models/_*.json + blocks/**/_*.json → component-*.json
npm run lint         # JS + CSS lint check
```

> Always run `npm run build:json` after editing any `_*.json` source file.

## Important Rules

- **Never edit root `component-*.json`** — generated files, overwritten by build
- **Block JSON source** = `blocks/{name}/_{name}.json` and `models/_*.json`
- **New block** = also add name to `section` filter in `models/_component-filters.json`
- **Theming** = use `body.{theme-class}` CSS scope, override `--brand-*` variables
- **DOM restructuring** = always call `moveInstrumentation()` to preserve `data-aue-*` attributes
- **Block decorator** = `export default function decorate(block) { ... }`

## Documentation

| File | Content |
|------|---------|
| `docs/project-overview.md` | Architecture, directory structure, build system |
| `docs/block-development.md` | Block authoring patterns, decorator examples |
| `docs/component-models.md` | JSON definition/model/filter editing |
| `docs/theming.md` | CSS variables, theme system, responsive breakpoints |
| `docs/ja/` | Japanese versions of all above |

## EDS Skill

Use `/eds` for guided block development, model editing, and theming tasks.
Skill source: `.claude/skills/eds/SKILL.md`
