/**
 * Mina Rich Editor - Shared Reducer Utilities
 *
 * Shared helpers used across multiple operation modules.
 * Includes the operation-based history system.
 *
 * @packageDocumentation
 */

import {
  EditorState,
  ContainerNode,
  EditorNode,
  HistoryOperation,
  HistoryEntry,
  isContainerNode,
  isStructuralNode,
} from '../../types';
import {
  updateNodeById,
  deleteNodeById,
} from '../../utils/tree-operations';

/**
 * Maximum number of undo entries to keep.
 */
export const MAX_UNDO_SIZE = 50;

// ─── Container access ─────────────────────────────────────────────────────────

/**
 * Returns the current container from state.
 * Single source of truth — all operation handlers should use this.
 */
export function getCurrentContainer(state: EditorState): ContainerNode {
  return state.current;
}

// ─── Apply operations ─────────────────────────────────────────────────────────

/**
 * Insert a node into a parent container at a specific index.
 * Used during undo of delete operations.
 */
function insertNodeAtIndex(
  container: ContainerNode,
  parentId: string,
  node: EditorNode,
  index: number
): ContainerNode {
  if (container.id === parentId) {
    const children = [...container.children];
    children.splice(index, 0, node);
    return { ...container, children };
  }

  const newChildren = container.children.map((child) => {
    if (isContainerNode(child) || isStructuralNode(child)) {
      const result = insertNodeAtIndex(child as ContainerNode, parentId, node, index);
      if (result !== child) return result;
    }
    return child;
  });

  const changed = newChildren.some((c, i) => c !== container.children[i]);
  if (changed) {
    return { ...container, children: newChildren };
  }
  return container;
}

/**
 * Apply a HistoryOperation to a container, returning the new container.
 * Used by undo/redo to transform the current state.
 */
export function applyOperation(
  container: ContainerNode,
  op: HistoryOperation
): ContainerNode {
  switch (op.type) {
    case 'update_node':
      return updateNodeById(container, op.id, () => op.changes) as ContainerNode;

    case 'delete_node': {
      const result = deleteNodeById(container, op.nodeId);
      return (result as ContainerNode) ?? container;
    }

    case 'insert_at_index':
      return insertNodeAtIndex(container, op.parentId, op.node, op.index);

    case 'replace_container':
      return op.container;

    case 'batch':
      return op.operations.reduce(
        (c, subOp) => applyOperation(c, subOp),
        container
      );
  }
}

// ─── Find parent & index ──────────────────────────────────────────────────────

/**
 * Find the parent ID and child index of a node within the tree.
 * Returns null if the node is not found.
 */
export function findParentAndIndex(
  container: EditorNode,
  nodeId: string
): { parentId: string; index: number } | null {
  if (!isContainerNode(container) && !isStructuralNode(container)) {
    return null;
  }

  const parent = container as ContainerNode;
  const directIndex = parent.children.findIndex((c) => c.id === nodeId);
  if (directIndex !== -1) {
    return { parentId: parent.id, index: directIndex };
  }

  for (const child of parent.children) {
    if (isContainerNode(child) || isStructuralNode(child)) {
      const result = findParentAndIndex(child, nodeId);
      if (result) return result;
    }
  }

  return null;
}

// ─── History helpers ──────────────────────────────────────────────────────────

/**
 * Add a new container state to history with forward/backward operations.
 * Clears the redo stack (standard undo behavior).
 * Caps the undo stack at MAX_UNDO_SIZE entries.
 */
export function addToHistory(
  state: EditorState,
  newContainer: ContainerNode,
  operation?: { forward: HistoryOperation; backward: HistoryOperation }
): EditorState {
  const entry: HistoryEntry = operation
    ? {
        forward: operation.forward,
        backward: operation.backward,
        timestamp: Date.now(),
      }
    : {
        // Fallback: store full container snapshots as replace_container ops
        forward: { type: 'replace_container', container: newContainer },
        backward: { type: 'replace_container', container: state.current },
        timestamp: Date.now(),
      };

  let newUndoStack = [...state.undoStack, entry];

  // Cap undo stack size
  if (newUndoStack.length > MAX_UNDO_SIZE) {
    newUndoStack = newUndoStack.slice(newUndoStack.length - MAX_UNDO_SIZE);
  }

  return {
    ...state,
    current: newContainer,
    undoStack: newUndoStack,
    redoStack: [], // Clear redo on new action
  };
}

/**
 * Return a copy of state with the updatedAt timestamp set to now.
 */
export function withTimestamp(state: EditorState): EditorState {
  return {
    ...state,
    metadata: { ...state.metadata, updatedAt: new Date().toISOString() },
  };
}
