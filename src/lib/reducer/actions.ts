/**
 * Mina Rich Editor - Action Types
 * 
 * Defines all possible actions that can be dispatched to modify the editor state.
 * Follows Redux-style action pattern for predictability and debugging.
 * 
 * @packageDocumentation
 */

import { EditorNode, NodeAttributes, ContainerNode, SelectionInfo, EditorState } from '../types';
import { InsertPosition } from '../utils/tree-operations';

/**
 * Updates a node's properties by ID.
 * Performs a shallow merge of the provided updates.
 * 
 * @example
 * ```typescript
 * dispatch({
 *   type: 'UPDATE_NODE',
 *   payload: {
 *     id: 'p-1',
 *     updates: {
 *       content: 'New content',
 *       attributes: { className: 'text-blue-500' }
 *     }
 *   }
 * });
 * ```
 */
export interface UpdateNodeAction {
  type: 'UPDATE_NODE';
  payload: {
    id: string;
    updates: Partial<EditorNode>;
  };
}

/**
 * Updates only the attributes of a node.
 * More convenient than UPDATE_NODE when only changing attributes.
 * 
 * @example
 * ```typescript
 * dispatch({
 *   type: 'UPDATE_ATTRIBUTES',
 *   payload: {
 *     id: 'img-1',
 *     attributes: { src: 'new-image.jpg', alt: 'Updated image' }
 *   }
 * });
 * ```
 */
export interface UpdateAttributesAction {
  type: 'UPDATE_ATTRIBUTES';
  payload: {
    id: string;
    attributes: NodeAttributes;
    merge?: boolean; // If true, merges with existing attributes; if false, replaces them
  };
}

/**
 * Updates the text content of a node.
 * 
 * @example
 * ```typescript
 * dispatch({
 *   type: 'UPDATE_CONTENT',
 *   payload: {
 *     id: 'p-1',
 *     content: 'Updated paragraph text'
 *   }
 * });
 * ```
 */
export interface UpdateContentAction {
  type: 'UPDATE_CONTENT';
  payload: {
    id: string;
    content: string;
  };
}

/**
 * Deletes a node by ID.
 * 
 * @example
 * ```typescript
 * dispatch({
 *   type: 'DELETE_NODE',
 *   payload: { id: 'p-2' }
 * });
 * ```
 */
export interface DeleteNodeAction {
  type: 'DELETE_NODE';
  payload: {
    id: string;
  };
}

/**
 * Inserts a new node relative to a target node.
 * 
 * @example
 * ```typescript
 * dispatch({
 *   type: 'INSERT_NODE',
 *   payload: {
 *     node: { id: 'p-new', type: 'p', content: 'New paragraph' },
 *     targetId: 'p-1',
 *     position: 'after'
 *   }
 * });
 * ```
 */
export interface InsertNodeAction {
  type: 'INSERT_NODE';
  payload: {
    node: EditorNode;
    targetId: string;
    position: InsertPosition;
  };
}

/**
 * Moves a node to a new position in the tree.
 * 
 * @example
 * ```typescript
 * dispatch({
 *   type: 'MOVE_NODE',
 *   payload: {
 *     nodeId: 'p-3',
 *     targetId: 'p-1',
 *     position: 'before'
 *   }
 * });
 * ```
 */
export interface MoveNodeAction {
  type: 'MOVE_NODE';
  payload: {
    nodeId: string;
    targetId: string;
    position: InsertPosition;
  };
}

/**
 * Swaps the positions of two nodes in the tree.
 * 
 * @example
 * ```typescript
 * dispatch({
 *   type: 'SWAP_NODES',
 *   payload: {
 *     nodeId1: 'p-1',
 *     nodeId2: 'p-3'
 *   }
 * });
 * ```
 */
export interface SwapNodesAction {
  type: 'SWAP_NODES';
  payload: {
    nodeId1: string;
    nodeId2: string;
  };
}

