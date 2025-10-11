/**
 * Mina Rich Editor - Context Provider
 * 
 * React context provider for managing editor state using useReducer.
 * Provides state and dispatch to all child components.
 * 
 * @packageDocumentation
 */

'use client';

import React, { createContext, useReducer, useContext, useMemo } from 'react';
import { EditorState, ContainerNode } from '../types';
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
  // Create initial state
  const initialEditorState = useMemo(() => {
    if (initialState) {
      return initialState;
    }
    if (initialContainer) {
      return createInitialState(initialContainer);
    }
    return createInitialState();
  }, [initialState, initialContainer]);

  // Set up reducer with useReducer
  const [state, dispatch] = useReducer(
    editorReducer,
    initialEditorState
  );

  // Create wrapped dispatch that includes onChange and debug logging
  const enhancedDispatch = useMemo(() => {
    return (action: EditorAction) => {
      if (debug) {
        console.group(`🎬 [Mina Editor] Action: ${action.type}`);
        if ('payload' in action) {
          console.log('📦 Payload:', action.type !== 'REPLACE_CONTAINER' ? action.payload : '(large payload)');
        }
        const currentContainer = state.history[state.historyIndex];
        console.log('📸 Previous State:', {
          activeNodeId: state.activeNodeId,
          hasSelection: state.hasSelection,
          selectionKey: state.selectionKey,
          currentSelection: state.currentSelection,
          nodeCount: currentContainer?.children.length || 0,
          historyIndex: state.historyIndex,
          historyLength: state.history.length,
        });
      }

      // Dispatch the action
      dispatch(action);

      // Note: The new state will be available on the next render
      // If we need the new state immediately, we'd need to use a ref or middleware
      
      if (debug) {
        console.log('⏱️  Action dispatched at:', new Date().toISOString());
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
        {children}
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
  
  return useMemo(() => {
    const { findNodeById } = require('../utils/tree-operations');
    const currentContainer = state.history[state.historyIndex];
    return findNodeById(currentContainer, nodeId);
  }, [state.history, state.historyIndex, nodeId]);
}

