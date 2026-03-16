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
 * @packageDocumentation
 */

import { useEffect, useRef, useState } from 'react';
import type { CollabOptions, CollabState } from '../lib/collaboration/types';
import { REMOTE_ORIGIN } from '../lib/collaboration/types';
import {
  getY,
  applyOperationToYDoc,
  syncYDocToStore,
  initYDocFromContainer,
} from '../lib/collaboration/y-binding';
import { createAwarenessManager, type AwarenessManager } from '../lib/collaboration/awareness';
import { useEditorStoreInstance } from '../lib/store/editor-store';

// ─── Dynamic import for y-websocket ──────────────────────────────────────────

async function loadYWebsocket(): Promise<any> {
  try {
    return await import('y-websocket');
  } catch {
    throw new Error(
      '[mina-editor] Collaboration requires "y-websocket" as a peer dependency. ' +
        'Install it with: npm install y-websocket'
    );
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCollaboration(options: CollabOptions): CollabState {
  const { roomId, serverUrl, user } = options;
  const store = useEditorStoreInstance();

  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<import('../lib/collaboration/types').CollabUser[]>([]);
  const [localClientId, setLocalClientId] = useState<string | null>(null);

  const yDocRef = useRef<any>(null);
  const providerRef = useRef<any>(null);
  const awarenessRef = useRef<AwarenessManager | null>(null);
  const unsubStoreRef = useRef<(() => void) | null>(null);
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let cleanupProvider: (() => void) | null = null;
    let cleanupCursor: (() => void) | null = null;

    (async () => {
      // Use the SAME getY() as y-binding to guarantee a single yjs instance
      const Y = await getY();
      const { WebsocketProvider } = await loadYWebsocket();

      if (cancelled) return;

      // 1. Create Y.Doc
      const yDoc = new Y.Doc();
      yDocRef.current = yDoc;
      setLocalClientId(String(yDoc.clientID));
      console.log('[yjs] Created Y.Doc, clientID:', yDoc.clientID);

      // 2. Set up Y.Doc observer BEFORE connecting so we catch the initial sync
      const yRoot = yDoc.getMap('root');
      const handleYChange = (_events: any[], transaction: any) => {
        console.log('[yjs] observeDeep fired, origin:', transaction.origin, 'REMOTE_ORIGIN:', REMOTE_ORIGIN, 'match:', transaction.origin === REMOTE_ORIGIN);
        if (transaction.origin === REMOTE_ORIGIN) return;

        console.log('[yjs] Syncing Y.Doc → store');
        isRemoteUpdate.current = true;
        syncYDocToStore((action: any) => store.getState().dispatch(action), yDoc);
        isRemoteUpdate.current = false;
      };
      yRoot.observeDeep(handleYChange);

      // 3. Connect to server
      console.log('[yjs] Connecting to', serverUrl, 'room:', roomId);
      const provider = new WebsocketProvider(serverUrl, roomId, yDoc);
      providerRef.current = provider;

      // 4. Connection state
      provider.on('status', ({ status }: { status: string }) => {
        console.log('[yjs] Connection status:', status);
        if (!cancelled) setIsConnected(status === 'connected');
      });

      // 5. Awareness / presence
      const awareness = createAwarenessManager(provider.awareness, user);
      awarenessRef.current = awareness;
      awareness.onUsersChange((users: import('../lib/collaboration/types').CollabUser[]) => {
        if (!cancelled) setConnectedUsers(users);
      });

      // 6. Init Y.Doc — wait for sync event from y-websocket.
      //    y-websocket emits 'sync' (not 'synced') with (isSynced: boolean).
      let initDone = false;
      const tryInit = async (source: string) => {
        if (initDone || cancelled) return;
        initDone = true;
        const yr = yDoc.getMap('root');
        const hasId = yr.get('id');
        console.log('[yjs] tryInit from:', source, 'yRoot has id:', hasId);
        if (!hasId) {
          const currentContainer = store.getState().current;
          console.log('[yjs] Initializing Y.Doc from editor state, container id:', currentContainer.id);
          await initYDocFromContainer(yDoc, currentContainer);
          console.log('[yjs] Y.Doc initialized, yRoot id now:', yr.get('id'));
        } else {
          console.log('[yjs] Y.Doc already has content from server, syncing to store');
          isRemoteUpdate.current = true;
          syncYDocToStore((action: any) => store.getState().dispatch(action), yDoc);
          isRemoteUpdate.current = false;
        }
      };

      // Listen for the sync event (fires when initial server state is received)
      provider.on('sync', (isSynced: boolean) => {
        console.log('[yjs] sync event, isSynced:', isSynced);
        if (isSynced) tryInit('sync-event');
      });

      // If already synced by the time we get here
      if (provider.synced) {
        console.log('[yjs] Provider already synced on setup');
        tryInit('already-synced');
      }

      // Safety fallback
      const initTimeout = setTimeout(() => {
        console.log('[yjs] Init timeout fallback fired');
        tryInit('timeout');
      }, 1000);

      // 7. Observe local store changes -> push into Y.Doc
      let prevContainer = store.getState().current;
      const unsubStore = store.subscribe((state: any) => {
        if (isRemoteUpdate.current) {
          prevContainer = state.current;
          return;
        }

        if (state.current !== prevContainer) {
          console.log('[yjs] Store changed, pushing to Y.Doc. Container id:', state.current.id, 'children:', state.current.children?.length);
          const op = {
            type: 'replace_container' as const,
            container: state.current,
          };
          applyOperationToYDoc(yDoc, op).then(() => {
            console.log('[yjs] Y.Doc updated successfully. yRoot id:', yRoot.get('id'), 'children:', yRoot.get('children')?.length);
          }).catch((err: any) => {
            console.error('[yjs] Failed to sync to Y.Doc:', err);
          });
          prevContainer = state.current;
        }
      });
      unsubStoreRef.current = unsubStore;

      // 8. Track cursor position via selectionchange
      const getCursorPosition = (): { nodeId: string; offset: number } | null => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return null;
        const range = sel.getRangeAt(0);
        let node: Node | null = range.startContainer;
        while (node && !(node instanceof HTMLElement && node.dataset.nodeId)) {
          node = node.parentElement;
        }
        if (!node || !(node instanceof HTMLElement)) return null;
        return { nodeId: node.dataset.nodeId!, offset: range.startOffset };
      };

      let cursorThrottle: ReturnType<typeof setTimeout> | null = null;
      const handleSelectionChange = () => {
        if (cursorThrottle) return;
        cursorThrottle = setTimeout(() => {
          cursorThrottle = null;
          const cursor = getCursorPosition();
          awareness.updateCursor(cursor);
        }, 50);
      };
      document.addEventListener('selectionchange', handleSelectionChange);

      cleanupCursor = () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
        if (cursorThrottle) clearTimeout(cursorThrottle);
      };

      cleanupProvider = () => {
        clearTimeout(initTimeout);
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
      cleanupCursor?.();
      cleanupProvider?.();
      yDocRef.current = null;
      providerRef.current = null;
      awarenessRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, serverUrl, store]);

  return { isConnected, connectedUsers, localClientId };
}
