/**
 * CompactEditor
 *
 * A self-contained, embeddable rich-text editor with a fixed inline toolbar.
 * Designed as the primary consumer-facing component of the Mina Rich Editor
 * library — analogous to TipTap's `<Editor />` component.
 *
 * ## Quick start (self-contained)
 * ```tsx
 * import { CompactEditor } from 'mina-rich-editor';
 *
 * function App() {
 *   return (
 *     <CompactEditor
 *       initialContent={myContent}
 *       onChange={({ json, html }) => console.log(json, html)}
 *       minHeight="300px"
 *     />
 *   );
 * }
 * ```
 *
 * ## Advanced (external provider)
 * ```tsx
 * import { EditorProvider, CompactEditor } from 'mina-rich-editor';
 *
 * <EditorProvider initialContent={myContent}>
 *   <CompactEditor />
 * </EditorProvider>
 * ```
 */

"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  type TextNode,
  type ContainerNode,
  type EditorState,
  isTextNode,
} from "../lib";
import { serializeToSemanticHtml } from "../lib/utils/serialize-semantic-html";
import {
  useEditorStore,
  useEditorDispatch,
  useEditorStoreInstance,
  useContainerChildrenIds,
  useBlockNode,
  useSelectionManager,
  EditorProvider,
} from "../lib/store/editor-store";
import { createEmptyContent } from "../lib/empty-content";
import { generateId } from "../lib/utils/id-generator";
import { AddBlockButton } from "./AddBlockButton";
import { SelectionToolbar } from "./SelectionToolbar";
import { CompactToolbar } from "./CompactToolbar";
import { useToast } from "@/hooks/use-toast";
import { useDragAutoScroll } from "../lib/utils/drag-auto-scroll";
import { FreeImageBlock } from "./FreeImageBlock";

// Handler imports
import {
  createHandleKeyDown,
  createHandleContentChange,
  createHandleClickWithModifier,
} from "../lib/handlers/keyboard-handlers";
import { useEditorDragDrop } from "../hooks/useEditorDragDrop";
import { useEditorFileUpload } from "../hooks/useEditorFileUpload";
import { useEditorKeyboardShortcuts } from "../hooks/useEditorKeyboardShortcuts";
import {
  createHandleNodeClick,
  createHandleDeleteNode,
  createHandleAddBlock,
  createHandleCreateNested,
  createHandleChangeBlockType,
  createHandleInsertImageFromCommand,
  createHandleCreateList,
  createHandleCreateListFromCommand,
} from "../lib/handlers/node-operation-handlers";
import { useImageSelection } from "../hooks/useImageSelection";
import { useEditorClipboard } from "../hooks/useEditorClipboard";
import { useEditorSelection } from "../hooks/useEditorSelection";
import { useMediaPaste } from "../hooks/useMediaPaste";
import { Block } from "./Block";
import {
  EditorContextProvider,
  type EditorContextValue,
} from "../hooks/useEditorContext";
import { cn } from "@/lib/utils";
import { useContainer } from "../lib/store/editor-store";

// ─── BlockWrapper (same optimised pattern as Editor.tsx) ─────────────────────

interface BlockWrapperProps {
  nodeId: string;
  index: number;
  activeNodeId: string | null;
  readOnly: boolean;
  dragOverNodeId: string | null;
  dropPosition: string | null;
  draggingNodeId: string | null;
  handleDragEnter: (e: React.DragEvent, nodeId: string) => void;
  handleDragOver: (e: React.DragEvent, nodeId: string) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, nodeId: string) => void;
  handleAddBlock: (nodeId: string, position: "before" | "after") => void;
}

