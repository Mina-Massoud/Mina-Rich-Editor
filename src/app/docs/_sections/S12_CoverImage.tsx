import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { NotesList } from "../_components/NotesList";
import { CodeBlock } from "../_components/CodeBlock";

export const sectionMeta = { id: "cover-image", num: "15", label: "Cover Image" };

export default function S12_CoverImage() {
  return (
    <section className="mb-20">
      <SectionHeading num="15" label="Cover Image" id="cover-image">
        Notion-style document covers
      </SectionHeading>
      <p className="mb-6 text-sm font-light text-muted-foreground">
        Add a full-width cover image at the top of your document, similar to Notion. Requires <code className="bg-muted text-foreground px-1 py-0.5 text-xs font-mono">notionBased</code> mode to be enabled (it is by default).
      </p>

      <NotesList items={[
        <><strong className="text-foreground">Upload cover</strong> -- click the cover area to upload an image from your device.</>,
        <><strong className="text-foreground">Reposition</strong> -- drag the vertical slider (0-100%) to adjust the visible portion of the cover image.</>,
        <><strong className="text-foreground">Remove cover</strong> -- delete the cover image entirely.</>,
      ]} />

      <div className="mt-6">
        <h3 className="mb-3 text-lg font-light text-foreground">Programmatic control</h3>
        <CodeBlock label="Actions">{`import { EditorActions, useEditorDispatch } from "@/lib"

const dispatch = useEditorDispatch()

// Set cover image
dispatch(EditorActions.setCoverImage("/path/to/image.jpg"))

// Update position (0-100)
dispatch(EditorActions.updateCoverImagePosition(35))

// Remove cover
dispatch(EditorActions.removeCoverImage())`}</CodeBlock>
      </div>
    </section>
  );
}
