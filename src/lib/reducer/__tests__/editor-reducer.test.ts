/**
 * Comprehensive tests for the editor reducer.
 *
 * Tests cover all action types, history management, inline formatting,
 * block selection, cover image, and edge cases.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { editorReducer, createInitialState } from '@/lib/reducer/editor-reducer';
import { EditorActions } from '@/lib/reducer/actions';
import { EditorState, ContainerNode, TextNode } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return the current container */
function currentContainer(state: EditorState): ContainerNode {
  return state.current;
}

/** Return the first child of the current container */
function firstChild(state: EditorState): TextNode {
  return currentContainer(state).children[0] as TextNode;
}

/**
 * Build a state that already has a currentSelection set so that inline
 * formatting actions can fire without returning early.
 */
function stateWithSelection(
  text: string,
  start: number,
  end: number,
  nodeId = 'p-1',
): EditorState {
  const state = createInitialState({
    id: 'root',
    type: 'container',
    children: [
      { id: 'h1-1', type: 'h1', content: 'Title' },
      { id: nodeId, type: 'p', content: text },
    ],
  });

  return editorReducer(
    state,
    EditorActions.setCurrentSelection({
      text: text.substring(start, end),
      start,
      end,
      nodeId,
      formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
    }),
  );
}

// ---------------------------------------------------------------------------
// createInitialState
// ---------------------------------------------------------------------------

describe('createInitialState', () => {
  it('creates valid state with a default paragraph when no container is provided', () => {
    const state = createInitialState();

    expect(state.version).toBe('1.0.0');
    expect(state.current).toBeDefined();
    expect(state.undoStack).toHaveLength(0);
    expect(state.redoStack).toHaveLength(0);
    expect(state.hasSelection).toBe(false);
    expect(state.selectionKey).toBe(0);
    expect(state.currentSelection).toBeNull();
    expect(state.coverImage).toBeNull();

    const container = currentContainer(state);
    expect(container.type).toBe('container');
    expect(container.children).toHaveLength(1);

    const defaultNode = firstChild(state);
    expect(defaultNode.type).toBe('p');
    expect(defaultNode.content).toBe('');
    expect(state.activeNodeId).toBe(defaultNode.id);
  });

  it('creates valid state with a default paragraph when no children are passed (undefined)', () => {
    // Passing a partial container without a children key falls back to a default paragraph.
    const state = createInitialState({ id: 'my-doc', type: 'container' });
    const defaultNode = firstChild(state);
    expect(defaultNode.type).toBe('p');
    expect(defaultNode.content).toBe('');
    expect(currentContainer(state).id).toBe('my-doc');
  });

  it('accepts a custom container with children', () => {
    const state = createInitialState({
      id: 'doc',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'My Title' },
        { id: 'p-1', type: 'p', content: 'Hello' },
      ],
    });

    const container = currentContainer(state);
    expect(container.id).toBe('doc');
    expect(container.children).toHaveLength(2);
    expect((container.children[0] as TextNode).content).toBe('My Title');
    expect(state.activeNodeId).toBe('h1-1');
  });
});

// ---------------------------------------------------------------------------
// UPDATE_NODE
// ---------------------------------------------------------------------------

describe('UPDATE_NODE', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates the specified node with partial updates', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'Original' },
      ],
    });

    const next = editorReducer(state, EditorActions.updateNode('h1-1', { content: 'Updated' }));
    expect((currentContainer(next).children[0] as TextNode).content).toBe('Updated');
  });

  it('adds a new history entry', () => {
    const state = createInitialState();
    const next = editorReducer(state, EditorActions.updateNode(firstChild(state).id, { content: 'x' }));
    expect(next.undoStack).toHaveLength(1);
    expect(next.undoStack).toHaveLength(1);
  });

  it('updates metadata.updatedAt to a later timestamp', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    const state = createInitialState();

    vi.setSystemTime(new Date('2024-01-01T00:01:00.000Z'));
    const next = editorReducer(state, EditorActions.updateNode(firstChild(state).id, { content: 'x' }));

    expect(next.metadata?.updatedAt).toBe('2024-01-01T00:01:00.000Z');
    expect(next.metadata?.updatedAt).not.toBe(state.metadata?.updatedAt);
  });
});

// ---------------------------------------------------------------------------
// UPDATE_ATTRIBUTES
// ---------------------------------------------------------------------------

