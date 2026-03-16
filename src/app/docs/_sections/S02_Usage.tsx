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

      <CodeBlock label="App.tsx">{`import { EditorProvider, createInitialState } from "@/lib"
import { createEmptyContent } from "@/lib/empty-content"
import { Editor } from "@/components/Editor"

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
    </section>
  );
}
