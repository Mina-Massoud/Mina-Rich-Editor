import { describe, it, expect, beforeEach } from 'vitest';
import { resetIdCounter } from '@/lib/utils/id-generator';
import { editorReducer, createInitialState } from '@/lib/reducer/editor-reducer';
import { EditorActions } from '@/lib/reducer/actions';
import { TextNode, hasInlineChildren } from '@/lib/types';
import { stateWithSelection, createTestState } from './test-helpers';
import { findNodeById } from '@/lib/utils/tree-operations';

beforeEach(() => {
  resetIdCounter();
});

describe('handleToggleFormat', () => {
  it('returns state when no selection', () => {
    const state = createTestState();
    const result = editorReducer(state, EditorActions.toggleFormat('bold'));
    expect(result).toBe(state);
  });

  it('returns state when node is a container (non-text)', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        {
          id: 'container-1',
          type: 'container',
          children: [{ id: 'p-inner', type: 'p', content: 'inner' }],
        },
      ],
    });
    const withSel = editorReducer(
      state,
      EditorActions.setCurrentSelection({
        text: 'inner',
        start: 0,
        end: 5,
        nodeId: 'container-1',
        formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
      }),
    );
    const result = editorReducer(withSel, EditorActions.toggleFormat('bold'));
    // undoStack should not grow since the operation is a no-op on container nodes
    expect(result.undoStack.length).toBe(withSel.undoStack.length);
  });

  it('applies bold to selected text', () => {
    const state = stateWithSelection('Hello world', 0, 5);
    const result = editorReducer(state, EditorActions.toggleFormat('bold'));
    const node = findNodeById(result.current, 'p-1') as TextNode;
    expect(hasInlineChildren(node)).toBe(true);
    const boldChild = node.children!.find((c) => c.content === 'Hello');
    expect(boldChild).toBeDefined();
    expect(boldChild!.bold).toBe(true);
  });

  it('applies italic to selected text', () => {
    const state = stateWithSelection('Hello world', 0, 5);
    const result = editorReducer(state, EditorActions.toggleFormat('italic'));
    const node = findNodeById(result.current, 'p-1') as TextNode;
    const child = node.children!.find((c) => c.content === 'Hello');
    expect(child!.italic).toBe(true);
  });

  it('applies underline to selected text', () => {
    const state = stateWithSelection('Hello world', 0, 5);
    const result = editorReducer(state, EditorActions.toggleFormat('underline'));
    const node = findNodeById(result.current, 'p-1') as TextNode;
    const child = node.children!.find((c) => c.content === 'Hello');
    expect(child!.underline).toBe(true);
  });

  it('applies strikethrough to selected text', () => {
    const state = stateWithSelection('Hello world', 0, 5);
    const result = editorReducer(state, EditorActions.toggleFormat('strikethrough'));
    const node = findNodeById(result.current, 'p-1') as TextNode;
    const child = node.children!.find((c) => c.content === 'Hello');
    expect(child!.strikethrough).toBe(true);
  });

  it('applies code to selected text', () => {
    const state = stateWithSelection('Hello world', 0, 5);
    const result = editorReducer(state, EditorActions.toggleFormat('code'));
    const node = findNodeById(result.current, 'p-1') as TextNode;
    const child = node.children!.find((c) => c.content === 'Hello');
    expect(child!.code).toBe(true);
  });

  it('toggles bold OFF when already bold', () => {
    const state = stateWithSelection('Hello world', 0, 5);
    const bolded = editorReducer(state, EditorActions.toggleFormat('bold'));

    const withSel = editorReducer(
      bolded,
      EditorActions.setCurrentSelection({
        text: 'Hello',
        start: 0,
        end: 5,
        nodeId: 'p-1',
        formats: { bold: true, italic: false, underline: false, strikethrough: false, code: false },
      }),
    );
    const result = editorReducer(withSel, EditorActions.toggleFormat('bold'));
    const node = findNodeById(result.current, 'p-1') as TextNode;
    const child = node.children!.find((c) => c.content === 'Hello');
    expect(child!.bold).toBe(false);
  });

  it('updates currentSelection.formats after toggle', () => {
    const state = stateWithSelection('Hello world', 0, 5);
    const result = editorReducer(state, EditorActions.toggleFormat('bold'));
    expect(result.currentSelection).not.toBeNull();
    expect(result.currentSelection!.formats.bold).toBe(true);
  });

  it('records undo entry', () => {
    const state = stateWithSelection('Hello world', 0, 5);
    const initialLen = state.undoStack.length;
    const result = editorReducer(state, EditorActions.toggleFormat('bold'));
    expect(result.undoStack.length).toBeGreaterThan(initialLen);
  });
});

