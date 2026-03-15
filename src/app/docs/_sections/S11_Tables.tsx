import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { NotesList } from "../_components/NotesList";

export const sectionMeta = { id: "tables", num: "11", label: "Tables" };

export default function S11_Tables() {
  return (
    <section className="mb-20">
      <SectionHeading num="11" label="Tables" id="tables">
        Advanced table editing
      </SectionHeading>
      <p className="mb-6 text-sm font-light text-warm-400">
        Create tables via the toolbar button or the <code className="bg-surface-code text-warm-100 px-1 py-0.5 text-xs font-mono">/table</code> slash command. Specify the number of rows and columns in the creation dialog.
      </p>

      <NotesList items={[
        <><strong className="text-warm-100">Create</strong> -- toolbar button or slash command with a row/column picker dialog.</>,
        <><strong className="text-warm-100">Import from Markdown</strong> -- paste Markdown table syntax and it converts automatically to an editor table.</>,
        <><strong className="text-warm-100">Add/remove rows</strong> -- insert or delete rows from the table.</>,
        <><strong className="text-warm-100">Add/remove columns</strong> -- insert or delete columns from the table.</>,
        <><strong className="text-warm-100">Resize columns</strong> -- drag column borders to manually adjust widths.</>,
        <><strong className="text-warm-100">Reorder</strong> -- drag rows or columns to rearrange the table structure.</>,
        <><strong className="text-warm-100">Cell editing</strong> -- click any cell to edit its content directly.</>,
      ]} />
    </section>
  );
}
