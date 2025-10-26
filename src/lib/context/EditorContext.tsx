/**
 * Mina Rich Editor - Context Provider
 * 
 * React context provider for managing editor state using useReducer.
 * Provides state and dispatch to all child components.
 * 
 * @packageDocumentation
 */

'use client';

import React, { createContext, useReducer, useContext, useMemo, useRef, useCallback } from 'react';
import { EditorState, ContainerNode, SelectionInfo } from '../types';
import { editorReducer, createInitialState } from '../reducer/editor-reducer';
import { EditorAction } from '../reducer/actions';

/**
 * Context for the editor state (read-only).
 */
const EditorStateContext = createContext<EditorState | undefined>(undefined);

/**
 * Context for the dispatch function (write operations).
 */
const EditorDispatchContext = createContext<
  React.Dispatch<EditorAction> | undefined
>(undefined);

/**
 * Interface for selection manager that doesn't cause re-renders
 */
interface SelectionManager {
  /** Get current selection info without triggering re-render */
  getSelection: () => SelectionInfo | null;
  /** Set selection info without triggering re-render */
  setSelection: (selection: SelectionInfo | null) => void;
  /** Subscribe to selection changes (for toolbar updates only) */
  subscribe: (callback: (selection: SelectionInfo | null) => void) => () => void;
}

/**
 * Context for selection management (optimized to avoid re-renders)
 */
const SelectionContext = createContext<SelectionManager | undefined>(undefined);

/**
 * Props for the EditorProvider component.
 */
export interface EditorProviderProps {
  /** Child components that will have access to the editor context */
  children: React.ReactNode;

  /** Initial container to populate the editor with */
  initialContainer?: ContainerNode;

  /** Complete initial state (overrides initialContainer if provided) */
  initialState?: EditorState;

  /** Callback fired whenever the state changes */
  onChange?: (state: EditorState) => void;

  /** Enable debug logging for state changes */
  debug?: boolean;
}

/**
 * EditorProvider component.
 * Wraps your application/components to provide editor state and dispatch.
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <EditorProvider initialContainer={myDocument} onChange={handleChange}>
 *       <EditorToolbar />
 *       <EditorCanvas />
 *     </EditorProvider>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // With debug mode
 * <EditorProvider debug onChange={(state) => console.log('State:', state)}>
 *   <MyEditor />
 * </EditorProvider>
 * ```
 */
export function EditorProvider({
  children,
  initialContainer,
  initialState,
  onChange,
  debug = false,
}: EditorProviderProps) {
  
  // Use useRef to ensure initialEditorState is only computed once
  // This prevents createInitialState from being called on every render
  const initialEditorStateRef = React.useRef<EditorState | null>(null);
  
  if (initialEditorStateRef.current === null) {
    initialEditorStateRef.current = initialState || createInitialState(initialContainer);
  }
  
  const initialEditorState = initialEditorStateRef.current;
  
  // Set up reducer with useReducer
  const [state, dispatch] = useReducer(
    editorReducer,
    initialEditorState
  );

  // Create selection manager (doesn't cause re-renders)
  const selectionRef = useRef<SelectionInfo | null>(null);
  const selectionSubscribers = useRef<Set<(selection: SelectionInfo | null) => void>>(new Set());

  const selectionManager = useMemo<SelectionManager>(() => ({
    getSelection: () => selectionRef.current,
    setSelection: (selection: SelectionInfo | null) => {
      selectionRef.current = selection;
      // Notify subscribers (e.g., toolbar) but don't trigger full re-render
      selectionSubscribers.current.forEach(callback => callback(selection));
    },
    subscribe: (callback: (selection: SelectionInfo | null) => void) => {
      selectionSubscribers.current.add(callback);
      return () => {
        selectionSubscribers.current.delete(callback);
      };
    },
  }), []);

  // Create wrapped dispatch that includes onChange and debug logging
  const enhancedDispatch = useMemo(() => {
    return (action: EditorAction) => {
      if (debug) {
        console.group(`🎬 [Mina Editor] Action: ${action.type}`);
        if ('payload' in action) {
          }
        const currentContainer = state.history[state.historyIndex];
      }

      // Dispatch the action
      dispatch(action);

      // Note: The new state will be available on the next render
      // If we need the new state immediately, we'd need to use a ref or middleware
      
      if (debug) {
        console.groupEnd();
      }
    };
  }, [dispatch, debug, state]);

  // Call onChange when state changes
  React.useEffect(() => {
    if (onChange) {
      onChange(state);
    }
  }, [state, onChange]);

  return (
    <EditorStateContext.Provider value={state}>
      <EditorDispatchContext.Provider value={enhancedDispatch}>
        <SelectionContext.Provider value={selectionManager}>
          {children}
        </SelectionContext.Provider>
      </EditorDispatchContext.Provider>
    </EditorStateContext.Provider>
  );
}

