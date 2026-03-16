"use client";

import React, { createContext, useContext } from "react";

/**
 * EditorContext
 *
 * Holds all stable editor-wide values that every Block needs.
 * This eliminates the 30+ prop drilling from Editor → Block,
 * and allows the Block memo comparator to only care about 4 props.
 *
 * Stable values (callbacks that never change identity): put in the context.
 * Dynamic per-block values (nodeId, isActive, depth, isFirstBlock): keep as props.
 */
export interface EditorContextValue {
  // Mode
  readOnly: boolean;
  notionBased: boolean;

  // Media upload
  onUploadImage?: (file: File) => Promise<string>;
  onUploadVideo?: (file: File) => Promise<string>;

  // Block operations — each takes nodeId as first arg so Block wraps with its own id
  onInput: (nodeId: string, element: HTMLElement) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>, nodeId: string) => void;
  onNodeClick: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onCreateNested: (nodeId: string) => void;
  onChangeBlockType: (nodeId: string, newType: string) => void;
  onInsertImage: (nodeId: string) => void;
  onCreateList: (nodeId: string, listType: string) => void;
  onCreateTable: (nodeId: string) => void;

  // Image selection
  selectedImageIds: Set<string>;
  onToggleImageSelection: (nodeId: string) => void;
  onClickWithModifier: (e: React.MouseEvent, nodeId: string) => void;

  // Drag-drop
  onBlockDragStart: (nodeId: string) => void;
  onImageDragStart: (nodeId: string) => void;
  onSetDragOverNodeId: (nodeId: string | null) => void;
  onSetDropPosition: (
    position: "before" | "after" | "left" | "right" | null
  ) => void;
  draggingNodeId: string | null;
  onSetDraggingNodeId: (nodeId: string | null) => void;
  onFlexContainerDragOver: (
    e: React.DragEvent,
    flexId: string,
    position: "left" | "right" | null
  ) => void;
  onFlexContainerDragLeave: (e: React.DragEvent) => void;
  onFlexContainerDrop: (
    e: React.DragEvent,
    flexId: string,
    position: "left" | "right" | null
  ) => void;
  dragOverFlexId: string | null;
  flexDropPosition: "left" | "right" | null;

  // Node ref registration (replaces the nodeRef prop callback)
  registerNodeRef: (nodeId: string, el: HTMLElement | null) => void;

  // Cover image (for first block drag handle)
  hasCoverImage: boolean;
  onUploadCoverImage?: (file: File) => Promise<string>;

  // AI integration
  onAISelect?: (nodeId: string) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

/**
 * EditorContextProvider
 *
 * Wrap the editor content with this provider. Pass a memoized `value` object
 * (built with useMemo in Editor.tsx) so that context consumers only re-render
 * when the specific fields they read actually change.
 */
export function EditorContextProvider({
  value,
  children,
}: {
  value: EditorContextValue;
  children: React.ReactNode;
}) {
  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}

/**
 * useEditorContext
 *
 * Reads the editor-wide context. Throws if used outside an EditorContextProvider
 * so bugs surface immediately during development.
 */
export function useEditorContext(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error(
      "useEditorContext must be used inside <EditorContextProvider>. " +
        "Make sure Block is rendered within the Editor component tree."
    );
  }
  return ctx;
}
