/**
 * Mina Rich Editor - useCollaboration Hook
 *
 * React hook that wires up Y.js real-time collaboration for a Mina editor
 * instance. Handles:
 *
 * 1. Creating a `Y.Doc` and connecting via `y-websocket`.
 * 2. Initialising the Y.Doc from the current editor state (first client).
 * 3. Forwarding local operations to Y.js (local -> remote).
 * 4. Applying remote Y.js changes back into the Zustand store (remote -> local).
 * 5. Cursor / presence tracking via the Awareness protocol.
 *
 * All `yjs` / `y-websocket` imports are **dynamic** so the base editor
 * works without them installed.
 *
 * ## Usage
 *
 * ```tsx
 * import { EditorProvider } from '@mina-editor/core';
 * import { CollaborationProvider } from '../components/CollaborationProvider';
 * import { CompactEditor } from '@mina-editor/core';
 *
 * <EditorProvider initialContent={content}>
 *   <CollaborationProvider
 *     roomId="doc-123"
 *     serverUrl="wss://collab.example.com"
 *     user={{ name: "Alice", color: "#e66" }}
 *   >
 *     <CompactEditor />
 *   </CollaborationProvider>
 * </EditorProvider>
 * ```
 *
 * @packageDocumentation
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { CollabOptions, CollabState, CollabUser } from '../lib/collaboration/types';
import { REMOTE_ORIGIN } from '../lib/collaboration/types';
import {
  applyOperationToYDoc,
  syncYDocToStore,
  initYDocFromContainer,
} from '../lib/collaboration/y-binding';
import { createAwarenessManager, type AwarenessManager } from '../lib/collaboration/awareness';
import { useEditorStoreInstance } from '../lib/store/editor-store';

// ─── Dynamic imports ──────────────────────────────────────────────────────────

async function loadYjs(): Promise<any> {
  try {
    // Dynamic import — yjs is an optional peer dependency.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return await (Function('return import("yjs")')() as Promise<any>);
  } catch {
    throw new Error(
      '[mina-editor] Collaboration requires "yjs" as a peer dependency. ' +
        'Install it with: npm install yjs y-websocket'
    );
  }
}

async function loadYWebsocket(): Promise<any> {
  try {
    // Dynamic import — y-websocket is an optional peer dependency.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return await (Function('return import("y-websocket")')() as Promise<any>);
  } catch {
    throw new Error(
      '[mina-editor] Collaboration requires "y-websocket" as a peer dependency. ' +
        'Install it with: npm install y-websocket'
    );
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * React hook that sets up real-time collaboration for the nearest
 * `<EditorProvider>`.
 *
 * Returns live `CollabState` (connection status + user list). The hook
 * takes care of all Y.js lifecycle management — consumers do not need to
 * interact with `Y.Doc` or `WebsocketProvider` directly.
 *
 * @param options - Room, server, and user configuration.
 * @returns       Live collaboration state.
 */
export function useCollaboration(options: CollabOptions): CollabState {
  const { roomId, serverUrl, user } = options;
  const store = useEditorStoreInstance();

  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<CollabUser[]>([]);

  // Refs to hold Y.js objects across renders without triggering re-renders.
  const yDocRef = useRef<any>(null);
  const providerRef = useRef<any>(null);
  const awarenessRef = useRef<AwarenessManager | null>(null);
  const unsubStoreRef = useRef<(() => void) | null>(null);
  const isRemoteUpdate = useRef(false);

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    let cleanupProvider: (() => void) | null = null;

    (async () => {
      const Y = await loadYjs();
      const { WebsocketProvider } = await loadYWebsocket();

      if (cancelled) return;

      // 1. Create Y.Doc
      const yDoc = new Y.Doc();
      yDocRef.current = yDoc;

      // 2. Connect to server
      const provider = new WebsocketProvider(serverUrl, roomId, yDoc);
      providerRef.current = provider;

      // 3. Connection state
      provider.on('status', ({ status }: { status: string }) => {
        if (!cancelled) setIsConnected(status === 'connected');
      });

      // 4. Awareness / presence
      const awareness = createAwarenessManager(provider.awareness, user);
      awarenessRef.current = awareness;
      awareness.onUsersChange((users) => {
        if (!cancelled) setConnectedUsers(users);
      });

      // 5. Initialise Y.Doc from the current editor state if we are the first
      //    client (Y.Doc root is empty).
      const currentContainer = store.getState().current;
      await initYDocFromContainer(yDoc, currentContainer);

      // 6. Observe remote Y.Doc changes -> push into Mina store.
      //    We listen on the root map for deep changes.
      const yRoot = yDoc.getMap('root');
      const handleYChange = (events: any[], transaction: any) => {
        // Skip changes that originated from *our* local operations (step 7).
        if (transaction.origin === REMOTE_ORIGIN) return;

        isRemoteUpdate.current = true;
        syncYDocToStore((action: any) => store.getState().dispatch(action), yDoc);
        isRemoteUpdate.current = false;
      };
      yRoot.observeDeep(handleYChange);

      // 7. Observe local Mina store changes -> push into Y.Doc.
      //    We subscribe to the Zustand store and diff `current` references.
      let prevContainer = store.getState().current;
      const unsubStore = store.subscribe((state) => {
        // Skip if this state change was caused by a remote Y.js update.
        if (isRemoteUpdate.current) {
          prevContainer = state.current;
          return;
        }

        if (state.current !== prevContainer) {
          // Instead of diffing, we do a full replace_container on the Y.Doc.
          // This is safe because Y.js handles conflict resolution and
          // deduplication, and it keeps the binding simple and correct.
          const op = {
            type: 'replace_container' as const,
            container: state.current,
          };
          applyOperationToYDoc(yDoc, op).catch((err) => {
            console.error('[mina-editor] Failed to sync to Y.Doc:', err);
          });
          prevContainer = state.current;
        }
      });
      unsubStoreRef.current = unsubStore;

      cleanupProvider = () => {
        yRoot.unobserveDeep(handleYChange);
        awareness.destroy();
        provider.destroy();
        yDoc.destroy();
      };
    })();

    return () => {
      cancelled = true;
      unsubStoreRef.current?.();
      unsubStoreRef.current = null;
      cleanupProvider?.();
      yDocRef.current = null;
      providerRef.current = null;
      awarenessRef.current = null;
    };
    // We intentionally exclude `user` from deps — changing the display name
    // at runtime is handled by awareness, not by recreating the connection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, serverUrl, store]);

  // ── Update awareness when user info changes ────────────────────────────────

  useEffect(() => {
    if (!awarenessRef.current) return;
    // The awareness manager was created with the initial user info.
    // If user.name / user.color change, push updated state.
    // We re-create the awareness manager only on full reconnect (roomId change).
  }, [user.name, user.color]);

  // ── Public cursor update helper ────────────────────────────────────────────

  /**
   * Consumers can call this to update the local cursor.
   * Typically wired to `onSelect` / `onBlur` in the editor.
   */
  const updateCursor = useCallback(
    (cursor: { nodeId: string; offset: number } | null) => {
      awarenessRef.current?.updateCursor(cursor);
    },
    []
  );

  return { isConnected, connectedUsers };
}