describe('handleApplyInlineElementType', () => {
  it('returns state when no selection', () => {
    const state = createTestState();
    const result = editorReducer(state, EditorActions.applyInlineElementType('h1'));
    expect(result).toBe(state);
  });

  it('returns state when non-text node', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        {
          id: 'container-1',
          type: 'container',
          children: [{ id: 'p-inner', type: 'p', content: 'inner' }],
        },
      ],
    });
    const withSel = editorReducer(
      state,
      EditorActions.setCurrentSelection({
        text: 'test',
        start: 0,
        end: 4,
        nodeId: 'container-1',
        formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
      }),
    );
    const result = editorReducer(withSel, EditorActions.applyInlineElementType('h1'));
    expect(result.undoStack.length).toBe(withSel.undoStack.length);
  });

  it('applies h1 elementType to selected children', () => {
    const state = stateWithSelection('Hello world', 0, 5);
    const result = editorReducer(state, EditorActions.applyInlineElementType('h1'));
    const node = findNodeById(result.current, 'p-1') as TextNode;
    expect(hasInlineChildren(node)).toBe(true);
    const child = node.children!.find((c) => c.content === 'Hello');
    expect(child!.elementType).toBe('h1');
  });

  it('applies blockquote elementType', () => {
    const state = stateWithSelection('Hello world', 0, 5);
    const result = editorReducer(state, EditorActions.applyInlineElementType('blockquote'));
    const node = findNodeById(result.current, 'p-1') as TextNode;
    const child = node.children!.find((c) => c.content === 'Hello');
    expect(child!.elementType).toBe('blockquote');
  });
});

describe('handleApplyCustomClass', () => {
  it('returns state when no selection', () => {
    const state = createTestState();
    const result = editorReducer(state, EditorActions.applyCustomClass('text-red-500'));
    expect(result).toBe(state);
  });

  it('returns state when non-text node', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        {
          id: 'container-1',
          type: 'container',
          children: [{ id: 'p-inner', type: 'p', content: 'inner' }],
        },
      ],
    });
    const withSel = editorReducer(
      state,
      EditorActions.setCurrentSelection({
        text: 'test',
        start: 0,
        end: 4,
        nodeId: 'container-1',
        formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
      }),
    );
    const result = editorReducer(withSel, EditorActions.applyCustomClass('text-red-500'));
    expect(result.undoStack.length).toBe(withSel.undoStack.length);
  });

  it('applies className to selected text', () => {
    const state = stateWithSelection('Hello world', 0, 5);
    const result = editorReducer(state, EditorActions.applyCustomClass('text-red-500'));
    const node = findNodeById(result.current, 'p-1') as TextNode;
    const child = node.children!.find((c) => c.content === 'Hello');
    expect(child!.className).toBe('text-red-500');
  });

  it('merges with existing classes', () => {
    const state = stateWithSelection('Hello world', 0, 5);
    const first = editorReducer(state, EditorActions.applyCustomClass('text-red-500'));

    const withSel = editorReducer(
      first,
      EditorActions.setCurrentSelection({
        text: 'Hello',
        start: 0,
        end: 5,
        nodeId: 'p-1',
        formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
      }),
    );
    const result = editorReducer(withSel, EditorActions.applyCustomClass('font-bold'));
    const node = findNodeById(result.current, 'p-1') as TextNode;
    const child = node.children!.find((c) => c.content === 'Hello');
    expect(child!.className).toContain('text-red-500');
    expect(child!.className).toContain('font-bold');
  });
});

