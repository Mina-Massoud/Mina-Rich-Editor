/**
 * Documentation Content for Mina Rich Editor
 *
 * All 22 documentation sections translated into native editor blocks.
 * This serves as both documentation AND a marketing showcase — the docs
 * page itself is rendered inside the editor, demonstrating its capabilities.
 *
 * @packageDocumentation
 */

import { EditorNode, TextNode, ContainerNode, StructuralNode, InlineText } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

let idCounter = 0;
function uid(prefix: string): string {
  return `docs-${prefix}-${++idCounter}`;
}

function text(content: string, type: TextNode["type"] = "p", attrs: Record<string, any> = {}): TextNode {
  return { id: uid(type), type, content, attributes: attrs };
}

function richText(type: TextNode["type"], children: InlineText[], attrs: Record<string, any> = {}): TextNode {
  return { id: uid(type), type, children, attributes: attrs };
}

function heading(level: "h1" | "h2" | "h3" | "h4", content: string): TextNode {
  return text(content, level);
}

function code(content: string): TextNode {
  return text(content, "pre");
}

function hr(): TextNode {
  return { id: uid("hr"), type: "hr", content: "", attributes: {} };
}

function quote(content: string): TextNode {
  return text(content, "blockquote");
}

function list(items: (string | InlineText[])[]): TextNode {
  return {
    id: uid("ol"),
    type: "ol",
    lines: items.map(item =>
      typeof item === "string"
        ? { content: item }
        : { children: item }
    ),
    attributes: {},
  } as TextNode;
}

function table(headers: string[], rows: string[][]): StructuralNode {
  return {
    id: uid("table"),
    type: "table",
    children: [
      {
        id: uid("thead"),
        type: "thead",
        children: [
          {
            id: uid("tr"),
            type: "tr",
            children: headers.map(h => ({
              id: uid("th"),
              type: "th" as const,
              content: h,
              attributes: {},
            })),
          } as StructuralNode,
        ],
      } as StructuralNode,
      {
        id: uid("tbody"),
        type: "tbody",
        children: rows.map(row => ({
          id: uid("tr"),
          type: "tr" as const,
          children: row.map(cell => ({
            id: uid("td"),
            type: "td" as const,
            content: cell,
            attributes: {},
          })),
        } as StructuralNode)),
      } as StructuralNode,
    ],
    attributes: {},
  };
}

// Bold + normal text helper for list items
function bold(label: string, rest: string): InlineText[] {
  return [
    { content: label, bold: true },
    { content: rest },
  ];
}

function codeInline(before: string, codeText: string, after: string = ""): InlineText[] {
  const parts: InlineText[] = [];
  if (before) parts.push({ content: before });
  parts.push({ content: codeText, code: true });
  if (after) parts.push({ content: after });
  return parts;
}

// ─── Section Builders ─────────────────────────────────────────────────────────

function sectionHeader(num: string, label: string, subtitle: string): EditorNode[] {
  return [
    hr(),
    heading("h2", `${num} — ${label}`),
    richText("p", [{ content: subtitle, italic: true }]),
  ];
}

// ─── S01: Installation ────────────────────────────────────────────────────────

function s01_Installation(): EditorNode[] {
  return [
    ...sectionHeader("01", "Installation", "Get started in under a minute"),

    heading("h3", "Step 1: Install the component"),
    code(`npx shadcn@latest add https://ui-v4-livid.vercel.app/r/styles/new-york-v4/rich-editor.json`),
    text("This automatically installs all required shadcn components, npm packages, and editor files into your project."),

    heading("h3", "Step 2: Configure the theme provider"),
    richText("p", codeInline("The editor includes dark mode support. Wrap your app with the ", "ThemeProvider", " from next-themes.")),
    code(`import { ThemeProvider } from "next-themes"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}`),

    list([
      bold("shadcn CLI", " — zero-config installation. All dependencies are handled automatically."),
      bold("React 18+", ", Next.js 13+, and Tailwind CSS required."),
      bold("Peer dependencies: ", "zustand, framer-motion, lucide-react are installed automatically."),
    ]),
  ];
}

// ─── S02: Usage ───────────────────────────────────────────────────────────────

function s02_Usage(): EditorNode[] {
  return [
    ...sectionHeader("02", "Usage", "Three lines. Working editor."),

    code(`import { EditorProvider, createInitialState } from "@/lib"
import { createEmptyContent } from "@/lib/empty-content"
import { Editor } from "@/components/Editor"

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
}`),

    heading("h3", "With custom image upload"),
    code(`<EditorProvider initialState={initialState}>
  <Editor
    onUploadImage={async (file) => {
      const formData = new FormData()
      formData.append("image", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const { url } = await res.json()
      return url
    }}
  />
</EditorProvider>`),

    heading("h3", "Read-only mode"),
    code(`<EditorProvider initialState={savedState}>
  <Editor readOnly />
</EditorProvider>`),
  ];
}

