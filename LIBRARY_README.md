# 📝 Mina Rich Editor

A **flexible, TypeScript-first rich text editor library** built with React. Features a JSON-based document model, immutable state management via `useReducer`, and an extensible architecture for building custom editing experiences.

## ✨ Features

- 🎯 **JSON Document Model** - Single source of truth with a predictable structure
- 🔄 **Immutable State Management** - Uses React `useReducer` for predictable updates
- 🌳 **Recursive Tree Operations** - Full CRUD support for nested content
- 🎨 **Flexible Styling** - Dynamic attributes for custom classes and styles
- 🔌 **Plugin-Ready Architecture** - Extensible design for custom node types
- 📦 **TypeScript First** - Full type safety and IntelliSense support
- ⚡ **Performance Optimized** - Efficient tree updates and selective re-renders
- 🎭 **Linear-Style UX** - Beautiful, modern editing experience

## 🚀 Quick Start

### Installation

```bash
npm install mina-rich-editor
# or
yarn add mina-rich-editor
```

### Basic Usage

```tsx
import { EditorProvider, useEditor, EditorActions } from 'mina-rich-editor';

function App() {
  return (
    <EditorProvider>
      <MyEditor />
    </EditorProvider>
  );
}

function MyEditor() {
  const [state, dispatch] = useEditor();

  const addParagraph = () => {
    dispatch(
      EditorActions.insertNode(
        {
          id: 'p-1',
          type: 'p',
          content: 'Hello, world!',
        },
        state.container.id,
        'append'
      )
    );
  };

  return (
    <div>
      <button onClick={addParagraph}>Add Paragraph</button>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
}
```

## 📚 Core Concepts

### 1. Document Model

The editor uses a **tree-based JSON structure** where:

- **Container nodes** can have children (nested structure)
- **Text nodes** contain actual content
- **Attributes** allow dynamic styling and metadata

```typescript
interface EditorState {
  version: string;
  container: ContainerNode;
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
  };
}

interface ContainerNode {
  id: string;
  type: 'container';
  children: EditorNode[];
  attributes?: NodeAttributes;
}

interface TextNode {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'p' | 'blockquote' | 'code' | 'pre' | /* ... */;
  content?: string;
  attributes?: NodeAttributes;
}
```

### 2. State Management

Uses React's `useReducer` for predictable, immutable state updates:

```tsx
const [state, dispatch] = useEditor();

// All updates go through the reducer
dispatch(EditorActions.updateContent('node-id', 'New content'));
```

### 3. Actions (CRUD Operations)

#### Create (Insert)

```tsx
dispatch(
  EditorActions.insertNode(
    newNode,
    targetId,
    'before' | 'after' | 'prepend' | 'append'
  )
);
```

#### Read (Query)

```tsx
const node = findNodeById(state.container, 'node-id');
const parent = findParentById(state.container, 'child-id');
```

#### Update

```tsx
// Update entire node
dispatch(EditorActions.updateNode('node-id', { content: 'New text' }));

// Update attributes only
dispatch(
  EditorActions.updateAttributes('node-id', {
    className: 'font-bold text-blue-500',
  })
);

// Update content only
dispatch(EditorActions.updateContent('node-id', 'New content'));
```

#### Delete

```tsx
dispatch(EditorActions.deleteNode('node-id'));
```

#### Move

```tsx
dispatch(EditorActions.moveNode('node-id', 'target-id', 'after'));
```

#### Duplicate

```tsx
dispatch(EditorActions.duplicateNode('node-id'));
```

#### Batch Operations

```tsx
dispatch(
  EditorActions.batch([
    EditorActions.updateContent('p-1', 'First'),
    EditorActions.updateContent('p-2', 'Second'),
    EditorActions.deleteNode('p-3'),
  ])
);
```

## 🎣 Hooks API

### `useEditor()`

Returns both state and dispatch:

```tsx
const [state, dispatch] = useEditor();
```

### `useEditorState()`

Returns only the state (read-only):

```tsx
const state = useEditorState();
```

### `useEditorDispatch()`

Returns only the dispatch function:

```tsx
const dispatch = useEditorDispatch();
```

### `useNode(nodeId)`

Gets a specific node by ID:

```tsx
const node = useNode('paragraph-1');
if (node) {
  console.log(node.content);
}
```

### `useEditorSelector(selector)`

Optimizes re-renders by selecting specific data:

```tsx
const nodeCount = useEditorSelector((state) => {
  let count = 0;
  traverseTree(state.container, () => count++);
  return count;
});
```

## 🛠️ Utility Functions

### Tree Operations

```tsx
import {
  findNodeById,
  findParentById,
  updateNodeById,
  deleteNodeById,
  insertNode,
  moveNode,
  cloneNode,
  traverseTree,
  validateTree,
} from 'mina-rich-editor';

// Find a node
const node = findNodeById(container, 'node-id');

// Traverse tree
traverseTree(container, (node, depth) => {
  console.log(`${' '.repeat(depth)}${node.type}: ${node.id}`);
});

// Validate structure
const { valid, errors } = validateTree(container);
if (!valid) {
  console.error('Validation errors:', errors);
}
```

