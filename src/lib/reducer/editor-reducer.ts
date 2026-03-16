/**
 * Mina Rich Editor - Reducer
 *
 * Pure reducer function that handles all state transformations.
 * Follows immutable update patterns for predictable state management.
 * Includes history tracking for undo/redo functionality.
 *
 * @packageDocumentation
 */

import { EditorState, ContainerNode, TextNode } from "../types";
import { EditorAction } from "./actions";
import { generateId } from "../utils/id-generator";


// Node operations
import {
  handleUpdateNode,
  handleUpdateAttributes,
  handleUpdateContent,
  handleDeleteNode,
  handleInsertNode,
  handleMoveNode,
  handleSwapNodes,
  handleDuplicateNode,
} from "./operations/node-ops";

// Format operations
import {
  handleApplyInlineElementType,
  handleToggleFormat,
  handleApplyCustomClass,
  handleApplyInlineStyle,
  handleApplyLink,
  handleRemoveLink,
  handleReplaceSelectionText,
} from "./operations/format-ops";

// History operations
import {
  handleUndo,
  handleRedo,
  handleReplaceContainer,
} from "./operations/history-ops";

// UI operations
import {
  handleSetActiveNode,
  handleSetSelection,
  handleIncrementSelectionKey,
  handleSetCurrentSelection,
  handleSelectAllBlocks,
  handleClearBlockSelection,
  handleDeleteSelectedBlocks,
  handleSetCoverImage,
  handleRemoveCoverImage,
  handleUpdateCoverImagePosition,
} from "./operations/ui-ops";

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
    case "UPDATE_NODE":
      return handleUpdateNode(state, action.payload);

    case "UPDATE_ATTRIBUTES":
      return handleUpdateAttributes(state, action.payload);

    case "UPDATE_CONTENT":
      return handleUpdateContent(state, action.payload);

    case "DELETE_NODE":
      return handleDeleteNode(state, action.payload);

    case "INSERT_NODE":
      return handleInsertNode(state, action.payload);

    case "MOVE_NODE":
      return handleMoveNode(state, action.payload);

    case "SWAP_NODES":
      return handleSwapNodes(state, action.payload);

    case "DUPLICATE_NODE":
      return handleDuplicateNode(state, action.payload);

    case "REPLACE_CONTAINER":
      return handleReplaceContainer(state, action.payload);

    case "RESET":
      return createInitialState();

    case "SET_STATE":
      return action.payload.state;

    case "BATCH":
      return action.payload.actions.reduce(
        (currentState, batchAction) => editorReducer(currentState, batchAction),
        state
      );

    case "SET_ACTIVE_NODE":
      return handleSetActiveNode(state, action.payload);

    case "SET_SELECTION":
      return handleSetSelection(state, action.payload);

    case "INCREMENT_SELECTION_KEY":
      return handleIncrementSelectionKey(state);

    case "SET_CURRENT_SELECTION":
      return handleSetCurrentSelection(state, action.payload);

    case "APPLY_INLINE_ELEMENT_TYPE":
      return handleApplyInlineElementType(state, action.payload);

    case "TOGGLE_FORMAT":
      return handleToggleFormat(state, action.payload);

    case "APPLY_CUSTOM_CLASS":
      return handleApplyCustomClass(state, action.payload);

    case "APPLY_INLINE_STYLE":
      return handleApplyInlineStyle(state, action.payload);

    case "APPLY_LINK":
      return handleApplyLink(state, action.payload);

    case "REMOVE_LINK":
      return handleRemoveLink(state, {});

    case "SELECT_ALL_BLOCKS":
      return handleSelectAllBlocks(state);

    case "CLEAR_BLOCK_SELECTION":
      return handleClearBlockSelection(state);

    case "DELETE_SELECTED_BLOCKS":
      return handleDeleteSelectedBlocks(state);

    case "UNDO":
      return handleUndo(state);

    case "REDO":
      return handleRedo(state);

    case "SET_COVER_IMAGE":
      return handleSetCoverImage(state, action.payload);

    case "REMOVE_COVER_IMAGE":
      return handleRemoveCoverImage(state);

    case "UPDATE_COVER_IMAGE_POSITION":
      return handleUpdateCoverImagePosition(state, action.payload);

    case "REPLACE_SELECTION_TEXT":
      return handleReplaceSelectionText(state, action.payload);

    default: {
      // Exhaustiveness check
      const _exhaustive: never = action;
      console.warn("Unknown action type:", _exhaustive);
      return state;
    }
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
  // If container is provided, use it; otherwise create with at least one empty block
  let defaultChildren = container?.children;

  // If no children provided or empty array, create a default empty paragraph
  if (!defaultChildren || defaultChildren.length === 0) {
    const defaultNode: TextNode = {
      id: generateId('p'),
      type: "p",
      content: "",
      attributes: {},
    };
    defaultChildren = [defaultNode];
  }

  const initialContainer: ContainerNode = {
    id: "root",
    type: "container",
    children: defaultChildren,
    ...container,
  };

  return {
    version: "1.0.0",
    current: initialContainer,
    undoStack: [],
    redoStack: [],
    activeNodeId: initialContainer.children[0].id,
    hasSelection: false,
    selectionKey: 0,
    currentSelection: null,
    selectedBlocks: new Set(),
    coverImage: null,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}
