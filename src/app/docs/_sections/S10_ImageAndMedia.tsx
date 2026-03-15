import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { NotesList } from "../_components/NotesList";
import { CodeBlock } from "../_components/CodeBlock";

export const sectionMeta = { id: "image-and-media", num: "10", label: "Image and Media" };

export default function S10_ImageAndMedia() {
  return (
    <section className="mb-20">
      <SectionHeading num="10" label="Image and Media" id="image-and-media">
        Full media management
      </SectionHeading>

      <div className="space-y-8">
        <div>
          <h3 className="mb-3 text-lg font-light text-warm-100">Adding media</h3>
          <NotesList items={[
            <><strong className="text-warm-100">Toolbar upload</strong> -- click the media button in the editor toolbar to select images or videos from your device.</>,
            <><strong className="text-warm-100">Slash command</strong> -- type <code className="bg-surface-code text-warm-100 px-1 py-0.5 text-xs font-mono">/image</code> or <code className="bg-surface-code text-warm-100 px-1 py-0.5 text-xs font-mono">/video</code> to insert media blocks.</>,
            <><strong className="text-warm-100">Paste from clipboard</strong> -- paste images directly from your clipboard. The editor detects and handles media automatically.</>,
            <><strong className="text-warm-100">Drag from system</strong> -- drag files from your file manager directly into the editor.</>,
          ]} />
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-warm-100">Image operations</h3>
          <NotesList items={[
            <><strong className="text-warm-100">Multi-select</strong> -- hold Ctrl/Cmd and click multiple images to select them.</>,
            <><strong className="text-warm-100">Group into flex</strong> -- selected images can be grouped into a side-by-side flex container.</>,
            <><strong className="text-warm-100">Reverse order</strong> -- reverse the display order of grouped images.</>,
            <><strong className="text-warm-100">Extract from group</strong> -- pull an image out of a group back to the normal flow.</>,
            <><strong className="text-warm-100">Captions and alt text</strong> -- add descriptive text to images for accessibility.</>,
            <><strong className="text-warm-100">Free positioning</strong> -- insert absolutely-positioned images via the Insert Components modal.</>,
          ]} />
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-warm-100">Custom upload handler</h3>
          <CodeBlock label="Upload handler">{`<Editor
  onUploadImage={async (file: File) => {
    const formData = new FormData()
    formData.append("image", file)
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData
    })
    const { url } = await res.json()
    return url
  }}
/>`}</CodeBlock>
          <p className="mt-3 text-sm text-warm-400">
            Images are stored as base64 by default. Provide a custom upload handler for production use to avoid large document sizes.
          </p>
        </div>
      </div>
    </section>
  );
}
