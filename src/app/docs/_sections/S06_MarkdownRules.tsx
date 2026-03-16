import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { ShortcutRow } from "../_components/ShortcutRow";

export const sectionMeta = { id: "markdown-rules", num: "11", label: "Markdown Rules" };

export default function S06_MarkdownRules() {
  const blockRules = [
    { shortcut: "# + Space", action: "Heading 1" },
    { shortcut: "## + Space", action: "Heading 2" },
    { shortcut: "### + Space", action: "Heading 3" },
    { shortcut: "#### + Space", action: "Heading 4" },
    { shortcut: "##### + Space", action: "Heading 5" },
    { shortcut: "###### + Space", action: "Heading 6" },
    { shortcut: "> + Space", action: "Blockquote" },
    { shortcut: "- + Space", action: "Bulleted list" },
    { shortcut: "* + Space", action: "Bulleted list" },
    { shortcut: "1. + Space", action: "Numbered list" },
    { shortcut: "---", action: "Horizontal rule" },
    { shortcut: "***", action: "Horizontal rule" },
    { shortcut: "___", action: "Horizontal rule" },
    { shortcut: "```", action: "Code block" },
  ];

  const inlineRules = [
    { shortcut: "**text**", action: "Bold" },
    { shortcut: "*text*", action: "Italic" },
    { shortcut: "`text`", action: "Inline code" },
    { shortcut: "~~text~~", action: "Strikethrough" },
  ];

  return (
    <section className="mb-20">
      <SectionHeading num="11" label="Markdown Rules" id="markdown-rules">
        Type Markdown, get rich text
      </SectionHeading>
      <p className="mb-6 text-sm font-light text-muted-foreground">
        The editor automatically converts Markdown syntax as you type. No mode switching required.
      </p>

      <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Block-level rules</h3>
          <div className="border border-border bg-muted overflow-hidden divide-y divide-border">
            {blockRules.map((r, i) => <ShortcutRow key={i} {...r} />)}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Inline rules</h3>
          <div className="border border-border bg-muted overflow-hidden divide-y divide-border">
            {inlineRules.map((r, i) => <ShortcutRow key={i} {...r} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