// ─── S03: AI Integration ──────────────────────────────────────────────────────

function s03_AIIntegration(): EditorNode[] {
  return [
    ...sectionHeader("03", "AI Integration", "Built-in AI text editing"),

    text("Bring your own API key (BYOK) — no vendor lock-in, no paid proxy. Requests go directly to your provider."),

    heading("h3", "Provider setup"),
    code(`import {
  createOpenAIProvider,
  createAnthropicProvider,
  createGeminiProvider
} from "@/lib/ai"

// OpenAI
const openai = createOpenAIProvider({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY!,
  model: "gpt-4o"
})

// Anthropic
const anthropic = createAnthropicProvider({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_KEY!,
  model: "claude-sonnet-4-20250514"
})

// Google Gemini
const gemini = createGeminiProvider({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_KEY!,
  model: "gemini-pro"
})`),

    heading("h3", "useEditorAI hook"),
    code(`import { useEditorAI } from "@/hooks/useEditorAI"

function MyEditor() {
  const { generateContent, isGenerating, abort } = useEditorAI(provider)

  return (
    <EditorProvider initialState={initialState}>
      <Editor />
      <AICommandMenu
        onGenerate={generateContent}
        isGenerating={isGenerating}
        onAbort={abort}
      />
    </EditorProvider>
  )
}`),

    heading("h3", "AI selection presets"),
    text("Select text and click the AI sparkles button in the selection toolbar. Six built-in presets plus custom prompts."),

    table(
      ["#", "Tag", "Preset", "Description"],
      [
        ["1", "transform", "Rephrase", "Rephrase selected text while keeping the original meaning"],
        ["2", "fix", "Fix Grammar", "Correct grammar and spelling errors automatically"],
        ["3", "shorten", "Make Shorter", "Condense text while preserving the key message"],
        ["4", "expand", "Make Longer", "Expand text with additional detail and context"],
        ["5", "tone", "Professional", "Rewrite in a formal, professional tone"],
        ["6", "tone", "Casual", "Rewrite in a casual, friendly tone"],
      ]
    ),

    list([
      bold("BYOK", " — you supply your own API key. Requests go directly to the provider with no intermediary."),
      bold("No vendor lock-in", " — swap providers by changing one line of code."),
      bold("Streaming", " — AI-generated content appears token-by-token in the editor for real-time feedback."),
      bold("Custom prompts", " — write any prompt for arbitrary AI text transformations beyond the six presets."),
    ]),
  ];
}

// ─── S04: Collaboration ──────────────────────────────────────────────────────

function s04_Collaboration(): EditorNode[] {
  return [
    ...sectionHeader("04", "Real-time Collaboration", "Multi-user editing with Y.js"),

    text("Built on Y.js CRDTs. Connect to any Y.js-compatible WebSocket server — no paid collaboration backend required."),

    heading("h3", "CollaborationProvider"),
    code(`import { CollaborationProvider } from "@/components/CollaborationProvider"
import { RemoteCursor } from "@/components/RemoteCursor"

function CollaborativeEditor() {
  return (
    <CollaborationProvider
      roomId="my-doc-123"
      serverUrl="wss://my-yjs-server.com"
      user={{ name: "Alice", color: "#ff0000" }}
    >
      <Editor />
      <RemoteCursor />
    </CollaborationProvider>
  )
}`),

    heading("h3", "useCollaboration hook"),
    code(`import { useCollaboration } from "@/hooks/useCollaboration"

function PresenceIndicator() {
  const { connectedUsers, isConnected } = useCollaboration()

  return (
    <div>
      {isConnected ? "Online" : "Offline"} — {connectedUsers.length} users
    </div>
  )
}`),

    list([
      bold("Y.js CRDT", " — free, open-source conflict resolution with no central authority."),
      bold("RemoteCursor", " renders each user's cursor and selection in real time with their assigned color."),
      bold("y-websocket", ", Hocuspocus, or any Y.js-compatible server supported."),
      "Awareness protocol tracks user presence, cursor position, and connection status.",
    ]),
  ];
}

// ─── S05: Block Types ─────────────────────────────────────────────────────────

