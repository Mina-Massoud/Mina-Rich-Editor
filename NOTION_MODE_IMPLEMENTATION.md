# Notion Mode vs Rich Editor Mode Implementation

## Overview

The Mina Rich Editor now supports two distinct modes that can be toggled at runtime:

### 🎨 **Notion Mode** (Default)
- **Icon**: 📖 BookOpen
- **Features**:
  - Cover image support with upload button on first block hover
  - First block is styled as a main header (h1) with extra spacing (mt-8 pb-4)
  - Notion-style spacing and layout
  - Perfect for document-style editing similar to Notion

### 📝 **Rich Editor Mode**
- **Icon**: 📄 FileText  
- **Features**:
  - No cover image
  - No special header block
  - Starts with clean, empty paragraph blocks
  - Traditional rich text editor experience
  - Perfect for blog posts, articles, or simple content editing

## Implementation Details

### 1. New Files Created

#### `src/lib/empty-content.ts`
```typescript
// Creates 3 empty paragraph blocks for Rich Editor Mode
export function createEmptyContent(timestamp?: number): EditorNode[]
```

### 2. Modified Components

#### `src/components/QuickModeToggle.tsx`
- Added mode toggle button (shows first in the toolbar)
- BookOpen icon for Notion Mode
- FileText icon for Rich Editor Mode
- Optional props: `notionBased` and `onNotionBasedChange`
- Only displays if `onNotionBasedChange` handler is provided

#### `src/components/Editor.tsx`
- Added `notionBased` prop (default: `true`)
- Added `onNotionBasedChange` callback prop
- Passes props to `QuickModeToggle`
- Controls cover image display: `{notionBased && <CoverImage ... />}`
- Controls spacing: `notionBased && state.coverImage ? "pt-[350px]" : notionBased ? "pt-[50px]" : "pt-4"`

#### `src/components/Block.tsx`
- Already supports `notionBased` prop
- Controls cover image button visibility on first block
- Controls first header spacing: `${notionBased && isFirstBlock && textNode.type === 'h1' ? "mt-8 pb-4" : ""}`

#### `src/app/page.tsx`
- Added `notionBased` state (toggleable at runtime)
- Uses `useMemo` to switch initial content based on mode:
  - Notion Mode → `createDemoContent()` (full demo with header)
  - Rich Editor Mode → `createEmptyContent()` (3 empty paragraphs)
- Passes `notionBased` and `onNotionBasedChange` to Editor

### 3. Exported Utilities

Added to `src/lib/index.ts`:
```typescript
export { createEmptyContent } from './empty-content';
```

## Usage

### Basic Usage (Notion Mode - Default)

```typescript
import { Editor, EditorProvider } from '@/lib';

function App() {
  return (
    <EditorProvider>
      <Editor />
    </EditorProvider>
  );
}
```

### Rich Editor Mode (No Cover, No Header)

```typescript
import { Editor, EditorProvider, createEmptyContent } from '@/lib';

const initialContent = {
  id: 'root',
  type: 'container',
  children: createEmptyContent(),
  attributes: {}
};

function App() {
  return (
    <EditorProvider initialContainer={initialContent}>
      <Editor notionBased={false} />
    </EditorProvider>
  );
}
```

### Runtime Toggle (Demo Implementation)

```typescript
import { useState, useMemo } from 'react';
import { Editor, EditorProvider, createDemoContent, createEmptyContent } from '@/lib';

function App() {
  const [notionBased, setNotionBased] = useState(true);
  
  const initialContainer = useMemo(() => ({
    id: 'root',
    type: 'container',
    children: notionBased ? createDemoContent() : createEmptyContent(),
    attributes: {}
  }), [notionBased]);

  return (
    <EditorProvider initialContainer={initialContainer}>
      <Editor 
        notionBased={notionBased}
        onNotionBasedChange={setNotionBased}
      />
    </EditorProvider>
  );
}
```

## Visual Differences

### Notion Mode
```
┌─────────────────────────────────┐
│   [Cover Image or Upload Area] │ ← Appears on hover
├─────────────────────────────────┤
│                                 │
│   Untitled (h1)                 │ ← Large header with spacing
│   [+ button] [≡ drag]           │ ← Cover upload button visible
│                                 │
│   Start typing...               │
│                                 │
└─────────────────────────────────┘
```

### Rich Editor Mode
```
┌─────────────────────────────────┐
│   [+ button] [≡ drag] ___       │ ← No cover button
│                                 │ ← Clean, minimal spacing
│   [+ button] [≡ drag] ___       │
│                                 │
│   [+ button] [≡ drag] ___       │
│                                 │
└─────────────────────────────────┘
```

## Key Features

✅ **Runtime Toggle**: Switch between modes on the fly
✅ **Clean Separation**: Each mode has its own initial content
✅ **Backward Compatible**: Existing code continues to work (Notion mode by default)
✅ **Flexible**: Developers can choose to hide the toggle if they want a fixed mode
✅ **Intuitive Icons**: Clear visual indicators for each mode

## Technical Notes

1. **Content Switching**: When toggling modes, the `initialContainer` is recreated with appropriate content
2. **State Management**: The `notionBased` state is lifted to the page level for better control
3. **Conditional Rendering**: Cover image and special spacing are conditionally applied based on `notionBased` prop
4. **First Block Detection**: The `isFirstBlock` prop helps identify which block should show the cover upload button

## Future Enhancements

Possible improvements:
- [ ] Add animation when switching between modes
- [ ] Remember user's mode preference in localStorage
- [ ] Add more preset templates for each mode
- [ ] Allow custom empty content templates
- [ ] Add mode-specific keyboard shortcuts