describe('UPDATE_ATTRIBUTES', () => {
  it('merges attributes by default', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'p-1', type: 'p', content: 'Hello', attributes: { className: 'old' } },
      ],
    });

    const next = editorReducer(
      state,
      EditorActions.updateAttributes('p-1', { bold: true }),
    );

    const node = currentContainer(next).children[0] as TextNode;
    expect(node.attributes?.className).toBe('old');
    expect(node.attributes?.bold).toBe(true);
  });

  it('replaces attributes when merge is false', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'p-1', type: 'p', content: 'Hello', attributes: { className: 'old', bold: true } },
      ],
    });

    const next = editorReducer(
      state,
      EditorActions.updateAttributes('p-1', { italic: true }, false),
    );

    const node = currentContainer(next).children[0] as TextNode;
    expect(node.attributes?.className).toBeUndefined();
    expect(node.attributes?.bold).toBeUndefined();
    expect(node.attributes?.italic).toBe(true);
  });

  it('adds a history entry', () => {
    const state = createInitialState();
    const next = editorReducer(state, EditorActions.updateAttributes(firstChild(state).id, { bold: true }));
    expect(next.undoStack).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// UPDATE_CONTENT
// ---------------------------------------------------------------------------

describe('UPDATE_CONTENT', () => {
  it('updates the text content of a text node', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [{ id: 'p-1', type: 'p', content: 'Before' }],
    });

    const next = editorReducer(state, EditorActions.updateContent('p-1', 'After'));
    expect((currentContainer(next).children[0] as TextNode).content).toBe('After');
  });

  it('adds a history entry', () => {
    const state = createInitialState();
    const next = editorReducer(state, EditorActions.updateContent(firstChild(state).id, 'x'));
    expect(next.undoStack).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// DELETE_NODE
// ---------------------------------------------------------------------------

describe('DELETE_NODE', () => {
  it('removes a node', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'Title' },
        { id: 'p-1', type: 'p', content: 'Para' },
      ],
    });

    const next = editorReducer(state, EditorActions.deleteNode('p-1'));
    expect(currentContainer(next).children).toHaveLength(1);
    expect(currentContainer(next).children[0].id).toBe('h1-1');
  });

  it('creates a default empty paragraph when the last remaining node is deleted', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'Title' },
        { id: 'p-1', type: 'p', content: 'Only paragraph' },
      ],
    });

    // Delete the h1 first, leaving just p-1
    const s1 = editorReducer(state, EditorActions.deleteNode('h1-1'));
    // Now delete the only remaining node
    const s2 = editorReducer(s1, EditorActions.deleteNode('p-1'));

    const container = currentContainer(s2);
    expect(container.children).toHaveLength(1);
    expect((container.children[0] as TextNode).type).toBe('p');
    expect((container.children[0] as TextNode).content).toBe('');
    expect(s2.activeNodeId).toBe(container.children[0].id);
  });

  it('creates empty paragraph when deleting the only node at root level', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'Title' },
      ],
    });

    const next = editorReducer(state, EditorActions.deleteNode('h1-1'));
    const container = currentContainer(next);
    // Should still have exactly one child (fallback empty paragraph)
    expect(container.children).toHaveLength(1);
    expect((container.children[0] as TextNode).type).toBe('p');
    expect((container.children[0] as TextNode).content).toBe('');
  });

  it('updates activeNodeId when deleting the currently active node', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'p-first', type: 'p', content: 'First' },
        { id: 'p-second', type: 'p', content: 'Second' },
        { id: 'p-third', type: 'p', content: 'Third' },
      ],
    });

    const withActive = { ...state, activeNodeId: 'p-first' };
    const next = editorReducer(withActive, EditorActions.deleteNode('p-first'));

    const container = currentContainer(next);
    expect(container.children).toHaveLength(2);
    expect(next.activeNodeId).toBe('p-second');
  });

  it('preserves activeNodeId when deleting a non-active node', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'p-first', type: 'p', content: 'First' },
        { id: 'p-second', type: 'p', content: 'Second' },
      ],
    });

    const withActive = { ...state, activeNodeId: 'p-second' };
    const next = editorReducer(withActive, EditorActions.deleteNode('p-first'));

    expect(next.activeNodeId).toBe('p-second');
  });

  it('adds a history entry', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'Title' },
        { id: 'p-1', type: 'p', content: 'Para' },
      ],
    });

    const next = editorReducer(state, EditorActions.deleteNode('p-1'));
    expect(next.undoStack).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// INSERT_NODE
// ---------------------------------------------------------------------------