function s05_BlockTypes(): EditorNode[] {
  return [
    ...sectionHeader("05", "Block Types", "15 built-in block types"),

    text("Every block is a typed node in the editor tree. Add blocks via the slash command menu, toolbar, or keyboard shortcuts."),

    table(
      ["#", "Tag", "Block", "Description"],
      [
        ["1", "text", "Paragraph", "Standard text block — the default block type for regular content"],
        ["2", "heading", "Heading 1", "Top-level heading for major sections. Supports Notion-style first-header spacing"],
        ["3", "heading", "Heading 2", "Secondary heading for subsections within your document"],
        ["4", "heading", "Heading 3-6", "Four additional heading levels for deep document hierarchy"],
        ["5", "code", "Code Block", "Preformatted code with monospace rendering for technical content"],
        ["6", "quote", "Blockquote", "Indented quote block for citations, callouts, or highlighted text"],
        ["7", "list", "Bulleted List", "Unordered list items with automatic bullet markers"],
        ["8", "list", "Numbered List", "Ordered list items with sequential numbering"],
        ["9", "media", "Image", "Image block with captions, alt text, resize handles, and grouping"],
        ["10", "media", "Video", "Embedded video player block with native playback controls"],
        ["11", "media", "Audio", "Audio block for sound files with playback controls"],
        ["12", "layout", "Horizontal Rule", "Visual separator between content sections"],
        ["13", "data", "Table", "Full table with resizable columns, draggable rows, and cell editing"],
        ["14", "layout", "Container", "Nested container for grouping blocks — supports flex layout for side-by-side images"],
      ]
    ),
  ];
}

// ─── S06: CompactEditor ──────────────────────────────────────────────────────

function s06_CompactEditor(): EditorNode[] {
  return [
    ...sectionHeader("06", "CompactEditor", "Self-contained editor variant"),

    text("A lightweight editor that bundles the EditorProvider, Editor, and an inline toolbar into a single component. No wrapper needed."),

    code(`import { CompactEditor } from "@/components/CompactEditor"
import { createEmptyContent } from "@/lib/empty-content"

export default function CommentBox() {
  const initialContainer = {
    id: "root",
    type: "container",
    children: createEmptyContent(),
    attributes: {}
  }

  return (
    <CompactEditor
      initialContainer={initialContainer}
      onUploadImage={async (file) => {
        return URL.createObjectURL(file)
      }}
    />
  )
}`),

    list([
      bold("Same props as Editor", " (readOnly, onUploadImage, notionBased) but does not require a separate EditorProvider wrapper."),
      bold("CompactToolbar", " with essential formatting controls built in."),
      bold("Ideal for comment boxes", ", inline editing fields, or any embedded use case where a full toolbar is too heavy."),
    ]),
  ];
}

// ─── S07: Text Formatting ─────────────────────────────────────────────────────

function s07_TextFormatting(): EditorNode[] {
  return [
    ...sectionHeader("07", "Text Formatting", "Rich formatting without the complexity"),

    text("Select text to reveal the floating toolbar with all formatting options. Apply formats via keyboard shortcuts or toolbar buttons."),

    table(
      ["#", "Tag", "Format", "Description"],
      [
        ["1", "inline", "Bold", "Strong emphasis via Ctrl+B or toolbar toggle"],
        ["2", "inline", "Italic", "Emphasis via Ctrl+I or toolbar toggle"],
        ["3", "inline", "Underline", "Underline text via Ctrl+U or toolbar toggle"],
        ["4", "inline", "Strikethrough", "Cross out text via Ctrl+Shift+S or toolbar"],
        ["5", "inline", "Inline Code", "Monospace code span via Ctrl+E or toolbar"],
        ["6", "color", "Text Color", "Apply custom colors to selected text via the color picker"],
        ["7", "size", "Font Size", "Adjust font size on selected text via the size picker"],
        ["8", "class", "Custom Classes", "Apply Tailwind CSS classes or custom classes with live preview"],
        ["9", "style", "Inline Styles", "Direct CSS properties like width, height, and custom inline styles"],
        ["10", "type", "Element Type", "Change selected text to a different block type (h1-h6, p, code, blockquote, list)"],
      ]
    ),

    list([
      bold("Selection Toolbar", " appears when text is selected — all formatting applied from there."),
      "Format detection is automatic — active formats are highlighted in the toolbar.",
      bold("Tailwind CSS", " utilities supported with a built-in class picker and live preview."),
    ]),
  ];
}

// ─── S08: Slash Commands ──────────────────────────────────────────────────────

