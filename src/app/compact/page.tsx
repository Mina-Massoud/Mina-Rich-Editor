"use client";

import React, { useState } from "react";
import { CompactEditor } from "@/components/CompactEditor";
import { ContainerNode } from "@/lib/types";
import { generateId } from "@/lib/utils/id-generator";

// ─── Sample initial content ────────────────────────────────────────────────

// Use FIXED IDs for demo content so they survive React Strict Mode
// double-render. With random IDs, Strict Mode causes DOM↔Store ID mismatch.
function makeSampleContent(): ContainerNode {
  return {
    id: "root-demo",
    type: "container",
    attributes: {},
    children: [
      {
        id: "demo-h2-welcome",
        type: "h2",
        content: "Welcome to CompactEditor",
        attributes: {},
      },
      {
        id: "demo-p-intro",
        type: "p",
        content:
          "This is a self-contained embeddable editor. Select any text to see the floating toolbar, or use the inline toolbar above to format your content.",
        attributes: {},
      },
      {
        id: "demo-p-tryit",
        type: "p",
        content: "Try typing, formatting, and using the block-type dropdown.",
        attributes: {},
      },
    ],
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function CompactDemoPage() {
  const [output, setOutput] = useState<string>("");
  const initialContent = React.useMemo(() => makeSampleContent(), []);

  return (
    <div className="min-h-screen bg-surface-base py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-10">
        <header>
          <h1 className="text-3xl font-extralight tracking-tight text-warm-50">
            CompactEditor Demo
          </h1>
          <p className="text-warm-400 mt-2 font-light">
            A lightweight embeddable rich-text editor with an inline toolbar.
          </p>
        </header>

        {/* ── 300 px min-height ─────────────────────────────────────────────── */}
        <section className="space-y-2">
          <h2 className="text-base font-medium text-warm-100">Small (300px)</h2>
          <CompactEditor
            initialContent={initialContent}
            minHeight="300px"
            onChange={({ html }) => setOutput(html)}
          />
        </section>

        {/* ── 500 px min-height ─────────────────────────────────────────────── */}
        <section className="space-y-2">
          <h2 className="text-base font-medium text-warm-100">Medium (500px)</h2>
          <CompactEditor minHeight="500px" />
        </section>

        {/* ── Full-width, read-only ──────────────────────────────────────────── */}
        <section className="space-y-2">
          <h2 className="text-base font-medium text-warm-100">Read-only</h2>
          <CompactEditor
            initialContent={initialContent}
            readOnly
            minHeight="200px"
          />
        </section>

        {/* ── onChange output ────────────────────────────────────────────────── */}
        {output && (
          <section className="space-y-2">
            <h2 className="text-base font-medium text-warm-100">
              onChange HTML output (from first editor)
            </h2>
            <pre className="text-xs bg-surface-code text-warm-100 rounded-md p-4 overflow-auto whitespace-pre-wrap border">
              {output}
            </pre>
          </section>
        )}
      </div>
    </div>
  );
}