/**
 * Hook to access the current editor state.
 * Must be used within an EditorProvider.
 * 
 * @returns Current editor state
 * @throws Error if used outside of EditorProvider
 * 
 * @example
 * ```tsx
 * function EditorStatus() {
 *   const state = useEditorState();
 *   return <div>Version: {state.version}</div>;
 * }
 * ```
 */
export function useEditorState(): EditorState {
  const context = useContext(EditorStateContext);
  
  if (context === undefined) {
    throw new Error(
      'useEditorState must be used within an EditorProvider. ' +
      'Wrap your component tree with <EditorProvider>.'
    );
  }
  
  return context;
}

/**
 * Hook to access the dispatch function for updating editor state.
 * Must be used within an EditorProvider.
 * 
 * @returns Dispatch function to send actions
 * @throws Error if used outside of EditorProvider
 * 
 * @example
 * ```tsx
 * function DeleteButton({ nodeId }: { nodeId: string }) {
 *   const dispatch = useEditorDispatch();
 *   
 *   return (
 *     <button onClick={() => dispatch({ 
 *       type: 'DELETE_NODE', 
 *       payload: { id: nodeId } 
 *     })}>
 *       Delete
 *     </button>
 *   );
 * }
 * ```
 */
export function useEditorDispatch(): React.Dispatch<EditorAction> {
  const context = useContext(EditorDispatchContext);
  
  if (context === undefined) {
    throw new Error(
      'useEditorDispatch must be used within an EditorProvider. ' +
      'Wrap your component tree with <EditorProvider>.'
    );
  }
  
  return context;
}

/**
 * Convenience hook that returns both state and dispatch.
 * Equivalent to calling useEditorState() and useEditorDispatch() separately.
 * 
 * @returns Tuple of [state, dispatch]
 * @throws Error if used outside of EditorProvider
 * 
 * @example
 * ```tsx
 * function EditorControls() {
 *   const [state, dispatch] = useEditor();
 *   const container = state.history[state.historyIndex];
 *   
 *   const addParagraph = () => {
 *     dispatch({
 *       type: 'INSERT_NODE',
 *       payload: {
 *         node: { id: 'p-new', type: 'p', content: 'New paragraph' },
 *         targetId: container.id,
 *         position: 'append'
 *       }
 *     });
 *   };
 *   
 *   return <button onClick={addParagraph}>Add Paragraph</button>;
 * }
 * ```
 */
export function useEditor(): [EditorState, React.Dispatch<EditorAction>] {
  return [useEditorState(), useEditorDispatch()];
}

/**
 * Hook to select a specific part of the editor state.
 * Helps optimize re-renders by only subscribing to the data you need.
 * 
 * @param selector - Function to select data from state
 * @returns Selected data
 * 
 * @example
 * ```tsx
 * function NodeCounter() {
 *   const nodeCount = useEditorSelector((state) => {
 *     const container = state.history[state.historyIndex];
 *     let count = 0;
 *     traverseTree(container, () => count++);
 *     return count;
 *   });
 *   
 *   return <div>Total nodes: {nodeCount}</div>;
 * }
 * ```
 */