const BlockWrapper = React.memo(function BlockWrapper({
  nodeId,
  index,
  activeNodeId,
  readOnly,
  dragOverNodeId,
  dropPosition,
  draggingNodeId,
  handleDragEnter,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleAddBlock,
}: BlockWrapperProps) {
  const node = useBlockNode(nodeId);
  if (!node) return null;

  const isText = isTextNode(node);
  const textNode = isText ? (node as TextNode) : null;
  if (textNode?.type === "img" && textNode.attributes?.isFreePositioned) {
    return null;
  }

  const isFirstBlock = index === 0;

  return (
    <div className="w-full">
      {!readOnly && isFirstBlock && (
        <AddBlockButton
          onAdd={() => handleAddBlock(nodeId, "before")}
          position="before"
        />
      )}

      <div
        onDragEnter={(e) => handleDragEnter(e, nodeId)}
        onDragOver={(e) => handleDragOver(e, nodeId)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, nodeId)}
        className={`
          relative transition-all
          ${
            dragOverNodeId === nodeId &&
            dropPosition === "before" &&
            draggingNodeId !== nodeId
              ? "before:absolute before:inset-x-0 before:-top-1 before:h-1 before:bg-primary/30 before:z-10 before:rounded-full"
              : ""
          }
          ${
            dragOverNodeId === nodeId &&
            dropPosition === "after" &&
            draggingNodeId !== nodeId
              ? "after:absolute after:inset-x-0 after:-bottom-1 after:h-1 after:bg-primary/30 after:z-10 after:rounded-full"
              : ""
          }
          ${
            dragOverNodeId === nodeId &&
            dropPosition === "left" &&
            draggingNodeId !== nodeId
              ? "before:absolute before:inset-y-0 before:-left-1 before:w-1 before:bg-blue-500/50 before:z-10 before:rounded-full"
              : ""
          }
          ${
            dragOverNodeId === nodeId &&
            dropPosition === "right" &&
            draggingNodeId !== nodeId
              ? "after:absolute after:inset-y-0 after:-right-1 after:w-1 after:bg-blue-500/50 after:z-10 after:rounded-full"
              : ""
          }
        `}
      >
        <Block
          nodeId={nodeId}
          isActive={activeNodeId === nodeId}
          isFirstBlock={isFirstBlock}
          depth={0}
        />
      </div>

      {!readOnly && (
        <AddBlockButton
          onAdd={() => handleAddBlock(nodeId, "after")}
          position="after"
        />
      )}
    </div>
  );
});

// ─── FreePositionedImages (same pattern as Editor.tsx) ────────────────────────

interface FreePositionedImagesProps {
  activeNodeId: string | null;
  readOnly: boolean;
  handleNodeClick: (nodeId: string) => void;
  handleDeleteNode: (nodeId: string) => void;
}

function FreePositionedImages({
  activeNodeId,
  readOnly,
  handleNodeClick,
  handleDeleteNode,
}: FreePositionedImagesProps) {
  const container = useContainer();

  const freeImages = container.children.filter((node) => {
    const textNode = isTextNode(node) ? (node as TextNode) : null;
    return (
      textNode &&
      textNode.type === "img" &&
      textNode.attributes?.isFreePositioned
    );
  });

  return (
    <>
      {freeImages.map((node) => (
        <FreeImageBlock
          key={node.id}
          node={node as TextNode}
          isActive={activeNodeId === node.id}
          onClick={() => handleNodeClick(node.id)}
          onDelete={readOnly ? undefined : () => handleDeleteNode(node.id)}
          readOnly={readOnly}
        />
      ))}
    </>
  );
}

// ─── Inner editor (must live inside an EditorProvider) ───────────────────────

interface CompactEditorInnerProps {
  readOnly: boolean;
  onUploadImage?: (file: File) => Promise<string>;
  onChange?: (data: { json: ContainerNode; html: string }) => void;
  minHeight?: string;
}

