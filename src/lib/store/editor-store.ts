/**
 * Zustand Store for Mina Rich Editor
 *
 * Instance-based factory with React context for supporting multiple editor
 * instances on the same page. Each EditorProvider creates its own isolated
 * store instance.
 *
 * Optimized for performance with selective subscriptions.
 * Blocks subscribe only to their specific data, not the entire history.
 */

import React from "react";
import { create, useStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import {
  EditorState,
  ContainerNode,
  SelectionInfo,
  EditorNode,
} from "../types";
import { editorReducer, createInitialState } from "../reducer/editor-reducer";
import { EditorAction } from "../reducer/actions";
import { buildNodeMap } from "../utils/tree-operations";
import { ExtensionManager } from "../extensions/ExtensionManager";
import { StarterKit } from "../extensions/starter-kit";
import type { AnyResolvedExtension } from "../extensions/types";

// Store interface
interface EditorStore extends EditorState {
  // Extension registry — populated with StarterKit by default.
  extensionManager: ExtensionManager;

  // Derived cache: flat map of nodeId → EditorNode for O(1) lookups.
  // Rebuilt after every dispatch. NOT part of EditorState.
  nodeMap: Map<string, EditorNode>;

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

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create a new isolated editor store instance.
 * Each EditorProvider calls this once and holds the returned store in a ref.
 */
export function createEditorStore(
  initialContainer?: ContainerNode,
  initialState?: EditorState,
  extensions?: AnyResolvedExtension[]
) {
  // Create extension manager — use provided extensions or fall back to StarterKit
  const extensionManager = new ExtensionManager();
  extensionManager.register(...(extensions ?? StarterKit));

  return create<EditorStore>()(
    subscribeWithSelector((set, get) => {
      // Initialize selection subscribers
      const selectionSubscribers = new Set<
        (selection: SelectionInfo | null) => void
      >();

      const baseState =
        initialState ??
        (initialContainer
          ? createInitialState(initialContainer)
          : createInitialState());

      return {
        // Initialize with provided or default state
        ...baseState,

        // Extension registry
        extensionManager,

        // Derived node map for O(1) lookups — rebuilt after every dispatch.
        nodeMap: buildNodeMap(baseState.current),

        // Selection state (non-reactive)
        _selection: null,
        _selectionSubscribers: selectionSubscribers,

        // Main dispatch function
        dispatch: (action: EditorAction) => {
          const currentState = get();
          const newState = editorReducer(currentState, action);
          // Only update EditorState fields - preserve store methods (dispatch, getNode, etc.)
          // Rebuild nodeMap for O(1) lookups in useBlockNode.
          set({
            version: newState.version,
            current: newState.current,
            undoStack: newState.undoStack,
            redoStack: newState.redoStack,
            activeNodeId: newState.activeNodeId,
            hasSelection: newState.hasSelection,
            selectionKey: newState.selectionKey,
            currentSelection: newState.currentSelection,
            selectedBlocks: newState.selectedBlocks,
            coverImage: newState.coverImage,
            metadata: newState.metadata,
            nodeMap: buildNodeMap(newState.current),
          });
        },

        // Optimized selectors (these don't cause subscriptions)
        getNode: (nodeId: string) => {
          return findNodeById(get().current, nodeId);
        },

        getContainer: () => {
          return get().current;
        },

        isNodeActive: (nodeId: string) => {
          return get().activeNodeId === nodeId;
        },

        getActiveNodeId: () => {
          return get().activeNodeId;
        },

        getContainerChildrenIds: () => {
          return get().current.children.map((child) => child.id);
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

          subscribe: (
            callback: (selection: SelectionInfo | null) => void
          ) => {
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
}

// ─── React context ────────────────────────────────────────────────────────────

const EditorStoreContext = React.createContext<ReturnType<
  typeof createEditorStore
> | null>(null);

/**
 * Access the store instance from context.
 * Throws if used outside an EditorProvider.
 */
function useEditorStoreContext() {
  const store = React.useContext(EditorStoreContext);
  if (!store) {
    throw new Error(
      "useEditorStore must be used within an <EditorProvider>. " +
        "Wrap your editor in <EditorProvider> to fix this."
    );
  }
  return store;
}

// ─── Public hook (backward-compatible) ───────────────────────────────────────

/**
 * Returns the raw Zustand store instance from the nearest EditorProvider.
 * Use this when you need to call `store.subscribe(...)` or `store.getState()`
 * directly (e.g. to set up side-effect subscriptions without causing re-renders).
 *
 * Throws if used outside an EditorProvider.
 */
export function useEditorStoreInstance() {
  return useEditorStoreContext();
}

/**
 * Low-level hook that returns the Zustand store bound to the nearest
 * EditorProvider. Accepts an optional selector, matching the Zustand API.
 *
 * Prefer the specialized hooks (useEditorState, useEditorDispatch, …) over
 * calling this directly.
 */
export function useEditorStore<T>(
  selector: (state: EditorStore) => T
): T;
export function useEditorStore(): EditorStore;
export function useEditorStore<T>(
  selector?: (state: EditorStore) => T
): T | EditorStore {
  const store = useEditorStoreContext();
  // When no selector is provided return the full state (matches old API)
  return useStore(store, selector ?? ((s) => s as unknown as T)) as
    | T
    | EditorStore;
}

// ─── Specialized hooks ────────────────────────────────────────────────────────

/**
 * Hook for blocks to subscribe only to their specific node data.
 * Prevents re-renders when other nodes change.
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
  const store = useEditorStoreContext();
  return useStore(store, (state) => state.nodeMap.get(nodeId));
}

/**
 * Hook to check if a specific node is active.
 * Only re-renders when the active status of THIS node changes.
 */
export function useIsNodeActive(nodeId: string): boolean {
  const store = useEditorStoreContext();
  return useStore(store, (state) => state.activeNodeId === nodeId);
}

/**
 * Hook to get the current active node ID.
 * Only re-renders when the active node ID changes.
 */
export function useActiveNodeId(): string | null {
  const store = useEditorStoreContext();
  return useStore(store, (state) => state.activeNodeId);
}

/**
 * Hook to get the current container's children IDs.
 * Only re-renders when the children array changes.
 * Uses useShallow to prevent unnecessary re-renders from array recreation.
 */
export function useContainerChildrenIds(): string[] {
  const store = useEditorStoreContext();
  return useStore(
    store,
    useShallow((state) => {
      return state.current.children.map((child) => child.id);
    })
  );
}

/**
 * Hook to get the current container.
 * Use sparingly - prefer more specific hooks when possible.
 */
export function useContainer(): ContainerNode {
  const store = useEditorStoreContext();
  return useStore(store, (state) => state.current);
}

/**
 * Hook to get a stable getter for the current container.
 * Returns store.getState()-based getter - safe for callbacks/effects.
 */
export function useContainerGetter(): () => ContainerNode {
  const store = useEditorStoreContext();
  return React.useCallback(
    () => store.getState().current,
    [store]
  );
}

/**
 * Hook to access the ExtensionManager from the nearest EditorProvider.
 * Stable reference — never causes re-renders.
 */
export function useExtensionManager(): ExtensionManager {
  const store = useEditorStoreContext();
  return useStore(store, (state) => state.extensionManager);
}

/**
 * Hook to get the dispatch function.
 * Dispatch is a stable reference - never causes re-renders.
 */
export function useEditorDispatch() {
  const store = useEditorStoreContext();
  return useStore(store, (state) => state.dispatch);
}

/**
 * Hook to get the full editor state.
 * Use only when you need the complete state (like for toolbars).
 */
export function useEditorState(): EditorState {
  const store = useEditorStoreContext();
  return useStore(
    store,
    useShallow((state) => ({
      current: state.current,
      undoStack: state.undoStack,
      redoStack: state.redoStack,
      activeNodeId: state.activeNodeId,
      currentSelection: state.currentSelection,
      version: state.version,
      coverImage: state.coverImage,
      hasSelection: state.currentSelection !== null,
      selectionKey: state.selectionKey,
      selectedBlocks: state.selectedBlocks,
    }))
  );
}

/**
 * Hook for selection management (optimized to avoid re-renders).
 * selectionManager is a stable object created once per store.
 */
export function useSelectionManager() {
  const store = useEditorStoreContext();
  return useStore(store, (state) => state.selectionManager);
}

/**
 * Hook to subscribe to selection changes (for toolbar/UI updates).
 * Only components that need to react to selection changes should use this.
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

// ─── Provider ─────────────────────────────────────────────────────────────────

/** Props accepted by the EditorProvider component. */
export interface EditorProviderProps {
  children: React.ReactNode;
  initialContainer?: ContainerNode;
  initialState?: EditorState;
  /** Custom extensions (defaults to StarterKit if not provided). */
  extensions?: AnyResolvedExtension[];
  onChange?: (state: EditorState) => void;
}

/** React context provider that creates and exposes an isolated editor store instance to all child components. */
export function EditorProvider({
  children,
  initialContainer,
  initialState,
  extensions,
  onChange,
}: EditorProviderProps) {
  // Create the store exactly once per provider mount.
  // Use lazy-init useState (NOT useRef) because React Strict Mode unmounts
  // and remounts components, which resets refs but not state. With useState,
  // the store survives Strict Mode double-render and keeps the same IDs
  // that were generated during the first initialization.
  const [store] = React.useState(() =>
    createEditorStore(initialContainer, initialState, extensions)
  );

  // If initialState/initialContainer change AFTER mount, sync the store.
  const prevContainerRef = React.useRef(initialContainer);
  const prevStateRef = React.useRef(initialState);
  React.useEffect(() => {
    // Skip on first mount — the store already has the initial data
    if (
      prevContainerRef.current === initialContainer &&
      prevStateRef.current === initialState
    ) {
      return;
    }
    prevContainerRef.current = initialContainer;
    prevStateRef.current = initialState;

    if (initialState) {
      store.setState(initialState);
    } else if (initialContainer) {
      const newState = createInitialState(initialContainer);
      store.setState(newState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialContainer, initialState]);

  // Subscribe to state changes for onChange callback
  React.useEffect(() => {
    if (!onChange) return;

    return store.subscribe((state) => {
      const editorState: EditorState = {
        current: state.current,
        undoStack: state.undoStack,
        redoStack: state.redoStack,
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
  }, [onChange, store]);

  return React.createElement(
    EditorStoreContext.Provider,
    { value: store },
    children
  );
}
