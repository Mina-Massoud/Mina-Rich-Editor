/**
 * Zustand Store for Mina Rich Editor
 *
 * Optimized for performance with selective subscriptions.
 * Blocks subscribe only to their specific data, not the entire history.
 */

import React from "react";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import {
  EditorState,
  ContainerNode,
  SelectionInfo,
  EditorNode,
  TextNode,
} from "../types";
import { editorReducer, createInitialState } from "../reducer/editor-reducer";
import { EditorAction } from "../reducer/actions";

// Store interface
interface EditorStore extends EditorState {
  // Actions
  dispatch: (action: EditorAction) => void;

  // Optimized selectors that don't cause re-renders
  getNode: (nodeId: string) => EditorNode | undefined;
  getContainer: () => ContainerNode;
  isNodeActive: (nodeId: string) => boolean;
  getActiveNodeId: () => string | null;
  getContainerChildrenIds: () => string[];

  // Selection management (optimized to avoid re-renders)
  selectionManager: {
    getSelection: () => SelectionInfo | null;
    setSelection: (selection: SelectionInfo | null) => void;
    subscribe: (
      callback: (selection: SelectionInfo | null) => void
    ) => () => void;
  };

  // Internal selection state (not reactive)
  _selection: SelectionInfo | null;
  _selectionSubscribers: Set<(selection: SelectionInfo | null) => void>;
}

// Helper function to find node by ID in tree
function findNodeById(
  container: ContainerNode,
  nodeId: string
): EditorNode | undefined {
  if (container.id === nodeId) return container;

  for (const child of container.children) {
    if (child.id === nodeId) return child;

    if ("children" in child && Array.isArray(child.children)) {
      const found = findNodeById(child as ContainerNode, nodeId);
      if (found) return found;
    }
  }

  return undefined;
}

// Static empty Set to avoid creating new instances
const EMPTY_SELECTED_BLOCKS = new Set<string>();

// Create the store with subscribeWithSelector middleware for fine-grained subscriptions
export const useEditorStore = create<EditorStore>()(
  subscribeWithSelector((set, get) => {
    // Initialize selection subscribers
    const selectionSubscribers = new Set<
      (selection: SelectionInfo | null) => void
    >();

    return {
      // Initialize with default state
      ...createInitialState(),

      // Selection state (non-reactive)
      _selection: null,
      _selectionSubscribers: selectionSubscribers,

      // Main dispatch function
      dispatch: (action: EditorAction) => {
        const currentState = get();
        const newState = editorReducer(currentState, action);

        // Update the store with new state
        set(newState);
      },

      // Optimized selectors (these don't cause subscriptions)
      getNode: (nodeId: string) => {
        const container = get().history[get().historyIndex];
        return findNodeById(container, nodeId);
      },

      getContainer: () => {
        return get().history[get().historyIndex];
      },

      isNodeActive: (nodeId: string) => {
        return get().activeNodeId === nodeId;
      },

      getActiveNodeId: () => {
        return get().activeNodeId;
      },

      getContainerChildrenIds: () => {
        const container = get().history[get().historyIndex];
        return container.children.map((child) => child.id);
      },

      // Selection manager (optimized to avoid re-renders)
      selectionManager: {
        getSelection: () => get()._selection,

        setSelection: (selection: SelectionInfo | null) => {
          // Update internal selection without triggering re-renders
          set({ _selection: selection });

          // Notify subscribers (e.g., toolbar) but don't trigger full re-render
          const subscribers = get()._selectionSubscribers;
          subscribers.forEach((callback) => callback(selection));
        },

        subscribe: (callback: (selection: SelectionInfo | null) => void) => {
          const subscribers = get()._selectionSubscribers;
          subscribers.add(callback);
          return () => {
            subscribers.delete(callback);
          };
        },
      },
    };
  })
);

// Specialized hooks for components to subscribe to specific data

/**
 * Hook for blocks to subscribe only to their specific node data
 * This prevents re-renders when other nodes change
 * 
 * OPTIMIZATION: Uses subscribeWithSelector to ONLY subscribe to this specific node.
 * The selector function extracts just this node, and Zustand only notifies us
 * when the RETURN VALUE changes (using Object.is for reference equality).
 * 
 * How it works:
 * 1. Selector extracts ONLY this specific node from state
 * 2. Zustand tracks the selector's return value
 * 3. On state change, Zustand re-runs selector and compares old vs new return value
 * 4. Only triggers re-render if the node reference actually changed
 * 5. Combined with structural sharing in reducer, unchanged nodes keep same reference
 * 
 * Result:
 * - Type in block A → only block A's node reference changes → only block A re-renders ✅
 * - All other blocks keep same reference → selector returns same value → no re-render ✅
 */
export function useBlockNode(nodeId: string) {
  return useEditorStore((state) => {
    const container = state.history[state.historyIndex];
    return findNodeById(container, nodeId);
  });
}

