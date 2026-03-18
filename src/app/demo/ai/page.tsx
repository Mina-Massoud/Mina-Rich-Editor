"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createInitialState } from "@/lib";
import { DynamicEditorProvider } from "@/components/DynamicEditorProvider";
import { createEmptyContent } from "@/lib/empty-content";
import { ContainerNode, EditorState } from "@/lib/types";
import { Editor } from "@/components/Editor";
import { AICommandMenu } from "@/components/AICommandMenu";
import type { AIProvider } from "@/lib/ai/types";
import { createGeminiProvider } from "@/lib/ai/gemini-provider";
import { createOpenAIProvider } from "@/lib/ai/openai-provider";
import { createAnthropicProvider } from "@/lib/ai/anthropic-provider";
import { demoAIProvider } from "@/lib/ai/demo-provider";
import { DemoPageShell } from "@/components/demo/DemoPageShell";
import { useToast } from "@/hooks/use-toast";

// ─── Constants ───────────────────────────────────────────────────────────────

type ProviderType = "gemini" | "openai" | "anthropic";

const PROVIDERS: { id: ProviderType; label: string }[] = [
  { id: "gemini", label: "Gemini" },
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
];

const STORAGE_KEY = "mina-demo-ai-key";
const STORAGE_PROVIDER_KEY = "mina-demo-ai-provider";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const CODE_EXAMPLE = {
  label: "AI Integration",
  code: `import { CompactEditor, createGeminiProvider } from "@/components/ui/rich-editor"

const ai = createGeminiProvider({
  apiKey: 'your-api-key',
})

<CompactEditor ai={ai} />`,
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

// ─── AI Provider factory ─────────────────────────────────────────────────────

function createProviderFromKey(
  providerType: ProviderType,
  apiKey: string
): AIProvider {
  switch (providerType) {
    case "gemini":
      return createGeminiProvider({ apiKey });
    case "openai":
      return createOpenAIProvider({ apiKey });
    case "anthropic":
      return createAnthropicProvider({ apiKey });
  }
}

// ─── API Key Panel ───────────────────────────────────────────────────────────

function APIKeyPanel({
  provider,
  apiKey,
  isConfigured,
  usingEnvKey,
  onProviderChange,
  onApiKeyChange,
  onUseDemoMode,
}: {
  provider: ProviderType;
  apiKey: string;
  isConfigured: boolean;
  usingEnvKey: boolean;
  onProviderChange: (p: ProviderType) => void;
  onApiKeyChange: (key: string) => void;
  onUseDemoMode: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          AI Provider Configuration
        </h3>
        {isConfigured && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-[11px] font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            API Key Configured
          </span>
        )}
      </div>

      {/* Provider tabs */}
      <div className="flex gap-0 mb-3 border-b border-border">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => onProviderChange(p.id)}
            className={`px-4 py-2 text-xs font-medium transition-colors relative ${
              provider === p.id
                ? "text-foreground"
                : "text-muted-foreground/70 hover:text-muted-foreground"
            }`}
          >
            {p.label}
            {provider === p.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t bg-foreground/50" />
            )}
          </button>
        ))}
      </div>

      {/* API key input */}
      {usingEnvKey ? (
        <p className="text-xs text-muted-foreground">
          Using API key from environment variable.
        </p>
      ) : (
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="Paste your API key here..."
            className="flex-1 rounded-md border border-border bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={onUseDemoMode}
            className="rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Use Demo Mode
          </button>
        </div>
      )}

      {/* Security note */}
      {!usingEnvKey && (
        <p className="mt-2 text-[11px] text-muted-foreground/50">
          Your key stays in this browser session only.
        </p>
      )}
    </div>
  );
}

// ─── Editor with AI ──────────────────────────────────────────────────────────

