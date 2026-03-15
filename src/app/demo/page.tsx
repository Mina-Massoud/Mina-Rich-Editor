"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { EditorProvider, createInitialState } from "@/lib";
import { createEmptyContent } from "@/lib/empty-content";
import { ContainerNode, EditorState } from "@/lib/types";
import { Editor } from "@/components/Editor";
import { AICommandMenu } from "@/components/AICommandMenu";
import type { AIProvider } from "@/lib/ai/types";
import { createGeminiProvider } from "@/lib/ai/gemini-provider";
import Link from "next/link";
import { QuickModeToggle } from "@/components/QuickModeToggle";
import { ExportFloatingButton } from "@/components/ExportFloatingButton";
import {
  useEditorStore,
  useContainer,
} from "@/lib/store/editor-store";
import { useToast } from "@/hooks/use-toast";
import {
  createHandleCopyHtml,
  createHandleCopyJson,
} from "@/lib/handlers/node-operation-handlers";

// ─── AI Provider ──────────────────────────────────────────────────────────────

import { demoAIProvider } from "@/lib/ai/demo-provider";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const aiProvider: AIProvider = GEMINI_API_KEY
  ? createGeminiProvider({ apiKey: GEMINI_API_KEY })
  : demoAIProvider;

// ─── Shared image upload handler ──────────────────────────────────────────────

async function handleImageUpload(file: File): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Demo-only: connected export button ──────────────────────────────────────

function DemoExportButton({
  copiedHtml,
  copiedJson,
  enhanceSpaces,
  onCopyHtml,
  onCopyJson,
  onEnhanceSpacesChange,
}: {
  copiedHtml: boolean;
  copiedJson: boolean;
  enhanceSpaces: boolean;
  onCopyHtml: () => void;
  onCopyJson: () => void;
  onEnhanceSpacesChange: (checked: boolean) => void;
}) {
  const container = useContainer();
  return (
    <ExportFloatingButton
      container={container}
      onCopyHtml={onCopyHtml}
      onCopyJson={onCopyJson}
      copiedHtml={copiedHtml}
      copiedJson={copiedJson}
      enhanceSpaces={enhanceSpaces}
      onEnhanceSpacesChange={onEnhanceSpacesChange}
    />
  );
}

// ─── Demo controls wrapper (needs EditorProvider context) ────────────────────

function DemoControls({
  readOnly,
  notionBased,
  onReadOnlyChange,
  onNotionBasedChange,
  dir,
  onDirChange,
}: {
  readOnly: boolean;
  notionBased: boolean;
  onReadOnlyChange: (v: boolean) => void;
  onNotionBasedChange: (v: boolean) => void;
  dir?: 'ltr' | 'rtl' | 'auto';
  onDirChange?: (dir: 'ltr' | 'rtl' | 'auto') => void;
}) {
  const { toast } = useToast();
  const storeGetContainer = useEditorStore((s) => s.getContainer);
  const getContainer = useCallback(() => storeGetContainer(), [storeGetContainer]);

  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [enhanceSpaces, setEnhanceSpaces] = useState(true);

  const handleCopyHtml = useCallback(
    () =>
      createHandleCopyHtml({ toast }, enhanceSpaces, setCopiedHtml)(
        getContainer()
      ),
    [enhanceSpaces, toast, getContainer]
  );

  const handleCopyJson = useCallback(
    () => createHandleCopyJson({ toast }, setCopiedJson)(getContainer()),
    [toast, getContainer]
  );

  return (
    <>
      {/* Read-only / notion-mode / theme toggle */}
      <QuickModeToggle
        readOnly={readOnly}
        onReadOnlyChange={onReadOnlyChange}
        notionBased={notionBased}
        onNotionBasedChange={onNotionBasedChange}
        dir={dir}
        onDirChange={onDirChange}
      />

      {/* Export HTML / JSON floating button */}
      {!readOnly && (
        <DemoExportButton
          copiedHtml={copiedHtml}
          copiedJson={copiedJson}
          enhanceSpaces={enhanceSpaces}
          onCopyHtml={handleCopyHtml}
          onCopyJson={handleCopyJson}
          onEnhanceSpacesChange={setEnhanceSpaces}
        />
      )}

    </>
  );
}

// ─── Editor with AI integration ──────────────────────────────────────────────

function EditorWithAI({
  readOnly,
  notionBased,
  dir,
  onDirChange,
}: {
  readOnly: boolean;
  notionBased: boolean;
  dir: 'ltr' | 'rtl' | 'auto';
  onDirChange: (dir: 'ltr' | 'rtl' | 'auto') => void;
}) {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTargetNodeId, setAiTargetNodeId] = useState<string>("");
  const [aiAnchorEl, setAiAnchorEl] = useState<HTMLElement | null>(null);

  const handleAISelect = useCallback((nodeId: string) => {
    setAiTargetNodeId(nodeId);
    const blockEl = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
    setAiAnchorEl(blockEl);
    setAiOpen(true);
  }, []);

  return (
    <>
      <Editor
        readOnly={readOnly}
        onUploadImage={handleImageUpload}
        notionBased={notionBased}
        dir={dir}
        onDirChange={onDirChange}
        onAISelect={handleAISelect}
        aiProvider={aiProvider}
        aiSystemPrompt="You are a text editing assistant. Return ONLY the rewritten text."
        className="shadow-2xl border-2 rounded-none"
      />
      {!readOnly && (
        <AICommandMenu
          isOpen={aiOpen}
          onClose={() => setAiOpen(false)}
          provider={aiProvider}
          targetNodeId={aiTargetNodeId}
          anchorElement={aiAnchorEl}
          defaultSystemPrompt="You are a helpful writing assistant inside Mina Rich Editor. Write in Markdown format with headings, bold, lists, and code blocks as appropriate."
        />
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [readOnly, setReadOnly] = useState(false);
  const [notionBased, setNotionBased] = useState(true);
  const [dir, setDir] = useState<'ltr' | 'rtl' | 'auto'>('ltr');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const initialState = useMemo<EditorState>(() => {
    const container: ContainerNode = {
      id: "root",
      type: "container",
      children: createEmptyContent(),
      attributes: {},
    };

    return createInitialState(container);
  }, []);

  return (
    <div className="flex flex-col flex-1 w-full relative min-h-screen">
      <div className="flex flex-grow">
        <div className="flex w-full flex-col flex-grow">
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 50 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.6,
                ease: [0.76, 0, 0.24, 1],
                delay: 0.2,
              },
            }}
            className="w-full flex-1 min-h-screen flex flex-col"
          >
            <EditorProvider initialState={initialState}>
              {/* Demo-only controls — not part of the library */}
              <DemoControls
                readOnly={readOnly}
                notionBased={notionBased}
                onReadOnlyChange={setReadOnly}
                onNotionBasedChange={setNotionBased}
                dir={dir}
                onDirChange={setDir}
              />

              {/* Editor + AI integration */}
              <EditorWithAI
                readOnly={readOnly}
                notionBased={notionBased}
                dir={dir}
                onDirChange={setDir}
              />
            </EditorProvider>
            {/* Demo navigation */}
            <div className="fixed bottom-4 right-4 z-40 flex gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Home
              </Link>
              <Link
                href="/collab"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Collab Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
