import React from "react";
import { SectionHeading } from "../_components/SectionHeading";

export const sectionMeta = { id: "hooks", num: "18", label: "Hooks" };

export default function S18_Hooks() {
  const hooks = [
    { name: "useEditorDispatch", desc: "Returns the dispatch function to trigger editor actions.", code: "const dispatch = useEditorDispatch()" },
    { name: "useContainer", desc: "Returns the current content container (root node of the document tree).", code: "const container = useContainer()" },
    { name: "useActiveNodeId", desc: "Returns the ID of the currently focused block.", code: "const activeNodeId = useActiveNodeId()" },
    { name: "useSelection", desc: "Returns the current text selection information including offset, length, and formats.", code: "const selection = useSelection()" },
    { name: "useBlockNode", desc: "Returns a specific node by ID with automatic re-renders when it changes.", code: "const node = useBlockNode(nodeId)" },
    { name: "useContainerChildrenIds", desc: "Returns an array of child node IDs for efficient list rendering.", code: "const childIds = useContainerChildrenIds()" },
    { name: "useEditorState", desc: "Access the full editor state (container, selection, history, metadata).", code: "const state = useEditorState()" },
    { name: "useIsNodeActive", desc: "Returns whether a specific node is currently active/focused.", code: "const isActive = useIsNodeActive(nodeId)" },
    { name: "useEditorStoreInstance", desc: "Access the raw Zustand store instance for advanced use cases.", code: "const store = useEditorStoreInstance()" },
  ];

  return (
    <section className="mb-20">
      <SectionHeading num="18" label="Hooks" id="hooks">
        React hooks for editor state
      </SectionHeading>
      <p className="mb-6 text-sm font-light text-warm-400">
        All hooks must be used inside an <code className="bg-surface-code text-warm-100 px-1.5 py-0.5 text-xs font-mono">EditorProvider</code>. They use Zustand selectors for optimal re-render performance.
      </p>

      <div className="space-y-3">
        {hooks.map((hook) => (
          <div key={hook.name} className="border border-border-subtle bg-surface-raised p-4">
            <h3 className="mb-1.5 text-base font-light text-warm-100">{hook.name}</h3>
            <p className="mb-2 text-sm text-warm-400">{hook.desc}</p>
            <div className="bg-surface-code p-2 text-sm font-mono text-warm-100 border border-border-subtle">
              {hook.code}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
