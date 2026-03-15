"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Github, ExternalLink } from "lucide-react";
import Script from "next/script";

export default function DocsPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Rich Editor Documentation - Installation and Usage Guide",
    description:
      "Complete documentation for Mina Rich Editor. Learn how to install, configure, and use the block-based rich text editor with React, TypeScript, and Tailwind CSS.",
    author: {
      "@type": "Person",
      name: "Mina Massoud",
      url: "https://mina-massoud.com",
    },
    datePublished: "2025-10-13",
    dateModified: "2025-10-13",
    keywords:
      "rich text editor documentation, react editor, typescript editor, shadcn editor, tailwind editor",
    articleSection: "Documentation",
    url: "https://mina-rich-editor.vercel.app/docs",
  };

  return (
    <>
      <Script
        id="docs-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-surface-base text-warm-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-surface-base/95 backdrop-blur supports-[backdrop-filter]:bg-surface-base/60">
        <div className="container px-5 flex h-14 items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-light text-warm-300 hover:text-warm-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-10 py-10 md:py-16">
        <div className="mx-auto max-w-4xl">
          {/* Title Section */}
          <div className="mb-12 space-y-3">
            <h1 className="text-4xl md:text-5xl font-extralight tracking-tight text-warm-50">Rich Editor</h1>
            <p className="text-lg font-light text-warm-300">
              A powerful, block-based rich text editor with tables, images,
              formatting, and mobile-optimized UX.
            </p>
          </div>

          {/* Installation Section */}
          <section className="mb-16">
            <SectionHeading>Installation</SectionHeading>
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-lg font-light text-warm-100">
                  Step 1: Install the rich-editor component
                </h3>
                <div className="border border-border-subtle bg-surface-code p-4 font-mono text-sm text-warm-100">
                  <code>
                    npx shadcn@latest add
                    https://ui-v4-livid.vercel.app/r/styles/new-york-v4/rich-editor.json
                  </code>
                </div>
                <p className="mt-3 text-sm text-warm-400">
                  This automatically installs all required shadcn components,
                  npm packages, and editor files.
                </p>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-light text-warm-100">
                  Step 2: Configure the theme provider
                </h3>
                <p className="text-sm text-warm-400">
                  The rich editor includes dark mode toggle functionality. Wrap
                  your app with the{" "}
                  <code className="bg-surface-code text-warm-100 px-1.5 py-0.5 text-xs font-mono">
                    ThemeProvider
                  </code>{" "}
                  from{" "}
                  <code className="bg-surface-code text-warm-100 px-1.5 py-0.5 text-xs font-mono">
                    next-themes
                  </code>
                  .
                </p>
              </div>
            </div>
          </section>

          {/* Usage Section */}
          <section className="mb-16">
            <SectionHeading>Usage</SectionHeading>
            <CodeBlock>{`import { EditorProvider, createInitialState } from "@/lib"
import { createEmptyContent } from "@/lib/empty-content"
import { Editor } from "@/components/Editor"
import { ContainerNode } from "@/lib/types"

export default function MyEditor() {
  // Create initial content
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
}`}</CodeBlock>
          </section>

          {/* Features Section */}
          <section className="mb-16">
            <SectionHeading>Features</SectionHeading>
            <div className="grid gap-px sm:grid-cols-2 border border-border-subtle">
              {[
                {
                  tag: "arch",
                  title: "Block-based architecture",
                  desc: "Drag & drop blocks with intuitive organization",
                },
                {
                  tag: "format",
                  title: "Rich text formatting",
                  desc: "Bold, italic, underline, strikethrough, colors, and font sizes",
                },
                {
                  tag: "table",
                  title: "Advanced tables",
                  desc: "Drag columns/rows, resize, markdown import, and cell formatting",
                },
                {
                  tag: "media",
                  title: "Image management",
                  desc: "Multi-select with Ctrl+Click, drag & drop, custom upload handlers",
                },
                {
                  tag: "style",
                  title: "Custom Tailwind classes",
                  desc: "Built-in class picker with live preview",
                },
                {
                  tag: "link",
                  title: "Smart links",
                  desc: "Easy link insertion with automatic protocol handling",
                },
                {
                  tag: "keys",
                  title: "Keyboard shortcuts",
                  desc: "Full keyboard navigation and formatting shortcuts",
                },
                {
                  tag: "mobile",
                  title: "Mobile optimized",
                  desc: "Sheet drawers, touch-friendly controls, automatic keyboard management",
                },
                {
                  tag: "theme",
                  title: "Dark mode",
                  desc: "Full dark mode support out of the box",
                },
                {
                  tag: "history",
                  title: "Undo/Redo",
                  desc: "Complete history management with Ctrl+Z/Ctrl+Y",
                },
                {
                  tag: "export",
                  title: "HTML export",
                  desc: "Export your content to clean HTML",
                },
                {
                  tag: "state",
                  title: "Zustand-powered",
                  desc: "Optimized state management with selective re-renders",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group p-5 border-b border-r border-border-subtle bg-surface-raised transition-all duration-300 hover:bg-white/[0.04]"
                >
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="font-mono text-[10px] tabular-nums text-warm-500">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <MonoTag>{feature.tag}</MonoTag>
                  </div>
                  <h3 className="text-sm font-medium tracking-tight mb-1 text-warm-50">{feature.title}</h3>
                  <p className="text-xs font-light leading-relaxed text-warm-400">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Keyboard Shortcuts Section */}
          <section className="mb-16">
            <SectionHeading>Keyboard Shortcuts</SectionHeading>
            <div className="border border-border-subtle bg-surface-raised overflow-hidden">
              <div className="divide-y divide-border-subtle">
                {[
                  { shortcut: "Ctrl/Cmd + B", action: "Toggle bold" },
                  { shortcut: "Ctrl/Cmd + I", action: "Toggle italic" },
                  { shortcut: "Ctrl/Cmd + U", action: "Toggle underline" },
                  { shortcut: "Ctrl/Cmd + Z", action: "Undo" },
                  { shortcut: "Ctrl/Cmd + Shift + Z", action: "Redo" },
                  { shortcut: "Shift + Enter", action: "Create nested block" },
                  { shortcut: "Ctrl/Cmd + K", action: "Insert link" },
                  { shortcut: "Ctrl + Click", action: "Multi-select images" },
                  {
                    shortcut: "Delete/Backspace",
                    action: "Delete selected blocks",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3"
                  >
                    <code className="bg-surface-code text-warm-100 px-2 py-1 text-sm font-mono">
                      {item.shortcut}
                    </code>
                    <span className="text-sm text-warm-400">
                      {item.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* API Reference Section */}
          <section className="mb-16">
            <SectionHeading>API Reference</SectionHeading>

            <div className="space-y-8">
              <div>
                <h3 className="mb-3 text-xl font-light text-warm-100">EditorProvider</h3>
                <p className="mb-3 text-sm text-warm-400">
                  Wraps your editor and provides the Zustand store context for all editor
                  operations. Based on Zustand for optimal performance.
                </p>
                <APITable
                  headers={["Prop", "Type", "Default", "Description"]}
                  rows={[
                    ["initialContainer", "ContainerNode", "-", "Initial content structure (alternative to initialState)"],
                    ["initialState", "EditorState", "-", "Complete initial state including history and metadata"],
                    ["onChange", "(state: EditorState) => void", "-", "Callback fired on state changes"],
                    ["debug", "boolean", "false", "Enable debug logging"],
                    ["children", "ReactNode", "-", "Editor components to render"],
                  ]}
                />
              </div>

              <div>
                <h3 className="mb-3 text-xl font-light text-warm-100">Editor</h3>
                <p className="mb-3 text-sm text-warm-400">
                  The main editor component that renders the editing interface.
                </p>
                <APITable
                  headers={["Prop", "Type", "Default", "Description"]}
                  rows={[
                    ["readOnly", "boolean", "false", "View-only mode - renders content without editing capabilities"],
                    ["onUploadImage", "(file: File) => Promise<string>", "-", "Custom image upload handler - should return the uploaded image URL"],
                    ["notionBased", "boolean", "true", "Enable Notion-style features (cover image, first header spacing)"],
                    ["onNotionBasedChange", "(notionBased: boolean) => void", "-", "Callback when notion mode is toggled"],
                  ]}
                />
              </div>
            </div>
          </section>

          {/* Hooks Section */}
          <section className="mb-16">
            <SectionHeading>Hooks</SectionHeading>
            <p className="mb-6 text-sm text-warm-400">
              The editor provides several hooks to access and manipulate state.
              All hooks must be used inside an EditorProvider.
            </p>
            <div className="space-y-4">
              {[
                { name: "useEditorDispatch", desc: "Returns the dispatch function to trigger editor actions", code: "const dispatch = useEditorDispatch()" },
                { name: "useContainer", desc: "Returns the current content container (root node)", code: "const container = useContainer()" },
                { name: "useActiveNodeId", desc: "Returns the ID of the currently focused block", code: "const activeNodeId = useActiveNodeId()" },
                { name: "useSelection", desc: "Returns the current text selection information", code: "const selection = useSelection()" },
                { name: "useBlockNode", desc: "Returns a specific node by ID with automatic re-renders", code: "const node = useBlockNode(nodeId)" },
              ].map((hook) => (
                <div key={hook.name} className="border border-border-subtle bg-surface-raised p-4">
                  <h3 className="mb-2 text-lg font-light text-warm-100">{hook.name}</h3>
                  <p className="mb-2 text-sm text-warm-400">
                    {hook.desc}
                  </p>
                  <div className="bg-surface-code p-2 text-sm font-mono text-warm-100">
                    {hook.code}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Customization Section */}
          <section className="mb-16">
            <SectionHeading>Customization</SectionHeading>

            <div className="space-y-8">
              <div>
                <h3 className="mb-3 text-xl font-light text-warm-100">
                  Custom Image Upload
                </h3>
                <p className="mb-3 text-sm text-warm-400">
                  Provide your own upload handler to integrate with your
                  backend:
                </p>
                <CodeBlock>{`async function handleUpload(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("image", file)

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  })

  const data = await response.json()
  return data.url
}

<Editor onUploadImage={handleUpload} />`}</CodeBlock>
              </div>

              <div>
                <h3 className="mb-3 text-xl font-light text-warm-100">Export to HTML</h3>
                <p className="mb-3 text-sm text-warm-400">
                  Export your content to HTML for storage or display:
                </p>
                <CodeBlock>{`import { serializeToHtml } from "@/lib"
import { useContainer } from "@/lib"

function ExportButton() {
  const container = useContainer()

  const handleExport = () => {
    const html = serializeToHtml(container)
    console.log(html)
  }

  return <button onClick={handleExport}>Export</button>
}`}</CodeBlock>
              </div>

              <div>
                <h3 className="mb-3 text-xl font-light text-warm-100">Using Actions</h3>
                <p className="mb-3 text-sm text-warm-400">
                  Dispatch actions to modify editor content:
                </p>
                <CodeBlock>{`import { EditorActions, useEditorDispatch } from "@/lib"

function MyComponent() {
  const dispatch = useEditorDispatch()

  const addParagraph = () => {
    const newNode = {
      id: \`p-\${Date.now()}\`,
      type: "p",
      content: "New paragraph",
      attributes: {}
    }

    dispatch(EditorActions.insertNode(
      newNode,
      "target-node-id",
      "after"
    ))
  }

  return <button onClick={addParagraph}>Add Paragraph</button>
}`}</CodeBlock>
              </div>
            </div>
          </section>

          {/* Notes Section */}
          <section className="mb-16">
            <SectionHeading>Notes</SectionHeading>
            <NotesList
              items={[
                <>The editor uses <strong className="text-warm-100">Zustand</strong> for state management, providing optimal performance with selective re-renders.</>,
                <>The editor uses <strong className="text-warm-100">Framer Motion</strong> for animations. Make sure it{"'"}s installed.</>,
                <>Images are stored as <strong className="text-warm-100">base64</strong> by default. Provide a custom upload handler for production use.</>,
                <>The editor is <strong className="text-warm-100">mobile-responsive</strong> and uses Sheet components on smaller screens.</>,
                <>All colors and classes use <strong className="text-warm-100">Tailwind CSS</strong> and follow shadcn/ui design patterns.</>,
                <>The editor supports <strong className="text-warm-100">notion-based mode</strong> with cover images and special first-header styling.</>,
              ]}
            />
          </section>

          {/* CompactEditor Section */}
          <section className="mb-16">
            <SectionHeading>CompactEditor</SectionHeading>
            <p className="mb-4 text-sm text-warm-400">
              A self-contained editor variant with an inline toolbar. It bundles
              the EditorProvider, Editor, and toolbar into a single component --
              ideal for comment boxes, inline editing, or embedded use cases.
            </p>
            <CodeBlock>{`import { CompactEditor } from "@/components/CompactEditor"
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
        // your upload logic
        return URL.createObjectURL(file)
      }}
    />
  )
}`}</CodeBlock>
            <p className="mt-3 text-sm text-warm-400">
              CompactEditor accepts the same props as Editor (readOnly,
              onUploadImage, notionBased, etc.) but does not require a
              separate EditorProvider wrapper.
            </p>
          </section>

          {/* Serialization & Parsing Section */}
          <section className="mb-16">
            <SectionHeading>Serialization &amp; Parsing</SectionHeading>
            <p className="mb-6 text-sm text-warm-400">
              Convert editor content to and from HTML and Markdown formats.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="mb-3 text-xl font-light text-warm-100">
                  Export to Semantic HTML
                </h3>
                <p className="mb-3 text-sm text-warm-400">
                  Produces clean, semantic HTML without Tailwind utility classes
                  -- suitable for emails, CMS storage, or server-side rendering.
                </p>
                <CodeBlock>{`import { serializeToSemanticHtml } from "@/lib/utils/serialize-semantic-html"
import { useContainer } from "@/lib"

const container = useContainer()
const html = serializeToSemanticHtml(container)
// => <h1>Title</h1><p>Clean paragraph...</p>`}</CodeBlock>
              </div>

              <div>
                <h3 className="mb-3 text-xl font-light text-warm-100">
                  Export to Markdown
                </h3>
                <p className="mb-3 text-sm text-warm-400">
                  Serialize the editor tree to Markdown.
                </p>
                <CodeBlock>{`import { serializeToMarkdown } from "@/lib/utils/serialize-markdown"
import { useContainer } from "@/lib"

const container = useContainer()
const md = serializeToMarkdown(container)
// => # Title\n\nClean paragraph...`}</CodeBlock>
              </div>

              <div>
                <h3 className="mb-3 text-xl font-light text-warm-100">
                  Parse Markdown to Nodes
                </h3>
                <p className="mb-3 text-sm text-warm-400">
                  Convert a Markdown string into editor nodes you can feed into
                  the store.
                </p>
                <CodeBlock>{`import { parseMarkdownToNodes } from "@/lib/utils/parse-markdown"

const nodes = parseMarkdownToNodes("# Hello\\n\\nA paragraph.")
// Use nodes as children in your initial container`}</CodeBlock>
              </div>

              <div>
                <h3 className="mb-3 text-xl font-light text-warm-100">
                  Parse HTML to Nodes
                </h3>
                <p className="mb-3 text-sm text-warm-400">
                  Convert an HTML string into editor nodes.
                </p>
                <CodeBlock>{`import { htmlToNodes } from "@/lib/utils/html-to-nodes"

const nodes = htmlToNodes("<h1>Hello</h1><p>World</p>")
// Use nodes as children in your initial container`}</CodeBlock>
              </div>
            </div>
          </section>

          {/* useEditorAPI Hook Section */}
          <section className="mb-16">
            <SectionHeading>useEditorAPI</SectionHeading>
            <p className="mb-4 text-sm text-warm-400">
              A high-level hook that exposes a programmatic API for reading and
              writing editor content without dispatching low-level actions.
            </p>
            <CodeBlock>{`import { useEditorAPI } from "@/hooks/useEditorAPI"

function Toolbar() {
  const api = useEditorAPI()

  const handleSave = () => {
    const html = api.getHTML()        // Full HTML output
    const md   = api.getMarkdown()    // Markdown output
    const json = api.getJSON()        // Raw node tree (JSON)
    saveToDB({ html, md, json })
  }

  const handleClear = () => api.clear()

  const handleLoad = (content) => {
    api.setContent(content)           // Replace all content
  }

  const handleInsert = () => {
    api.insertBlock({                 // Insert a new block
      id: \`p-\${Date.now()}\`,
      type: "p",
      content: "Inserted paragraph",
      attributes: {}
    })
  }

  return (
    <>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleClear}>Clear</button>
      <button onClick={handleInsert}>Insert</button>
    </>
  )
}`}</CodeBlock>
            <APITable
              className="mt-6"
              headers={["Method", "Returns", "Description"]}
              rows={[
                ["getHTML()", "string", "Serialize content to HTML"],
                ["getMarkdown()", "string", "Serialize content to Markdown"],
                ["getJSON()", "ContainerNode", "Get the raw node tree as JSON"],
                ["setContent(container)", "void", "Replace entire editor content"],
                ["insertBlock(node)", "void", "Insert a block at the current cursor position"],
                ["clear()", "void", "Clear all editor content"],
              ]}
            />
          </section>

          {/* AI Integration Section */}
          <section className="mb-16">
            <SectionHeading>AI Integration</SectionHeading>
            <p className="mb-6 text-sm text-warm-400">
              Mina Rich Editor ships with optional AI helpers. Bring your own
              API key (BYOK) -- there is no vendor lock-in or paid proxy.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="mb-3 text-xl font-light text-warm-100">
                  Provider Setup
                </h3>
                <p className="mb-3 text-sm text-warm-400">
                  Create a provider for your preferred LLM service:
                </p>
                <CodeBlock>{`import {
  createOpenAIProvider,
  createAnthropicProvider
} from "@/lib/ai"

// OpenAI / GPT
const openai = createOpenAIProvider({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY!,
  model: "gpt-4o"
})

// Anthropic / Claude
const anthropic = createAnthropicProvider({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_KEY!,
  model: "claude-sonnet-4-20250514"
})`}</CodeBlock>
              </div>

              <div>
                <h3 className="mb-3 text-xl font-light text-warm-100">
                  useEditorAI Hook
                </h3>
                <p className="mb-3 text-sm text-warm-400">
                  Call AI from inside your editor. The hook gives you
                  generateContent, a loading flag, and an abort handle.
                </p>
                <CodeBlock>{`import { useEditorAI } from "@/hooks/useEditorAI"
import { AICommandMenu } from "@/components/AICommandMenu"
import { createOpenAIProvider } from "@/lib/ai"

const provider = createOpenAIProvider({
  apiKey: "sk-...",
  model: "gpt-4o"
})

function MyEditor() {
  const { generateContent, isGenerating, abort } = useEditorAI(provider)

  return (
    <EditorProvider initialState={initialState}>
      <Editor />
      {/* Slash-command style AI menu */}
      <AICommandMenu
        onGenerate={generateContent}
        isGenerating={isGenerating}
        onAbort={abort}
      />
    </EditorProvider>
  )
}`}</CodeBlock>
              </div>

              <NotesList
                items={[
                  <><strong className="text-warm-100">BYOK</strong> -- you supply your own API key; requests go directly to the provider.</>,
                  <><strong className="text-warm-100">No vendor lock-in</strong> -- swap providers by changing one line.</>,
                  <><strong className="text-warm-100">Streaming support</strong> -- content appears token-by-token in the editor.</>,
                ]}
              />
            </div>
          </section>

          {/* Real-time Collaboration Section */}
          <section className="mb-16">
            <SectionHeading>Real-time Collaboration</SectionHeading>
            <p className="mb-6 text-sm text-warm-400">
              Built on Y.js CRDTs. Connect to any Y.js-compatible WebSocket
              server -- no paid collaboration backend required.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="mb-3 text-xl font-light text-warm-100">
                  CollaborationProvider
                </h3>
                <p className="mb-3 text-sm text-warm-400">
                  Wrap your editor to enable multi-user editing:
                </p>
                <CodeBlock>{`import { CollaborationProvider } from "@/components/CollaborationProvider"
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
}`}</CodeBlock>
              </div>

              <div>
                <h3 className="mb-3 text-xl font-light text-warm-100">
                  useCollaboration Hook
                </h3>
                <p className="mb-3 text-sm text-warm-400">
                  Access collaboration state inside the provider:
                </p>
                <CodeBlock>{`import { useCollaboration } from "@/hooks/useCollaboration"

function PresenceIndicator() {
  const { connectedUsers, isConnected } = useCollaboration()

  return (
    <div>
      {isConnected ? "Online" : "Offline"} · {connectedUsers.length} users
    </div>
  )
}`}</CodeBlock>
              </div>

              <NotesList
                items={[
                  <>Uses <strong className="text-warm-100">Y.js CRDT</strong> -- free, open-source conflict resolution.</>,
                  <><strong className="text-warm-100">RemoteCursor</strong> shows each user{"'"}s cursor and selection in real time.</>,
                  <>Works with <strong className="text-warm-100">y-websocket</strong>, Hocuspocus, or any compatible server.</>,
                ]}
              />
            </div>
          </section>

          {/* Markdown Input Rules Section */}
          <section className="mb-16">
            <SectionHeading>Markdown Input Rules</SectionHeading>
            <p className="mb-6 text-sm text-warm-400">
              Type Markdown shortcuts directly in the editor and they convert
              automatically as you type.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-lg font-light text-warm-100">
                  Block-level Rules
                </h3>
                <div className="border border-border-subtle bg-surface-raised overflow-hidden">
                  <div className="divide-y divide-border-subtle">
                    {[
                      { input: "#  + Space", result: "Heading 1" },
                      { input: "##  + Space", result: "Heading 2" },
                      { input: "###  + Space", result: "Heading 3" },
                      { input: ">  + Space", result: "Blockquote" },
                      { input: "---", result: "Horizontal rule" },
                      { input: "```", result: "Code block" },
                    ].map((rule, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3"
                      >
                        <code className="bg-surface-code text-warm-100 px-2 py-1 text-sm font-mono">
                          {rule.input}
                        </code>
                        <span className="text-sm text-warm-400">
                          {rule.result}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-light text-warm-100">
                  Inline Rules
                </h3>
                <div className="border border-border-subtle bg-surface-raised overflow-hidden">
                  <div className="divide-y divide-border-subtle">
                    {[
                      { input: "**text**", result: "Bold" },
                      { input: "*text*", result: "Italic" },
                      { input: "`text`", result: "Inline code" },
                      { input: "~~text~~", result: "Strikethrough" },
                    ].map((rule, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3"
                      >
                        <code className="bg-surface-code text-warm-100 px-2 py-1 text-sm font-mono">
                          {rule.input}
                        </code>
                        <span className="text-sm text-warm-400">
                          {rule.result}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* History System Section */}
          <section className="mb-16">
            <SectionHeading>History System</SectionHeading>
            <p className="mb-4 text-sm text-warm-400">
              The editor tracks changes with an operation-based undo/redo system
              rather than full-state snapshots, keeping memory usage low.
            </p>
            <NotesList
              items={[
                <><strong className="text-warm-100">Operation-based</strong> -- only the delta is stored per undo entry, not a full copy of the document.</>,
                <><strong className="text-warm-100">Ctrl+Z</strong> to undo, <strong className="text-warm-100">Ctrl+Shift+Z</strong> (or Ctrl+Y) to redo.</>,
                <>History is capped at <strong className="text-warm-100">50 entries</strong> to keep memory usage predictable.</>,
                <>Consecutive typing in the same block is batched into a single undo entry for a natural editing feel.</>,
              ]}
            />
          </section>

          {/* Credits Section */}
          <section className="mb-12">
            <SectionHeading>Credits</SectionHeading>
            <div className="border border-border-subtle bg-surface-raised p-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="mb-3 text-lg font-light text-warm-50">
                    Created by Mina Massoud
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="https://mina-massoud.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-light text-warm-200 hover:text-warm-100 border border-border-default px-3 py-1.5 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Portfolio
                    </a>
                    <a
                      href="https://github.com/Mina-Massoud/Mina-Rich-Editor"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-light text-warm-200 hover:text-warm-100 border border-border-default px-3 py-1.5 transition-colors"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      </div>
    </>
  );
}

/* ─── Local helper components ──────────────────────────────────────────── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-6 text-3xl font-extralight tracking-tight text-warm-50">
      {children}
    </h2>
  );
}

function MonoTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 border text-warm-300"
      style={{ borderColor: "rgba(200,180,160,0.15)", background: "rgba(200,180,160,0.05)" }}
    >
      {children}
    </span>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-border-subtle overflow-hidden bg-surface-code">
      <pre className="px-6 py-5 overflow-x-auto text-sm leading-7 font-mono text-warm-100">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function NotesList({ items }: { items: React.ReactNode[] }) {
  return (
    <div className="border border-border-subtle bg-surface-raised p-4">
      <ul className="space-y-2 text-sm text-warm-300">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-warm-500">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function APITable({
  headers,
  rows,
  className = "",
}: {
  headers: string[];
  rows: string[][];
  className?: string;
}) {
  return (
    <div className={`border border-border-subtle bg-surface-raised overflow-hidden ${className}`}>
      <table className="w-full">
        <thead className="border-b border-border-subtle bg-white/[0.02]">
          <tr>
            {headers.map((h) => (
              <th key={h} className="p-3 text-left text-sm font-medium text-warm-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`p-3 text-sm ${
                    j === 0
                      ? "font-mono text-warm-100"
                      : j === 1
                        ? "font-mono text-warm-400"
                        : j === 2 && headers.length === 4
                          ? "font-mono text-warm-400"
                          : "text-warm-300"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
