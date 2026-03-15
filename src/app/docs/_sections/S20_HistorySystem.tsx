import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { NotesList } from "../_components/NotesList";

export const sectionMeta = { id: "history-system", num: "20", label: "History System" };

export default function S20_HistorySystem() {
  return (
    <section className="mb-20">
      <SectionHeading num="20" label="History System" id="history-system">
        Operation-based undo/redo
      </SectionHeading>
      <p className="mb-6 text-sm font-light text-warm-400">
        The editor tracks changes with an operation-based history system rather than full-state snapshots, keeping memory usage predictable and low.
      </p>

      <NotesList items={[
        <><strong className="text-warm-100">Operation-based</strong> -- only the delta is stored per undo entry, not a full copy of the document.</>,
        <><strong className="text-warm-100">Ctrl+Z</strong> to undo, <strong className="text-warm-100">Ctrl+Shift+Z</strong> or <strong className="text-warm-100">Ctrl+Y</strong> to redo.</>,
        <>History is capped at <strong className="text-warm-100">50 entries</strong> to keep memory usage bounded.</>,
        <>Consecutive typing in the same block is <strong className="text-warm-100">batched</strong> into a single undo entry for a natural editing feel.</>,
        <>Multiple related changes (e.g., splitting a block) are grouped into a single <strong className="text-warm-100">batch operation</strong>.</>,
        <>The redo stack is cleared when a new action is performed after undoing.</>,
      ]} />
    </section>
  );
}
