"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createInitialState } from "@/lib";
import { DynamicEditorProvider } from "@/components/DynamicEditorProvider";
import { createEmptyContent } from "@/lib/empty-content";
import { ContainerNode, EditorState } from "@/lib/types";
import { Editor } from "@/components/Editor";
import { useEditorStoreInstance } from "@/lib/store/editor-store";
import { RemoteCursor } from "@/components/RemoteCursor";
import { CollaborationProvider } from "@/components/CollaborationProvider";
import { useCollaborationState } from "@/components/CollaborationProvider";
import type { CollabUser } from "@/lib/collaboration/types";
import Link from "next/link";

// ─── Constants ───────────────────────────────────────────────────────────────

type CollabMode = "broadcast" | "websocket";

const CHANNEL_NAME = "mina-collab-demo";
const HEARTBEAT_INTERVAL = 2000;
const PEER_TIMEOUT = 5000;
const CURSOR_THROTTLE = 50;

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];
const TAB_COLOR = COLORS[Math.floor(Math.random() * COLORS.length)];
const TAB_ID = `peer-${Math.random().toString(36).slice(2, 9)}`;
const TAB_NAME = `User ${TAB_ID.slice(5, 8).toUpperCase()}`;

const DEFAULT_WS_URL = "ws://localhost:1234";
const DEFAULT_ROOM_ID = "mina-collab-demo";

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

