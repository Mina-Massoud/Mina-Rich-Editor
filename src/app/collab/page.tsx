"use client";

import { useState, useMemo } from "react";
import { EditorProvider, createInitialState } from "@/lib";
import { createEmptyContent } from "@/lib/empty-content";
import { ContainerNode, EditorState } from "@/lib/types";
import { Editor } from "@/components/Editor";
import type { CollabUser } from "@/lib/collaboration/types";
import Link from "next/link";

// ─── Simulated Collaboration State ──────────────────────────────────────────
// Since the demo doesn't run a y-websocket server, we simulate the collaboration
// experience with mock users and connection status.

const MOCK_USERS: CollabUser[] = [
  { id: "1", name: "You", color: "#3b82f6", cursor: undefined },
  { id: "2", name: "Alice", color: "#ef4444", cursor: { nodeId: "p-1", offset: 12 } },
  { id: "3", name: "Bob", color: "#22c55e", cursor: { nodeId: "p-2", offset: 5 } },
];

type ConnectionStatus = "disconnected" | "connecting" | "connected";

function useSimulatedCollab() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [users, setUsers] = useState<CollabUser[]>([]);

  function connect() {
    setStatus("connecting");
    // Simulate connection delay
    setTimeout(() => {
      setStatus("connected");
      setUsers([MOCK_USERS[0]]); // Start with just local user
      // Other users "join" after a short delay
      setTimeout(() => setUsers([MOCK_USERS[0], MOCK_USERS[1]]), 1200);
      setTimeout(() => setUsers([...MOCK_USERS]), 2400);
    }, 1500);
  }

  function disconnect() {
    setStatus("disconnected");
    setUsers([]);
  }

  return { status, users, connect, disconnect };
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ConnectionStatus }) {
  const config = {
    disconnected: { color: "bg-warm-500", label: "Disconnected" },
    connecting: { color: "bg-yellow-500 animate-pulse", label: "Connecting..." },
    connected: { color: "bg-emerald-500", label: "Connected" },
  };

  const { color, label } = config[status];

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/80 px-3 py-1 text-xs font-medium backdrop-blur-sm">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </div>
  );
}

// ─── User Avatar ─────────────────────────────────────────────────────────────

function UserAvatar({ user }: { user: CollabUser }) {
  return (
    <div
      className="relative flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-background"
      style={{ backgroundColor: user.color }}
      title={user.name}
    >
      {user.name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Remote Cursor Overlay (Simulated) ───────────────────────────────────────

function SimulatedCursors({ users }: { users: CollabUser[] }) {
  const remoteUsers = users.filter((u) => u.id !== "1" && u.cursor);
  if (remoteUsers.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {remoteUsers.map((user) => (
        <div
          key={user.id}
          className="absolute transition-all duration-300 ease-out"
          style={{
            // Position cursors in approximate editor area for visual demo
            top: user.id === "2" ? "40%" : "55%",
            left: user.id === "2" ? "35%" : "50%",
          }}
        >
          <div
            className="h-5 w-0.5"
            style={{ backgroundColor: user.color }}
          />
          <div
            className="absolute -top-4 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
            style={{ backgroundColor: user.color }}
          >
            {user.name}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function CollabDemo() {
  const { status, users, connect, disconnect } = useSimulatedCollab();

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
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

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
            <StatusBadge status={status} />

            {/* Connected users */}
            {users.length > 0 && (
              <div className="flex -space-x-1.5">
                {users.map((user) => (
                  <UserAvatar key={user.id} user={user} />
                ))}
              </div>
            )}

            {/* Connect / Disconnect button */}
            {status === "disconnected" ? (
              <button
                onClick={connect}
                className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Connect
              </button>
            ) : status === "connected" ? (
              <button
                onClick={disconnect}
                className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Disconnect
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Info banner */}
      <div className="mx-auto w-full max-w-5xl px-4 pt-4">
        <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Real-time Collaboration</strong>{" "}
            — This demo simulates the collaboration experience. In production,
            wrap your editor with{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
              {"<CollaborationProvider>"}
            </code>{" "}
            and provide a{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
              roomId
            </code>
            ,{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
              serverUrl
            </code>
            , and{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
              user
            </code>{" "}
            props. You will need a{" "}
            <a
              href="https://github.com/yjs/y-websocket"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-muted-foreground/50 underline-offset-2 transition-colors hover:text-foreground"
            >
              y-websocket
            </a>{" "}
            server running.
          </p>
        </div>
      </div>

      {/* Code example */}
      <div className="mx-auto w-full max-w-5xl px-4 pt-3">
        <details className="group rounded-lg border border-border/50 bg-muted/20">
          <summary className="cursor-pointer px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            View integration code
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
      <div className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-4">
        {status === "connected" && <SimulatedCursors users={users} />}
        <EditorProvider initialState={initialState}>
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