describe('INSERT_NODE', () => {
  it('inserts a node after a target', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'Title' },
        { id: 'p-1', type: 'p', content: 'Para' },
      ],
    });

    const newNode: TextNode = { id: 'p-new', type: 'p', content: 'Inserted' };
    const next = editorReducer(state, EditorActions.insertNode(newNode, 'h1-1', 'after'));

    const children = currentContainer(next).children;
    expect(children).toHaveLength(3);
    expect(children[1].id).toBe('p-new');
  });

  it('inserts a node before a target', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'Title' },
        { id: 'p-1', type: 'p', content: 'Para' },
      ],
    });

    const newNode: TextNode = { id: 'p-new', type: 'p', content: 'Before Para' };
    const next = editorReducer(state, EditorActions.insertNode(newNode, 'p-1', 'before'));

    const children = currentContainer(next).children;
    expect(children).toHaveLength(3);
    expect(children[1].id).toBe('p-new');
    expect(children[2].id).toBe('p-1');
  });

  it('sets activeNodeId to the newly inserted node', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [{ id: 'h1-1', type: 'h1', content: 'Title' }],
    });

    const newNode: TextNode = { id: 'p-new', type: 'p', content: '' };
    const next = editorReducer(state, EditorActions.insertNode(newNode, 'h1-1', 'after'));
    expect(next.activeNodeId).toBe('p-new');
  });

  it('adds a history entry', () => {
    const state = createInitialState();
    const newNode: TextNode = { id: 'p-new', type: 'p', content: '' };
    const next = editorReducer(state, EditorActions.insertNode(newNode, firstChild(state).id, 'after'));
    expect(next.undoStack).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// MOVE_NODE
// ---------------------------------------------------------------------------

describe('MOVE_NODE', () => {
  it('moves a node to a new position', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'A' },
        { id: 'p-1', type: 'p', content: 'B' },
        { id: 'p-2', type: 'p', content: 'C' },
      ],
    });

    // Move p-2 before p-1 → order should become A, C, B
    const next = editorReducer(state, EditorActions.moveNode('p-2', 'p-1', 'before'));
    const ids = currentContainer(next).children.map((c) => c.id);
    expect(ids).toEqual(['h1-1', 'p-2', 'p-1']);
  });

  it('adds a history entry', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'A' },
        { id: 'p-1', type: 'p', content: 'B' },
      ],
    });

    const next = editorReducer(state, EditorActions.moveNode('p-1', 'h1-1', 'before'));
    expect(next.undoStack).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// SWAP_NODES
// ---------------------------------------------------------------------------

describe('SWAP_NODES', () => {
  it('swaps two children', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'A' },
        { id: 'p-1', type: 'p', content: 'B' },
        { id: 'p-2', type: 'p', content: 'C' },
      ],
    });

    const next = editorReducer(state, EditorActions.swapNodes('h1-1', 'p-2'));
    const ids = currentContainer(next).children.map((c) => c.id);
    expect(ids).toEqual(['p-2', 'p-1', 'h1-1']);
  });

  it('returns the same state if a node is not found', () => {
    const state = createInitialState();
    const next = editorReducer(state, EditorActions.swapNodes('nonexistent-1', 'nonexistent-2'));
    expect(next).toBe(state);
  });

  it('adds a history entry when successful', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'A' },
        { id: 'p-1', type: 'p', content: 'B' },
      ],
    });

    const next = editorReducer(state, EditorActions.swapNodes('h1-1', 'p-1'));
    expect(next.undoStack).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// DUPLICATE_NODE
// ---------------------------------------------------------------------------

describe('DUPLICATE_NODE', () => {
  it('inserts a clone after the original node and gives it the requested new id', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'Title' },
        { id: 'p-1', type: 'p', content: 'Para' },
      ],
    });

    const next = editorReducer(state, EditorActions.duplicateNode('p-1', 'p-1-copy'));
    const children = currentContainer(next).children;
    // A new sibling is inserted after p-1
    expect(children.length).toBeGreaterThan(2);
    const duplicate = children.find((c) => c.id === 'p-1-copy');
    expect(duplicate).toBeDefined();
  });

  it('generates a new id automatically when newId is not provided', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [{ id: 'p-1', type: 'p', content: 'Para' }],
    });

    const next = editorReducer(state, EditorActions.duplicateNode('p-1'));
    const children = currentContainer(next).children;
    // There should be more children than before
    expect(children.length).toBeGreaterThan(1);
    // None of the new nodes should reuse the original id
    const hasOriginalIdDuplicate = children.filter((c) => c.id === 'p-1').length > 1;
    expect(hasOriginalIdDuplicate).toBe(false);
  });

  it('adds a history entry', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [{ id: 'p-1', type: 'p', content: 'Para' }],
    });

    const next = editorReducer(state, EditorActions.duplicateNode('p-1', 'copy'));
    expect(next.undoStack).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// REPLACE_CONTAINER
// ---------------------------------------------------------------------------

describe('REPLACE_CONTAINER', () => {
  it('replaces the entire root container', () => {
    const state = createInitialState();

    const newContainer: ContainerNode = {
      id: 'new-root',
      type: 'container',
      children: [{ id: 'p-new', type: 'p', content: 'New doc' }],
    };

    const next = editorReducer(state, EditorActions.replaceContainer(newContainer));
    expect(currentContainer(next).id).toBe('new-root');
    expect((currentContainer(next).children[0] as TextNode).content).toBe('New doc');
  });

  it('adds a history entry', () => {
    const state = createInitialState();
    const newContainer: ContainerNode = {
      id: 'new-root',
      type: 'container',
      children: [{ id: 'p-new', type: 'p', content: 'x' }],
    };
    const next = editorReducer(state, EditorActions.replaceContainer(newContainer));
    expect(next.undoStack).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// RESET
// ---------------------------------------------------------------------------

describe('RESET', () => {
  it('resets to a fresh initial state', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'Big doc' },
        { id: 'p-1', type: 'p', content: 'Content' },
      ],
    });

    // Make some changes so history grows
    const modified = editorReducer(state, EditorActions.updateContent('p-1', 'Modified'));
    const reset = editorReducer(modified, EditorActions.reset());

    expect(reset.undoStack).toHaveLength(0);
    expect(reset.redoStack).toHaveLength(0);
    expect(currentContainer(reset).children).toHaveLength(1);
    expect(firstChild(reset).type).toBe('p');
  });
});

