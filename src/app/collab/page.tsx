"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { EditorProvider, createInitialState } from "@/lib";
import { createEmptyContent } from "@/lib/empty-content";
import { ContainerNode, EditorState } from "@/lib/types";
import { Editor } from "@/components/Editor";
import { useEditorStoreInstance } from "@/lib/store/editor-store";
import { RemoteCursor } from "@/components/RemoteCursor";
import type { CollabUser } from "@/lib/collaboration/types";
import Link from "next/link";

// ─── Constants ───────────────────────────────────────────────────────────────

const CHANNEL_NAME = "mina-collab-demo";
const HEARTBEAT_INTERVAL = 2000;
const PEER_TIMEOUT = 5000;
const CURSOR_THROTTLE = 50;

// Random user color for this tab
const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];
const TAB_COLOR = COLORS[Math.floor(Math.random() * COLORS.length)];
const TAB_ID = `peer-${Math.random().toString(36).slice(2, 9)}`;
const TAB_NAME = `User ${TAB_ID.slice(5, 8).toUpperCase()}`;

// ─── Types ───────────────────────────────────────────────────────────────────

interface PeerInfo {
  id: string;
  name: string;
  color: string;
  lastSeen: number;
  cursor?: { nodeId: string; offset: number };
}

interface BroadcastMessage {
  type: "join" | "leave" | "heartbeat" | "update" | "cursor";
  peerId: string;
  peerName: string;
  peerColor: string;
  payload?: unknown;
}

// ─── BroadcastChannel Sync Hook ─────────────────────────────────────────────

