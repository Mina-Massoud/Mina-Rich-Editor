# Building a TipTap-Inspired Extension System Without ProseMirror

*How we brought modular extensibility to Mina Rich Editor using familiar patterns, zero ProseMirror, and a block-first JSON document model.*

---

## 1. The Problem

Mina Rich Editor shipped with a hard truth: **zero extensibility**. Every block type, every inline format, every rendering decision was buried inside switch statements scattered across the codebase. Want to add a new block type? Hope you enjoy grep.

Here is what adding support for a new node type looked like. In `block-utils.ts`, the function that maps node types to CSS classes:

```typescript
// src/lib/handlers/block/block-utils.ts
export function getTypeClassName(type: string): string {
  switch (type) {
    case "h1":
      return "text-4xl font-bold text-foreground leading-[1.2] mb-2";
    case "h2":
      return "text-3xl font-bold text-foreground leading-[1.2] mb-1.5";
    case "h3":
      return "text-2xl font-bold text-foreground leading-[1.2] mb-1";
    case "p":
      return "text-base text-foreground leading-[1.6]";
    case "blockquote":
      return "text-base text-muted-foreground italic border-l-4 border-primary pl-6 py-1";
    case "code":
      return "font-mono text-sm bg-secondary text-secondary-foreground px-4 py-2 rounded-lg whitespace-pre-wrap break-words";
    // ... every type, one by one
    default:
      return "text-base text-foreground leading-[1.6]";
  }
}
```

And in `block-renderer.ts`, the function that decides what component to render:

```typescript
// src/lib/handlers/block/block-renderer.ts
export function getNodeRenderType(node: EditorNode):
  | "container" | "table" | "flex" | "nested-container"
  | "br" | "img" | "video" | "text"
{
  if (node.type === "br") return "br";
  if (node.type === "img") return "img";
  if (node.type === "video") return "video";
  if (isContainerNode(node)) {
    // ... nested container logic
  }
  return "text";
}
```

And over in `types.ts`, the union type that defines what node types even exist:

```typescript
export type NodeType =
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'p' | 'blockquote' | 'ol' | 'li' | 'code' | 'pre'
  | 'img' | 'video' | 'audio' | 'a' | 'span' | 'div'
  | 'hr' | 'br' | 'table' | 'thead' | 'tbody' | 'tr'
  | 'th' | 'td' | 'container' | 'text';
```

Adding a new block type like "callout" meant modifying **at minimum** five files: the NodeType union, the style switch, the renderer switch, the command menu, and the keyboard handler. Nothing was discoverable. Nothing was composable. If you wanted to build an app on top of Mina and add your own custom blocks, your only option was to fork the entire library.

This is the classic "framework that doesn't know it's a framework" problem. The editor worked, but it was a closed system.

---

## 2. Why Not Just Use TipTap Extensions?

The obvious question: TipTap already has a mature extension system. Why not adopt it?

Because TipTap extensions are not portable abstractions. They are ProseMirror API wrappers. Roughly 70-80% of what a TipTap extension does is configure ProseMirror internals that do not exist in Mina's architecture.

Here is the portability breakdown:

```
┌─────────────────────────────┬────────────────┬───────────────────────┐
│ TipTap Extension Feature    │ ProseMirror?   │ Portable to Mina?     │
├─────────────────────────────┼────────────────┼───────────────────────┤
│ Extension.create() pattern  │ No             │ YES — adopted         │
│ Node / Mark separation      │ Conceptual     │ YES — adopted         │
│ addKeyboardShortcuts()      │ No             │ YES — adopted         │
│ addInputRules()             │ Wraps PM rules │ Pattern YES, impl NO  │
│ addCommands()               │ Wraps PM tr    │ Pattern YES, impl NO  │
│ name / priority / options   │ No             │ YES — adopted         │
│ addStorage()                │ No             │ YES — adopted         │
│ Lifecycle hooks             │ No             │ YES — adopted         │
│ schema.spec (nodes/marks)   │ 100% PM        │ NO — Mina has no PM   │
│ addNodeView()               │ 100% PM        │ NO — Mina uses React  │
│ addProseMirrorPlugins()     │ 100% PM        │ NO — doesn't exist    │
│ Node.spec.toDOM / parseDOM  │ 100% PM        │ NO — different model  │
│ Transaction-based commands  │ 100% PM        │ NO — Mina uses Zustand│
│ Plugin state / metadata     │ 100% PM        │ NO — different model  │
│ Decorations                 │ 100% PM        │ NO — doesn't exist    │
└─────────────────────────────┴────────────────┴───────────────────────┘
```

The features in the "YES" column are what make TipTap's DX feel good: the factory pattern, the declarative config objects, the clean separation of concerns. Those are architecture decisions, not ProseMirror features. We took them.

The features in the "NO" column are the engine. ProseMirror's schema system enforces document structure through a formal grammar. Its transaction system provides atomic state updates with steps that can be rebased. Its plugin system allows arbitrary state machines to run alongside the document. None of this exists in Mina, and none of it should -- Mina's architecture is fundamentally different.

Mina uses:
- **A JSON document model** (`EditorNode` tree) instead of ProseMirror's schema-enforced document
- **Zustand** for state management instead of ProseMirror's transaction pipeline
- **React components** for rendering instead of ProseMirror's `toDOM` / NodeViews
- **`InlineText[]` arrays** for inline formatting instead of ProseMirror's mark objects on text nodes

Trying to shim TipTap extensions onto this architecture would produce a leaky abstraction that helps nobody. Instead, we built a native extension system that borrows TipTap's ergonomics and fits Mina's actual internals.

---

## 3. The Design Philosophy

The design follows a clear principle: **steal the interface, not the implementation**.

