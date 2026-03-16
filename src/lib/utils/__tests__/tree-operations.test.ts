/**
 * Tests for tree-operations utilities.
 *
 * All functions are tested for correctness, immutability (structural sharing),
 * and edge cases (not found, root deletion, self-move, etc.).
 */
import { describe, it, expect } from 'vitest';
import {
  findNodeById,
  findParentById,
  updateNodeById,
  deleteNodeById,
  insertNode,
  moveNode,
  cloneNode,
  traverseTree,
  validateTree,
} from '@/lib/utils/tree-operations';
import type { ContainerNode, EditorNode } from '@/lib/types';

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

const createTestTree = (): ContainerNode => ({
  id: 'root',
  type: 'container',
  children: [
    { id: 'h1-1', type: 'h1', content: 'Title' },
    { id: 'p-1', type: 'p', content: 'Paragraph 1' },
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
});

// ---------------------------------------------------------------------------
// findNodeById
// ---------------------------------------------------------------------------

describe('findNodeById', () => {
  it('returns the root node when searching for its own ID', () => {
    const tree = createTestTree();
    const result = findNodeById(tree, 'root');
    expect(result).toBe(tree);
  });

  it('finds a direct child of the root', () => {
    const tree = createTestTree();
    const result = findNodeById(tree, 'p-1');
    expect(result).toBeDefined();
    expect(result!.id).toBe('p-1');
    expect((result as { content?: string }).content).toBe('Paragraph 1');
  });

  it('finds a container node that is a direct child', () => {
    const tree = createTestTree();
    const result = findNodeById(tree, 'container-1');
    expect(result).toBeDefined();
    expect(result!.type).toBe('container');
  });

  it('finds a deeply nested node', () => {
    const tree = createTestTree();
    const result = findNodeById(tree, 'p-2');
    expect(result).toBeDefined();
    expect(result!.id).toBe('p-2');
    expect((result as { content?: string }).content).toBe('Nested paragraph');
  });

  it('finds the second deeply nested sibling', () => {
    const tree = createTestTree();
    const result = findNodeById(tree, 'p-3');
    expect(result).toBeDefined();
    expect(result!.id).toBe('p-3');
  });

  it('returns undefined when the ID does not exist in the tree', () => {
    const tree = createTestTree();
    const result = findNodeById(tree, 'non-existent-id');
    expect(result).toBeUndefined();
  });

  it('returns undefined when searching a leaf node for a different ID', () => {
    const leafNode: EditorNode = { id: 'leaf', type: 'p', content: 'leaf' };
    const result = findNodeById(leafNode, 'other-id');
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// findParentById
// ---------------------------------------------------------------------------

describe('findParentById', () => {
  it('returns the root when the target is a direct child of root', () => {
    const tree = createTestTree();
    const parent = findParentById(tree, 'p-1');
    expect(parent).toBeDefined();
    expect(parent!.id).toBe('root');
  });

  it('returns the root when the target is the nested container itself', () => {
    const tree = createTestTree();
    const parent = findParentById(tree, 'container-1');
    expect(parent).toBeDefined();
    expect(parent!.id).toBe('root');
  });

  it('returns the nested container as parent of its children', () => {
    const tree = createTestTree();
    const parent = findParentById(tree, 'p-2');
    expect(parent).toBeDefined();
    expect(parent!.id).toBe('container-1');
  });

  it('returns the nested container for the second nested child', () => {
    const tree = createTestTree();
    const parent = findParentById(tree, 'p-3');
    expect(parent).toBeDefined();
    expect(parent!.id).toBe('container-1');
  });

  it('returns undefined when searching for the root ID (root has no parent)', () => {
    const tree = createTestTree();
    const parent = findParentById(tree, 'root');
    expect(parent).toBeUndefined();
  });

  it('returns undefined when the target ID does not exist', () => {
    const tree = createTestTree();
    const parent = findParentById(tree, 'ghost-node');
    expect(parent).toBeUndefined();
  });

  it('returns undefined when called on a leaf node', () => {
    const leaf: EditorNode = { id: 'leaf', type: 'p', content: 'text' };
    const parent = findParentById(leaf, 'anything');
    expect(parent).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// updateNodeById
// ---------------------------------------------------------------------------

describe('updateNodeById', () => {
  it('updates the content of a direct child', () => {
    const tree = createTestTree();
    const updated = updateNodeById(tree, 'p-1', () => ({ content: 'Updated content' }));
    const p1 = findNodeById(updated, 'p-1') as { content?: string };
    expect(p1.content).toBe('Updated content');
  });

  it('updates a deeply nested node', () => {
    const tree = createTestTree();
    const updated = updateNodeById(tree, 'p-2', () => ({ content: 'Deep update' }));
    const p2 = findNodeById(updated, 'p-2') as { content?: string };
    expect(p2.content).toBe('Deep update');
  });

  it('does not mutate the original tree', () => {
    const tree = createTestTree();
    updateNodeById(tree, 'p-1', () => ({ content: 'Changed' }));
    const p1 = findNodeById(tree, 'p-1') as { content?: string };
    expect(p1.content).toBe('Paragraph 1');
  });

  it('returns the same root reference when ID is not found (no-op)', () => {
    const tree = createTestTree();
    const result = updateNodeById(tree, 'non-existent', () => ({ content: 'x' }));
    expect(result).toBe(tree);
  });

  it('preserves reference for unchanged sibling nodes (structural sharing)', () => {
    const tree = createTestTree();
    // h1-1 is a sibling of p-1; updating p-1 must NOT recreate h1-1
    const originalH1 = tree.children[0]; // h1-1
    const updated = updateNodeById(tree, 'p-1', () => ({ content: 'Changed' })) as ContainerNode;
    const newH1 = updated.children[0];
    expect(newH1).toBe(originalH1);
  });

  it('preserves reference for unchanged nested container when sibling is updated', () => {
    const tree = createTestTree();
    // Updating h1-1 should not recreate container-1
    const originalContainer = tree.children[2]; // container-1
    const updated = updateNodeById(tree, 'h1-1', () => ({ content: 'New Title' })) as ContainerNode;
    const newContainer = updated.children[2];
    expect(newContainer).toBe(originalContainer);
  });

  it('creates a new root reference when a node is updated', () => {
    const tree = createTestTree();
    const updated = updateNodeById(tree, 'p-1', () => ({ content: 'Changed' }));
    expect(updated).not.toBe(tree);
  });

  it('passes the current node to the updater function', () => {
    const tree = createTestTree();
    let receivedNode: EditorNode | undefined;
    updateNodeById(tree, 'p-1', (node) => {
      receivedNode = node;
      return {};
    });
    expect(receivedNode).toBeDefined();
    expect(receivedNode!.id).toBe('p-1');
  });

  it('can update the root node itself', () => {
    const tree = createTestTree();
    const updated = updateNodeById(tree, 'root', () => ({ id: 'root', type: 'container' as const }));
    // The update merges, so root should still have its id
    expect(updated.id).toBe('root');
  });
});

// ---------------------------------------------------------------------------
// deleteNodeById
// ---------------------------------------------------------------------------

describe('deleteNodeById', () => {
  it('deletes a leaf node that is a direct child', () => {
    const tree = createTestTree();
    const result = deleteNodeById(tree, 'h1-1') as ContainerNode;
    expect(result).not.toBeNull();
    expect(findNodeById(result, 'h1-1')).toBeUndefined();
    expect((result).children).toHaveLength(3);
  });

  it('deletes a deeply nested leaf node', () => {
    const tree = createTestTree();
    const result = deleteNodeById(tree, 'p-2') as ContainerNode;
    expect(result).not.toBeNull();
    expect(findNodeById(result, 'p-2')).toBeUndefined();
    // container-1 should now only have p-3
    const container = findNodeById(result, 'container-1') as ContainerNode;
    expect(container.children).toHaveLength(1);
    expect(container.children[0].id).toBe('p-3');
  });

  it('deletes the root node and returns null', () => {
    const tree = createTestTree();
    const result = deleteNodeById(tree, 'root');
    expect(result).toBeNull();
  });

  it('does not mutate the original tree', () => {
    const tree = createTestTree();
    deleteNodeById(tree, 'p-1');
    expect(tree.children).toHaveLength(4);
  });

  it('returns the same reference when ID is not found', () => {
    const tree = createTestTree();
    const result = deleteNodeById(tree, 'ghost');
    expect(result).toBe(tree);
  });

  it('deletes a nested container and all its descendants', () => {
    const tree = createTestTree();
    const result = deleteNodeById(tree, 'container-1') as ContainerNode;
    expect(result).not.toBeNull();
    expect(findNodeById(result, 'container-1')).toBeUndefined();
    expect(findNodeById(result, 'p-2')).toBeUndefined();
    expect(findNodeById(result, 'p-3')).toBeUndefined();
    expect((result).children).toHaveLength(3);
  });

  it('deletes a node from a structural node (table row)', () => {
    const treeWithTable: ContainerNode = {
      id: 'root',
      type: 'container',
      children: [
        {
          id: 'table-1',
          type: 'table',
          children: [
            {
              id: 'tbody-1',
              type: 'tbody',
              children: [
                {
                  id: 'tr-1',
                  type: 'tr',
                  children: [
                    { id: 'td-1', type: 'td', content: 'Cell 1' },
                    { id: 'td-2', type: 'td', content: 'Cell 2' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const result = deleteNodeById(treeWithTable, 'td-1') as ContainerNode;
    expect(result).not.toBeNull();
    expect(findNodeById(result, 'td-1')).toBeUndefined();
    expect(findNodeById(result, 'td-2')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// insertNode
// ---------------------------------------------------------------------------

describe('insertNode', () => {
  it('inserts a new node before a direct child', () => {
    const tree = createTestTree();
    const newNode: EditorNode = { id: 'new-before', type: 'p', content: 'Before p-1' };
    const result = insertNode(tree, 'p-1', newNode, 'before') as ContainerNode;
    const idx = result.children.findIndex((c) => c.id === 'new-before');
    const p1Idx = result.children.findIndex((c) => c.id === 'p-1');
    expect(idx).toBe(p1Idx - 1);
  });

  it('inserts a new node after a direct child', () => {
    const tree = createTestTree();
    const newNode: EditorNode = { id: 'new-after', type: 'p', content: 'After p-1' };
    const result = insertNode(tree, 'p-1', newNode, 'after') as ContainerNode;
    const idx = result.children.findIndex((c) => c.id === 'new-after');
    const p1Idx = result.children.findIndex((c) => c.id === 'p-1');
    expect(idx).toBe(p1Idx + 1);
  });

  it('prepends a node inside a container child', () => {
    const tree = createTestTree();
    const newNode: EditorNode = { id: 'prepended', type: 'h2', content: 'Prepended heading' };
    const result = insertNode(tree, 'container-1', newNode, 'prepend') as ContainerNode;
    const container = findNodeById(result, 'container-1') as ContainerNode;
    expect(container.children[0].id).toBe('prepended');
    expect(container.children).toHaveLength(3);
  });

  it('appends a node inside a container child', () => {
    const tree = createTestTree();
    const newNode: EditorNode = { id: 'appended', type: 'p', content: 'Appended' };
    const result = insertNode(tree, 'container-1', newNode, 'append') as ContainerNode;
    const container = findNodeById(result, 'container-1') as ContainerNode;
    const last = container.children[container.children.length - 1];
    expect(last.id).toBe('appended');
    expect(container.children).toHaveLength(3);
  });

  it('inserts before a deeply nested node', () => {
    const tree = createTestTree();
    const newNode: EditorNode = { id: 'before-p2', type: 'p', content: 'Before nested p-2' };
    const result = insertNode(tree, 'p-2', newNode, 'before') as ContainerNode;
    const container = findNodeById(result, 'container-1') as ContainerNode;
    const idx = container.children.findIndex((c) => c.id === 'before-p2');
    const p2Idx = container.children.findIndex((c) => c.id === 'p-2');
    expect(idx).toBe(p2Idx - 1);
  });

  it('inserts after a deeply nested node', () => {
    const tree = createTestTree();
    const newNode: EditorNode = { id: 'after-p3', type: 'p', content: 'After nested p-3' };
    const result = insertNode(tree, 'p-3', newNode, 'after') as ContainerNode;
    const container = findNodeById(result, 'container-1') as ContainerNode;
    const idx = container.children.findIndex((c) => c.id === 'after-p3');
    const p3Idx = container.children.findIndex((c) => c.id === 'p-3');
    expect(idx).toBe(p3Idx + 1);
  });

  it('inserts before the very first child (produces it as index 0)', () => {
    const tree = createTestTree();
    const newNode: EditorNode = { id: 'first', type: 'h1', content: 'First ever' };
    const result = insertNode(tree, 'h1-1', newNode, 'before') as ContainerNode;
    expect(result.children[0].id).toBe('first');
  });

  it('inserts after the last child (appends at end)', () => {
    const tree = createTestTree();
    const newNode: EditorNode = { id: 'last', type: 'p', content: 'Very last' };
    const result = insertNode(tree, 'p-4', newNode, 'after') as ContainerNode;
    const last = result.children[result.children.length - 1];
    expect(last.id).toBe('last');
  });

  it('does not mutate the original tree', () => {
    const tree = createTestTree();
    const newNode: EditorNode = { id: 'extra', type: 'p', content: 'Extra' };
    insertNode(tree, 'p-1', newNode, 'after');
    expect(tree.children).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// moveNode
// ---------------------------------------------------------------------------

describe('moveNode', () => {
  it('moves a sibling node before another sibling', () => {
    const tree = createTestTree();
    // Move p-4 before p-1
    const result = moveNode(tree, 'p-4', 'p-1', 'before') as ContainerNode;
    const ids = result.children.map((c) => c.id);
    expect(ids.indexOf('p-4')).toBeLessThan(ids.indexOf('p-1'));
    // p-4 should not appear twice
    expect(ids.filter((id) => id === 'p-4')).toHaveLength(1);
  });

  it('moves a sibling node after another sibling', () => {
    const tree = createTestTree();
    // Move h1-1 after p-4
    const result = moveNode(tree, 'h1-1', 'p-4', 'after') as ContainerNode;
    const ids = result.children.map((c) => c.id);
    expect(ids.indexOf('h1-1')).toBeGreaterThan(ids.indexOf('p-4'));
    expect(ids.filter((id) => id === 'h1-1')).toHaveLength(1);
  });

  it('moves a nested node out to the root level', () => {
    const tree = createTestTree();
    // Move p-2 (nested inside container-1) after p-4 at root level
    const result = moveNode(tree, 'p-2', 'p-4', 'after') as ContainerNode;
    // p-2 should no longer be inside container-1
    const container = findNodeById(result, 'container-1') as ContainerNode;
    expect(container.children.find((c) => c.id === 'p-2')).toBeUndefined();
    // p-2 should now be at root level
    expect(findNodeById(result, 'p-2')).toBeDefined();
    const rootIds = result.children.map((c) => c.id);
    expect(rootIds).toContain('p-2');
  });

  it('returns the original tree when moving a node to itself', () => {
    const tree = createTestTree();
    const result = moveNode(tree, 'p-1', 'p-1', 'after');
    expect(result).toBe(tree);
  });

  it('returns the original tree when the node to move is not found', () => {
    const tree = createTestTree();
    const result = moveNode(tree, 'ghost-node', 'p-1', 'after');
    expect(result).toBe(tree);
  });

  it('returns the original tree when the target node is not found', () => {
    const tree = createTestTree();
    const result = moveNode(tree, 'p-1', 'ghost-target', 'after');
    expect(result).toBe(tree);
  });

  it('does not mutate the original tree', () => {
    const tree = createTestTree();
    moveNode(tree, 'p-4', 'p-1', 'before');
    expect(tree.children.map((c) => c.id)).toEqual(['h1-1', 'p-1', 'container-1', 'p-4']);
  });

  it('moves a node into a container using append', () => {
    const tree = createTestTree();
    // Move p-4 into container-1 (append)
    const result = moveNode(tree, 'p-4', 'container-1', 'append') as ContainerNode;
    // p-4 should not be at root level anymore
    const rootIds = result.children.map((c) => c.id);
    expect(rootIds).not.toContain('p-4');
    // p-4 should be the last child of container-1
    const container = findNodeById(result, 'container-1') as ContainerNode;
    const lastChild = container.children[container.children.length - 1];
    expect(lastChild.id).toBe('p-4');
  });
});

// ---------------------------------------------------------------------------
// cloneNode
// ---------------------------------------------------------------------------

describe('cloneNode', () => {
  it('assigns a new generated ID when no newId is provided', () => {
    const node: EditorNode = { id: 'original', type: 'p', content: 'Text' };
    const cloned = cloneNode(node);
    expect(cloned.id).not.toBe('original');
    expect(cloned.id).toBeTruthy();
  });

  it('uses the provided newId when given', () => {
    const node: EditorNode = { id: 'original', type: 'p', content: 'Text' };
    const cloned = cloneNode(node, 'my-custom-id');
    expect(cloned.id).toBe('my-custom-id');
  });

  it('preserves the type and content of a leaf node', () => {
    const node: EditorNode = { id: 'p-x', type: 'p', content: 'Hello' };
    const cloned = cloneNode(node, 'p-y') as { type: string; content?: string };
    expect(cloned.type).toBe('p');
    expect(cloned.content).toBe('Hello');
  });

  it('does not share reference with the original leaf node', () => {
    const node: EditorNode = { id: 'original', type: 'p', content: 'Text' };
    const cloned = cloneNode(node);
    expect(cloned).not.toBe(node);
  });

  it('deep clones children of a container node with new IDs', () => {
    const tree = createTestTree();
    const cloned = cloneNode(tree, 'cloned-root') as ContainerNode;
    expect(cloned.id).toBe('cloned-root');
    // Children should have new IDs
    const originalChildIds = tree.children.map((c) => c.id);
    const clonedChildIds = cloned.children.map((c) => c.id);
    for (const id of clonedChildIds) {
      expect(originalChildIds).not.toContain(id);
    }
  });

  it('deep clones nested container children with new IDs', () => {
    const tree = createTestTree();
    const cloned = cloneNode(tree, 'cloned-root') as ContainerNode;
    // Find cloned container-1 equivalent (third child)
    const clonedInner = cloned.children[2] as ContainerNode;
    const originalInner = tree.children[2] as ContainerNode;
    // Inner container should have a new ID
    expect(clonedInner.id).not.toBe(originalInner.id);
    // Inner children should have new IDs
    const originalNestedIds = originalInner.children.map((c) => c.id);
    const clonedNestedIds = clonedInner.children.map((c) => c.id);
    for (const id of clonedNestedIds) {
      expect(originalNestedIds).not.toContain(id);
    }
  });

  it('cloned container preserves the same number of children', () => {
    const tree = createTestTree();
    const cloned = cloneNode(tree, 'cloned-root') as ContainerNode;
    expect(cloned.children).toHaveLength(tree.children.length);
    const clonedInner = cloned.children[2] as ContainerNode;
    const originalInner = tree.children[2] as ContainerNode;
    expect(clonedInner.children).toHaveLength(originalInner.children.length);
  });

  it('cloned children do not share object references with originals', () => {
    const tree = createTestTree();
    const cloned = cloneNode(tree, 'cloned-root') as ContainerNode;
    for (let i = 0; i < tree.children.length; i++) {
      expect(cloned.children[i]).not.toBe(tree.children[i]);
    }
  });

  it('clones a structural node and its children', () => {
    const trNode: EditorNode = {
      id: 'tr-1',
      type: 'tr',
      children: [
        { id: 'td-1', type: 'td', content: 'A' },
        { id: 'td-2', type: 'td', content: 'B' },
      ],
    };
    const cloned = cloneNode(trNode, 'tr-clone') as { id: string; type: string; children: EditorNode[] };
    expect(cloned.id).toBe('tr-clone');
    expect(cloned.type).toBe('tr');
    expect(cloned.children).toHaveLength(2);
    expect(cloned.children[0].id).not.toBe('td-1');
    expect(cloned.children[1].id).not.toBe('td-2');
  });
});

// ---------------------------------------------------------------------------
// traverseTree
// ---------------------------------------------------------------------------

describe('traverseTree', () => {
  it('visits every node in the tree', () => {
    const tree = createTestTree();
    const visited: string[] = [];
    traverseTree(tree, (node) => visited.push(node.id));
    // root + h1-1 + p-1 + container-1 + p-2 + p-3 + p-4 = 7 nodes
    expect(visited).toHaveLength(7);
    expect(visited).toContain('root');
    expect(visited).toContain('h1-1');
    expect(visited).toContain('p-1');
    expect(visited).toContain('container-1');
    expect(visited).toContain('p-2');
    expect(visited).toContain('p-3');
    expect(visited).toContain('p-4');
  });

  it('visits the root node first', () => {
    const tree = createTestTree();
    const visited: string[] = [];
    traverseTree(tree, (node) => visited.push(node.id));
    expect(visited[0]).toBe('root');
  });

  it('provides depth 0 for the root node', () => {
    const tree = createTestTree();
    const depths: Record<string, number> = {};
    traverseTree(tree, (node, depth) => { depths[node.id] = depth; });
    expect(depths['root']).toBe(0);
  });

  it('provides depth 1 for direct children of root', () => {
    const tree = createTestTree();
    const depths: Record<string, number> = {};
    traverseTree(tree, (node, depth) => { depths[node.id] = depth; });
    expect(depths['h1-1']).toBe(1);
    expect(depths['p-1']).toBe(1);
    expect(depths['container-1']).toBe(1);
    expect(depths['p-4']).toBe(1);
  });

  it('provides depth 2 for nodes nested inside container-1', () => {
    const tree = createTestTree();
    const depths: Record<string, number> = {};
    traverseTree(tree, (node, depth) => { depths[node.id] = depth; });
    expect(depths['p-2']).toBe(2);
    expect(depths['p-3']).toBe(2);
  });

  it('defaults depth to 0 when not provided', () => {
    const singleNode: EditorNode = { id: 'solo', type: 'p', content: 'Solo' };
    const depths: number[] = [];
    traverseTree(singleNode, (_node, depth) => depths.push(depth));
    expect(depths).toEqual([0]);
  });

  it('traverses in depth-first pre-order (parent before children)', () => {
    const tree = createTestTree();
    const visited: string[] = [];
    traverseTree(tree, (node) => visited.push(node.id));
    const containerIdx = visited.indexOf('container-1');
    const p2Idx = visited.indexOf('p-2');
    const p3Idx = visited.indexOf('p-3');
    expect(containerIdx).toBeLessThan(p2Idx);
    expect(containerIdx).toBeLessThan(p3Idx);
  });

  it('visits a leaf node exactly once with no recursion', () => {
    const leaf: EditorNode = { id: 'leaf', type: 'p', content: 'text' };
    const calls: string[] = [];
    traverseTree(leaf, (node) => calls.push(node.id));
    expect(calls).toHaveLength(1);
    expect(calls[0]).toBe('leaf');
  });
});

// ---------------------------------------------------------------------------
// validateTree
// ---------------------------------------------------------------------------

describe('validateTree', () => {
  it('returns valid: true and no errors for a well-formed tree', () => {
    const tree = createTestTree();
    const result = validateTree(tree);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects duplicate IDs in a tree', () => {
    const tree: ContainerNode = {
      id: 'root',
      type: 'container',
      children: [
        { id: 'dup-id', type: 'p', content: 'First' },
        { id: 'dup-id', type: 'p', content: 'Second duplicate' },
      ],
    };
    const result = validateTree(tree);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('dup-id'))).toBe(true);
  });

  it('detects a duplicate ID buried in a nested container', () => {
    const tree: ContainerNode = {
      id: 'root',
      type: 'container',
      children: [
        { id: 'shared-id', type: 'p', content: 'At root level' },
        {
          id: 'inner',
          type: 'container',
          children: [
            { id: 'shared-id', type: 'p', content: 'Duplicate in nested' },
          ],
        },
      ],
    };
    const result = validateTree(tree);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('shared-id'))).toBe(true);
  });

  it('detects an empty string ID', () => {
    const tree: ContainerNode = {
      id: 'root',
      type: 'container',
      children: [
        { id: '', type: 'p', content: 'No ID' },
      ],
    };
    const result = validateTree(tree);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes('empty'))).toBe(true);
  });

  it('detects a whitespace-only ID', () => {
    const tree: ContainerNode = {
      id: 'root',
      type: 'container',
      children: [
        { id: '   ', type: 'p', content: 'Whitespace only' },
      ],
    };
    const result = validateTree(tree);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('accumulates multiple errors when there are multiple issues', () => {
    const tree: ContainerNode = {
      id: 'root',
      type: 'container',
      children: [
        { id: 'dup', type: 'p', content: 'First' },
        { id: 'dup', type: 'p', content: 'Dup second' },
        { id: '', type: 'p', content: 'Empty ID' },
      ],
    };
    const result = validateTree(tree);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('returns valid: true for a tree with a single root node', () => {
    const solo: EditorNode = { id: 'solo', type: 'p', content: 'Alone' };
    const result = validateTree(solo);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validates a tree containing structural nodes without errors', () => {
    const treeWithTable: ContainerNode = {
      id: 'root',
      type: 'container',
      children: [
        {
          id: 'table-1',
          type: 'table',
          children: [
            {
              id: 'tbody-1',
              type: 'tbody',
              children: [
                {
                  id: 'tr-1',
                  type: 'tr',
                  children: [
                    { id: 'td-1', type: 'td', content: 'Cell 1' },
                    { id: 'td-2', type: 'td', content: 'Cell 2' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const result = validateTree(treeWithTable);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