function useBroadcastSync() {
  const store = useEditorStoreInstance();
  const [peers, setPeers] = useState<Map<string, PeerInfo>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const peersRef = useRef<Map<string, PeerInfo>>(new Map());
  const isRemoteUpdateRef = useRef(false);
  const cursorThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncPeersToState = useCallback(() => {
    const now = Date.now();
    let changed = false;
    for (const [id, peer] of peersRef.current.entries()) {
      if (now - peer.lastSeen > PEER_TIMEOUT) {
        peersRef.current.delete(id);
        changed = true;
      }
    }
    if (changed || true) {
      setPeers(new Map(peersRef.current));
    }
  }, []);

  // Get cursor position from DOM selection
  const getCursorPosition = useCallback((): { nodeId: string; offset: number } | undefined => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return undefined;

    const range = sel.getRangeAt(0);
    let node: Node | null = range.startContainer;

    // Walk up to find the block element with data-node-id
    while (node && !(node instanceof HTMLElement && node.dataset.nodeId)) {
      node = node.parentElement;
    }
    if (!node || !(node instanceof HTMLElement)) return undefined;

    return {
      nodeId: node.dataset.nodeId!,
      offset: range.startOffset,
    };
  }, []);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;
    setIsConnected(true);

    // Send join
    channel.postMessage({
      type: "join",
      peerId: TAB_ID,
      peerName: TAB_NAME,
      peerColor: TAB_COLOR,
    } satisfies BroadcastMessage);

    // Handle incoming messages
    channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const msg = event.data;
      if (!msg || msg.peerId === TAB_ID) return;

      switch (msg.type) {
        case "join":
        case "heartbeat":
          peersRef.current.set(msg.peerId, {
            id: msg.peerId,
            name: msg.peerName,
            color: msg.peerColor,
            lastSeen: Date.now(),
            cursor: peersRef.current.get(msg.peerId)?.cursor,
          });
          syncPeersToState();
          // Reply to join with our state
          if (msg.type === "join") {
            channel.postMessage({
              type: "heartbeat",
              peerId: TAB_ID,
              peerName: TAB_NAME,
              peerColor: TAB_COLOR,
            } satisfies BroadcastMessage);
            const currentContainer = store.getState().current;
            channel.postMessage({
              type: "update",
              peerId: TAB_ID,
              peerName: TAB_NAME,
              peerColor: TAB_COLOR,
              payload: JSON.parse(JSON.stringify(currentContainer)),
            } satisfies BroadcastMessage);
          }
          break;

        case "leave":
          peersRef.current.delete(msg.peerId);
          syncPeersToState();
          break;

        case "cursor": {
          const existing = peersRef.current.get(msg.peerId);
          if (existing) {
            existing.cursor = msg.payload as { nodeId: string; offset: number } | undefined;
            existing.lastSeen = Date.now();
            syncPeersToState();
          }
          break;
        }

        case "update": {
          const container = msg.payload as ContainerNode;
          if (container) {
            isRemoteUpdateRef.current = true;
            store.getState().dispatch({
              type: "REPLACE_CONTAINER",
              payload: { container },
            });
            queueMicrotask(() => {
              isRemoteUpdateRef.current = false;
            });
          }
          break;
        }
      }
    };

    // Heartbeat
    const heartbeatTimer = setInterval(() => {
      channel.postMessage({
        type: "heartbeat",
        peerId: TAB_ID,
        peerName: TAB_NAME,
        peerColor: TAB_COLOR,
      } satisfies BroadcastMessage);
      syncPeersToState();
    }, HEARTBEAT_INTERVAL);

    // Subscribe to local store changes
    const unsubscribe = store.subscribe(
      (state) => state.current,
      (current) => {
        if (isRemoteUpdateRef.current) return;
        channel.postMessage({
          type: "update",
          peerId: TAB_ID,
          peerName: TAB_NAME,
          peerColor: TAB_COLOR,
          payload: JSON.parse(JSON.stringify(current)),
        } satisfies BroadcastMessage);
      }
    );

    // Track cursor position on selection changes
    const handleSelectionChange = () => {
      if (cursorThrottleRef.current) return;
      cursorThrottleRef.current = setTimeout(() => {
        cursorThrottleRef.current = null;
        const cursor = getCursorPosition();
        channel.postMessage({
          type: "cursor",
          peerId: TAB_ID,
          peerName: TAB_NAME,
          peerColor: TAB_COLOR,
          payload: cursor,
        } satisfies BroadcastMessage);
      }, CURSOR_THROTTLE);
    };
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      channel.postMessage({
        type: "leave",
        peerId: TAB_ID,
        peerName: TAB_NAME,
        peerColor: TAB_COLOR,
      } satisfies BroadcastMessage);
      clearInterval(heartbeatTimer);
      if (cursorThrottleRef.current) clearTimeout(cursorThrottleRef.current);
      document.removeEventListener("selectionchange", handleSelectionChange);
      unsubscribe();
      channel.close();
      channelRef.current = null;
      setIsConnected(false);
      peersRef.current.clear();
      setPeers(new Map());
    };
  }, [store, syncPeersToState, getCursorPosition]);

  return { peers, isConnected };
}

// ─── BroadcastSync Manager (inside EditorProvider) ──────────────────────────

function BroadcastSyncManager({
  onSyncState,
  editorContainerRef,
}: {
  onSyncState: (state: { peers: Map<string, PeerInfo>; isConnected: boolean }) => void;
  editorContainerRef: React.RefObject<HTMLElement | null>;
}) {
  const { peers, isConnected } = useBroadcastSync();

  useEffect(() => {
    onSyncState({ peers, isConnected });
  }, [peers, isConnected, onSyncState]);

  // Render remote cursors
  const remotePeers = Array.from(peers.values()).filter((p) => p.cursor);

  return (
    <>
      {remotePeers.map((peer) => (
        <RemoteCursor
          key={peer.id}
          user={{
            id: peer.id,
            name: peer.name,
            color: peer.color,
            cursor: peer.cursor,
          }}
          containerRef={editorContainerRef}
        />
      ))}
    </>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ isConnected, peerCount }: { isConnected: boolean; peerCount: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/80 px-3 py-1 text-xs font-medium backdrop-blur-sm">
      <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-warm-500"}`} />
      {isConnected
        ? peerCount > 0
          ? `${peerCount + 1} tabs connected`
          : "Connected (open another tab)"
        : "Connecting..."}
    </div>
  );
}

