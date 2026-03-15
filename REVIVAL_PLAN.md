# Mina Rich Editor — Full Revival Plan

> **Goal:** Transform a dead, buggy, AI-generated Next.js app into a production-grade, embeddable rich text editor library — a TipTap alternative with Notion-style block editing and full customization.

> **Status:** In progress. Created 2026-03-15.

---

## Current State Assessment

### What Exists (updated 2026-03-15)
- Block-based editor with paragraph, heading, list, image, video, table, code, blockquote, flex-container support
- Zustand store with per-block subscriptions and structural sharing
- EditorContext for stable callback delivery (36→4 Block props)
- BlockWrapper pattern — Editor doesn't re-render on content changes
- Stable getter pattern — all handlers use lazy container access
- 173 unit tests (reducer, tree-ops, selection-range, smoke)
- 40 Playwright E2E tests (typing, Enter, undo, formatting, clipboard, blocks, lists, drag, performance)
- tsup build config outputting ESM/CJS with correct `.mjs`/`.cjs` extensions
- npm package name: `@mina-editor/core`

### What Was Broken → Fixed

| Category | Was | Now |
|----------|-----|-----|
| **Packaging** | `dist/index.cjs` missing, `next` in deps | Fixed: correct extensions, deps moved to devDeps |
| **Code Quality** | console.log in prod, `require()`, setTimeout hacks | Fixed: all cleaned, rAF, static imports, JSDoc |
| **Architecture** | Editor 1100 lines, Block 600 lines, 36 props | Fixed: Editor 782, Block 494, 4 props via context |
| **Performance** | Editor re-rendered on every keystroke | Fixed: 0 re-renders on content, 2.8ms/char overhead |
| **Content Bugs** | Text vanished on typing, Enter, notion toggle | Fixed: 5 root causes identified and resolved |
| **Clipboard** | Paste created new blocks instead of inline insert | Fixed: single-line paste handled natively |

### What's Still Broken

| Category | Issues |
|----------|--------|
| **Architecture** | No extension system, hardcoded block types/marks |
| **Testing** | Need 300+ unit tests (currently 173), need handler-level tests |
| **Accessibility** | No ARIA labels, no keyboard nav in toolbars |
| **Customization** | Tailwind baked in, no CSS variables, no theming API |
| **Documentation** | No API docs, no usage examples |
| **Markdown** | No inline Markdown shortcuts (only list auto-detect) |

---

## Architecture Vision

### Inspired by TipTap, differentiated by simplicity

```
@mina-editor/core      → Headless engine: document model, commands, extensions, state
@mina-editor/react      → React bindings: useEditor hook, EditorContent, NodeView renderer
@mina-editor/starter-kit → Sensible defaults: paragraph, heading, list, bold, italic, etc.
@mina-editor/ui         → Optional pre-built UI: toolbar, bubble menu, slash commands (Tailwind)
```

**Key differentiators vs TipTap:**
- JSON-native document model (no ProseMirror dependency)
- Block-first editing (Notion-style) vs inline-first (ProseMirror-style)
- Built-in block drag-and-drop
- Simpler extension API (no schema language, just TypeScript)
- Pre-built UI package (TipTap is headless-only, users must build everything)

---

## Phase Plan

### Phase 1: Critical Fixes ██████████ DONE
> Fix bugs that break basic usage.

- [x] Fix content disappearing on typing/Enter/notion toggle (5 root causes)
- [x] Fix stale container closures — getter pattern for all handlers
- [x] Fix nodeRef callback overwriting DOM with stale state
- [x] Batch Enter key dispatches with `EditorActions.batch()`
- [x] Fix `require()` → static `import`
- [x] Fix package.json: deps → devDeps, exports field, tsup naming
- [x] Fix clipboard: single-line paste now handled natively (inline, not new block)

---

### Phase 2: Code Cleanup ████████░░ ~80%
> Strip debug output, fix patterns, add documentation.