### What we borrowed from TipTap

- **The three-type pattern**: `Extension` for behavior, `Node` for block types, `Mark` for inline formatting. This is a genuinely good taxonomy.
- **The `.create()` factory**: A static method that takes a config object and returns a resolved instance. No class hierarchies, no `new` keyword, no inheritance.
- **Declarative hook methods**: `addCommands()`, `addKeyboardShortcuts()`, `addInputRules()`, `addOptions()`, `addStorage()`. Each returns a plain object or array. No imperative registration calls.
- **Lifecycle hooks**: `onCreate`, `onUpdate`, `onSelectionUpdate`, `onDestroy`. Same names, same purpose.
- **Priority ordering**: Numeric priority determines load order and conflict resolution.
- **Context injection**: Commands and hooks receive a context object with state access and dispatch capabilities.

### What we do differently

**Block-first, not schema-first.** TipTap/ProseMirror enforces a schema that defines which nodes can contain which other nodes, what attributes are valid, and how the document can be structured. Mina does not. An `EditorNode` is a JSON object with a `type` string, an optional `content`/`children`/`lines`, and an open-ended `attributes` bag. This is intentionally permissive -- validation happens at the application layer, not the editor layer.

**JSON-native document model.** The document is a tree of plain objects. No special node classes, no mark objects, no fragment wrappers. You can `JSON.stringify` the entire document and `JSON.parse` it back. This makes persistence, serialization, and collaboration straightforward.

**React rendering, not DOM manipulation.** TipTap ultimately renders through ProseMirror's `toDOM` functions or NodeView classes. Mina renders through React components. Node extensions can provide a `renderBlock` function that returns JSX, or they can provide CSS classes via `addStyles()` and let the default renderer handle it.

**InlineText property mapping for marks.** In ProseMirror, marks are abstract objects attached to text ranges. In Mina, inline formatting is represented as properties on `InlineText` objects:

```typescript
interface InlineText {
  content: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  href?: string;
  className?: string;
  styles?: Record<string, string>;
}
```

A mark extension in Mina declares which `InlineText` property it maps to via `inlineProperty`. This is a direct, explicit mapping -- no abstraction layer between the mark and the data model.

**Zustand dispatch, not ProseMirror transactions.** Commands dispatch actions through Mina's reducer, not ProseMirror's transaction system. There is no concept of "steps" or "rebasing." State changes are synchronous reducer actions. This is simpler but trades away some of ProseMirror's collaborative editing guarantees (Mina handles collaboration through Yjs bindings at a different layer).

---

## 4. Architecture Deep Dive

Here is how the pieces fit together:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           Application Code                                  │
│                                                                              │
│   const manager = new ExtensionManager();                                    │
│   manager.register(Paragraph, Heading, Bold, Italic, History, ...);          │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                      ExtensionManager                               │    │
│   │                                                                     │    │
│   │   nodeRegistry:     Map<string, ResolvedNodeExtension>              │    │
│   │   markRegistry:     Map<string, ResolvedMarkExtension>              │    │
│   │   commandRegistry:  Map<string, CommandFunction>                    │    │
│   │   shortcutRegistry: Map<string, ShortcutHandler>                    │    │
│   │   inputRules:       InputRule[]                                     │    │
│   │   slashCommands:    SlashCommand[]                                  │    │
│   │   storageMap:       Map<string, Record<string, any>>                │    │
│   │                                                                     │    │
│   │   register()  →  indexes all hooks into registries                  │    │
│   │   getNodeStyles(type)  →  CSS classes for rendering                 │    │
│   │   getShortcut(key)  →  handler for key combo                        │    │
│   │   matchInputRule(text)  →  pattern matching                         │    │
│   │   executeCommand(name)  →  run command with context                 │    │
│   │   onCreate / onUpdate / onDestroy  →  lifecycle dispatch            │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│   │  Extension    │  │  Node        │  │  Mark        │                      │
│   │  .create()    │  │  .create()   │  │  .create()   │                      │
│   │              │  │              │  │              │                      │
│   │  kind:       │  │  kind:       │  │  kind:       │                      │
│   │  'extension' │  │  'node'      │  │  'mark'      │                      │
│   │              │  │              │  │              │                      │
│   │  Commands    │  │  nodeType    │  │  markName    │                      │
│   │  Shortcuts   │  │  Styles      │  │  inlineProp  │                      │
│   │  InputRules  │  │  Renderer    │  │  parseHTML   │                      │
│   │  Lifecycle   │  │  parseHTML   │  │  renderHTML  │                      │
│   │              │  │  renderHTML  │  │  Shortcuts   │                      │
│   │              │  │  Shortcuts   │  │  Commands    │                      │
│   │              │  │  Commands    │  │              │                      │
│   └──────────────┘  └──────────────┘  └──────────────┘                      │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                         Mina Document Model                                  │
│                                                                              │
│   EditorNode (JSON tree)  ←→  Zustand Store  ←→  React Components           │
│   InlineText[]            ←→  Reducer Actions ←→  contentEditable           │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Extension.create()

Use `Extension.create()` for functionality that does not define a new block type or inline format. This is the right choice for:

- **History** (undo/redo commands and keyboard shortcuts)
- **Collaboration** (Yjs binding lifecycle)
- **AI integration** (streaming content generation commands)
- **Clipboard** (custom paste handling)
- **Search and replace** (commands + keyboard shortcut)

