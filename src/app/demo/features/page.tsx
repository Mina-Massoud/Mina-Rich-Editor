"use client";

import { DemoPageShell } from "@/components/demo/DemoPageShell";
import { CompactEditor } from "@/components/CompactEditor";
import type { ContainerNode } from "@/lib/types";

// ─── Pre-populated content for each section ──────────────────────────────────

const dragDropContent: ContainerNode = {
  id: "feat-drag-root",
  type: "container",
  attributes: {},
  children: [
    { id: "feat-drag-1", type: "p", content: "Block 1 — Drag me up or down", attributes: {} },
    { id: "feat-drag-2", type: "p", content: "Block 2 — Try reordering this block", attributes: {} },
    { id: "feat-drag-3", type: "p", content: "Block 3 — Grab the handle on the left", attributes: {} },
    { id: "feat-drag-4", type: "p", content: "Block 4 — Drop me anywhere", attributes: {} },
    { id: "feat-drag-5", type: "p", content: "Block 5 — Rearrange to your liking", attributes: {} },
  ],
};

const tableContent: ContainerNode = {
  id: "feat-table-root",
  type: "container",
  attributes: {},
  children: [
    { id: "feat-table-1", type: "h2", content: "Sample Table", attributes: {} },
    { id: "feat-table-2", type: "p", content: "Type /table below to insert a table. Click inside cells to edit, and use the controls to add or remove rows and columns.", attributes: {} },
    { id: "feat-table-3", type: "p", content: "Try it here — just click and type /table", attributes: {} },
  ],
};

const markdownContent: ContainerNode = {
  id: "feat-md-root",
  type: "container",
  attributes: {},
  children: [
    { id: "feat-md-1", type: "p", content: "Try typing these shortcuts in a new line below:", attributes: {} },
    { id: "feat-md-2", type: "p", content: "# space → Heading 1", attributes: {} },
    { id: "feat-md-3", type: "p", content: "## space → Heading 2", attributes: {} },
    { id: "feat-md-4", type: "p", content: "**text** → Bold", attributes: {} },
    { id: "feat-md-5", type: "p", content: "*text* → Italic", attributes: {} },
    { id: "feat-md-6", type: "p", content: "`code` → Inline code", attributes: {} },
    { id: "feat-md-7", type: "p", content: "> space → Blockquote", attributes: {} },
    { id: "feat-md-8", type: "p", content: "- space → Bullet list", attributes: {} },
  ],
};

const keyboardContent: ContainerNode = {
  id: "feat-kb-root",
  type: "container",
  attributes: {},
  children: [
    { id: "feat-kb-1", type: "p", content: "Click here and try the keyboard shortcuts listed below. Select some text and press Ctrl+B to bold it, or Ctrl+I for italic.", attributes: {} },
    { id: "feat-kb-2", type: "p", content: "This is a playground paragraph — feel free to edit, undo, and redo.", attributes: {} },
  ],
};

// ─── Shortcut reference data ─────────────────────────────────────────────────

const shortcuts = [
  { keys: "Ctrl+B", action: "Bold" },
  { keys: "Ctrl+I", action: "Italic" },
  { keys: "Ctrl+U", action: "Underline" },
  { keys: "Ctrl+K", action: "Link" },
  { keys: "Ctrl+Z", action: "Undo" },
  { keys: "Ctrl+Shift+Z", action: "Redo" },
  { keys: "Tab", action: "Indent" },
  { keys: "Shift+Tab", action: "Outdent" },
];

// ─── Section wrapper ─────────────────────────────────────────────────────────

function FeatureSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-extralight text-warm-50">{title}</h2>
        <p className="mt-1 text-sm text-warm-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FeaturesPage() {
  return (
    <DemoPageShell
      title="Interactive Features"
      description="Try each feature live. Every section below has an interactive editor you can play with."
    >
      <div className="space-y-16 pb-12">
        {/* Drag & Drop */}
        <FeatureSection
          title="Drag & Drop"
          description="Grab the handle on the left of any block and drag to reorder."
        >
          <CompactEditor initialContent={dragDropContent} minHeight="200px" />
        </FeatureSection>

        {/* Table Editing */}
        <FeatureSection
          title="Table Editing"
          description="Click inside cells to edit. Use the controls to add or remove rows and columns."
        >
          <CompactEditor initialContent={tableContent} minHeight="200px" />
        </FeatureSection>

        {/* Markdown Shortcuts */}
        <FeatureSection
          title="Markdown Shortcuts"
          description="Type markdown syntax and watch it convert automatically."
        >
          <CompactEditor initialContent={markdownContent} minHeight="260px" />
        </FeatureSection>

        {/* Keyboard Shortcuts */}
        <FeatureSection
          title="Keyboard Shortcuts"
          description="Use familiar keyboard shortcuts while editing below."
        >
          <CompactEditor initialContent={keyboardContent} minHeight="160px" />

          {/* Shortcut reference card */}
          <div
            className="mt-4 rounded-lg border p-4"
            style={{
              borderColor: "rgba(200,180,160,0.12)",
              background: "rgba(200,180,160,0.03)",
            }}
          >
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-warm-400">
              Shortcut Reference
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4">
              {shortcuts.map((s) => (
                <div
                  key={s.keys}
                  className="flex items-center justify-between gap-3 rounded px-2 py-1.5"
                  style={{ background: "rgba(200,180,160,0.04)" }}
                >
                  <kbd
                    className="rounded px-1.5 py-0.5 font-mono text-[11px] text-warm-200"
                    style={{
                      background: "rgba(200,180,160,0.08)",
                      border: "1px solid rgba(200,180,160,0.12)",
                    }}
                  >
                    {s.keys}
                  </kbd>
                  <span className="text-xs text-warm-400">{s.action}</span>
                </div>
              ))}
            </div>
          </div>
        </FeatureSection>
      </div>
    </DemoPageShell>
  );
}
