/**
 * Mina Rich Editor - Embeddable Component
 *
 * A clean, embeddable React editor component.
 * Fills its container at any width — the consumer controls layout.
 *
 * All handlers are extracted to separate modules.
 */

"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  type TextNode,
  type ContainerNode,
  isTextNode,
} from "../lib";
import { serializeToSemanticHtml } from "../lib/utils/serialize-semantic-html";
import {
  useEditorStore,
  useEditorDispatch,
  useEditorStoreInstance,
  useContainer,
  useContainerChildrenIds,
  useBlockNode,
  useSelectionManager,
} from "../lib/store/editor-store";
import { AddBlockButton } from "./AddBlockButton";
import { EditorToolbar } from "./EditorToolbar";
import { SelectionToolbar } from "./SelectionToolbar";
import { TableDialog } from "./TableDialog";
import { useToast } from "@/hooks/use-toast";
import { useDragAutoScroll } from "../lib/utils/drag-auto-scroll";
import { GroupImagesButton } from "./GroupImagesButton";
import { FreeImageBlock } from "./FreeImageBlock";
import { InsertComponentsModal } from "./InsertComponentsModal";

// Import all handlers
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

// Custom hooks
import { useImageSelection } from "../hooks/useImageSelection";
import { useTableOperations } from "../hooks/useTableOperations";
import { useEditorClipboard } from "../hooks/useEditorClipboard";
import { useEditorSelection } from "../hooks/useEditorSelection";
import { useMediaPaste } from "../hooks/useMediaPaste";

import { Block } from "./Block";
import { CoverImage } from "./CoverImage";
import {
  EditorContextProvider,
  type EditorContextValue,
} from "../hooks/useEditorContext";

// ─── Per-block wrapper ────────────────────────────────────────────────────────

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

/**
 * BlockWrapper — subscribes only to a single node's data via `useBlockNode`.
 *
 * This means Editor's JSX never iterates the full node list on content
 * changes. When a keystroke mutates block A, only BlockWrapper(A) re-renders.
 * Editor itself does NOT re-render because it now subscribes to
 * `useContainerChildrenIds` (a stable ID array) instead of the full container.
 */
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

  // Node may not exist yet during concurrent renders — bail out early
  if (!node) return null;

  // Skip free-positioned images; they are rendered by FreePositionedImages
  const isText = isTextNode(node);
  const textNode = isText ? (node as TextNode) : null;
  if (textNode?.type === "img" && textNode.attributes?.isFreePositioned) {
    return null;
  }

  const isFirstBlock = index === 0;

  return (
    <div className="w-full">
      {/* Add block button before first block */}
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

      {/* Add block button after each block */}
      {!readOnly && (
        <AddBlockButton
          onAdd={() => handleAddBlock(nodeId, "after")}
          position="after"
        />
      )}
    </div>
  );
});

// ─── Free-positioned images renderer ─────────────────────────────────────────

interface FreePositionedImagesProps {
  activeNodeId: string | null;
  readOnly: boolean;
  handleNodeClick: (nodeId: string) => void;
  handleDeleteNode: (nodeId: string) => void;
}

/**
 * FreePositionedImages — isolates the `useContainer` subscription needed to
 * find and render absolutely-positioned image blocks.
 *
 * By extracting this into its own component, the parent Editor is no longer
 * required to subscribe to the full container object just to filter images.
 */
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

// ─── Editor Component Props ───────────────────────────────────────────────────

/**
 * Editor Component Props
 */
interface EditorProps {
  readOnly?: boolean; // View-only mode — renders content without editing capabilities
  onUploadImage?: (file: File) => Promise<string>; // Custom image upload handler — should return the uploaded image URL
  onUploadVideo?: (file: File) => Promise<string>; // Custom video upload handler — should return the uploaded video URL
  notionBased?: boolean; // Enable Notion-style features (cover image, first header spacing) — default: true
  className?: string; // Additional CSS classes applied to the outermost container div
  /**
   * Called whenever the document content changes.
   * Debounced at 300 ms — only fires when the container reference actually
   * changes (not on activeNodeId or selection-only updates).
   * NOTE: Markdown is intentionally omitted from the payload because Markdown
   * serialisation can be expensive. Use `useEditorAPI().getMarkdown()` if needed.
   */
  onChange?: (data: { json: ContainerNode; html: string }) => void;
  dir?: 'ltr' | 'rtl' | 'auto'; // Text direction — default: 'ltr'
  onDirChange?: (dir: 'ltr' | 'rtl' | 'auto') => void; // Callback when direction changes
  onAISelect?: (nodeId: string) => void; // Called when user selects "AI Generate" from command menu
  aiProvider?: import('../lib/ai/types').AIProvider; // AI provider for selection-based AI editing
  aiSystemPrompt?: string; // Default system prompt for AI selection editing
}

