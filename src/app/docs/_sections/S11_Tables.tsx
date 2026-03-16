import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { NotesList } from "../_components/NotesList";

export const sectionMeta = { id: "tables", num: "14", label: "Tables" };

export default function S11_Tables() {
  return (
    <section className="mb-20">
      <SectionHeading num="14" label="Tables" id="tables">
        Advanced table editing
      </SectionHeading>
      <p className="mb-6 text-sm font-light text-muted-foreground">
        Create tables via the toolbar button or the <code className="bg-muted text-foreground px-1 py-0.5 text-xs font-mono">/table</code> slash command. Specify the number of rows and columns in the creation dialog.
      </p>

      <NotesList items={[
        <><strong className="text-foreground">Create</strong> -- toolbar button or slash command with a row/column picker dialog.</>,
        <><strong className="text-foreground">Import from Markdown</strong> -- paste Markdown table syntax and it converts automatically to an editor table.</>,
        <><strong className="text-foreground">Add/remove rows</strong> -- insert or delete rows from the table.</>,
        <><strong className="text-foreground">Add/remove columns</strong> -- insert or delete columns from the table.</>,
        <><strong className="text-foreground">Resize columns</strong> -- drag column borders to manually adjust widths.</>,
        <><strong className="text-foreground">Reorder</strong> -- drag rows or columns to rearrange the table structure.</>,
        <><strong className="text-foreground">Cell editing</strong> -- click any cell to edit its content directly.</>,
      ]} />
    </section>
  );
}
