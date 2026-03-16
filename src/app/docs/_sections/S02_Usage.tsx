import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { CodeBlock } from "../_components/CodeBlock";
import { NotesList } from "../_components/NotesList";

export const sectionMeta = { id: "usage", num: "02", label: "Usage" };

export default function S02_Usage() {
  return (
    <section className="mb-20">
      <SectionHeading num="02" label="Usage" id="usage">
        Three lines. Working editor.
      </SectionHeading>

      <CodeBlock label="App.tsx">{`import { EditorProvider, createInitialState } from "@mina-editor/core"
import { createEmptyContent } from "@mina-editor/core"
import { Editor } from "@mina-editor/core"

export default function MyEditor() {
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
}`}</CodeBlock>

      <div className="mt-6 mb-8 border border-border bg-muted p-4">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Note — shadcn registry install</p>
        <p className="text-sm text-muted-foreground">
          If you installed via the <code className="bg-background text-foreground px-1.5 py-0.5 text-xs font-mono">shadcn</code> registry, use relative import paths instead:
        </p>
        <div className="mt-3">
          <CodeBlock label="App.tsx (shadcn install)">{`import { EditorProvider, createInitialState } from "@/components/editor"
import { createEmptyContent } from "@/components/editor"
import { Editor } from "@/components/editor"`}</CodeBlock>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">With custom image upload</h3>
          <CodeBlock label="App.tsx">{`<EditorProvider initialState={initialState}>
  <Editor
    onUploadImage={async (file) => {
      const formData = new FormData()
      formData.append("image", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const { url } = await res.json()
      return url
    }}
  />
</EditorProvider>`}</CodeBlock>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Read-only mode</h3>
          <CodeBlock label="Viewer.tsx">{`<EditorProvider initialState={savedState}>
  <Editor readOnly />
</EditorProvider>`}</CodeBlock>
        </div>
      </div>

      <div className="mt-8">
        <NotesList items={[
          <>All imports come from <strong className="text-foreground">@mina-editor/core</strong> when installed via npm. Shadcn registry installs use relative paths from your components directory.</>,
          <>The <strong className="text-foreground">EditorProvider</strong> sets up the Zustand store — all editor hooks must be used inside it.</>,
          <>Pass <strong className="text-foreground">readOnly</strong> to render content without editing capabilities — useful for display/preview pages.</>,
        ]} />
      </div>
    </section>
  );
}
