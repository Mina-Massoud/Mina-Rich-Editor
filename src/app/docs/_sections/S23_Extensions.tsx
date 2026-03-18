import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { CodeBlock } from "../_components/CodeBlock";
import { NotesList } from "../_components/NotesList";
import { DxCard } from "../_components/DxCard";

export const sectionMeta = { id: "extensions", num: "23", label: "Extensions" };

const starterKitExtensions = [
  { tag: "block", title: "Paragraph", desc: "Default block type — plain text paragraphs" },
  { tag: "block", title: "Heading", desc: "h1 through h6 with configurable levels" },
  { tag: "block", title: "BulletList", desc: "Unordered list with nested support" },
  { tag: "block", title: "OrderedList", desc: "Numbered list with nested support" },
  { tag: "block", title: "ListItem", desc: "Individual item inside bullet or ordered lists" },
  { tag: "block", title: "CodeBlock", desc: "Fenced code block with language detection" },
  { tag: "block", title: "Blockquote", desc: "Indented blockquote for callouts" },
  { tag: "block", title: "HorizontalRule", desc: "Thematic break / divider element" },
  { tag: "block", title: "Image", desc: "Image block with upload handler support" },
  { tag: "block", title: "Table", desc: "Full table with drag-to-resize columns and rows" },
  { tag: "inline", title: "Bold", desc: "Strong text — Ctrl+B" },
  { tag: "inline", title: "Italic", desc: "Emphasis text — Ctrl+I" },
  { tag: "inline", title: "Underline", desc: "Underlined text — Ctrl+U" },
  { tag: "inline", title: "Strike", desc: "Strikethrough text — Ctrl+Shift+S" },
  { tag: "inline", title: "Code", desc: "Inline code span — Ctrl+E" },
  { tag: "inline", title: "Link", desc: "Hyperlinks with popover edit UI" },
  { tag: "inline", title: "TextColor", desc: "Per-character color via color picker" },
  { tag: "inline", title: "FontSize", desc: "Per-character font size override" },
  { tag: "inline", title: "CustomClass", desc: "Tailwind or custom CSS class on selected text" },
  { tag: "feature", title: "History", desc: "Undo/redo stack — Ctrl+Z / Ctrl+Shift+Z" },
  { tag: "feature", title: "DragAndDrop", desc: "Drag handles and block reordering" },
  { tag: "feature", title: "SlashCommands", desc: "/ menu for inserting blocks" },
];