describe('handleApplyInlineStyle', () => {
  it('returns state when no selection', () => {
    const state = createTestState();
    const result = editorReducer(state, EditorActions.applyInlineStyle('fontSize', '24px'));
    expect(result).toBe(state);
  });

  it('returns state when non-text node', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        {
          id: 'container-1',
          type: 'container',
          children: [{ id: 'p-inner', type: 'p', content: 'inner' }],
        },
      ],
    });
    const withSel = editorReducer(
      state,
      EditorActions.setCurrentSelection({
        text: 'test',
        start: 0,
        end: 4,
        nodeId: 'container-1',
        formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
      }),
    );
    const result = editorReducer(withSel, EditorActions.applyInlineStyle('fontSize', '24px'));
    expect(result.undoStack.length).toBe(withSel.undoStack.length);
  });

  it('applies style property to selected text', () => {
    const state = stateWithSelection('Hello world', 0, 5);
    const result = editorReducer(state, EditorActions.applyInlineStyle('fontSize', '24px'));
    const node = findNodeById(result.current, 'p-1') as TextNode;
    const child = node.children!.find((c) => c.content === 'Hello');
    expect(child!.styles).toEqual({ fontSize: '24px' });
  });
});

describe('handleApplyLink', () => {
  it('returns state when no selection', () => {
    const state = createTestState();
    const result = editorReducer(state, EditorActions.applyLink('https://example.com'));
    expect(result).toBe(state);
  });

  it('returns state when non-text node', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        {
          id: 'container-1',
          type: 'container',
          children: [{ id: 'p-inner', type: 'p', content: 'inner' }],
        },
      ],
    });
    const withSel = editorReducer(
      state,
      EditorActions.setCurrentSelection({
        text: 'test',
        start: 0,
        end: 4,
        nodeId: 'container-1',
        formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
      }),
    );
    const result = editorReducer(withSel, EditorActions.applyLink('https://example.com'));
    expect(result.undoStack.length).toBe(withSel.undoStack.length);
  });

  it('applies href to selected text', () => {
    const state = stateWithSelection('Hello world', 0, 5);
    const result = editorReducer(state, EditorActions.applyLink('https://example.com'));
    const node = findNodeById(result.current, 'p-1') as TextNode;
    const child = node.children!.find((c) => c.content === 'Hello');
    expect(child!.href).toBe('https://example.com');
  });
});

describe('handleRemoveLink', () => {
  it('returns state when no selection', () => {
    const state = createTestState();
    const result = editorReducer(state, EditorActions.removeLink());
    expect(result).toBe(state);
  });

  it('returns state when non-text node', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        {
          id: 'container-1',
          type: 'container',
          children: [{ id: 'p-inner', type: 'p', content: 'inner' }],
        },
      ],
    });
    const withSel = editorReducer(
      state,
      EditorActions.setCurrentSelection({
        text: 'test',
        start: 0,
        end: 4,
        nodeId: 'container-1',
        formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
      }),
    );
    const result = editorReducer(withSel, EditorActions.removeLink());
    expect(result.undoStack.length).toBe(withSel.undoStack.length);
  });

  it('removes href from selected text', () => {
    const state = stateWithSelection('Hello world', 0, 5);
    const linked = editorReducer(state, EditorActions.applyLink('https://example.com'));

    const withSel = editorReducer(
      linked,
      EditorActions.setCurrentSelection({
        text: 'Hello',
        start: 0,
        end: 5,
        nodeId: 'p-1',
        formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
      }),
    );
    const result = editorReducer(withSel, EditorActions.removeLink());
    const node = findNodeById(result.current, 'p-1') as TextNode;
    // After removing the link, the "Hello" text should no longer have an href.
    // mergeAdjacentTextNodes may merge children, so check all children for href absence
    const allHrefs = (node.children || []).filter((c) => c.href);
    expect(allHrefs).toHaveLength(0);
  });
});

