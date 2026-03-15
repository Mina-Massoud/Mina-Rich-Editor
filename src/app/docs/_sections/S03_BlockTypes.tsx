import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { DxCard } from "../_components/DxCard";

export const sectionMeta = { id: "block-types", num: "03", label: "Block Types" };

export default function S03_BlockTypes() {
  const blocks = [
    { tag: "text", title: "Paragraph", desc: "Standard text block -- the default block type for regular content" },
    { tag: "heading", title: "Heading 1", desc: "Top-level heading for major sections. Supports Notion-style first-header spacing" },
    { tag: "heading", title: "Heading 2", desc: "Secondary heading for subsections within your document" },
    { tag: "heading", title: "Heading 3-6", desc: "Four additional heading levels for deep document hierarchy" },
    { tag: "code", title: "Code Block", desc: "Preformatted code with monospace rendering for technical content" },
    { tag: "quote", title: "Blockquote", desc: "Indented quote block for citations, callouts, or highlighted text" },
    { tag: "list", title: "Bulleted List", desc: "Unordered list items with automatic bullet markers" },
    { tag: "list", title: "Numbered List", desc: "Ordered list items with sequential numbering" },
    { tag: "media", title: "Image", desc: "Image block with captions, alt text, resize handles, and grouping" },
    { tag: "media", title: "Video", desc: "Embedded video player block with native playback controls" },
    { tag: "media", title: "Audio", desc: "Audio block for sound files with playback controls" },
    { tag: "layout", title: "Horizontal Rule", desc: "Visual separator between content sections" },
    { tag: "data", title: "Table", desc: "Full table with resizable columns, draggable rows, and cell editing" },
    { tag: "layout", title: "Container", desc: "Nested container for grouping blocks -- supports flex layout for side-by-side images" },
  ];

  return (
    <section className="mb-20">
      <SectionHeading num="03" label="Block Types" id="block-types">
        15 built-in block types
      </SectionHeading>
      <p className="mb-6 text-sm font-light text-warm-400">
        Every block is a typed node in the editor tree. Add blocks via the slash command menu, toolbar, or keyboard shortcuts.
      </p>
      <div className="grid gap-px sm:grid-cols-2 border-t border-l border-border-subtle">
        {blocks.map((b, i) => (
          <DxCard key={i} tag={b.tag} title={b.title} desc={b.desc} idx={i + 1} />
        ))}
      </div>
    </section>
  );
}