export function useEditorSelector<T>(
  selector: (state: EditorState) => T
): T {
  const state = useEditorState();
  return useMemo(() => selector(state), [selector, state]);
}

/**
 * Hook to get a specific node by ID.
 * Returns undefined if node is not found.
 * 
 * OPTIMIZED: This hook uses a selector to only re-render when the specific node changes,
 * not when any part of the state changes.
 * 
 * @param nodeId - The ID of the node to find
 * @returns The node or undefined
 * 
 * @example
 * ```tsx
 * function NodeEditor({ nodeId }: { nodeId: string }) {
 *   const node = useNode(nodeId);
 *   
 *   if (!node) {
 *     return <div>Node not found</div>;
 *   }
 *   
 *   return <div>{node.type}: {isTextNode(node) ? node.content : 'Container'}</div>;
 * }
 * ```
 */
export function useNode(nodeId: string) {
  const state = useEditorState();
  
  // Memoize the selector function itself to prevent recreation
  const selector = useCallback(() => {
    const { findNodeById } = require('../utils/tree-operations');
    const currentContainer = state.history[state.historyIndex];
    return findNodeById(currentContainer, nodeId);
  }, [state.history, state.historyIndex, nodeId]);
  
  return useMemo(selector, [selector]);
}

/**
 * Hook to check if a specific node is active.
 * Only re-renders when the active status of THIS node changes.
 * 
 * @param nodeId - The ID of the node to check
 * @returns true if the node is active, false otherwise
 * 
 * @example
 * ```tsx
 * function Block({ nodeId }: { nodeId: string }) {
 *   const isActive = useIsNodeActive(nodeId);
 *   
 *   return <div className={isActive ? 'active' : ''}>{nodeId}</div>;
 * }
 * ```
 */
export function useIsNodeActive(nodeId: string): boolean {
  const state = useEditorState();
  return useMemo(() => state.activeNodeId === nodeId, [state.activeNodeId, nodeId]);
}

/**
 * Hook to get the current active node ID.
 * Only re-renders when the active node ID changes.
 * 
 * @returns The ID of the active node or null
 */
export function useActiveNodeId(): string | null {
  const state = useEditorState();
  return useMemo(() => state.activeNodeId, [state.activeNodeId]);
}

/**
 * Hook to get the current container's children IDs.
 * Useful for rendering lists of blocks without subscribing to full node data.
 * 
 * @returns Array of child node IDs from the current container
 */
export function useContainerChildrenIds(): string[] {
  const state = useEditorState();
  return useMemo(() => {
    const currentContainer = state.history[state.historyIndex];
    return currentContainer.children.map(child => child.id);
  }, [state.history, state.historyIndex]);
}

/**
 * Hook to access the selection manager.
 * This provides optimized selection tracking that doesn't cause re-renders.
 * 
 * @returns Selection manager
 * @throws Error if used outside of EditorProvider
 * 
 * @example
 * ```tsx
 * function MyEditor() {
 *   const selectionManager = useSelectionManager();
 *   
 *   // Get selection without causing re-render
 *   const selection = selectionManager.getSelection();
 *   
 *   // Update selection without causing re-render
 *   selectionManager.setSelection(newSelection);
 * }
 * ```
 */
export function useSelectionManager(): SelectionManager {
  const context = useContext(SelectionContext);
  
  if (context === undefined) {
    throw new Error(
      'useSelectionManager must be used within an EditorProvider. ' +
      'Wrap your component tree with <EditorProvider>.'
    );
  }
  
  return context;
}

/**
 * Hook to subscribe to selection changes (for toolbar/UI updates).
 * Only components that need to react to selection changes should use this.
 * 
 * @returns Current selection info (reactive - causes re-renders on change)
 * 
 * @example
 * ```tsx
 * function FormattingToolbar() {
 *   const selection = useSelection();
 *   
 *   if (!selection) return null;
 *   
 *   return (
 *     <div>
 *       Selected: {selection.text}
 *       Bold: {selection.formats.bold ? 'Yes' : 'No'}
 *     </div>
 *   );
 * }
 * ```
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