```typescript
const History = Extension.create({
  name: 'history',
  priority: 150, // Load before most extensions

  addStorage() {
    return { undoDepth: 0 };
  },

  addCommands() {
    return {
      undo: () => ({ dispatch, state, storage }) => {
        dispatch({ type: 'UNDO' });
        storage.undoDepth++;
        return true;
      },
      redo: () => ({ dispatch }) => {
        dispatch({ type: 'REDO' });
        return true;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-z': (ctx) => {
        ctx.dispatch({ type: 'UNDO' });
        return true;
      },
      'Mod-Shift-z': (ctx) => {
        ctx.dispatch({ type: 'REDO' });
        return true;
      },
    };
  },
});
```

The resolved type is `ResolvedExtension` with `kind: 'extension'`. The ExtensionManager will index its commands into the command registry and its shortcuts into the shortcut registry, but it will not create any node or mark registry entries.

### Node.create()

Use `Node.create()` for block-level elements. Every node extension declares which `nodeType` strings it handles (mapping directly to `EditorNode.type` in the document model):

```typescript
const Heading = Node.create({
  name: 'heading',
  nodeType: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  group: 'block',
  draggable: true,

  addStyles() {
    // This replaces the hardcoded switch case in getTypeClassName
    return 'font-bold text-foreground';
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-1': (ctx) => { ctx.dispatch({ type: 'CONVERT_NODE', nodeType: 'h1' }); return true; },
      'Mod-Alt-2': (ctx) => { ctx.dispatch({ type: 'CONVERT_NODE', nodeType: 'h2' }); return true; },
      'Mod-Alt-3': (ctx) => { ctx.dispatch({ type: 'CONVERT_NODE', nodeType: 'h3' }); return true; },
    };
  },

  addSlashCommands() {
    return [
      { label: 'Heading 1', description: 'Large heading', keywords: ['h1', 'title'],
        group: 'text', action: (ctx) => ctx.dispatch({ type: 'CONVERT_NODE', nodeType: 'h1' }) },
      { label: 'Heading 2', description: 'Medium heading', keywords: ['h2', 'subtitle'],
        group: 'text', action: (ctx) => ctx.dispatch({ type: 'CONVERT_NODE', nodeType: 'h2' }) },
    ];
  },

  addInputRules() {
    return [
      { find: /^# $/, handler: (match, ctx) => { ctx.dispatch({ type: 'CONVERT_NODE', nodeType: 'h1' }); return true; } },
      { find: /^## $/, handler: (match, ctx) => { ctx.dispatch({ type: 'CONVERT_NODE', nodeType: 'h2' }); return true; } },
      { find: /^### $/, handler: (match, ctx) => { ctx.dispatch({ type: 'CONVERT_NODE', nodeType: 'h3' }); return true; } },
    ];
  },

  parseHTML() {
    return [
      { tag: 'h1' }, { tag: 'h2' }, { tag: 'h3' },
      { tag: 'h4' }, { tag: 'h5' }, { tag: 'h6' },
    ];
  },

  renderHTML(node) {
    return `<${node.type}>${node.content || ''}</${node.type}>`;
  },
});
```

The key property is `nodeType`. It can be a single string or an array. When registered, the ExtensionManager creates a lookup entry for each type string, so `manager.getNodeStyles('h1')` and `manager.getNodeStyles('h3')` both resolve to this extension. One extension can own multiple node types.

The `addStyles()` method is the direct replacement for the old `getTypeClassName()` switch statement. Instead of a central function that knows about every type, each node extension declares its own CSS classes.

The optional `renderBlock` property allows a node extension to provide a full custom React component for rendering. If not provided, the default block renderer is used with the CSS classes from `addStyles()`.

### Mark.create()

Use `Mark.create()` for inline formatting. The critical concept is `inlineProperty` -- it declares which property on `InlineText` this mark controls:

```typescript
const Bold = Mark.create({
  name: 'bold',
  markName: 'bold',
  inlineProperty: 'bold',   // Maps to InlineText.bold

  parseHTML() {
    return [
      { tag: 'strong' },
      { tag: 'b' },
      { style: 'font-weight=bold' },
      { style: 'font-weight=700' },
    ];
  },

  renderHTML() {
    return '<strong>';
  },

  addKeyboardShortcuts() {
    return {
      'Mod-b': (ctx) => {
        ctx.dispatch({ type: 'TOGGLE_FORMAT', format: 'bold' });
        return true;
      },
    };
  },
});
```

The `inlineProperty` field is what makes Mina's mark system concrete rather than abstract. In ProseMirror, a "bold" mark is an object attached to a text range. In Mina, bold is literally `InlineText.bold = true`. The mark extension declares this mapping explicitly.

This means a mark extension for "link" would set `inlineProperty: 'href'`, because links in Mina's model are represented as `InlineText.href = 'https://...'`. A mark extension for custom highlighting would set `inlineProperty: 'className'` because it maps to the CSS class property.

### ExtensionManager

The `ExtensionManager` is the central registry. It does not manage state or rendering -- it is a pure index of capabilities. Its job is:

1. **Accept extensions** via `register()` (deduplicating by name)
2. **Sort by priority** (highest first)
3. **Index everything** into fast-lookup registries (nodes, marks, commands, shortcuts, input rules, slash commands)
4. **Provide lookup methods** for the editor core to query at runtime
5. **Dispatch lifecycle events** to all registered extensions

```typescript
const manager = new ExtensionManager();
manager.register(Paragraph, Heading, Bold, Italic, Link, History);

// The editor core can now ask questions:
manager.getNodeStyles('h1');           // → 'font-bold text-foreground'
manager.getShortcut('Mod-b');          // → ShortcutHandler function
manager.matchInputRule('# ', context); // → true (converts to h1)
manager.executeCommand('undo', ctx);   // → true
manager.getSlashCommands();            // → SlashCommand[]
```

The manager is designed to be instantiated once and passed to the editor. It is the bridge between the extension definitions (static config) and the editor runtime (dynamic behavior).

### Priority Ordering

