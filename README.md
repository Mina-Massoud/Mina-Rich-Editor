# Mina Rich Editor

> A block-based rich text editor for React — Notion-style editing with full CMS integration.

[![npm](https://img.shields.io/npm/v/@mina-editor/core)](https://www.npmjs.com/package/@mina-editor/core)
[![license](https://img.shields.io/npm/l/@mina-editor/core)](./LICENSE)

## Features

- Block-based editing (Notion-style paragraphs, headings, lists, images, tables)
- Markdown shortcuts — type `# ` for H1, `**bold**`, `> ` for blockquote, etc.
- Smart paste — paste Markdown text and it auto-converts to rich blocks
- Two editor variants: self-contained `CompactEditor` and full-featured `Editor`
- Extension system — `Node.create()`, `Mark.create()`, `Extension.create()` with `StarterKit` included
- 3 CSS theme presets — Notion, Minimal, GitHub
- Export to JSON, semantic HTML, or Markdown
- CMS-ready: `onChange`, `getHTML()`, `getJSON()`, `getMarkdown()`, `setContent()`
- Zero re-renders on content changes for non-active blocks (`BlockWrapper` pattern)
- TypeScript-first with full type exports
- AI selection editing — rephrase, fix grammar, change tone, plus AI-powered styling (bold, italic, code)
- Works at any width — 300 px sidebar to full-width page layout
- 969 tests (759 unit + 210 E2E)

## Quick Start

### Installation

```bash
npm install @mina-editor/core zustand
```

> `react`, `react-dom`, and `zustand` are peer dependencies.

### CompactEditor — recommended for CMS

The `CompactEditor` is self-contained. Drop it anywhere and wire up `onChange`:

```tsx
import { CompactEditor } from '@mina-editor/core';

export function ArticleForm() {
  const handleChange = ({ json, html }) => {
    // json  → native block model (store in your DB)
    // html  → clean semantic HTML (no Tailwind classes)
    console.log(json, html);
  };

  return (
    <CompactEditor
      onChange={handleChange}
      minHeight="400px"
    />
  );
}
```

Restore saved content by passing `initialContent`:

```tsx
import { CompactEditor, type ContainerNode } from '@mina-editor/core';

const saved: ContainerNode = JSON.parse(localStorage.getItem('doc') ?? 'null');

<CompactEditor initialContent={saved} onChange={({ json }) => save(json)} />
```

### Programmatic access via `useEditorAPI`

Use `useEditorAPI` inside the `EditorProvider` tree to read or update content imperatively — useful for Save buttons, auto-save, word-count displays, etc.

```tsx
import { CompactEditor, EditorProvider, useEditorAPI } from '@mina-editor/core';

function SaveButton() {
  const api = useEditorAPI();

  const handleSave = async () => {
    await fetch('/api/articles', {
      method: 'POST',
      body: JSON.stringify({
        html: api.getHTML(),
        json: api.getJSON(),
        markdown: api.getMarkdown(),
      }),
    });
  };

  return <button onClick={handleSave}>Save</button>;
}

export function CmsPage() {
  return (
    <EditorProvider>
      <CompactEditor />
      <SaveButton />
    </EditorProvider>
  );
}
```

### Full Editor (Notion-style, with cover image and toolbar)

```tsx
import { Editor, EditorProvider } from '@mina-editor/core';

export function NotionPage() {
  return (
    <EditorProvider>
      <Editor
        readOnly={false}
        onUploadImage={async (file) => {
          const url = await uploadToS3(file);
          return url;
        }}
      />
    </EditorProvider>
  );
}
```

## Extension System

Build custom block types and inline marks as plain objects — no ProseMirror schema required.

```typescript
import { Extension, Node, Mark, StarterKit, EditorProvider } from '@mina-editor/core';

// Create a custom node extension
const Callout = Node.create({
  name: 'callout',
  nodeType: 'callout',
  group: 'block',
  addStyles: () => 'bg-blue-50 border-l-4 border-blue-500 p-4 rounded',
  addInputRules: () => [{
    find: /^!!! (.+)$/,
    handler: (match, ctx) => { /* auto-convert */ return true; },
  }],
});

// Create a custom mark
const Highlight = Mark.create({
  name: 'highlight',
  markName: 'highlight',
  inlineProperty: 'className',
  renderHTML: () => '<mark>',
});

// Use with EditorProvider
<EditorProvider extensions={[...StarterKit, Callout, Highlight]}>
  <MyEditor />
</EditorProvider>
```

The `StarterKit` array contains all 22 built-in extensions (16 nodes + 6 marks). You can spread it and append your own, or replace it entirely for a minimal setup.

## Themes

```tsx
// Import base styles (required)
import '@mina-editor/core/styles';

// Import a theme preset (optional)
import '@mina-editor/core/themes/notion';   // Notion-inspired
import '@mina-editor/core/themes/minimal';  // Ultra-clean
import '@mina-editor/core/themes/github';   // GitHub-flavored

// Apply theme via className
<div className="mina-editor theme-notion">
  <EditorProvider>...</EditorProvider>
</div>
```

## API Reference

### Components

| Component | Description |
|---|---|
| `CompactEditor` | Self-contained editor with inline formatting toolbar. Manages its own `EditorProvider`. |
| `Editor` | Full-featured editor with cover image, floating toolbar, and table support. Requires an `EditorProvider` wrapper. |
| `EditorProvider` | Zustand-backed state management wrapper. Share one provider across multiple components. |

#### `CompactEditor` props

| Prop | Type | Default | Description |
|---|---|---|---|
| `initialContent` | `ContainerNode` | — | Initial document content |
| `initialState` | `EditorState` | — | Full initial state (preserves history) |
| `readOnly` | `boolean` | `false` | View-only mode |
| `onChange` | `(data: { json: ContainerNode; html: string }) => void` | — | Debounced (300 ms) content-change callback |
| `onUploadImage` | `(file: File) => Promise<string>` | — | Custom image upload handler |
| `minHeight` | `string` | `"200px"` | CSS min-height of the editing area |
| `className` | `string` | — | Extra classes on the outer wrapper |

### Hooks

#### `useEditorAPI(): EditorAPI`

Must be called inside an `<EditorProvider>` tree. Returns a **stable, non-reactive** object — calling it never causes a re-render.

| Method | Returns | Description |
|---|---|---|
| `getJSON()` | `ContainerNode` | Native block model |
| `getHTML()` | `string` | Clean semantic HTML |
| `getMarkdown()` | `string` | Markdown export |
| `getPlainText()` | `string` | All text concatenated |
| `setContent(container)` | `void` | Replace entire document |
| `isDirty()` | `boolean` | True if unsaved edits exist |
| `getBlockCount()` | `number` | Number of top-level blocks |

#### `useExtensionManager(): ExtensionManager`

Returns the live extension registry mounted by the nearest `EditorProvider`. Use this to inspect registered nodes, marks, commands, and input rules at runtime.

#### Store hooks (low-level)

| Hook | Description |
|---|---|
| `useEditorState()` | Full editor state (reactive) |
| `useEditorDispatch()` | Dispatch `EditorAction` |
| `useBlockNode(id)` | Subscribe to a single node |
| `useContainer()` | Current root container |
| `useActiveNodeId()` | Currently focused block id |
| `useEditorStoreInstance()` | Raw Zustand store (for non-reactive reads) |

### Serialization

| Function | Description |
|---|---|
| `serializeToSemanticHtml(container)` | Clean HTML — no Tailwind, no data attributes |
| `serializeToMarkdown(container)` | Full Markdown serialization |
| `parseMarkdownToNodes(markdown)` | Markdown → block model |
| `parseHtmlToNodes(html)` | HTML → block model |
| `parsePlainTextToNodes(text)` | Plain text → block model |

### Extensions

| Export | Description |
|---|---|
| `Extension.create(config)` | Create a generic extension (commands, keyboard shortcuts, input rules) |
| `Node.create(config)` | Create a custom block node type |
| `Mark.create(config)` | Create a custom inline mark |
| `ExtensionManager` | Central registry class — instantiated by `EditorProvider` |
| `CommandManager` | Chainable command executor: `editor.chain().toggleBold().run()` |
| `StarterKit` | `Extension[]` — all 22 built-in extensions ready to pass to `EditorProvider` |

### Actions

Dispatch actions via `useEditorDispatch()` or the `EditorActions` factory:

```tsx
import { useEditorDispatch, EditorActions } from '@mina-editor/core';

const dispatch = useEditorDispatch();

// Insert a paragraph after an existing block
dispatch(EditorActions.insertNode(
  { id: 'p-1', type: 'p', content: 'Hello!' },
  parentId,
  'append'
));
```

### Markdown Shortcuts

Type these at the start of a new block and press `Space`:

| Shortcut | Block type |
|---|---|
| `#` | Heading 1 |
| `##` | Heading 2 |
| `###` | Heading 3 |
| `>` | Blockquote |
| `-` or `*` | Unordered list |
| `1.` | Ordered list |
| ` ``` ` | Code block |
| `---` | Divider |

Inline formatting (works inside any text block):

| Shortcut | Format |
|---|---|
| `**text**` | Bold |
| `*text*` | Italic |
| `` `text` `` | Inline code |

## Customization

The editor uses standard Tailwind CSS classes and respects your project's `--background`, `--foreground`, and `--primary` CSS variables. Pass `className` to `CompactEditor` to control border, radius, or shadow:

```tsx
<CompactEditor
  className="shadow-lg rounded-2xl border-2 border-indigo-200"
  minHeight="500px"
/>
```

For dark mode, the editor inherits whichever color scheme is active on the page.

## License

[MIT](./LICENSE) — Copyright (c) 2025-2026 Mina Massoud
