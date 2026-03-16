/**
 * Mina Rich Editor - History Operations
 *
 * Handles undo/redo using inverted operations instead of snapshot arrays.
 *
 * @packageDocumentation
 */

import { EditorState, ContainerNode } from '../../types';
import { addToHistory, applyOperation, withTimestamp } from './shared';

/**
 * Undo the last operation.
 * Pops from undoStack, applies the backward operation, pushes to redoStack.
 */
export function handleUndo(state: EditorState): EditorState {
  if (state.undoStack.length === 0) {
    return state;
  }

  const entry = state.undoStack[state.undoStack.length - 1];
  const newContainer = applyOperation(state.current, entry.backward);

  return {
    ...state,
    current: newContainer,
    undoStack: state.undoStack.slice(0, -1),
    redoStack: [...state.redoStack, entry],
  };
}

/**
 * Redo the last undone operation.
 * Pops from redoStack, applies the forward operation, pushes to undoStack.
 */
export function handleRedo(state: EditorState): EditorState {
  if (state.redoStack.length === 0) {
    return state;
  }

  const entry = state.redoStack[state.redoStack.length - 1];
  const newContainer = applyOperation(state.current, entry.forward);

  return {
    ...state,
    current: newContainer,
    redoStack: state.redoStack.slice(0, -1),
    undoStack: [...state.undoStack, entry],
  };
}

/**
 * Replace the entire container and record it in history (REPLACE_CONTAINER).
 */
export function handleReplaceContainer(
  state: EditorState,
  payload: { container: ContainerNode }
): EditorState {
  const oldContainer = state.current;
  return addToHistory(withTimestamp(state), payload.container, {
    forward: { type: 'replace_container', container: payload.container },
    backward: { type: 'replace_container', container: oldContainer },
  });
}
