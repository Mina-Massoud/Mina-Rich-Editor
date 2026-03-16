import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { CodeBlock } from "../_components/CodeBlock";
import { APITable } from "../_components/APITable";

export const sectionMeta = { id: "editor-api", num: "19", label: "useEditorAPI" };

export default function S17_UseEditorAPI() {
  return (
    <section className="mb-20">
      <SectionHeading num="19" label="useEditorAPI" id="editor-api">
        High-level programmatic control
      </SectionHeading>
      <p className="mb-6 text-sm font-light text-muted-foreground">
        A hook that provides non-reactive getter functions for reading and writing editor content without dispatching low-level actions.
      </p>

      <CodeBlock label="Toolbar.tsx">{`import { useEditorAPI } from "@/hooks/useEditorAPI"

function Toolbar() {
  const api = useEditorAPI()

  const handleSave = () => {
    const html = api.getHTML()
    const md   = api.getMarkdown()
    const json = api.getJSON()
    const text = api.getPlainText()
    saveToDB({ html, md, json, text })
  }

  const handleClear = () => api.clear()

  const handleLoad = (content) => {
    api.setContent(content)
  }

  return (
    <>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleClear}>Clear</button>
    </>
  )
}`}</CodeBlock>

      <APITable
        className="mt-6"
        headers={["Method", "Returns", "Description"]}
        rows={[
          ["getJSON()", "ContainerNode", "Get the raw node tree as JSON"],
          ["getHTML()", "string", "Serialize content to HTML"],
          ["getMarkdown()", "string", "Serialize content to Markdown"],
          ["getPlainText()", "string", "Get content as plain text"],
          ["setContent(container)", "void", "Replace entire editor content"],
          ["insertBlock(node)", "void", "Insert a block at the current cursor position"],
          ["clear()", "void", "Clear all editor content"],
        ]}
      />
    </section>
  );
}
