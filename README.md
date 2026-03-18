# Mina Rich Editor

A block-based rich text editor for React with built-in AI content generation and real-time collaboration — built by [Mina Massoud](https://github.com/Mina-Massoud).

[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

## Why Mina Rich Editor

Most React editors give you basic text editing and leave the hard parts to you. Mina ships with the features modern apps actually need — AI, collaboration, and a real extension system — out of the box.

### AI Content Generation

Stream content from any LLM directly into the editor. OpenAI, Anthropic, Gemini, Ollama, or your own endpoint — implement one interface and you're live.

- Provider-agnostic architecture — swap models without changing editor code
- Token-by-token streaming into structured blocks (headings, lists, code, not just plain text)
- AI selection editing — rephrase, fix grammar, change tone on highlighted text
- AI-powered formatting — smart bold, italic, and code detection
- `/ai` slash command for inline generation

### Y.js Real-Time Collaboration

Multi-user editing powered by the same CRDT engine behind Figma and VS Code Live Share.

- Conflict-free replicated data types — every edit merges cleanly, even offline
- Live cursor presence with color-coded user names
- WebSocket provider included — wrap in `CollaborationProvider` and point at a server

### Extension System

TipTap-inspired API with zero ProseMirror dependency. Build custom blocks, marks, and commands as plain objects.

- `Node.create()` — custom block types (callouts, embeds, anything)
- `Mark.create()` — custom inline marks (highlight, comment, annotation)
- `Extension.create()` — commands, keyboard shortcuts, input rules
- 22 built-in extensions via `StarterKit`
- `CommandManager` with chainable API

### Performance

Engineered for zero-lag editing at any document size.

- Per-block subscriptions — typing in block 5 doesn't re-render blocks 1-4
- Flat node map with O(1) lookups — no tree traversal on every keystroke
- Operation-based undo/redo — ~200x less memory than full-state snapshots
- 2.8ms overhead per character typed

## What's Included

- Notion-style block editing (paragraphs, headings, lists, images, tables, code blocks)
- Markdown shortcuts — `# `, `**bold**`, `> `, ``` ``` ```, `- `, `1. `
- Smart paste — Markdown auto-converts to rich blocks
- Two editor modes: full `Editor` (with cover image) and `CompactEditor` (drop-in CMS widget)
- Export to JSON, semantic HTML, or Markdown
- 3 theme presets — Notion, Minimal, GitHub
- WCAG 2.1 AA accessible
- TypeScript-first with full type exports
- 969 tests (759 unit + 210 E2E)

## Live Demo

Try it now — no installation required:

- [Editor Demo](https://mina-rich-editor.vercel.app/demo) — full-featured editor
- [AI Demo](https://mina-rich-editor.vercel.app/demo/ai) — AI content generation
- [Collaboration](https://mina-rich-editor.vercel.app/collab) — real-time multi-user editing
- [Documentation](https://mina-rich-editor.vercel.app/docs) — full API reference

## Installation

```bash
npx shadcn@latest add https://ui-v4-livid.vercel.app/r/styles/new-york-v4/rich-editor.json
```

## Quick Start

```tsx
"use client"

import { createEmptyContent, createInitialState, Editor, EditorProvider } from "@/components/ui/rich-editor"

export default function MyEditor() {
  const initialState = createInitialState({
    id: "root",
    type: "container",
    children: createEmptyContent(),
    attributes: {}
  })

  return (
    <EditorProvider initialState={initialState}>
      <Editor />
    </EditorProvider>
  )
}
```

## License

[MIT](./LICENSE) — Copyright (c) 2025-2026 Mina Massoud