/**
 * Duplicates a node and inserts it after the original.
 * 
 * @example
 * ```typescript
 * dispatch({
 *   type: 'DUPLICATE_NODE',
 *   payload: {
 *     id: 'p-1',
 *     newId: 'p-1-copy' // Optional
 *   }
 * });
 * ```
 */
export interface DuplicateNodeAction {
  type: 'DUPLICATE_NODE';
  payload: {
    id: string;
    newId?: string;
  };
}

/**
 * Replaces the entire container with a new one.
 * Useful for loading saved documents or resetting the editor.
 * 
 * @example
 * ```typescript
 * dispatch({
 *   type: 'REPLACE_CONTAINER',
 *   payload: { container: loadedDocument }
 * });
 * ```
 */
export interface ReplaceContainerAction {
  type: 'REPLACE_CONTAINER';
  payload: {
    container: ContainerNode;
  };
}

/**
 * Resets the editor to its initial state.
 * 
 * @example
 * ```typescript
 * dispatch({ type: 'RESET' });
 * ```
 */
export interface ResetAction {
  type: 'RESET';
}

/**
 * Sets the entire editor state at once.
 * Useful for loading saved documents or replacing the entire state.
 * 
 * @example
 * ```typescript
 * dispatch({
 *   type: 'SET_STATE',
 *   payload: { state: loadedState }
 * });
 * ```
 */
export interface SetStateAction {
  type: 'SET_STATE';
  payload: {
    state: EditorState;
  };
}

/**
 * Batch multiple actions into a single update.
 * Useful for performance when making multiple changes at once.
 * 
 * @example
 * ```typescript
 * dispatch({
 *   type: 'BATCH',
 *   payload: {
 *     actions: [
 *       { type: 'UPDATE_CONTENT', payload: { id: 'p-1', content: 'A' } },
 *       { type: 'UPDATE_CONTENT', payload: { id: 'p-2', content: 'B' } },
 *     ]
 *   }
 * });
 * ```
 */
export interface BatchAction {
  type: 'BATCH';
  payload: {
    actions: EditorAction[];
  };
}

/**
 * SET_ACTIVE_NODE action - sets the currently active/focused node
 */
export interface SetActiveNodeAction {
  type: 'SET_ACTIVE_NODE';
  payload: {
    nodeId: string | null;
  };
}

/**
 * SET_SELECTION action - updates selection state
 */
export interface SetSelectionAction {
  type: 'SET_SELECTION';
  payload: {
    hasSelection: boolean;
  };
}

/**
 * INCREMENT_SELECTION_KEY action - triggers re-render for selection changes
 */
export interface IncrementSelectionKeyAction {
  type: 'INCREMENT_SELECTION_KEY';
}

/**
 * SET_CURRENT_SELECTION action - updates the current selection info with formatting states
 */
export interface SetCurrentSelectionAction {
  type: 'SET_CURRENT_SELECTION';
  payload: {
    selection: SelectionInfo | null;
  };
}

/**
 * TOGGLE_FORMAT action - toggles a format style on the current selection
 */
export interface ToggleFormatAction {
  type: 'TOGGLE_FORMAT';
  payload: {
    format: 'bold' | 'italic' | 'underline';
  };
}

/**
 * APPLY_INLINE_ELEMENT_TYPE action - applies element type to selected text inline
 */
export interface ApplyInlineElementTypeAction {
  type: 'APPLY_INLINE_ELEMENT_TYPE';
  payload: {
    elementType: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'code' | 'blockquote';
  };
}

/**
 * APPLY_CUSTOM_CLASS action - applies custom Tailwind class to selected text
 */
export interface ApplyCustomClassAction {
  type: 'APPLY_CUSTOM_CLASS';
  payload: {
    className: string;
  };
}

/**
 * APPLY_INLINE_STYLE action - applies inline CSS style to selected text
 */
export interface ApplyInlineStyleAction {
  type: 'APPLY_INLINE_STYLE';
  payload: {
    property: string; // e.g., 'fontSize', 'color'
    value: string;    // e.g., '24px', '#ff0000'
  };
}

/**
 * APPLY_LINK action - applies link href to selected text
 */