function s08_SlashCommands(): EditorNode[] {
  return [
    ...sectionHeader("08", "Slash Commands", "Notion-style command menu"),

    richText("p", codeInline("Type ", "/", " in an empty block to open the command palette. Start typing to filter commands.")),

    table(
      ["#", "Tag", "Command", "Description"],
      [
        ["1", "heading", "Heading 1", "Big section heading"],
        ["2", "heading", "Heading 2", "Medium section heading"],
        ["3", "heading", "Heading 3", "Small section heading"],
        ["4", "heading", "Heading 4", "Smaller heading level"],
        ["5", "heading", "Heading 5", "Minor heading level"],
        ["6", "heading", "Heading 6", "Smallest heading level"],
        ["7", "text", "Paragraph", "Regular text paragraph"],
        ["8", "code", "Code Block", "Preformatted code snippet"],
        ["9", "quote", "Quote", "Block quote for citations"],
        ["10", "list", "Bulleted List", "Unordered list item"],
        ["11", "list", "Numbered List", "Ordered list item"],
        ["12", "media", "Image", "Upload or embed an image"],
        ["13", "media", "Video", "Upload or embed a video"],
        ["14", "data", "Table", "Create a data table"],
      ]
    ),
  ];
}

// ─── S09: Toolbars ────────────────────────────────────────────────────────────

function s09_Toolbars(): EditorNode[] {
  return [
    ...sectionHeader("09", "Toolbars", "Context-aware editing controls"),

    heading("h3", "Selection Toolbar"),
    text("A floating toolbar that appears when text is selected. It provides context-aware formatting options based on the current selection."),

    list([
      bold("Format toggles", " — Bold, Italic, Underline, Strikethrough, Inline Code with active state detection."),
      bold("Element type selector", " — Convert selected block to any heading level (h1-h6), paragraph, code, blockquote, or list."),
      bold("Color picker", " — Apply custom text colors with a visual palette."),
      bold("Font size picker", " — Adjust the size of selected text."),
      bold("Link popover", " — Add, edit, or remove hyperlinks from selected text."),
      bold("Custom class popover", " — Browse and apply Tailwind CSS or custom classes with live preview."),
      bold("AI sparkles button", " — Opens the AI selection menu for AI-powered text transformations (when AI provider is configured)."),
    ]),

    heading("h3", "Editor Toolbar"),
    text("The top toolbar provides document-level actions for inserting content and managing the editor."),

    list([
      bold("Media upload popover", " — Insert single images, multiple images, or videos from your device."),
      bold("Insert components", " — Add free-positioned images or custom components via the insert modal."),
      bold("List buttons", " — Create unordered or ordered lists with a single click."),
      bold("Table builder", " — Create tables with custom row and column counts."),
    ]),

    heading("h3", "Compact Toolbar"),
    text("A lightweight inline toolbar used by the CompactEditor variant. Provides essential formatting options in a minimal footprint — ideal for comment boxes and embedded editing."),
  ];
}

// ─── S10: Keyboard Shortcuts ──────────────────────────────────────────────────

function s10_KeyboardShortcuts(): EditorNode[] {
  return [
    ...sectionHeader("10", "Keyboard Shortcuts", "Full keyboard control"),

    heading("h3", "Formatting"),
    table(
      ["Shortcut", "Action"],
      [
        ["Ctrl/Cmd + B", "Toggle bold"],
        ["Ctrl/Cmd + I", "Toggle italic"],
        ["Ctrl/Cmd + U", "Toggle underline"],
        ["Ctrl/Cmd + Shift + S", "Toggle strikethrough"],
        ["Ctrl/Cmd + E", "Toggle inline code"],
      ]
    ),

    heading("h3", "Editing"),
    table(
      ["Shortcut", "Action"],
      [
        ["Ctrl/Cmd + Z", "Undo"],
        ["Ctrl/Cmd + Y", "Redo"],
        ["Ctrl/Cmd + Shift + Z", "Redo (alternative)"],
        ["Ctrl/Cmd + K", "Insert link"],
        ["Ctrl/Cmd + A", "Select all in current block"],
      ]
    ),

    heading("h3", "Navigation"),
    table(
      ["Shortcut", "Action"],
      [
        ["Enter", "Split block at cursor / new list item"],
        ["Shift + Enter", "Create nested block or line break"],
        ["Arrow Up", "Navigate to previous block"],
        ["Arrow Down", "Navigate to next block"],
        ["Backspace / Delete", "Delete block when empty"],
        ["Tab", "Indent list item"],
        ["Shift + Tab", "Outdent list item"],
      ]
    ),

    heading("h3", "Selection"),
    table(
      ["Shortcut", "Action"],
      [
        ["Ctrl + Click", "Multi-select images"],
      ]
    ),
  ];
}

// ─── S11: Markdown Rules ──────────────────────────────────────────────────────

