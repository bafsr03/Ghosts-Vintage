# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the **Horizon v3.5.0** Shopify theme customized for the Ghosts Vintage store (`ghost-vintage-6371.myshopify.com`). It is a pure Shopify theme export — no build tools, no package.json, no npm. All assets are served directly via Shopify's CDN.

## Development Workflow

There is no local build step. Development is done with the Shopify CLI:

```bash
shopify theme dev --store=ghost-vintage-6371.myshopify.com   # Live preview with hot reload
shopify theme push                                             # Push to store
shopify theme pull                                             # Pull latest from store
```

The `.gitignore` intentionally excludes `settings_data.json` (commented out, currently tracked). This file holds active merchant-configured settings and should be handled carefully.

## Architecture

### Template Rendering Stack
1. `layout/theme.liquid` — master HTML wrapper for all pages; includes header/footer groups, modals, view transitions, and import maps
2. `templates/*.json` — define which sections appear on each page type
3. `sections/*.liquid` — page-level layout components with `{% schema %}` blocks
4. `blocks/_*.liquid` — content modules embedded within sections (prefixed with `_`)
5. `snippets/*.liquid` — reusable utilities rendered via `{% render 'snippet-name' %}`

### JavaScript: Web Components + ES Modules
All interactive UI is built as native Web Components extending a base `Component` class (`assets/component.js`). Components use:
- `refs = {}` — auto-populated DOM references
- `requiredRefs = ['...']` — validated at init
- `connectedCallback()` — lifecycle entry point

The import map in `snippets/scripts.liquid` resolves bare specifiers like `@theme/component`, `@theme/product-form`, etc. to their asset URLs.

### Key Assets
- `assets/component.js` — base class for all web components
- `assets/utilities.js` — shared helpers (idle callbacks, device detection, view transitions)
- `snippets/scripts.liquid` — import map + module bootstrap
- `snippets/color-schemes.liquid` — CSS custom property generation for color theming
- `config/settings_schema.json` — theme editor schema (defines what merchants can configure)
- `config/settings_data.json` — current active settings (6 color schemes, typography, spacing, etc.)

### Color & Typography System
CSS custom properties (`--color-*`, `--font-*`) are generated at render time from `config/settings_data.json`. Six color schemes (`scheme-1` through `scheme-6`) are defined and referenced by sections/blocks via `color_scheme` settings. Never hardcode colors — use the scheme variables.

### Localization
Translation keys use `t:key_path` notation (e.g., `{{ 'general.cart.title' | t }}`). Schema labels use the same notation pointing into `locales/*.schema.json` files. The default locale is `locales/en.default.json`.

### Section/Block Pattern
Each section file contains a `{% schema %}` JSON block defining its settings and allowed block types. Blocks reference `@theme` blocks (from `blocks/_*.liquid`) or `@app` blocks. The `block.shopify_attributes` variable must be included on block root elements to enable editor selection.

### View Transitions
The theme uses the native View Transitions API. Controlled via `settings.page_transition_enabled` and `settings.transition_to_main_product`. The meta tag `<meta name="view-transition" content="same-origin">` is conditionally rendered in `layout/theme.liquid`.
