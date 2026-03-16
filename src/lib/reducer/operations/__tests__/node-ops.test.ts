import { describe, it, expect, beforeEach } from 'vitest';
import { resetIdCounter } from '@/lib/utils/id-generator';
import {
  handleUpdateNode,
  handleUpdateAttributes,
  handleUpdateContent,
  handleDeleteNode,
  handleInsertNode,
  handleMoveNode,
  handleSwapNodes,
  handleDuplicateNode,
} from '../node-ops';
import { createTestState } from './test-helpers';
import { TextNode } from '@/lib/types';

beforeEach(() => {
  resetIdCounter();
});

describe('handleUpdateNode', () => {
  it('updates node content by id', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Hello' } as TextNode,
    ]);
    const result = handleUpdateNode(state, { id: 'p-1', updates: { content: 'Updated' } });
    expect((result.current.children[0] as TextNode).content).toBe('Updated');
  });

  it('records undo entry', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Hello' } as TextNode,
    ]);
    const result = handleUpdateNode(state, { id: 'p-1', updates: { content: 'Updated' } });
    expect(result.undoStack).toHaveLength(1);
  });

  it('updates metadata timestamp', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Hello' } as TextNode,
    ]);
    const result = handleUpdateNode(state, { id: 'p-1', updates: { content: 'Updated' } });
    expect(result.metadata?.updatedAt).toBeDefined();
  });

  it('stores backward operation with old values', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Hello' } as TextNode,
    ]);
    const result = handleUpdateNode(state, { id: 'p-1', updates: { content: 'Updated' } });
    const backward = result.undoStack[0].backward;
    expect(backward.type).toBe('update_node');
    if (backward.type === 'update_node') {
      expect((backward.changes as any).content).toBe('Hello');
    }
  });
});

describe('handleUpdateAttributes', () => {
  it('merges attributes by default', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Hello', attributes: { className: 'old' } } as TextNode,
    ]);
    const result = handleUpdateAttributes(state, {
      id: 'p-1',
      attributes: { bold: true },
    });
    const node = result.current.children[0] as TextNode;
    expect(node.attributes?.bold).toBe(true);
    expect(node.attributes?.className).toBe('old');
  });

  it('replaces attributes when merge is false', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Hello', attributes: { className: 'old' } } as TextNode,
    ]);
    const result = handleUpdateAttributes(state, {
      id: 'p-1',
      attributes: { bold: true },
      merge: false,
    });
    const node = result.current.children[0] as TextNode;
    expect(node.attributes?.bold).toBe(true);
    expect(node.attributes?.className).toBeUndefined();
  });

  it('records undo entry with old attributes', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Hello', attributes: { className: 'old' } } as TextNode,
    ]);
    const result = handleUpdateAttributes(state, { id: 'p-1', attributes: { bold: true } });
    expect(result.undoStack).toHaveLength(1);
  });
});

describe('handleUpdateContent', () => {
  it('updates text content of a text node', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Old' } as TextNode,
    ]);
    const result = handleUpdateContent(state, { id: 'p-1', content: 'New' });
    expect((result.current.children[0] as TextNode).content).toBe('New');
  });

  it('records undo with old content', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Old' } as TextNode,
    ]);
    const result = handleUpdateContent(state, { id: 'p-1', content: 'New' });
    expect(result.undoStack).toHaveLength(1);
    const backward = result.undoStack[0].backward;
    if (backward.type === 'update_node') {
      expect((backward.changes as any).content).toBe('Old');
    }
  });

  it('still records history for non-text nodes', () => {
    const state = createTestState([
      { id: 'img-1', type: 'img', attributes: { src: 'test.jpg' } } as TextNode,
    ]);
    const result = handleUpdateContent(state, { id: 'img-1', content: 'ignored' });
    expect(result.undoStack).toHaveLength(1);
  });
});

