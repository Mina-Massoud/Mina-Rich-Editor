# Mina Rich Editor — Senior Engineering Guide

Lessons and patterns for contributors working on the Mina Rich Editor library and its landing page.

---

## 1. Style Isolation

**Rule:** Every CSS selector that targets editor internals MUST be scoped under `.mina-editor`.

- **Never** use bare `[contenteditable]`, `::selection`, or `ul[data-list-type]` selectors in `globals.css`.
- All editor-scoped rules live in `src/styles/editor-variables.css`.
- The host app's `globals.css` should only contain app-level resets, Tailwind config, and animations.

```css
/* WRONG — leaks to every contenteditable on the page */
[contenteditable]:focus { outline: none; }

/* RIGHT — scoped to the editor */
.mina-editor [contenteditable]:focus { outline: none; }
```

---

## 2. CSS Custom Properties

All consumer-facing customization uses `--mina-*` variables defined in `editor-variables.css`.

- Prefix: `--mina-` (never `--editor-` or bare names).
- Defaults are set in the `.mina-editor` block.
- Dark mode overrides go in `.dark .mina-editor` and `.mina-editor[data-theme='dark']`.
- Consumers override by targeting `.mina-editor` in their own CSS — no need to import Tailwind.

---

## 3. Dark Mode

Support both patterns:

| Pattern | Selector | When |
|---------|----------|------|
| Ancestor class | `.dark .mina-editor` | next-themes, manual toggle |
| Data attribute | `.mina-editor[data-theme='dark']` | Standalone usage without a theme provider |

Always include both selectors when adding dark-mode overrides.

---

## 4. Landing Page Patterns

### Section numbering
Sections are numbered sequentially: 01 Features, 02 Notion, 03 Quick Start, 04 Comparison, 05 Screenshots. When adding a section, renumber all subsequent sections.

### Shared primitives
- `heroColors` (aliased as `c`) — the warm neutral palette. Use `c[50]` for headlines, `c[200]` for accents, `c[300]` for body, `c[400]` for muted, `c[900]` for dark backgrounds.
- `GridBg` — SVG grid background. Pass a unique `id` prop.
- `SectionHeader` — Consistent section divider with number and label.
- `Dots` — Three decorative dots for code/screenshot frames.

### Backgrounds
Alternate between transparent (with `GridBg`) and `#111111` solid backgrounds for visual rhythm.

---

## 5. Library Boundaries

| File | Purpose |
|------|---------|
| `src/app/globals.css` | App-level resets, Tailwind theme, animations. **No editor rules.** |
| `src/styles/editor-variables.css` | All `--mina-*` variables, scoped editor selectors, dark mode overrides |
| `src/lib/index.ts` | Public API exports — only add what consumers need |

---

## 6. Animation Gotcha

Never use Tailwind's `opacity-0` class as the initial state for CSS animations. Tailwind applies `opacity: 0` as an inline utility which has higher specificity than keyframe values, so the element stays invisible.

```tsx
// WRONG — element stays invisible
<div className="opacity-0 animate-fade-in">

// RIGHT — use inline style
<div style={{ opacity: 0 }} className="animate-fade-in">
```

This applies to any Tailwind class that competes with a keyframe property.