function s11_MarkdownRules(): EditorNode[] {
  return [
    ...sectionHeader("11", "Markdown Rules", "Type Markdown, get rich text"),

    text("The editor automatically converts Markdown syntax as you type. No mode switching required."),

    heading("h3", "Block-level rules"),
    table(
      ["Syntax", "Result"],
      [
        ["# + Space", "Heading 1"],
        ["## + Space", "Heading 2"],
        ["### + Space", "Heading 3"],
        ["#### + Space", "Heading 4"],
        ["##### + Space", "Heading 5"],
        ["###### + Space", "Heading 6"],
        ["> + Space", "Blockquote"],
        ["- + Space", "Bulleted list"],
        ["* + Space", "Bulleted list"],
        ["1. + Space", "Numbered list"],
        ["---", "Horizontal rule"],
        ["***", "Horizontal rule"],
        ["___", "Horizontal rule"],
        ["```", "Code block"],
      ]
    ),

    heading("h3", "Inline rules"),
    table(
      ["Syntax", "Result"],
      [
        ["**text**", "Bold"],
        ["*text*", "Italic"],
        ["`text`", "Inline code"],
        ["~~text~~", "Strikethrough"],
      ]
    ),
  ];
}

// ─── S12: Drag and Drop ──────────────────────────────────────────────────────

function s12_DragAndDrop(): EditorNode[] {
  return [
    ...sectionHeader("12", "Drag and Drop", "Rearrange content naturally"),

    text("Every block has a drag handle that appears on hover. Grab it to reorder blocks within the editor."),

    heading("h3", "Block reordering"),
    list([
      bold("Drag handle", " — appears on the left side of each block on hover. Grab it to start dragging."),
      bold("Drop indicators", " — horizontal lines show where the block will land (before or after target)."),
      bold("Auto-scroll", " — the editor automatically scrolls when you drag near the top or bottom edge of the viewport."),
    ]),

    heading("h3", "Image grouping"),
    list([
      bold("Side-by-side layout", " — drop an image to the left or right of another image to create a flex container."),
      bold("Group controls", " — grouped images get a toolbar with reverse order and extract (ungroup) buttons."),
      bold("Flex containers", " — images in a group are wrapped in a flex container for responsive side-by-side display."),
    ]),

    heading("h3", "Touch support"),
    text("On tablets, drag icons are visible by default (no hover required). Touch-based drag and drop works with the same visual feedback as desktop."),
  ];
}

// ─── S13: Image and Media ─────────────────────────────────────────────────────

function s13_ImageAndMedia(): EditorNode[] {
  return [
    ...sectionHeader("13", "Image and Media", "Full media management"),

    heading("h3", "Adding media"),
    list([
      bold("Toolbar upload", " — click the media button in the editor toolbar to select images or videos from your device."),
      bold("Slash command", " — type /image or /video to insert media blocks."),
      bold("Paste from clipboard", " — paste images directly from your clipboard. The editor detects and handles media automatically."),
      bold("Drag from system", " — drag files from your file manager directly into the editor."),
    ]),

    heading("h3", "Image operations"),
    list([
      bold("Multi-select", " — hold Ctrl/Cmd and click multiple images to select them."),
      bold("Group into flex", " — selected images can be grouped into a side-by-side flex container."),
      bold("Reverse order", " — reverse the display order of grouped images."),
      bold("Extract from group", " — pull an image out of a group back to the normal flow."),
      bold("Captions and alt text", " — add descriptive text to images for accessibility."),
      bold("Free positioning", " — insert absolutely-positioned images via the Insert Components modal."),
    ]),

    heading("h3", "Custom upload handler"),
    code(`<Editor
  onUploadImage={async (file: File) => {
    const formData = new FormData()
    formData.append("image", file)
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData
    })
    const { url } = await res.json()
    return url
  }}
/>`),
    text("Images are stored as base64 by default. Provide a custom upload handler for production use to avoid large document sizes."),
  ];
}

// ─── S14: Tables ──────────────────────────────────────────────────────────────

function s14_Tables(): EditorNode[] {
  return [
    ...sectionHeader("14", "Tables", "Advanced table editing"),

    richText("p", codeInline("Create tables via the toolbar button or the ", "/table", " slash command. Specify the number of rows and columns in the creation dialog.")),

    list([
      bold("Create", " — toolbar button or slash command with a row/column picker dialog."),
      bold("Import from Markdown", " — paste Markdown table syntax and it converts automatically to an editor table."),
      bold("Add/remove rows", " — insert or delete rows from the table."),
      bold("Add/remove columns", " — insert or delete columns from the table."),
      bold("Resize columns", " — drag column borders to manually adjust widths."),
      bold("Reorder", " — drag rows or columns to rearrange the table structure."),
      bold("Cell editing", " — click any cell to edit its content directly."),
    ]),
  ];
}

// ─── S15: Cover Image ─────────────────────────────────────────────────────────

