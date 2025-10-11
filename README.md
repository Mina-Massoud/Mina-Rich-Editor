# 📝 Mina Rich Editor

A modern, TypeScript-first rich text editor library built with React. Features a JSON-based document model, immutable state management, and a clean CRUD API.

## ✨ What's Built

### 🏗️ Core Library (`/src/lib/`)

A complete editor state management system:

- **JSON Document Model** - Tree-based structure with containers and text nodes
- **Immutable State** - React `useReducer` with predictable updates
- **CRUD Operations** - Create, Read, Update, Delete, Move, Duplicate
- **Type-Safe API** - Full TypeScript support with IntelliSense

### 🎨 Three Demo Modes

1. **⚡ Simple Editor** - Single block with formatting (Bold, Italic, Underline)
2. **✨ Rich Editor** - Multi-block Linear-style editor with toolbar
3. **🔧 MVP/Debug** - Full CRUD testing interface with JSON viewer

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and switch between modes using the top-right buttons.

## 📚 How It Works

### 1. Document Structure

```typescript
{
  "version": "1.0.0",
  "container": {
    "id": "root",
    "type": "container",
    "children": [
      {
        "id": "p-1",
        "type": "p",
        "content": "Hello, world!",
        "attributes": {
          "className": "font-bold"
        }
      }
    ]
  }
}
```

### 2. Using the Library

```tsx
import { EditorProvider, useEditor, EditorActions } from '@/lib';

function MyEditor() {
  const [state, dispatch] = useEditor();

  const makeBold = () => {
    dispatch(
      EditorActions.updateAttributes('node-id', {
        className: 'font-bold',
      })
    );
  };

  return <button onClick={makeBold}>Make Bold</button>;
}

// Wrap with provider
<EditorProvider>
  <MyEditor />
</EditorProvider>;
```

### 3. Available Actions

```tsx
// Create
EditorActions.insertNode(newNode, targetId, 'append');

// Update
EditorActions.updateContent(nodeId, 'New text');
EditorActions.updateAttributes(nodeId, { className: 'font-bold' });
EditorActions.updateNode(nodeId, { type: 'h1' });

// Delete
EditorActions.deleteNode(nodeId);

// Move
EditorActions.moveNode(nodeId, targetId, 'after');

// Duplicate
EditorActions.duplicateNode(nodeId);

// Batch
EditorActions.batch([action1, action2, action3]);

// Reset
EditorActions.reset();
```

## 🎯 Simple Editor Example

The **Simple Editor** demonstrates the core concept:

1. **Select text** in the editor
2. **Click Bold/Italic/Underline** buttons
3. **Watch the console** - you'll see CRUD actions being logged
4. **Check JSON panel** - see the state update in real-time

This shows how:
- User interactions trigger dispatch actions
- Actions flow through the reducer
- State updates immutably
- React re-renders with new state

## 📁 Project Structure

```
src/
├── lib/                    # Core editor library
│   ├── types.ts           # TypeScript definitions
│   ├── utils/
│   │   └── tree-operations.ts  # Recursive tree functions
│   ├── reducer/
│   │   ├── actions.ts     # Action creators
│   │   └── editor-reducer.ts   # Reducer logic
│   ├── context/
│   │   └── EditorContext.tsx   # React context + hooks
│   └── index.ts           # Public API exports
├── components/
│   ├── SimpleEditor.tsx   # Single-block editor
│   ├── RichTextEditor.tsx # Multi-block editor
│   └── EditorMVP.tsx      # Debug/testing interface
└── app/
    └── page.tsx           # Next.js page with mode switcher
```

## 🔑 Key Features

### ✅ Implemented

- [x] JSON document model
- [x] Immutable state management
- [x] Full CRUD operations
- [x] Recursive tree operations
- [x] TypeScript support
- [x] Context + Hooks API
- [x] Text formatting (bold, italic, underline)
- [x] Node type switching (p, h1, h2, h3, etc.)
- [x] Dynamic attributes
- [x] Batch operations
- [x] Debug mode
- [x] Nested containers

### 🚧 To Be Added

- [ ] Text selection ranges (start/end positions)
- [ ] Inline marks (separate from block-level formatting)
- [ ] Link support with popup
- [ ] Image/video embeds
- [ ] Drag & drop reordering
- [ ] Undo/redo history
- [ ] Copy/paste handling
- [ ] Markdown shortcuts (e.g., `# ` for h1)
- [ ] Slash commands (e.g., `/image`)
- [ ] Plugin system
- [ ] Collaboration (CRDT/OT)
- [ ] Export to HTML/Markdown

## 🎓 Learning Resources

- **LIBRARY_README.md** - Complete API documentation
- **Console logs** - All CRUD operations are logged (check browser console)
- **JSON viewer** - Real-time state visualization in MVP mode

## 🧪 Testing the Library

### Test CRUD Operations (MVP Mode)

1. Switch to **🔧 MVP** mode
2. Use the left panel to add nodes
3. Use the visual editor to edit/delete/duplicate
4. Watch the JSON panel update in real-time

### Test Formatting (Simple Mode)

1. Switch to **⚡ Simple** mode
2. Select text in the editor
3. Click **B** (Bold), **I** (Italic), or **U** (Underline)
4. See the JSON update with new `className` attribute
5. Check console for CRUD action logs

### Test Multi-Block (Rich Mode)

1. Switch to **✨ Rich** mode
2. Type content and press Enter to create new blocks
3. Use toolbar to change block types
4. Hover over blocks to see quick actions

## 🤝 Using as a Library

You can import and use the core library in any React project:

```tsx
// Import core functionality
import {
  EditorProvider,
  useEditor,
  useEditorState,
  useEditorDispatch,
  EditorActions,
  findNodeById,
  traverseTree,
  validateTree,
} from './lib';

// Build your custom editor UI
function CustomEditor() {
  const [state, dispatch] = useEditor();

  // Your custom logic here
}
```

## 📖 API Reference

See **LIBRARY_README.md** for complete API documentation including:
- All hooks
- All actions
- Tree operations
- Type definitions
- Advanced usage examples

## 🐛 Known Issues

- **Rich Editor**: Cursor management in contentEditable needs refinement
- **Performance**: Large documents (>1000 nodes) not yet optimized
- **Mobile**: Touch interactions not fully tested

## 💡 Architecture Highlights

### Why this approach?

1. **JSON as source of truth** - Easy to save, load, and transmit
2. **Immutable updates** - Predictable state changes, easy debugging
3. **Recursive tree** - Supports unlimited nesting
4. **Reducer pattern** - Familiar to Redux users, testable
5. **Context API** - No external dependencies, React native

### Inspired by:

- **Quill** - Delta format concept
- **Draft.js** - Block-based model
- **Slate** - Tree structure
- **ProseMirror** - State management patterns
- **Notion/Linear** - UX and interaction patterns

## 📄 License

MIT

---

**Built with ❤️ by Mina**

Start with the **Simple Editor** to understand the basics, then explore **Rich Editor** and **MVP** modes!
# Mina-Rich-Editor
