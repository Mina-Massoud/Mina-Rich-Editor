/**
 * Mina Rich Editor - Node CRUD Operations
 *
 * Standalone handler functions for node-level reducer cases.
 * Each function takes `(state: EditorState, payload)` and returns `EditorState`.
 * All operations build inverted forward/backward operations for undo/redo.
 *
 * @packageDocumentation
 */

import {
  EditorState,
  ContainerNode,
  EditorNode,
  isTextNode,
  TextNode,
} from '../../types';
import {
  updateNodeById,
  deleteNodeById,
  insertNode,
  moveNode,
  cloneNode,
  findNodeById,
} from '../../utils/tree-operations';
import { generateId } from '../../utils/id-generator';
import { addToHistory, getCurrentContainer, findParentAndIndex } from './shared';

import type {
  UpdateNodeAction,
  UpdateAttributesAction,
  UpdateContentAction,
  DeleteNodeAction,
  InsertNodeAction,
  MoveNodeAction,
  SwapNodesAction,
  DuplicateNodeAction,
} from '../actions';

// ---------------------------------------------------------------------------
// UPDATE_NODE
// ---------------------------------------------------------------------------

export function handleUpdateNode(
  state: EditorState,
  payload: UpdateNodeAction['payload']
): EditorState {
  const { id, updates } = payload;
  const currentContainer = getCurrentContainer(state);
  const oldNode = findNodeById(currentContainer, id);

  const newContainer = updateNodeById(
    currentContainer,
    id,
    () => updates
  ) as ContainerNode;

  // Build backward operation: restore the old values for the changed keys
  const oldPartial: Partial<EditorNode> = {};
  if (oldNode) {
    for (const key of Object.keys(updates)) {
      (oldPartial as any)[key] = (oldNode as any)[key];
    }
  }

  return addToHistory(
    {
      ...state,
      metadata: {
        ...state.metadata,
        updatedAt: new Date().toISOString(),
      },
    },
    newContainer,
    {
      forward: { type: 'update_node', id, changes: updates },
      backward: { type: 'update_node', id, changes: oldPartial },
    }
  );
}

// ---------------------------------------------------------------------------
// UPDATE_ATTRIBUTES
// ---------------------------------------------------------------------------

export function handleUpdateAttributes(
  state: EditorState,
  payload: UpdateAttributesAction['payload']
): EditorState {
  const { id, attributes, merge = true } = payload;
  const currentContainer = getCurrentContainer(state);
  const oldNode = findNodeById(currentContainer, id);
  const oldAttributes = oldNode?.attributes;

  const newContainer = updateNodeById(currentContainer, id, (node) => ({
    attributes: merge ? { ...node.attributes, ...attributes } : attributes,
  })) as ContainerNode;

  const newAttributes = merge
    ? { ...oldAttributes, ...attributes }
    : attributes;

  return addToHistory(
    {
      ...state,
      metadata: {
        ...state.metadata,
        updatedAt: new Date().toISOString(),
      },
    },
    newContainer,
    {
      forward: { type: 'update_node', id, changes: { attributes: newAttributes } },
      backward: { type: 'update_node', id, changes: { attributes: oldAttributes } },
    }
  );
}

// ---------------------------------------------------------------------------
// UPDATE_CONTENT
// ---------------------------------------------------------------------------

export function handleUpdateContent(
  state: EditorState,
  payload: UpdateContentAction['payload']
): EditorState {
  const { id, content } = payload;
  const currentContainer = getCurrentContainer(state);
  const oldNode = findNodeById(currentContainer, id);

  const newContainer = updateNodeById(currentContainer, id, (node) => {
    if (isTextNode(node)) {
      return { content };
    }
    return {};
  }) as ContainerNode;

  // Capture old content and children for backward
  const oldContent = isTextNode(oldNode as EditorNode) ? (oldNode as TextNode).content : undefined;
  const oldChildren = isTextNode(oldNode as EditorNode) ? (oldNode as TextNode).children : undefined;

  return addToHistory(
    {
      ...state,
      metadata: {
        ...state.metadata,
        updatedAt: new Date().toISOString(),
      },
    },
    newContainer,
    {
      forward: { type: 'update_node', id, changes: { content } },
      backward: { type: 'update_node', id, changes: { content: oldContent, children: oldChildren } as Partial<EditorNode> },
    }
  );
}

// ---------------------------------------------------------------------------
// DELETE_NODE
// ---------------------------------------------------------------------------