function s15_CoverImage(): EditorNode[] {
  return [
    ...sectionHeader("15", "Cover Image", "Notion-style document covers"),

    richText("p", codeInline("Add a full-width cover image at the top of your document, similar to Notion. Requires ", "notionBased", " mode to be enabled (it is by default).")),

    list([
      bold("Upload cover", " — click the cover area to upload an image from your device."),
      bold("Reposition", " — drag the vertical slider (0-100%) to adjust the visible portion of the cover image."),
      bold("Remove cover", " — delete the cover image entirely."),
    ]),

    heading("h3", "Programmatic control"),
    code(`import { EditorActions, useEditorDispatch } from "@/lib"

const dispatch = useEditorDispatch()

// Set cover image
dispatch(EditorActions.setCoverImage("/path/to/image.jpg"))

// Update position (0-100)
dispatch(EditorActions.updateCoverImagePosition(35))

// Remove cover
dispatch(EditorActions.removeCoverImage())`),
  ];
}

// ─── S16: Context Menu and Links ──────────────────────────────────────────────

function s16_ContextMenuAndLinks(): EditorNode[] {
  return [
    ...sectionHeader("16", "Context Menu and Links", "Right-click actions and smart links"),

    heading("h3", "Block context menu"),
    text("Right-click any block to open the context menu with block-level styling options."),
    list([
      bold("Background color", " — choose from theme-aware presets (light and dark mode variants) or pick a custom color."),
      bold("Visual palette", " — colors adapt to the current theme for consistent appearance."),
    ]),

    heading("h3", "Links"),
    text("Add links to selected text via keyboard shortcut or the selection toolbar."),
    list([
      bold("Ctrl/Cmd + K", " — opens the link popover to add a URL to selected text."),
      bold("Selection toolbar", " — the link button in the floating toolbar opens the same popover."),
      bold("Edit existing links", " — click a linked text to open the popover and modify or remove the URL."),
      bold("Auto protocol", " — URLs without a protocol automatically get https:// prepended."),
    ]),
  ];
}

// ─── S17: Serialization ──────────────────────────────────────────────────────

function s17_Serialization(): EditorNode[] {
  return [
    ...sectionHeader("17", "Serialization", "Export to any format"),

    text("Convert editor content to and from five different formats. All serializers work with the editor's native node tree."),

    heading("h3", "Semantic HTML"),
    text("Clean, semantic HTML without Tailwind utilities — suitable for emails, CMS storage, or SSR."),
    code(`import { serializeToSemanticHtml } from "@/lib/utils/serialize-semantic-html"
import { useContainer } from "@/lib"

const container = useContainer()
const html = serializeToSemanticHtml(container)
// => <h1>Title</h1><p>Clean paragraph...</p>`),

    heading("h3", "HTML"),
    code(`import { serializeToHtml } from "@/lib"
import { useContainer } from "@/lib"

const container = useContainer()
const html = serializeToHtml(container)`),

    heading("h3", "Markdown"),
    code(`import { serializeToMarkdown } from "@/lib/utils/serialize-markdown"
import { useContainer } from "@/lib"

const container = useContainer()
const md = serializeToMarkdown(container)
// => # Title\\n\\nClean paragraph...`),

    heading("h3", "Parse Markdown to nodes"),
    code(`import { parseMarkdownToNodes } from "@/lib/utils/parse-markdown"

const nodes = parseMarkdownToNodes("# Hello\\n\\nA paragraph.")
// Use nodes as children in your initial container`),

    heading("h3", "Parse HTML to nodes"),
    code(`import { htmlToNodes } from "@/lib/utils/html-to-nodes"

const nodes = htmlToNodes("<h1>Hello</h1><p>World</p>")
// Use nodes as children in your initial container`),
  ];
}

// ─── S18: Hooks ───────────────────────────────────────────────────────────────

function s18_Hooks(): EditorNode[] {
  const hooks = [
    { name: "useEditorDispatch", desc: "Returns the dispatch function to trigger editor actions.", code: "const dispatch = useEditorDispatch()" },
    { name: "useContainer", desc: "Returns the current content container (root node of the document tree).", code: "const container = useContainer()" },
    { name: "useActiveNodeId", desc: "Returns the ID of the currently focused block.", code: "const activeNodeId = useActiveNodeId()" },
    { name: "useSelection", desc: "Returns the current text selection information including offset, length, and formats.", code: "const selection = useSelection()" },
    { name: "useBlockNode", desc: "Returns a specific node by ID with automatic re-renders when it changes.", code: "const node = useBlockNode(nodeId)" },
    { name: "useContainerChildrenIds", desc: "Returns an array of child node IDs for efficient list rendering.", code: "const childIds = useContainerChildrenIds()" },
    { name: "useEditorState", desc: "Access the full editor state (container, selection, history, metadata).", code: "const state = useEditorState()" },
    { name: "useIsNodeActive", desc: "Returns whether a specific node is currently active/focused.", code: "const isActive = useIsNodeActive(nodeId)" },
    { name: "useEditorStoreInstance", desc: "Access the raw Zustand store instance for advanced use cases.", code: "const store = useEditorStoreInstance()" },
  ];

  return [
    ...sectionHeader("18", "Hooks", "React hooks for editor state"),

    richText("p", codeInline("All hooks must be used inside an ", "EditorProvider", ". They use Zustand selectors for optimal re-render performance.")),

    ...hooks.flatMap(hook => [
      heading("h4", hook.name),
      text(hook.desc),
      code(hook.code),
    ]),
  ];
}

