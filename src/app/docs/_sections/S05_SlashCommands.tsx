import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { DxCard } from "../_components/DxCard";

export const sectionMeta = { id: "slash-commands", num: "05", label: "Slash Commands" };

export default function S05_SlashCommands() {
  const commands = [
    { tag: "heading", title: "Heading 1", desc: "Big section heading" },
    { tag: "heading", title: "Heading 2", desc: "Medium section heading" },
    { tag: "heading", title: "Heading 3", desc: "Small section heading" },
    { tag: "heading", title: "Heading 4", desc: "Smaller heading level" },
    { tag: "heading", title: "Heading 5", desc: "Minor heading level" },
    { tag: "heading", title: "Heading 6", desc: "Smallest heading level" },
    { tag: "text", title: "Paragraph", desc: "Regular text paragraph" },
    { tag: "code", title: "Code Block", desc: "Preformatted code snippet" },
    { tag: "quote", title: "Quote", desc: "Block quote for citations" },
    { tag: "list", title: "Bulleted List", desc: "Unordered list item" },
    { tag: "list", title: "Numbered List", desc: "Ordered list item" },
    { tag: "media", title: "Image", desc: "Upload or embed an image" },
    { tag: "media", title: "Video", desc: "Upload or embed a video" },
    { tag: "data", title: "Table", desc: "Create a data table" },
  ];

  return (
    <section className="mb-20">
      <SectionHeading num="05" label="Slash Commands" id="slash-commands">
        Notion-style command menu
      </SectionHeading>
      <p className="mb-6 text-sm font-light text-warm-400">
        Type <code className="bg-surface-code text-warm-100 px-1.5 py-0.5 text-xs font-mono">/</code> in an empty block to open the command palette. Start typing to filter commands.
      </p>
      <div className="grid gap-px sm:grid-cols-2 border-t border-l border-border-subtle">
        {commands.map((c, i) => (
          <DxCard key={i} tag={c.tag} title={c.title} desc={c.desc} idx={i + 1} />
        ))}
      </div>
    </section>
  );
}