// ---------------------------------------------------------------------------
// SET_STATE
// ---------------------------------------------------------------------------

describe('SET_STATE', () => {
  it('replaces the entire state', () => {
    const state1 = createInitialState();
    const state2 = createInitialState({
      id: 'root2',
      type: 'container',
      children: [{ id: 'h1-2', type: 'h1', content: 'Another' }],
    });

    const next = editorReducer(state1, EditorActions.setState(state2));
    expect(next).toBe(state2);
  });
});

// ---------------------------------------------------------------------------
// BATCH
// ---------------------------------------------------------------------------

describe('BATCH', () => {
  it('applies multiple actions sequentially', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'A' },
        { id: 'p-1', type: 'p', content: 'B' },
      ],
    });

    const next = editorReducer(
      state,
      EditorActions.batch([
        EditorActions.updateContent('h1-1', 'A-updated'),
        EditorActions.updateContent('p-1', 'B-updated'),
      ]),
    );

    const children = currentContainer(next).children;
    expect((children[0] as TextNode).content).toBe('A-updated');
    expect((children[1] as TextNode).content).toBe('B-updated');
  });

  it('creates a history entry for each action inside the batch', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'A' },
        { id: 'p-1', type: 'p', content: 'B' },
      ],
    });

    const next = editorReducer(
      state,
      EditorActions.batch([
        EditorActions.updateContent('h1-1', 'A-updated'),
        EditorActions.updateContent('p-1', 'B-updated'),
      ]),
    );

    // Each action in the batch pushes to undo stack: 2 actions = 2 entries
    expect(next.undoStack).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// UI-only actions (no history entry expected)
// ---------------------------------------------------------------------------

describe('SET_ACTIVE_NODE', () => {
  it('sets activeNodeId without adding history', () => {
    const state = createInitialState();
    const next = editorReducer(state, EditorActions.setActiveNode('some-id'));

    expect(next.activeNodeId).toBe('some-id');
    expect(next.undoStack).toHaveLength(0);
  });

  it('accepts null to clear the active node', () => {
    const state = createInitialState();
    const next = editorReducer(state, EditorActions.setActiveNode(null));
    expect(next.activeNodeId).toBeNull();
  });
});

describe('SET_SELECTION', () => {
  it('updates hasSelection without adding history', () => {
    const state = createInitialState();
    const next = editorReducer(state, EditorActions.setSelection(true));

    expect(next.hasSelection).toBe(true);
    expect(next.undoStack).toHaveLength(0);
  });
});

describe('INCREMENT_SELECTION_KEY', () => {
  it('increments selectionKey without adding history', () => {
    const state = createInitialState();
    const next = editorReducer(state, EditorActions.incrementSelectionKey());

    expect(next.selectionKey).toBe(1);
    expect(next.undoStack).toHaveLength(0);
  });

  it('increments multiple times correctly', () => {
    const state = createInitialState();
    let s = state;
    for (let i = 0; i < 5; i++) {
      s = editorReducer(s, EditorActions.incrementSelectionKey());
    }
    expect(s.selectionKey).toBe(5);
  });
});

describe('SET_CURRENT_SELECTION', () => {
  it('sets currentSelection and hasSelection without adding history', () => {
    const state = createInitialState();
    const selection = {
      text: 'hello',
      start: 0,
      end: 5,
      nodeId: 'p-1',
      formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
    };

    const next = editorReducer(state, EditorActions.setCurrentSelection(selection));

    expect(next.currentSelection).toEqual(selection);
    expect(next.hasSelection).toBe(true);
    expect(next.undoStack).toHaveLength(0);
  });

  it('clears selection when null is passed', () => {
    const state = createInitialState();
    const s1 = editorReducer(state, EditorActions.setCurrentSelection({
      text: 'hi',
      start: 0,
      end: 2,
      nodeId: 'x',
      formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
    }));
    const s2 = editorReducer(s1, EditorActions.setCurrentSelection(null));

    expect(s2.currentSelection).toBeNull();
    expect(s2.hasSelection).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SELECT_ALL_BLOCKS / CLEAR_BLOCK_SELECTION
// ---------------------------------------------------------------------------

describe('SELECT_ALL_BLOCKS', () => {
  it('selects all block ids without adding history', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'A' },
        { id: 'p-1', type: 'p', content: 'B' },
        { id: 'p-2', type: 'p', content: 'C' },
      ],
    });

    const next = editorReducer(state, EditorActions.selectAllBlocks());

    expect(next.selectedBlocks.size).toBe(3);
    expect(next.selectedBlocks.has('h1-1')).toBe(true);
    expect(next.selectedBlocks.has('p-1')).toBe(true);
    expect(next.selectedBlocks.has('p-2')).toBe(true);
    expect(next.undoStack).toHaveLength(0);
  });
});

