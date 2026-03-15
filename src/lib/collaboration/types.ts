/**
 * Mina Rich Editor - Collaboration Type Definitions
 *
 * Types for the Y.js-based real-time collaboration system.
 * All collaboration features are opt-in; the base editor works without
 * `yjs` or `y-websocket` installed.
 *
 * @packageDocumentation
 */

/**
 * Options for initializing real-time collaboration.
 *
 * @example
 * ```tsx
 * <CollaborationProvider
 *   roomId="doc-123"
 *   serverUrl="wss://collab.example.com"
 *   user={{ name: "Alice", color: "#e66" }}
 * >
 *   <CompactEditor />
 * </CollaborationProvider>
 * ```
 */
export interface CollabOptions {
  /** Unique identifier for the shared document / room. */
  roomId: string;

  /** WebSocket server URL (e.g. `wss://collab.example.com`). */
  serverUrl: string;

  /** The local user's display information. */
  user: {
    name: string;
    color: string;
  };
}

/**
 * Live state exposed by the collaboration system.
 */
export interface CollabState {
  /** Whether the WebSocket connection is currently active. */
  isConnected: boolean;

  /** List of users currently in the room (includes the local user). */
  connectedUsers: CollabUser[];
}

/**
 * Representation of a single collaborating user.
 */
export interface CollabUser {
  /** Unique client ID assigned by the awareness protocol. */
  id: string;

  /** Display name. */
  name: string;

  /** Hex color used for cursor and selection highlighting. */
  color: string;

  /** Current cursor position (absent when the user has no active focus). */
  cursor?: {
    /** ID of the editor node the cursor sits in. */
    nodeId: string;
    /** Character offset within that node's text content. */
    offset: number;
  };
}

/**
 * Internal flag attached to dispatched actions so the Y.js binding can
 * distinguish locally-initiated changes from remote ones, preventing
 * infinite feedback loops.
 */
export const REMOTE_ORIGIN = '__mina_collab_remote__' as const;