export interface ApplyLinkAction {
  type: 'APPLY_LINK';
  payload: {
    href: string;
  };
}

/**
 * REMOVE_LINK action - removes link from selected text
 */
export interface RemoveLinkAction {
  type: 'REMOVE_LINK';
}

/**
 * SELECT_ALL_BLOCKS action - marks all blocks as selected
 */
export interface SelectAllBlocksAction {
  type: 'SELECT_ALL_BLOCKS';
}

/**
 * CLEAR_BLOCK_SELECTION action - clears all block selections
 */
export interface ClearBlockSelectionAction {
  type: 'CLEAR_BLOCK_SELECTION';
}

/**
 * DELETE_SELECTED_BLOCKS action - deletes all selected blocks
 */
export interface DeleteSelectedBlocksAction {
  type: 'DELETE_SELECTED_BLOCKS';
}

/**
 * UNDO action - moves back one step in history
 */
export interface UndoAction {
  type: 'UNDO';
}

/**
 * REDO action - moves forward one step in history
 */
export interface RedoAction {
  type: 'REDO';
}

/**
 * Union type of all possible editor actions.
 */
export type EditorAction =
  | UpdateNodeAction
  | UpdateAttributesAction
  | UpdateContentAction
  | DeleteNodeAction
  | InsertNodeAction
  | MoveNodeAction
  | SwapNodesAction
  | DuplicateNodeAction
  | ReplaceContainerAction
  | ResetAction
  | SetStateAction
  | BatchAction
  | SetActiveNodeAction
  | SetSelectionAction
  | IncrementSelectionKeyAction
  | SetCurrentSelectionAction
  | ToggleFormatAction
  | ApplyInlineElementTypeAction
  | ApplyCustomClassAction
  | ApplyInlineStyleAction
  | ApplyLinkAction
  | RemoveLinkAction
  | SelectAllBlocksAction
  | ClearBlockSelectionAction
  | DeleteSelectedBlocksAction
  | UndoAction
  | RedoAction;

/**
 * Action creator helpers for type-safe action creation.
 */
