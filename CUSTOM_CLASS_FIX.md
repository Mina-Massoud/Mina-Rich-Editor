# Custom Class Feature Fix

## Problem
The custom class feature wasn't working properly when selecting text in most cases, especially in list items (ul/ol/li) and nested elements. Users would select text, try to add a custom class, but nothing would happen.

## Root Cause
The text selection tracking in `handleSelectionChange` function was only looking at top-level children of the container:

```typescript
const freshCurrentNode = state.activeNodeId
  ? (container.children.find((n) => n.id === state.activeNodeId) as TextNode | undefined)
  : (container.children[0] as TextNode | undefined);
```

This meant that:
1. **List items** inside container nodes were never found
2. **Nested elements** weren't detected
3. Selection tracking failed for any non-top-level node

## Solution
Implemented a DOM-based approach to find the actual selected node:

### Key Changes in `src/components/SimpleEditor.tsx`:

1. **DOM Traversal Approach**: Instead of relying on `activeNodeId` and searching only top-level children, we now:
   - Start from the selection's `commonAncestorContainer`
   - Walk up the DOM tree to find the closest element with `data-node-id`
   - Skip container nodes and find the actual text node

2. **Nested Node Support**: Use `findNodeById` (which recursively searches the entire tree) instead of just checking `container.children`

3. **Fallback Logic**: If DOM traversal fails, fall back to the old behavior for compatibility

### Code Changes:

```typescript
// NEW: Walk up the DOM from selection
let node: Node | null = range.commonAncestorContainer;

while (node) {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    const nodeId = element.getAttribute('data-node-id');
    const nodeType = element.getAttribute('data-node-type');
    
    // Found a text node (not a container)
    if (nodeId && nodeType && nodeType !== 'container') {
      currentElement = element;
      break;
    }
  }
  node = node.parentNode;
}

// Use findNodeById to search the entire tree (including nested nodes)
const actualNode = findNodeById(container, actualNodeId) as TextNode | undefined;
```

## Testing
To verify the fix:

1. Create a list (ordered or unordered) using `/` command
2. Add some text to list items
3. Select text within a list item
4. Click the custom class icon (pencil button) that appears
5. Apply a custom class (e.g., `text-red-500`)
6. The class should now be applied correctly

## Files Modified
- `src/components/SimpleEditor.tsx`: Updated `handleSelectionChange` to properly detect selections in nested nodes
- Added `findNodeById` import from `../lib`

## Benefits
- ✅ Custom classes now work on list items
- ✅ Works with any nested element structure
- ✅ More robust selection detection
- ✅ Maintains backward compatibility with fallback logic
- ✅ Properly handles container vs text node distinction