export function Editor({
  readOnly: initialReadOnly = false,
  onUploadImage,
  onUploadVideo,
  notionBased = true,
  className,
  onChange,
  dir = 'ltr',
  onDirChange,
  onAISelect,
  aiProvider,
  aiSystemPrompt,
}: EditorProps = {}) {
  // ✅ OPTIMIZATION: Subscribe to specific state pieces instead of full state
  // This prevents Editor from re-rendering on every state change
  const activeNodeId = useEditorStore((state) => state.activeNodeId);
  const undoStackLength = useEditorStore((state) => state.undoStack.length);
  const redoStackLength = useEditorStore((state) => state.redoStack.length);
  const coverImage = useEditorStore((state) => state.coverImage);
  const currentSelection = useEditorStore((state) => state.currentSelection);

  const dispatch = useEditorDispatch();
  // ✅ OPTIMIZATION: Subscribe only to the list of child IDs, not the full
  // container object. This prevents Editor from re-rendering on every keystroke
  // (content changes update the container reference but not the ID array).
  const childrenIds = useContainerChildrenIds();
  const selectionManager = useSelectionManager();

  // ✅ OPTIMIZATION: Stable container getter for all callbacks.
  // Callbacks use this getter instead of closing over the container directly,
  // so they never go stale and never need to be recreated when container changes.
  // We pull the getter directly from the Zustand store so that the Editor
  // component itself does NOT subscribe to container changes — only the
  // specialised sub-components (BlockWrapper, FreePositionedImages, etc.) do.
  const storeGetContainer = useEditorStore((s) => s.getContainer);
  const getContainer = useCallback(() => storeGetContainer(), [storeGetContainer]);
  const { toast } = useToast();
  const lastEnterTime = useRef<number>(0);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());
  const pendingFocusId = useRef<string | null>(null);
  const contentUpdateTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const activeNodeIdRef = useRef(activeNodeId);
  activeNodeIdRef.current = activeNodeId;
  const editorContentRef = useRef<HTMLDivElement>(null);
  const [readOnly, setReadOnly] = useState(initialReadOnly);

  // Keep internal readOnly in sync when the prop changes externally
  useEffect(() => {
    setReadOnly(initialReadOnly);
  }, [initialReadOnly]);

  // ── onChange: debounced subscription to container reference changes ────────
  const store = useEditorStoreInstance();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!onChangeRef.current) return;

    let prevContainer = store.getState().getContainer();

    const unsubscribe = store.subscribe((state) => {
      const nextContainer = state.current;

      // Only fire when the container reference actually changed
      // (ignores activeNodeId, selection, and other non-content state updates)
      if (nextContainer === prevContainer) return;
      prevContainer = nextContainer;

      // Debounce: clear any pending timer before scheduling a new one
      if (onChangeTimerRef.current !== null) {
        clearTimeout(onChangeTimerRef.current);
      }

      onChangeTimerRef.current = setTimeout(() => {
        onChangeTimerRef.current = null;
        const cb = onChangeRef.current;
        if (!cb) return;
        const json = nextContainer;
        const html = serializeToSemanticHtml(json);
        cb({ json, html });
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
  // ──────────────────────────────────────────────────────────────────────────

  // Enable auto-scroll when dragging near viewport edges
  useDragAutoScroll(editorContentRef, {
    scrollZone: 100,
    scrollSpeed: 15,
    enableVertical: true,
    enableHorizontal: false,
  });

  const [insertComponentModalOpen, setInsertComponentModalOpen] =
    useState(false);

  // --- Extracted hooks ---

  const {
    selectedImageIds,
    handleToggleImageSelection,
    handleClearImageSelection,
    handleGroupSelectedImages,
    flexInfo,
    handleReverseImagesInFlex,
    handleExtractFromFlex,
  } = useImageSelection({ dispatch, toast, getContainer });

  const {
    tableDialogOpen,
    setTableDialogOpen,
    setTableInsertionTargetId,
    handleCreateTableFromCommand,
    handleImportMarkdownTable,
    handleCreateTable,
  } = useTableOperations({ dispatch, toast, getContainer, editorContentRef });

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

  const nodeOperationParams = {
    container: getContainer,
    dispatch,
    toast,
    nodeRefs,
    editorContentRef,
  };

  // Drag-drop hook
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
  } = useEditorDragDrop({
    dispatch,
    getContainer,
    toast,
    onUploadImage,
  });

  // File upload hook
  const {
    isUploading,
    setIsUploading,
    fileInputRef,
    multipleFileInputRef,
    videoInputRef,
    freeImageInputRef,
    handleFileChange,
    handleMultipleFilesChange,
    handleImageUploadClick,
    handleMultipleImagesUploadClick,
    handleVideoUploadClick,
    handleVideoFileChange,
    handleFreeImageFileChange,
    handleFreeImageUploadClick,
  } = useEditorFileUpload({
    dispatch,
    getContainer,
    getActiveNodeId: () => activeNodeIdRef.current,
    toast,
    onUploadImage,
  });

  // Media paste (image/video from clipboard) — document-level listener
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

  const handleCreateList = useCallback(
    createHandleCreateList(nodeOperationParams),
    [dispatch, toast]
  );

  const handleCreateListFromCommand = useCallback(
    createHandleCreateListFromCommand({ dispatch, toast, nodeRefs }),
    [dispatch, toast, nodeRefs]
  );

  const handleInsertComponentClick = useCallback(() => {
    setInsertComponentModalOpen(true);
  }, []);

  const handleInsertComponentSelect = useCallback(
    (componentId: string) => {
      if (componentId === "free-image") {
        handleFreeImageUploadClick();
      }
      // Future: handle other component types here
    },
    [handleFreeImageUploadClick]
  );

  // Selection change listener (scoped to this editor instance)
  useEffect(() => {
    const scopedHandler = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorContentRef.current) {
        const range = sel.getRangeAt(0);
        if (!editorContentRef.current.contains(range.commonAncestorContainer)) {
          return;
        }
      }
      handleSelectionChange();
    };
    document.addEventListener("selectionchange", scopedHandler);
    return () => {
      document.removeEventListener("selectionchange", scopedHandler);
    };
  }, [handleSelectionChange]);

  // Focus on current node when it changes.
  // If the element is already mounted, focus immediately.
  // Otherwise, store the ID so registerNodeRef can focus it when it mounts.
  useEffect(() => {
    if (!activeNodeId) return;

    const element = nodeRefs.current.get(activeNodeId);
    if (element && document.activeElement !== element) {
      element.focus();
      pendingFocusId.current = null;
    } else if (!element) {
      pendingFocusId.current = activeNodeId;
    }

    return () => {
      pendingFocusId.current = null;
    };
  }, [activeNodeId]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      contentUpdateTimers.current.forEach((timer) => clearTimeout(timer));
      contentUpdateTimers.current.clear();
    };
  }, []);

  // Global keyboard shortcuts (Ctrl+A, Ctrl+B/I/U, Ctrl+Z/Y, arrow navigation)
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

  // Stable registerNodeRef callback (nodeRefs ref never changes identity).
  // When a newly mounted element matches the pending focus ID, focus it immediately.
  const registerNodeRef = useCallback(
    (nodeId: string, el: HTMLElement | null) => {
      if (el) {
        nodeRefs.current.set(nodeId, el);
        if (pendingFocusId.current === nodeId) {
          pendingFocusId.current = null;
          el.focus();
        }
      } else {
        nodeRefs.current.delete(nodeId);
      }
    },
    [] // nodeRefs.current and pendingFocusId.current are stable refs
  );

  // Build the editor context value.
  // Callbacks are stable (useCallback with stable deps), so this memo only
  // rebuilds when the few dynamic fields listed in deps actually change.
  const editorContextValue = useMemo<EditorContextValue>(
    () => ({
      readOnly,
      notionBased,
      onUploadImage,
      onUploadVideo,
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
      onCreateTable: handleCreateTableFromCommand,
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
      hasCoverImage: !!coverImage,
      onUploadCoverImage: onUploadImage,
      onAISelect,
    }),
    [
      readOnly,
      notionBased,
      onUploadImage,
      onUploadVideo,
      handleContentChange,
      handleKeyDown,
      handleNodeClick,
      handleDeleteNode,
      handleCreateNested,
      handleChangeBlockType,
      handleInsertImageFromCommand,
      handleCreateListFromCommand,
      handleCreateTableFromCommand,
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
      coverImage,
      onAISelect,
    ]
  );

  return (
    <div dir={dir} className={`mina-editor bg-background transition-colors flex flex-col w-full h-full duration-300${className ? ` ${className}` : ""}`}>
      {/* Toolbar - hidden in readOnly mode */}
      {!readOnly && (
        <EditorToolbar
          isUploading={isUploading}
          onImageUploadClick={handleImageUploadClick}
          onMultipleImagesUploadClick={handleMultipleImagesUploadClick}
          onVideoUploadClick={handleVideoUploadClick}
          onInsertComponentClick={handleInsertComponentClick}
          onCreateList={handleCreateList}
          onCreateTable={() => setTableDialogOpen(true)}
        />
      )}

      <div className="py-0 relative flex flex-col flex-1 gap-3 transition-all duration-300">
        {/* Table Dialog */}
        <TableDialog
          open={tableDialogOpen}
          onOpenChange={(open) => {
            setTableDialogOpen(open);
            // Clear the target ID when dialog closes
            if (!open) {
              setTableInsertionTargetId(undefined);
            }
          }}
          onCreateTable={handleCreateTable}
          onImportMarkdown={handleImportMarkdownTable}
        />

        {/* Insert Components Modal */}
        <InsertComponentsModal
          open={insertComponentModalOpen}
          onOpenChange={setInsertComponentModalOpen}
          onSelect={handleInsertComponentSelect}
        />

        {/* Hidden file inputs for image and video uploads */}
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

        {/* Editor Content */}
        <div
          className={`px-0 flex flex-col w-full flex-1 transition-all duration-300 mx-auto ${
            readOnly ? "py-14 md:py-20" : ""
          }`}
        >
          <div ref={editorContentRef} className="h-full flex flex-col flex-1">
            <EditorContextProvider value={editorContextValue}>
              <>
                {/* Cover Image — only rendered when notionBased and a cover image exists in store */}
                {notionBased && coverImage && (
                  <CoverImage
                    onUploadImage={onUploadImage}
                    readOnly={readOnly}
                  />
                )}

                <div
                  data-editor-content
                  role="textbox"
                  aria-multiline="true"
                  aria-label="Rich text editor"
                  aria-readonly={readOnly}
                  onCopy={readOnly ? undefined : handleCopy}
                  onPaste={readOnly ? undefined : handlePaste}
                  onCut={readOnly ? undefined : handleCut}
                  className={`${
                    notionBased && coverImage
                      ? "pt-[280px] lg:pt-[420px]"
                      : notionBased
                      ? "pt-[50px]"
                      : "pt-4"
                  } px-4 lg:px-10 flex-1 lg:pl-20 transition-all duration-300`}
                >
                  {/* ✅ OPTIMIZATION: Render by ID array — Editor no longer
                      iterates the full container on every keystroke.
                      Each BlockWrapper subscribes only to its own node. */}
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
        </div>

        {/* ✅ OPTIMIZATION: Free-positioned images isolated into its own
            component so it owns the container subscription independently. */}
        <FreePositionedImages
          activeNodeId={activeNodeId}
          readOnly={readOnly}
          handleNodeClick={handleNodeClick}
          handleDeleteNode={handleDeleteNode}
        />
      </div>

      {/* Selection Toolbar - Floats above selected text (Notion-style) */}
      {/* LinkPopover and CustomClassPopover are now integrated directly into SelectionToolbar */}
      {!readOnly && (
        <SelectionToolbar
          selection={currentSelection}
          selectedColor={selectedColor}
          onFormat={handleFormat}
          onTypeChange={(type) => handleTypeChange(type as TextNode["type"])}
          onColorSelect={handleApplyColor}
          onFontSizeSelect={handleApplyFontSize}
          aiProvider={aiProvider}
          aiSystemPrompt={aiSystemPrompt}
        />
      )}

      {/* Group Images Button - Floats when multiple images selected */}
      {!readOnly && (
        <GroupImagesButton
          selectedCount={selectedImageIds.size}
          inSameFlex={flexInfo.inSameFlex}
          onGroup={handleGroupSelectedImages}
          onReverse={
            flexInfo.inSameFlex ? handleReverseImagesInFlex : undefined
          }
          onExtract={flexInfo.inSameFlex ? handleExtractFromFlex : undefined}
          onClear={handleClearImageSelection}
        />
      )}
    </div>
  );
}
