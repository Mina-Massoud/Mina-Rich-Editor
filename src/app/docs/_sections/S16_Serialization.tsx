import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { CodeBlock } from "../_components/CodeBlock";

export const sectionMeta = { id: "serialization", num: "17", label: "Serialization" };

export default function S16_Serialization() {
  return (
    <section className="mb-20">
      <SectionHeading num="17" label="Serialization" id="serialization">
        Export to any format
      </SectionHeading>
      <p className="mb-6 text-sm font-light text-muted-foreground">
        Convert editor content to and from five different formats. All serializers work with the editor{"'"}s native node tree.
      </p>

      <div className="space-y-8">
        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Semantic HTML</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Clean, semantic HTML without Tailwind utilities -- suitable for emails, CMS storage, or SSR.
          </p>
          <CodeBlock label="semantic-html.ts">{`import { serializeToSemanticHtml } from "@/lib/utils/serialize-semantic-html"
import { useContainer } from "@/lib"

const container = useContainer()
const html = serializeToSemanticHtml(container)
// => <h1>Title</h1><p>Clean paragraph...</p>`}</CodeBlock>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">HTML</h3>
          <CodeBlock label="html.ts">{`import { serializeToHtml } from "@/lib"
import { useContainer } from "@/lib"

const container = useContainer()
const html = serializeToHtml(container)`}</CodeBlock>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Markdown</h3>
          <CodeBlock label="markdown.ts">{`import { serializeToMarkdown } from "@/lib/utils/serialize-markdown"
import { useContainer } from "@/lib"

const container = useContainer()
const md = serializeToMarkdown(container)
// => # Title\n\nClean paragraph...`}</CodeBlock>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Parse Markdown to nodes</h3>
          <CodeBlock label="parse-md.ts">{`import { parseMarkdownToNodes } from "@/lib/utils/parse-markdown"

const nodes = parseMarkdownToNodes("# Hello\\n\\nA paragraph.")
// Use nodes as children in your initial container`}</CodeBlock>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Parse HTML to nodes</h3>
          <CodeBlock label="parse-html.ts">{`import { htmlToNodes } from "@/lib/utils/html-to-nodes"

const nodes = htmlToNodes("<h1>Hello</h1><p>World</p>")
// Use nodes as children in your initial container`}</CodeBlock>
        </div>
      </div>
    </section>
  );
}