- [x] Remove all console.log/warn from production code
- [x] Remove debug render counting, EditorProvider debug prop
- [x] Replace ~20 setTimeout hacks with `requestAnimationFrame`
- [x] Add one-sentence JSDoc to every exported function (18 files)
- [ ] Remove unused imports across all files
- [ ] Enforce strict TypeScript: remove `as any` casts
- [ ] Remove deleted git-tracked files

---

### Phase 3: Architecture Refactor ██████░░░░ ~60%
> Split monoliths, extract patterns, decouple from Next.js.

**Done:**
- [x] EditorContext — Block 36 props → 4 props (`nodeId`, `isActive`, `isFirstBlock`, `depth`)
- [x] Block memo comparator — 25 lines → 4 comparisons
- [x] Extracted 5 hooks: useImageSelection, useTableOperations, useEditorClipboard, useEditorSelection, useMediaPaste
- [x] Editor.tsx: 1100 → 782 lines
- [x] Block.tsx: 600 → 494 lines
- [x] BlockWrapper component — per-block subscription, isolates container access
- [x] FreePositionedImages, ConnectedExportButton, ConnectedTemplateSwitcher — isolated components

**Remaining:**
- [ ] Extension system (`Extension.create()`, `Node.create()`, `Mark.create()`)
- [ ] ExtensionManager, StarterKit bundle
- [ ] Migrate block types + marks to extension format
- [ ] Decouple from Next.js (remove next-themes, next/image from library components)

---

### Phase 4: Performance ████████░░ ~80%
> Eliminate unnecessary re-renders, optimize the hot path.

**Done:**
- [x] Stable callback pattern — all 18 handler factories use container getter
- [x] Editor no longer re-renders on content changes (removed `useContainer()` subscription)
- [x] BlockWrapper + `useContainerChildrenIds()` — JSX tree not rebuilt on keystroke
- [x] EditorContext via `useMemo` — stable value reference
- [x] Benchmarked: 2.8ms/char overhead, 0 Editor DOM mutations, 14ms scroll for 214 blocks

**Remaining:**
- [ ] MutationObserver for content sync (eliminate active block re-render during typing)
- [ ] Flat node map (`Map<id, node>` for O(1) lookups)
- [ ] Inverted history (store diffs not full snapshots)
- [ ] Virtualization for 100+ block documents

---

### Phase 5: CMS-Ready & Embeddable Component ░░░░░░░░░░ NEXT
> Make the editor a drop-in component for any CMS. Clean HTML/MD export, fits in any container.

This is the hardest and most important phase. The editor must:
- Be a single `<Editor />` component that fits in **any `<div>` container** (not full-page)
- Serialize to **clean semantic HTML** that works in WordPress, Strapi, Contentful, or any CMS
- Parse **any HTML** back to the block model with 100% fidelity
- Support **Markdown import/export** with full round-trip

#### 5a: Embeddable Component Architecture ✅ DONE
> The editor must be a self-contained component, not a page layout.

- [x] Stripped demo UI from Editor: QuickModeToggle, ExportFloatingButton, TemplateSwitcherButton
- [x] Removed CardContent wrapper, shadow/border hardcoded styles
- [x] Removed max-w-6xl and mx-auto — editor fills any container
- [x] Added `className` prop for consumer styling
- [x] Moved demo features to page.tsx (DemoControls, DemoExportButton, DemoTemplateSwitcher)
- [x] Editor outer div: `flex flex-col w-full h-full` — fills container

#### 5b: Semantic HTML Serialization ✅ DONE
> Output clean HTML that any CMS can render without Tailwind.

- [x] Created `serializeToSemanticHtml(container, options?)` in `src/lib/utils/serialize-semantic-html.ts`
- [x] Pure semantic tags: `<strong>`, `<em>`, `<u>`, `<del>`, `<code>`, `<a>` — NO Tailwind classes
- [x] List wrapping: consecutive li→`<ul>`, ol→`<ol>`
- [x] Media: `<figure><img>`, `<figure><video>` with optional `<figcaption>`
- [x] Tables: proper `<table><thead><tr><th>` structure
- [x] Options: `includeStyles` (colors/font-sizes as inline styles), `wrapInArticle`
- [x] Empty nodes skipped, HTML entities escaped
- [x] 23 unit tests, exported from index.ts
- [x] Kept existing `serializeToHtml()` for internal Tailwind use

