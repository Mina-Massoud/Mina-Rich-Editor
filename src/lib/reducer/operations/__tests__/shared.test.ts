import { describe, it, expect, beforeEach } from 'vitest';
import { resetIdCounter } from '@/lib/utils/id-generator';
import {
  getCurrentContainer,
  findParentAndIndex,
  applyOperation,
  addToHistory,
  withTimestamp,
  MAX_UNDO_SIZE,
} from '../shared';
import { createTestState, createTestContainer } from './test-helpers';
import { ContainerNode, TextNode, EditorNode, HistoryOperation } from '@/lib/types';

beforeEach(() => {
  resetIdCounter();
});

describe('getCurrentContainer', () => {
  it('returns the current container from state', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Hello' } as TextNode,
    ]);
    const container = getCurrentContainer(state);
    expect(container).toBe(state.current);
    expect(container.type).toBe('container');
  });
});

describe('findParentAndIndex', () => {
  it('finds a direct child at correct index', () => {
    const container = createTestContainer([
      { id: 'a', type: 'p', content: 'A' } as TextNode,
      { id: 'b', type: 'p', content: 'B' } as TextNode,
      { id: 'c', type: 'p', content: 'C' } as TextNode,
    ]);
    const result = findParentAndIndex(container, 'b');
    expect(result).toEqual({ parentId: 'root', index: 1 });
  });

  it('finds a nested child inside a container', () => {
    const container: ContainerNode = {
      id: 'root',
      type: 'container',
      children: [
        {
          id: 'nested',
          type: 'container',
          children: [
            { id: 'deep', type: 'p', content: 'Deep' } as TextNode,
          ],
        } as ContainerNode,
      ],
    };
    const result = findParentAndIndex(container, 'deep');
    expect(result).toEqual({ parentId: 'nested', index: 0 });
  });

  it('returns null for non-existent node', () => {
    const container = createTestContainer();
    const result = findParentAndIndex(container, 'nonexistent');
    expect(result).toBeNull();
  });

  it('returns null when container is a text node', () => {
    const textNode: TextNode = { id: 'p-1', type: 'p', content: 'Hello' };
    const result = findParentAndIndex(textNode as EditorNode, 'p-1');
    expect(result).toBeNull();
  });
});

describe('applyOperation', () => {
  it('applies update_node operation', () => {
    const container = createTestContainer([
      { id: 'p-1', type: 'p', content: 'Hello' } as TextNode,
    ]);
    const op: HistoryOperation = {
      type: 'update_node',
      id: 'p-1',
      changes: { content: 'Updated' },
    };
    const result = applyOperation(container, op);
    expect((result.children[0] as TextNode).content).toBe('Updated');
  });

  it('applies delete_node operation', () => {
    const container = createTestContainer([
      { id: 'p-1', type: 'p', content: 'A' } as TextNode,
      { id: 'p-2', type: 'p', content: 'B' } as TextNode,
    ]);
    const op: HistoryOperation = { type: 'delete_node', nodeId: 'p-1' };
    const result = applyOperation(container, op);
    expect(result.children).toHaveLength(1);
    expect(result.children[0].id).toBe('p-2');
  });

  it('applies insert_at_index operation', () => {
    const container = createTestContainer([
      { id: 'p-1', type: 'p', content: 'A' } as TextNode,
    ]);
    const newNode: TextNode = { id: 'p-2', type: 'p', content: 'B' };
    const op: HistoryOperation = {
      type: 'insert_at_index',
      node: newNode,
      parentId: 'root',
      index: 0,
    };
    const result = applyOperation(container, op);
    expect(result.children).toHaveLength(2);
    expect(result.children[0].id).toBe('p-2');
  });

  it('applies replace_container operation', () => {
    const container = createTestContainer();
    const newContainer = createTestContainer([
      { id: 'new-1', type: 'h1', content: 'New' } as TextNode,
    ]);
    const op: HistoryOperation = { type: 'replace_container', container: newContainer };
    const result = applyOperation(container, op);
    expect(result).toBe(newContainer);
  });

  it('applies batch operation sequentially', () => {
    const container = createTestContainer([
      { id: 'p-1', type: 'p', content: 'A' } as TextNode,
      { id: 'p-2', type: 'p', content: 'B' } as TextNode,
    ]);
    const op: HistoryOperation = {
      type: 'batch',
      operations: [
        { type: 'update_node', id: 'p-1', changes: { content: 'X' } },
        { type: 'update_node', id: 'p-2', changes: { content: 'Y' } },
      ],
    };
    const result = applyOperation(container, op);
    expect((result.children[0] as TextNode).content).toBe('X');
    expect((result.children[1] as TextNode).content).toBe('Y');
  });
});

describe('addToHistory', () => {
  it('adds entry to undoStack and clears redoStack', () => {
    let state = createTestState([
      { id: 'p-1', type: 'p', content: 'Hello' } as TextNode,
    ]);
    state = {
      ...state,
      redoStack: [{
        forward: { type: 'replace_container', container: state.current },
        backward: { type: 'replace_container', container: state.current },
        timestamp: 0,
      }],
    };

    const newContainer = createTestContainer([
      { id: 'p-1', type: 'p', content: 'Updated' } as TextNode,
    ]);
    const result = addToHistory(state, newContainer);
    expect(result.undoStack).toHaveLength(1);
    expect(result.redoStack).toHaveLength(0);
    expect(result.current).toBe(newContainer);
  });

  it('caps undoStack at MAX_UNDO_SIZE', () => {
    let state = createTestState([
      { id: 'p-1', type: 'p', content: 'Hello' } as TextNode,
    ]);
    const fakeEntries = Array.from({ length: MAX_UNDO_SIZE }, (_, i) => ({
      forward: { type: 'replace_container' as const, container: state.current },
      backward: { type: 'replace_container' as const, container: state.current },
      timestamp: i,
    }));
    state = { ...state, undoStack: fakeEntries };

    const newContainer = createTestContainer();
    const result = addToHistory(state, newContainer);
    expect(result.undoStack).toHaveLength(MAX_UNDO_SIZE);
  });

  it('uses replace_container fallback when no operation provided', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Hello' } as TextNode,
    ]);
    const newContainer = createTestContainer([
      { id: 'p-1', type: 'p', content: 'Updated' } as TextNode,
    ]);
    const result = addToHistory(state, newContainer);
    expect(result.undoStack[0].forward.type).toBe('replace_container');
    expect(result.undoStack[0].backward.type).toBe('replace_container');
  });

  it('uses provided operations when given', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Hello' } as TextNode,
    ]);
    const newContainer = createTestContainer();
    const result = addToHistory(state, newContainer, {
      forward: { type: 'update_node', id: 'p-1', changes: { content: 'Updated' } },
      backward: { type: 'update_node', id: 'p-1', changes: { content: 'Hello' } },
    });
    expect(result.undoStack[0].forward.type).toBe('update_node');
    expect(result.undoStack[0].backward.type).toBe('update_node');
  });
});

describe('withTimestamp', () => {
  it('updates the updatedAt field in metadata', () => {
    const state = createTestState();
    const result = withTimestamp(state);
    expect(result.metadata?.updatedAt).toBeDefined();
    expect(result).not.toBe(state);
  });

  it('preserves other state properties', () => {
    const state = createTestState();
    const result = withTimestamp(state);
    expect(result.current).toBe(state.current);
    expect(result.undoStack).toBe(state.undoStack);
    expect(result.version).toBe(state.version);
  });
});
