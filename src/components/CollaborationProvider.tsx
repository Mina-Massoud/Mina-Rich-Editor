/**
 * Mina Rich Editor - CollaborationProvider
 *
 * Convenience wrapper component that activates real-time collaboration
 * for all descendant editor components. Must be placed **inside** an
 * `<EditorProvider>`.
 *
 * ## Usage
 *
 * ```tsx
 * import { EditorProvider, CompactEditor } from '@mina-editor/core';
 * import { CollaborationProvider } from '@mina-editor/core';
 *
 * function App() {
 *   return (
 *     <EditorProvider initialContent={content}>
 *       <CollaborationProvider
 *         roomId="doc-123"
 *         serverUrl="wss://collab.example.com"
 *         user={{ name: "Alice", color: "#e66" }}
 *       >
 *         <CompactEditor />
 *       </CollaborationProvider>
 *     </EditorProvider>
 *   );
 * }
 * ```
 *
 * @packageDocumentation
 */

import React, { createContext, useContext } from 'react';
import { useCollaboration } from '../hooks/useCollaboration';
import type { CollabOptions, CollabState } from '../lib/collaboration/types';

// ─── Context ──────────────────────────────────────────────────────────────────

const CollaborationContext = createContext<CollabState | null>(null);

/**
 * Read the current collaboration state from the nearest
 * `<CollaborationProvider>`. Returns `null` when collaboration is not
 * active (i.e. the component is rendered outside a provider).
 */
export function useCollaborationState(): CollabState | null {
  return useContext(CollaborationContext);
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CollaborationProviderProps extends CollabOptions {
  children: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Wraps children in a collaboration context that maintains a Y.js
 * connection and syncs editor state bidirectionally.
 *
 * Props are identical to `CollabOptions` plus `children`.
 */
export function CollaborationProvider({
  children,
  roomId,
  serverUrl,
  user,
}: CollaborationProviderProps) {
  const collabState = useCollaboration({ roomId, serverUrl, user });

  return React.createElement(
    CollaborationContext.Provider,
    { value: collabState },
    children
  );
}