Previously planned items (now done):
  ```html
  <!-- Current (broken for CMS): -->
  <h1 class="text-4xl font-bold text-foreground leading-[1.2] mb-2">Title</h1>
  <p class="text-base text-foreground leading-[1.6]">
    <span class="font-bold" data-bold="true">Bold</span> text
  </p>

  <!-- Target (CMS-ready): -->
  <h1>Title</h1>
  <p><strong>Bold</strong> text</p>
  ```
- [ ] Map inline formatting to semantic tags:
  - `bold` → `<strong>`, `italic` → `<em>`, `underline` → `<u>`
  - `strikethrough` → `<del>`, `code` → `<code>`, `href` → `<a>`
  - Custom colors → `style="color: #hex"` (inline styles, not classes)
  - Font sizes → `style="font-size: 16px"` (inline styles)
- [ ] Handle all block types:
  - h1-h6 → `<h1>`-`<h6>` (no classes)
  - p → `<p>`
  - blockquote → `<blockquote>`
  - code → `<pre><code>`
  - li → `<ul><li>` or `<ol><li>` (proper list wrapping)
  - img → `<figure><img alt="..." /><figcaption>...</figcaption></figure>`
  - video → `<figure><video controls src="..."></video></figure>`
  - hr → `<hr />`
  - br → `<br />`
  - table → `<table><thead><tr><th>...` (proper structure)
  - container (flex) → `<div style="display:flex; gap:1rem">` (inline styles)
- [ ] Options: `{ includeStyles?: boolean, includeIds?: boolean, wrapInArticle?: boolean }`
- [ ] Keep existing `serializeToHtml()` for internal/Tailwind use, add new function for CMS

#### 5c: HTML → Block Model Parser (Full Fidelity) ✅ DONE
> Parse any HTML back into the editor's block model with zero data loss.

- [x] Fixed list parsing: all `<li>` items extracted, `<ul>`→li type, `<ol>`→ol type
- [x] Added table parsing: `<table>` → full StructuralNode tree (thead/tbody/tr/th/td)
- [x] Added video/audio parsing (including `<figure>` wrappers, `<source>` fallback)
- [x] Image alt text extracted and stored in attributes
- [x] Inline styles parsed: font-weight→bold, font-style→italic, text-decoration, color, font-size
- [x] 46 unit tests covering all fixes, edge cases, XSS sanitization

#### 5d: Markdown Support ✅ DONE
> Full Markdown ↔ Block Model conversion.

- [x] `serializeToMarkdown(container)` — all block types, inline formatting, tables, lists
- [x] `parseMarkdownToNodes(markdown)` — line-by-line parser, fenced code blocks, inline formatting, tables
- [x] No external dependencies — custom parser handles all standard Markdown
- [x] 24 serialization tests + 32 parsing tests = 56 tests

#### 5e: CMS Integration API ✅ DONE
> Clean API for CMS frameworks to get/set content.

- [x] `useEditorAPI()` hook: `getJSON()`, `getHTML()`, `getMarkdown()`, `getPlainText()`, `setContent()`, `isDirty()`, `getBlockCount()`
- [x] All getters are non-reactive (no re-renders)
- [x] `onChange` prop on Editor: fires with `{ json, html }` on content changes (debounced 300ms)
- [x] `useEditorStoreInstance()` exported for advanced store access
- [x] Exported from `src/lib/index.ts`