/**
 * Hook to check if a specific node is active
 * Only re-renders when the active status of THIS node changes
 */
export function useIsNodeActive(nodeId: string): boolean {
  return useEditorStore((state) => state.activeNodeId === nodeId);
}

/**
 * Hook to get the current active node ID
 * Only re-renders when the active node ID changes
 */
export function useActiveNodeId(): string | null {
  return useEditorStore((state) => state.activeNodeId);
}

/**
 * Hook to get the current container's children IDs
 * Only re-renders when the children array changes
 * Uses useShallow to prevent unnecessary re-renders from array recreation
 */
export function useContainerChildrenIds(): string[] {
  return useEditorStore(
    useShallow((state) => {
      const container = state.history[state.historyIndex];
      return container.children.map((child) => child.id);
    })
  );
}

/**
 * Hook to get the current container
 * Use sparingly - prefer more specific hooks when possible
 * Uses useShallow to prevent unnecessary re-renders when container reference hasn't changed
 */
export function useContainer(): ContainerNode {
  return useEditorStore(
    useShallow((state) => state.history[state.historyIndex])
  );
}

/**
 * Hook to get the current container (non-reactive, for use in callbacks)
 * This doesn't subscribe to changes, use it for one-time reads in event handlers
 * Uses shallow equality since the getter function should be stable
 */
export function useContainerGetter(): () => ContainerNode {
  return useEditorStore(
    useShallow((state) => () => state.history[state.historyIndex])
  );
}

/**
 * Hook to get the dispatch function
 * This never changes so no re-renders
 * Uses shallow equality to ensure stable reference
 */
export function useEditorDispatch() {
  return useEditorStore(
    useShallow((state) => state.dispatch)
  );
}

/**
 * Hook to get the full editor state
 * Use only when you need the complete state (like for toolbars)
 * Uses useShallow to prevent infinite loops by caching the result
 */
export function useEditorState(): EditorState {
  return useEditorStore(
    useShallow((state) => ({
      history: state.history,
      historyIndex: state.historyIndex,
      activeNodeId: state.activeNodeId,
      currentSelection: state.currentSelection,
      version: state.version,
      coverImage: state.coverImage,
      hasSelection: state.currentSelection !== null,
      selectionKey: state.version
        ? parseInt(state.version.split(".").join(""))
        : 0,
      selectedBlocks: EMPTY_SELECTED_BLOCKS,
    }))
  );
}

/**
 * Hook for selection management (optimized to avoid re-renders)
 * Uses shallow equality since selectionManager is a stable object
 */
export function useSelectionManager() {
  return useEditorStore(
    useShallow((state) => state.selectionManager)
  );
}

/**
 * Hook to subscribe to selection changes (for toolbar/UI updates)
 * Only components that need to react to selection changes should use this
 */
export function useSelection(): SelectionInfo | null {
  const selectionManager = useSelectionManager();
  const [selection, setSelection] = React.useState<SelectionInfo | null>(
    selectionManager.getSelection()
  );

  React.useEffect(() => {
    const unsubscribe = selectionManager.subscribe(setSelection);
    return unsubscribe;
  }, [selectionManager]);

  return selection;
}

// Provider component for initialization
export interface EditorProviderProps {
  children: React.ReactNode;
  initialContainer?: ContainerNode;
  initialState?: EditorState;
  onChange?: (state: EditorState) => void;
  debug?: boolean;
}

export function EditorProvider({
  children,
  initialContainer,
  initialState,
  onChange,
  debug = false,
}: EditorProviderProps) {
  const store = useEditorStore();

  // Initialize store with provided state
  React.useEffect(() => {
    if (initialState) {
      // Set the initial state
      useEditorStore.setState(initialState);
    } else if (initialContainer) {
      // Create initial state from container
      const newState = createInitialState(initialContainer);
      useEditorStore.setState(newState);
    }
  }, [initialContainer, initialState]);

  // Subscribe to state changes for onChange callback
  React.useEffect(() => {
    if (!onChange) return;

    return useEditorStore.subscribe((state) => {
      const editorState: EditorState = {
        history: state.history,
        historyIndex: state.historyIndex,
        activeNodeId: state.activeNodeId,
        currentSelection: state.currentSelection,
        version: state.version,
        coverImage: state.coverImage,
        hasSelection: state.currentSelection !== null,
        selectionKey: state.version
          ? parseInt(state.version.split(".").join(""))
          : 0,
        selectedBlocks: new Set<string>(),
      };
      onChange(editorState);
    });
  }, [onChange]);

  // Debug logging
  React.useEffect(() => {
    if (!debug) return;

    let prevState = useEditorStore.getState();
    return useEditorStore.subscribe((state) => {
      console.group("🎬 [Mina Editor] State Change");
      console.log("Previous:", prevState);
      console.log("Current:", state);
      console.groupEnd();
      prevState = state;
    });
  }, [debug]);

  
  return React.createElement(React.Fragment, null, children);
}
