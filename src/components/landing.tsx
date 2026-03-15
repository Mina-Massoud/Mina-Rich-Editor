import React from "react";
import { Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { HeroSection } from "./ui/hero-section";

/* ─── Reusable Components ──────────────────────────────────────────────────── */

function DxCard({ tag, title, desc, idx }: { tag: string; title: string; desc: string; idx: number }) {
  return (
    <div
      className="group relative border-b border-r border-border-subtle p-6 transition-all duration-300 hover:bg-white/[0.04]"
    >
      <div
        className="absolute left-0 top-4 bottom-4 w-px bg-warm-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />
      <div className="flex items-baseline gap-3 mb-3">
        <span className="font-mono text-[10px] tabular-nums text-warm-500">
          {String(idx).padStart(2, "0")}
        </span>
        <span
          className="font-mono text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 border text-warm-300"
          style={{ borderColor: `rgba(200,180,160,0.15)`, background: `rgba(200,180,160,0.05)` }}
        >
          {tag}
        </span>
      </div>
      <h4 className="text-sm font-medium tracking-tight mb-2 text-warm-50">{title}</h4>
      <p className="text-xs font-light leading-relaxed text-warm-400">{desc}</p>
    </div>
  );
}

function StatBlock({ value, label, desc }: { value: string; label: string; desc: string }) {
  return (
    <div className="text-center space-y-2">
      <div className="text-5xl font-mono font-extralight text-warm-50">{value}</div>
      <div className="text-xs font-mono uppercase tracking-[0.2em] text-warm-200">{label}</div>
      <p className="text-xs font-light leading-relaxed max-w-xs mx-auto text-warm-400">{desc}</p>
    </div>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="border border-border-subtle overflow-hidden bg-surface-code">
      <div className="px-6 py-3 border-b flex items-center justify-between" style={{ borderColor: `rgba(200,180,160,0.06)` }}>
        <span className="text-xs font-mono uppercase tracking-widest text-warm-400">{label}</span>
        <Dots />
      </div>
      <pre className="px-8 py-6 overflow-x-auto text-sm leading-7 font-mono text-warm-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div
      className="w-full overflow-x-hidden bg-surface-base text-warm-100"
    >
      {/* ═══ HERO ═══════════════════════════════════════════════════════════ */}
      <HeroSection />

      {/* ═══ 01 — QUICK START ═════════════════════════════════════════════ */}
      <section className="relative px-8 md:px-16 py-32">
        <GridBg id="code" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <SectionHeader num="01" label="Quick Start" />
          <h2 className="text-3xl md:text-5xl font-extralight tracking-tight text-center mb-4 text-warm-50">
            Three lines. Working editor.
          </h2>
          <p className="text-center font-light mb-16 max-w-lg mx-auto text-warm-300">
            Import. Render. Ship.
          </p>
          <CodeBlock
            label="App.tsx"
            code={`import { CompactEditor } from '@mina-editor/core'

function App() {
  return (
    <CompactEditor
      initialContent={myContent}
      onChange={({ json, html }) => {
        saveToDatabase(json)
        updatePreview(html)
      }}
      minHeight="300px"
    />
  )
}`}
          />
          <DemoLink href="/compact" label="Try CompactEditor" />
        </div>
      </section>

      {/* ═══ 02 — AI INTEGRATION ══════════════════════════════════════════ */}
      <section className="relative px-8 md:px-16 py-32">
        <GridBg id="ai" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <SectionHeader num="02" label="AI Integration" />
          <h2 className="text-3xl md:text-5xl font-extralight tracking-tight text-center mb-4 text-warm-50">
            Your LLM, your editor
          </h2>
          <p className="text-center font-light mb-20 max-w-lg mx-auto text-warm-300">
            Provider-agnostic AI that streams content directly into blocks.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <div className="space-y-4">
                {[
                  { title: "Provider Agnostic", desc: "OpenAI, Anthropic, Ollama, or your own endpoint — implement one interface." },
                  { title: "Streaming Generation", desc: "AI responses stream token-by-token directly into editor blocks in real time." },
                  { title: "Stream to Blocks", desc: "Markdown from the LLM is parsed into structured blocks as it arrives — headings, lists, code." },
                  { title: "/ai Slash Command", desc: "Users type /ai followed by a prompt to generate content inline." },
                ].map((item) => (
                  <div key={item.title} className="border-l-2 border-border-strong pl-4">
                    <h4 className="text-sm font-medium text-warm-50">{item.title}</h4>
                    <p className="text-xs font-light mt-1 text-warm-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <CodeBlock
              label="AI Provider"
              code={`// Implement your AI provider
const myProvider: AIProvider = {
  generateStream: async function* (prompt) {
    const stream = await openai.chat.completions
      .create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        stream: true
      })
    for await (const chunk of stream) {
      yield chunk.choices[0]?.delta?.content ?? ""
    }
  }
}

// Pass it to the editor
<CompactEditor ai={myProvider} />`}
            />
          </div>
          <DemoLink href="/demo/ai" label="Try AI Integration" />
        </div>
      </section>

      {/* ═══ 03 — REAL-TIME COLLABORATION ═════════════════════════════════ */}
      <section className="relative px-8 md:px-16 py-32 bg-surface-raised">
        <div className="relative z-10 max-w-5xl mx-auto">
          <SectionHeader num="03" label="Collaboration" />
          <h2 className="text-3xl md:text-5xl font-extralight tracking-tight text-center mb-4 text-warm-50">
            Built for multiplayer
          </h2>
          <p className="text-center font-light mb-20 max-w-lg mx-auto text-warm-300">
            Same CRDT engine behind Figma and VS Code Live Share.
          </p>

          <div className="space-y-16 mb-20">
            <FeatureRow n="01" title="CRDT Conflict Resolution" desc="Y.js-powered conflict-free replicated data types ensure every edit merges cleanly — even offline. No server-side resolution needed." align="left" />
            <FeatureRow n="02" title="Cursor Presence" desc="See where other users are typing in real time. Color-coded cursors with user names, powered by Y.js awareness protocol." align="right" />
            <FeatureRow n="03" title="Simple Integration" desc="Wrap your editor in CollaborationProvider, point it at a WebSocket server, and you're live. No complex setup required." align="left" />
          </div>

          <CodeBlock
            label="Collaboration Setup"
            code={`import { CompactEditor } from '@mina-editor/core'
import { CollaborationProvider } from '@mina-editor/collaboration'

function CollabEditor() {
  return (
    <CollaborationProvider
      roomId="my-document"
      serverUrl="wss://your-server.com"
      user={{ name: "Mina", color: "#c8b4a0" }}
    >
      <CompactEditor />
    </CollaborationProvider>
  )
}`}
          />
          <DemoLink href="/collab" label="Try Collaboration" />
        </div>
      </section>

      {/* ═══ 04 — PERFORMANCE ═════════════════════════════════════════════ */}
      <section className="relative px-8 md:px-16 py-32">
        <GridBg id="perf" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <SectionHeader num="04" label="Performance" />
          <h2 className="text-3xl md:text-5xl font-extralight tracking-tight text-center mb-4 text-warm-50">
            Fast by architecture, not by accident
          </h2>
          <p className="text-center font-light mb-20 max-w-lg mx-auto text-warm-300">
            Engineered from the ground up for zero-lag editing at any scale.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
            <StatBlock value="2.8ms" label="Typing Overhead" desc="Per-keystroke processing time, measured on a 200-block document." />
            <StatBlock value="0" label="Re-renders on Keystroke" desc="Only the active block re-renders. All other blocks stay frozen." />
            <StatBlock value="14ms" label="Scroll Latency" desc="Measured scrolling through a 214-block document at 60fps." />
          </div>

          <div className="space-y-16">
            <FeatureRow n="01" title="Per-Block Subscriptions" desc="Each block subscribes only to its own slice of state. Type in block 5, blocks 1-4 and 6-200 don't know it happened." align="left" />
            <FeatureRow n="02" title="Structural Sharing" desc="State updates reuse unchanged references. React.memo skips re-renders automatically because the props literally haven't changed." align="right" />
            <FeatureRow n="03" title="Direct DOM Reconciliation" desc="Critical text operations bypass React's virtual DOM entirely, writing to the DOM directly for sub-millisecond response times." align="left" />
          </div>
          <DemoLink href="/demo" label="Try the Editor" />
        </div>
      </section>

      {/* ═══ 05 — DEVELOPER EXPERIENCE ════════════════════════════════════ */}
      <section className="relative px-8 md:px-16 py-32 bg-surface-raised">
        <div className="relative z-10 max-w-6xl mx-auto">
          <SectionHeader num="05" label="Developer Experience" />
          <h2 className="text-3xl md:text-5xl font-extralight tracking-tight text-center mb-4 text-warm-50">
            Built by developers, for developers
          </h2>
          <p className="text-center font-light mb-20 max-w-xl mx-auto text-warm-300">
            Every feature is designed to save you time and reduce complexity.
          </p>

          <div className="border-t border-l border-border-subtle">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <DxCard idx={1} tag="dnd" title="Drag & Drop" desc="Block-level reordering with visual drop indicators, nested block support, and touch-friendly handles for tablet users." />
              <DxCard idx={2} tag="tbl" title="Table System" desc="Full table editing — add and remove rows and columns, cell selection, and clean HTML table output." />
              <DxCard idx={3} tag="img" title="Image System" desc="Drag-to-upload, paste from clipboard, URL embedding, resize handles, alt text, and caption support." />
              <DxCard idx={4} tag="md" title="Markdown Shortcuts" desc="Type # space for headings, ** for bold, ` for code, > for quotes, - for lists. Zero learning curve." />
              <DxCard idx={5} tag="sel" title="Selection Toolbar" desc="Floating toolbar appears on text selection with bold, italic, underline, strikethrough, code, link, and color options." />
              <DxCard idx={6} tag="tpl" title="Template System" desc="Pre-built document templates — blog post, meeting notes, project brief — that users can apply with one click." />
              <DxCard idx={7} tag="kbd" title="Keyboard Shortcuts" desc="Comprehensive shortcut system: Ctrl+B for bold, Ctrl+K for links, Ctrl+Shift+1-3 for headings, Tab for indent." />
              <DxCard idx={8} tag="a11y" title="Accessibility" desc="ARIA roles and labels on all interactive elements. Full keyboard navigation. Screen reader announcements for block operations." />
              <DxCard idx={9} tag="ts" title="TypeScript-First" desc="100% TypeScript. Every prop, callback, type, and hook is fully typed. The type system is the documentation." />
              <DxCard idx={10} tag="css" title="Style Isolation" desc="All editor styles are scoped. Your app's CSS won't break the editor. The editor's CSS won't break your app." />
              <DxCard idx={11} tag="45k" title="Lightweight" desc="~45KB gzipped with zero ProseMirror dependency. Compare to TipTap at 120KB+ with mandatory ProseMirror core." />
              <DxCard idx={12} tag="tst" title="440+ Tests" desc="Comprehensive test suite covering block operations, keyboard handling, serialization, and edge cases. Vitest + Playwright." />
            </div>
          </div>
          <DemoLink href="/demo/features" label="Try Features" />
        </div>
      </section>

      {/* ═══ 06 — CONTENT MANAGEMENT ══════════════════════════════════════ */}
      <section className="relative px-8 md:px-16 py-32">
        <GridBg id="cms" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <SectionHeader num="06" label="Content Management" />
          <h2 className="text-3xl md:text-5xl font-extralight tracking-tight text-center mb-4 text-warm-50">
            Built for content management
          </h2>
          <p className="text-center font-light mb-20 max-w-lg mx-auto text-warm-300">
            Programmatic control over every aspect of the editor.
          </p>

          <div className="mb-12">
            <CodeBlock
              label="useEditorAPI()"
              code={`const api = useEditorAPI()

// Read content in any format
const json = api.getJSON()
const html = api.getHTML()
const markdown = api.getMarkdown()
const text = api.getPlainText()

// Programmatic control
api.setContent(savedDocument)
api.insertBlock({ type: "heading-1", content: "Hello" })

// State checks
api.isDirty()       // unsaved changes?
api.getBlockCount() // total blocks`}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { fn: "getJSON()", desc: "Structured tree for storage and re-hydration" },
              { fn: "getHTML()", desc: "Semantic HTML — no Tailwind, no framework artifacts" },
              { fn: "getMarkdown()", desc: "CommonMark-compatible Markdown output" },
              { fn: "getPlainText()", desc: "Raw text for search indexing and previews" },
            ].map((item) => (
              <div
                key={item.fn}
                className="border border-border-subtle p-5 space-y-2"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className="font-mono text-sm text-warm-200">{item.fn}</div>
                <p className="text-xs font-light text-warm-400">{item.desc}</p>
              </div>
            ))}
          </div>
          <DemoLink href="/demo/export" label="Try Export" />
        </div>
      </section>

      {/* ═══ 07 — MULTI-FORMAT EXPORT ═════════════════════════════════════ */}
      <section className="relative px-8 md:px-16 py-32 bg-surface-raised">
        <div className="relative z-10 max-w-4xl mx-auto">
          <SectionHeader num="07" label="Ship Anywhere" />
          <h2 className="text-3xl md:text-5xl font-extralight tracking-tight text-center mb-4 text-warm-50">
            Ship content anywhere
          </h2>
          <p className="text-center font-light mb-4 max-w-lg mx-auto text-warm-300">
            Same document, four formats. No Tailwind classes. No framework artifacts.
          </p>
          <p className="text-center font-mono text-xs mb-16 text-warm-400">
            One document &rarr; four clean outputs
          </p>

          <div className="space-y-6">
            <CodeBlock
              label="Semantic HTML"
              code={`<article>
  <h1>Project Update</h1>
  <p>The new <strong>dashboard</strong> is ready for review.</p>
  <ul>
    <li>Performance improvements</li>
    <li>New analytics widgets</li>
  </ul>
</article>`}
            />
            <CodeBlock
              label="Markdown"
              code={`# Project Update

The new **dashboard** is ready for review.

- Performance improvements
- New analytics widgets`}
            />
            <CodeBlock
              label="JSON"
              code={`{
  "type": "document",
  "children": [
    { "type": "heading-1", "content": "Project Update" },
    { "type": "paragraph", "content": "The new **dashboard** is..." },
    { "type": "bulleted-list", "children": [
      { "type": "list-item", "content": "Performance improvements" },
      { "type": "list-item", "content": "New analytics widgets" }
    ]}
  ]
}`}
            />
            <CodeBlock
              label="Plain Text"
              code={`Project Update

The new dashboard is ready for review.

- Performance improvements
- New analytics widgets`}
            />
          </div>
          <DemoLink href="/demo/export" label="Try Export" />
        </div>
      </section>

      {/* ═══ CTA ════════════════════════════════════════════════════════════ */}
      <section className="relative px-8 md:px-16 py-40 text-center">
        <GridBg id="cta" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-extralight tracking-tight mb-6 text-warm-50">
            Ready to build?
          </h2>
          <p className="font-light mb-12 text-warm-300">
            No ProseMirror. No plugins. No PhD in text editor internals.
          </p>
          <div className="inline-block border px-8 py-4 mb-12 font-mono text-sm select-all text-warm-200" style={{ borderColor: `rgba(200,180,160,0.15)` }}>
            npm install @mina-editor/core
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/demo" className="px-10 py-4 font-medium tracking-wide transition-opacity hover:opacity-80 active:scale-[0.98] bg-warm-200 text-warm-900">
              Try the Editor &rarr;
            </Link>
            <a href="https://github.com/mina-massoud/mina-rich-editor" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-10 py-4 border border-warm-700 font-medium tracking-wide transition-colors hover:bg-white/5 text-warm-200">
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
        <p className="relative z-10 mt-24 text-xs font-mono tracking-wider text-warm-500">
          MIT License &middot; 2025&ndash;2026 Mina Massoud
        </p>
      </section>
    </div>
  );
}

/* ─── Shared primitives ───────────────────────────────────────────────────── */

function GridBg({ id }: { id: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={`g-${id}`} width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(200,180,160,0.04)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#g-${id})`} />
    </svg>
  );
}

function Dots() {
  return (
    <div className="flex gap-1.5">
      <div className="w-1.5 h-1.5 bg-warm-500" />
      <div className="w-1.5 h-1.5 bg-warm-400" />
      <div className="w-1.5 h-1.5 bg-warm-300" />
    </div>
  );
}

function SectionHeader({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-6 mb-20">
      <div className="h-px flex-1" style={{ background: `linear-gradient(to right, rgba(200,180,160,0.2), transparent)` }} />
      <span className="text-xs font-mono uppercase tracking-[0.3em] text-warm-200">
        {num} &mdash; {label}
      </span>
      <div className="h-px flex-1" style={{ background: `linear-gradient(to left, rgba(200,180,160,0.2), transparent)` }} />
    </div>
  );
}

function FeatureRow({ n, title, desc, align }: { n: string; title: string; desc: string; align: "left" | "right" }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">
      <div className={align === "right" ? "md:order-2 md:text-right" : ""}>
        <span className="text-xs font-mono tracking-[0.3em] block mb-4 text-warm-400">{n}</span>
        <h3 className="text-2xl md:text-3xl font-extralight tracking-tight text-warm-50">{title}</h3>
      </div>
      <div className={align === "right" ? "md:order-1" : ""}>
        <p className="font-light leading-relaxed text-sm md:text-base pt-1 text-warm-300">{desc}</p>
      </div>
    </div>
  );
}

function DemoLink({ href, label }: { href: string; label: string }) {
  return (
    <div className="text-center mt-12">
      <Link href={href} className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.15em] text-warm-300 hover:text-warm-100 transition-colors border-b border-warm-700 pb-1">
        {label}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

function ScreenshotFrame({ label, src, alt, w, h, priority }: { label: string; src: string; alt: string; w: number; h: number; priority?: boolean }) {
  return (
    <div>
      <div className="border-b border-border-subtle px-6 py-3 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.03)" }}>
        <span className="text-xs font-mono uppercase tracking-widest text-warm-400">{label}</span>
        <Dots />
      </div>
      <div className="border border-t-0 border-border-subtle">
        <Image src={src} alt={alt} width={w} height={h} className="w-full h-auto" priority={priority} />
      </div>
    </div>
  );
}