describe('CLEAR_BLOCK_SELECTION', () => {
  it('clears all selected blocks without adding history', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'A' },
        { id: 'p-1', type: 'p', content: 'B' },
      ],
    });

    const s1 = editorReducer(state, EditorActions.selectAllBlocks());
    const s2 = editorReducer(s1, EditorActions.clearBlockSelection());

    expect(s2.selectedBlocks.size).toBe(0);
    expect(s2.undoStack).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// DELETE_SELECTED_BLOCKS
// ---------------------------------------------------------------------------

describe('DELETE_SELECTED_BLOCKS', () => {
  it('deletes all selected blocks and clears selection', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'A' },
        { id: 'p-1', type: 'p', content: 'B' },
        { id: 'p-2', type: 'p', content: 'C' },
      ],
    });

    const s1 = editorReducer(state, EditorActions.selectAllBlocks());
    // Deselect h1-1 so we only delete p-1 and p-2
    const s2 = {
      ...s1,
      selectedBlocks: new Set(['p-1', 'p-2']),
    };
    const s3 = editorReducer(s2, EditorActions.deleteSelectedBlocks());

    expect(currentContainer(s3).children).toHaveLength(1);
    expect(currentContainer(s3).children[0].id).toBe('h1-1');
    expect(s3.selectedBlocks.size).toBe(0);
  });

  it('creates a default paragraph when all blocks are deleted', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'p-1', type: 'p', content: 'Only' },
      ],
    });

    const s1 = editorReducer(state, EditorActions.selectAllBlocks());
    const s2 = editorReducer(s1, EditorActions.deleteSelectedBlocks());

    expect(currentContainer(s2).children).toHaveLength(1);
    expect((currentContainer(s2).children[0] as TextNode).type).toBe('p');
    expect(s2.selectedBlocks.size).toBe(0);
  });

  it('returns same state when no blocks are selected', () => {
    const state = createInitialState();
    const next = editorReducer(state, EditorActions.deleteSelectedBlocks());
    expect(next).toBe(state);
  });

  it('adds a history entry', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'A' },
        { id: 'p-1', type: 'p', content: 'B' },
      ],
    });

    const s1 = { ...state, selectedBlocks: new Set(['p-1']) };
    const s2 = editorReducer(s1, EditorActions.deleteSelectedBlocks());
    expect(s2.undoStack).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// TOGGLE_FORMAT
// ---------------------------------------------------------------------------

describe('TOGGLE_FORMAT', () => {
  it('converts plain content to inline children and applies bold to selection', () => {
    const s = stateWithSelection('Hello world', 0, 5);
    const next = editorReducer(s, EditorActions.toggleFormat('bold'));

    const node = currentContainer(next).children.find((c) => c.id === 'p-1') as TextNode;
    expect(node.children).toBeDefined();
    const boldSegment = node.children!.find((ch) => ch.bold);
    expect(boldSegment).toBeDefined();
    expect(boldSegment!.content).toBe('Hello');
  });

  it('creates correct split segments for a partial-word selection', () => {
    // "Hello world": select characters 6-11 ("world")
    const s = stateWithSelection('Hello world', 6, 11);
    const next = editorReducer(s, EditorActions.toggleFormat('italic'));

    const node = currentContainer(next).children.find((c) => c.id === 'p-1') as TextNode;
    const segments = node.children!;
    // Should have: "Hello " (no format), "world" (italic), trailing nbsp
    const nonFormattedFirst = segments[0];
    const italicSegment = segments.find((ch) => ch.italic);
    expect(nonFormattedFirst.content).toBe('Hello ');
    expect(italicSegment!.content).toBe('world');
  });

  it('toggles underline on selection', () => {
    const s = stateWithSelection('Hello', 0, 5);
    const next = editorReducer(s, EditorActions.toggleFormat('underline'));

    const node = currentContainer(next).children.find((c) => c.id === 'p-1') as TextNode;
    const underlined = node.children!.find((ch) => ch.underline);
    expect(underlined).toBeDefined();
  });

  it('toggles strikethrough on selection', () => {
    const s = stateWithSelection('Hello', 0, 5);
    const next = editorReducer(s, EditorActions.toggleFormat('strikethrough'));

    const node = currentContainer(next).children.find((c) => c.id === 'p-1') as TextNode;
    const strikethrough = node.children!.find((ch) => ch.strikethrough);
    expect(strikethrough).toBeDefined();
  });

  it('toggles code on selection', () => {
    const s = stateWithSelection('Hello', 0, 5);
    const next = editorReducer(s, EditorActions.toggleFormat('code'));

    const node = currentContainer(next).children.find((c) => c.id === 'p-1') as TextNode;
    const codeSegment = node.children!.find((ch) => ch.code);
    expect(codeSegment).toBeDefined();
  });

  it('appends trailing non-breaking space when last segment has formatting', () => {
    const s = stateWithSelection('Hello', 0, 5);
    const next = editorReducer(s, EditorActions.toggleFormat('bold'));

    const node = currentContainer(next).children.find((c) => c.id === 'p-1') as TextNode;
    const last = node.children![node.children!.length - 1];
    expect(last.content).toBe('\u00A0');
  });

  it('returns same state when there is no currentSelection', () => {
    const state = createInitialState();
    const next = editorReducer(state, EditorActions.toggleFormat('bold'));
    expect(next).toBe(state);
  });

  it('updates currentSelection formats after toggle', () => {
    const s = stateWithSelection('Hi', 0, 2);
    const next = editorReducer(s, EditorActions.toggleFormat('bold'));
    expect(next.currentSelection?.formats.bold).toBe(true);
  });

  it('adds a history entry', () => {
    const s = stateWithSelection('Hi', 0, 2);
    const next = editorReducer(s, EditorActions.toggleFormat('bold'));
    expect(next.undoStack.length).toBeGreaterThan(s.undoStack.length);
  });
});