Every extension has a numeric `priority` (default: 100). Higher priority means:

- **Loads first** in the sorted extensions array
- **Lifecycle hooks run first** (onCreate, onUpdate, etc.)
- **Input rules are checked first** (first match wins)
- **Last registered shortcut for a key wins** (since later registrations overwrite)

Typical priority ranges:

| Range   | Use case                              |
|---------|---------------------------------------|
| 200+    | Core system extensions (History)      |
| 100-199 | Built-in block/mark types             |
| 50-99   | Community/third-party extensions      |
| 1-49    | Application-specific overrides        |

### Storage and Lifecycle Hooks

Each extension gets its own mutable `storage` object, initialized by `addStorage()`. This is the only mutable state an extension owns. The storage persists for the lifetime of the extension and is passed to lifecycle hooks:

```typescript
const WordCounter = Extension.create({
  name: 'word-counter',

  addStorage() {
    return { wordCount: 0, charCount: 0 };
  },

  onUpdate({ state, storage }) {
    // Recalculate on every document change
    const text = getDocumentText(state);
    storage.wordCount = text.split(/\s+/).filter(Boolean).length;
    storage.charCount = text.length;
  },
});

// Later, read from storage:
const storage = manager.getStorage('word-counter');
console.log(storage?.wordCount); // 42
```

Lifecycle hooks fire in priority order:

- **`onCreate`**: Called once after the manager is initialized and the editor mounts
- **`onUpdate`**: Called after every document state change
- **`onSelectionUpdate`**: Called when the text selection changes
- **`onDestroy`**: Called when the editor unmounts

---

## 5. Building Your First Extension

Let's build real extensions, step by step.

### A Custom "Callout" Node Extension

A callout is a colored box with an icon and text, like the tip/warning/info blocks in documentation sites.

```typescript
import { Node } from "@/components/ui/rich-editor";
import type { BlockRenderProps } from "@/components/ui/rich-editor";

const Callout = Node.create({
  name: 'callout',
  nodeType: 'callout',    // This is a NEW type, not in the original NodeType union
  group: 'block',
  draggable: true,

  addOptions() {
    return {
      types: ['info', 'warning', 'success', 'error'],
      defaultType: 'info',
    };
  },

  addStyles() {
    return 'rounded-lg border p-4 my-2';
  },

  // Custom React renderer for this block type
  renderBlock({ node, isActive, isReadOnly, onUpdate }: BlockRenderProps) {
    const calloutType = node.attributes?.calloutType as string || 'info';
    const icons = { info: 'i', warning: '!', success: '✓', error: '✕' };
    const colors = {
      info: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
      warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
      success: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
      error: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
    };

    return (
      <div className={`rounded-lg border p-4 my-2 flex gap-3 ${colors[calloutType] || colors.info}`}>
        <span className="text-lg font-bold">{icons[calloutType] || icons.info}</span>
        <div
          contentEditable={!isReadOnly}
          suppressContentEditableWarning
          onInput={(e) => onUpdate(e.currentTarget.textContent || '')}
          className="flex-1 outline-none"
        >
          {node.content}
        </div>
      </div>
    );
  },

  addSlashCommands() {
    return [
      {
        label: 'Callout',
        description: 'A colored callout box for tips and warnings',
        keywords: ['callout', 'tip', 'warning', 'info', 'alert'],
        group: 'advanced',
        action: (ctx) => {
          ctx.dispatch({
            type: 'INSERT_NODE',
            node: {
              id: crypto.randomUUID(),
              type: 'callout' as any,
              content: 'Type your callout text here...',
              attributes: { calloutType: 'info' },
            },
          });
        },
      },
    ];
  },

  addInputRules() {
    return [
      {
        // Type "!!! " at the start of a line to create a callout
        find: /^!!! $/,
        handler: (match, ctx) => {
          if (!ctx.state.activeNodeId) return false;
          ctx.dispatch({
            type: 'CONVERT_NODE',
            nodeType: 'callout',
            attributes: { calloutType: 'info' },
          });
          return true;
        },
      },
    ];
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-callout]',
        getAttrs: (el) => ({ calloutType: el.getAttribute('data-callout') || 'info' }),
      },
    ];
  },

  renderHTML(node) {
    const type = node.attributes?.calloutType || 'info';
    return `<div data-callout="${type}">${node.content || ''}</div>`;
  },
});
```

Register it alongside the built-in extensions:

```typescript
const manager = new ExtensionManager();
manager.register(Paragraph, Heading, Bold, Italic, Callout);
```

That is it. The callout block type is now available in the slash command menu, supports the `!!! ` input shortcut, serializes to/from HTML, and renders with a custom React component. No switch statements were modified.

### A Custom "Highlight" Mark Extension

A highlight mark applies a background color to selected text, mapping to the `className` property on `InlineText`:

```typescript
import { Mark } from "@/components/ui/rich-editor";

const Highlight = Mark.create({
  name: 'highlight',
  markName: 'highlight',
  inlineProperty: 'className',   // Maps to InlineText.className

  addOptions() {
    return {
      defaultColor: 'bg-yellow-200 dark:bg-yellow-800',
      colors: [
        'bg-yellow-200 dark:bg-yellow-800',
        'bg-green-200 dark:bg-green-800',
        'bg-blue-200 dark:bg-blue-800',
        'bg-pink-200 dark:bg-pink-800',
      ],
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-h': (ctx) => {
        ctx.dispatch({
          type: 'TOGGLE_CLASS',
          className: 'bg-yellow-200 dark:bg-yellow-800',
        });
        return true;
      },
    };
  },

  addCommands() {
    return {
      setHighlight: (color?: string) => ({ dispatch }) => {
        dispatch({
          type: 'SET_CLASS',
          className: color || 'bg-yellow-200 dark:bg-yellow-800',
        });
        return true;
      },
      removeHighlight: () => ({ dispatch }) => {
        dispatch({ type: 'REMOVE_CLASS' });
        return true;
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'mark' },
      {
        tag: 'span[data-highlight]',
        getAttrs: (el) => ({ color: el.getAttribute('data-highlight') }),
      },
    ];
  },

  renderHTML(attrs) {
    return '<mark>';
  },
});
```