// ─── User Avatar ─────────────────────────────────────────────────────────────

function UserAvatar({ name, color }: { name: string; color: string }) {
  return (
    <div
      className="relative flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-background"
      style={{ backgroundColor: color }}
      title={name}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function CollabDemo() {
  const [syncState, setSyncState] = useState<{
    peers: Map<string, PeerInfo>;
    isConnected: boolean;
  }>({ peers: new Map(), isConnected: false });

  const handleSyncState = useCallback(
    (state: { peers: Map<string, PeerInfo>; isConnected: boolean }) => {
      setSyncState(state);
    },
    []
  );

  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  const initialState = useMemo<EditorState>(() => {
    const container: ContainerNode = {
      id: "root",
      type: "container",
      children: createEmptyContent(),
      attributes: {},
    };
    return createInitialState(container);
  }, []);

  const handleImageUpload = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleOpenTab = () => {
    window.open(window.location.pathname, "_blank");
  };

  const peerCount = syncState.peers.size;
  const allUsers = [
    { name: TAB_NAME, color: TAB_COLOR },
    ...Array.from(syncState.peers.values()).map((p) => ({ name: p.name, color: p.color })),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Back to Home
            </Link>
            <div className="h-4 w-px bg-border" />
            <h1 className="text-sm font-semibold">Collaboration Demo</h1>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge isConnected={syncState.isConnected} peerCount={peerCount} />

            {/* User avatars */}
            {allUsers.length > 0 && (
              <div className="flex -space-x-1.5">
                {allUsers.map((user, i) => (
                  <UserAvatar key={i} name={user.name} color={user.color} />
                ))}
              </div>
            )}

            {/* Open Another Tab */}
            <button
              onClick={handleOpenTab}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Open Another Tab
            </button>
          </div>
        </div>
      </header>

      {/* Info banner */}
      <div className="mx-auto w-full max-w-5xl px-4 pt-4">
        <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Real-time Collaboration</strong>{" "}
            — Edits sync between browser tabs in real time using BroadcastChannel.
            Click &ldquo;Open Another Tab&rdquo; and start typing in either tab to see cursors and changes sync instantly.
            {peerCount > 0 && (
              <span className="ml-1 font-medium text-emerald-600 dark:text-emerald-400">
                Syncing with {peerCount} other tab{peerCount !== 1 ? "s" : ""}.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Code example */}
      <div className="mx-auto w-full max-w-5xl px-4 pt-3">
        <details className="group rounded-lg border border-border/50 bg-muted/20">
          <summary className="cursor-pointer px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            View production integration code
          </summary>
          <pre className="overflow-x-auto border-t border-border/30 px-4 py-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
{`import { EditorProvider } from 'mina-rich-editor';
import { CollaborationProvider } from 'mina-rich-editor';
import { Editor } from 'mina-rich-editor';

function CollabEditor() {
  return (
    <EditorProvider initialState={initialState}>
      <CollaborationProvider
        roomId="my-doc-123"
        serverUrl="wss://your-collab-server.com"
        user={{ name: "Alice", color: "#e66" }}
      >
        <Editor />
      </CollaborationProvider>
    </EditorProvider>
  );
}`}
          </pre>
        </details>
      </div>

      {/* Editor */}
      <div ref={editorContainerRef} className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-4">
        <EditorProvider initialState={initialState}>
          <BroadcastSyncManager
            onSyncState={handleSyncState}
            editorContainerRef={editorContainerRef}
          />
          <Editor
            readOnly={false}
            onUploadImage={handleImageUpload}
            notionBased={false}
          />
        </EditorProvider>
      </div>
    </div>
  );
}
