# Performance Fix: Structural Sharing & Re-render Optimization

## The Problem

When typing in one block, **ALL blocks were re-rendering**, causing performance issues. This happened even though we:
- ✅ Had proper immutable update logic in `updateNodeById`
- ✅ Implemented structural sharing (unchanged nodes keep their references)
- ✅ Used Zustand with selectors

## The Root Cause

The culprit was in `src/lib/reducer/editor-reducer.ts`:

```typescript
function deepCloneContainer(container: ContainerNode): ContainerNode {
  return JSON.parse(JSON.stringify(container));  // ❌ DESTROYING ALL REFERENCES!
}

function addToHistory(state: EditorState, newContainer: ContainerNode): EditorState {
  const clonedContainer = deepCloneContainer(newContainer);  // ❌ PROBLEM!
  // ...
}
```

### What Was Happening:

1. **User types in Block A**
2. `updateNodeById` creates new tree with **structural sharing**:
   - Block A: ✨ **new reference** (content changed)
   - Block B: ♻️ **same reference** (unchanged)
   - Block C: ♻️ **same reference** (unchanged)
3. Tree is passed to `addToHistory()`
4. `deepCloneContainer()` does `JSON.parse(JSON.stringify())` 💥
5. **ALL nodes get NEW references**:
   - Block A: 🆕 new reference
   - Block B: 🆕 new reference (even though it didn't change!)
   - Block C: 🆕 new reference (even though it didn't change!)
6. Zustand detects ALL nodes changed (by reference)
7. **ALL blocks re-render** 😫

## The Solution

**Remove the deep clone!** The tree operations already return immutable structures with structural sharing.

### Before:
```typescript
function addToHistory(state: EditorState, newContainer: ContainerNode): EditorState {
  const clonedContainer = deepCloneContainer(newContainer);  // ❌ Destroying structural sharing
  newHistory.push(clonedContainer);
  // ...
}
```

### After:
```typescript
function addToHistory(state: EditorState, newContainer: ContainerNode): EditorState {
  // No need to clone - the container is already immutable from tree operations
  newHistory.push(newContainer);  // ✅ Preserves structural sharing!
  // ...
}
```

## How It Works Now

### 1. **Structural Sharing in Tree Operations**

The `updateNodeById` function (in `src/lib/utils/tree-operations.ts`) preserves references for unchanged nodes:

```typescript
export function updateNodeById(node: EditorNode, targetId: string, updater): EditorNode {
  if (node.id === targetId) {
    return { ...node, ...updater(node) };  // ✨ New reference (changed)
  }

  if (isContainerNode(node)) {
    const newChildren = node.children.map((child) =>
      updateNodeById(child, targetId, updater)
    );

    // 🔑 KEY: Only create new object if children actually changed
    const childrenChanged = newChildren.some(
      (newChild, index) => newChild !== node.children[index]
    );

    if (childrenChanged) {
      return { ...node, children: newChildren };  // ✨ New reference (path to change)
    }
  }

  return node;  // ♻️ Same reference (unchanged)
}
```

### 2. **Zustand Selectors with Reference Equality**

Each block uses `useZustandNode(nodeId)` which subscribes to that specific node:

```typescript
export function useZustandNode(nodeId: string): EditorNode | undefined {
  return useEditorStore((state) => {
    const container = state.history[state.historyIndex];
    return findNodeById(container, nodeId);
  });
}
```

Zustand compares the **returned node reference**:
- If reference is the same → ✅ **Skip re-render**
- If reference is different → 🔄 **Re-render**

### 3. **The Complete Flow**

**When you type in Block A:**

```
1. User types "h" in Block A
   ↓
2. handleContentChange() dispatches UPDATE_NODE action
   ↓
3. Reducer calls updateNodeById()
   ├─ Block A: new reference ✨ (content changed)
   ├─ Block B: same reference ♻️ (unchanged)
   └─ Block C: same reference ♻️ (unchanged)
   ↓
4. addToHistory() adds to history (NO cloning!)
   ↓
5. Zustand updates store state
   ↓
6. Each BlockZustand component checks its node:
   ├─ Block A: useZustandNode("block-a") → new reference → ✅ RE-RENDER
   ├─ Block B: useZustandNode("block-b") → same reference → ❌ SKIP
   └─ Block C: useZustandNode("block-c") → same reference → ❌ SKIP
```

## Key Concepts

### 1. **Structural Sharing**
Only the nodes on the **path to the change** get new references:
```
Root (new)
├─ Section (new)
│  ├─ Block A (new) ← changed!
│  ├─ Block B (same) ← unchanged
│  └─ Block C (same) ← unchanged
└─ Section (same)
   └─ Block D (same)
```

### 2. **Reference Equality**
JavaScript compares objects by reference:
```typescript
const objA = { x: 1 };
const objB = { x: 1 };
objA === objB // false (different references)

const objC = objA;
objA === objC // true (same reference)
```

### 3. **Zustand's Default Equality Check**
Zustand uses `Object.is()` (reference equality) by default:
```typescript
// This component only re-renders when node reference changes
const node = useEditorStore(state => findNodeById(state.container, nodeId));
```

## Benefits of This Approach

1. ✅ **Massive Performance Improvement**
   - Only changed blocks re-render
   - 100+ blocks? Only 1 re-renders on typing

2. ✅ **Memory Efficient**
   - Unchanged nodes are shared across history states
   - Less garbage collection

3. ✅ **Predictable Behavior**
   - Reference equality = clear re-render rules
   - Easy to debug with React DevTools

4. ✅ **Works with Undo/Redo**
   - History preserves structural sharing
   - Efficient memory usage even with long history

## Testing the Fix

Open the browser console and type in one block:

```
✅ CORRECT (After fix):
🔄 [BlockZustand h1-10000] Render #1 - NODE CHANGED
⚠️ [BlockZustand blockquo] Render #1 - NODE SAME BUT RE-RENDERED!  // Initial render only
⚠️ [BlockZustand img-1000] Render #1 - NODE SAME BUT RE-RENDERED!  // Initial render only

[User types...]

🔄 [BlockZustand h1-10000] Render #2 - NODE CHANGED  // Only this block!
// Other blocks: no logs = no re-renders ✅

❌ INCORRECT (Before fix):
🔄 [BlockZustand h1-10000] Render #2 - NODE CHANGED
🔄 [BlockZustand blockquo] Render #2 - NODE CHANGED   // ❌ Shouldn't change!
🔄 [BlockZustand img-1000] Render #2 - NODE CHANGED   // ❌ Shouldn't change!
// All blocks re-render ❌
```

## Lessons Learned

1. **Don't deep clone immutable data** - it destroys performance optimizations
2. **Structural sharing is powerful** - but fragile if you clone
3. **Reference equality is fast** - much faster than deep equality checks
4. **Trust your immutable operations** - if they return new objects correctly, no need to clone
5. **Deep cloning has its place** - but NOT in hot paths like state updates

## Related Files Modified

- ✅ `src/lib/reducer/editor-reducer.ts` - Removed `deepCloneContainer()`
- ✅ `src/lib/store/editor-store.ts` - Created Zustand store with optimized selectors
- ✅ `src/components/BlockZustand.tsx` - Block component that fetches its own data
- ✅ `src/components/EditorZustandTest.tsx` - Test editor using optimized approach

## Next Steps

Now that the performance issue is fixed, you can:

1. ✅ Migrate the main `Block.tsx` component to use this approach
2. ✅ Update `Editor.tsx` to pass `nodeId` instead of full `node` objects
3. ✅ Remove the old Context-based approach
4. ✅ Enjoy smooth editing with hundreds of blocks!