describe('handleDeleteNode', () => {
  it('removes a node from the container', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'A' } as TextNode,
      { id: 'p-2', type: 'p', content: 'B' } as TextNode,
    ]);
    const result = handleDeleteNode(state, { id: 'p-1' });
    expect(result.current.children).toHaveLength(1);
    expect(result.current.children[0].id).toBe('p-2');
  });

  it('creates empty paragraph when deleting last node', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Only one' } as TextNode,
    ]);
    const result = handleDeleteNode(state, { id: 'p-1' });
    expect(result.current.children).toHaveLength(1);
    expect(result.current.children[0].type).toBe('p');
    expect((result.current.children[0] as TextNode).content).toBe('');
  });

  it('records undo with insert_at_index for normal delete', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'A' } as TextNode,
      { id: 'p-2', type: 'p', content: 'B' } as TextNode,
    ]);
    const result = handleDeleteNode(state, { id: 'p-1' });
    const backward = result.undoStack[0].backward;
    expect(backward.type).toBe('insert_at_index');
  });

  it('returns state unchanged when deleting the root container', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'A' } as TextNode,
    ]);
    const result = handleDeleteNode(state, { id: 'root' });
    expect(result).toBe(state);
  });

  it('sets activeNodeId to new fallback node on empty deletion', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Only' } as TextNode,
    ]);
    const result = handleDeleteNode(state, { id: 'p-1' });
    expect(result.activeNodeId).toBeDefined();
    expect(result.activeNodeId).toBe(result.current.children[0].id);
  });
});

describe('handleInsertNode', () => {
  it('inserts a node after the target', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'First' } as TextNode,
    ]);
    const newNode: TextNode = { id: 'p-2', type: 'p', content: 'Second' };
    const result = handleInsertNode(state, { node: newNode, targetId: 'p-1', position: 'after' });
    expect(result.current.children).toHaveLength(2);
    expect(result.current.children[1].id).toBe('p-2');
  });

  it('sets activeNodeId to the inserted node', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'First' } as TextNode,
    ]);
    const newNode: TextNode = { id: 'p-new', type: 'p', content: 'New' };
    const result = handleInsertNode(state, { node: newNode, targetId: 'p-1', position: 'after' });
    expect(result.activeNodeId).toBe('p-new');
  });

  it('records undo with delete_node backward', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'First' } as TextNode,
    ]);
    const newNode: TextNode = { id: 'p-new', type: 'p', content: 'New' };
    const result = handleInsertNode(state, { node: newNode, targetId: 'p-1', position: 'after' });
    expect(result.undoStack[0].backward.type).toBe('delete_node');
  });
});

describe('handleMoveNode', () => {
  it('moves a node to a different position', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'A' } as TextNode,
      { id: 'p-2', type: 'p', content: 'B' } as TextNode,
      { id: 'p-3', type: 'p', content: 'C' } as TextNode,
    ]);
    const result = handleMoveNode(state, { nodeId: 'p-3', targetId: 'p-1', position: 'before' });
    expect(result.current.children[0].id).toBe('p-3');
  });

  it('records undo with replace_container', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'A' } as TextNode,
      { id: 'p-2', type: 'p', content: 'B' } as TextNode,
    ]);
    const result = handleMoveNode(state, { nodeId: 'p-2', targetId: 'p-1', position: 'before' });
    expect(result.undoStack[0].backward.type).toBe('replace_container');
  });
});

describe('handleSwapNodes', () => {
  it('swaps two nodes positions', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'A' } as TextNode,
      { id: 'p-2', type: 'p', content: 'B' } as TextNode,
    ]);
    const result = handleSwapNodes(state, { nodeId1: 'p-1', nodeId2: 'p-2' });
    expect(result.current.children[0].id).toBe('p-2');
    expect(result.current.children[1].id).toBe('p-1');
  });

  it('returns state when first node not found', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'A' } as TextNode,
    ]);
    const result = handleSwapNodes(state, { nodeId1: 'nonexistent', nodeId2: 'p-1' });
    expect(result).toBe(state);
  });

  it('returns state when second node not found', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'A' } as TextNode,
    ]);
    const result = handleSwapNodes(state, { nodeId1: 'p-1', nodeId2: 'nonexistent' });
    expect(result).toBe(state);
  });
});

describe('handleDuplicateNode', () => {
  it('creates a copy after the original', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Hello' } as TextNode,
    ]);
    const result = handleDuplicateNode(state, { id: 'p-1', newId: 'p-1-copy' });
    expect(result.current.children).toHaveLength(2);
    expect(result.current.children[1].id).toBe('p-1-copy');
  });

  it('records undo with delete_node backward', () => {
    const state = createTestState([
      { id: 'p-1', type: 'p', content: 'Hello' } as TextNode,
    ]);
    const result = handleDuplicateNode(state, { id: 'p-1', newId: 'p-1-copy' });
    expect(result.undoStack[0].backward.type).toBe('delete_node');
  });
});
