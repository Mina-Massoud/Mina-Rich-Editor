# API Reference

## Components

### Editor

The main editor component that provides the rich text editing interface.

#### Props

```typescript
interface EditorProps {
  readOnly?: boolean;
  onUploadImage?: (file: File) => Promise<string>;
  notionBased?: boolean;
  onNotionBasedChange?: (notionBased: boolean) => void;
}
```

- `readOnly` - Makes the editor read-only when true
- `onUploadImage` - Callback function for handling image uploads
- `notionBased` - Enables Notion-style editing features
- `onNotionBasedChange` - Callback when Notion mode is toggled

### EditorProvider

Context provider that manages editor state.

#### Props

```typescript
interface EditorProviderProps {
  children: React.ReactNode;
  initialContainer?: ContainerNode;
  initialState?: Partial<EditorState>;
  onChange?: (state: EditorState) => void;
  debug?: boolean;
}
```

### Block

Individual content block component.

#### Props

```typescript
interface BlockProps {
  node: EditorNode;
  isActive: boolean;
  nodeRef: React.RefObject<HTMLElement>;
  onInput: (nodeId: string, content: string) => void;
  onKeyDown: (e: React.KeyboardEvent, nodeId: string) => void;
  onClick: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onCreateNested: (nodeId: string, type: NodeType) => void;
  depth?: number;
}
```

## Hooks

### useEditor

Returns the current editor state and dispatch function.

```typescript
const [state, dispatch] = useEditor();
```

### useEditorState

Returns only the editor state.

```typescript
const state = useEditorState();
```

### useEditorDispatch

Returns only the dispatch function.

```typescript
const dispatch = useEditorDispatch();
```

### useNode

Gets a specific node by ID with optimized re-rendering.

```typescript
const node = useNode(nodeId);
```

### useActiveNodeId

Returns the currently active node ID.

```typescript
const activeNodeId = useActiveNodeId();
```

## Types

### EditorNode

Base interface for all editor nodes.

```typescript
interface BaseNode {
  id: string;
  type: NodeType;
  attributes?: NodeAttributes;
}
```

### ContainerNode

Node that can contain other nodes.

```typescript
interface ContainerNode extends BaseNode {
  children: EditorNode[];
}
```

### TextNode

Node that contains text content.

```typescript
interface TextNode extends BaseNode {
  content: string | InlineText[];
}
```

### EditorState

The complete editor state.

```typescript
interface EditorState {
  history: ContainerNode[];
  historyIndex: number;
  activeNodeId: string | null;
  version: number;
  coverImage?: CoverImage;
  hasSelection: boolean;
  selectionKey: string;
  currentSelection: SelectionInfo | null;
  selectedBlocks: Set<string>;
  metadata: Record<string, any>;
}
```

## Actions

### EditorActions

Collection of action creators for modifying editor state.

```typescript
// Insert a new node
dispatch(EditorActions.insertNode(node, parentId, position));

// Update node content
dispatch(EditorActions.updateContent(nodeId, content));

// Delete a node
dispatch(EditorActions.deleteNode(nodeId));

// Move a node
dispatch(EditorActions.moveNode(nodeId, targetParentId, position));

// Update node attributes
dispatch(EditorActions.updateAttributes(nodeId, attributes));
```