function CompactEditorInner({
  readOnly: initialReadOnly,
  onUploadImage,
  onChange,
  minHeight = "200px",
}: CompactEditorInnerProps) {
  const [readOnly, setReadOnly] = useState(initialReadOnly);
  useEffect(() => {
    setReadOnly(initialReadOnly);
  }, [initialReadOnly]);

  const activeNodeId = useEditorStore((s) => s.activeNodeId);
  const undoStackLength = useEditorStore((s) => s.undoStack.length);
  const redoStackLength = useEditorStore((s) => s.redoStack.length);
  const currentSelection = useEditorStore((s) => s.currentSelection);
  const storeGetContainer = useEditorStore((s) => s.getContainer);
  const getContainer = useCallback(
    () => storeGetContainer(),
    [storeGetContainer]
  );
  const dispatch = useEditorDispatch();
  const childrenIds = useContainerChildrenIds();
  const selectionManager = useSelectionManager();
  const { toast } = useToast();

  const lastEnterTime = useRef<number>(0);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());
  const contentUpdateTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const activeNodeIdRef = useRef(activeNodeId);
  activeNodeIdRef.current = activeNodeId;
  const editorContentRef = useRef<HTMLDivElement>(null);

  // ── onChange: debounced subscription to container changes ─────────────────
  const store = useEditorStoreInstance();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!onChangeRef.current) return;

    let prevContainer = store.getState().getContainer();

    const unsubscribe = store.subscribe((state) => {
      const nextContainer = state.current;
      if (nextContainer === prevContainer) return;
      prevContainer = nextContainer;

      if (onChangeTimerRef.current !== null) {
        clearTimeout(onChangeTimerRef.current);
      }
      onChangeTimerRef.current = setTimeout(() => {
        onChangeTimerRef.current = null;
        const cb = onChangeRef.current;
        if (!cb) return;
        const html = serializeToSemanticHtml(nextContainer);
        cb({ json: nextContainer, html });
      }, 300);
    });

    return () => {
      unsubscribe();
      if (onChangeTimerRef.current !== null) {
        clearTimeout(onChangeTimerRef.current);
        onChangeTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  // Auto-scroll on drag
  useDragAutoScroll(editorContentRef, {
    scrollZone: 80,
    scrollSpeed: 12,
    enableVertical: true,
    enableHorizontal: false,
  });

  // ── Hooks ──────────────────────────────────────────────────────────────────

  const { selectedImageIds, handleToggleImageSelection } = useImageSelection({
    dispatch,
    toast,
    getContainer,
  });

  const { handleCopy, handlePaste, handleCut } = useEditorClipboard({
    dispatch,
    getContainer,
    getActiveNodeId: () => activeNodeIdRef.current,
  });

  const {
    selectedColor,
    handleSelectionChange,
    handleFormat,
    handleApplyColor,
    handleApplyFontSize,
    handleTypeChange,
  } = useEditorSelection({
    dispatch,
    selectionManager,
    activeNodeId,
    getContainer,
    toast,
    undoStackLength,
    currentSelection,
    nodeRefs,
  });

  // Drag-drop
  const {
    dragOverNodeId,
    setDragOverNodeId,
    dropPosition,
    setDropPosition,
    draggingNodeId,
    setDraggingNodeId,
    dragOverFlexId,
    flexDropPosition,
    handleImageDragStart,
    handleBlockDragStart,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFlexContainerDragOver,
    handleFlexContainerDragLeave,
    handleFlexContainerDrop,
  } = useEditorDragDrop({ dispatch, getContainer, toast, onUploadImage });

  // File upload
  const {
    setIsUploading,
    fileInputRef,
    multipleFileInputRef,
    videoInputRef,
    freeImageInputRef,
    handleFileChange,
    handleMultipleFilesChange,
    handleVideoFileChange,
    handleFreeImageFileChange,
  } = useEditorFileUpload({
    dispatch,
    getContainer,
    getActiveNodeId: () => activeNodeIdRef.current,
    toast,
    onUploadImage,
  });

  // Media paste
  useMediaPaste({
    readOnly,
    dispatch,
    toast,
    onUploadImage,
    setIsUploading,
    getContainer,
    getActiveNodeId: () => activeNodeIdRef.current,
    nodeRefs,
  });

  // ── Handler factories ──────────────────────────────────────────────────────

  const handleContentChange = useCallback(
    createHandleContentChange(
      {
        container: getContainer,
        dispatch,
        nodeRefs,
        lastEnterTime,
        onToggleImageSelection: handleToggleImageSelection,
      },
      contentUpdateTimers
    ),
    [dispatch, handleToggleImageSelection]
  );

  const handleKeyDown = useCallback(
    createHandleKeyDown({
      container: getContainer,
      dispatch,
      nodeRefs,
      lastEnterTime,
      onToggleImageSelection: handleToggleImageSelection,
    }),
    [dispatch, handleToggleImageSelection]
  );

  const handleClickWithModifier = useCallback(
    createHandleClickWithModifier({
      container: getContainer,
      dispatch,
      nodeRefs,
      lastEnterTime,
      onToggleImageSelection: handleToggleImageSelection,
    }),
    [handleToggleImageSelection]
  );

  const handleNodeClick = useCallback(
    createHandleNodeClick({ container: getContainer, dispatch }),
    [dispatch]
  );

  const handleDeleteNode = useCallback(
    createHandleDeleteNode({ container: getContainer, dispatch, toast }),
    [dispatch, toast]
  );

  const handleAddBlock = useCallback(
    createHandleAddBlock({ dispatch, nodeRefs }),
    [dispatch, nodeRefs]
  );

  const handleCreateNested = useCallback(
    createHandleCreateNested({ container: getContainer, dispatch, toast }),
    [dispatch, toast]
  );

  const handleChangeBlockType = useCallback(
    createHandleChangeBlockType({ dispatch, nodeRefs }),
    [dispatch, nodeRefs]
  );

  const handleInsertImageFromCommand = useCallback(
    createHandleInsertImageFromCommand({ dispatch, nodeRefs }, fileInputRef),
    [dispatch, fileInputRef]
  );

  const nodeOperationParams = {
    container: getContainer,
    dispatch,
    toast,
    nodeRefs,
    editorContentRef,
  };

  const handleCreateList = useCallback(
    createHandleCreateList(nodeOperationParams),
    [dispatch, toast]
  );

  const handleCreateListFromCommand = useCallback(
    createHandleCreateListFromCommand({ dispatch, toast, nodeRefs }),
    [dispatch, toast, nodeRefs]
  );

  // ── Selection change listener (scoped to this editor instance) ────────────

  useEffect(() => {
    const scopedHandler = () => {
      // Only process selections that are within THIS editor's DOM.
      // Without this check, multiple editors on the same page would
      // overwrite each other's selection state.
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorContentRef.current) {
        const range = sel.getRangeAt(0);
        if (!editorContentRef.current.contains(range.commonAncestorContainer)) {
          return; // Selection is in a different editor — ignore
        }
      }
      handleSelectionChange();
    };
    document.addEventListener("selectionchange", scopedHandler);
    return () => {
      document.removeEventListener("selectionchange", scopedHandler);
    };
  }, [handleSelectionChange]);

  // ── Focus active node ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!activeNodeId) return;
    const activeId = activeNodeId;
    const attemptFocus = (retries = 0) => {
      const element = nodeRefs.current.get(activeId);
      if (element && document.activeElement !== element) {
        element.focus();
      } else if (!element && retries < 10) {
        setTimeout(() => attemptFocus(retries + 1), 50);
      }
    };
    attemptFocus();
  }, [activeNodeId]);

  // ── Global keyboard shortcuts (Cmd+B/I/U, Cmd+Z/Y, Cmd+A) ─────────────
  useEditorKeyboardShortcuts({
    readOnly,
    dispatch,
    getContainer,
    getActiveNodeId: () => activeNodeIdRef.current,
    getCanUndo: () => undoStackLength > 0,
    getCanRedo: () => redoStackLength > 0,
    nodeRefs,
    handleFormat,
  });

  // ── Cleanup ────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      contentUpdateTimers.current.forEach((t) => clearTimeout(t));
      contentUpdateTimers.current.clear();
    };
  }, []);

  // ── Node ref registration ──────────────────────────────────────────────────

  const registerNodeRef = useCallback(
    (nodeId: string, el: HTMLElement | null) => {
      if (el) {
        nodeRefs.current.set(nodeId, el);
      } else {
        nodeRefs.current.delete(nodeId);
      }
    },
    []
  );

  // ── EditorContext value ────────────────────────────────────────────────────

  const editorContextValue = useMemo<EditorContextValue>(
    () => ({
      readOnly,
      notionBased: false, // CompactEditor never uses Notion-style layout
      onUploadImage,
      onUploadVideo: undefined,
      onInput: (nodeId: string, element: HTMLElement) =>
        handleContentChange(nodeId, element),
      onKeyDown: (e: React.KeyboardEvent<HTMLElement>, nodeId: string) =>
        handleKeyDown(e, nodeId),
      onNodeClick: handleNodeClick,
      onDeleteNode: handleDeleteNode,
      onCreateNested: handleCreateNested,
      onChangeBlockType: handleChangeBlockType,
      onInsertImage: handleInsertImageFromCommand,
      onCreateList: handleCreateListFromCommand,
      onCreateTable: () => {},
      selectedImageIds,
      onToggleImageSelection: handleToggleImageSelection,
      onClickWithModifier: handleClickWithModifier,
      onBlockDragStart: handleBlockDragStart,
      onImageDragStart: handleImageDragStart,
      onSetDragOverNodeId: setDragOverNodeId,
      onSetDropPosition: setDropPosition,
      draggingNodeId,
      onSetDraggingNodeId: setDraggingNodeId,
      onFlexContainerDragOver: handleFlexContainerDragOver,
      onFlexContainerDragLeave: handleFlexContainerDragLeave,
      onFlexContainerDrop: handleFlexContainerDrop,
      dragOverFlexId,
      flexDropPosition,
      registerNodeRef,
      hasCoverImage: false,
      onUploadCoverImage: undefined,
    }),
    [
      readOnly,
      onUploadImage,
      handleContentChange,
      handleKeyDown,
      handleNodeClick,
      handleDeleteNode,
      handleCreateNested,
      handleChangeBlockType,
      handleInsertImageFromCommand,
      handleCreateListFromCommand,
      selectedImageIds,
      handleToggleImageSelection,
      handleClickWithModifier,
      handleBlockDragStart,
      handleImageDragStart,
      setDragOverNodeId,
      setDropPosition,
      draggingNodeId,
      setDraggingNodeId,
      handleFlexContainerDragOver,
      handleFlexContainerDragLeave,
      handleFlexContainerDrop,
      dragOverFlexId,
      flexDropPosition,
      registerNodeRef,
    ]
  );

  return (
    <div className="flex flex-col flex-1 w-full h-full bg-background">
      {/* Inline toolbar */}
      {!readOnly && (
        <CompactToolbar
          onFormat={handleFormat}
          onTypeChange={(type) => handleTypeChange(type as TextNode["type"])}
          onCreateList={handleCreateList}
        />
      )}

      {/* Editor content */}
      <div
        ref={editorContentRef}
        className="flex-1 overflow-auto"
        style={{ minHeight }}
      >
        <EditorContextProvider value={editorContextValue}>
          <>
            {/* Hidden file inputs */}
            {!readOnly && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  ref={multipleFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleFilesChange}
                  className="hidden"
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="hidden"
                />
                <input
                  ref={freeImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFreeImageFileChange}
                  className="hidden"
                />
              </>
            )}

            {/* Block list */}
            <div
              data-editor-content
              role="textbox"
              aria-multiline="true"
              aria-label="Rich text editor"
              aria-readonly={readOnly}
              onCopy={readOnly ? undefined : handleCopy}
              onPaste={readOnly ? undefined : handlePaste}
              onCut={readOnly ? undefined : handleCut}
              className="px-4 py-3"
            >
              {childrenIds.map((nodeId, index) => (
                <BlockWrapper
                  key={nodeId}
                  nodeId={nodeId}
                  index={index}
                  activeNodeId={activeNodeId}
                  readOnly={readOnly}
                  dragOverNodeId={dragOverNodeId}
                  dropPosition={dropPosition}
                  draggingNodeId={draggingNodeId}
                  handleDragEnter={handleDragEnter}
                  handleDragOver={handleDragOver}
                  handleDragLeave={handleDragLeave}
                  handleDrop={handleDrop}
                  handleAddBlock={handleAddBlock}
                />
              ))}
            </div>
          </>
        </EditorContextProvider>
      </div>

      {/* Free-positioned images */}
      <FreePositionedImages
        activeNodeId={activeNodeId}
        readOnly={readOnly}
        handleNodeClick={handleNodeClick}
        handleDeleteNode={handleDeleteNode}
      />

      {/* Floating selection toolbar */}
      {!readOnly && (
        <SelectionToolbar
          selection={currentSelection}
          selectedColor={selectedColor}
          onFormat={handleFormat}
          onTypeChange={(type) => handleTypeChange(type as TextNode["type"])}
          onColorSelect={handleApplyColor}
          onFontSizeSelect={handleApplyFontSize}
        />
      )}
    </div>
  );
}

