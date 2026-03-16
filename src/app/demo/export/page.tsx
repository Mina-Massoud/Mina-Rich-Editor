"use client";

import { useState, useMemo, useCallback } from "react";
import { createInitialState } from "@/lib";
import { DynamicEditorProvider } from "@/components/DynamicEditorProvider";
import { Editor } from "@/components/Editor";
import { DemoPageShell } from "@/components/demo/DemoPageShell";
import { ContainerNode, EditorState, TextNode, getNodeTextContent, isTextNode, isContainerNode } from "@/lib/types";
import { useContainer } from "@/lib/store/editor-store";
import { serializeToSemanticHtml } from "@/lib/utils/serialize-semantic-html";
import { serializeToMarkdown } from "@/lib/utils/serialize-markdown";

// ─── Sample content with fixed IDs for React Strict Mode ─────────────────────

const sampleContent: ContainerNode = {
  id: "root-export",
  type: "container",
  attributes: {},
  children: [
    { id: "export-h1", type: "h1", content: "Project Update", attributes: {} },
    { id: "export-p1", type: "p", content: "The new dashboard is ready for review.", attributes: {} },
    { id: "export-li1", type: "li", content: "Performance improvements", attributes: {} },
    { id: "export-li2", type: "li", content: "New analytics widgets", attributes: {} },
    { id: "export-p2", type: "p", content: "Please review and share feedback by Friday.", attributes: {} },
  ],
};

// ─── Image upload handler ────────────────────────────────────────────────────

async function handleImageUpload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Plain text extraction ───────────────────────────────────────────────────

function extractPlainText(container: ContainerNode): string {
  const lines: string[] = [];

  function walk(node: ContainerNode["children"][number]) {
    if (isTextNode(node)) {
      const text = getNodeTextContent(node as TextNode);
      if (text.trim()) lines.push(text);
    }
    if (isContainerNode(node)) {
      for (const child of node.children) {
        walk(child);
      }
    }
  }

  for (const child of container.children) {
    walk(child);
  }

  return lines.join("\n");
}

// ─── Tab types ───────────────────────────────────────────────────────────────

type OutputTab = "json" | "html" | "markdown" | "plaintext";

const TAB_LABELS: { key: OutputTab; label: string }[] = [
  { key: "json", label: "JSON" },
  { key: "html", label: "HTML" },
  { key: "markdown", label: "Markdown" },
  { key: "plaintext", label: "Plain Text" },
];

// ─── Output Panel (reactive, inside EditorProvider) ──────────────────────────

function OutputPanel() {
  const container = useContainer();
  const [activeTab, setActiveTab] = useState<OutputTab>("json");
  const [copied, setCopied] = useState(false);

  const outputs = useMemo(() => {
    return {
      json: JSON.stringify(container, null, 2),
      html: serializeToSemanticHtml(container),
      markdown: serializeToMarkdown(container),
      plaintext: extractPlainText(container),
    };
  }, [container]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(outputs[activeTab]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
    }
  }, [outputs, activeTab]);

  return (
    <div className="flex h-full flex-col rounded-lg border border-border">
      {/* Tabs */}
      <div className="flex items-center border-b border-border">
        {TAB_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === key
                ? "text-foreground border-b-2"
                : "text-muted-foreground/70 hover:text-muted-foreground"
            }`}
            style={activeTab === key ? { borderBottomColor: "#c4956a" } : undefined}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto pr-2">
          <button
            onClick={handleCopy}
            className="rounded px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground/80"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-muted-foreground">
          {outputs[activeTab]}
        </pre>
      </div>
    </div>
  );
}

// ─── Code example ────────────────────────────────────────────────────────────

const codeExample = {
  label: "useEditorAPI()",
  code: `import { useEditorAPI } from "@mina-rich-editor/core";
import { serializeToSemanticHtml } from "@mina-rich-editor/core/utils";
import { serializeToMarkdown } from "@mina-rich-editor/core/utils";

// Inside EditorProvider context:
const api = useEditorAPI();
const container = api.getContainer();

// Export in different formats
const json = JSON.stringify(container, null, 2);
const html = serializeToSemanticHtml(container);
const markdown = serializeToMarkdown(container);`,
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ExportDemoPage() {
  const initialState = useMemo<EditorState>(() => {
    return createInitialState(sampleContent);
  }, []);

  return (
    <DemoPageShell
      title="Content Management"
      description="Edit content on the left, see live output in all four formats on the right. Use the tabs to switch between JSON, HTML, Markdown, and Plain Text."
      codeExample={codeExample}
    >
      <DynamicEditorProvider initialState={initialState}>
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6" style={{ minHeight: "70vh" }}>
          {/* Editor - Left side */}
          <div className="w-full lg:w-[60%]">
            <Editor
              onUploadImage={handleImageUpload}
              notionBased
              className="rounded-lg border shadow-lg"
            />
          </div>

          {/* Output Panel - Right side */}
          <div className="w-full lg:w-[40%]">
            <OutputPanel />
          </div>
        </div>
      </DynamicEditorProvider>
    </DemoPageShell>
  );
}
