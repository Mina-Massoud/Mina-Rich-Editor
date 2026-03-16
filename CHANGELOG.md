# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## 0.3.0 (2026-03-15)

### Breaking Changes

- `Editor` no longer bundles demo UI — `QuickModeToggle`, `ExportButton`, and `TemplateSwitcher` are removed from the public component tree.
- `onNotionBasedChange` prop removed from `Editor`. Use the `onChange` prop or `useEditorAPI()` instead.

### Features

- **Extension system** — `Extension.create()`, `Node.create()`, `Mark.create()` — TipTap-inspired API without ProseMirror, letting you build and ship custom block types as plain objects.
- **`ExtensionManager`** — central registry for nodes, marks, commands, keyboard shortcuts, input rules, and slash commands; resolved at provider mount time.
- **`CommandManager`** with TipTap-style chaining: `editor.chain().toggleBold().toggleItalic().run()`.
- **`StarterKit`** — 22 built-in extensions (16 nodes + 6 marks) ready out of the box; pass to `EditorProvider` via the new `extensions` prop.
- **Input rules on all built-in extensions** — Markdown auto-conversion (`# ` → heading, `**text**` → bold, etc.) is now declared per-extension rather than in a monolithic handler.
- **`EditorProvider` `extensions` prop** — accept a custom extension set to replace or augment the defaults.
- **`useExtensionManager()` hook** — access the live extension registry from any component inside the provider tree.
- **Extensible `NodeType`** — custom node types are now expressible via the `(string & {})` union; no core changes required.
- **3 CSS theme presets** — Notion, Minimal, and GitHub themes importable from `@mina-editor/core/themes/notion` etc.
- **Flat node map (`buildNodeMap`)** — O(1) node lookups in `useBlockNode`, replacing recursive tree searches.
- **TypeDoc API reference generation** — run `pnpm docs:api` to emit a full HTML API reference.
- **CompactEditor** — self-contained embeddable editor with an inline formatting toolbar. Designed as the primary drop-in component for CMS and app integrations.
- **Markdown shortcuts** — type `# `, `## `, `### `, `> `, `-`, `1.`, ` ``` `, or `---` at the start of a block for instant type conversion.
- **Markdown paste** — pasting Markdown text auto-converts it to rich block nodes.
- **`useEditorAPI()` hook** — provides `getJSON()`, `getHTML()`, `getMarkdown()`, `getPlainText()`, `setContent()`, `isDirty()`, and `getBlockCount()` as a stable, non-reactive API for CMS consumers.
- **Semantic HTML export** — `serializeToSemanticHtml()` outputs clean, Tailwind-free HTML ready for storage or display.
- **Markdown export** — `serializeToMarkdown()` for full round-trip Markdown serialization.
- **`onChange` prop** — debounced (300 ms) callback on `CompactEditor` delivering `{ json, html }` on every content change.
- **`EditorAPI` type** — exported interface describing the programmatic API surface.

### Performance

- Editor container no longer re-renders on content changes; the `BlockWrapper` pattern isolates each block's reactivity.
- Stable callback pattern with `useRef` eliminates stale closures in event handlers.
- Measured 2.8 ms per-character typing overhead.

### Bug Fixes

- Fixed content disappearing on typing, Enter key, and Notion-style block toggle.
- Fixed copy-paste creating new blocks instead of inserting inline.
- Fixed toolbar buttons being disabled in `CompactEditor` caused by React Strict Mode ID mismatch.
- Fixed floating `SelectionToolbar` not appearing (changed `position: absolute` to `fixed`).
- Replaced 20+ `setTimeout` hacks with `requestAnimationFrame` for deterministic DOM timing.
- Batched Enter key dispatches to prevent intermediate re-renders between split and focus operations.
- Fixed stale `history[historyIndex]` references — replaced with `state.current` reads throughout the store.
- Removed bogus dependencies (`i`, `npm`, `@y/websocket-server`) that inflated the install footprint.

### Code Quality

- 969 tests: 759 unit tests + 210 E2E tests (Playwright).
- All `console.log` statements removed from production code.
- JSDoc added to every exported function and component.
- Removed unused imports and dead code across handlers and utilities.

---

## 0.2.0 (2025-12-01)

### Features

- Initial public release of the JSON-based document model.
- `EditorProvider` + `useEditorState` / `useEditorDispatch` store pattern.
- `EditorActions` factory for inserting, updating, moving, and deleting nodes.
- `serializeToHtml` utility for basic HTML output.
- Tree operation utilities: `findNodeById`, `insertNode`, `moveNode`, `cloneNode`, `traverseTree`.
- Inline formatting utilities: `applyFormatting`, `removeFormatting`, `mergeAdjacentTextNodes`.
