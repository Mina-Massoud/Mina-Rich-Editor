/**
 * Zustand Editor Store
 * 
 * Modern state management for the editor using Zustand.
 * Provides optimized selectors that prevent unnecessary re-renders.
 * 
 * @packageDocumentation
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { EditorState, ContainerNode, EditorNode } from '../types';
import { editorReducer, createInitialState } from '../reducer/editor-reducer';
import { EditorAction } from '../reducer/actions';
import { findNodeById } from '../utils/tree-operations';

/**
 * Editor Store Interface
 */
export interface EditorStore extends EditorState {
  // Actions
  dispatch: (action: EditorAction) => void;
  
  // Utilities (optional - for convenience)
  getCurrentContainer: () => ContainerNode;
  getNode: (nodeId: string) => EditorNode | undefined;
}

/**
 * Create the Zustand editor store
 */
export const useEditorStore = create<EditorStore>()(
  devtools(
    (set, get) => ({
      // Initial state from existing reducer
      ...createInitialState(),

      // Dispatch action - reuses existing reducer logic
      dispatch: (action: EditorAction) => {
        set((state) => {
          // Get current state without dispatch/utilities
          const currentState: EditorState = {
            history: state.history,
            historyIndex: state.historyIndex,
            activeNodeId: state.activeNodeId,
            version: state.version,
            coverImage: state.coverImage,
            hasSelection: state.hasSelection,
            selectionKey: state.selectionKey,
            currentSelection: state.currentSelection,
            selectedBlocks: state.selectedBlocks,
            metadata: state.metadata,
          };

          // Run through existing reducer
          const newState = editorReducer(currentState, action);

          // Log action for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log('🎬 [Zustand] Action:', action.type, action);
          }

          return newState;
        }, false, action as any); // Pass action for devtools (cast to any for Zustand devtools compatibility)
      },

      // Utility: Get current container
      getCurrentContainer: () => {
        const state = get();
        return state.history[state.historyIndex];
      },

      // Utility: Get specific node by ID
      getNode: (nodeId: string) => {
        const container = get().getCurrentContainer();
        return findNodeById(container, nodeId);
      },
    }),
    { name: 'EditorStore' }
  )
);

/**
 * Hook to get a specific node by ID with optimized re-rendering.
 * Only re-renders when THIS specific node changes.
 * 
 * @param nodeId - The ID of the node to get
 * @returns The node or undefined if not found
 * 
 * @example
 * ```tsx
 * function Block({ nodeId }) {
 *   const node = useZustandNode(nodeId);
 *   // Only re-renders when this node changes!
 * }
 * ```
 */
export function useZustandNode(nodeId: string): EditorNode | undefined {
  return useEditorStore((state) => {
    const container = state.history[state.historyIndex];
    return findNodeById(container, nodeId);
  });
}

/**
 * Hook to check if a specific node is active.
 * Only re-renders when the active status of THIS node changes.
 * 
 * @param nodeId - The ID of the node to check
 * @returns true if the node is active
 */
export function useZustandIsNodeActive(nodeId: string): boolean {
  return useEditorStore((state) => state.activeNodeId === nodeId);
}

/**
 * Hook to get the active node ID.
 * Only re-renders when the active node ID changes.
 */
export function useZustandActiveNodeId(): string | null {
  return useEditorStore((state) => state.activeNodeId);
}

/**
 * Hook to get the container's children IDs.
 * Only re-renders when the children array changes.
 * Uses shallow comparison to prevent infinite loops.
 */
export function useZustandContainerChildrenIds(): string[] {
  return useEditorStore(
    useShallow((state) => {
      const container = state.history[state.historyIndex];
      return container.children.map(child => child.id);
    })
  );
}

/**
 * Hook to get the container's children nodes.
 * Only re-renders when children change.
 * Uses shallow comparison to prevent infinite loops.
 */
export function useZustandContainerChildren(): EditorNode[] {
  return useEditorStore(
    useShallow((state) => {
      const container = state.history[state.historyIndex];
      return container.children;
    })
  );
}

/**
 * Hook to get dispatch function.
 * Never causes re-renders.
 */
export function useZustandDispatch() {
  return useEditorStore((state) => state.dispatch);
}

/**
 * Hook to get current cover image.
 * Only re-renders when cover image changes.
 */
export function useZustandCoverImage() {
  return useEditorStore((state) => state.coverImage);
}

/**
 * Hook to check if can undo.
 * Only re-renders when undo availability changes.
 */
export function useZustandCanUndo(): boolean {
  return useEditorStore((state) => state.historyIndex > 0);
}

/**
 * Hook to check if can redo.
 * Only re-renders when redo availability changes.
 */
export function useZustandCanRedo(): boolean {
  return useEditorStore((state) => state.historyIndex < state.history.length - 1);
}

/**
 * Hook to get the entire editor state (use sparingly).
 * Re-renders on any state change.
 */
export function useZustandEditorState(): EditorState {
  return useEditorStore((state) => ({
    history: state.history,
    historyIndex: state.historyIndex,
    activeNodeId: state.activeNodeId,
    version: state.version,
    coverImage: state.coverImage,
    hasSelection: state.hasSelection,
    selectionKey: state.selectionKey,
    currentSelection: state.currentSelection,
    selectedBlocks: state.selectedBlocks,
    metadata: state.metadata,
  }));
}

