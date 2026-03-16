import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { NotesList } from "../_components/NotesList";

export const sectionMeta = { id: "drag-and-drop", num: "12", label: "Drag and Drop" };

export default function S09_DragAndDrop() {
  return (
    <section className="mb-20">
      <SectionHeading num="12" label="Drag and Drop" id="drag-and-drop">
        Rearrange content naturally
      </SectionHeading>
      <p className="mb-6 text-sm font-light text-muted-foreground">
        Every block has a drag handle that appears on hover. Grab it to reorder blocks within the editor.
      </p>

      <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Block reordering</h3>
          <NotesList items={[
            <><strong className="text-foreground">Drag handle</strong> -- appears on the left side of each block on hover. Grab it to start dragging.</>,
            <><strong className="text-foreground">Drop indicators</strong> -- horizontal lines show where the block will land (before or after target).</>,
            <><strong className="text-foreground">Auto-scroll</strong> -- the editor automatically scrolls when you drag near the top or bottom edge of the viewport.</>,
          ]} />
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Image grouping</h3>
          <NotesList items={[
            <><strong className="text-foreground">Side-by-side layout</strong> -- drop an image to the left or right of another image to create a flex container.</>,
            <><strong className="text-foreground">Group controls</strong> -- grouped images get a toolbar with reverse order and extract (ungroup) buttons.</>,
            <><strong className="text-foreground">Flex containers</strong> -- images in a group are wrapped in a flex container for responsive side-by-side display.</>,
          ]} />
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Touch support</h3>
          <p className="text-sm font-light text-muted-foreground">
            On tablets, drag icons are visible by default (no hover required). Touch-based drag and drop works with the same visual feedback as desktop.
          </p>
        </div>
      </div>
    </section>
  );
}