function EditorWithAI({ aiProvider }: { aiProvider: AIProvider }) {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTargetNodeId, setAiTargetNodeId] = useState<string>("");
  const [aiAnchorEl, setAiAnchorEl] = useState<HTMLElement | null>(null);

  const handleAISelect = useCallback((nodeId: string) => {
    setAiTargetNodeId(nodeId);
    const blockEl = document.querySelector(
      `[data-node-id="${nodeId}"]`
    ) as HTMLElement;
    setAiAnchorEl(blockEl);
    setAiOpen(true);
  }, []);

  return (
    <>
      <Editor
        onUploadImage={handleImageUpload}
        notionBased
        dir="ltr"
        onAISelect={handleAISelect}
        aiProvider={aiProvider}
        aiSystemPrompt="You are a text editing assistant. Return ONLY the rewritten text."
        className="shadow-2xl border-2 rounded-none"
      />
      <AICommandMenu
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        provider={aiProvider}
        targetNodeId={aiTargetNodeId}
        anchorElement={aiAnchorEl}
        defaultSystemPrompt="You are a helpful writing assistant inside Mina Rich Editor. Write in Markdown format with headings, bold, lists, and code blocks as appropriate."
      />
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AIDemoPage() {
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderType>("gemini");
  const [apiKey, setApiKey] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);

  const usingEnvKey = !!(GEMINI_API_KEY && selectedProvider === "gemini");

  // Restore from sessionStorage on mount
  useEffect(() => {
    try {
      const storedKey = sessionStorage.getItem(STORAGE_KEY);
      const storedProvider = sessionStorage.getItem(
        STORAGE_PROVIDER_KEY
      ) as ProviderType | null;
      if (storedKey) setApiKey(storedKey);
      if (storedProvider && PROVIDERS.some((p) => p.id === storedProvider)) {
        setSelectedProvider(storedProvider);
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  // Persist key + provider to sessionStorage
  useEffect(() => {
    try {
      if (apiKey) {
        sessionStorage.setItem(STORAGE_KEY, apiKey);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
      sessionStorage.setItem(STORAGE_PROVIDER_KEY, selectedProvider);
    } catch {
      // sessionStorage unavailable
    }
  }, [apiKey, selectedProvider]);

  // Auto-use env key for Gemini
  useEffect(() => {
    if (GEMINI_API_KEY && selectedProvider === "gemini") {
      setIsDemoMode(false);
    }
  }, [selectedProvider]);

  const isConfigured = usingEnvKey || !!apiKey || isDemoMode;

  // Build the AI provider
  const aiProvider = useMemo<AIProvider>(() => {
    if (isDemoMode) {
      return demoAIProvider;
    }

    if (usingEnvKey && GEMINI_API_KEY) {
      return createGeminiProvider({ apiKey: GEMINI_API_KEY });
    }

    if (apiKey) {
      try {
        return createProviderFromKey(selectedProvider, apiKey);
      } catch (err) {
        toast({
          title: "Failed to create AI provider",
          description:
            err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        });
        return demoAIProvider;
      }
    }

    return demoAIProvider;
  }, [isDemoMode, usingEnvKey, apiKey, selectedProvider, toast]);

  const initialState = useMemo<EditorState>(() => {
    const container: ContainerNode = {
      id: "root",
      type: "container",
      children: createEmptyContent(),
      attributes: {},
    };
    return createInitialState(container);
  }, []);

  const handleProviderChange = useCallback((p: ProviderType) => {
    setSelectedProvider(p);
    setIsDemoMode(false);
  }, []);

  const handleApiKeyChange = useCallback((key: string) => {
    setApiKey(key);
    setIsDemoMode(false);
  }, []);

  const handleUseDemoMode = useCallback(() => {
    setApiKey("");
    setIsDemoMode(true);
  }, []);

  return (
    <DemoPageShell
      title="AI Integration"
      description='Type /ai followed by a prompt to generate content. Try: /ai Write a project update with bullet points'
      codeExample={CODE_EXAMPLE}
    >
      <APIKeyPanel
        provider={selectedProvider}
        apiKey={apiKey}
        isConfigured={isConfigured}
        usingEnvKey={usingEnvKey}
        onProviderChange={handleProviderChange}
        onApiKeyChange={handleApiKeyChange}
        onUseDemoMode={handleUseDemoMode}
      />

      <div className="flex-1 min-h-[600px] flex flex-col">
        <DynamicEditorProvider initialState={initialState}>
          <EditorWithAI aiProvider={aiProvider} />
        </DynamicEditorProvider>
      </div>
    </DemoPageShell>
  );
}
