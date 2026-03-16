import { describe, it, expect, beforeEach } from 'vitest';
import { resetIdCounter } from '@/lib/utils/id-generator';
import { editorReducer } from '@/lib/reducer/editor-reducer';
import { EditorActions } from '@/lib/reducer/actions';
import { TextNode } from '@/lib/types';
import { createTestState } from './test-helpers';

beforeEach(() => {
  resetIdCounter();
});

describe('handleSetActiveNode', () => {
  it('sets activeNodeId', () => {
    const state = createTestState();
    const result = editorReducer(state, EditorActions.setActiveNode('p-1'));
    expect(result.activeNodeId).toBe('p-1');
  });

  it('sets null', () => {
    const state = createTestState();
    const withActive = editorReducer(state, EditorActions.setActiveNode('p-1'));
    const result = editorReducer(withActive, EditorActions.setActiveNode(null));
    expect(result.activeNodeId).toBeNull();
  });
});

describe('handleSetSelection', () => {
  it('sets hasSelection true', () => {
    const state = createTestState();
    const result = editorReducer(state, EditorActions.setSelection(true));
    expect(result.hasSelection).toBe(true);
  });

  it('sets hasSelection false', () => {
    const state = createTestState();
    const withSel = editorReducer(state, EditorActions.setSelection(true));
    const result = editorReducer(withSel, EditorActions.setSelection(false));
    expect(result.hasSelection).toBe(false);
  });
});

describe('handleIncrementSelectionKey', () => {
  it('increments selectionKey from 0', () => {
    const state = createTestState();
    expect(state.selectionKey).toBe(0);
    const result = editorReducer(state, EditorActions.incrementSelectionKey());
    expect(result.selectionKey).toBe(1);
  });

  it('increments from existing value', () => {
    const state = createTestState();
    const inc1 = editorReducer(state, EditorActions.incrementSelectionKey());
    const inc2 = editorReducer(inc1, EditorActions.incrementSelectionKey());
    expect(inc2.selectionKey).toBe(2);
  });
});

describe('handleSetCurrentSelection', () => {
  it('sets selection info', () => {
    const state = createTestState();
    const selection = {
      text: 'Hello',
      start: 0,
      end: 5,
      nodeId: 'p-1',
      formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
    };
    const result = editorReducer(state, EditorActions.setCurrentSelection(selection));
    expect(result.currentSelection).toEqual(selection);
  });

  it('sets null, also sets hasSelection false', () => {
    const state = createTestState();
    const withSel = editorReducer(
      state,
      EditorActions.setCurrentSelection({
        text: 'Hello',
        start: 0,
        end: 5,
        nodeId: 'p-1',
        formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
      }),
    );
    expect(withSel.hasSelection).toBe(true);
    const result = editorReducer(withSel, EditorActions.setCurrentSelection(null));
    expect(result.currentSelection).toBeNull();
    expect(result.hasSelection).toBe(false);
  });

  it('sets non-null, also sets hasSelection true', () => {
    const state = createTestState();
    expect(state.hasSelection).toBe(false);
    const result = editorReducer(
      state,
      EditorActions.setCurrentSelection({
        text: 'Hello',
        start: 0,
        end: 5,
        nodeId: 'p-1',
        formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
      }),
    );
    expect(result.hasSelection).toBe(true);
  });
});

describe('handleSelectAllBlocks', () => {
  it('selects all children ids', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'One' } as TextNode,
    ]);
    const result = editorReducer(state, EditorActions.selectAllBlocks());
    expect(result.selectedBlocks.has('p-1')).toBe(true);
    expect(result.selectedBlocks.size).toBe(1);
  });

  it('works with multiple children', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'One' } as TextNode,
      { id: 'p-2', type: 'p', content: 'Two' } as TextNode,
      { id: 'p-3', type: 'p', content: 'Three' } as TextNode,
    ]);
    const result = editorReducer(state, EditorActions.selectAllBlocks());
    expect(result.selectedBlocks.size).toBe(3);
    expect(result.selectedBlocks.has('p-1')).toBe(true);
    expect(result.selectedBlocks.has('p-2')).toBe(true);
    expect(result.selectedBlocks.has('p-3')).toBe(true);
  });
});

