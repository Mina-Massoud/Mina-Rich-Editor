export interface DocSectionMeta {
  title: string;
  description: string;
  keywords: string[];
}

export const docsMetadata: Record<string, DocSectionMeta> = {
  installation: {
    title: "Installation Guide",
    description:
      "Install Mina Rich Editor in under a minute with npx shadcn. Supports React 18+, Next.js, Vite, and TypeScript out of the box.",
    keywords: [
      "install rich text editor",
      "react editor setup",
      "shadcn editor install",
      "npm mina editor",
    ],
  },
  usage: {
    title: "Usage Guide",
    description:
      "Get started with Mina Rich Editor in 3 lines of code. Learn basic setup, custom image upload, read-only mode, and editor configuration.",
    keywords: [
      "react editor usage",
      "rich text editor setup",
      "editor configuration",
      "react wysiwyg setup",
    ],
  },
  "ai-integration": {
    title: "AI Integration",
    description:
      "Add AI-powered content generation to Mina Rich Editor. Works with OpenAI, Anthropic Claude, Google Gemini, Ollama, or any custom endpoint with streaming support.",
    keywords: [
      "ai text editor",
      "ai content generation",
      "openai editor",
      "ai writing assistant react",
    ],
  },
  collaboration: {
    title: "Real-time Collaboration",
    description:
      "Enable real-time collaborative editing with Y.js CRDT, cursor presence, and conflict resolution. Works with any WebSocket or WebRTC provider.",
    keywords: [
      "collaborative editor",
      "real-time editing",
      "yjs editor",
      "multiplayer text editor",
    ],
  },
  "block-types": {
    title: "Block Types",
    description:
      "Explore 15+ block types in Mina Rich Editor: paragraphs, headings, lists, code blocks, tables, images, blockquotes, toggle blocks, and more.",
    keywords: [
      "editor block types",
      "notion-style blocks",
      "content blocks",
      "block editor components",
    ],
  },
  "compact-editor": {
    title: "CompactEditor",
    description:
      "A lightweight, embeddable variant of Mina Rich Editor for inline editing, comments, and compact UI scenarios.",
    keywords: [
      "compact editor",
      "inline editor",
      "lightweight text editor",
      "embeddable editor",
    ],
  },
  "text-formatting": {
    title: "Text Formatting",
    description:
      "Rich text formatting in Mina Rich Editor: bold, italic, underline, strikethrough, code, highlight, links, and custom inline styles.",
    keywords: [
      "text formatting",
      "rich text styles",
      "bold italic editor",
      "inline formatting react",
    ],
  },
  "slash-commands": {
    title: "Slash Commands",
    description:
      "Use slash commands to quickly insert blocks, change formatting, and trigger AI generation. Fully customizable command menu.",
    keywords: [
      "slash commands",
      "command menu",
      "notion slash commands",
      "editor quick actions",
    ],
  },
  toolbars: {
    title: "Toolbars",
    description:
      "Selection toolbar and block toolbar for Mina Rich Editor. Floating formatting bar appears on text selection with customizable actions.",
    keywords: [
      "editor toolbar",
      "floating toolbar",
      "selection toolbar",
      "formatting bar",
    ],
  },
  "keyboard-shortcuts": {
    title: "Keyboard Shortcuts",
    description:
      "Complete keyboard shortcut reference for Mina Rich Editor. Formatting, navigation, block manipulation, and custom shortcut registration.",
    keywords: [
      "editor keyboard shortcuts",
      "hotkeys editor",
      "keyboard navigation",
      "editor shortcuts reference",
    ],
  },
  "markdown-rules": {
    title: "Markdown Rules",
    description:
      "Markdown shortcut syntax in Mina Rich Editor. Type markdown shortcuts that auto-convert to formatted blocks: headings, lists, code, quotes.",
    keywords: [
      "markdown shortcuts",
      "markdown editor",
      "auto-format markdown",
      "markdown to blocks",
    ],
  },
  "drag-and-drop": {
    title: "Drag and Drop",
    description:
      "Drag and drop blocks to reorder content, nest blocks, and reorganize document structure with visual drop indicators.",
    keywords: [
      "drag and drop editor",
      "block reordering",
      "sortable blocks",
      "drag drop react",
    ],
  },
  "image-and-media": {
    title: "Image and Media",
    description:
      "Upload, paste, and manage images in Mina Rich Editor. Drag-to-resize, captions, custom upload handlers, and clipboard paste support.",
    keywords: [
      "image upload editor",
      "media editor",
      "image resize",
      "paste images editor",
    ],
  },
  tables: {
    title: "Tables",
    description:
      "Advanced table editing in Mina Rich Editor. Add/remove rows and columns, cell selection, header rows, and tab navigation.",
    keywords: [
      "table editor",
      "react table editing",
      "add rows columns",
      "table cell editor",
    ],
  },
  "cover-image": {
    title: "Cover Image",
    description:
      "Add cover images to blocks in Mina Rich Editor. Upload or paste images as block-level covers with automatic sizing.",
    keywords: [
      "cover image editor",
      "block cover image",
      "hero image editor",
      "image cover block",
    ],
  },
  "context-menu-links": {
    title: "Context Menu and Links",
    description:
      "Right-click context menu and link handling in Mina Rich Editor. Add, edit, and remove links with preview tooltips.",
    keywords: [
      "context menu editor",
      "link editor",
      "right click menu",
      "hyperlink editor",
    ],
  },
  serialization: {
    title: "Serialization",
    description:
      "Export editor content as JSON, HTML, Markdown, or plain text. Import content from HTML or Markdown into Mina Rich Editor.",
    keywords: [
      "editor export",
      "html export",
      "markdown export",
      "json serialization",
    ],
  },
  hooks: {
    title: "Hooks",
    description:
      "React hooks for Mina Rich Editor: useEditor, useEditorState, useEditorAPI, and more. Access editor state and actions from any component.",
    keywords: [
      "editor hooks",
      "react hooks editor",
      "useEditor hook",
      "editor state management",
    ],
  },
  "editor-api": {
    title: "useEditorAPI",
    description:
      "Direct editor control with useEditorAPI. Programmatically insert blocks, update content, manage selection, and trigger actions.",
    keywords: [
      "editor api",
      "programmatic editor",
      "editor commands",
      "editor actions api",
    ],
  },
  "history-system": {
    title: "History System",
    description:
      "Undo and redo in Mina Rich Editor. Batched history, keyboard shortcuts (Ctrl+Z/Ctrl+Y), and programmatic history control.",
    keywords: [
      "undo redo editor",
      "editor history",
      "version history",
      "undo system react",
    ],
  },
  "api-reference": {
    title: "API Reference",
    description:
      "Complete API reference for Mina Rich Editor. Props, types, interfaces, and configuration options for all editor components.",
    keywords: [
      "editor api reference",
      "editor props",
      "editor types",
      "editor configuration api",
    ],
  },
  credits: {
    title: "Credits",
    description:
      "Acknowledgments and credits for Mina Rich Editor. Open-source libraries, contributors, and inspiration behind the project.",
    keywords: [
      "editor credits",
      "open source credits",
      "acknowledgments",
      "contributors",
    ],
  },
};
