/**
 * Tests for the flat node map cache (O(1) lookups).
 *
 * Coverage:
 *  1. buildNodeMap — correctness across flat, nested, structural, and table trees.
 *  2. Store integration — nodeMap is rebuilt and stays in sync after every dispatch.
 *  3. useBlockNode equivalence — returns the same reference as findNodeById.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { buildNodeMap, findNodeById } from '../tree-operations';
import { createInitialState } from '../../reducer/editor-reducer';
import { EditorActions } from '../../reducer/actions';
import { createEditorStore } from '../../store/editor-store';
import type { ContainerNode, StructuralNode } from '../../types';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

function createFlatTree(): ContainerNode {
  return {
    id: 'root',
    type: 'container',
    children: [
      { id: 'h1-1', type: 'h1', content: 'Title' },
      { id: 'p-1', type: 'p', content: 'Paragraph 1' },
      { id: 'p-2', type: 'p', content: 'Paragraph 2' },
    ],
  };
}

function createNestedTree(): ContainerNode {
  return {
    id: 'root',
    type: 'container',
    children: [
      { id: 'h1-1', type: 'h1', content: 'Title' },
      {
        id: 'container-1',
        type: 'container',
        children: [
          { id: 'p-2', type: 'p', content: 'Nested paragraph' },
          { id: 'p-3', type: 'p', content: 'Another nested' },
        ],
      },
      { id: 'p-4', type: 'p', content: 'Paragraph 4' },
    ],
  };
}

function createTreeWithTable(): ContainerNode {
  const tableNode: StructuralNode = {
    id: 'table-1',
    type: 'table',
    children: [
      {
        id: 'thead-1',
        type: 'thead',
        children: [
          {
            id: 'tr-1',
            type: 'tr',
            children: [
              { id: 'th-1', type: 'th', content: 'Col A' },
              { id: 'th-2', type: 'th', content: 'Col B' },
            ],
          },
        ],
      } as StructuralNode,
      {
        id: 'tbody-1',
        type: 'tbody',
        children: [
          {
            id: 'tr-2',
            type: 'tr',
            children: [
              { id: 'td-1', type: 'td', content: 'Cell 1' },
              { id: 'td-2', type: 'td', content: 'Cell 2' },
            ],
          },
        ],
      } as StructuralNode,
    ],
  };

  return {
    id: 'root',
    type: 'container',
    children: [
      { id: 'h1-1', type: 'h1', content: 'Title' },
      tableNode,
    ],
  };
}

// ---------------------------------------------------------------------------
// Helpers — use createEditorStore (factory) directly, no context needed
// ---------------------------------------------------------------------------

let store: ReturnType<typeof createEditorStore>;

function resetStore(tree?: ContainerNode) {
  store = createEditorStore(tree ?? createNestedTree());
}

function currentContainer(): ContainerNode {
  return store.getState().current;
}

// ---------------------------------------------------------------------------
// buildNodeMap — utility function tests
// ---------------------------------------------------------------------------

describe('buildNodeMap', () => {
  it('includes the root node itself', () => {
    const tree = createFlatTree();
    const map = buildNodeMap(tree);
    expect(map.has('root')).toBe(true);
    expect(map.get('root')).toBe(tree);
  });

  it('includes all direct children of a flat tree', () => {
    const tree = createFlatTree();
    const map = buildNodeMap(tree);
    expect(map.size).toBe(4); // root + 3 children
    expect(map.has('h1-1')).toBe(true);
    expect(map.has('p-1')).toBe(true);
    expect(map.has('p-2')).toBe(true);
  });

  it('returns the exact same node reference, not a copy', () => {
    const tree = createFlatTree();
    const map = buildNodeMap(tree);
    expect(map.get('h1-1')).toBe(tree.children[0]);
    expect(map.get('p-1')).toBe(tree.children[1]);
  });

  it('traverses into nested containers', () => {
    const tree = createNestedTree();
    const map = buildNodeMap(tree);
    expect(map.size).toBe(6);
    expect(map.has('container-1')).toBe(true);
    expect(map.has('p-2')).toBe(true);
    expect(map.has('p-3')).toBe(true);
  });

  it('traverses into structural (table) nodes and their children', () => {
    const tree = createTreeWithTable();
    const map = buildNodeMap(tree);
    expect(map.size).toBe(11);
    expect(map.has('table-1')).toBe(true);
    expect(map.has('thead-1')).toBe(true);
    expect(map.has('td-1')).toBe(true);
    expect(map.has('td-2')).toBe(true);
  });

  it('returns a Map where every entry matches findNodeById', () => {
    const tree = createNestedTree();
    const map = buildNodeMap(tree);
    for (const [id, node] of map.entries()) {
      expect(findNodeById(tree, id)).toBe(node);
    }
  });
});

// ---------------------------------------------------------------------------
// Store integration — nodeMap stays in sync after each dispatch
// ---------------------------------------------------------------------------

describe('store — nodeMap stays in sync after dispatch', () => {
  beforeEach(() => resetStore());

  it('initialises with a nodeMap that covers all nodes', () => {
    const { nodeMap } = store.getState();
    const expected = buildNodeMap(currentContainer());
    expect(nodeMap.size).toBe(expected.size);
  });

  it('INSERT_NODE — newly inserted node appears in nodeMap', () => {
    store.getState().dispatch(
      EditorActions.insertNode({ id: 'p-new', type: 'p', content: 'new' }, 'h1-1', 'after')
    );
    const { nodeMap } = store.getState();
    expect(nodeMap.has('p-new')).toBe(true);
    expect(nodeMap.get('p-new')).toBe(findNodeById(currentContainer(), 'p-new'));
  });

  it('DELETE_NODE — deleted node is removed from nodeMap', () => {
    store.getState().dispatch(EditorActions.deleteNode('p-4'));
    expect(store.getState().nodeMap.has('p-4')).toBe(false);
  });

  it('MOVE_NODE — node remains in map after move', () => {
    store.getState().dispatch(EditorActions.moveNode('p-4', 'h1-1', 'before'));
    const { nodeMap } = store.getState();
    expect(nodeMap.has('p-4')).toBe(true);
    expect(nodeMap.get('p-4')).toBe(findNodeById(currentContainer(), 'p-4'));
  });

  it('UPDATE_CONTENT — updated node reference changes in map', () => {
    const before = store.getState().nodeMap.get('h1-1');
    store.getState().dispatch(EditorActions.updateContent('h1-1', 'Updated'));
    const after = store.getState().nodeMap.get('h1-1');
    expect(after).not.toBe(before);
  });

  it('nodeMap size matches tree after mutations', () => {
    store.getState().dispatch(
      EditorActions.insertNode({ id: 'p-x', type: 'p', content: 'x' }, 'p-4', 'after')
    );
    expect(store.getState().nodeMap.size).toBe(buildNodeMap(currentContainer()).size);

    store.getState().dispatch(EditorActions.deleteNode('p-x'));
    expect(store.getState().nodeMap.size).toBe(buildNodeMap(currentContainer()).size);
  });

  it('unchanged nodes preserve reference after sibling update (structural sharing)', () => {
    const p4Before = store.getState().nodeMap.get('p-4');
    store.getState().dispatch(EditorActions.updateContent('h1-1', 'Changed'));
    expect(store.getState().nodeMap.get('p-4')).toBe(p4Before);
  });
});

// ---------------------------------------------------------------------------
// nodeMap lookup equivalence with findNodeById
// ---------------------------------------------------------------------------

describe('nodeMap vs findNodeById equivalence', () => {
  beforeEach(() => resetStore());

  it('every nodeMap entry matches findNodeById', () => {
    const { nodeMap } = store.getState();
    const container = currentContainer();
    for (const [id, node] of nodeMap.entries()) {
      expect(findNodeById(container, id)).toBe(node);
    }
  });

  it('stays equivalent after mutations', () => {
    store.getState().dispatch(
      EditorActions.insertNode({ id: 'p-eq', type: 'p', content: 'eq' }, 'h1-1', 'after')
    );
    store.getState().dispatch(EditorActions.updateContent('p-eq', 'updated'));

    const { nodeMap } = store.getState();
    const container = currentContainer();
    for (const [id, node] of nodeMap.entries()) {
      expect(findNodeById(container, id)).toBe(node);
    }
  });
});