**Files created/modified:**
- `src/lib/utils/serialize-semantic-html.ts` ✅ 23 tests
- `src/lib/utils/serialize-markdown.ts` ✅ 24 tests
- `src/lib/utils/parse-markdown.ts` ✅ 32 tests
- `src/lib/utils/html-to-nodes.ts` ✅ Fixed + 46 tests
- `src/hooks/useEditorAPI.ts` ✅ CMS API hook
- `src/components/Editor.tsx` ✅ Embeddable + onChange
- `src/lib/store/editor-store.ts` ✅ useEditorStoreInstance
- `src/lib/index.ts` ✅ All exports added

---

### Phase 6: Markdown Input Rules ██████████ DONE
> Type Markdown syntax → auto-converts to rich blocks (Notion-style).

**Block-level rules** (type prefix → auto-convert on Space):
- [x] `# ` → H1, `## ` → H2, `### `-`###### ` → H3-H6
- [x] `> ` → Blockquote
- [x] ` ``` ` → Code block
- [x] `---`/`***`/`___` → Horizontal rule
- [x] `1. text` → Ordered list (existed before)
- [x] `- text`/`* text` → Unordered list (existed before)

**Inline formatting rules** (type closing marker → auto-format):
- [x] `**text**` → bold
- [x] `*text*` → italic (doesn't conflict with `**`)
- [x] `` `text` `` → inline code
- [x] `~~text~~` → strikethrough

**12 E2E tests pass** (8 block-level + 4 inline formatting)

---

### Phase 7: Test Coverage ░░░░░░░░░░
> Comprehensive tests for the final architecture.

**Current:** 173 unit tests + 40 E2E tests
**Target:** 300+ unit tests + 50+ E2E tests

- [ ] Handler unit tests: selection, keyboard, node ops, clipboard, drag-drop
- [ ] Inline formatting unit tests: apply/remove/parse
- [ ] Serialization tests: HTML export/import
- [ ] Markdown rules tests (after Phase 5)
- [ ] Extension system tests (after Phase 3 extension work)

---

### Phase 8: Packaging + Theming ██████░░░░ ~60%
> Monorepo, CSS variables, npm publish.

**Done:**
- [x] README.md — professional docs with quick start, API reference, markdown shortcuts table
- [x] LICENSE — MIT, Mina Massoud 2025-2026
- [x] CHANGELOG.md — v0.3.0 with all features, fixes, breaking changes
- [x] CSS variable system — `src/styles/editor-variables.css` with `.mina-editor` scope, dark mode
- [x] `mina-editor` class added to Editor and CompactEditor wrappers
- [x] CSS export path: `@mina-editor/core/styles`
- [x] package.json v0.3.0, files includes LICENSE, CHANGELOG, styles

**Remaining:**
- [ ] pnpm workspace monorepo split (core, react, starter-kit, ui)
- [ ] Turborepo, Changesets, GitHub Actions CI
- [ ] Theme presets: notion, minimal, github
- [ ] npm publish with provenance

---

### Phase 9: Docs + Accessibility ████████░░ ~80%
> Make it adoptable and accessible.

**Done:**
- [x] README with quick start, API reference, Markdown shortcuts table
- [x] WCAG 2.1 AA compliance:
  - `role="textbox"`, `aria-multiline`, `aria-label` on editor containers
  - `role="toolbar"`, `aria-label`, `aria-orientation` on all toolbars
  - `aria-pressed` for toggle buttons (bold/italic/etc.)
  - `aria-haspopup`, `aria-expanded` on dropdowns/popovers
  - `role="listbox"` + `role="option"` on block type dropdown
  - `aria-label` on every contenteditable block (e.g., "paragraph block")
  - Arrow key navigation in CompactToolbar (roving tabIndex)
  - Focus-visible indicators via CSS (2px solid primary outline)
  - `prefers-reduced-motion` support (disables all animations)
- [x] GitHub Actions CI: type-check, unit tests, build, E2E tests
- [x] GitHub Actions publish workflow (npm with provenance)
- [x] Issue templates (bug report, feature request)

**Remaining:**
- [ ] RTL text support
- [ ] Documentation site (Nextra/Starlight)
- [ ] Auto-generated API reference (TypeDoc)

---

### Phase 10: Landing Page + Differentiators ██████████ DONE
> Professional product page that sells the library.

- [x] Hero section with animated gradient headline and CTA
- [x] Features grid (6 cards: blocks, markdown, CMS, variants, performance, TypeScript)
- [x] Live code example with syntax-highlighted CompactEditor setup
- [x] TipTap comparison table (9 features, side-by-side with check/x/warning icons)
- [x] Screenshots section (automated Playwright captures: full editor, compact, markdown shortcuts)
- [x] CTA footer with npm install command
- [x] Framer Motion scroll animations on all sections
- [x] Dark/light mode compatible
- [x] Responsive design (mobile → desktop)

---

### Phase 11: Inverted Operations (Memory Fix) ░░░░░░░░░░ ← NEXT
> Replace full-snapshot history with operation-based undo/redo. ~200x memory savings.

- [ ] New types: `HistoryEntry`, `HistoryOperation`, `undoStack`/`redoStack`
- [ ] Rewrite `addToHistory()` to record forward+backward operations
- [ ] Rewrite `handleUndo`/`handleRedo` to apply inverted operations
- [ ] Update all node-ops and format-ops to capture before-state for undo
- [ ] Update store selectors (`state.current` instead of `state.history[historyIndex]`)
- [ ] Update all components and hooks referencing historyIndex/historyLength
- [ ] Update 86+ reducer tests for new state shape
- [ ] Memory benchmark: <1MB for 50 undo operations

**Files:** `types.ts`, `shared.ts`, `history-ops.ts`, `node-ops.ts`, `format-ops.ts`, `editor-store.ts`, `editor-reducer.ts`, `Editor.tsx`, `CompactEditor.tsx`, all hooks

---

### Phase 12: Y.js Collaboration ░░░░░░░░░░
> Real-time multi-user editing via Y.js CRDT. Free, not paid like TipTap.

**Requires Phase 11 (operation tracking).**

- [ ] Y.js binding: convert HistoryOperations ↔ Y.js mutations
- [ ] Awareness: cursor presence, user colors, name labels
- [ ] `useCollaboration()` hook + `<CollaborationProvider>` component
- [ ] `<RemoteCursor>` component for showing other users' cursors
- [ ] WebSocket provider (consumer provides server URL)
- [ ] Offline edits merge on reconnect
- [ ] Peer deps: `yjs`, `y-websocket`

---

### Phase 13: Free AI Content API ░░░░░░░░░░
> Built-in AI content generation. Consumer brings their own API key. FREE — not like TipTap's paid AI.

- [ ] `AIProvider` interface (stream-based)
- [ ] `createOpenAIProvider()` / `createAnthropicProvider()` adapters
- [ ] `useEditorAI()` hook: `generateContent(prompt)` streams into blocks
- [ ] `/ai` slash command integration
- [ ] Works with any LLM endpoint (OpenAI, Anthropic, Ollama, custom)

---

### Future (Deferred)
- Complex plugin/extension system (TipTap-style)
- @mentions/autocomplete
- DOCX/PDF export
- Mobile touch gestures

---

### Phase 6: Customization & Theming
> Make every visual aspect customizable without forking.

- [ ] **CSS variable system**: Define all colors, spacing, typography as CSS custom properties
  ```css
  .mina-editor {
    --mina-font-body: system-ui;
    --mina-font-heading: inherit;
    --mina-color-primary: #0066ff;
    --mina-spacing-block: 0.5rem;
    --mina-border-radius: 0.375rem;
  }
  ```
- [ ] **Remove Tailwind from core**: Use CSS variables + minimal CSS. Tailwind only in `@mina-editor/ui`
- [ ] **Headless mode**: Core renders zero styles, consumer provides all CSS
- [ ] **Theme presets**: Ship `notion`, `minimal`, `github` themes as CSS files
- [ ] **Configurable block spacing, indentation, font sizes**
- [ ] **Custom block renderers**: Allow consumers to provide React components for any block type
- [ ] **Slot-based toolbar**: Consumers can compose toolbar with provided primitives

---

### Phase 7: Accessibility
> WCAG 2.1 AA compliance.

- [ ] Add `role="textbox"`, `aria-multiline="true"`, `aria-label` to editor container
- [ ] Add `role="toolbar"`, `aria-label` to toolbars
- [ ] Keyboard navigation: Tab through toolbar buttons, Enter to activate
- [ ] Focus management: visible focus indicators on all interactive elements
- [ ] Screen reader announcements for block type changes, formatting applied
- [ ] High contrast mode support
- [ ] Reduced motion support (`prefers-reduced-motion`)
- [ ] RTL text support

---

### Phase 8: Library Packaging & Publishing
> Monorepo setup, proper exports, npm publish.

- [ ] Set up pnpm workspace monorepo:
  ```
  packages/
    core/        → @mina-editor/core (engine, state, commands)
    react/       → @mina-editor/react (hooks, components)
    starter-kit/ → @mina-editor/starter-kit (default extensions)
    ui/          → @mina-editor/ui (pre-built toolbar, menus)
  apps/
    demo/        → Next.js demo site
    docs/        → Documentation site
  ```
- [ ] Configure Turborepo for build orchestration
- [ ] Set up Changesets for version management
- [ ] Configure proper peer dependencies for each package
- [ ] Add LICENSE, CHANGELOG.md, CONTRIBUTING.md
- [ ] Set up GitHub Actions CI: lint, test, build, publish
- [ ] Publish to npm with provenance
- [ ] Create GitHub releases with changelogs

---

### Phase 9: Documentation & Developer Experience
> Make it easy for developers to adopt.

- [ ] **README.md**: Quick start, installation, basic usage with code examples
- [ ] **API Reference**: Auto-generated from TypeScript types (TypeDoc or similar)
- [ ] **Extension Guide**: How to create custom block types, marks, commands
- [ ] **Migration Guide**: For users coming from TipTap, Slate, or Draft.js
- [ ] **Interactive Examples**: CodeSandbox/StackBlitz templates
- [ ] **Documentation Site**: Built with Nextra or Starlight
- [ ] **Storybook**: Component gallery for `@mina-editor/ui`

---

### Phase 10: Markdown Input Rules (Notion-style)
> Type Markdown syntax and it auto-converts to rich blocks — exactly like Notion.

This is a core editing feature that makes the editor feel magical. The contenteditable already handles the typing; we just detect patterns on input and convert blocks/formatting in-place.

**Already exists (partial):**
- [x] `1. text` → ordered list (keyboard-handlers.ts)
- [x] `- text` or `* text` → unordered list (keyboard-handlers.ts)
- [x] Markdown table parser (markdown-table-parser.ts)

**Block-level input rules** (detect at start of line, convert block type on Space):
- [ ] `# ` → Heading 1
- [ ] `## ` → Heading 2
- [ ] `### ` → Heading 3
- [ ] `> ` → Blockquote
- [ ] `` ``` `` → Code block (on Enter after triple backtick)
- [ ] `---` → Horizontal rule / divider (on Enter)
- [ ] `[] ` or `[ ] ` → Todo/checkbox item
- [ ] `1. ` → Ordered list (already done ✓)
- [ ] `- ` or `* ` → Unordered list (already done ✓)

**Inline formatting rules** (detect when closing mark is typed):
- [ ] `**text**` → **bold** (strip markers, apply bold mark)
- [ ] `*text*` → *italic* (strip markers, apply italic mark)
- [ ] `` `code` `` → `code` (strip backticks, apply code mark)
- [ ] `~~text~~` → ~~strikethrough~~ (strip markers, apply strikethrough mark)
- [ ] `[text](url)` → clickable link (strip syntax, create link)
- [ ] `![alt](url)` → image block (replace line with image node)

**Markdown paste** (paste Markdown text, auto-convert to blocks):
- [ ] Intercept paste event, detect if content is Markdown
- [ ] Parse Markdown string → array of EditorNode blocks
- [ ] Insert parsed blocks at cursor position
- [ ] Support: headings, paragraphs, lists, blockquotes, code blocks, images, links, bold/italic

**Implementation approach:**
- Block rules: In `createHandleContentChange` (keyboard-handlers.ts), add pattern matching before the content dispatch. When pattern matches, dispatch `updateNode` to change block type and strip the prefix.
- Inline rules: In `createHandleInput` (block-event-handlers.ts), check for closing markers (`**`, `*`, `` ` ``, `~~`) and apply formatting programmatically.
- Paste rules: In clipboard-handlers.ts `createHandlePaste`, detect Markdown content and use a Markdown→nodes parser.

