/**
 * Mina Rich Editor - Reducer
 *
 * Pure reducer function that handles all state transformations.
 * Follows immutable update patterns for predictable state management.
 * Includes history tracking for undo/redo functionality.
 *
 * @packageDocumentation
 */

import {
  EditorState,
  ContainerNode,
  isTextNode,
  TextNode,
  hasInlineChildren,
} from "../types";
import {
  updateNodeById,
  deleteNodeById,
  insertNode,
  moveNode,
  cloneNode,
  findNodeById,
} from "../utils/tree-operations";
import { EditorAction } from "./actions";
import { applyFormatting } from "../utils/inline-formatting";

/**
 * Maximum number of history states to keep
 */
const MAX_HISTORY_SIZE = 1;

/**
 * Deep clone a container node to preserve history immutability
 */
function deepCloneContainer(container: ContainerNode): ContainerNode {
  return JSON.parse(JSON.stringify(container));
}

/**
 * Add a new container state to history
 * This truncates any "future" history if we're not at the end
 */
function addToHistory(
  state: EditorState,
  newContainer: ContainerNode
): EditorState {
  // Clone the new container to ensure immutability
  const clonedContainer = deepCloneContainer(newContainer);

  // Get current history up to the current index
  const newHistory = state.history.slice(0, state.historyIndex + 1);

  // Add the new state
  newHistory.push(clonedContainer);

  // Limit history size
  if (newHistory.length > MAX_HISTORY_SIZE) {
    newHistory.shift(); // Remove oldest entry
    return {
      ...state,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };
  }

  return {
    ...state,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

/**
 * The main reducer function for the editor.
 * Handles all state transformations immutably.
 *
 * @param state - Current editor state
 * @param action - Action to apply
 * @returns New state after applying the action
 *
 * @example
 * ```typescript
 * const newState = editorReducer(currentState, {
 *   type: 'UPDATE_CONTENT',
 *   payload: { id: 'p-1', content: 'New text' }
 * });
 * ```
 */
export function editorReducer(
  state: EditorState,
  action: EditorAction
): EditorState {
  switch (action.type) {
    case "UPDATE_NODE": {
      const { id, updates } = action.payload;
      const currentContainer = state.history[state.historyIndex];
      const newContainer = updateNodeById(
        currentContainer,
        id,
        () => updates
      ) as ContainerNode;

      return addToHistory(
        {
          ...state,
          metadata: {
            ...state.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
        newContainer
      );
    }

    case "UPDATE_ATTRIBUTES": {
      const { id, attributes, merge = true } = action.payload;
      const currentContainer = state.history[state.historyIndex];
      const newContainer = updateNodeById(currentContainer, id, (node) => ({
        attributes: merge ? { ...node.attributes, ...attributes } : attributes,
      })) as ContainerNode;

      return addToHistory(
        {
          ...state,
          metadata: {
            ...state.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
        newContainer
      );
    }

    case "UPDATE_CONTENT": {
      const { id, content } = action.payload;
      const currentContainer = state.history[state.historyIndex];
      const newContainer = updateNodeById(currentContainer, id, (node) => {
        if (isTextNode(node)) {
          return { content };
        }
        console.warn(`Cannot update content of container node ${id}`);
        return {};
      }) as ContainerNode;

      return addToHistory(
        {
          ...state,
          metadata: {
            ...state.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
        newContainer
      );
    }

    case "DELETE_NODE": {
      const { id } = action.payload;
      const currentContainer = state.history[state.historyIndex];
      const result = deleteNodeById(currentContainer, id);

      // If the root container was deleted, prevent it
      if (result === null) {
        console.warn("Cannot delete the root container");
        return state;
      }

      return addToHistory(
        {
          ...state,
          metadata: {
            ...state.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
        result as ContainerNode
      );
    }

    case "INSERT_NODE": {
      const { node, targetId, position } = action.payload;
      const currentContainer = state.history[state.historyIndex];
      const newContainer = insertNode(
        currentContainer,
        targetId,
        node,
        position
      ) as ContainerNode;

      return addToHistory(
        {
          ...state,
          metadata: {
            ...state.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
        newContainer
      );
    }

    case "MOVE_NODE": {
      const { nodeId, targetId, position } = action.payload;
      const currentContainer = state.history[state.historyIndex];
      const newContainer = moveNode(
        currentContainer,
        nodeId,
        targetId,
        position
      ) as ContainerNode;

      return addToHistory(
        {
          ...state,
          metadata: {
            ...state.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
        newContainer
      );
    }

    case "DUPLICATE_NODE": {
      const { id, newId } = action.payload;
      const currentContainer = state.history[state.historyIndex];

      // Clone the node with a new ID
      const nodeToClone = updateNodeById(currentContainer, id, (node) => node);
      const clonedNode = cloneNode(nodeToClone, newId);

      // Insert the cloned node after the original
      const newContainer = insertNode(
        currentContainer,
        id,
        clonedNode,
        "after"
      ) as ContainerNode;

      return addToHistory(
        {
          ...state,
          metadata: {
            ...state.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
        newContainer
      );
    }

    case "REPLACE_CONTAINER": {
      const { container } = action.payload;

      return addToHistory(
        {
          ...state,
          metadata: {
            ...state.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
        container
      );
    }

    case "RESET": {
      return createInitialState();
    }

    case "BATCH": {
      const { actions } = action.payload;

      // Apply all actions sequentially
      return actions.reduce(
        (currentState, batchAction) => editorReducer(currentState, batchAction),
        state
      );
    }

    case "SET_ACTIVE_NODE": {
      const { nodeId } = action.payload;
      return {
        ...state,
        activeNodeId: nodeId,
      };
    }

    case "SET_SELECTION": {
      const { hasSelection } = action.payload;
      return {
        ...state,
        hasSelection,
      };
    }

    case "INCREMENT_SELECTION_KEY": {
      return {
        ...state,
        selectionKey: state.selectionKey + 1,
      };
    }

    case "SET_CURRENT_SELECTION": {
      const { selection } = action.payload;

      return {
        ...state,
        currentSelection: selection,
        hasSelection: selection !== null,
      };
    }

    case "APPLY_INLINE_ELEMENT_TYPE": {
      const { elementType } = action.payload;

      console.group("🎨 [APPLY_INLINE_ELEMENT_TYPE] Reducer executing");

      if (!state.currentSelection) {
        console.warn("❌ Cannot apply element type without active selection");
        console.groupEnd();
        return state;
      }

      const { nodeId, start, end } = state.currentSelection;

      const currentContainer = state.history[state.historyIndex];
      const node = findNodeById(currentContainer, nodeId) as
        | TextNode
        | undefined;

      if (!node || !isTextNode(node)) {
        console.warn("❌ Node not found or not a text node");
        console.groupEnd();
        return state;
      }

      // Convert node to inline children if it's still plain content
      const children = hasInlineChildren(node)
        ? node.children!
        : [{ content: node.content || "" }];

      // Build new children array by splitting segments that overlap with selection
      const newChildren: typeof node.children = [];
      let currentPos = 0;

      for (const child of children) {
        const childLength = (child.content || "").length;
        const childStart = currentPos;
        const childEnd = currentPos + childLength;

        // Check overlap with selection [start, end)
        if (childEnd <= start || childStart >= end) {
          // No overlap - keep as is
          newChildren.push({ ...child });
        } else {
          // There's overlap - need to split this child
          const overlapStart = Math.max(childStart, start);
          const overlapEnd = Math.min(childEnd, end);

          // Before overlap (within this child)
          if (childStart < overlapStart) {
            newChildren.push({
              content: child.content!.substring(0, overlapStart - childStart),
              bold: child.bold,
              italic: child.italic,
              underline: child.underline,
              elementType: child.elementType,
            });
          }

          // Overlapping part - apply the element type
          newChildren.push({
            content: child.content!.substring(
              overlapStart - childStart,
              overlapEnd - childStart
            ),
            bold: child.bold,
            italic: child.italic,
            underline: child.underline,
            elementType: elementType || undefined,
          });

          // After overlap (within this child)
          if (childEnd > overlapEnd) {
            newChildren.push({
              content: child.content!.substring(overlapEnd - childStart),
              bold: child.bold,
              italic: child.italic,
              underline: child.underline,
              elementType: child.elementType,
            });
          }
        }

        currentPos = childEnd;
      }

      // Update the node in the tree
      const newContainer = updateNodeById(currentContainer, nodeId, () => ({
        content: undefined, // Clear simple content
        children: newChildren, // Set inline children
      })) as ContainerNode;

      console.groupEnd();

      return addToHistory(
        {
          ...state,
          metadata: {
            ...state.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
        newContainer
      );
    }

    case "TOGGLE_FORMAT": {
      const { format } = action.payload;

      if (!state.currentSelection) {
        console.warn("❌ Cannot toggle format without active selection");
        console.groupEnd();
        return state;
      }

      const { nodeId, start, end, formats } = state.currentSelection;

      const currentContainer = state.history[state.historyIndex];
      const node = findNodeById(currentContainer, nodeId) as
        | TextNode
        | undefined;

      if (!node || !isTextNode(node)) {
        console.warn("❌ Node not found or not a text node");
        console.groupEnd();
        return state;
      }

      const isActive = formats[format];

      // Convert node to inline children if it's still plain content
      const children = hasInlineChildren(node)
        ? node.children!
        : [{ content: node.content || "" }];

      // Build new children array by splitting segments that overlap with selection
      const newChildren: typeof node.children = [];
      let currentPos = 0;

      for (const child of children) {
        const childLength = (child.content || "").length;
        const childStart = currentPos;
        const childEnd = currentPos + childLength;

        // Check overlap with selection [start, end)
        if (childEnd <= start || childStart >= end) {
          // No overlap - keep as is
          newChildren.push({ ...child });
        } else {
          // There's overlap - need to split this child
          const overlapStart = Math.max(childStart, start);
          const overlapEnd = Math.min(childEnd, end);

          // Before overlap (within this child)
          if (childStart < overlapStart) {
            newChildren.push({
              content: child.content!.substring(0, overlapStart - childStart),
              bold: child.bold,
              italic: child.italic,
              underline: child.underline,
              elementType: child.elementType, // Preserve elementType
            });
          }

          // Overlapping part - toggle the format
          newChildren.push({
            content: child.content!.substring(
              overlapStart - childStart,
              overlapEnd - childStart
            ),
            bold: format === "bold" ? !isActive : child.bold,
            italic: format === "italic" ? !isActive : child.italic,
            underline: format === "underline" ? !isActive : child.underline,
            elementType: child.elementType, // Preserve elementType
          });

          // After overlap (within this child)
          if (childEnd > overlapEnd) {
            newChildren.push({
              content: child.content!.substring(overlapEnd - childStart),
              bold: child.bold,
              italic: child.italic,
              underline: child.underline,
              elementType: child.elementType, // Preserve elementType
            });
          }
        }

        currentPos = childEnd;
      }

      // Update the node in the tree
      const newContainer = updateNodeById(currentContainer, nodeId, () => ({
        content: undefined, // Clear simple content
        children: newChildren, // Set inline children
      })) as ContainerNode;

      // Update the selection's format state
      const newSelection = {
        ...state.currentSelection,
        formats: {
          ...state.currentSelection.formats,
          [format]: !isActive,
        },
      };

      console.groupEnd();

      return addToHistory(
        {
          ...state,
          currentSelection: newSelection,
          metadata: {
            ...state.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
        newContainer
      );
    }

    case "APPLY_CUSTOM_CLASS": {
      const { className } = action.payload;

      console.group("🎨 [APPLY_CUSTOM_CLASS] Reducer executing");

      if (!state.currentSelection) {
        console.warn("❌ Cannot apply custom class without active selection");
        console.groupEnd();
        return state;
      }

      const { nodeId, start, end } = state.currentSelection;

      const currentContainer = state.history[state.historyIndex];
      const node = findNodeById(currentContainer, nodeId) as
        | TextNode
        | undefined;

      if (!node || !isTextNode(node)) {
        console.warn("❌ Node not found or not a text node");
        console.groupEnd();
        return state;
      }

      // Convert node to inline children if it's still plain content
      const children = hasInlineChildren(node)
        ? node.children!
        : [{ content: node.content || "" }];

      // Build new children array by splitting segments that overlap with selection
      const newChildren: typeof node.children = [];
      let currentPos = 0;

      for (const child of children) {
        const childLength = (child.content || "").length;
        const childStart = currentPos;
        const childEnd = currentPos + childLength;

        // Check overlap with selection [start, end)
        if (childEnd <= start || childStart >= end) {
          // No overlap - keep as is
          newChildren.push({ ...child });
        } else {
          // There's overlap - need to split this child
          const overlapStart = Math.max(childStart, start);
          const overlapEnd = Math.min(childEnd, end);

          // Before overlap (within this child)
          if (childStart < overlapStart) {
            newChildren.push({
              content: child.content!.substring(0, overlapStart - childStart),
              bold: child.bold,
              italic: child.italic,
              underline: child.underline,
              elementType: child.elementType,
              className: child.className,
            });
          }

          // Overlapping part - apply the custom class
          newChildren.push({
            content: child.content!.substring(
              overlapStart - childStart,
              overlapEnd - childStart
            ),
            bold: child.bold,
            italic: child.italic,
            underline: child.underline,
            elementType: child.elementType,
            className: className,
          });

          // After overlap (within this child)
          if (childEnd > overlapEnd) {
            newChildren.push({
              content: child.content!.substring(overlapEnd - childStart),
              bold: child.bold,
              italic: child.italic,
              underline: child.underline,
              elementType: child.elementType,
              className: child.className,
            });
          }
        }

        currentPos = childEnd;
      }

      // Update the node in the tree
      const newContainer = updateNodeById(currentContainer, nodeId, () => ({
        content: undefined, // Clear simple content
        children: newChildren, // Set inline children
      })) as ContainerNode;

      console.groupEnd();

      return addToHistory(
        {
          ...state,
          metadata: {
            ...state.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
        newContainer
      );
    }

    case "SELECT_ALL_BLOCKS": {
      // Select all block IDs
      const currentContainer = state.history[state.historyIndex];
      const allBlockIds = new Set(
        currentContainer.children.map((child) => child.id)
      );
      return {
        ...state,
        selectedBlocks: allBlockIds,
      };
    }

    case "CLEAR_BLOCK_SELECTION": {
      return {
        ...state,
        selectedBlocks: new Set(),
      };
    }

    case "DELETE_SELECTED_BLOCKS": {
      if (state.selectedBlocks.size === 0) {
        return state;
      }

      const currentContainer = state.history[state.historyIndex];
      // Delete all selected blocks
      const newChildren = currentContainer.children.filter(
        (child) => !state.selectedBlocks.has(child.id)
      );

      // If all blocks were deleted, create a new empty paragraph
      if (newChildren.length === 0) {
        const newNode: TextNode = {
          id: "p-" + Date.now(),
          type: "p",
          content: "",
          attributes: {},
        };
        newChildren.push(newNode);
      }

      return addToHistory(
        {
          ...state,
          selectedBlocks: new Set(),
          activeNodeId: newChildren[0]?.id || null,
          metadata: {
            ...state.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
        {
          ...currentContainer,
          children: newChildren,
        }
      );
    }

    case "UNDO": {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return {
          ...state,
          historyIndex: newIndex,
        };
      }
      return state;
    }

    case "REDO": {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return {
          ...state,
          historyIndex: newIndex,
        };
      }
      return state;
    }

    default:
      // Exhaustiveness check
      const _exhaustive: never = action;
      console.warn("Unknown action type:", _exhaustive);
      return state;
  }
}

/**
 * Creates the initial state for a new editor instance.
 *
 * @param container - Optional custom root container
 * @returns Initial editor state
 *
 * @example
 * ```typescript
 * const initialState = createInitialState();
 * const [state, dispatch] = useReducer(editorReducer, initialState);
 * ```
 */
export function createInitialState(
  container?: Partial<ContainerNode>
): EditorState {
  const initialContainer: ContainerNode = {
    id: "root",
    type: "container",
    children: [],
    ...container,
  };

  return {
    version: "1.0.0",
    history: [deepCloneContainer(initialContainer)],
    historyIndex: 0,
    activeNodeId: null,
    hasSelection: false,
    selectionKey: 0,
    currentSelection: null,
    selectedBlocks: new Set(),
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}