// ---------------------------------------------------------------------------
// APPLY_LINK
// ---------------------------------------------------------------------------

describe('APPLY_LINK', () => {
  it('adds href to selection range', () => {
    const s = stateWithSelection('Click here now', 6, 10);
    const next = editorReducer(s, EditorActions.applyLink('https://example.com'));

    const node = currentContainer(next).children.find((c) => c.id === 'p-1') as TextNode;
    const linked = node.children!.find((ch) => ch.href);
    expect(linked).toBeDefined();
    expect(linked!.href).toBe('https://example.com');
    expect(linked!.content).toBe('here');
  });

  it('returns same state when there is no currentSelection', () => {
    const state = createInitialState();
    const next = editorReducer(state, EditorActions.applyLink('https://example.com'));
    expect(next).toBe(state);
  });

  it('adds a history entry', () => {
    const s = stateWithSelection('hello', 0, 5);
    const next = editorReducer(s, EditorActions.applyLink('https://example.com'));
    expect(next.undoStack.length).toBeGreaterThan(s.undoStack.length);
  });
});

// ---------------------------------------------------------------------------
// REMOVE_LINK
// ---------------------------------------------------------------------------

describe('REMOVE_LINK', () => {
  it('removes href from the selection range', () => {
    // First apply a link, then remove it
    const s = stateWithSelection('Click here now', 6, 10);
    const withLink = editorReducer(s, EditorActions.applyLink('https://example.com'));

    // Set selection to the linked segment again
    const withLinkAndSelection = editorReducer(
      withLink,
      EditorActions.setCurrentSelection({
        text: 'here',
        start: 6,
        end: 10,
        nodeId: 'p-1',
        formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
      }),
    );

    const next = editorReducer(withLinkAndSelection, EditorActions.removeLink());

    const node = currentContainer(next).children.find((c) => c.id === 'p-1') as TextNode;
    const children = node.children!;
    const linkedSegment = children.find((ch) => ch.href !== undefined && ch.content === 'here');
    // After removal, href should be undefined
    expect(linkedSegment?.href).toBeUndefined();
  });

  it('returns same state when there is no currentSelection', () => {
    const state = createInitialState();
    const next = editorReducer(state, EditorActions.removeLink());
    expect(next).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// APPLY_CUSTOM_CLASS
// ---------------------------------------------------------------------------

describe('APPLY_CUSTOM_CLASS', () => {
  it('applies a className to the selection range', () => {
    const s = stateWithSelection('Hello world', 0, 5);
    const next = editorReducer(s, EditorActions.applyCustomClass('text-red-500'));

    const node = currentContainer(next).children.find((c) => c.id === 'p-1') as TextNode;
    const classified = node.children!.find((ch) => ch.className?.includes('text-red-500'));
    expect(classified).toBeDefined();
    expect(classified!.content).toBe('Hello');
  });

  it('merges classes with existing className', () => {
    // Build state with an already-classed node
    const baseState = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'Title' },
        {
          id: 'p-1',
          type: 'p',
          content: undefined,
          children: [{ content: 'Hello', className: 'font-bold' }],
        } as TextNode,
      ],
    });

    const s = editorReducer(
      baseState,
      EditorActions.setCurrentSelection({
        text: 'Hello',
        start: 0,
        end: 5,
        nodeId: 'p-1',
        formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
      }),
    );

    const next = editorReducer(s, EditorActions.applyCustomClass('text-red-500'));

    const node = currentContainer(next).children.find((c) => c.id === 'p-1') as TextNode;
    const segment = node.children![0];
    expect(segment.className).toContain('font-bold');
    expect(segment.className).toContain('text-red-500');
  });

  it('returns same state when there is no currentSelection', () => {
    const state = createInitialState();
    const next = editorReducer(state, EditorActions.applyCustomClass('text-blue-500'));
    expect(next).toBe(state);
  });

  it('adds a history entry', () => {
    const s = stateWithSelection('Hi', 0, 2);
    const next = editorReducer(s, EditorActions.applyCustomClass('text-blue-500'));
    expect(next.undoStack.length).toBeGreaterThan(s.undoStack.length);
  });
});