**Files to modify:**
- `src/lib/handlers/keyboard-handlers.ts` — block-level input rules
- `src/lib/handlers/block/block-event-handlers.ts` — inline formatting rules
- `src/lib/handlers/clipboard-handlers.ts` — Markdown paste
- `src/lib/utils/markdown-parser.ts` — new file: full Markdown→EditorNode parser

---

### Phase 11: Growth Features
> Features that make the library competitive and drive adoption.

- [ ] **Collaboration**: Y.js integration for real-time multi-user editing
- [ ] **Slash commands**: Already exists, make it extensible
- [ ] **Mention/autocomplete**: `@user` mentions with configurable data source
- [ ] **AI integration**: LLM-powered writing assistance API
- [ ] **Export formats**: HTML, Markdown, PDF, DOCX
- [ ] **Mobile-first**: Touch gestures, responsive toolbar, swipe actions
- [ ] **Plugins marketplace**: Community extensions registry

---

## Execution Strategy

### Team Pattern
- **Opus 4.6** → Orchestrator + Planner + Code Review
- **Sonnet 4.6** → Coders (parallel agents in worktrees)
- **Playwright** → Automated testing after each phase

### Progress Overview
```
Phase 1 (Critical Fixes)          ██████████ DONE
Phase 2 (Code Cleanup)            ██████████ DONE
Phase 3 (Architecture Refactor)   ██████░░░░ ~60%
Phase 4 (Performance)             ████████░░ ~80%
Phase 5 (CMS-Ready + Embeddable)  ██████████ DONE
Phase 6 (Markdown Input Rules)    ██████████ DONE
Phase 7 (Test Coverage)           ████████░░ ~75% (377 unit + 63 E2E)
>>> BUG-FIX SPRINT <<<           ██████████ DONE
Phase 8 (Packaging + Theming)     ████████░░ ~80% (README, LICENSE, CHANGELOG, CSS vars, CI. Remaining: monorepo, npm publish)
Phase 9 (Docs + Accessibility)    ████████░░ ~80% (ARIA, keyboard nav, focus indicators, reduced motion, CI. Remaining: RTL, docs site)
Phase 10 (Landing + Differentiators) ██████████ DONE
Phase 11 (Memory Fix: Inverted Ops) ░░░░░░░░░░ ← NEXT
Phase 12 (Y.js Collaboration)       ░░░░░░░░░░
Phase 13 (Free AI Content API)      ░░░░░░░░░░
```

