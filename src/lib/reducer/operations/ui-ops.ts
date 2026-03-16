/**
 * Mina Rich Editor - UI Operations
 *
 * Handles selection, active node, block selection, and cover image state.
 *
 * @packageDocumentation
 */

import { EditorState, SelectionInfo, CoverImage, TextNode } from '../../types';
import { addToHistory, getCurrentContainer, withTimestamp } from './shared';
import { generateId } from '../../utils/id-generator';

/**
 * Set the currently active/focused node (SET_ACTIVE_NODE).
 */
export function handleSetActiveNode(
  state: EditorState,
  payload: { nodeId: string | null }
): EditorState {
  return {
    ...state,
    activeNodeId: payload.nodeId,
  };
}

/**
 * Update the has-selection flag (SET_SELECTION).
 */
export function handleSetSelection(
  state: EditorState,
  payload: { hasSelection: boolean }
): EditorState {
  return {
    ...state,
    hasSelection: payload.hasSelection,
  };
}

/**
 * Bump the selection key to force re-renders (INCREMENT_SELECTION_KEY).
 */
export function handleIncrementSelectionKey(state: EditorState): EditorState {
  return {
    ...state,
    selectionKey: state.selectionKey + 1,
  };
}

/**
 * Set the current selection info (SET_CURRENT_SELECTION).
 */
export function handleSetCurrentSelection(
  state: EditorState,
  payload: { selection: SelectionInfo | null }
): EditorState {
  return {
    ...state,
    currentSelection: payload.selection,
    hasSelection: payload.selection !== null,
  };
}

/**
 * Mark all top-level blocks as selected (SELECT_ALL_BLOCKS).
 */
export function handleSelectAllBlocks(state: EditorState): EditorState {
  const currentContainer = getCurrentContainer(state);
  const allBlockIds = new Set(currentContainer.children.map((child) => child.id));
  return {
    ...state,
    selectedBlocks: allBlockIds,
  };
}

/**
 * Clear all block selections (CLEAR_BLOCK_SELECTION).
 */
export function handleClearBlockSelection(state: EditorState): EditorState {
  return {
    ...state,
    selectedBlocks: new Set(),
  };
}

/**
 * Delete all currently selected blocks (DELETE_SELECTED_BLOCKS).
 * If all blocks are removed a new empty paragraph is created as a fallback.
 */
export function handleDeleteSelectedBlocks(state: EditorState): EditorState {
  if (state.selectedBlocks.size === 0) {
    return state;
  }

  const currentContainer = getCurrentContainer(state);
  const newChildren = currentContainer.children.filter(
    (child) => !state.selectedBlocks.has(child.id)
  );

  // If all blocks were deleted, create a new empty paragraph
  if (newChildren.length === 0) {
    const newNode: TextNode = {
      id: generateId('p'),
      type: 'p',
      content: '',
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

/**
 * Set or update the cover image (SET_COVER_IMAGE).
 */
export function handleSetCoverImage(
  state: EditorState,
  payload: { coverImage: CoverImage }
): EditorState {
  return withTimestamp({
    ...state,
    coverImage: payload.coverImage,
  });
}

/**
 * Remove the cover image (REMOVE_COVER_IMAGE).
 */
export function handleRemoveCoverImage(state: EditorState): EditorState {
  return withTimestamp({
    ...state,
    coverImage: null,
  });
}

/**
 * Update the vertical position of the cover image (UPDATE_COVER_IMAGE_POSITION).
 */
export function handleUpdateCoverImagePosition(
  state: EditorState,
  payload: { position: number }
): EditorState {
  if (!state.coverImage) {
    return state;
  }
  return withTimestamp({
    ...state,
    coverImage: {
      ...state.coverImage,
      position: payload.position,
    },
  });
}