describe('handleClearBlockSelection', () => {
  it('clears selectedBlocks to empty set', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'One' } as TextNode,
      { id: 'p-2', type: 'p', content: 'Two' } as TextNode,
    ]);
    const selected = editorReducer(state, EditorActions.selectAllBlocks());
    expect(selected.selectedBlocks.size).toBe(2);
    const result = editorReducer(selected, EditorActions.clearBlockSelection());
    expect(result.selectedBlocks.size).toBe(0);
  });
});

describe('handleDeleteSelectedBlocks', () => {
  it('returns state when no blocks selected', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'One' } as TextNode,
    ]);
    const result = editorReducer(state, EditorActions.deleteSelectedBlocks());
    expect(result).toBe(state);
  });

  it('deletes selected blocks', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'One' } as TextNode,
      { id: 'p-2', type: 'p', content: 'Two' } as TextNode,
      { id: 'p-3', type: 'p', content: 'Three' } as TextNode,
    ]);
    const withSelection = { ...state, selectedBlocks: new Set(['p-2']) };
    const result = editorReducer(withSelection, EditorActions.deleteSelectedBlocks());
    expect(result.current.children.length).toBe(2);
    expect(result.current.children.find((c) => c.id === 'p-2')).toBeUndefined();
  });

  it('creates empty paragraph when all deleted', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'One' } as TextNode,
    ]);
    const withSelection = { ...state, selectedBlocks: new Set(['p-1']) };
    const result = editorReducer(withSelection, EditorActions.deleteSelectedBlocks());
    expect(result.current.children.length).toBe(1);
    expect(result.current.children[0].type).toBe('p');
    expect((result.current.children[0] as TextNode).content).toBe('');
  });

  it('sets activeNodeId to first remaining block', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'One' } as TextNode,
      { id: 'p-2', type: 'p', content: 'Two' } as TextNode,
      { id: 'p-3', type: 'p', content: 'Three' } as TextNode,
    ]);
    const withSelection = { ...state, selectedBlocks: new Set(['p-1']) };
    const result = editorReducer(withSelection, EditorActions.deleteSelectedBlocks());
    expect(result.activeNodeId).toBe('p-2');
  });
});

describe('handleSetCoverImage', () => {
  it('sets cover image', () => {
    const state = createTestState();
    const coverImage = { url: 'https://example.com/img.jpg', alt: 'Cover' };
    const result = editorReducer(state, EditorActions.setCoverImage(coverImage));
    expect(result.coverImage).toEqual(coverImage);
  });
});

describe('handleRemoveCoverImage', () => {
  it('removes cover image (sets null)', () => {
    const state = createTestState();
    const withCover = editorReducer(
      state,
      EditorActions.setCoverImage({ url: 'https://example.com/img.jpg' }),
    );
    expect(withCover.coverImage).not.toBeNull();
    const result = editorReducer(withCover, EditorActions.removeCoverImage());
    expect(result.coverImage).toBeNull();
  });
});

describe('handleUpdateCoverImagePosition', () => {
  it('updates position', () => {
    const state = createTestState();
    const withCover = editorReducer(
      state,
      EditorActions.setCoverImage({ url: 'https://example.com/img.jpg', position: 50 }),
    );
    const result = editorReducer(withCover, EditorActions.updateCoverImagePosition(75));
    expect(result.coverImage!.position).toBe(75);
  });

  it('returns state when no cover image', () => {
    const state = createTestState();
    expect(state.coverImage).toBeNull();
    const result = editorReducer(state, EditorActions.updateCoverImagePosition(50));
    expect(result).toBe(state);
  });
});