### A Custom Keyboard Shortcut

You do not need a full extension for a single shortcut, but the pattern is consistent:

```typescript
const SelectAll = Extension.create({
  name: 'select-all',

  addKeyboardShortcuts() {
    return {
      'Mod-a': (ctx) => {
        ctx.dispatch({ type: 'SELECT_ALL' });
        return true;
      },
    };
  },
});
```

### A Custom Input Rule

Input rules match regex patterns against the current text content. The match is tested after every keystroke. Returning `true` from the handler tells the system the rule was applied:

```typescript
const AutoDash = Extension.create({
  name: 'auto-dash',

  addInputRules() {
    return [
      {
        // Typing "-- " converts to an em dash
        find: /--\s$/,
        handler: (match, ctx) => {
          // Replace the "-- " with "— "
          ctx.dispatch({
            type: 'REPLACE_TEXT',
            search: '-- ',
            replacement: '\u2014 ',
          });
          return true;
        },
      },
      {
        // Typing ">>" at start converts to blockquote
        find: /^>> $/,
        handler: (match, ctx) => {
          ctx.dispatch({ type: 'CONVERT_NODE', nodeType: 'blockquote' });
          return true;
        },
      },
    ];
  },
});
```

### A Custom Slash Command

Slash commands appear in the command menu (triggered by typing `/`). Each command has a label, optional description, keywords for search filtering, and an action:

```typescript
const TableCommands = Extension.create({
  name: 'table-commands',

  addSlashCommands() {
    return [
      {
        label: 'Table',
        description: 'Insert a table with rows and columns',
        keywords: ['table', 'grid', 'spreadsheet'],
        group: 'advanced',
        action: (ctx) => {
          ctx.dispatch({
            type: 'INSERT_TABLE',
            rows: 3,
            cols: 3,
          });
        },
      },
      {
        label: 'Divider',
        description: 'Insert a horizontal divider',
        keywords: ['divider', 'separator', 'hr', 'line'],
        group: 'basic',
        action: (ctx) => {
          ctx.dispatch({
            type: 'INSERT_NODE',
            node: { id: crypto.randomUUID(), type: 'hr', content: '' },
          });
        },
      },
    ];
  },
});
```

---

## 6. How StarterKit Works

The goal is for Mina's built-in types to be defined as extensions themselves. The editor becomes extensible because it is *built on* its own extension system. A `StarterKit` bundles all the default extensions:

```typescript
// This is the target architecture (in progress)

import { Extension, Node, Mark, ExtensionManager } from "@/components/ui/rich-editor";

// ─── Built-in Node Extensions ────────────────────────────────────────────

const Paragraph = Node.create({
  name: 'paragraph',
  nodeType: 'p',
  group: 'block',
  addStyles: () => 'text-base text-foreground leading-[1.6]',
});

const Heading = Node.create({
  name: 'heading',
  nodeType: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  group: 'block',
  addStyles: () => 'font-bold text-foreground',
  // + shortcuts, input rules, slash commands...
});

const Blockquote = Node.create({
  name: 'blockquote',
  nodeType: 'blockquote',
  group: 'block',
  addStyles: () => 'text-base text-muted-foreground italic border-l-4 border-primary pl-6 py-1',
});

const CodeBlock = Node.create({
  name: 'code-block',
  nodeType: 'code',
  group: 'block',
  addStyles: () => 'font-mono text-sm bg-secondary text-secondary-foreground px-4 py-2 rounded-lg whitespace-pre-wrap break-words',
});

const BulletList = Node.create({
  name: 'bullet-list',
  nodeType: 'li',
  group: 'block',
  addStyles: () => 'text-base text-foreground leading-[1.6] list-disc list-inside',
});

const OrderedList = Node.create({
  name: 'ordered-list',
  nodeType: 'ol',
  group: 'block',
  addStyles: () => 'text-base text-foreground leading-[1.6] list-decimal list-inside',
});

// ─── Built-in Mark Extensions ────────────────────────────────────────────

const Bold = Mark.create({
  name: 'bold',
  markName: 'bold',
  inlineProperty: 'bold',
  parseHTML: () => [{ tag: 'strong' }, { tag: 'b' }, { style: 'font-weight=bold' }],
  renderHTML: () => '<strong>',
  addKeyboardShortcuts: () => ({ 'Mod-b': (ctx) => { ctx.dispatch({ type: 'TOGGLE_FORMAT', format: 'bold' }); return true; } }),
});

const Italic = Mark.create({
  name: 'italic',
  markName: 'italic',
  inlineProperty: 'italic',
  parseHTML: () => [{ tag: 'em' }, { tag: 'i' }, { style: 'font-style=italic' }],
  renderHTML: () => '<em>',
  addKeyboardShortcuts: () => ({ 'Mod-i': (ctx) => { ctx.dispatch({ type: 'TOGGLE_FORMAT', format: 'italic' }); return true; } }),
});

const Underline = Mark.create({
  name: 'underline',
  markName: 'underline',
  inlineProperty: 'underline',
  parseHTML: () => [{ tag: 'u' }, { style: 'text-decoration=underline' }],
  renderHTML: () => '<u>',
  addKeyboardShortcuts: () => ({ 'Mod-u': (ctx) => { ctx.dispatch({ type: 'TOGGLE_FORMAT', format: 'underline' }); return true; } }),
});

const Strikethrough = Mark.create({
  name: 'strikethrough',
  markName: 'strikethrough',
  inlineProperty: 'strikethrough',
  parseHTML: () => [{ tag: 's' }, { tag: 'del' }, { style: 'text-decoration=line-through' }],
  renderHTML: () => '<s>',
  addKeyboardShortcuts: () => ({ 'Mod-Shift-x': (ctx) => { ctx.dispatch({ type: 'TOGGLE_FORMAT', format: 'strikethrough' }); return true; } }),
});

const InlineCode = Mark.create({
  name: 'inline-code',
  markName: 'code',
  inlineProperty: 'code',
  parseHTML: () => [{ tag: 'code' }],
  renderHTML: () => '<code>',
  addKeyboardShortcuts: () => ({ 'Mod-e': (ctx) => { ctx.dispatch({ type: 'TOGGLE_FORMAT', format: 'code' }); return true; } }),
});

const Link = Mark.create({
  name: 'link',
  markName: 'link',
  inlineProperty: 'href',
  parseHTML: () => [{ tag: 'a[href]', getAttrs: (el) => ({ href: el.getAttribute('href') }) }],
  renderHTML: (attrs) => `<a href="${attrs?.href || ''}">`,
  addKeyboardShortcuts: () => ({ 'Mod-k': (ctx) => { /* open link popover */ return true; } }),
});

// ─── StarterKit ──────────────────────────────────────────────────────────

function createStarterKit(): ExtensionManager {
  const manager = new ExtensionManager();
  manager.register(
    // Nodes
    Paragraph, Heading, Blockquote, CodeBlock, BulletList, OrderedList,
    // Marks
    Bold, Italic, Underline, Strikethrough, InlineCode, Link,
  );
  return manager;
}
```

