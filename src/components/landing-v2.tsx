"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Github, Play, Terminal, Copy, Check, Palette } from "lucide-react";
import { ModeToggle } from "./ui/mode-toggle";
import Hero from "@/components/ui/neural-network-hero";

function CopyNpm({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono select-all bg-muted text-muted-foreground border border-border">
      <Terminal className="w-3 h-3 opacity-40 shrink-0" />
      <span>{command}</span>
      <button
        onClick={() => { navigator.clipboard.writeText(command); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="ml-1 p-0.5 rounded hover:bg-foreground/5 transition-colors shrink-0"
        title="Copy"
      >
        {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 opacity-40" />}
      </button>
    </div>
  );
}

/* ─── Data ────────────────────────────────────────────────────────────────── */

const DX_ITEMS = [
  { tag: "dnd", title: "Drag & Drop", desc: "Block-level reordering with visual drop indicators, nested block support, and touch-friendly handles for tablet users." },
  { tag: "tbl", title: "Table System", desc: "Full table editing — add and remove rows and columns, cell selection, and clean HTML table output." },
  { tag: "img", title: "Image System", desc: "Drag-to-upload, paste from clipboard, URL embedding, resize handles, alt text, and caption support." },
  { tag: "md", title: "Markdown Shortcuts", desc: "Type # space for headings, ** for bold, ` for code, > for quotes, - for lists. Zero learning curve." },
  { tag: "sel", title: "Selection Toolbar", desc: "Floating toolbar appears on text selection with bold, italic, underline, strikethrough, code, link, and color options." },
  { tag: "tpl", title: "Template System", desc: "Pre-built document templates — blog post, meeting notes, project brief — that users can apply with one click." },
  { tag: "kbd", title: "Keyboard Shortcuts", desc: "Comprehensive shortcut system: Ctrl+B for bold, Ctrl+K for links, Ctrl+Shift+1-3 for headings, Tab for indent." },
  { tag: "a11y", title: "Accessibility", desc: "ARIA roles and labels on all interactive elements. Full keyboard navigation. Screen reader announcements for block operations." },
  { tag: "ts", title: "TypeScript-First", desc: "100% TypeScript. Every prop, callback, type, and hook is fully typed. The type system is the documentation." },
  { tag: "css", title: "Style Isolation", desc: "All editor styles are scoped. Your app's CSS won't break the editor. The editor's CSS won't break your app." },
  { tag: "45k", title: "Lightweight", desc: "~45KB gzipped with zero ProseMirror dependency. TipTap ships 120KB+ with mandatory ProseMirror core. Mina's extension system adds zero overhead." },
  { tag: "tst", title: "969 Tests", desc: "Comprehensive test suite: 759 unit tests (Vitest) and 210 E2E tests (Playwright) covering block operations, keyboard handling, serialization, and edge cases." },
  { tag: "ext", title: "Extension System", desc: "Build custom blocks, marks, and commands with Extension.create(), Node.create(), and Mark.create(). TipTap-inspired API, zero ProseMirror dependency." },
  { tag: "thm", title: "Theme Presets", desc: "3 built-in theme presets (Notion, Minimal, GitHub) — or create your own with CSS variables. Full dark mode support." },
];

const PERF_FEATURES = [
  { title: "Per-Block Subscriptions", desc: "Each block subscribes only to its own slice of state. Type in block 5, blocks 1-4 and 6-200 don't know it happened." },
  { title: "Structural Sharing", desc: "State updates reuse unchanged references. React.memo skips re-renders automatically because the props literally haven't changed." },
  { title: "Direct DOM Reconciliation", desc: "Critical text operations bypass React's virtual DOM entirely, writing to the DOM directly for sub-millisecond response times." },
];

const AI_FEATURES = [
  { title: "Provider Agnostic", desc: "OpenAI, Anthropic, Ollama, or your own endpoint — implement one interface." },
  { title: "Streaming Generation", desc: "AI responses stream token-by-token directly into editor blocks in real time." },
  { title: "Stream to Blocks", desc: "Markdown from the LLM is parsed into structured blocks as it arrives — headings, lists, code." },
  { title: "/ai Slash Command", desc: "Users type /ai followed by a prompt to generate content inline." },
  { title: "AI Styling", desc: "AI-powered formatting — emphasize key words, add bold/italic, mark code terms. Smart styling, not just rephrasing." },
];

const COLLAB_FEATURES = [
  { title: "CRDT Conflict Resolution", desc: "Y.js-powered conflict-free replicated data types ensure every edit merges cleanly — even offline." },
  { title: "Cursor Presence", desc: "See where other users are typing in real time. Color-coded cursors with user names." },
  { title: "Simple Integration", desc: "Wrap your editor in CollaborationProvider, point it at a WebSocket server, and you're live." },
];

const EXPORT_FORMATS = [
  { fn: "getJSON()", desc: "Structured tree for storage and re-hydration" },
  { fn: "getHTML()", desc: "Semantic HTML — no Tailwind, no framework artifacts" },
  { fn: "getMarkdown()", desc: "CommonMark-compatible Markdown output" },
  { fn: "getPlainText()", desc: "Raw text for search indexing and previews" },
];

const faqItems = [
  {
    q: "What is Mina Rich Editor?",
    a: "Mina Rich Editor is a free, open-source React block-based rich text editor that provides Notion-style block editing, built-in AI content generation, and Y.js-powered real-time collaboration in a single ~45KB gzipped package with zero ProseMirror dependency. It is built with TypeScript, shadcn/ui, and Tailwind CSS, and is MIT-licensed for commercial use.",
  },
  {
    q: "How does Mina Rich Editor compare to TipTap?",
    a: "Mina Rich Editor is ~45KB gzipped versus TipTap's 120KB+, requires no ProseMirror dependency, and includes built-in AI streaming, real-time collaboration, an extension system with Node.create()/Mark.create()/Extension.create(), and 3 theme presets — all at no cost. TipTap requires ProseMirror as a mandatory peer dependency, charges for collaboration and AI features, and offers no built-in themes. Mina Rich Editor is fully MIT-licensed with no commercial restrictions.",
  },
  {
    q: "What block types does Mina Rich Editor support?",
    a: "Mina Rich Editor supports 15+ block types including paragraphs, headings (H1–H4), ordered and unordered lists, code blocks, blockquotes, tables with row and column manipulation, images with drag-to-upload and resize, horizontal rules, toggle blocks, and cover images. All block types support drag-and-drop reordering and nesting.",
  },
  {
    q: "Does Mina Rich Editor support AI content generation?",
    a: "Yes. Mina Rich Editor has built-in AI integration that works with OpenAI, Anthropic Claude, Google Gemini, Ollama, or any custom endpoint. AI responses stream token-by-token directly into editor blocks, and Markdown output is parsed into structured blocks (headings, lists, code) as it arrives. Users can type /ai followed by a prompt to generate content inline.",
  },
  {
    q: "Is Mina Rich Editor free to use?",
    a: "Yes. Mina Rich Editor is completely free and open-source under the MIT license. There are no commercial restrictions, no paid tiers, and no feature gating. AI integration, real-time collaboration, and all 15+ block types are included at no cost.",
  },
  {
    q: "Does Mina Rich Editor support real-time collaboration?",
    a: "Yes. Mina Rich Editor includes Y.js CRDT-powered real-time collaboration with cursor presence, user name labels, and conflict-free merging — even for offline edits. Integration requires wrapping the editor in a CollaborationProvider and pointing it at a WebSocket server.",
  },
  {
    q: "What export formats does Mina Rich Editor support?",
    a: "Mina Rich Editor exports content as JSON (structured tree for storage), semantic HTML (no Tailwind or framework artifacts), CommonMark-compatible Markdown, and plain text (for search indexing and previews). All formats are available via simple API calls: getJSON(), getHTML(), getMarkdown(), and getPlainText().",
  },
];

/* ─── Syntax highlighting color helpers (uses CSS variables for dark mode) ── */

const Kw = ({ children }: { children: React.ReactNode }) => <span style={{ color: "var(--syntax-keyword)" }}>{children}</span>;
const Str = ({ children }: { children: React.ReactNode }) => <span style={{ color: "var(--syntax-string)" }}>{children}</span>;
const Fn = ({ children }: { children: React.ReactNode }) => <span style={{ color: "var(--syntax-function)" }}>{children}</span>;
const Cmt = ({ children }: { children: React.ReactNode }) => <span style={{ color: "var(--syntax-comment)" }}>{children}</span>;
const Prop = ({ children }: { children: React.ReactNode }) => <span style={{ color: "var(--syntax-property)" }}>{children}</span>;
const Ty = ({ children }: { children: React.ReactNode }) => <span style={{ color: "var(--syntax-type)" }}>{children}</span>;

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function LandingPageV2() {
  return (
    <div className="landing-v2">
      {/* === NAVIGATION ======================================================= */}
      <nav className="fixed inset-x-0 top-0 z-50 h-16">
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="font-handwritten text-2xl font-semibold text-foreground">
            Mina Rich Editor
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/demo" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Demo</Link>
            <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
            <a href="https://github.com/mina-massoud/mina-rich-editor" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
          </div>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <Link href="/demo" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-md hover:opacity-90 transition-opacity">
              <Play className="w-3 h-3" /> Try Editor
            </Link>
          </div>
        </div>
      </nav>

      {/* === HERO ============================================================= */}
      <Hero
        title="Rich text editor with AI & live collaboration"
        description="Notion-style blocks, streaming AI, Y.js collaboration, and a TipTap-inspired extension system — in a single ~45KB package. No ProseMirror. No license fees. Just install and ship."
        badgeText="AI, collaboration, everything — free forever"
        badgeLabel="MIT Licensed"
        ctaButtons={[
          { text: "Try the editor", href: "/demo" },
          { text: "Documentation", href: "/docs" },
        ]}
        microDetails={["AI generation", "Live collaboration", "Extension system", "969 tests"]}
      />

      {/* === HOW IT WORKS -- 3-COLUMN GRID ==================================== */}
      <section className="relative overflow-hidden">
        {/* Gradient blur background */}
        <div className="pointer-events-none absolute -top-20 left-1/4 w-[500px] h-[500px] rounded-full blur-[100px] opacity-[0.08]" style={{ background: "linear-gradient(135deg, #ec4899, #6366f1)" }} />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.06]" style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-16 md:py-24">
          <div className="int-divider mb-16" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Step 01 */}
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.15em] font-medium text-muted-foreground">01</span>
              <h3 className="mt-3 text-lg font-medium text-foreground" style={{ letterSpacing: "-0.01em" }}>Quick Start</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Three lines. Working editor. Import, render, ship. CompactEditor handles everything out of the box.
              </p>
            </div>
            {/* Step 02 */}
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.15em] font-medium text-muted-foreground">02</span>
              <h3 className="mt-3 text-lg font-medium text-foreground" style={{ letterSpacing: "-0.01em" }}>AI Integration</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Provider-agnostic AI that streams content directly into blocks. OpenAI, Anthropic, Ollama, or your own endpoint.
              </p>
            </div>
            {/* Step 03 */}
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.15em] font-medium text-muted-foreground">03</span>
              <h3 className="mt-3 text-lg font-medium text-foreground" style={{ letterSpacing: "-0.01em" }}>Real-time Collaboration</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Same CRDT engine behind Figma and VS Code Live Share. Y.js-powered conflict resolution with cursor presence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === FEATURE SECTION 1 -- PERFORMANCE ================================= */}
      <section className="relative overflow-hidden bg-background">
        {/* Warm orange-pink gradient blur */}
        <div className="pointer-events-none absolute top-1/3 -right-20 w-[450px] h-[450px] rounded-full blur-[100px] opacity-[0.07]" style={{ background: "linear-gradient(135deg, #f97316, #ec4899)" }} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-16 md:py-24">
          <div className="int-divider mb-16" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.15em] font-medium text-muted-foreground">01 — Performance</span>
              <h2 className="mt-4 text-[28px] lg:text-4xl font-medium leading-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>
                Fast by architecture, not by <em className="not-italic font-light text-muted-foreground">accident</em>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Engineered from the ground up for zero-lag editing at any scale.
              </p>

              {/* Stats */}
              <div className="mt-10 grid grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-mono font-medium text-foreground">2.8ms</div>
                  <div className="mt-1 text-xs font-mono uppercase tracking-wider text-muted-foreground">Typing</div>
                </div>
                <div>
                  <div className="text-3xl font-mono font-medium text-foreground">0</div>
                  <div className="mt-1 text-xs font-mono uppercase tracking-wider text-muted-foreground">Re-renders</div>
                </div>
                <div>
                  <div className="text-3xl font-mono font-medium text-foreground">14ms</div>
                  <div className="mt-1 text-xs font-mono uppercase tracking-wider text-muted-foreground">Scroll</div>
                </div>
              </div>

              <div className="int-divider mt-10 mb-6" />

              {/* Feature list */}
              <div className="space-y-5">
                {PERF_FEATURES.map((f) => (
                  <div key={f.title}>
                    <h4 className="text-sm font-medium text-foreground">{f.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: code card */}
            <div className="int-code-block">
              <div className="int-code-header">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">App.tsx</span>
              </div>
              <pre className="int-code-body">
                <code>
                  <Kw>import</Kw>{" { "}<Fn>CompactEditor</Fn>{" } "}<Kw>from</Kw> <Str>{`'@mina-editor/core'`}</Str>{"\n"}
                  {"\n"}
                  <Kw>function</Kw> <Fn>App</Fn>{"() {\n"}
                  {"  "}<Kw>return</Kw>{" (\n"}
                  {"    <"}<Fn>CompactEditor</Fn>{"\n"}
                  {"      "}<Prop>initialContent</Prop>{"={"}<Prop>myContent</Prop>{"}\n"}
                  {"      "}<Prop>onChange</Prop>{"={({ "}<Prop>json</Prop>{", "}<Prop>html</Prop>{" }) => {\n"}
                  {"        "}<Fn>saveToDatabase</Fn>{"("}<Prop>json</Prop>{")\n"}
                  {"        "}<Fn>updatePreview</Fn>{"("}<Prop>html</Prop>{")\n"}
                  {"      }}\n"}
                  {"      "}<Prop>minHeight</Prop>{"="}<Str>{`"300px"`}</Str>{"\n"}
                  {"    />\n"}
                  {"  )\n"}
                  {"}"}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* === FEATURE SECTION 2 -- AI ========================================== */}
      <section className="relative overflow-hidden">
        {/* Blue-purple gradient blur */}
        <div className="pointer-events-none absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full blur-[100px] opacity-[0.07]" style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-16 md:py-24">
          <div className="int-divider mb-16" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left: code card */}
            <div className="order-2 lg:order-1 int-code-block">
              <div className="int-code-header">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">AI Provider</span>
              </div>
              <pre className="int-code-body">
                <code>
                  <Kw>const</Kw> <Prop>myProvider</Prop>{": "}<Ty>AIProvider</Ty>{" = {\n"}
                  {"  "}<Prop>generateStream</Prop>{": "}<Kw>async</Kw> <Kw>function</Kw>{"* ("}<Prop>prompt</Prop>{") {\n"}
                  {"    "}<Kw>const</Kw> <Prop>stream</Prop>{" = "}<Kw>await</Kw> <Prop>openai</Prop>{"."}<Prop>chat</Prop>{"\n"}
                  {"      ."}<Fn>completions</Fn>{"."}<Fn>create</Fn>{"({\n"}
                  {"        "}<Prop>model</Prop>{": "}<Str>{`"gpt-4"`}</Str>{",\n"}
                  {"        "}<Prop>messages</Prop>{": [\n"}
                  {"          { "}<Prop>role</Prop>{": "}<Str>{`"user"`}</Str>{", "}<Prop>content</Prop>{": "}<Prop>prompt</Prop>{" }\n"}
                  {"        ],\n"}
                  {"        "}<Prop>stream</Prop>{": "}<Kw>true</Kw>{"\n"}
                  {"      })\n"}
                  {"    "}<Kw>for</Kw> <Kw>await</Kw>{" ("}<Kw>const</Kw> <Prop>chunk</Prop>{" of "}<Prop>stream</Prop>{") {\n"}
                  {"      "}<Kw>yield</Kw>{" "}<Prop>chunk</Prop>{"."}<Prop>choices</Prop>{"[0]?."}<Prop>delta</Prop>{"\n"}
                  {"        ?."}<Prop>content</Prop>{" ?? "}<Str>{`""`}</Str>{"\n"}
                  {"    }\n"}
                  {"  }\n"}
                  {"}\n"}
                  {"\n"}
                  {"<"}<Fn>CompactEditor</Fn>{" "}<Prop>ai</Prop>{"={"}<Prop>myProvider</Prop>{"} />"}
                </code>
              </pre>
            </div>

            {/* Right: content */}
            <div className="order-1 lg:order-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.15em] font-medium text-muted-foreground">02 — AI Integration</span>
              <h2 className="mt-4 text-[28px] lg:text-4xl font-medium leading-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>
                <em className="not-italic font-light text-muted-foreground">Your</em> LLM, <em className="not-italic font-light text-muted-foreground">your</em> editor
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Provider-agnostic AI that streams content directly into blocks.
              </p>

              <div className="int-divider mt-10 mb-6" />

              <div className="space-y-5">
                {AI_FEATURES.map((f) => (
                  <div key={f.title}>
                    <h4 className="text-sm font-medium text-foreground">{f.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === FEATURE SECTION 3 -- CONTENT MANAGEMENT ========================== */}
      <section className="relative overflow-hidden bg-background">
        {/* Green-teal gradient blur */}
        <div className="pointer-events-none absolute bottom-1/4 -right-10 w-[450px] h-[450px] rounded-full blur-[100px] opacity-[0.07]" style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)" }} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-16 md:py-24">
          <div className="int-divider mb-16" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.15em] font-medium text-muted-foreground">03 — Content Management</span>
              <h2 className="mt-4 text-[28px] lg:text-4xl font-medium leading-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>
                Programmatic control over <em className="not-italic font-light text-muted-foreground">everything</em>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Read content in any format. Set content programmatically. Full API access to every aspect of the editor.
              </p>

              <div className="int-divider mt-10 mb-6" />

              {/* Export formats */}
              <div className="grid grid-cols-2 gap-4">
                {EXPORT_FORMATS.map((item) => (
                  <div key={item.fn} className="int-card !p-4">
                    <div className="font-mono text-sm font-medium text-foreground">{item.fn}</div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: code card */}
            <div className="int-code-block">
              <div className="int-code-header">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">useEditorAPI()</span>
              </div>
              <pre className="int-code-body">
                <code>
                  <Kw>const</Kw> <Prop>api</Prop>{" = "}<Fn>useEditorAPI</Fn>{"()\n"}
                  {"\n"}
                  <Cmt>{"// Read content in any format"}</Cmt>{"\n"}
                  <Kw>const</Kw> <Prop>json</Prop>{" = "}<Prop>api</Prop>{"."}<Fn>getJSON</Fn>{"()\n"}
                  <Kw>const</Kw> <Prop>html</Prop>{" = "}<Prop>api</Prop>{"."}<Fn>getHTML</Fn>{"()\n"}
                  <Kw>const</Kw> <Prop>markdown</Prop>{" = "}<Prop>api</Prop>{"."}<Fn>getMarkdown</Fn>{"()\n"}
                  <Kw>const</Kw> <Prop>text</Prop>{" = "}<Prop>api</Prop>{"."}<Fn>getPlainText</Fn>{"()\n"}
                  {"\n"}
                  <Cmt>{"// Programmatic control"}</Cmt>{"\n"}
                  <Prop>api</Prop>{"."}<Fn>setContent</Fn>{"("}<Prop>savedDocument</Prop>{")\n"}
                  <Prop>api</Prop>{"."}<Fn>insertBlock</Fn>{"({\n"}
                  {"  "}<Prop>type</Prop>{": "}<Str>{`"heading-1"`}</Str>{",\n"}
                  {"  "}<Prop>content</Prop>{": "}<Str>{`"Hello"`}</Str>{"\n"}
                  {"})\n"}
                  {"\n"}
                  <Cmt>{"// State checks"}</Cmt>{"\n"}
                  <Prop>api</Prop>{"."}<Fn>isDirty</Fn>{"()       "}<Cmt>{"// unsaved changes?"}</Cmt>{"\n"}
                  <Prop>api</Prop>{"."}<Fn>getBlockCount</Fn>{"() "}<Cmt>{"// total blocks"}</Cmt>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* === COLLABORATION SECTION ============================================ */}
      <section className="relative overflow-hidden">
        {/* Blue-purple gradient blur */}
        <div className="pointer-events-none absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.06]" style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-16 md:py-24">
          <div className="int-divider mb-16" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left: code */}
            <div className="order-2 lg:order-1 int-code-block">
              <div className="int-code-header">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Collaboration</span>
              </div>
              <pre className="int-code-body">
                <code>
                  <Kw>import</Kw>{" { "}<Fn>CompactEditor</Fn>{" } "}<Kw>from</Kw> <Str>{`'@mina-editor/core'`}</Str>{"\n"}
                  <Kw>import</Kw>{" { "}<Fn>CollaborationProvider</Fn>{" }\n"}
                  {"  "}<Kw>from</Kw> <Str>{`'@mina-editor/collaboration'`}</Str>{"\n"}
                  {"\n"}
                  <Kw>function</Kw> <Fn>CollabEditor</Fn>{"() {\n"}
                  {"  "}<Kw>return</Kw>{" (\n"}
                  {"    <"}<Fn>CollaborationProvider</Fn>{"\n"}
                  {"      "}<Prop>roomId</Prop>{"="}<Str>{`"my-document"`}</Str>{"\n"}
                  {"      "}<Prop>serverUrl</Prop>{"="}<Str>{`"wss://your-server.com"`}</Str>{"\n"}
                  {"      "}<Prop>user</Prop>{"={{\n"}
                  {"        "}<Prop>name</Prop>{": "}<Str>{`"Mina"`}</Str>{",\n"}
                  {"        "}<Prop>color</Prop>{": "}<Str>{`"#c8b4a0"`}</Str>{"\n"}
                  {"      }}>\n"}
                  {"      <"}<Fn>CompactEditor</Fn>{" />\n"}
                  {"    </"}<Fn>CollaborationProvider</Fn>{">\n"}
                  {"  )\n"}
                  {"}"}
                </code>
              </pre>
            </div>

            {/* Right: content */}
            <div className="order-1 lg:order-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.15em] font-medium text-muted-foreground">04 — Collaboration</span>
              <h2 className="mt-4 text-[28px] lg:text-4xl font-medium leading-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>
                Built for <em className="not-italic font-light text-muted-foreground">multiplayer</em>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Same CRDT engine behind Figma and VS Code Live Share. No server-side resolution needed.
              </p>

              <div className="int-divider mt-10 mb-6" />

              <div className="space-y-5">
                {COLLAB_FEATURES.map((f) => (
                  <div key={f.title}>
                    <h4 className="text-sm font-medium text-foreground">{f.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === EXTENSION SYSTEM ================================================= */}
      <section className="relative overflow-hidden bg-background">
        {/* Purple-indigo gradient blur */}
        <div className="pointer-events-none absolute top-1/4 -right-20 w-[450px] h-[450px] rounded-full blur-[100px] opacity-[0.07]" style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-16 md:py-24">
          <div className="int-divider mb-16" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.15em] font-medium text-muted-foreground">05 — Extension System</span>
              <h2 className="mt-4 text-[28px] lg:text-4xl font-medium leading-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>
                Extend the editor <em className="not-italic font-light text-muted-foreground">your way</em>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                TipTap-inspired API with zero ProseMirror dependency. Build custom blocks, marks, and commands in minutes — not days.
              </p>

              <div className="int-divider mt-10 mb-6" />

              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Node.create() — Custom Blocks</h4>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Define new block types with styles, input rules, keyboard shortcuts, and slash-command registration. No schema language required.</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">Mark.create() — Inline Formatting</h4>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Add custom inline marks — highlights, annotations, comments — that integrate with the selection toolbar automatically.</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">Extension.create() — Behaviours</h4>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Register keyboard shortcuts, slash commands, and event hooks without defining new node types. Ship in one file.</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Palette className="w-4 h-4 text-muted-foreground" />
                    3 Built-in Theme Presets
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Notion, Minimal, and GitHub themes out of the box. Override any token with CSS variables — full dark mode support included.</p>
                </div>
              </div>
            </div>

            {/* Right: code card */}
            <div className="int-code-block">
              <div className="int-code-header">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Custom Extension</span>
              </div>
              <pre className="int-code-body">
                <code>
                  <Kw>import</Kw>{" { "}<Fn>Node</Fn>{", "}<Fn>StarterKit</Fn>{" } "}<Kw>from</Kw> <Str>{`'@mina-editor/core'`}</Str>{"\n"}
                  {"\n"}
                  <Cmt>{"// Define a custom callout block"}</Cmt>{"\n"}
                  <Kw>const</Kw> <Prop>Callout</Prop>{" = "}<Fn>Node</Fn>{"."}<Fn>create</Fn>{"({\n"}
                  {"  "}<Prop>name</Prop>{": "}<Str>{`'callout'`}</Str>{",\n"}
                  {"  "}<Prop>nodeType</Prop>{": "}<Str>{`'callout'`}</Str>{",\n"}
                  {"  "}<Prop>group</Prop>{": "}<Str>{`'block'`}</Str>{",\n"}
                  {"  "}<Fn>addStyles</Fn>{": () =>\n"}
                  {"    "}<Str>{`'bg-blue-50 border-l-4 border-blue-500 p-4 rounded'`}</Str>{",\n"}
                  {"  "}<Fn>addInputRules</Fn>{": () => [{\n"}
                  {"    "}<Prop>find</Prop>{": "}<Str>{`/^!!! (.+)$/`}</Str>{",\n"}
                  {"    "}<Fn>handler</Fn>{": ("}<Prop>match</Prop>{", "}<Prop>ctx</Prop>{") => {\n"}
                  {"      "}<Cmt>{"// Convert \"!!! text\" → callout block"}</Cmt>{"\n"}
                  {"      "}<Kw>return</Kw>{" "}<Kw>true</Kw>{"\n"}
                  {"    }\n"}
                  {"  }],\n"}
                  {"})\n"}
                  {"\n"}
                  {"<"}<Fn>CompactEditor</Fn>{"\n"}
                  {"  "}<Prop>extensions</Prop>{"={["}<Fn>StarterKit</Fn>{", "}<Prop>Callout</Prop>{"]}\n"}
                  {"/>"}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* === DX FEATURE GRID ================================================== */}
      <section className="relative overflow-hidden bg-background">
        {/* Multi-color gradient blur */}
        <div className="pointer-events-none absolute top-0 left-1/3 w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.06]" style={{ background: "linear-gradient(135deg, #f97316, #ec4899)" }} />
        <div className="pointer-events-none absolute bottom-0 right-1/4 w-[350px] h-[350px] rounded-full blur-[100px] opacity-[0.06]" style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }} />
        <div className="pointer-events-none absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full blur-[80px] opacity-[0.05]" style={{ background: "linear-gradient(135deg, #10b981, #22d3ee)" }} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-16 md:py-24">
          <div className="int-divider mb-12" />
          <div className="mb-12">
            <span className="text-[11px] font-mono uppercase tracking-[0.15em] font-medium text-muted-foreground">06 — Developer Experience</span>
            <h2 className="mt-4 text-[28px] lg:text-4xl font-medium leading-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>
              Built by developers, <em className="not-italic font-light text-muted-foreground">for developers</em>
            </h2>
            <p className="mt-4 text-base leading-relaxed max-w-xl text-muted-foreground">
              Every feature is designed to save you time and reduce complexity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {DX_ITEMS.map((item, i) => (
              <div key={item.tag} className="int-card">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded bg-foreground/[0.04] text-muted-foreground">
                    {item.tag}
                  </span>
                </div>
                <h4 className="text-sm font-medium mb-2 text-foreground">{item.title}</h4>
                <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FAQ (GEO-optimized) ================================================ */}
      <section className="relative bg-background py-24 md:py-32">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="mb-14">
            <span className="text-[11px] font-mono uppercase tracking-[0.15em] font-medium text-muted-foreground">07 — FAQ</span>
            <h2
              className="mt-4 text-3xl lg:text-[44px] font-medium leading-tight text-foreground"
              style={{ letterSpacing: "-0.03em" }}
            >
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-8">
            {faqItems.map((faq, i) => (
              <div key={i} className="pb-8" style={{ borderBottom: "1px solid var(--int-border)" }}>
                <h3 className="text-base font-medium text-foreground mb-3">{faq.q}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqItems.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.a,
                },
              })),
            }),
          }}
        />
      </section>

      {/* === CTA FOOTER ======================================================= */}
      <section className="relative overflow-hidden">
        {/* Gradient accent behind */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-[300px] blur-[100px] opacity-40 pointer-events-none"
          style={{ background: "var(--int-gradient-strong)" }}
        />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-24 md:py-36 text-center">
          <h2
            className="text-4xl lg:text-[56px] font-medium leading-none text-foreground"
            style={{ letterSpacing: "-0.03em" }}
          >
            Ready to <em className="not-italic font-light text-muted-foreground">build</em>?
          </h2>
          <p className="mt-6 text-base leading-relaxed max-w-md mx-auto text-muted-foreground">
            No ProseMirror dependency. Simple, powerful extensions. No PhD required.
          </p>

          <div className="mt-10">
            <CopyNpm command="npm install @mina-editor/core" />
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/demo" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-foreground text-background rounded-md hover:opacity-90 transition-opacity">
              <Play className="w-3.5 h-3.5" /> Try the Editor
            </Link>
            <a
              href="https://github.com/mina-massoud/mina-rich-editor"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-background text-foreground border border-border rounded-md hover:bg-muted transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub
            </a>
          </div>

          <div className="mt-16 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/docs" className="hover:underline hover:text-foreground transition-colors">Docs</Link>
            <Link href="/demo" className="hover:underline hover:text-foreground transition-colors">Demo</Link>
            <a href="https://github.com/mina-massoud/mina-rich-editor" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-foreground transition-colors">GitHub</a>
            <span>MIT License</span>
          </div>
        </div>
      </section>

      {/* === FOOTER =========================================================== */}
      <footer className="bg-background" style={{ borderTop: "1px solid var(--int-border)" }}>
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Logo */}
            <div>
              <span className="font-handwritten text-2xl font-semibold text-foreground">Mina Rich Editor</span>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Block-based rich text editor for React.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider mb-3 text-muted-foreground">Product</h4>
              <div className="space-y-2">
                <Link href="/demo" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Demo</Link>
                <Link href="/docs" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</Link>
                <Link href="/compact" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">CompactEditor</Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider mb-3 text-muted-foreground">Legal</h4>
              <div className="space-y-2">
                <span className="block text-sm text-muted-foreground">MIT License</span>
              </div>
            </div>

            {/* Social */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider mb-3 text-muted-foreground">Social</h4>
              <div className="space-y-2">
                <a href="https://github.com/mina-massoud/mina-rich-editor" target="_blank" rel="noopener noreferrer" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
              </div>
            </div>
          </div>

          <div className="int-divider mt-8 mb-6" />
          <p className="text-xs text-muted-foreground">
            &copy; 2025&ndash;2026 Mina Massoud. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
