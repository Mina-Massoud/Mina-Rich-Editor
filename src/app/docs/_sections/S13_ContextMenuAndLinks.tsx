import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { NotesList } from "../_components/NotesList";

export const sectionMeta = { id: "context-menu-links", num: "16", label: "Context Menu and Links" };

export default function S13_ContextMenuAndLinks() {
  return (
    <section className="mb-20">
      <SectionHeading num="16" label="Context Menu and Links" id="context-menu-links">
        Right-click actions and smart links
      </SectionHeading>

      <div className="space-y-8">
        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Block context menu</h3>
          <p className="mb-4 text-sm font-light text-muted-foreground">
            Right-click any block to open the context menu with block-level styling options.
          </p>
          <NotesList items={[
            <><strong className="text-foreground">Background color</strong> -- choose from theme-aware presets (light and dark mode variants) or pick a custom color.</>,
            <><strong className="text-foreground">Visual palette</strong> -- colors adapt to the current theme for consistent appearance.</>,
          ]} />
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Links</h3>
          <p className="mb-4 text-sm font-light text-muted-foreground">
            Add links to selected text via keyboard shortcut or the selection toolbar.
          </p>
          <NotesList items={[
            <><strong className="text-foreground">Ctrl/Cmd + K</strong> -- opens the link popover to add a URL to selected text.</>,
            <><strong className="text-foreground">Selection toolbar</strong> -- the link button in the floating toolbar opens the same popover.</>,
            <><strong className="text-foreground">Edit existing links</strong> -- click a linked text to open the popover and modify or remove the URL.</>,
            <><strong className="text-foreground">Auto protocol</strong> -- URLs without a protocol automatically get <code className="bg-muted text-foreground px-1 py-0.5 text-xs font-mono">https://</code> prepended.</>,
          ]} />
        </div>
      </div>
    </section>
  );
}
