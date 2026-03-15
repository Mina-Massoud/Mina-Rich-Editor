import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { NotesList } from "../_components/NotesList";

export const sectionMeta = { id: "toolbars", num: "08", label: "Toolbars" };

export default function S08_Toolbars() {
  return (
    <section className="mb-20">
      <SectionHeading num="08" label="Toolbars" id="toolbars">
        Context-aware editing controls
      </SectionHeading>

      <div className="space-y-8">
        <div>
          <h3 className="mb-3 text-xl font-light text-warm-100">Selection Toolbar</h3>
          <p className="mb-4 text-sm font-light text-warm-400">
            A floating toolbar that appears when text is selected. It provides context-aware formatting options based on the current selection.
          </p>
          <NotesList items={[
            <><strong className="text-warm-100">Format toggles</strong> -- Bold, Italic, Underline, Strikethrough, Inline Code with active state detection.</>,
            <><strong className="text-warm-100">Element type selector</strong> -- Convert selected block to any heading level (h1-h6), paragraph, code, blockquote, or list.</>,
            <><strong className="text-warm-100">Color picker</strong> -- Apply custom text colors with a visual palette.</>,
            <><strong className="text-warm-100">Font size picker</strong> -- Adjust the size of selected text.</>,
            <><strong className="text-warm-100">Link popover</strong> -- Add, edit, or remove hyperlinks from selected text.</>,
            <><strong className="text-warm-100">Custom class popover</strong> -- Browse and apply Tailwind CSS or custom classes with live preview.</>,
            <><strong className="text-warm-100">AI sparkles button</strong> -- Opens the AI selection menu for AI-powered text transformations (when AI provider is configured).</>,
          ]} />
        </div>

        <div>
          <h3 className="mb-3 text-xl font-light text-warm-100">Editor Toolbar</h3>
          <p className="mb-4 text-sm font-light text-warm-400">
            The top toolbar provides document-level actions for inserting content and managing the editor.
          </p>
          <NotesList items={[
            <><strong className="text-warm-100">Media upload popover</strong> -- Insert single images, multiple images, or videos from your device.</>,
            <><strong className="text-warm-100">Insert components</strong> -- Add free-positioned images or custom components via the insert modal.</>,
            <><strong className="text-warm-100">List buttons</strong> -- Create unordered or ordered lists with a single click.</>,
            <><strong className="text-warm-100">Table builder</strong> -- Create tables with custom row and column counts.</>,
          ]} />
        </div>

        <div>
          <h3 className="mb-3 text-xl font-light text-warm-100">Compact Toolbar</h3>
          <p className="mb-4 text-sm font-light text-warm-400">
            A lightweight inline toolbar used by the CompactEditor variant. Provides essential formatting options in a minimal footprint -- ideal for comment boxes and embedded editing.
          </p>
        </div>
      </div>
    </section>
  );
}
