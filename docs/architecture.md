# Architecture

Understanding the internal architecture of the Mina Rich Editor.

## Overview

The Mina Rich Editor is built with a modular, extensible architecture that emphasizes:

- **Immutable state management** using React's useReducer
- **Block-based content model** with a tree structure
- **Type safety** throughout with TypeScript
- **Performance optimization** through structural sharing
- **Extensibility** via a plugin-like component system

## Core Concepts

### 1. Node-Based Content Model

Content is represented as a tree of nodes, where each node has:

```typescript
interface BaseNode {
  id: string;           // Unique identifier
  type: NodeType;       // Node type (p, h1, img, etc.)
  attributes?: object;  // Optional styling/metadata
}
```

### 2. Container vs Text Nodes

- **Container Nodes**: Can contain other nodes (div, section, blockquote)
- **Text Nodes**: Contain text content (p, h1, h2, etc.)
- **Structural Nodes**: Special purpose nodes (img, hr, etc.)

### 3. Immutable Updates

All state changes create new objects while preserving unchanged references:

```typescript
// Only nodes on the path to change get new references
Root (new) ← changed
├─ Section (new) ← path to change  
│  ├─ Block A (new) ← the actual change
│  ├─ Block B (same) ← unchanged reference
│  └─ Block C (same) ← unchanged reference
└─ Section (same) ← unchanged subtree
```

## State Management

### EditorState Structure

```typescript
interface EditorState {
  history: ContainerNode[];      // Undo/redo history
  historyIndex: number;          // Current position in history
  activeNodeId: string | null;   // Currently focused node
  version: number;               // State version for change detection
  coverImage?: CoverImage;       // Document cover image
  hasSelection: boolean;         // Text selection state
  selectionKey: string;          // Selection identifier
  currentSelection: SelectionInfo | null;
  selectedBlocks: Set<string>;   // Multi-selected blocks
  metadata: Record<string, any>; // Custom metadata
}
```

### Action-Based Updates

All changes go through a reducer with typed actions:

```typescript
// Action types
type EditorAction = 
  | UpdateNodeAction
  | InsertNodeAction  
  | DeleteNodeAction
  | MoveNodeAction
  | UpdateAttributesAction
  | BatchAction;

// Reducer handles all state transitions
const newState = editorReducer(currentState, action);
```

## Component Architecture

### 1. Provider Pattern

```
EditorProvider (Context)
├─ Editor (Main component)
│  ├─ EditorToolbar
│  ├─ CoverImage
│  └─ Block (Recursive)
│     ├─ Block (Nested)
│     └─ Block (Nested)
└─ SelectionToolbar
```

### 2. Block Component Hierarchy

Each block is responsible for:
- Rendering its content
- Handling user interactions
- Managing focus and selection
- Triggering state updates via dispatch

```tsx
function Block({ node, isActive, onInput, onKeyDown, ... }) {
  // Render based on node type
  switch (node.type) {
    case 'p': return <ParagraphBlock />;
    case 'h1': return <HeadingBlock level={1} />;
    case 'img': return <ImageBlock />;
    // ...
  }
}
```

## Data Flow

### 1. User Interaction Flow

```
User types → Block.onInput → dispatch(action) → reducer → new state → re-render
```

### 2. State Update Process

1. **User Action**: Typing, clicking, drag & drop
2. **Event Handler**: Component captures event
3. **Action Dispatch**: Creates and dispatches action
4. **Reducer Processing**: Immutable state update
5. **Context Update**: New state propagated
6. **Re-render**: Only changed components update

### 3. Performance Optimization

- **Structural Sharing**: Unchanged nodes keep same references
- **Selective Re-rendering**: Only components with changed props re-render
- **Memoization**: Expensive computations are cached
- **Debounced Updates**: Rapid changes are batched

## File Structure

```
src/
├─ components/           # React components
│  ├─ Editor.tsx        # Main editor component
│  ├─ Block.tsx         # Block renderer
│  ├─ EditorToolbar.tsx # Toolbar component
│  └─ ui/               # Reusable UI components
├─ lib/
│  ├─ types.ts          # TypeScript definitions
│  ├─ context/          # React context
│  ├─ reducer/          # State management
│  ├─ utils/            # Utility functions
│  └─ handlers/         # Event handlers
└─ hooks/               # Custom React hooks
```

## Key Utilities

### Tree Operations

```typescript
// Core tree manipulation functions
findNodeById(container, nodeId)     // Find node by ID
updateNodeById(container, id, updater) // Update specific node
insertNode(container, node, parentId, position) // Add new node
deleteNodeById(container, nodeId)   // Remove node
moveNode(container, nodeId, targetId, position) // Relocate node
```

### Serialization

```typescript
// Export content in different formats
serializeToHtml(container)          // Convert to HTML
serializeToHtmlWithClass(container) // HTML with Tailwind classes
// JSON is native (the container object itself)
```

### Selection Management

```typescript
// Handle text selection and multi-block selection
useSelectionManager()               // Hook for selection state
getSelectionInfo()                  // Current selection details
applyFormatting(selection, format)  // Apply text formatting
```

## Extension Points

### 1. Custom Node Types

Add new block types by:
1. Defining the node interface
2. Adding to the NodeType union
3. Implementing renderer in Block component
4. Adding actions for creation/manipulation

### 2. Custom Handlers

Override default behavior:
```typescript
// Custom key handler
const customKeyHandler = (e: KeyboardEvent, nodeId: string) => {
  if (e.key === 'Tab') {
    // Custom tab behavior
    return true; // Handled
  }
  return false; // Use default
};
```

### 3. Plugins

Extend functionality through composition:
```typescript
function withCustomFeature(WrappedEditor) {
  return function EnhancedEditor(props) {
    // Add custom logic
    return <WrappedEditor {...props} {...enhancements} />;
  };
}
```

## Performance Considerations

### 1. Immutability Benefits

- Predictable updates
- Easy undo/redo implementation  
- Efficient change detection
- Safe concurrent operations

### 2. Optimization Strategies

- **Reference equality checks** for re-render prevention
- **Structural sharing** to minimize memory usage
- **Debounced operations** for expensive computations
- **Lazy loading** for large documents

### 3. Memory Management

- History is bounded (configurable limit)
- Unused references are garbage collected
- Large media files use URLs, not embedded data
- Efficient tree traversal algorithms

## Testing Strategy

### 1. Unit Tests

- Pure functions (tree operations, serialization)
- Reducer logic with various actions
- Utility functions

### 2. Integration Tests

- Component interactions
- State management flows
- Event handling

### 3. Performance Tests

- Large document handling
- Memory usage monitoring
- Render performance benchmarks