export function handleDeleteNode(
  state: EditorState,
  payload: DeleteNodeAction['payload']
): EditorState {
  const { id } = payload;
  const currentContainer = getCurrentContainer(state);
  const oldNode = findNodeById(currentContainer, id);
  const posInfo = findParentAndIndex(currentContainer, id);

  const result = deleteNodeById(currentContainer, id);

  // If the root container was deleted, prevent it
  if (result === null) {
    return state;
  }

  // If after deletion there are no children left, create a default empty paragraph
  const resultContainer = result as ContainerNode;
  if (resultContainer.children.length === 0) {
    const defaultNode: TextNode = {
      id: generateId('p'),
      type: 'p',
      content: '',
      attributes: {},
    };
    resultContainer.children = [defaultNode];

    // Backward: replace with old container (complex case with empty fallback)
    return addToHistory(
      {
        ...state,
        activeNodeId: defaultNode.id,
        metadata: {
          ...state.metadata,
          updatedAt: new Date().toISOString(),
        },
      },
      resultContainer,
      {
        forward: { type: 'replace_container', container: resultContainer },
        backward: { type: 'replace_container', container: currentContainer },
      }
    );
  }

  // If the deleted node was the active one, move focus to the nearest sibling
  let newActiveNodeId = state.activeNodeId;
  if (state.activeNodeId === id) {
    const deletedIndex = posInfo?.index ?? 0;
    const children = resultContainer.children;
    const targetIndex = Math.min(deletedIndex, children.length - 1);
    newActiveNodeId = children[targetIndex].id;
  }

  return addToHistory(
    {
      ...state,
      activeNodeId: newActiveNodeId,
      metadata: {
        ...state.metadata,
        updatedAt: new Date().toISOString(),
      },
    },
    resultContainer,
    oldNode && posInfo
      ? {
          forward: { type: 'delete_node', nodeId: id },
          backward: { type: 'insert_at_index', node: oldNode, parentId: posInfo.parentId, index: posInfo.index },
        }
      : {
          forward: { type: 'replace_container', container: resultContainer },
          backward: { type: 'replace_container', container: currentContainer },
        }
  );
}

// ---------------------------------------------------------------------------
// INSERT_NODE
// ---------------------------------------------------------------------------

export function handleInsertNode(
  state: EditorState,
  payload: InsertNodeAction['payload']
): EditorState {
  const { node, targetId, position } = payload;
  const currentContainer = getCurrentContainer(state);
  const newContainer = insertNode(
    currentContainer,
    targetId,
    node,
    position
  ) as ContainerNode;

  return addToHistory(
    {
      ...state,
      activeNodeId: node.id,
      metadata: {
        ...state.metadata,
        updatedAt: new Date().toISOString(),
      },
    },
    newContainer,
    {
      forward: { type: 'replace_container', container: newContainer },
      backward: { type: 'delete_node', nodeId: node.id },
    }
  );
}

// ---------------------------------------------------------------------------
// MOVE_NODE
// ---------------------------------------------------------------------------

export function handleMoveNode(
  state: EditorState,
  payload: MoveNodeAction['payload']
): EditorState {
  const { nodeId, targetId, position } = payload;
  const currentContainer = getCurrentContainer(state);
  const newContainer = moveNode(
    currentContainer,
    nodeId,
    targetId,
    position
  ) as ContainerNode;

  // Move is complex to invert — use replace_container for safety
  return addToHistory(
    {
      ...state,
      metadata: {
        ...state.metadata,
        updatedAt: new Date().toISOString(),
      },
    },
    newContainer,
    {
      forward: { type: 'replace_container', container: newContainer },
      backward: { type: 'replace_container', container: currentContainer },
    }
  );
}

// ---------------------------------------------------------------------------
// SWAP_NODES
// ---------------------------------------------------------------------------

export function handleSwapNodes(
  state: EditorState,
  payload: SwapNodesAction['payload']
): EditorState {
  const { nodeId1, nodeId2 } = payload;
  const currentContainer = getCurrentContainer(state);

  // Find indices of both nodes
  const index1 = currentContainer.children.findIndex((n) => n.id === nodeId1);
  const index2 = currentContainer.children.findIndex((n) => n.id === nodeId2);

  // If either node not found, return current state
  if (index1 === -1 || index2 === -1) {
    return state;
  }

  // Clone container and swap positions
  const newChildren = [...currentContainer.children];
  [newChildren[index1], newChildren[index2]] = [
    newChildren[index2],
    newChildren[index1],
  ];

  const newContainer: ContainerNode = {
    ...currentContainer,
    children: newChildren,
  };

  // Swap is its own inverse
  return addToHistory(
    {
      ...state,
      metadata: {
        ...state.metadata,
        updatedAt: new Date().toISOString(),
      },
    },
    newContainer,
    {
      forward: { type: 'replace_container', container: newContainer },
      backward: { type: 'replace_container', container: currentContainer },
    }
  );
}

// ---------------------------------------------------------------------------
// DUPLICATE_NODE
// ---------------------------------------------------------------------------

export function handleDuplicateNode(
  state: EditorState,
  payload: DuplicateNodeAction['payload']
): EditorState {
  const { id, newId } = payload;
  const currentContainer = getCurrentContainer(state);

  // Clone the node with a new ID
  const nodeToClone = updateNodeById(currentContainer, id, (node) => node);
  const clonedNode = cloneNode(nodeToClone, newId);

  // Insert the cloned node after the original
  const newContainer = insertNode(
    currentContainer,
    id,
    clonedNode,
    'after'
  ) as ContainerNode;

  return addToHistory(
    {
      ...state,
      metadata: {
        ...state.metadata,
        updatedAt: new Date().toISOString(),
      },
    },
    newContainer,
    {
      forward: { type: 'replace_container', container: newContainer },
      backward: { type: 'delete_node', nodeId: clonedNode.id },
    }
  );
}
