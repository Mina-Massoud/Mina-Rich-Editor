# Deep Dive: Why Full-Snapshot Undo/Redo is a Memory Bomb (and How to Fix It)

> A technical walkthrough for mid-level frontend engineers who want to understand state management at a senior level.

---

## The Problem: You're Cloning the World on Every Keystroke

Imagine you're writing a document with 200 paragraphs. Every time you type a single character, the editor needs to save a "snapshot" so you can undo later.

Here's what our editor was doing:

```typescript
interface EditorState {
  history: ContainerNode[];  // Array of FULL document snapshots
  historyIndex: number;      // Which snapshot are we on?
}
```

Every edit → push a new `ContainerNode` (the entire document tree) into the `history` array. Undo → decrement `historyIndex`. Redo → increment.

**Simple, right?** Yes. But catastrophically wasteful.

### The Math

| Document | Snapshot Size | 100 Undos | Memory Used |
|----------|--------------|-----------|-------------|
| Small (10 blocks) | ~50KB | 100 × 50KB | **5MB** |
| Medium (100 blocks) | ~500KB | 100 × 500KB | **50MB** |
| Large (500 blocks) | ~2.5MB | 100 × 2.5MB | **250MB** |

Your user's browser tab is eating 250MB just to support Ctrl+Z on a large document. That's a tab crash waiting to happen.

### "But We Use Structural Sharing!"

True — we don't deep-clone every node. When you edit paragraph 42 in a 200-paragraph document, our `updateNodeById` function only creates new objects for:

1. Paragraph 42 (the changed node) — **new object**
2. Its parent container (because a child reference changed) — **new object**
3. The root container (same reason) — **new object**

The other 199 paragraphs? Same references as before. No cloning.

```
Before edit:
history[0] → root → [p1, p2, ..., p42_old, ..., p200]

After edit:
history[1] → root_new → [p1, p2, ..., p42_new, ..., p200]
                          ↑                         ↑
                     same references          same references
```

**Structural sharing saves us ~80% of the memory per snapshot.** But you're still storing 100 root container objects, each referencing the full children array. For a 500-block document, that's still ~50MB.

**The senior insight:** Structural sharing is a band-aid on a fundamentally wrong data structure choice. The right answer isn't "clone less" — it's "don't clone at all."

---

## The Solution: Store Operations, Not Snapshots

Instead of saving what the document LOOKS LIKE at every point, save what CHANGED.

### Before (Snapshots)

```
history = [
  ContainerNode { children: [200 nodes] },  // state after edit 1
  ContainerNode { children: [200 nodes] },  // state after edit 2
  ContainerNode { children: [200 nodes] },  // state after edit 3
  ... 100 more ...
]
```

### After (Operations)

```
current = ContainerNode { children: [200 nodes] }  // just ONE copy

undoStack = [
  { forward: "set p42.content to 'hello'",  backward: "set p42.content to 'hell'" },
  { forward: "set p42.content to 'hell'",   backward: "set p42.content to 'hel'" },
  { forward: "insert p201 after p200",      backward: "delete p201" },
]
```

**Memory:**
- Before: 100 × 500KB = **50MB**
- After: 1 × 500KB + 100 × ~5KB = **1MB**
- Savings: **~50x**

### How Undo Works Now

```
OLD: historyIndex-- (swap pointer to previous snapshot)
NEW: pop from undoStack, apply the backward operation, push to redoStack
```

Example — undo typing "o" at end of "hello":

```typescript
// undoStack.pop() returns:
{
  forward: { type: 'update_node', id: 'p42', changes: { content: 'hello' } },
  backward: { type: 'update_node', id: 'p42', changes: { content: 'hell' } },
}

// Apply backward:
// Find node p42, set content = 'hell'
// Push the entry to redoStack
```

---

## The Design: HistoryOperation Type

The key insight: every editor action can be described as a small operation that knows how to undo itself.

```typescript
type HistoryOperation =
  | { type: 'update_node'; id: string; changes: Partial<EditorNode> }
  | { type: 'insert_node'; node: EditorNode; targetId: string; position: 'before' | 'after' }
  | { type: 'delete_node'; node: EditorNode; parentId: string; index: number }
  | { type: 'move_node'; nodeId: string; from: { parentId: string; index: number }; to: { parentId: string; index: number } }
  | { type: 'replace_container'; container: ContainerNode }
  | { type: 'batch'; operations: HistoryOperation[] }
```

Each entry in the undo stack has TWO operations:

```typescript
interface HistoryEntry {
  forward: HistoryOperation;   // What we did (for redo)
  backward: HistoryOperation;  // How to undo it
  timestamp: number;
}
```

### How Every Editor Action Maps to Operations

| Action | Forward Operation | Backward Operation |
|--------|------------------|-------------------|
| Type a character | `update_node(id, { content: 'hello' })` | `update_node(id, { content: 'hell' })` |
| Press Enter (split) | `batch([update(id, before), insert(new, after)])` | `batch([delete(new), update(id, original)])` |
| Delete a block | `delete_node(node, parentId, index)` | `insert_node(node, sibling, 'after')` |
| Apply bold | `update_node(id, { children: [...withBold] })` | `update_node(id, { children: [...withoutBold] })` |
| Drag reorder | `move_node(id, from, to)` | `move_node(id, to, from)` |

