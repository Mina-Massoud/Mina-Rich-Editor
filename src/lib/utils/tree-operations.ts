/**
 * Mina Rich Editor - Tree Operations Utilities
 * 
 * Recursive utilities for traversing, searching, and manipulating
 * the document tree structure immutably.
 * 
 * @packageDocumentation
 */

import { EditorNode, ContainerNode, isContainerNode } from '../types';

/**
 * Recursively finds a node by its ID in the tree.
 * 
 * @param node - The root node to start searching from
 * @param targetId - The ID of the node to find
 * @returns The found node or undefined if not found
 * 
 * @example
 * ```typescript
 * const found = findNodeById(rootContainer, 'paragraph-123');
 * if (found) {
 *   console.log('Found node:', found);
 * }
 * ```
 */
export function findNodeById(
  node: EditorNode,
  targetId: string
): EditorNode | undefined {
  // Base case: current node matches
  if (node.id === targetId) {
    return node;
  }

  // Recursive case: search children if it's a container
  if (isContainerNode(node)) {
    for (const child of node.children) {
      const found = findNodeById(child, targetId);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

/**
 * Finds the parent container of a node with the given ID.
 * Useful for operations that need to modify the parent.
 * 
 * @param node - The root node to start searching from
 * @param targetId - The ID of the child node
 * @returns The parent ContainerNode or undefined if not found
 * 
 * @example
 * ```typescript
 * const parent = findParentById(rootContainer, 'child-node-id');
 * if (parent) {
 *   console.log('Parent has', parent.children.length, 'children');
 * }
 * ```
 */
export function findParentById(
  node: EditorNode,
  targetId: string
): ContainerNode | undefined {
  if (!isContainerNode(node)) {
    return undefined;
  }

  // Check if target is a direct child
  for (const child of node.children) {
    if (child.id === targetId) {
      return node;
    }
  }

  // Recursively search in children
  for (const child of node.children) {
    if (isContainerNode(child)) {
      const found = findParentById(child, targetId);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

/**
 * Updates a node immutably by ID with a partial update.
 * Returns a new tree with the updated node.
 * 
 * @param node - The root node
 * @param targetId - The ID of the node to update
 * @param updater - Function that receives the old node and returns updates
 * @returns A new tree with the node updated, or the original if not found
 * 
 * @example
 * ```typescript
 * const newTree = updateNodeById(root, 'p-1', (node) => ({
 *   content: 'Updated content',
 *   attributes: { ...node.attributes, className: 'highlight' }
 * }));
 * ```
 */
export function updateNodeById(
  node: EditorNode,
  targetId: string,
  updater: (node: EditorNode) => Partial<EditorNode>
): EditorNode {
  // Base case: found the target node
  if (node.id === targetId) {
    const updates = updater(node);
    return { ...node, ...updates } as EditorNode;
  }

  // Recursive case: update children if it's a container
  if (isContainerNode(node)) {
    const newChildren = node.children.map((child) =>
      updateNodeById(child, targetId, updater)
    );

    // Only create new object if children actually changed
    const childrenChanged = newChildren.some(
      (newChild, index) => newChild !== node.children[index]
    );

    if (childrenChanged) {
      return {
        ...node,
        children: newChildren,
      };
    }
  }

  // No changes, return original node
  return node;
}

/**
 * Deletes a node by ID immutably.
 * Returns a new tree without the specified node.
 * 
 * @param node - The root node
 * @param targetId - The ID of the node to delete
 * @returns A new tree without the deleted node
 * 
 * @example
 * ```typescript
 * const newTree = deleteNodeById(root, 'paragraph-to-remove');
 * ```
 */
export function deleteNodeById(
  node: EditorNode,
  targetId: string
): EditorNode | null {
  // If this is the target node, signal deletion
  if (node.id === targetId) {
    return null;
  }

  // If it's a container, filter out the target from children
  if (isContainerNode(node)) {
    const newChildren = node.children
      .map((child) => deleteNodeById(child, targetId))
      .filter((child): child is EditorNode => child !== null);

    // Only create new object if children changed
    if (newChildren.length !== node.children.length) {
      return {
        ...node,
        children: newChildren,
      };
    }
  }

  return node;
}

/**
 * Position for inserting a node relative to another node.
 */
export type InsertPosition = 'before' | 'after' | 'prepend' | 'append';

/**
 * Inserts a new node relative to a target node.
 * 
 * @param root - The root node
 * @param targetId - The ID of the reference node
 * @param newNode - The node to insert
 * @param position - Where to insert relative to target ('before', 'after', 'prepend', 'append')
 * @returns A new tree with the node inserted
 * 
 * @example
 * ```typescript
 * // Insert after a specific paragraph
 * const newTree = insertNode(root, 'p-1', newParagraph, 'after');
 * 
 * // Prepend to a container
 * const newTree = insertNode(root, 'container-1', newHeading, 'prepend');
 * ```
 */
export function insertNode(
  root: EditorNode,
  targetId: string,
  newNode: EditorNode,
  position: InsertPosition
): EditorNode {
  // For 'prepend' and 'append', insert inside the target container
  if (position === 'prepend' || position === 'append') {
    return updateNodeById(root, targetId, (node) => {
      if (!isContainerNode(node)) {
        console.warn(`Cannot ${position} to non-container node ${targetId}`);
        return {};
      }

      return {
        children:
          position === 'prepend'
            ? [newNode, ...node.children]
            : [...node.children, newNode],
      };
    });
  }

  // For 'before' and 'after', insert as sibling
  // We need to find the parent and insert at the right position
  return insertNodeRecursive(root, targetId, newNode, position);
}

/**
 * Helper function for inserting nodes as siblings.
 * @internal
 */
function insertNodeRecursive(
  node: EditorNode,
  targetId: string,
  newNode: EditorNode,
  position: 'before' | 'after'
): EditorNode {
  if (!isContainerNode(node)) {
    return node;
  }

  // Check if target is a direct child
  const targetIndex = node.children.findIndex((child) => child.id === targetId);

  if (targetIndex !== -1) {
    // Found the target, insert the new node
    const newChildren = [...node.children];
    const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
    newChildren.splice(insertIndex, 0, newNode);

    return {
      ...node,
      children: newChildren,
    };
  }

  // Recursively search in children
  const newChildren = node.children.map((child) =>
    insertNodeRecursive(child, targetId, newNode, position)
  );

  // Only create new object if children changed
  const childrenChanged = newChildren.some(
    (newChild, index) => newChild !== node.children[index]
  );

  if (childrenChanged) {
    return {
      ...node,
      children: newChildren,
    };
  }

  return node;
}

/**
 * Moves a node to a new position in the tree.
 * 
 * @param root - The root node
 * @param nodeId - The ID of the node to move
 * @param targetId - The ID of the reference node
 * @param position - Where to move relative to target
 * @returns A new tree with the node moved
 * 
 * @example
 * ```typescript
 * // Move paragraph-2 before paragraph-1
 * const newTree = moveNode(root, 'p-2', 'p-1', 'before');
 * ```
 */
export function moveNode(
  root: EditorNode,
  nodeId: string,
  targetId: string,
  position: InsertPosition
): EditorNode {
  // Cannot move a node to itself
  if (nodeId === targetId) {
    console.warn('Cannot move a node to itself');
    return root;
  }

  // Find the node to move
  const nodeToMove = findNodeById(root, nodeId);
  if (!nodeToMove) {
    console.warn(`Node ${nodeId} not found`);
    return root;
  }

  // Verify target exists
  const targetNode = findNodeById(root, targetId);
  if (!targetNode) {
    console.warn(`Target node ${targetId} not found`);
    return root;
  }

  // First, remove the node from its current position
  const treeWithoutNode = deleteNodeById(root, nodeId);
  if (!treeWithoutNode) {
    return root;
  }

  // Then, insert it at the new position
  return insertNode(treeWithoutNode, targetId, nodeToMove, position);
}

/**
 * Deep clones a node (and all its children if it's a container).
 * Useful for duplicating content.
 * 
 * @param node - The node to clone
 * @param newId - Optional new ID for the cloned node
 * @returns A deep clone of the node
 * 
 * @example
 * ```typescript
 * const clone = cloneNode(originalNode, 'new-unique-id');
 * ```
 */
export function cloneNode(node: EditorNode, newId?: string): EditorNode {
  const cloned: EditorNode = {
    ...node,
    id: newId || `${node.id}-clone-${Date.now()}`,
  };

  if (isContainerNode(cloned) && isContainerNode(node)) {
    cloned.children = node.children.map((child) => cloneNode(child));
  }

  return cloned;
}

/**
 * Traverses the tree and calls a callback for each node.
 * Useful for analytics, validation, or batch operations.
 * 
 * @param node - The root node to traverse
 * @param callback - Function called for each node
 * @param depth - Current depth (starts at 0)
 * 
 * @example
 * ```typescript
 * // Count all nodes
 * let count = 0;
 * traverseTree(root, () => count++);
 * console.log('Total nodes:', count);
 * 
 * // Find all images
 * const images: TextNode[] = [];
 * traverseTree(root, (node) => {
 *   if (node.type === 'img') images.push(node as TextNode);
 * });
 * ```
 */
export function traverseTree(
  node: EditorNode,
  callback: (node: EditorNode, depth: number) => void,
  depth: number = 0
): void {
  callback(node, depth);

  if (isContainerNode(node)) {
    for (const child of node.children) {
      traverseTree(child, callback, depth + 1);
    }
  }
}

/**
 * Validates the tree structure.
 * Checks for duplicate IDs, orphaned nodes, etc.
 * 
 * @param node - The root node to validate
 * @returns Validation result with errors if any
 * 
 * @example
 * ```typescript
 * const result = validateTree(root);
 * if (!result.valid) {
 *   console.error('Tree validation errors:', result.errors);
 * }
 * ```
 */
export function validateTree(node: EditorNode): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  traverseTree(node, (currentNode) => {
    // Check for duplicate IDs
    if (seenIds.has(currentNode.id)) {
      errors.push(`Duplicate ID found: ${currentNode.id}`);
    }
    seenIds.add(currentNode.id);

    // Check for empty IDs
    if (!currentNode.id || currentNode.id.trim() === '') {
      errors.push('Node found with empty or missing ID');
    }

    // Check for invalid container children
    if (isContainerNode(currentNode) && !Array.isArray(currentNode.children)) {
      errors.push(`Container ${currentNode.id} has invalid children property`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