// ---------------------------------------------------------------------------
// APPLY_INLINE_STYLE
// ---------------------------------------------------------------------------

describe('APPLY_INLINE_STYLE', () => {
  it('applies an inline CSS style to the selection range', () => {
    const s = stateWithSelection('Hello world', 0, 5);
    const next = editorReducer(s, EditorActions.applyInlineStyle('color', '#ff0000'));

    const node = currentContainer(next).children.find((c) => c.id === 'p-1') as TextNode;
    const styled = node.children!.find((ch) => ch.styles?.color === '#ff0000');
    expect(styled).toBeDefined();
    expect(styled!.content).toBe('Hello');
  });

  it('merges styles when existing styles are present', () => {
    const baseState = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        { id: 'h1-1', type: 'h1', content: 'Title' },
        {
          id: 'p-1',
          type: 'p',
          content: undefined,
          children: [{ content: 'Styled', styles: { fontSize: '16px' } }],
        } as TextNode,
      ],
    });

    const s = editorReducer(
      baseState,
      EditorActions.setCurrentSelection({
        text: 'Styled',
        start: 0,
        end: 6,
        nodeId: 'p-1',
        formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
      }),
    );

    const next = editorReducer(s, EditorActions.applyInlineStyle('color', '#00ff00'));

    const node = currentContainer(next).children.find((c) => c.id === 'p-1') as TextNode;
    const segment = node.children![0];
    expect(segment.styles?.fontSize).toBe('16px');
    expect(segment.styles?.color).toBe('#00ff00');
  });

  it('returns same state when there is no currentSelection', () => {
    const state = createInitialState();
    const next = editorReducer(state, EditorActions.applyInlineStyle('color', 'red'));
    expect(next).toBe(state);
  });

  it('adds a history entry', () => {
    const s = stateWithSelection('Hi', 0, 2);
    const next = editorReducer(s, EditorActions.applyInlineStyle('fontSize', '24px'));
    expect(next.undoStack.length).toBeGreaterThan(s.undoStack.length);
  });
});

// ---------------------------------------------------------------------------
// APPLY_INLINE_ELEMENT_TYPE
// ---------------------------------------------------------------------------

describe('APPLY_INLINE_ELEMENT_TYPE', () => {
  it('applies element type to the selection range', () => {
    const s = stateWithSelection('Hello world', 0, 5);
    const next = editorReducer(s, EditorActions.applyInlineElementType('h2'));

    const node = currentContainer(next).children.find((c) => c.id === 'p-1') as TextNode;
    const h2Segment = node.children!.find((ch) => ch.elementType === 'h2');
    expect(h2Segment).toBeDefined();
    expect(h2Segment!.content).toBe('Hello');
  });

  it('returns same state when there is no currentSelection', () => {
    const state = createInitialState();
    const next = editorReducer(state, EditorActions.applyInlineElementType('h2'));
    expect(next).toBe(state);
  });

  it('adds a history entry', () => {
    const s = stateWithSelection('Hi', 0, 2);
    const next = editorReducer(s, EditorActions.applyInlineElementType('blockquote'));
    expect(next.undoStack.length).toBeGreaterThan(s.undoStack.length);
  });
});

// ---------------------------------------------------------------------------
// UNDO / REDO
// ---------------------------------------------------------------------------

describe('UNDO', () => {
  it('moves entry from undoStack to redoStack', () => {
    const state = createInitialState();
    const s1 = editorReducer(state, EditorActions.updateContent(firstChild(state).id, 'step 1'));
    const s2 = editorReducer(s1, EditorActions.updateContent(firstChild(s1).id, 'step 2'));

    expect(s2.undoStack).toHaveLength(2);

    const undone = editorReducer(s2, EditorActions.undo());
    expect(undone.undoStack).toHaveLength(1);
    expect(undone.redoStack).toHaveLength(1);
  });

  it('restores the previous container after undo', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [{ id: 'p-1', type: 'p', content: 'Original' }],
    });

    const s1 = editorReducer(state, EditorActions.updateContent('p-1', 'Modified'));
    const undone = editorReducer(s1, EditorActions.undo());

    expect((currentContainer(undone).children[0] as TextNode).content).toBe('Original');
  });

  it('returns same state when undoStack is empty', () => {
    const state = createInitialState();
    const next = editorReducer(state, EditorActions.undo());
    expect(next).toBe(state);
  });
});