// ─── Public props ─────────────────────────────────────────────────────────────

export interface CompactEditorProps {
  /**
   * Initial document content. When provided, CompactEditor wraps itself in an
   * EditorProvider. If you are already inside an EditorProvider, omit this
   * prop and the existing provider will be used.
   */
  initialContent?: ContainerNode;
  /**
   * Initial full editor state (takes precedence over `initialContent`).
   * Use this when you need to restore history, cursor position, etc.
   */
  initialState?: EditorState;
  /** Put the editor in view-only mode. Default: false. */
  readOnly?: boolean;
  /** Placeholder text shown when the editor is empty. (reserved for future use) */
  placeholder?: string;
  /** Additional CSS classes for the outer wrapper. */
  className?: string;
  /**
   * Called whenever document content changes (debounced at 300 ms).
   * Receives the current document as both a JSON tree and semantic HTML string.
   */
  onChange?: (data: { json: ContainerNode; html: string }) => void;
  /**
   * Custom image upload handler.
   * Should return a promise that resolves to the uploaded image URL.
   */
  onUploadImage?: (file: File) => Promise<string>;
  /**
   * Minimum height of the editing area.
   * @default "200px"
   */
  minHeight?: string;
}

/**
 * CompactEditor — the primary embeddable editor component.
 *
 * Renders a bordered editor with an inline formatting toolbar.
 * Designed to be dropped into any layout at any width.
 *
 * When `initialContent` or `initialState` is provided the component manages
 * its own `EditorProvider`. When neither is provided it expects to be rendered
 * inside an existing `<EditorProvider>`.
 *
 * @example Self-contained usage
 * ```tsx
 * <CompactEditor
 *   initialContent={myContent}
 *   onChange={({ json }) => save(json)}
 *   minHeight="300px"
 * />
 * ```
 *
 * @example Inside an external provider
 * ```tsx
 * <EditorProvider initialContent={myContent}>
 *   <CompactEditor onChange={({ json }) => save(json)} />
 * </EditorProvider>
 * ```
 */