---

### Bug-Fix Sprint (before Phase 8)
> Fix user-reported bugs that break core editing. No new features until these are solid.

**Bug 1: Markdown paste not converting**
- Paste Markdown text (headings, lists, bold, code blocks) → should convert to rich blocks
- Currently treated as plain text — each line becomes a `<p>`
- Root cause: `createHandlePaste` checks for `text/html` first, then `text/plain`. Plain text goes to `parsePlainTextToNodes` which splits on `\n` but doesn't detect Markdown
- Fix: detect Markdown patterns in plain text and use `parseMarkdownToNodes()` instead

**Bug 2: Text gone on delete after paste**
- After pasting multi-line content, deleting text causes content to disappear
- Needs Playwright reproduction to identify exact scenario
- Likely: pasted nodes have wrong structure or IDs conflict

**Bug 3: Popover toolbar not showing in CompactEditor**
- Select text in CompactEditor → floating SelectionToolbar should appear, but doesn't
- Fixed: scoped selectionchange handler (checks if selection is within this editor's DOM)
- Still broken: `currentSelection` in store may not be populated correctly
- Needs: verify the full pipeline: DOM selection → selectionchange → handler → store → toolbar render

**Bug 4: CompactToolbar buttons disabled**
- Bold/Italic/etc buttons show `disabled` state even when text is selected
- Root cause: `hasSelection` reads from `currentSelection` in store which is `null`
- Same root cause as Bug 3 — selection state not reaching the store

### Rules
1. **No phase without tests.** Every change must have a test before or alongside it.
2. **No breaking changes.** Current users must be able to upgrade without rewriting.
3. **Ship incrementally.** Each phase produces a usable, publishable version.
4. **Measure performance.** Playwright perf tests gate every merge.
5. **Document as you go.** One-sentence JSDoc on every exported function.

---

## Key Files Reference

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `src/components/Editor.tsx` | Main editor + BlockWrapper | ~782 | Refactored ✓ (hooks extracted, no container sub) |
| `src/components/Block.tsx` | Block rendering + editing | ~494 | Refactored ✓ (4 props via context) |
| `src/components/BlockContainer.tsx` | Container/table/flex | ~138 | Simplified ✓ |
| `src/hooks/useEditorContext.tsx` | EditorContext provider | ~107 | New ✓ |
| `src/hooks/useImageSelection.ts` | Multi-image ops | ~91 | Extracted ✓ |
| `src/hooks/useTableOperations.ts` | Table dialog/import | ~126 | Extracted ✓ |
| `src/hooks/useEditorClipboard.ts` | Copy/paste/cut | ~50 | Extracted ✓ |
| `src/hooks/useEditorSelection.ts` | Format/color/font | ~89 | Extracted ✓ |
| `src/hooks/useMediaPaste.ts` | Clipboard media paste | ~174 | Extracted ✓ |
| `src/lib/store/editor-store.ts` | Zustand store + hooks | ~420 | Stable ✓ |
| `src/lib/reducer/editor-reducer.ts` | State reducer | ~120 | Stable ✓ |
| `src/lib/handlers/keyboard-handlers.ts` | Enter/Backspace/content | ~550 | Fixed ✓ |
| `src/lib/handlers/clipboard-handlers.ts` | Clipboard handlers | ~116 | Fixed ✓ (inline paste) |
| `src/lib/handlers/selection-handlers.ts` | Text selection | ~330 | Fixed ✓ |
| `src/lib/handlers/node-operation-handlers.ts` | CRUD operations | ~650 | Fixed ✓ |
| `src/lib/handlers/drag-drop-handlers.ts` | Drag and drop | ~770 | Getter pattern ✓ |
| `src/lib/handlers/block/block-event-handlers.ts` | Block input/keydown | ~330 | Stable ✓ |
| `src/lib/types.ts` | All TypeScript types | ~200 | Stable ✓ |
| `package.json` | Package config | — | Fixed ✓ |
| `tsup.config.ts` | Library build | — | Fixed ✓ |
| **E2E Tests** | | |
| `e2e/content-stability.spec.ts` | Typing, Enter, undo, toggle | 9 tests | ✓ |
| `e2e/clipboard.spec.ts` | Copy/paste/cut | 4 tests | ✓ |
| `e2e/formatting.spec.ts` | Bold, italic, toggle | 5 tests | ✓ |
| `e2e/blocks.spec.ts` | Slash commands, delete | 8 tests | ✓ |
| `e2e/lists.spec.ts` | Auto-convert, Enter, exit | 5 tests | ✓ |
| `e2e/dragdrop.spec.ts` | Handle, attributes | 5 tests | ✓ |
| `e2e/performance.spec.ts` | Latency, re-renders, scroll | 4 tests | ✓ |
