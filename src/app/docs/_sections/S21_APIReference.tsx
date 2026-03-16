import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { APITable } from "../_components/APITable";

export const sectionMeta = { id: "api-reference", num: "21", label: "API Reference" };

export default function S21_APIReference() {
  return (
    <section className="mb-20">
      <SectionHeading num="21" label="API Reference" id="api-reference">
        Component props and configuration
      </SectionHeading>

      <div className="space-y-8">
        <div>
          <h3 className="mb-3 text-xl font-light text-foreground">EditorProvider</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Wraps your editor and provides the Zustand store context for all editor operations.
          </p>
          <APITable
            headers={["Prop", "Type", "Default", "Description"]}
            rows={[
              ["initialContainer", "ContainerNode", "-", "Initial content structure (alternative to initialState)"],
              ["initialState", "EditorState", "-", "Complete initial state including history and metadata"],
              ["onChange", "(state: EditorState) => void", "-", "Callback fired on every state change"],
              ["debug", "boolean", "false", "Enable debug logging to console"],
              ["children", "ReactNode", "-", "Editor components to render"],
            ]}
          />
        </div>

        <div>
          <h3 className="mb-3 text-xl font-light text-foreground">Editor</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            The main editor component that renders the editing interface.
          </p>
          <APITable
            headers={["Prop", "Type", "Default", "Description"]}
            rows={[
              ["readOnly", "boolean", "false", "View-only mode -- renders content without editing capabilities"],
              ["onUploadImage", "(file: File) => Promise<string>", "-", "Custom image upload handler -- return the uploaded URL"],
              ["notionBased", "boolean", "true", "Enable Notion-style features (cover image, first header spacing)"],
              ["onNotionBasedChange", "(v: boolean) => void", "-", "Callback when Notion mode is toggled"],
            ]}
          />
        </div>

        <div>
          <h3 className="mb-3 text-xl font-light text-foreground">CompactEditor</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Self-contained editor with built-in provider and inline toolbar.
          </p>
          <APITable
            headers={["Prop", "Type", "Default", "Description"]}
            rows={[
              ["initialContainer", "ContainerNode", "-", "Initial content structure"],
              ["readOnly", "boolean", "false", "View-only mode"],
              ["onUploadImage", "(file: File) => Promise<string>", "-", "Custom image upload handler"],
              ["onChange", "(state: EditorState) => void", "-", "Callback on state changes"],
            ]}
          />
        </div>
      </div>
    </section>
  );
}
