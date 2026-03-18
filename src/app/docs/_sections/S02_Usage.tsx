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

      <CodeBlock label="App.tsx">{`"use client"

import { createEmptyContent, createInitialState, Editor, EditorProvider } from "@/components/ui/rich-editor"

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
          <>All imports come from <strong className="text-foreground">@/components/ui/rich-editor</strong> after installing via the shadcn registry.</>,
          <>The <strong className="text-foreground">EditorProvider</strong> sets up the Zustand store — all editor hooks must be used inside it.</>,
          <>Pass <strong className="text-foreground">readOnly</strong> to render content without editing capabilities — useful for display/preview pages.</>,
        ]} />
      </div>
    </section>
  );
}
