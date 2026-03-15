import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { CodeBlock } from "../_components/CodeBlock";
import { NotesList } from "../_components/NotesList";

export const sectionMeta = { id: "collaboration", num: "15", label: "Real-time Collaboration" };

export default function S15_Collaboration() {
  return (
    <section className="mb-20">
      <SectionHeading num="15" label="Real-time Collaboration" id="collaboration">
        Multi-user editing with Y.js
      </SectionHeading>
      <p className="mb-6 text-sm font-light text-warm-400">
        Built on Y.js CRDTs. Connect to any Y.js-compatible WebSocket server -- no paid collaboration backend required.
      </p>

      <div className="space-y-8">
        <div>
          <h3 className="mb-3 text-lg font-light text-warm-100">CollaborationProvider</h3>
          <CodeBlock label="CollabEditor.tsx">{`import { CollaborationProvider } from "@/components/CollaborationProvider"
import { RemoteCursor } from "@/components/RemoteCursor"

function CollaborativeEditor() {
  return (
    <CollaborationProvider
      roomId="my-doc-123"
      serverUrl="wss://my-yjs-server.com"
      user={{ name: "Alice", color: "#ff0000" }}
    >
      <Editor />
      <RemoteCursor />
    </CollaborationProvider>
  )
}`}</CodeBlock>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-warm-100">useCollaboration hook</h3>
          <CodeBlock label="Presence.tsx">{`import { useCollaboration } from "@/hooks/useCollaboration"

function PresenceIndicator() {
  const { connectedUsers, isConnected } = useCollaboration()

  return (
    <div>
      {isConnected ? "Online" : "Offline"} -- {connectedUsers.length} users
    </div>
  )
}`}</CodeBlock>
        </div>

        <NotesList items={[
          <>Uses <strong className="text-warm-100">Y.js CRDT</strong> -- free, open-source conflict resolution with no central authority.</>,
          <><strong className="text-warm-100">RemoteCursor</strong> renders each user{"'"}s cursor and selection in real time with their assigned color.</>,
          <>Works with <strong className="text-warm-100">y-websocket</strong>, Hocuspocus, or any Y.js-compatible server.</>,
          <>Awareness protocol tracks user presence, cursor position, and connection status.</>,
        ]} />
      </div>
    </section>
  );
}
