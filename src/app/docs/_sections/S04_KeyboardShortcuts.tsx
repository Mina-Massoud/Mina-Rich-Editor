import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { ShortcutRow } from "../_components/ShortcutRow";

export const sectionMeta = { id: "keyboard-shortcuts", num: "10", label: "Keyboard Shortcuts" };

export default function S04_KeyboardShortcuts() {
  const formatting = [
    { shortcut: "Ctrl/Cmd + B", action: "Toggle bold" },
    { shortcut: "Ctrl/Cmd + I", action: "Toggle italic" },
    { shortcut: "Ctrl/Cmd + U", action: "Toggle underline" },
    { shortcut: "Ctrl/Cmd + Shift + S", action: "Toggle strikethrough" },
    { shortcut: "Ctrl/Cmd + E", action: "Toggle inline code" },
  ];

  const editing = [
    { shortcut: "Ctrl/Cmd + Z", action: "Undo" },
    { shortcut: "Ctrl/Cmd + Y", action: "Redo" },
    { shortcut: "Ctrl/Cmd + Shift + Z", action: "Redo (alternative)" },
    { shortcut: "Ctrl/Cmd + K", action: "Insert link" },
    { shortcut: "Ctrl/Cmd + A", action: "Select all in current block" },
  ];

  const navigation = [
    { shortcut: "Enter", action: "Split block at cursor / new list item" },
    { shortcut: "Shift + Enter", action: "Create nested block or line break" },
    { shortcut: "Arrow Up", action: "Navigate to previous block" },
    { shortcut: "Arrow Down", action: "Navigate to next block" },
    { shortcut: "Backspace / Delete", action: "Delete block when empty" },
    { shortcut: "Tab", action: "Indent list item" },
    { shortcut: "Shift + Tab", action: "Outdent list item" },
  ];

  const selection = [
    { shortcut: "Ctrl + Click", action: "Multi-select images" },
  ];

  return (
    <section className="mb-20">
      <SectionHeading num="10" label="Keyboard Shortcuts" id="keyboard-shortcuts">
        Full keyboard control
      </SectionHeading>

      <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Formatting</h3>
          <div className="border border-border bg-muted overflow-hidden divide-y divide-border">
            {formatting.map((s, i) => <ShortcutRow key={i} {...s} />)}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Editing</h3>
          <div className="border border-border bg-muted overflow-hidden divide-y divide-border">
            {editing.map((s, i) => <ShortcutRow key={i} {...s} />)}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Navigation</h3>
          <div className="border border-border bg-muted overflow-hidden divide-y divide-border">
            {navigation.map((s, i) => <ShortcutRow key={i} {...s} />)}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Selection</h3>
          <div className="border border-border bg-muted overflow-hidden divide-y divide-border">
            {selection.map((s, i) => <ShortcutRow key={i} {...s} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