// ═══════════════════════════════════════════════════════════════════════════════
// BROADCAST CHANNEL MODE
// ═══════════════════════════════════════════════════════════════════════════════

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
    for (const [id, peer] of peersRef.current.entries()) {
      if (now - peer.lastSeen > PEER_TIMEOUT) {
        peersRef.current.delete(id);
      }
    }
    setPeers(new Map(peersRef.current));
  }, []);

  const getCursorPosition = useCallback((): { nodeId: string; offset: number } | undefined => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return undefined;
    const range = sel.getRangeAt(0);
    let node: Node | null = range.startContainer;
    while (node && !(node instanceof HTMLElement && node.dataset.nodeId)) {
      node = node.parentElement;
    }
    if (!node || !(node instanceof HTMLElement)) return undefined;
    return { nodeId: node.dataset.nodeId!, offset: range.startOffset };
  }, []);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;
    setIsConnected(true);

    channel.postMessage({ type: "join", peerId: TAB_ID, peerName: TAB_NAME, peerColor: TAB_COLOR } satisfies BroadcastMessage);

    channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const msg = event.data;
      if (!msg || msg.peerId === TAB_ID) return;

      switch (msg.type) {
        case "join":
        case "heartbeat":
          peersRef.current.set(msg.peerId, {
            id: msg.peerId, name: msg.peerName, color: msg.peerColor,
            lastSeen: Date.now(), cursor: peersRef.current.get(msg.peerId)?.cursor,
          });
          syncPeersToState();
          if (msg.type === "join") {
            channel.postMessage({ type: "heartbeat", peerId: TAB_ID, peerName: TAB_NAME, peerColor: TAB_COLOR } satisfies BroadcastMessage);
            const currentContainer = store.getState().current;
            channel.postMessage({ type: "update", peerId: TAB_ID, peerName: TAB_NAME, peerColor: TAB_COLOR, payload: JSON.parse(JSON.stringify(currentContainer)) } satisfies BroadcastMessage);
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
            store.getState().dispatch({ type: "REPLACE_CONTAINER", payload: { container } });
            queueMicrotask(() => { isRemoteUpdateRef.current = false; });
          }
          break;
        }
      }
    };

    const heartbeatTimer = setInterval(() => {
      channel.postMessage({ type: "heartbeat", peerId: TAB_ID, peerName: TAB_NAME, peerColor: TAB_COLOR } satisfies BroadcastMessage);
      syncPeersToState();
    }, HEARTBEAT_INTERVAL);

    const unsubscribe = store.subscribe(
      (state) => state.current,
      (current) => {
        if (isRemoteUpdateRef.current) return;
        channel.postMessage({ type: "update", peerId: TAB_ID, peerName: TAB_NAME, peerColor: TAB_COLOR, payload: JSON.parse(JSON.stringify(current)) } satisfies BroadcastMessage);
      }
    );

    const handleSelectionChange = () => {
      if (cursorThrottleRef.current) return;
      cursorThrottleRef.current = setTimeout(() => {
        cursorThrottleRef.current = null;
        const cursor = getCursorPosition();
        channel.postMessage({ type: "cursor", peerId: TAB_ID, peerName: TAB_NAME, peerColor: TAB_COLOR, payload: cursor } satisfies BroadcastMessage);
      }, CURSOR_THROTTLE);
    };
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      channel.postMessage({ type: "leave", peerId: TAB_ID, peerName: TAB_NAME, peerColor: TAB_COLOR } satisfies BroadcastMessage);
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

  const remotePeers = Array.from(peers.values()).filter((p) => p.cursor);

  return (
    <>
      {remotePeers.map((peer) => (
        <RemoteCursor
          key={peer.id}
          user={{ id: peer.id, name: peer.name, color: peer.color, cursor: peer.cursor }}
          containerRef={editorContainerRef}
        />
      ))}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEBSOCKET (Y.js) MODE
// ═══════════════════════════════════════════════════════════════════════════════

function YjsCollabManager({
  onCollabState,
  editorContainerRef,
}: {
  onCollabState: (state: { users: CollabUser[]; isConnected: boolean }) => void;
  editorContainerRef: React.RefObject<HTMLElement | null>;
}) {
  const collabState = useCollaborationState();

  useEffect(() => {
    if (collabState) {
      onCollabState({
        users: collabState.connectedUsers,
        isConnected: collabState.isConnected,
      });
    }
  }, [collabState, onCollabState]);

  // Render remote cursors — exclude the local user
  const localId = collabState?.localClientId;
  const allUsers = collabState?.connectedUsers ?? [];
  const remoteUsers = allUsers.filter(
    (u) => u.cursor && u.id !== localId
  );

  // Debug: log cursor state
  useEffect(() => {
    if (allUsers.length > 0) {
      console.log('[yjs-cursor] localClientId:', localId, 'users:', allUsers.map(u => ({
        id: u.id, name: u.name, hasCursor: !!u.cursor, cursor: u.cursor
      })));
      console.log('[yjs-cursor] remoteUsers with cursors:', remoteUsers.length);
    }
  }, [allUsers, localId, remoteUsers.length]);

  return (
    <>
      {remoteUsers.map((user) => (
        <RemoteCursor
          key={user.id}
          user={user}
          containerRef={editorContainerRef}
        />
      ))}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED UI
// ═══════════════════════════════════════════════════════════════════════════════

function StatusBadge({ isConnected, label }: { isConnected: boolean; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/80 px-3 py-1 text-xs font-medium backdrop-blur-sm">
      <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-muted-foreground/70"}`} />
      {label}
    </div>
  );
}

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

function ModeSelector({ mode, onModeChange }: { mode: CollabMode; onModeChange: (m: CollabMode) => void }) {
  return (
    <div className="inline-flex rounded-md border border-border/50 bg-muted/30 p-0.5">
      <button
        onClick={() => onModeChange("broadcast")}
        className={`rounded px-3 py-1 text-xs font-medium transition-all ${mode === "broadcast" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
      >
        Same Browser
      </button>
      <button
        onClick={() => onModeChange("websocket")}
        className={`rounded px-3 py-1 text-xs font-medium transition-all ${mode === "websocket" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
      >
        WebSocket (Y.js)
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const IS_DEV = process.env.NODE_ENV !== "production";

export default function CollabDemo() {
  const [mode, setMode] = useState<CollabMode>("broadcast");

  // Broadcast mode state
  const [broadcastState, setBroadcastState] = useState<{
    peers: Map<string, PeerInfo>;
    isConnected: boolean;
  }>({ peers: new Map(), isConnected: false });

  // WebSocket mode state
  const [wsUrl, setWsUrl] = useState(DEFAULT_WS_URL);
  const [roomId, setRoomId] = useState(DEFAULT_ROOM_ID);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsUsers, setWsUsers] = useState<CollabUser[]>([]);
  const [wsActive, setWsActive] = useState(false);

  const handleBroadcastState = useCallback(
    (state: { peers: Map<string, PeerInfo>; isConnected: boolean }) => {
      setBroadcastState(state);
    },
    []
  );

  const handleCollabState = useCallback(
    (state: { users: CollabUser[]; isConnected: boolean }) => {
      setWsConnected(state.isConnected);
      setWsUsers(state.users);
    },
    []
  );

  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  const broadcastInitialState = useMemo<EditorState>(() => {
    const container: ContainerNode = {
      id: "root-broadcast",
      type: "container",
      children: createEmptyContent(),
      attributes: {},
    };
    return createInitialState(container);
  }, []);

  const wsInitialState = useMemo<EditorState>(() => {
    const container: ContainerNode = {
      id: "root-ws",
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

  // In production, always force broadcast mode (no Y.js)
  const isBroadcast = !IS_DEV ? true : mode === "broadcast";
  const isConnected = isBroadcast ? broadcastState.isConnected : wsConnected;
  const peerCount = isBroadcast ? broadcastState.peers.size : wsUsers.length;

  const statusLabel = isBroadcast
    ? isConnected
      ? peerCount > 0
        ? `${peerCount + 1} tabs connected`
        : "Connected (open another tab)"
      : "Connecting..."
    : wsActive
    ? isConnected
      ? `${peerCount} user${peerCount !== 1 ? "s" : ""} connected`
      : "Connecting to server..."
    : "Not connected";

  const allUsers = isBroadcast
    ? [
        { name: TAB_NAME, color: TAB_COLOR },
        ...Array.from(broadcastState.peers.values()).map((p) => ({ name: p.name, color: p.color })),
      ]
    : wsUsers.map((u) => ({ name: u.name, color: u.color }));

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
            <StatusBadge isConnected={isConnected} label={statusLabel} />

            {allUsers.length > 0 && (
              <div className="flex -space-x-1.5">
                {allUsers.map((user, i) => (
                  <UserAvatar key={i} name={user.name} color={user.color} />
                ))}
              </div>
            )}

            {isBroadcast && (
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
            )}
          </div>
        </div>
      </header>

      {/* Mode selector + WebSocket config (dev only) */}
      {IS_DEV && (
        <div className="mx-auto w-full max-w-5xl px-4 pt-4 flex flex-wrap items-center gap-3">
          <ModeSelector mode={mode} onModeChange={setMode} />

          {!isBroadcast && (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="ws://localhost:1234"
                className="h-8 flex-1 min-w-0 rounded-md border border-border/50 bg-background px-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="room-id"
                className="h-8 w-36 rounded-md border border-border/50 bg-background px-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={() => setWsActive(!wsActive)}
                className={`h-8 inline-flex items-center rounded-md px-3 text-xs font-medium transition-colors ${
                  wsActive
                    ? "border border-border hover:bg-accent hover:text-accent-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {wsActive ? "Disconnect" : "Connect"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info banner */}
      <div className="mx-auto w-full max-w-5xl px-4 pt-3">
        <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
          {isBroadcast ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Same-Browser Sync</strong>{" "}
              — Edits sync between browser tabs using BroadcastChannel. Click &ldquo;Open Another Tab&rdquo; to see cursors and changes sync instantly.
              {broadcastState.peers.size > 0 && (
                <span className="ml-1 font-medium text-emerald-600 dark:text-emerald-400">
                  Syncing with {broadcastState.peers.size} other tab{broadcastState.peers.size !== 1 ? "s" : ""}.
                </span>
              )}
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Y.js WebSocket</strong>{" "}
              — Real collaboration via a{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">y-websocket</code>{" "}
              server. Run{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">npx y-websocket</code>{" "}
              in a terminal to start the server on port 1234, then click Connect. Open multiple browsers or devices on the same network to collaborate.
              {wsActive && wsConnected && (
                <span className="ml-1 font-medium text-emerald-600 dark:text-emerald-400">
                  Connected to {wsUrl}.
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Code example */}
      <div className="mx-auto w-full max-w-5xl px-4 pt-3">
        <details className="group rounded-lg border border-border/50 bg-muted/20">
          <summary className="cursor-pointer px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            View integration code
          </summary>
          <pre className="overflow-x-auto border-t border-border/30 px-4 py-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
{isBroadcast
  ? `// BroadcastChannel — same browser, zero infrastructure
const channel = new BroadcastChannel("my-room");

// Broadcast local changes
store.subscribe((state) => state.current, (container) => {
  channel.postMessage({ type: "update", payload: container });
});

// Apply remote changes
channel.onmessage = (event) => {
  if (event.data.type === "update") {
    store.getState().dispatch({
      type: "REPLACE_CONTAINER",
      payload: { container: event.data.payload },
    });
  }
};`
  : `import { EditorProvider } from 'mina-rich-editor';
import { CollaborationProvider } from 'mina-rich-editor';
import { Editor } from 'mina-rich-editor';

// 1. Start a y-websocket server:
//    npx y-websocket

// 2. Wrap your editor:
function CollabEditor() {
  return (
    <DynamicEditorProvider initialState={initialState}>
      <CollaborationProvider
        roomId="my-doc-123"
        serverUrl="ws://localhost:1234"
        user={{ name: "Alice", color: "#e66" }}
      >
        <Editor />
      </CollaborationProvider>
    </DynamicEditorProvider>
  );
}`}
          </pre>
        </details>
      </div>

      {/* Editors — both always mounted, hidden via display */}
      <div ref={editorContainerRef} className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-4">
        {/* Broadcast mode */}
        <div style={{ display: isBroadcast ? undefined : "none" }}>
          <DynamicEditorProvider initialState={broadcastInitialState}>
            <BroadcastSyncManager
              onSyncState={handleBroadcastState}
              editorContainerRef={editorContainerRef}
            />
            <Editor readOnly={false} onUploadImage={handleImageUpload} notionBased={false} />
          </DynamicEditorProvider>
        </div>

        {/* WebSocket (Y.js) mode — dev only */}
        {IS_DEV && (
          <div style={{ display: !isBroadcast ? undefined : "none" }}>
            <DynamicEditorProvider initialState={wsInitialState}>
              {wsActive && (
                <CollaborationProvider
                  roomId={roomId}
                  serverUrl={wsUrl}
                  user={{ name: TAB_NAME, color: TAB_COLOR }}
                >
                  <YjsCollabManager onCollabState={handleCollabState} editorContainerRef={editorContainerRef} />
                </CollaborationProvider>
              )}
              <Editor readOnly={false} onUploadImage={handleImageUpload} notionBased={false} />
            </DynamicEditorProvider>
          </div>
        )}
      </div>
    </div>
  );
}
