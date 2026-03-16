import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { DxCard } from "../_components/DxCard";
import { NotesList } from "../_components/NotesList";

export const sectionMeta = { id: "text-formatting", num: "07", label: "Text Formatting" };

export default function S07_TextFormatting() {
  const formats = [
    { tag: "inline", title: "Bold", desc: "Strong emphasis via Ctrl+B or toolbar toggle" },
    { tag: "inline", title: "Italic", desc: "Emphasis via Ctrl+I or toolbar toggle" },
    { tag: "inline", title: "Underline", desc: "Underline text via Ctrl+U or toolbar toggle" },
    { tag: "inline", title: "Strikethrough", desc: "Cross out text via Ctrl+Shift+S or toolbar" },
    { tag: "inline", title: "Inline Code", desc: "Monospace code span via Ctrl+E or toolbar" },
    { tag: "color", title: "Text Color", desc: "Apply custom colors to selected text via the color picker" },
    { tag: "size", title: "Font Size", desc: "Adjust font size on selected text via the size picker" },
    { tag: "class", title: "Custom Classes", desc: "Apply Tailwind CSS classes or custom classes with live preview" },
    { tag: "style", title: "Inline Styles", desc: "Direct CSS properties like width, height, and custom inline styles" },
    { tag: "type", title: "Element Type", desc: "Change selected text to a different block type (h1-h6, p, code, blockquote, list)" },
  ];

  return (
    <section className="mb-20">
      <SectionHeading num="07" label="Text Formatting" id="text-formatting">
        Rich formatting without the complexity
      </SectionHeading>
      <p className="mb-6 text-sm font-light text-muted-foreground">
        Select text to reveal the floating toolbar with all formatting options. Apply formats via keyboard shortcuts or toolbar buttons.
      </p>
      <div className="grid gap-px sm:grid-cols-2 border-t border-l border-border">
        {formats.map((f, i) => (
          <DxCard key={i} tag={f.tag} title={f.title} desc={f.desc} idx={i + 1} />
        ))}
      </div>

      <div className="mt-6">
        <NotesList items={[
          <>All formatting is applied via the <strong className="text-foreground">Selection Toolbar</strong> that appears when text is selected.</>,
          <>Format detection is automatic -- active formats are highlighted in the toolbar.</>,
          <>Custom classes support <strong className="text-foreground">Tailwind CSS</strong> utilities with a built-in class picker and live preview.</>,
        ]} />
      </div>
    </section>
  );
}