### Type Guards

```tsx
import { isContainerNode, isTextNode } from 'mina-rich-editor';

if (isContainerNode(node)) {
  console.log('Has', node.children.length, 'children');
}

if (isTextNode(node)) {
  console.log('Content:', node.content);
}
```

## 🎨 Advanced Usage

### Custom Initial State

```tsx
const initialContainer: ContainerNode = {
  id: 'root',
  type: 'container',
  children: [
    { id: 'h1-1', type: 'h1', content: 'My Document' },
    { id: 'p-1', type: 'p', content: 'First paragraph' },
  ],
};

<EditorProvider initialContainer={initialContainer}>
  <MyEditor />
</EditorProvider>;
```

### Listen to Changes

```tsx
<EditorProvider
  onChange={(state) => {
    // Save to localStorage
    localStorage.setItem('document', JSON.stringify(state));
  }}
>
  <MyEditor />
</EditorProvider>
```

### Debug Mode

```tsx
<EditorProvider debug>
  <MyEditor />
</EditorProvider>
```

### Nested Containers

```tsx
const nested: ContainerNode = {
  id: 'root',
  type: 'container',
  children: [
    {
      id: 'section-1',
      type: 'container',
      children: [
        { id: 'h2-1', type: 'h2', content: 'Section Title' },
        { id: 'p-1', type: 'p', content: 'Section content' },
      ],
    },
  ],
};
```

### Dynamic Attributes

```tsx
const styledNode: TextNode = {
  id: 'p-1',
  type: 'p',
  content: 'Styled text',
  attributes: {
    className: 'font-bold text-blue-500 hover:text-blue-700',
    style: 'font-size: 18px; line-height: 1.6',
    'data-category': 'introduction',
    'aria-label': 'Introduction paragraph',
  },
};
```

## 🏗️ Architecture

### Data Flow

```
User Action → Dispatch Action → Reducer → New State → Re-render
```

### Immutability

All state updates create new objects:

```typescript
// ❌ BAD - Mutates state
state.container.children.push(newNode);

// ✅ GOOD - Creates new state
dispatch(EditorActions.insertNode(newNode, 'root', 'append'));
```

### Tree Updates

Updates are recursive and efficient:

1. Find target node by ID
2. Create new branch from root to target
3. Apply change to target
4. Return new tree (unchanged nodes are reused)

## 🔌 Plugin System (Coming Soon)

The architecture is designed for extensibility:

```typescript
interface Plugin {
  name: string;
  version: string;
  blocks?: BlockDefinition[];
  marks?: MarkDefinition[];
  commands?: Record<string, Command>;
  onInit?: (editor: Editor) => void;
}
```

## 📦 Export & Import

### Export to JSON

```tsx
const exportDocument = () => {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'document.json';
  a.click();
};
```

### Import from JSON

```tsx
const importDocument = (jsonString: string) => {
  const container = JSON.parse(jsonString).container;
  dispatch(EditorActions.replaceContainer(container));
};
```

## 🎯 Real-World Example

### Building a Notion-Like Editor

```tsx
function NotionEditor() {
  const [state, dispatch] = useEditor();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div>
      <Toolbar selectedId={selectedId} dispatch={dispatch} />

      <div className="editor-canvas">
        {state.container.children.map((node) => (
          <EditableBlock
            key={node.id}
            node={node}
            isSelected={selectedId === node.id}
            onSelect={() => setSelectedId(node.id)}
            onUpdate={(content) =>
              dispatch(EditorActions.updateContent(node.id, content))
            }
          />
        ))}
      </div>
    </div>
  );
}
```

## 🧪 Testing

```tsx
import { renderHook, act } from '@testing-library/react';
import { EditorProvider, useEditor, EditorActions } from 'mina-rich-editor';

test('adds a paragraph', () => {
  const wrapper = ({ children }) => <EditorProvider>{children}</EditorProvider>;
  const { result } = renderHook(() => useEditor(), { wrapper });

  act(() => {
    result.current[1](
      EditorActions.insertNode(
        { id: 'p-1', type: 'p', content: 'Test' },
        'root',
        'append'
      )
    );
  });

  expect(result.current[0].container.children).toHaveLength(1);
  expect(result.current[0].container.children[0].content).toBe('Test');
});
```

## 🐛 Debugging

### View State

```tsx
console.log(JSON.stringify(state, null, 2));
```

### Validate Tree

```tsx
const { valid, errors } = validateTree(state.container);
console.log('Valid:', valid, 'Errors:', errors);
```

### Count Nodes

```tsx
let count = 0;
traverseTree(state.container, () => count++);
console.log('Total nodes:', count);
```

## 📖 API Reference

See `/src/lib/index.ts` for complete API exports.

## 🤝 Contributing

This is an open-source library. Contributions welcome!

## 📄 License

MIT

## 🔗 Links

- GitHub: [Coming Soon]
- Documentation: [Coming Soon]
- Examples: See `/src/components/EditorMVP.tsx` and `/src/components/RichTextEditor.tsx`

---

**Built with ❤️ by Mina**