// ─── S19: useEditorAPI ────────────────────────────────────────────────────────

function s19_UseEditorAPI(): EditorNode[] {
  return [
    ...sectionHeader("19", "useEditorAPI", "High-level programmatic control"),

    text("A hook that provides non-reactive getter functions for reading and writing editor content without dispatching low-level actions."),

    code(`import { useEditorAPI } from "@/hooks/useEditorAPI"

function Toolbar() {
  const api = useEditorAPI()

  const handleSave = () => {
    const html = api.getHTML()
    const md   = api.getMarkdown()
    const json = api.getJSON()
    const text = api.getPlainText()
    saveToDB({ html, md, json, text })
  }

  const handleClear = () => api.clear()

  const handleLoad = (content) => {
    api.setContent(content)
  }

  return (
    <>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleClear}>Clear</button>
    </>
  )
}`),

    table(
      ["Method", "Returns", "Description"],
      [
        ["getJSON()", "ContainerNode", "Get the raw node tree as JSON"],
        ["getHTML()", "string", "Serialize content to HTML"],
        ["getMarkdown()", "string", "Serialize content to Markdown"],
        ["getPlainText()", "string", "Get content as plain text"],
        ["setContent(container)", "void", "Replace entire editor content"],
        ["insertBlock(node)", "void", "Insert a block at the current cursor position"],
        ["clear()", "void", "Clear all editor content"],
      ]
    ),
  ];
}

// ─── S20: History System ──────────────────────────────────────────────────────

function s20_HistorySystem(): EditorNode[] {
  return [
    ...sectionHeader("20", "History System", "Operation-based undo/redo"),

    text("The editor tracks changes with an operation-based history system rather than full-state snapshots, keeping memory usage predictable and low."),

    list([
      bold("Operation-based", " — only the delta is stored per undo entry, not a full copy of the document."),
      bold("Ctrl+Z", " to undo, Ctrl+Shift+Z or Ctrl+Y to redo."),
      "History is capped at 50 entries to keep memory usage bounded.",
      "Consecutive typing in the same block is batched into a single undo entry for a natural editing feel.",
      "Multiple related changes (e.g., splitting a block) are grouped into a single batch operation.",
      "The redo stack is cleared when a new action is performed after undoing.",
    ]),
  ];
}

// ─── S21: API Reference ──────────────────────────────────────────────────────

function s21_APIReference(): EditorNode[] {
  return [
    ...sectionHeader("21", "API Reference", "Component props and configuration"),

    heading("h3", "EditorProvider"),
    text("Wraps your editor and provides the Zustand store context for all editor operations."),
    table(
      ["Prop", "Type", "Default", "Description"],
      [
        ["initialContainer", "ContainerNode", "-", "Initial content structure (alternative to initialState)"],
        ["initialState", "EditorState", "-", "Complete initial state including history and metadata"],
        ["onChange", "(state: EditorState) => void", "-", "Callback fired on every state change"],
        ["debug", "boolean", "false", "Enable debug logging to console"],
        ["children", "ReactNode", "-", "Editor components to render"],
      ]
    ),

    heading("h3", "Editor"),
    text("The main editor component that renders the editing interface."),
    table(
      ["Prop", "Type", "Default", "Description"],
      [
        ["readOnly", "boolean", "false", "View-only mode — renders content without editing capabilities"],
        ["onUploadImage", "(file: File) => Promise<string>", "-", "Custom image upload handler — return the uploaded URL"],
        ["notionBased", "boolean", "true", "Enable Notion-style features (cover image, first header spacing)"],
        ["onNotionBasedChange", "(v: boolean) => void", "-", "Callback when Notion mode is toggled"],
      ]
    ),

    heading("h3", "CompactEditor"),
    text("Self-contained editor with built-in provider and inline toolbar."),
    table(
      ["Prop", "Type", "Default", "Description"],
      [
        ["initialContainer", "ContainerNode", "-", "Initial content structure"],
        ["readOnly", "boolean", "false", "View-only mode"],
        ["onUploadImage", "(file: File) => Promise<string>", "-", "Custom image upload handler"],
        ["onChange", "(state: EditorState) => void", "-", "Callback on state changes"],
      ]
    ),
  ];
}

