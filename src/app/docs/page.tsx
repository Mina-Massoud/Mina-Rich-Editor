"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-10 py-10 md:py-16">
        <div className="mx-auto max-w-4xl">
          {/* Title Section */}
          <div className="mb-8 space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Rich Editor</h1>
            <p className="text-xl text-muted-foreground">
              A powerful, block-based rich text editor with tables, images,
              formatting, and mobile-optimized UX.
            </p>
          </div>

          {/* Installation Section */}
          <section className="mb-12">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              Installation
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-lg font-semibold">
                  Step 1: Install the rich-editor component
                </h3>
                <div className="rounded-lg bg-muted p-4 font-mono text-sm">
                  <code>
                    npx shadcn@latest add
                    https://ui-v4-livid.vercel.app/r/styles/new-york-v4/rich-editor.json
                  </code>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  This automatically installs all required shadcn components,
                  npm packages, and editor files.
                </p>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-semibold">
                  Step 2: Configure the theme provider
                </h3>
                <p className="text-sm text-muted-foreground">
                  The rich editor includes dark mode toggle functionality. Wrap
                  your app with the{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5">
                    ThemeProvider
                  </code>{" "}
                  from{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5">
                    next-themes
                  </code>
                  .
                </p>
              </div>
            </div>
          </section>

          {/* Usage Section */}
          <section className="mb-12">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">Usage</h2>
            <div className="rounded-lg bg-muted p-4">
              <pre className="overflow-x-auto text-sm">
                <code>{`import { EditorProvider, createInitialState } from "@/lib"
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
}`}</code>
              </pre>
            </div>
          </section>

          {/* Features Section */}
          <section className="mb-12">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">Features</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: "✨",
                  title: "Block-based architecture",
                  desc: "Drag & drop blocks with intuitive organization",
                },
                {
                  icon: "📝",
                  title: "Rich text formatting",
                  desc: "Bold, italic, underline, strikethrough, colors, and font sizes",
                },
                {
                  icon: "📊",
                  title: "Advanced tables",
                  desc: "Drag columns/rows, resize, markdown import, and cell formatting",
                },
                {
                  icon: "🖼️",
                  title: "Image management",
                  desc: "Multi-select with Ctrl+Click, drag & drop, custom upload handlers",
                },
                {
                  icon: "🎨",
                  title: "Custom Tailwind classes",
                  desc: "Built-in class picker with live preview",
                },
                {
                  icon: "🔗",
                  title: "Smart links",
                  desc: "Easy link insertion with automatic protocol handling",
                },
                {
                  icon: "⌨️",
                  title: "Keyboard shortcuts",
                  desc: "Full keyboard navigation and formatting shortcuts",
                },
                {
                  icon: "📱",
                  title: "Mobile optimized",
                  desc: "Sheet drawers, touch-friendly controls, automatic keyboard management",
                },
                {
                  icon: "🌙",
                  title: "Dark mode",
                  desc: "Full dark mode support out of the box",
                },
                {
                  icon: "🔄",
                  title: "Undo/Redo",
                  desc: "Complete history management with Ctrl+Z/Ctrl+Y",
                },
                {
                  icon: "📤",
                  title: "HTML export",
                  desc: "Export your content to clean HTML",
                },
                {
                  icon: "⚡",
                  title: "Zustand-powered",
                  desc: "Optimized state management with selective re-renders",
                },
              ].map((feature, i) => (
                <Card key={i} className="p-4">
                  <div className="flex gap-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Keyboard Shortcuts Section */}
          <section className="mb-12">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              Keyboard Shortcuts
            </h2>
            <Card className="overflow-hidden">
              <div className="divide-y">
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
                    <code className="rounded bg-muted px-2 py-1 text-sm">
                      {item.shortcut}
                    </code>
                    <span className="text-sm text-muted-foreground">
                      {item.action}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* API Reference Section */}
          <section className="mb-12">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              API Reference
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-xl font-semibold">EditorProvider</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Wraps your editor and provides the Zustand store context for all editor
                  operations. Based on Zustand for optimal performance.
                </p>
                <Card className="overflow-hidden">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="p-3 text-left text-sm font-medium">
                          Prop
                        </th>
                        <th className="p-3 text-left text-sm font-medium">
                          Type
                        </th>
                        <th className="p-3 text-left text-sm font-medium">
                          Default
                        </th>
                        <th className="p-3 text-left text-sm font-medium">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="p-3 text-sm font-mono">
                          initialContainer
                        </td>
                        <td className="p-3 text-sm font-mono text-muted-foreground">
                          ContainerNode
                        </td>
                        <td className="p-3 text-sm">-</td>
                        <td className="p-3 text-sm">
                          Initial content structure (alternative to initialState)
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 text-sm font-mono">
                          initialState
                        </td>
                        <td className="p-3 text-sm font-mono text-muted-foreground">
                          EditorState
                        </td>
                        <td className="p-3 text-sm">-</td>
                        <td className="p-3 text-sm">
                          Complete initial state including history and metadata
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 text-sm font-mono">onChange</td>
                        <td className="p-3 text-sm font-mono text-muted-foreground">
                          (state: EditorState) =&gt; void
                        </td>
                        <td className="p-3 text-sm">-</td>
                        <td className="p-3 text-sm">Callback fired on state changes</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-sm font-mono">debug</td>
                        <td className="p-3 text-sm font-mono text-muted-foreground">
                          boolean
                        </td>
                        <td className="p-3 text-sm font-mono">false</td>
                        <td className="p-3 text-sm">Enable debug logging</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-sm font-mono">children</td>
                        <td className="p-3 text-sm font-mono text-muted-foreground">
                          ReactNode
                        </td>
                        <td className="p-3 text-sm">-</td>
                        <td className="p-3 text-sm">
                          Editor components to render
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Card>
              </div>

              <div>
                <h3 className="mb-3 text-xl font-semibold">Editor</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  The main editor component that renders the editing interface.
                </p>
                <Card className="overflow-hidden">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="p-3 text-left text-sm font-medium">
                          Prop
                        </th>
                        <th className="p-3 text-left text-sm font-medium">
                          Type
                        </th>
                        <th className="p-3 text-left text-sm font-medium">
                          Default
                        </th>
                        <th className="p-3 text-left text-sm font-medium">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="p-3 text-sm font-mono">readOnly</td>
                        <td className="p-3 text-sm font-mono text-muted-foreground">
                          boolean
                        </td>
                        <td className="p-3 text-sm font-mono">false</td>
                        <td className="p-3 text-sm">View-only mode - renders content without editing capabilities</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-sm font-mono">onUploadImage</td>
                        <td className="p-3 text-sm font-mono text-muted-foreground">
                          (file: File) =&gt; Promise&lt;string&gt;
                        </td>
                        <td className="p-3 text-sm">-</td>
                        <td className="p-3 text-sm">
                          Custom image upload handler - should return the uploaded image URL
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 text-sm font-mono">notionBased</td>
                        <td className="p-3 text-sm font-mono text-muted-foreground">
                          boolean
                        </td>
                        <td className="p-3 text-sm font-mono">true</td>
                        <td className="p-3 text-sm">
                          Enable Notion-style features (cover image, first header spacing)
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 text-sm font-mono">onNotionBasedChange</td>
                        <td className="p-3 text-sm font-mono text-muted-foreground">
                          (notionBased: boolean) =&gt; void
                        </td>
                        <td className="p-3 text-sm">-</td>
                        <td className="p-3 text-sm">
                          Callback when notion mode is toggled
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Card>
              </div>
            </div>
          </section>

          {/* Hooks Section */}
          <section className="mb-12">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">Hooks</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              The editor provides several hooks to access and manipulate state.
              All hooks must be used inside an EditorProvider.
            </p>
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="mb-2 text-lg font-semibold">useEditorDispatch</h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  Returns the dispatch function to trigger editor actions
                </p>
                <div className="rounded bg-muted p-2 text-sm font-mono">
                  const dispatch = useEditorDispatch()
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="mb-2 text-lg font-semibold">useContainer</h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  Returns the current content container (root node)
                </p>
                <div className="rounded bg-muted p-2 text-sm font-mono">
                  const container = useContainer()
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="mb-2 text-lg font-semibold">useActiveNodeId</h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  Returns the ID of the currently focused block
                </p>
                <div className="rounded bg-muted p-2 text-sm font-mono">
                  const activeNodeId = useActiveNodeId()
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="mb-2 text-lg font-semibold">useSelection</h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  Returns the current text selection information
                </p>
                <div className="rounded bg-muted p-2 text-sm font-mono">
                  const selection = useSelection()
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="mb-2 text-lg font-semibold">useBlockNode</h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  Returns a specific node by ID with automatic re-renders
                </p>
                <div className="rounded bg-muted p-2 text-sm font-mono">
                  const node = useBlockNode(nodeId)
                </div>
              </Card>
            </div>
          </section>

          {/* Customization Section */}
          <section className="mb-12">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              Customization
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-xl font-semibold">
                  Custom Image Upload
                </h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Provide your own upload handler to integrate with your
                  backend:
                </p>
                <div className="rounded-lg bg-muted p-4">
                  <pre className="overflow-x-auto text-sm">
                    <code>{`async function handleUpload(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("image", file)

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  })

  const data = await response.json()
  return data.url
}

<Editor onUploadImage={handleUpload} />`}</code>
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xl font-semibold">Export to HTML</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Export your content to HTML for storage or display:
                </p>
                <div className="rounded-lg bg-muted p-4">
                  <pre className="overflow-x-auto text-sm">
                    <code>{`import { serializeToHtml } from "@/lib"
import { useContainer } from "@/lib"

function ExportButton() {
  const container = useContainer()
  
  const handleExport = () => {
    const html = serializeToHtml(container)
    console.log(html)
  }
  
  return <button onClick={handleExport}>Export</button>
}`}</code>
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xl font-semibold">Using Actions</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Dispatch actions to modify editor content:
                </p>
                <div className="rounded-lg bg-muted p-4">
                  <pre className="overflow-x-auto text-sm">
                    <code>{`import { EditorActions, useEditorDispatch } from "@/lib"

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
}`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Notes Section */}
          <section className="mb-12">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">Notes</h2>
            <Card className="p-4">
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>
                    The editor uses <strong>Zustand</strong> for state management,
                    providing optimal performance with selective re-renders.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>
                    The editor uses <strong>Framer Motion</strong> for
                    animations. Make sure it's installed.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>
                    Images are stored as <strong>base64</strong> by default.
                    Provide a custom upload handler for production use.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>
                    The editor is <strong>mobile-responsive</strong> and uses
                    Sheet components on smaller screens.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>
                    All colors and classes use <strong>Tailwind CSS</strong> and
                    follow shadcn/ui design patterns.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>
                    The editor supports <strong>notion-based mode</strong> with
                    cover images and special first-header styling.
                  </span>
                </li>
              </ul>
            </Card>
          </section>

          {/* Credits Section */}
          <section className="mb-12">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">Credits</h2>
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="mb-3 text-lg font-semibold">
                    Created by Mina Massoud
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href="https://mina-massoud.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Portfolio
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href="https://github.com/Mina-Massoud"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="mr-2 h-4 w-4" />
                        GitHub
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </main>
      </div>
    </>
  );
}