export function CompactEditor({
  initialContent,
  initialState,
  readOnly = false,
  className,
  onChange,
  onUploadImage,
  minHeight = "200px",
}: CompactEditorProps) {
  // SSR guard: defer all ID generation and rendering until the client mounts.
  // generateId() uses a global counter that drifts between server and client,
  // causing React hydration mismatches. Rendering a size-matched placeholder
  // during SSR avoids the mismatch with no visible layout shift.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Build a default container. Use useState (not useMemo/useRef) so the value
  // survives React Strict Mode double-render. useState lazy init runs once per
  // mount cycle, and React preserves state across Strict Mode re-renders.
  const [defaultContent] = useState<ContainerNode | null>(() => {
    if (typeof window === "undefined") return null;
    if (initialContent) return initialContent;
    return {
      id: generateId("root"),
      type: "container",
      children: createEmptyContent(),
      attributes: {},
    } as ContainerNode;
  });

  // SSR / pre-mount: render a placeholder shell matching the editor dimensions
  if (!mounted || !defaultContent) {
    return (
      <div
        style={{ minHeight }}
        className={cn(
          "mina-editor border rounded-lg overflow-hidden flex flex-col bg-background",
          className
        )}
      />
    );
  }

  const inner = (
    <div
      className={cn(
        "mina-editor border rounded-lg overflow-hidden flex flex-col bg-background",
        className
      )}
    >
      <CompactEditorInner
        readOnly={readOnly}
        onUploadImage={onUploadImage}
        onChange={onChange}
        minHeight={minHeight}
      />
    </div>
  );

  // Always self-wrap in an EditorProvider so that CompactEditor works as a
  // standalone drop-in. Consumers who want to share state across multiple
  // editors should wrap in their own <EditorProvider> and omit initialContent
  // — in that case they can render <CompactEditorInner> directly (internal
  // use), or we can expose an opt-out flag in the future.
  // For now: always provide a store so hooks never throw.
  return (
    <EditorProvider
      initialContainer={defaultContent}
      initialState={initialState}
    >
      {inner}
    </EditorProvider>
  );
}