// ─── S22: Credits ─────────────────────────────────────────────────────────────

function s22_Credits(): EditorNode[] {
  return [
    ...sectionHeader("22", "Credits", "Built by Mina"),

    heading("h3", "Mina Massoud"),
    text("A young developer proving that with AI, one person can build what used to take entire teams. The kind of developer who doesn't just write code, but builds cities."),

    richText("p", [
      { content: "Portfolio: " },
      { content: "mina-massoud.com", href: "https://mina-massoud.com/" },
      { content: "  |  " },
      { content: "GitHub", href: "https://github.com/Mina-Massoud/Mina-Rich-Editor" },
    ]),
  ];
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Section metadata for sidebar navigation.
 * Order matches the display order in the docs page.
 */
export const docsSections = [
  { id: "installation", num: "01", label: "Installation" },
  { id: "usage", num: "02", label: "Usage" },
  { id: "ai-integration", num: "03", label: "AI Integration" },
  { id: "collaboration", num: "04", label: "Real-time Collaboration" },
  { id: "block-types", num: "05", label: "Block Types" },
  { id: "compact-editor", num: "06", label: "CompactEditor" },
  { id: "text-formatting", num: "07", label: "Text Formatting" },
  { id: "slash-commands", num: "08", label: "Slash Commands" },
  { id: "toolbars", num: "09", label: "Toolbars" },
  { id: "keyboard-shortcuts", num: "10", label: "Keyboard Shortcuts" },
  { id: "markdown-rules", num: "11", label: "Markdown Rules" },
  { id: "drag-and-drop", num: "12", label: "Drag and Drop" },
  { id: "image-and-media", num: "13", label: "Image and Media" },
  { id: "tables", num: "14", label: "Tables" },
  { id: "cover-image", num: "15", label: "Cover Image" },
  { id: "context-menu-links", num: "16", label: "Context Menu and Links" },
  { id: "serialization", num: "17", label: "Serialization" },
  { id: "hooks", num: "18", label: "Hooks" },
  { id: "editor-api", num: "19", label: "useEditorAPI" },
  { id: "history-system", num: "20", label: "History System" },
  { id: "api-reference", num: "21", label: "API Reference" },
  { id: "credits", num: "22", label: "Credits" },
];

/**
 * Maps section IDs to their h2 node IDs in the editor content.
 * Used for sidebar navigation (scroll to section).
 */
export const sectionNodeIds: Record<string, string> = {};

/**
 * Creates all documentation content as native editor blocks.
 * Returns a ContainerNode ready for use with EditorProvider.
 */
export function createDocsContent(): ContainerNode {
  // Reset counter for stable IDs across calls
  idCounter = 0;

  const sectionBuilders: Record<string, () => EditorNode[]> = {
    "installation": s01_Installation,
    "usage": s02_Usage,
    "ai-integration": s03_AIIntegration,
    "collaboration": s04_Collaboration,
    "block-types": s05_BlockTypes,
    "compact-editor": s06_CompactEditor,
    "text-formatting": s07_TextFormatting,
    "slash-commands": s08_SlashCommands,
    "toolbars": s09_Toolbars,
    "keyboard-shortcuts": s10_KeyboardShortcuts,
    "markdown-rules": s11_MarkdownRules,
    "drag-and-drop": s12_DragAndDrop,
    "image-and-media": s13_ImageAndMedia,
    "tables": s14_Tables,
    "cover-image": s15_CoverImage,
    "context-menu-links": s16_ContextMenuAndLinks,
    "serialization": s17_Serialization,
    "hooks": s18_Hooks,
    "editor-api": s19_UseEditorAPI,
    "history-system": s20_HistorySystem,
    "api-reference": s21_APIReference,
    "credits": s22_Credits,
  };

  const allNodes: EditorNode[] = [
    // Document title
    heading("h1", "Mina Rich Editor — Documentation"),
    richText("p", [
      { content: "Complete reference for the Mina Rich Editor component library. " },
      { content: "This entire page is rendered inside the editor", bold: true },
      { content: " — try editing it!" },
    ]),
  ];

  // Build each section and track h2 IDs for navigation
  for (const section of docsSections) {
    const builder = sectionBuilders[section.id];
    if (builder) {
      const nodes = builder();
      // Find the h2 in this section's nodes and record its ID
      const h2Node = nodes.find(n => (n as TextNode).type === "h2");
      if (h2Node) {
        sectionNodeIds[section.id] = h2Node.id;
      }
      allNodes.push(...nodes);
    }
  }

  return {
    id: "docs-root",
    type: "container",
    children: allNodes,
    attributes: {},
  };
}
