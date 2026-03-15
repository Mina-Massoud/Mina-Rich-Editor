/**
 * Mina Rich Editor - Awareness / Presence Tracking
 *
 * Uses the Y.js Awareness protocol to share each user's cursor position
 * and presence state with all connected peers.
 *
 * All imports are dynamic so the base editor works without `yjs` or
 * `y-websocket` installed.
 *
 * @packageDocumentation
 */

import type { CollabUser } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape of the awareness local state we publish. */
interface AwarenessLocalState {
  user: {
    name: string;
    color: string;
  };
  cursor?: {
    nodeId: string;
    offset: number;
  };
}

/**
 * Opaque handle returned by `createAwarenessManager`. Consumers interact
 * with awareness exclusively through this interface.
 */
export interface AwarenessManager {
  /**
   * Update the local user's cursor position.
   * Pass `null` to clear the cursor (e.g. when the editor loses focus).
   */
  updateCursor(cursor: { nodeId: string; offset: number } | null): void;

  /**
   * Subscribe to changes in the set of connected users (including cursor
   * movements). Returns an unsubscribe function.
   */
  onUsersChange(callback: (users: CollabUser[]) => void): () => void;

  /** Get the current snapshot of connected users. */
  getUsers(): CollabUser[];

  /** Tear down listeners. Called automatically by `useCollaboration`. */
  destroy(): void;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create an `AwarenessManager` bound to a Y.js Awareness instance.
 *
 * @param awareness - A `y-websocket` Awareness instance.
 * @param user      - The local user's display info.
 */
export function createAwarenessManager(
  awareness: any, // Awareness from y-websocket — typed as `any` to avoid hard dep
  user: { name: string; color: string }
): AwarenessManager {
  // Set initial local state
  awareness.setLocalStateField('user', {
    name: user.name,
    color: user.color,
  });

  const subscribers = new Set<(users: CollabUser[]) => void>();

  /** Build the `CollabUser[]` snapshot from awareness states. */
  function buildUsers(): CollabUser[] {
    const states: Map<number, AwarenessLocalState> = awareness.getStates();
    const users: CollabUser[] = [];

    states.forEach((state: AwarenessLocalState, clientId: number) => {
      if (!state.user) return;
      users.push({
        id: String(clientId),
        name: state.user.name,
        color: state.user.color,
        cursor: state.cursor ?? undefined,
      });
    });

    return users;
  }

  /** Handler bound to the awareness `change` event. */
  function handleChange() {
    const users = buildUsers();
    subscribers.forEach((cb) => cb(users));
  }

  awareness.on('change', handleChange);

  return {
    updateCursor(cursor) {
      awareness.setLocalStateField('cursor', cursor);
    },

    onUsersChange(callback) {
      subscribers.add(callback);
      // Immediately fire with current state so the subscriber is in sync.
      callback(buildUsers());
      return () => {
        subscribers.delete(callback);
      };
    },

    getUsers() {
      return buildUsers();
    },

    destroy() {
      awareness.off('change', handleChange);
      subscribers.clear();
    },
  };
}
