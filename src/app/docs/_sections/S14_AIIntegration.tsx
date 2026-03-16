import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { CodeBlock } from "../_components/CodeBlock";
import { NotesList } from "../_components/NotesList";
import { DxCard } from "../_components/DxCard";

export const sectionMeta = { id: "ai-integration", num: "03", label: "AI Integration" };

export default function S14_AIIntegration() {
  const presets = [
    { tag: "transform", title: "Rephrase", desc: "Rephrase selected text while keeping the original meaning" },
    { tag: "fix", title: "Fix Grammar", desc: "Correct grammar and spelling errors automatically" },
    { tag: "shorten", title: "Make Shorter", desc: "Condense text while preserving the key message" },
    { tag: "expand", title: "Make Longer", desc: "Expand text with additional detail and context" },
    { tag: "tone", title: "Professional", desc: "Rewrite in a formal, professional tone" },
    { tag: "tone", title: "Casual", desc: "Rewrite in a casual, friendly tone" },
    { tag: "style", title: "Emphasize Key Words", desc: "Add bold to the most important words and phrases" },
    { tag: "style", title: "Add Emphasis", desc: "Add bold and italic to emphasize key concepts" },
    { tag: "style", title: "Code Terms", desc: "Wrap technical terms and function names in inline code" },
  ];

  return (
    <section className="mb-20">
      <SectionHeading num="03" label="AI Integration" id="ai-integration">
        Built-in AI text editing
      </SectionHeading>
      <p className="mb-6 text-sm font-light text-muted-foreground">
        Bring your own API key (BYOK) -- no vendor lock-in, no paid proxy. Requests go directly to your provider.
      </p>

      <div className="space-y-8">
        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Provider setup</h3>
          <CodeBlock label="ai-provider.ts">{`import {
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
})`}</CodeBlock>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">useEditorAI hook</h3>
          <CodeBlock label="MyEditor.tsx">{`import { useEditorAI } from "@/hooks/useEditorAI"

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
}`}</CodeBlock>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">AI selection presets</h3>
          <p className="mb-4 text-sm font-light text-muted-foreground">
            Select text and click the AI sparkles button in the selection toolbar. Nine built-in presets (6 rewrite + 3 style) plus custom prompts.
          </p>
          <div className="grid gap-px sm:grid-cols-2 border-t border-l border-border">
            {presets.map((p, i) => (
              <DxCard key={i} tag={p.tag} title={p.title} desc={p.desc} idx={i + 1} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">AI Styling</h3>
          <p className="mb-4 text-sm font-light text-muted-foreground">
            Style presets return markdown-formatted text that gets parsed into rich InlineText[] and applied to the editor with proper bold, italic, code, and strikethrough formatting. Use the <code className="text-xs bg-muted px-1 py-0.5 rounded">styled</code> option to enable this mode.
          </p>
          <CodeBlock label="styled-ai.ts">{`const { replaceSelectionWithAI } = useEditorAI({ provider })

// Styled mode — AI returns markdown, parsed into InlineText[]
const { text, children } = await replaceSelectionWithAI(
  "Add **bold** to the most important words",
  selection,
  { styled: true }
)

// Apply rich formatted text to the editor
dispatch(EditorActions.replaceSelectionWithInlines(
  selection.nodeId, selection.start, selection.end, children
))`}</CodeBlock>
        </div>

        <NotesList items={[
          <><strong className="text-foreground">BYOK</strong> -- you supply your own API key. Requests go directly to the provider with no intermediary.</>,
          <><strong className="text-foreground">No vendor lock-in</strong> -- swap providers by changing one line of code.</>,
          <><strong className="text-foreground">Streaming</strong> -- AI-generated content appears token-by-token in the editor for real-time feedback.</>,
          <><strong className="text-foreground">Custom prompts</strong> -- write any prompt for arbitrary AI text transformations beyond the six presets.</>,
        ]} />
      </div>
    </section>
  );
}
