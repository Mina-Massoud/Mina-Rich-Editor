import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { CodeBlock } from "../_components/CodeBlock";
import { NotesList } from "../_components/NotesList";

export const sectionMeta = { id: "compact-editor", num: "06", label: "CompactEditor" };

export default function S19_CompactEditor() {
  return (
    <section className="mb-20">
      <SectionHeading num="06" label="CompactEditor" id="compact-editor">
        Self-contained editor variant
      </SectionHeading>
      <p className="mb-6 text-sm font-light text-muted-foreground">
        A lightweight editor that bundles the EditorProvider, Editor, and an inline toolbar into a single component. No wrapper needed.
      </p>

      <CodeBlock label="CommentBox.tsx">{`import { CompactEditor } from "@/components/CompactEditor"
import { createEmptyContent } from "@/lib/empty-content"

export default function CommentBox() {
  const initialContainer = {
    id: "root",
    type: "container",
    children: createEmptyContent(),
    attributes: {}
  }

  return (
    <CompactEditor
      initialContainer={initialContainer}
      onUploadImage={async (file) => {
        return URL.createObjectURL(file)
      }}
    />
  )
}`}</CodeBlock>

      <div className="mt-6">
        <NotesList items={[
          <>Accepts the same props as <strong className="text-foreground">Editor</strong> (readOnly, onUploadImage, notionBased) but does not require a separate EditorProvider wrapper.</>,
          <>Includes a <strong className="text-foreground">CompactToolbar</strong> with essential formatting controls built in.</>,
          <>Ideal for <strong className="text-foreground">comment boxes</strong>, inline editing fields, or any embedded use case where a full toolbar is too heavy.</>,
        ]} />
      </div>
    </section>
  );
}
