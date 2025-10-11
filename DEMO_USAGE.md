# Using Demo Content

The demo content has been extracted to a separate file for better organization and reusability.

## Import and Use

```typescript
import { createDemoContent } from '@/lib/demo-content';
import { EditorActions } from '@/lib';

// Inside your component
const demoNodes = createDemoContent();

// Option 1: Set as initial state
const newContainer: ContainerNode = {
  ...container,
  children: demoNodes,
};

const newState: EditorState = {
  ...state,
  history: [newContainer],
  historyIndex: 0,
  activeNodeId: demoNodes.length > 0 ? demoNodes[0].id : null,
  metadata: {
    ...state.metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

dispatch(EditorActions.setState(newState));

// Option 2: Use with custom timestamp
const customDemoNodes = createDemoContent(Date.now());
```

## Location

- **Demo Content**: `src/lib/demo-content.ts`
- **Exported from**: `src/lib/index.ts`
- **Usage Example**: See commented code in `src/components/SimpleEditor.tsx` (lines 387-1332)

## Features Demonstrated

The demo content showcases:

- ✨ Text formatting (bold, italic, underline)
- 🎨 Custom Tailwind CSS classes
- 📋 All block types (h1-h6, p, code, blockquote, li)
- 🪆 Nested blocks/containers
- ⌨️ Keyboard shortcuts
- 🔗 Links with href attributes
- 📤 HTML export capabilities
- 🎯 Complete feature overview

## Benefits

1. **Reusable**: Import anywhere in your codebase
2. **Maintainable**: Single source of truth for demo data
3. **Space-efficient**: Keeps component files clean and focused
4. **Testable**: Easy to use in tests and examples
5. **Customizable**: Pass custom timestamp for unique IDs

