import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { CodeBlock } from "../_components/CodeBlock";
import { NotesList } from "../_components/NotesList";
import { DxCard } from "../_components/DxCard";

export const sectionMeta = { id: "themes", num: "24", label: "Themes" };

const themePresets = [
  {
    tag: "preset",
    title: "notion",
    desc: "Clean, spacious layout with large headings and generous line-height — inspired by Notion",
  },
  {
    tag: "preset",
    title: "minimal",
    desc: "Zero decoration, tight spacing — useful as a base for fully custom designs",
  },
  {
    tag: "preset",
    title: "github",
    desc: "GitHub Markdown rendering style with monospace code blocks and bordered tables",
  },
];

export default function S24_Themes() {
  return (
    <section className="mb-20">
      <SectionHeading num="24" label="Themes" id="themes">
        Style the editor to match your product
      </SectionHeading>

      <p className="mb-8 text-sm font-light text-muted-foreground">
        Mina Editor ships with a base stylesheet and three ready-made theme presets. All visual tokens are CSS variables — override them to create fully custom themes.
      </p>

      <div className="space-y-10">

        {/* Base styles */}
        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Base styles</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Import the base stylesheet once at the root of your app. This sets up typography resets, block spacing, and selection highlight styles used by all themes.
          </p>
          <CodeBlock label="layout.tsx">{`import "@mina-editor/core/styles"`}</CodeBlock>
          <p className="mt-3 text-sm text-muted-foreground">
            If you installed via the shadcn registry, the styles are already included in your project under <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">src/components/editor/editor.css</code>.
          </p>
        </div>

        {/* Theme presets */}
        <div>
          <h3 className="mb-5 text-lg font-light text-foreground">Theme presets</h3>
          <div className="grid gap-px sm:grid-cols-3 border-t border-l border-border mb-6">
            {themePresets.map((t, i) => (
              <DxCard key={i} tag={t.tag} title={t.title} desc={t.desc} idx={i + 1} />
            ))}
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            Apply a preset by adding the theme class alongside the base <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">mina-editor</code> class on the wrapper element:
          </p>
          <CodeBlock label="usage.tsx">{`<div className="mina-editor theme-notion">
  <EditorProvider initialState={initialState}>
    <Editor />
  </EditorProvider>
</div>

{/* Other available presets */}
<div className="mina-editor theme-minimal"> ... </div>
<div className="mina-editor theme-github"> ... </div>`}</CodeBlock>
        </div>

        {/* CSS variables */}
        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Custom themes via CSS variables</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Every visual token is a CSS variable scoped to <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">.mina-editor</code>. Override them in your own stylesheet or in a Tailwind <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">@layer</code> block.
          </p>
          <CodeBlock label="theme.css">{`/* Apply to a custom class or override globally */
.mina-editor.theme-custom {
  /* Typography */
  --me-font-family: "Inter", sans-serif;
  --me-font-size-base: 15px;
  --me-line-height: 1.7;
  --me-letter-spacing: -0.01em;

  /* Headings */
  --me-heading-font-weight: 700;
  --me-h1-size: 2rem;
  --me-h2-size: 1.5rem;
  --me-h3-size: 1.25rem;

  /* Spacing */
  --me-block-spacing: 0.75rem;
  --me-paragraph-spacing: 1rem;

  /* Colors */
  --me-text: hsl(220 15% 10%);
  --me-muted: hsl(220 10% 50%);
  --me-selection-bg: hsl(210 100% 90%);
  --me-code-bg: hsl(220 13% 95%);
  --me-blockquote-border: hsl(220 13% 80%);

  /* Borders */
  --me-border-radius: 4px;
  --me-border-color: hsl(220 13% 88%);
}`}</CodeBlock>
          <p className="mt-3 text-sm text-muted-foreground">
            Then apply it the same way as a preset:
          </p>
          <CodeBlock label="usage.tsx">{`<div className="mina-editor theme-custom">
  <EditorProvider initialState={initialState}>
    <Editor />
  </EditorProvider>
</div>`}</CodeBlock>
        </div>

        {/* Dark mode */}
        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Dark mode</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            The editor respects the system-level <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">prefers-color-scheme</code> media query and the <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">dark</code> class set by <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">next-themes</code>. Override dark mode tokens by scoping them under <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">.dark .mina-editor</code>.
          </p>
          <CodeBlock label="theme.css">{`.dark .mina-editor.theme-custom {
  --me-text: hsl(220 15% 92%);
  --me-muted: hsl(220 10% 55%);
  --me-selection-bg: hsl(210 60% 30%);
  --me-code-bg: hsl(220 13% 14%);
  --me-blockquote-border: hsl(220 13% 30%);
  --me-border-color: hsl(220 13% 22%);
}`}</CodeBlock>
          <p className="mt-3 text-sm text-muted-foreground">
            Built-in presets already include dark mode definitions — no extra work required when using <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">theme-notion</code>, <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">theme-minimal</code>, or <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">theme-github</code>.
          </p>
        </div>

        {/* Tailwind integration */}
        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Tailwind CSS integration</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Theme variables map to Tailwind CSS custom properties when you define them in your <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">tailwind.config</code> <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">theme.extend</code> section. This lets you reference editor tokens throughout the rest of your UI.
          </p>
          <CodeBlock label="tailwind.config.ts">{`export default {
  theme: {
    extend: {
      colors: {
        "editor-text": "var(--me-text)",
        "editor-muted": "var(--me-muted)",
        "editor-border": "var(--me-border-color)",
      },
      fontFamily: {
        editor: "var(--me-font-family)",
      },
    },
  },
}`}</CodeBlock>
        </div>

        <NotesList items={[
          <>Import <strong className="text-foreground">@mina-editor/core/styles</strong> once at the app root before any theme class is applied.</>,
          <>All three presets include both <strong className="text-foreground">light and dark mode</strong> definitions — no manual dark override needed.</>,
          <>CSS variable overrides are isolated to <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">.mina-editor</code> — they do not leak into the rest of your app.</>,
          <>You can mix a preset with partial overrides: apply <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">theme-notion</code> and then override a handful of variables for fine-tuning.</>,
        ]} />
      </div>
    </section>
  );
}