The old `getTypeClassName()` switch statement is replaced by `manager.getNodeStyles(type)`. Each node extension declares its own styles. Adding a new block type does not touch any existing code -- you create an extension and register it.

Compare the before and after:

**Before (hardcoded):**
```typescript
// Adding a new type requires modifying this central switch:
export function getTypeClassName(type: string): string {
  switch (type) {
    case "h1": return "text-4xl font-bold ...";
    case "h2": return "text-3xl font-bold ...";
    case "p":  return "text-base ...";
    // Must add a new case for every new type
    case "callout": return "rounded-lg border p-4 ..."; // 👈 Modify existing code
    default:   return "text-base ...";
  }
}
```

**After (extension-based):**
```typescript
// Each extension owns its own styles. No central switch to modify.
const Callout = Node.create({
  name: 'callout',
  nodeType: 'callout',
  addStyles: () => 'rounded-lg border p-4 ...', // 👈 Self-contained
});

// The editor queries the manager at render time:
const styles = manager.getNodeStyles(node.type) ?? defaultStyles;
```

---

## 7. Mina vs TipTap Extension Comparison

### Bold Extension

**TipTap:**
```typescript
import { Mark, mergeAttributes } from '@tiptap/core';

export const Bold = Mark.create({
  name: 'bold',

  parseHTML() {
    return [
      { tag: 'strong' },
      { tag: 'b', getAttrs: (node) => (node as HTMLElement).style.fontWeight !== 'normal' && null },
      { style: 'font-weight', getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['strong', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setBold: () => ({ commands }) => commands.setMark(this.name),
      toggleBold: () => ({ commands }) => commands.toggleMark(this.name),
      unsetBold: () => ({ commands }) => commands.unsetMark(this.name),
    };
  },

  addKeyboardShortcuts() {
    return { 'Mod-b': () => this.editor.commands.toggleBold() };
  },

  addInputRules() {
    return [markInputRule({ find: starInputRegex, type: this.type })];
  },

  addPasteRules() {
    return [markPasteRule({ find: starPasteRegex, type: this.type })];
  },
});
```

**Mina:**
```typescript
import { Mark } from "@/components/ui/rich-editor";

export const Bold = Mark.create({
  name: 'bold',
  markName: 'bold',
  inlineProperty: 'bold',

  parseHTML() {
    return [
      { tag: 'strong' },
      { tag: 'b' },
      { style: 'font-weight=bold' },
    ];
  },

  renderHTML() {
    return '<strong>';
  },

  addKeyboardShortcuts() {
    return {
      'Mod-b': (ctx) => {
        ctx.dispatch({ type: 'TOGGLE_FORMAT', format: 'bold' });
        return true;
      },
    };
  },
});
```

**Key differences:**
- TipTap's `renderHTML` returns a ProseMirror DOM output spec (`['strong', attrs, 0]`). Mina returns a plain HTML string.
- TipTap's commands go through ProseMirror's mark system (`commands.setMark(this.name)`). Mina's commands dispatch reducer actions directly.
- TipTap has `this.type` (a ProseMirror MarkType reference) and `this.editor` (the editor instance). Mina has `inlineProperty` (a direct data model mapping) and the `ctx` parameter.
- TipTap's `addInputRules` uses ProseMirror's `markInputRule` helper. Mina uses plain regex with a handler function.
- Mina's version is ~40% less code because there is no ProseMirror indirection layer.

### Heading Extension