describe('REDO', () => {
  it('moves entry from redoStack back to undoStack', () => {
    const state = createInitialState();
    const s1 = editorReducer(state, EditorActions.updateContent(firstChild(state).id, 'step 1'));
    const undone = editorReducer(s1, EditorActions.undo());

    const redone = editorReducer(undone, EditorActions.redo());
    expect(redone.undoStack).toHaveLength(1);
    expect(redone.redoStack).toHaveLength(0);
  });

  it('restores the future container after redo', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [{ id: 'p-1', type: 'p', content: 'Original' }],
    });

    const s1 = editorReducer(state, EditorActions.updateContent('p-1', 'Modified'));
    const undone = editorReducer(s1, EditorActions.undo());
    const redone = editorReducer(undone, EditorActions.redo());

    expect((currentContainer(redone).children[0] as TextNode).content).toBe('Modified');
  });

  it('returns same state when already at the latest history entry', () => {
    const state = createInitialState();
    const next = editorReducer(state, EditorActions.redo());
    expect(next).toBe(state);
  });
});

describe('History truncation after undo + new action', () => {
  it('truncates future history when a new action is dispatched after undo', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [{ id: 'p-1', type: 'p', content: 'A' }],
    });

    const s1 = editorReducer(state, EditorActions.updateContent('p-1', 'B'));
    const s2 = editorReducer(s1, EditorActions.updateContent('p-1', 'C'));
    // history: [A, B, C], index: 2

    const undone = editorReducer(s2, EditorActions.undo());
    // index: 1, "future" has C

    const s3 = editorReducer(undone, EditorActions.updateContent('p-1', 'D'));
    // undoStack: [A→B, B→D] (redo for C is gone), current: D
    expect(s3.undoStack).toHaveLength(2);
    expect(s3.redoStack).toHaveLength(0);
    expect((currentContainer(s3).children[0] as TextNode).content).toBe('D');
  });
});

// ---------------------------------------------------------------------------
// COVER IMAGE
// ---------------------------------------------------------------------------

describe('SET_COVER_IMAGE', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets the cover image', () => {
    const state = createInitialState();
    const coverImage = { url: 'https://example.com/img.jpg', alt: 'Cover', position: 50 };
    const next = editorReducer(state, EditorActions.setCoverImage(coverImage));

    expect(next.coverImage).toEqual(coverImage);
  });

  it('does not add a history entry', () => {
    const state = createInitialState();
    const coverImage = { url: 'https://example.com/img.jpg' };
    const next = editorReducer(state, EditorActions.setCoverImage(coverImage));
    expect(next.undoStack).toHaveLength(0);
  });

  it('updates metadata.updatedAt to a later timestamp', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-01T12:00:00.000Z'));
    const state = createInitialState();

    vi.setSystemTime(new Date('2024-06-01T12:05:00.000Z'));
    const next = editorReducer(state, EditorActions.setCoverImage({ url: 'x' }));

    expect(next.metadata?.updatedAt).toBe('2024-06-01T12:05:00.000Z');
    expect(next.metadata?.updatedAt).not.toBe(state.metadata?.updatedAt);
  });
});

describe('REMOVE_COVER_IMAGE', () => {
  it('removes the cover image', () => {
    const state = createInitialState();
    const s1 = editorReducer(state, EditorActions.setCoverImage({ url: 'https://example.com/img.jpg' }));
    const s2 = editorReducer(s1, EditorActions.removeCoverImage());

    expect(s2.coverImage).toBeNull();
  });

  it('does not add a history entry', () => {
    const state = createInitialState();
    const s1 = editorReducer(state, EditorActions.setCoverImage({ url: 'x' }));
    const s2 = editorReducer(s1, EditorActions.removeCoverImage());
    expect(s2.undoStack).toHaveLength(0);
  });
});

describe('UPDATE_COVER_IMAGE_POSITION', () => {
  it('updates the vertical position of the cover image', () => {
    const state = createInitialState();
    const s1 = editorReducer(state, EditorActions.setCoverImage({ url: 'https://example.com/img.jpg', position: 50 }));
    const s2 = editorReducer(s1, EditorActions.updateCoverImagePosition(75));

    expect(s2.coverImage?.position).toBe(75);
    expect(s2.coverImage?.url).toBe('https://example.com/img.jpg');
  });

  it('returns same state when there is no cover image', () => {
    const state = createInitialState();
    const next = editorReducer(state, EditorActions.updateCoverImagePosition(50));
    expect(next).toBe(state);
  });

  it('does not add a history entry', () => {
    const state = createInitialState();
    const s1 = editorReducer(state, EditorActions.setCoverImage({ url: 'x', position: 0 }));
    const s2 = editorReducer(s1, EditorActions.updateCoverImagePosition(25));
    expect(s2.undoStack).toHaveLength(0);
  });
});
