import { describe, it, expect, beforeEach } from 'vitest';
import { resetIdCounter } from '@/lib/utils/id-generator';
import { editorReducer, createInitialState } from '@/lib/reducer/editor-reducer';
import { EditorActions } from '@/lib/reducer/actions';
import { TextNode, ContainerNode } from '@/lib/types';
import { createTestState } from './test-helpers';
import { findNodeById } from '@/lib/utils/tree-operations';

beforeEach(() => {
  resetIdCounter();
});

describe('handleUndo', () => {
  it('returns state when undoStack is empty', () => {
    const state = createTestState();
    expect(state.undoStack).toHaveLength(0);
    const result = editorReducer(state, EditorActions.undo());
    expect(result).toBe(state);
  });

  it('applies backward operation', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Original' } as TextNode,
    ]);
    const after = editorReducer(state, EditorActions.updateContent('p-1', 'Changed'));
    const undone = editorReducer(after, EditorActions.undo());
    const node = findNodeById(undone.current, 'p-1') as TextNode;
    expect(node.content).toBe('Original');
  });

  it('pops from undoStack', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Hello' } as TextNode,
    ]);
    const after = editorReducer(state, EditorActions.updateContent('p-1', 'Changed'));
    expect(after.undoStack).toHaveLength(1);
    const undone = editorReducer(after, EditorActions.undo());
    expect(undone.undoStack).toHaveLength(0);
  });

  it('pushes entry to redoStack', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Hello' } as TextNode,
    ]);
    const after = editorReducer(state, EditorActions.updateContent('p-1', 'Changed'));
    expect(after.redoStack).toHaveLength(0);
    const undone = editorReducer(after, EditorActions.undo());
    expect(undone.redoStack).toHaveLength(1);
  });
});

describe('handleRedo', () => {
  it('returns state when redoStack is empty', () => {
    const state = createTestState();
    const result = editorReducer(state, EditorActions.redo());
    expect(result).toBe(state);
  });

  it('applies forward operation', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Original' } as TextNode,
    ]);
    const after = editorReducer(state, EditorActions.updateContent('p-1', 'Changed'));
    const undone = editorReducer(after, EditorActions.undo());
    const redone = editorReducer(undone, EditorActions.redo());
    const node = findNodeById(redone.current, 'p-1') as TextNode;
    expect(node.content).toBe('Changed');
  });

  it('pops from redoStack', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Hello' } as TextNode,
    ]);
    const after = editorReducer(state, EditorActions.updateContent('p-1', 'Changed'));
    const undone = editorReducer(after, EditorActions.undo());
    expect(undone.redoStack).toHaveLength(1);
    const redone = editorReducer(undone, EditorActions.redo());
    expect(redone.redoStack).toHaveLength(0);
  });

  it('pushes entry to undoStack', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Hello' } as TextNode,
    ]);
    const after = editorReducer(state, EditorActions.updateContent('p-1', 'Changed'));
    const undone = editorReducer(after, EditorActions.undo());
    expect(undone.undoStack).toHaveLength(0);
    const redone = editorReducer(undone, EditorActions.redo());
    expect(redone.undoStack).toHaveLength(1);
  });
});

describe('handleReplaceContainer', () => {
  it('replaces container with new one', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Original' } as TextNode,
    ]);
    const newContainer: ContainerNode = {
      id: 'root',
      type: 'container',
      children: [{ id: 'p-2', type: 'p', content: 'Replaced' } as TextNode],
    };
    const result = editorReducer(state, EditorActions.replaceContainer(newContainer));
    expect(result.current.children[0].id).toBe('p-2');
    expect((result.current.children[0] as TextNode).content).toBe('Replaced');
  });

  it('records undo with old container', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Original' } as TextNode,
    ]);
    const newContainer: ContainerNode = {
      id: 'root',
      type: 'container',
      children: [{ id: 'p-2', type: 'p', content: 'Replaced' } as TextNode],
    };
    const result = editorReducer(state, EditorActions.replaceContainer(newContainer));
    expect(result.undoStack).toHaveLength(1);
    const backward = result.undoStack[0].backward;
    expect(backward.type).toBe('replace_container');
  });

  it('updates timestamp', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Original' } as TextNode,
    ]);
    const newContainer: ContainerNode = {
      id: 'root',
      type: 'container',
      children: [{ id: 'p-2', type: 'p', content: 'Replaced' } as TextNode],
    };
    const result = editorReducer(state, EditorActions.replaceContainer(newContainer));
    expect(result.metadata?.updatedAt).toBeDefined();
  });
});

describe('undo/redo round-trip', () => {
  it('restores state after undo then redo', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Original' } as TextNode,
    ]);
    const changed = editorReducer(state, EditorActions.updateContent('p-1', 'Changed'));
    const undone = editorReducer(changed, EditorActions.undo());
    const redone = editorReducer(undone, EditorActions.redo());
    const node = findNodeById(redone.current, 'p-1') as TextNode;
    expect(node.content).toBe('Changed');
  });

  it('handles multiple undo operations correctly', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'v1' } as TextNode,
    ]);
    const v2 = editorReducer(state, EditorActions.updateContent('p-1', 'v2'));
    const v3 = editorReducer(v2, EditorActions.updateContent('p-1', 'v3'));
    expect(v3.undoStack).toHaveLength(2);

    const undo1 = editorReducer(v3, EditorActions.undo());
    expect((findNodeById(undo1.current, 'p-1') as TextNode).content).toBe('v2');

    const undo2 = editorReducer(undo1, EditorActions.undo());
    expect((findNodeById(undo2.current, 'p-1') as TextNode).content).toBe('v1');
  });

  it('new action after undo clears redoStack', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'v1' } as TextNode,
    ]);
    const v2 = editorReducer(state, EditorActions.updateContent('p-1', 'v2'));
    const v3 = editorReducer(v2, EditorActions.updateContent('p-1', 'v3'));

    const undone = editorReducer(v3, EditorActions.undo());
    expect(undone.redoStack).toHaveLength(1);

    // New action should clear redo stack
    const v4 = editorReducer(undone, EditorActions.updateContent('p-1', 'v4'));
    expect(v4.redoStack).toHaveLength(0);

    // Redo should be a no-op now
    const redoAfter = editorReducer(v4, EditorActions.redo());
    expect(redoAfter).toBe(v4);
  });
});