**TipTap:**
```typescript
import { Node, mergeAttributes, textblockTypeInputRule } from '@tiptap/core';

export const Heading = Node.create({
  name: 'heading',

  addOptions() {
    return { levels: [1, 2, 3, 4, 5, 6], HTMLAttributes: {} };
  },

  content: 'inline*',
  group: 'block',
  defining: true,

  addAttributes() {
    return {
      level: { default: 1, rendered: false },
    };
  },

  parseHTML() {
    return this.options.levels.map((level: number) => ({ tag: `h${level}`, attrs: { level } }));
  },

  renderHTML({ node, HTMLAttributes }) {
    return [`h${node.attrs.level}`, mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setHeading: (attributes) => ({ commands }) =>
        commands.setNode(this.name, attributes),
      toggleHeading: (attributes) => ({ commands }) =>
        commands.toggleNode(this.name, 'paragraph', attributes),
    };
  },

  addKeyboardShortcuts() {
    return this.options.levels.reduce((items: any, level: number) => ({
      ...items,
      [`Mod-Alt-${level}`]: () => this.editor.commands.toggleHeading({ level }),
    }), {});
  },

  addInputRules() {
    return this.options.levels.map((level: number) =>
      textblockTypeInputRule({
        find: new RegExp(`^(#{1,${level}})\\s$`),
        type: this.type,
        getAttributes: { level },
      }),
    );
  },
});
```

**Mina:**
```typescript
import { Node } from "@/components/ui/rich-editor";