**The pattern:** Before you make a change, capture the current state of what you're about to change. That becomes the backward operation.

---

## Why This Unlocks Collaboration

With snapshots, you can only answer: "What does the document look like?"
With operations, you can answer: "What did each user DO?"

This is the difference between a photograph and a recipe. A photograph shows the result. A recipe tells you the steps — and steps can be merged, reordered, and replayed.

### Y.js (CRDT) needs operations

```
User A types "hello" in paragraph 1
User B types "world" in paragraph 5

With snapshots:
  A's snapshot: { p1: "hello", p5: "" }
  B's snapshot: { p1: "", p5: "world" }
  CONFLICT: which snapshot wins? 💥

With operations:
  A's op: update(p1, content: "hello")
  B's op: update(p5, content: "world")
  MERGE: both ops apply cleanly ✅
```

Y.js is a CRDT (Conflict-free Replicated Data Type) library that merges operations automatically. But it needs to receive operations, not snapshots. Once we track operations, Y.js integration becomes a translation layer: our `HistoryOperation` → Y.js mutations.

---

## Implementation: The `addToHistory` Transformation

### Before

```typescript
// src/lib/reducer/operations/shared.ts

export function addToHistory(
  state: EditorState,
  newContainer: ContainerNode
): EditorState {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(newContainer);
  if (newHistory.length > MAX_HISTORY_SIZE) {
    newHistory.shift();
  }
  return {
    ...state,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}
```

**Problem:** Takes only `newContainer` — no idea what changed.

### After

```typescript
export function addToHistory(
  state: EditorState,
  newContainer: ContainerNode,
  entry: HistoryEntry
): EditorState {
  const newUndoStack = [...state.undoStack, entry];
  if (newUndoStack.length > MAX_HISTORY_SIZE) {
    newUndoStack.shift();
  }
  return {
    ...state,
    current: newContainer,
    undoStack: newUndoStack,
    redoStack: [],  // Clear redo on new action (standard behavior)
  };
}
```

**Key change:** Every caller must now pass a `HistoryEntry` describing what changed.

### Example: How `handleUpdateContent` changes

```typescript
// Before:
export function handleUpdateContent(state, payload) {
  const { id, content } = payload;
  const container = state.history[state.historyIndex];
  const newContainer = updateNodeById(container, id, (node) => ({ content }));
  return addToHistory(state, newContainer);
}

// After:
export function handleUpdateContent(state, payload) {
  const { id, content } = payload;
  const container = state.current;

  // Capture before-state for undo
  const oldNode = findNodeById(container, id);
  const oldContent = (oldNode as TextNode)?.content ?? '';

  const newContainer = updateNodeById(container, id, (node) => ({ content }));

  return addToHistory(state, newContainer, {
    forward: { type: 'update_node', id, changes: { content } },
    backward: { type: 'update_node', id, changes: { content: oldContent } },
    timestamp: Date.now(),
  });
}
```

**The pattern for every handler:**
1. Read the current value of what you're about to change
2. Make the change
3. Record both the forward and backward operations

---

## The Senior Lesson

### Why junior/mid-level engineers reach for snapshots first

Snapshots are **conceptually simple**. You don't have to think about what changed — just save everything. The code is shorter, easier to debug (you can inspect any snapshot), and undo is literally just swapping an array index.

### Why senior engineers move to operations

1. **Memory scales linearly** with snapshots. Operations scale with edit count, not document size.
2. **Operations compose.** You can batch, merge, transform, and replay them. Snapshots are opaque blobs.
3. **Operations enable collaboration.** You can't merge two snapshots. You CAN merge two operation streams.
4. **Operations are the building block** for undo grouping (merge rapid keystrokes into one undo), selective undo (undo just formatting, keep text), and persistent undo (save operations to disk, undo across sessions).

### The tradeoff you're accepting

| | Snapshots | Operations |
|---|-----------|------------|
| Code simplicity | ✅ Simple | ❌ Complex (every handler has 2 extra lines) |
| Debugging | ✅ Inspect any state | ❌ Must replay operations |
| Memory | ❌ O(n × doc_size) | ✅ O(n × op_size) |
| Undo speed | ✅ O(1) swap | ✅ O(1) apply single op |
| Collaboration | ❌ Impossible | ✅ Enabled |
| Undo grouping | ❌ Hard (which snapshots to merge?) | ✅ Easy (merge operation entries) |

**The senior decision:** Accept more code complexity now to unlock capabilities that would be impossible to retrofit later.

---

## What ProseMirror/TipTap Does (For Reference)

ProseMirror uses a concept called **Steps** — atomic document transformations.

```
Transaction = [Step1, Step2, Step3, ...]
```

Each Step knows how to:
- `apply(doc)` → produce a new document
- `invert(doc)` → produce the reverse step
- `map(mapping)` → rebase against concurrent changes

TipTap's undo plugin stores inverted steps, grouped into "items" with a 500ms grouping window (rapid typing = one undo entry).

Our approach is similar in spirit but simpler — we don't need ProseMirror's position mapping system because we identify nodes by ID, not by document position. This is actually an advantage: ID-based operations are easier to merge in collaborative settings.

---

*Written as part of the Mina Rich Editor revival project. See `REVIVAL_PLAN.md` for the full roadmap.*