describe('handleReplaceSelectionWithInlines', () => {
  it('returns state when node not found', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [{ id: 'p-1', type: 'p', content: 'Hello world' }],
    });
    const result = editorReducer(
      state,
      EditorActions.replaceSelectionWithInlines('nonexistent', 0, 5, [{ content: 'Hi', bold: true }]),
    );
    expect(result.undoStack.length).toBe(state.undoStack.length);
  });

  it('replaces selection range with InlineText[] containing bold/italic segments', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [{ id: 'p-1', type: 'p', content: 'Hello world' }],
    });
    const result = editorReducer(
      state,
      EditorActions.replaceSelectionWithInlines('p-1', 0, 5, [
        { content: 'Good', bold: true },
        { content: 'bye', italic: true },
      ]),
    );
    const node = findNodeById(result.current, 'p-1') as TextNode;
    expect(hasInlineChildren(node)).toBe(true);
    const boldChild = node.children!.find((c) => c.content === 'Good');
    expect(boldChild).toBeDefined();
    expect(boldChild!.bold).toBe(true);
    const italicChild = node.children!.find((c) => c.content === 'bye');
    expect(italicChild).toBeDefined();
    expect(italicChild!.italic).toBe(true);
    // " world" should still be there
    const rest = node.children!.find((c) => (c.content || '').includes('world'));
    expect(rest).toBeDefined();
  });

  it('works with partial overlap on existing formatted children', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [{
        id: 'p-1',
        type: 'p',
        content: undefined,
        children: [
          { content: 'Hello', bold: true },
          { content: ' world' },
        ],
      } as TextNode],
    });
    const result = editorReducer(
      state,
      EditorActions.replaceSelectionWithInlines('p-1', 3, 8, [
        { content: 'REPLACED', code: true },
      ]),
    );
    const node = findNodeById(result.current, 'p-1') as TextNode;
    expect(hasInlineChildren(node)).toBe(true);
    const codeChild = node.children!.find((c) => c.content === 'REPLACED');
    expect(codeChild).toBeDefined();
    expect(codeChild!.code).toBe(true);
  });

  it('clears selection after replacement', () => {
    const state = stateWithSelection('Hello world', 0, 5);
    const result = editorReducer(
      state,
      EditorActions.replaceSelectionWithInlines('p-1', 0, 5, [{ content: 'Bye' }]),
    );
    expect(result.currentSelection).toBeNull();
  });

  it('undo restores previous state', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [{ id: 'p-1', type: 'p', content: 'Hello world' }],
    });
    const afterReplace = editorReducer(
      state,
      EditorActions.replaceSelectionWithInlines('p-1', 0, 5, [
        { content: 'Bye', bold: true },
      ]),
    );
    const afterUndo = editorReducer(afterReplace, EditorActions.undo());
    const node = findNodeById(afterUndo.current, 'p-1') as TextNode;
    expect(node.content).toBe('Hello world');
  });
});

describe('handleReplaceSelectionText', () => {
  it('replaces text content in range', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [{ id: 'p-1', type: 'p', content: 'Hello world' }],
    });
    const result = editorReducer(state, EditorActions.replaceSelectionText('p-1', 0, 5, 'Goodbye'));
    const node = findNodeById(result.current, 'p-1') as TextNode;
    // After replace, node has inline children
    const fullText = node.children
      ? node.children.map((c) => c.content).join('')
      : node.content;
    expect(fullText).toContain('Goodbye');
    expect(fullText).toContain(' world');
  });

  it('clears currentSelection after replacing', () => {
    const state = stateWithSelection('Hello world', 0, 5);
    const result = editorReducer(state, EditorActions.replaceSelectionText('p-1', 0, 5, 'Bye'));
    expect(result.currentSelection).toBeNull();
  });

  it('returns state for non-text node', () => {
    const state = createInitialState({
      id: 'root',
      type: 'container',
      children: [
        {
          id: 'container-1',
          type: 'container',
          children: [{ id: 'p-inner', type: 'p', content: 'inner' }],
        },
      ],
    });
    const result = editorReducer(state, EditorActions.replaceSelectionText('container-1', 0, 3, 'X'));
    // Container node can't have text replaced
    expect(result.undoStack.length).toBe(state.undoStack.length);
  });
});