export const Heading = Node.create({
  name: 'heading',
  nodeType: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  group: 'block',

  addStyles() {
    return 'font-bold text-foreground';
  },

  parseHTML() {
    return [{ tag: 'h1' }, { tag: 'h2' }, { tag: 'h3' }, { tag: 'h4' }, { tag: 'h5' }, { tag: 'h6' }];
  },

  renderHTML(node) {
    return `<${node.type}>${node.content || ''}</${node.type}>`;
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-1': (ctx) => { ctx.dispatch({ type: 'CONVERT_NODE', nodeType: 'h1' }); return true; },
      'Mod-Alt-2': (ctx) => { ctx.dispatch({ type: 'CONVERT_NODE', nodeType: 'h2' }); return true; },
      'Mod-Alt-3': (ctx) => { ctx.dispatch({ type: 'CONVERT_NODE', nodeType: 'h3' }); return true; },
    };
  },

  addInputRules() {
    return [
      { find: /^# $/, handler: (_, ctx) => { ctx.dispatch({ type: 'CONVERT_NODE', nodeType: 'h1' }); return true; } },
      { find: /^## $/, handler: (_, ctx) => { ctx.dispatch({ type: 'CONVERT_NODE', nodeType: 'h2' }); return true; } },
      { find: /^### $/, handler: (_, ctx) => { ctx.dispatch({ type: 'CONVERT_NODE', nodeType: 'h3' }); return true; } },
    ];
  },
});
```

**Key differences:**
- TipTap uses `content: 'inline*'` (ProseMirror content expression) to define what can go inside a heading. Mina has no content constraints at the extension level.
- TipTap stores `level` as a node attribute and uses `this.type` to reference the ProseMirror NodeType. Mina encodes the level in the type string itself (`h1`, `h2`, etc.), so `nodeType: ['h1', 'h2', ...]` is an array.
- TipTap's `addAttributes` defines a formal schema attribute with parsing/rendering rules. Mina puts attributes in the open-ended `attributes` bag on `EditorNode`.
- TipTap's `addInputRules` uses `textblockTypeInputRule`, a ProseMirror helper that creates a transform step. Mina uses a plain regex + dispatch.

---

## 8. What This Enables

### Community Extensions

With a public extension API, the Mina ecosystem can grow beyond the core team:

```typescript
// Custom math extension example
import { Node } from "@/components/ui/rich-editor";
import { MathRenderer } from './MathRenderer';

export const MathBlock = Node.create({
  name: 'math',
  nodeType: 'math',
  group: 'block',
  renderBlock: ({ node, ...props }) => <MathRenderer latex={node.content} {...props} />,
  addSlashCommands: () => [{
    label: 'Math Block',
    description: 'LaTeX math equation',
    keywords: ['math', 'equation', 'latex', 'katex'],
    group: 'advanced',
    action: (ctx) => ctx.dispatch({ type: 'INSERT_NODE', node: { id: crypto.randomUUID(), type: 'math' as any, content: 'E = mc^2' } }),
  }],
});
```

### Application-Specific Blocks

A project management tool could add a task block. A documentation platform could add an API reference block. A social platform could add a poll block:

```typescript
const PollBlock = Node.create({
  name: 'poll',
  nodeType: 'poll',
  group: 'block',
  renderBlock: ({ node }) => <PollWidget options={node.attributes?.options as string[]} />,
  addSlashCommands: () => [{
    label: 'Poll',
    description: 'Create an interactive poll',
    keywords: ['poll', 'vote', 'survey'],
    group: 'interactive',
    action: (ctx) => ctx.dispatch({
      type: 'INSERT_NODE',
      node: {
        id: crypto.randomUUID(),
        type: 'poll' as any,
        content: 'What do you prefer?',
        attributes: { options: ['Option A', 'Option B', 'Option C'] },
      },
    }),
  }],
});
```

### Theming Through Extensions

Since node extensions declare their own CSS classes, a theme can override styles by registering higher-priority extensions:

```typescript
// Override the default heading styles
const DarkHeading = Node.create({
  name: 'heading',          // Same name replaces the original
  nodeType: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  priority: 150,            // Higher than the default (100)
  addStyles: () => 'font-bold text-purple-400 tracking-tight',
});
```

### Behavior Modifications

An extension can modify the editor's behavior without touching any rendering:

```typescript
const MaxLength = Extension.create({
  name: 'max-length',
  addOptions: () => ({ limit: 10000 }),
  onUpdate({ state, storage }) {
    // Could dispatch a warning or prevent further input
    const container = state.history[state.historyIndex];
    const textLength = countText(container);
    storage.isOverLimit = textLength > storage.limit;
  },
  addStorage: () => ({ isOverLimit: false, limit: 10000 }),
});
```

---

## 9. Key Design Decisions

Every architecture involves trade-offs. Here are the ones we made deliberately, and why.

### String-based NodeType (Extensible) vs Union Type (Type-Safe)

Mina's original `NodeType` was a TypeScript union:

```typescript
export type NodeType = 'h1' | 'h2' | 'p' | 'blockquote' | ... | 'container' | 'text';
```

This provides excellent autocompletion and compile-time checks. But it is a closed set. Adding a custom `'callout'` type requires modifying the union in the library source.

The extension system needs `nodeType` to accept arbitrary strings. A community extension defining `nodeType: 'callout'` cannot modify Mina's type definitions.

**Our approach:** The `NodeExtensionConfig.nodeType` field accepts `string | string[]`, not `NodeType`. The original `NodeType` union remains in `types.ts` for internal type safety on built-in types, but extensions are free to use any string. When an extension uses a custom string like `'callout'`, it casts with `as any` at the boundary -- a minor ergonomic cost.

**The trade-off:** You lose compile-time exhaustiveness checking for custom types. If you typo `'calout'` instead of `'callout'`, TypeScript will not catch it. We accept this because the alternative (a closed type system) makes extensibility impossible.

### InlineText Property Mapping vs Abstract Mark Objects

ProseMirror/TipTap marks are abstract objects: `{ type: MarkType, attrs: {} }`. They attach to text ranges and can be composed arbitrarily. This is flexible -- you can create any mark with any attributes.

Mina's `InlineText` has concrete properties: `bold`, `italic`, `underline`, `strikethrough`, `code`, `href`, `className`, `styles`. A mark extension maps to one of these properties via `inlineProperty`.

**The trade-off:** This is more constrained. You cannot create a truly novel mark type (like "comment thread" or "suggestion") without either using `className` as a catch-all or extending the `InlineText` interface. ProseMirror's mark system handles this naturally because marks are abstract objects.

**Why we chose this:** The concrete property approach has a major advantage -- the document model is self-documenting. When you look at an `InlineText` object, you see exactly what formatting is applied. There is no indirection through mark types and attribute schemas. For the 95% case (bold, italic, links, code, styling), this is simpler. For the 5% case (custom semantic marks), `className` with data attributes provides a reasonable escape hatch.

### No Schema Validation (Permissive JSON) vs Strict Schema (TipTap/ProseMirror)

ProseMirror enforces a schema. If you try to put a heading inside an inline context, the schema rejects it. If a required attribute is missing, the schema fills in the default. The document is always structurally valid by construction.

Mina does not validate document structure. An `EditorNode` is a JSON object. You can put anything in `attributes`. You can nest types in ways that do not make semantic sense. The document model is permissive.

**The trade-off:** Without schema validation, invalid documents are possible. A bug in an extension could create a document state that renders incorrectly or causes downstream errors.

**Why we chose this:** Schema enforcement has a cost in complexity. ProseMirror's schema system is powerful, but it is also one of the hardest parts of the stack to understand and debug. When something violates the schema, the error messages are cryptic. When you want to do something the schema does not anticipate, you fight the system.

Mina targets a different point on the correctness-simplicity spectrum. Validation happens at the application layer: input rules check preconditions, commands validate before dispatching, and the UI prevents invalid operations through its interaction design. The document model stays a simple JSON tree that is easy to inspect, debug, and manipulate.

### React Rendering vs ProseMirror NodeViews

ProseMirror renders through `toDOM` functions that return DOM specs, or through NodeViews that manage their own DOM subtrees. TipTap wraps NodeViews with `@tiptap/react` to allow React components, but it is an adapter layer -- React renders into a ProseMirror-managed DOM node.

Mina renders directly through React. Each block is a React component. The extension system lets node extensions provide custom React renderers via `renderBlock`.

**The trade-off:** ProseMirror's rendering is more efficient for pure text editing because it manages the DOM directly and can do fine-grained updates. React's reconciliation adds overhead. For large documents (1000+ blocks), this can matter.

**Why we chose this:** Mina is React-native. Its users are React developers. They want to write JSX, use hooks, use their component library. A React rendering model means custom block extensions are just React components. There is no impedance mismatch, no adapter layer, no special lifecycle to learn. The performance cost is real but manageable with React's own optimization tools (memo, virtualization).

---

## Conclusion

The Mina extension system is intentionally not a ProseMirror replacement. It is a block-first, JSON-native, React-rendering extension architecture that borrows TipTap's ergonomic patterns while staying true to Mina's own internals.

The core API surface is small:

- `Extension.create()` for behavior
- `Node.create()` for block types
- `Mark.create()` for inline formatting
- `ExtensionManager` for registration and lookup

Every hook returns plain objects or arrays. There are no class hierarchies, no schema grammars, no transaction steps. If you know how to write a TypeScript object literal, you know how to write a Mina extension.

The built-in types (`Paragraph`, `Heading`, `Bold`, `Italic`, etc.) are being migrated to be extensions themselves, so the editor is literally built on the same API available to community developers. The `nodes/` and `marks/` directories in `src/lib/extensions/` are where these will live as the migration progresses.

The extension system is shipping. The files are at:

- `src/lib/extensions/types.ts` -- All type definitions
- `src/lib/extensions/Extension.ts` -- `Extension.create()` factory
- `src/lib/extensions/Node.ts` -- `Node.create()` factory
- `src/lib/extensions/Mark.ts` -- `Mark.create()` factory
- `src/lib/extensions/ExtensionManager.ts` -- Central registry
- `src/lib/extensions/index.ts` -- Public API
- `src/lib/extensions/__tests__/extension-system.test.ts` -- Test coverage

Build something. Break something. File an issue.