export const EditorActions = {
  /**
   * Creates an UPDATE_NODE action.
   */
  updateNode: (id: string, updates: Partial<EditorNode>): UpdateNodeAction => ({
    type: 'UPDATE_NODE',
    payload: { id, updates },
  }),

  /**
   * Creates an UPDATE_ATTRIBUTES action.
   */
  updateAttributes: (
    id: string,
    attributes: NodeAttributes,
    merge = true
  ): UpdateAttributesAction => ({
    type: 'UPDATE_ATTRIBUTES',
    payload: { id, attributes, merge },
  }),

  /**
   * Creates an UPDATE_CONTENT action.
   */
  updateContent: (id: string, content: string): UpdateContentAction => ({
    type: 'UPDATE_CONTENT',
    payload: { id, content },
  }),

  /**
   * Creates a DELETE_NODE action.
   */
  deleteNode: (id: string): DeleteNodeAction => ({
    type: 'DELETE_NODE',
    payload: { id },
  }),

  /**
   * Creates an INSERT_NODE action.
   */
  insertNode: (
    node: EditorNode,
    targetId: string,
    position: InsertPosition
  ): InsertNodeAction => ({
    type: 'INSERT_NODE',
    payload: { node, targetId, position },
  }),

  /**
   * Creates a MOVE_NODE action.
   */
  moveNode: (
    nodeId: string,
    targetId: string,
    position: InsertPosition
  ): MoveNodeAction => ({
    type: 'MOVE_NODE',
    payload: { nodeId, targetId, position },
  }),

  /**
   * Creates a SWAP_NODES action.
   */
  swapNodes: (nodeId1: string, nodeId2: string): SwapNodesAction => ({
    type: 'SWAP_NODES',
    payload: { nodeId1, nodeId2 },
  }),

  /**
   * Creates a DUPLICATE_NODE action.
   */
  duplicateNode: (id: string, newId?: string): DuplicateNodeAction => ({
    type: 'DUPLICATE_NODE',
    payload: { id, newId },
  }),

  /**
   * Creates a REPLACE_CONTAINER action.
   */
  replaceContainer: (container: ContainerNode): ReplaceContainerAction => ({
    type: 'REPLACE_CONTAINER',
    payload: { container },
  }),

  /**
   * Creates a RESET action.
   */
  reset: (): ResetAction => ({
    type: 'RESET',
  }),

  /**
   * Creates a SET_STATE action.
   */
  setState: (state: EditorState): SetStateAction => ({
    type: 'SET_STATE',
    payload: { state },
  }),

  /**
   * Creates a BATCH action.
   */
  batch: (actions: EditorAction[]): BatchAction => ({
    type: 'BATCH',
    payload: { actions },
  }),

  /**
   * Creates a SET_ACTIVE_NODE action.
   */
  setActiveNode: (nodeId: string | null): SetActiveNodeAction => ({
    type: 'SET_ACTIVE_NODE',
    payload: { nodeId },
  }),

  /**
   * Creates a SET_SELECTION action.
   */
  setSelection: (hasSelection: boolean): SetSelectionAction => ({
    type: 'SET_SELECTION',
    payload: { hasSelection },
  }),

  /**
   * Creates an INCREMENT_SELECTION_KEY action.
   */
  incrementSelectionKey: (): IncrementSelectionKeyAction => ({
    type: 'INCREMENT_SELECTION_KEY',
  }),

  /**
   * Creates a SET_CURRENT_SELECTION action.
   */
  setCurrentSelection: (selection: SelectionInfo | null): SetCurrentSelectionAction => ({
    type: 'SET_CURRENT_SELECTION',
    payload: { selection },
  }),

  /**
   * Creates a TOGGLE_FORMAT action.
   */
  toggleFormat: (format: 'bold' | 'italic' | 'underline'): ToggleFormatAction => ({
    type: 'TOGGLE_FORMAT',
    payload: { format },
  }),

  /**
   * Creates an APPLY_INLINE_ELEMENT_TYPE action.
   */
  applyInlineElementType: (elementType: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'code' | 'blockquote'): ApplyInlineElementTypeAction => ({
    type: 'APPLY_INLINE_ELEMENT_TYPE',
    payload: { elementType },
  }),

  /**
   * Creates an APPLY_CUSTOM_CLASS action.
   */
  applyCustomClass: (className: string): ApplyCustomClassAction => ({
    type: 'APPLY_CUSTOM_CLASS',
    payload: { className },
  }),

  /**
   * Creates an APPLY_INLINE_STYLE action.
   */
  applyInlineStyle: (property: string, value: string): ApplyInlineStyleAction => ({
    type: 'APPLY_INLINE_STYLE',
    payload: { property, value },
  }),

  /**
   * Creates an APPLY_LINK action.
   */
  applyLink: (href: string): ApplyLinkAction => ({
    type: 'APPLY_LINK',
    payload: { href },
  }),

  /**
   * Creates a REMOVE_LINK action.
   */
  removeLink: (): RemoveLinkAction => ({
    type: 'REMOVE_LINK',
  }),

  /**
   * Creates a SELECT_ALL_BLOCKS action.
   */
  selectAllBlocks: (): SelectAllBlocksAction => ({
    type: 'SELECT_ALL_BLOCKS',
  }),

  /**
   * Creates a CLEAR_BLOCK_SELECTION action.
   */
  clearBlockSelection: (): ClearBlockSelectionAction => ({
    type: 'CLEAR_BLOCK_SELECTION',
  }),

  /**
   * Creates a DELETE_SELECTED_BLOCKS action.
   */
  deleteSelectedBlocks: (): DeleteSelectedBlocksAction => ({
    type: 'DELETE_SELECTED_BLOCKS',
  }),

  /**
   * Creates an UNDO action.
   */
  undo: (): UndoAction => ({
    type: 'UNDO',
  }),

  /**
   * Creates a REDO action.
   */
  redo: (): RedoAction => ({
    type: 'REDO',
  }),
};