export default function S23_Extensions() {
  return (
    <section className="mb-20">
      <SectionHeading num="23" label="Extensions" id="extensions">
        Everything is an extension
      </SectionHeading>

      <p className="mb-8 text-sm font-light text-muted-foreground">
        Mina Editor is built on a modular extension system. Every block type, inline mark, keyboard shortcut, and input rule is an extension. You can add your own or override built-in behavior.
      </p>

      {/* Extension.create */}
      <div className="space-y-10">
        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Extension.create()</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Use <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">Extension.create()</code> for functional extensions that add behavior without introducing a new node type — keyboard shortcuts, input rules, or global commands.
          </p>
          <CodeBlock label="my-extension.ts">{`import { Extension } from "@/components/ui/rich-editor"

const MyExtension = Extension.create({
  name: "myExtension",

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-X": () => {
        // do something
        return true
      },
    }
  },

  addInputRules() {
    return [
      {
        find: /^---$/,
        handler: ({ commands }) => commands.setHorizontalRule(),
      },
    ]
  },
})`}</CodeBlock>
        </div>

        {/* Node.create */}
        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Node.create()</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Use <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">Node.create()</code> to define a new block type with its own rendering, schema, and commands.
          </p>
          <CodeBlock label="callout-node.ts">{`import { Node } from "@/components/ui/rich-editor"

const CalloutNode = Node.create({
  name: "callout",
  group: "block",
  content: "inline*",

  addAttributes() {
    return {
      type: { default: "info" }, // "info" | "warning" | "error"
    }
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { class: \`callout callout-\${HTMLAttributes.type}\`, ...HTMLAttributes }, 0]
  },

  addCommands() {
    return {
      setCallout: (type) => ({ commands }) =>
        commands.setNode("callout", { type }),
    }
  },
})`}</CodeBlock>
        </div>

        {/* Mark.create */}
        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Mark.create()</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Use <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">Mark.create()</code> to define inline formatting that wraps a range of text — like bold, a color, or a custom highlight.
          </p>
          <CodeBlock label="highlight-mark.ts">{`import { Mark } from "@/components/ui/rich-editor"

const Highlight = Mark.create({
  name: "highlight",

  addAttributes() {
    return {
      color: { default: "#FFFF00" },
    }
  },

  renderHTML({ HTMLAttributes }) {
    return ["mark", { style: \`background-color: \${HTMLAttributes.color}\` }, 0]
  },

  addCommands() {
    return {
      setHighlight: (color) => ({ commands }) =>
        commands.setMark("highlight", { color }),
      unsetHighlight: () => ({ commands }) =>
        commands.unsetMark("highlight"),
      toggleHighlight: (color) => ({ commands }) =>
        commands.toggleMark("highlight", { color }),
    }
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-H": () => this.editor.commands.toggleHighlight("#FFFF00"),
    }
  },
})`}</CodeBlock>
        </div>

        {/* CommandManager chaining */}
        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">CommandManager chaining</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Commands can be chained together using <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">editor.chain()</code>. The chain runs all commands in sequence and commits only when <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">.run()</code> is called.
          </p>
          <CodeBlock label="usage.tsx">{`import { useEditor } from "@/components/ui/rich-editor"

function FormatButton() {
  const editor = useEditor()

  return (
    <button
      onClick={() =>
        editor
          .chain()
          .focus()
          .toggleBold()
          .toggleItalic()
          .run()
      }
    >
      Bold + Italic
    </button>
  )
}`}</CodeBlock>
        </div>

        {/* addCommands, addKeyboardShortcuts, addInputRules */}
        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Extension APIs</h3>
          <div className="space-y-4">
            <CodeBlock label="addCommands">{`addCommands() {
  return {
    // Registers editor.commands.myCommand()
    myCommand: (arg) => ({ state, dispatch }) => {
      // modify state directly or use commands helpers
      return true
    },
  }
}`}</CodeBlock>
            <CodeBlock label="addKeyboardShortcuts">{`addKeyboardShortcuts() {
  return {
    // "Mod" maps to Cmd on macOS, Ctrl on Windows/Linux
    "Mod-Alt-C": () => this.editor.commands.setCodeBlock(),
    "Shift-Enter": () => this.editor.commands.addNewline(),
  }
}`}</CodeBlock>
            <CodeBlock label="addInputRules">{`addInputRules() {
  return [
    // Triggered when the pattern matches at the cursor position
    {
      find: /^> $/,
      handler: ({ commands }) => commands.setBlockquote(),
    },
    {
      find: /^\*\*([^*]+)\*\* $/,
      handler: ({ match, commands }) =>
        commands.insertContent({ type: "text", text: match[1], marks: [{ type: "bold" }] }),
    },
  ]
}`}</CodeBlock>
          </div>
        </div>

        {/* Full Callout example */}
        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Full example — Callout block</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            A complete custom block extension with attributes, rendering, commands, and a keyboard shortcut.
          </p>
          <CodeBlock label="callout.ts">{`import { Node, mergeAttributes } from "@/components/ui/rich-editor"

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      calloutType: {
        default: "info",
        parseHTML: (el) => el.getAttribute("data-type"),
        renderHTML: (attrs) => ({ "data-type": attrs.calloutType }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-callout": "", class: "callout" }),
      0,
    ]
  },

  addCommands() {
    return {
      setCallout:
        (calloutType = "info") =>
        ({ commands }) =>
          commands.wrapIn(this.name, { calloutType }),

      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    }
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-C": () => this.editor.commands.setCallout("info"),
    }
  },
})

// Register with EditorProvider:
// <EditorProvider extensions={[Callout]} ...>`}</CodeBlock>
        </div>

        {/* Full Highlight mark example */}
        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">Full example — Highlight mark</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            A complete custom inline mark extension with color attribute, toggle command, and keyboard shortcut.
          </p>
          <CodeBlock label="highlight.ts">{`import { Mark, mergeAttributes } from "@/components/ui/rich-editor"

export const Highlight = Mark.create({
  name: "highlight",

  addOptions() {
    return {
      defaultColor: "#FFF176",
    }
  },

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (el) => el.style.backgroundColor || null,
        renderHTML: (attrs) =>
          attrs.color ? { style: \`background-color: \${attrs.color}\` } : {},
      },
    }
  },

  parseHTML() {
    return [{ tag: "mark" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["mark", mergeAttributes(HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setHighlight:
        (color) =>
        ({ commands }) =>
          commands.setMark(this.name, { color: color ?? this.options.defaultColor }),

      unsetHighlight:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),

      toggleHighlight:
        (color) =>
        ({ commands }) =>
          commands.toggleMark(this.name, { color: color ?? this.options.defaultColor }),
    }
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-H": () =>
        this.editor.commands.toggleHighlight(this.options.defaultColor),
    }
  },
})

// Usage: editor.chain().focus().toggleHighlight("#FFFF00").run()`}</CodeBlock>
        </div>

        {/* StarterKit */}
        <div>
          <h3 className="mb-5 text-lg font-light text-foreground">StarterKit — built-in extensions</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">StarterKit</code> is a convenience bundle that includes all 22 built-in extensions. Passing your own <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">extensions</code> prop merges with the starter kit.
          </p>
          <div className="grid gap-px sm:grid-cols-2 border-t border-l border-border mb-6">
            {starterKitExtensions.map((ext, i) => (
              <DxCard key={i} tag={ext.tag} title={ext.title} desc={ext.desc} idx={i + 1} />
            ))}
          </div>
          <CodeBlock label="usage.tsx">{`import { EditorProvider, StarterKit } from "@/components/ui/rich-editor"
import { Callout } from "./callout"
import { Highlight } from "./highlight"

// Extends StarterKit with your custom extensions
<EditorProvider
  extensions={[
    ...StarterKit,
    Callout,
    Highlight,
  ]}
  initialState={initialState}
>
  <Editor />
</EditorProvider>`}</CodeBlock>
        </div>

        <NotesList items={[
          <>Extensions are plain objects — they are tree-shakeable and have zero runtime overhead when unused.</>,
          <><strong className="text-foreground">Node.create()</strong> for block-level elements, <strong className="text-foreground">Mark.create()</strong> for inline ranges, <strong className="text-foreground">Extension.create()</strong> for behavior-only additions.</>,
          <>Commands added via <strong className="text-foreground">addCommands()</strong> are automatically available on <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">editor.commands</code> and in <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">editor.chain()</code>.</>,
          <>Input rules are matched in real time as the user types — use them to implement markdown-style shortcuts.</>,
        ]} />
      </div>
    </section>
  );
}
