/**
 * Mina Rich Editor - Clean Version
 *
 * A minimal editor demonstrating text formatting with our CRUD system.
 * Focus on: Select text → Click format button → Update via reducer
 *
 * CLEAN VERSION - All handlers extracted to separate modules
 */

"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  useEditor,
  EditorActions,
  type TextNode,
  type EditorNode,
  type EditorState,
  type SelectionInfo,
  hasInlineChildren,
  getNodeTextContent,
  serializeToHtml,
  isTextNode,
  isContainerNode,
  ContainerNode,
  useSelectionManager,
  useSelection,
  findNodeById,
} from "../lib";
import { Block } from "./Block";
import { AddBlockButton } from "./AddBlockButton";
import { CustomClassPopover } from "./CustomClassPopover";
import { LinkPopover } from "./LinkPopover";
import { EditorToolbar } from "./EditorToolbar";
import { Card, CardContent } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { Toolbar } from "./Toolbar";

// Import all handlers
import {
  createHandleSelectionChange,
  createHandleFormat,
  createHandleApplyColor,
  createHandleApplyFontSize,
  createHandleTypeChange,
} from "../lib/handlers/selection-handlers";

import {
  createHandleKeyDown,
  createHandleContentChange,
} from "../lib/handlers/keyboard-handlers";

import {
  createHandleImageDragStart,
  createHandleBlockDragStart,
  createHandleDragEnter,
  createHandleDragOver,
  createHandleDragLeave,
  createHandleDrop,
} from "../lib/handlers/drag-drop-handlers";

import {
  createHandleFileChange,
  createHandleMultipleFilesChange,
  createHandleImageUploadClick,
  createHandleMultipleImagesUploadClick,
} from "../lib/handlers/file-upload-handlers";

import {
  createHandleNodeClick,
  createHandleDeleteNode,
  createHandleAddBlock,
  createHandleCreateNested,
  createHandleChangeBlockType,
  createHandleInsertImageFromCommand,
  createHandleCreateList,
  createHandleCreateListFromCommand,
  createHandleCreateLink,
  createHandleCopyHtml,
  createHandleCopyJson,
} from "../lib/handlers/node-operation-handlers";

/**
 * Editor Component Props
 */
interface EditorProps {
  readOnly?: boolean; // View-only mode - renders content without editing capabilities
  onUploadImage?: (file: File) => Promise<string>; // Custom image upload handler - should return the uploaded image URL
}

export function Editor({
  readOnly: initialReadOnly = false,
  onUploadImage,
}: EditorProps = {}) {
  const [state, dispatch] = useEditor();
  const selectionManager = useSelectionManager();
  const { toast } = useToast();
  const lastEnterTime = useRef<number>(0);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());
  const contentUpdateTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);
  const editorContentRef = useRef<HTMLDivElement>(null);
  const [readOnly, setReadOnly] = useState(initialReadOnly);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [enhanceSpaces, setEnhanceSpaces] = useState(true);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<
    "before" | "after" | "left" | "right" | null
  >(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");

  // Get the current container from history
  const container = state.history[state.historyIndex];

  const currentNode = state.activeNodeId
    ? (container.children.find((n) => n.id === state.activeNodeId) as
        | TextNode
        | undefined)
    : (container.children[0] as TextNode | undefined);

  // Debounced dispatch for selection state updates
  const selectionDispatchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Create handler parameters
  const selectionParams = {
    container,
    state,
    dispatch,
    selectionManager,
    nodeRefs,
  };

  const keyboardParams = {
    container,
    dispatch,
    nodeRefs,
    lastEnterTime,
  };

  const nodeOperationParams = {
    container,
    dispatch,
    toast,
    nodeRefs,
    editorContentRef,
  };

  const dragDropParams = {
    container,
    dispatch,
    toast,
    draggingNodeId,
    setDraggingNodeId,
    setDragOverNodeId,
    setDropPosition,
    setIsUploading,
    onUploadImage,
  };

  const fileUploadParams = {
    container,
    dispatch,
    state,
    toast,
    setIsUploading,
    fileInputRef,
    multipleFileInputRef,
    onUploadImage,
  };

  // Create all handlers
  const handleSelectionChange = useCallback(
    createHandleSelectionChange(selectionParams, selectionDispatchTimerRef),
    [container, state.activeNodeId, selectionManager, dispatch]
  );

  const handleFormat = useCallback(createHandleFormat(selectionParams), [
    container,
    dispatch,
    selectionManager,
  ]);

  const handleApplyColor = useCallback(
    createHandleApplyColor(selectionParams, toast, setSelectedColor),
    [dispatch, selectionManager, toast]
  );

  const handleApplyFontSize = useCallback(
    createHandleApplyFontSize(selectionParams, toast),
    [dispatch, selectionManager, toast]
  );

  const handleTypeChange = useCallback(
    createHandleTypeChange(selectionParams, currentNode, handleSelectionChange),
    [currentNode, dispatch, selectionManager, handleSelectionChange]
  );

  const handleContentChange = useCallback(
    createHandleContentChange(keyboardParams, contentUpdateTimers),
    [container, dispatch]
  );

  const handleKeyDown = useCallback(createHandleKeyDown(keyboardParams), [
    container,
    dispatch,
    nodeRefs,
    lastEnterTime,
  ]);

  const handleNodeClick = useCallback(
    createHandleNodeClick({ container, dispatch }),
    [container, dispatch]
  );

  const handleDeleteNode = useCallback(
    createHandleDeleteNode({ container, dispatch, toast }),
    [container, dispatch, toast]
  );

  const handleAddBlock = useCallback(
    createHandleAddBlock({ dispatch, nodeRefs }),
    [dispatch, nodeRefs]
  );

  const handleCreateNested = useCallback(
    createHandleCreateNested({ container, dispatch, toast }),
    [container, dispatch, toast]
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
    [container, dispatch, toast, editorContentRef]
  );

  const handleCreateListFromCommand = useCallback(
    createHandleCreateListFromCommand({ dispatch, toast, nodeRefs }),
    [dispatch, toast, nodeRefs]
  );

  const handleCreateLink = useCallback(
    createHandleCreateLink(nodeOperationParams),
    [container, dispatch, toast, editorContentRef]
  );

  const handleCopyHtml = useCallback(
    () =>
      createHandleCopyHtml({ toast }, enhanceSpaces, setCopiedHtml)(container),
    [container, enhanceSpaces, toast]
  );

  const handleCopyJson = useCallback(
    () => createHandleCopyJson({ toast }, setCopiedJson)(container),
    [container, toast]
  );

  const handleImageDragStart = useCallback(
    createHandleImageDragStart(setDraggingNodeId),
    []
  );

  const handleBlockDragStart = useCallback(
    createHandleBlockDragStart(setDraggingNodeId),
    []
  );

  const handleDragEnter = useCallback(createHandleDragEnter(), []);

  const handleDragOver = useCallback(
    createHandleDragOver({
      container,
      dispatch,
      draggingNodeId,
      setDraggingNodeId,
      setDragOverNodeId,
      setDropPosition,
    }),
    [container, draggingNodeId]
  );

  const handleDragLeave = useCallback(
    createHandleDragLeave(setDragOverNodeId, setDropPosition),
    []
  );

  const handleDrop = useCallback(
    createHandleDrop(dragDropParams, dropPosition),
    [container, dispatch, toast, draggingNodeId, dropPosition, onUploadImage]
  );

  const handleFileChange = useCallback(
    createHandleFileChange(fileUploadParams),
    [container, dispatch, state, toast, onUploadImage]
  );

  const handleMultipleFilesChange = useCallback(
    createHandleMultipleFilesChange(fileUploadParams),
    [container, dispatch, state, toast, onUploadImage]
  );

  const handleImageUploadClick = useCallback(
    createHandleImageUploadClick(fileInputRef),
    []
  );

  const handleMultipleImagesUploadClick = useCallback(
    createHandleMultipleImagesUploadClick(multipleFileInputRef),
    []
  );

  // Selection change listener
  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [handleSelectionChange]);

  // Focus on current node when it changes
  useEffect(() => {
    if (!state.activeNodeId) return;

    const activeId = state.activeNodeId;

    const attemptFocus = (retries = 0) => {
      const element = nodeRefs.current.get(activeId);

      if (element && document.activeElement !== element) {
        element.focus();
      } else if (!element && retries < 10) {
        setTimeout(() => attemptFocus(retries + 1), 50);
      } else if (!element) {
        console.error(
          "❌ [Focus Failed] Element not found after 10 retries:",
          activeId
        );
      }
    };

    attemptFocus();
  }, [state.activeNodeId]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      contentUpdateTimers.current.forEach((timer) => clearTimeout(timer));
      contentUpdateTimers.current.clear();
    };
  }, []);

  // Handle global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      const activeElement = document.activeElement;
      const isInEditor = Array.from(nodeRefs.current.values()).some(
        (el) => el === activeElement || el.contains(activeElement)
      );

      // Ctrl+A / Cmd+A - Select all content in current block only
      if (isCtrlOrCmd && e.key === "a" && isInEditor) {
        e.preventDefault();

        const selection = window.getSelection();
        if (!selection) return;

        const currentBlock = activeElement as HTMLElement;
        if (currentBlock && currentBlock.isContentEditable) {
          const range = document.createRange();
          range.selectNodeContents(currentBlock);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }

      // Ctrl+B / Cmd+B - Toggle Bold
      if (isCtrlOrCmd && e.key === "b" && isInEditor) {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          handleFormat("bold");
        }
      }

      // Ctrl+I / Cmd+I - Toggle Italic
      if (isCtrlOrCmd && e.key === "i" && isInEditor) {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          handleFormat("italic");
        }
      }

      // Ctrl+U / Cmd+U - Toggle Underline
      if (isCtrlOrCmd && e.key === "u" && isInEditor) {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          handleFormat("underline");
        }
      }

      // Ctrl+Z / Cmd+Z - Undo
      if (isCtrlOrCmd && e.key === "z" && !e.shiftKey) {
        if (
          !isInEditor &&
          (activeElement?.tagName === "INPUT" ||
            activeElement?.tagName === "TEXTAREA")
        ) {
          return;
        }
        e.preventDefault();
        if (state.historyIndex > 0) {
          dispatch(EditorActions.undo());
        }
      }

      // Ctrl+Y / Cmd+Y or Ctrl+Shift+Z - Redo
      if (
        (isCtrlOrCmd && e.key === "y") ||
        (isCtrlOrCmd && e.shiftKey && e.key === "z")
      ) {
        if (
          !isInEditor &&
          (activeElement?.tagName === "INPUT" ||
            activeElement?.tagName === "TEXTAREA")
        ) {
          return;
        }
        e.preventDefault();
        if (state.historyIndex < state.history.length - 1) {
          dispatch(EditorActions.redo());
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [state.historyIndex, state.history.length, dispatch, toast, handleFormat]);

  // Initialize with an empty paragraph block if needed
  useEffect(() => {
    if (container.children.length === 0) {
      const newNode: TextNode = {
        id: "p-" + Date.now(),
        type: "p",
        content: "",
        attributes: {},
      };

      dispatch(EditorActions.insertNode(newNode, container.id, "append"));
      dispatch(EditorActions.setActiveNode(newNode.id));
    }
  }, []); // Empty dependency array - only run once on mount

  return (
    <div className="bg-background transition-colors flex flex-col flex-1 duration-300">
      {/* Editor with integrated toolbar */}
      <div className="mx-auto flex flex-col flex-1 w-full">
        <Toolbar readOnly={readOnly} onReadOnlyChange={setReadOnly} />
        <Card className="shadow-2xl flex flex-col flex-1 pt-0 rounded-none border-2 gap-3 transition-all duration-300">
          {/* Toolbar - hidden in readOnly mode */}
          {!readOnly && (
            <EditorToolbar
              currentNode={currentNode}
              currentSelection={state.currentSelection}
              selectedColor={selectedColor}
              isUploading={isUploading}
              enhanceSpaces={enhanceSpaces}
              copiedHtml={copiedHtml}
              copiedJson={copiedJson}
              container={container}
              onTypeChange={handleTypeChange}
              onFormat={handleFormat}
              onColorSelect={handleApplyColor}
              onFontSizeSelect={handleApplyFontSize}
              onImageUploadClick={handleImageUploadClick}
              onMultipleImagesUploadClick={handleMultipleImagesUploadClick}
              onCreateList={handleCreateList}
              onCreateLink={handleCreateLink}
              onCopyHtml={handleCopyHtml}
              onCopyJson={handleCopyJson}
              onEnhanceSpacesChange={setEnhanceSpaces}
            />
          )}

          {/* Hidden file inputs for image uploads */}
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
            </>
          )}

          {/* Editor Content */}
          <CardContent
            className={`p-6 flex flex-col w-full flex-1 transition-all duration-300 max-w-4xl mx-auto ${
              readOnly ? "py-14 md:py-20" : ""
            }`}
          >
            <div ref={editorContentRef}>
              <div data-editor-content>
                {container.children.map((node, index) => {
                  const isText = isTextNode(node);
                  const textNode = isText ? (node as TextNode) : null;

                  const hasChildren =
                    textNode &&
                    Array.isArray(textNode.children) &&
                    textNode.children.length > 0;
                  const nodeKey = hasChildren
                    ? `${node.id}-children-${textNode?.children?.length}`
                    : `${node.id}-content`;

                  const isFirstBlock = index === 0;

                  return (
                    <React.Fragment key={nodeKey}>
                      {/* Add block button before first block */}
                      {!readOnly && isFirstBlock && (
                        <AddBlockButton
                          onAdd={() => handleAddBlock(node.id, "before")}
                          position="before"
                        />
                      )}

                      <div
                        onDragEnter={(e) => handleDragEnter(e, node.id)}
                        onDragOver={(e) => handleDragOver(e, node.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, node.id)}
                        className={`
                        relative transition-all
                        ${
                          dragOverNodeId === node.id &&
                          dropPosition === "before" &&
                          draggingNodeId !== node.id
                            ? "before:absolute before:inset-x-0 before:-top-1 before:h-1 before:bg-primary/30 before:z-10 before:rounded-full"
                            : ""
                        }
                        ${
                          dragOverNodeId === node.id &&
                          dropPosition === "after" &&
                          draggingNodeId !== node.id
                            ? "after:absolute after:inset-x-0 after:-bottom-1 after:h-1 after:bg-primary/30 after:z-10 after:rounded-full"
                            : ""
                        }
                        ${
                          dragOverNodeId === node.id &&
                          dropPosition === "left" &&
                          draggingNodeId !== node.id
                            ? "before:absolute before:inset-y-0 before:-left-1 before:w-1 before:bg-blue-500/50 before:z-10 before:rounded-full"
                            : ""
                        }
                        ${
                          dragOverNodeId === node.id &&
                          dropPosition === "right" &&
                          draggingNodeId !== node.id
                            ? "after:absolute after:inset-y-0 after:-right-1 after:w-1 after:bg-blue-500/50 after:z-10 after:rounded-full"
                            : ""
                        }
                    `}
                      >
                        <Block
                          key={`${node.id}-${node.type}`}
                          node={node}
                          isActive={state.activeNodeId === node.id}
                          nodeRef={(el) => {
                            if (el) {
                              const elementNodeId =
                                el.getAttribute("data-node-id");
                              if (elementNodeId) {
                                nodeRefs.current.set(elementNodeId, el);
                              }

                              if (textNode && elementNodeId === node.id) {
                                const isCurrentlyFocused =
                                  document.activeElement === el;
                                const selection = window.getSelection();

                                const hasActiveSelection =
                                  selection &&
                                  selection.rangeCount > 0 &&
                                  !selection.isCollapsed;

                                let selectionInThisElement = false;
                                if (
                                  hasActiveSelection &&
                                  selection.rangeCount > 0
                                ) {
                                  const range = selection.getRangeAt(0);
                                  selectionInThisElement = el.contains(
                                    range.commonAncestorContainer
                                  );
                                }

                                if (
                                  !isCurrentlyFocused &&
                                  !hasChildren &&
                                  !hasActiveSelection &&
                                  !selectionInThisElement
                                ) {
                                  const displayContent = textNode.content || "";
                                  const currentContent = el.textContent || "";

                                  if (currentContent !== displayContent) {
                                    el.textContent = displayContent;
                                  }
                                }
                              }
                            } else {
                              nodeRefs.current.delete(node.id);
                            }
                          }}
                          onInput={(element) =>
                            handleContentChange(node.id, element)
                          }
                          onKeyDown={(e) => handleKeyDown(e, node.id)}
                          onClick={() => handleNodeClick(node.id)}
                          onDelete={(nodeId?: string) =>
                            handleDeleteNode(nodeId || node.id)
                          }
                          onCreateNested={handleCreateNested}
                          readOnly={readOnly}
                          onImageDragStart={handleImageDragStart}
                          onBlockDragStart={handleBlockDragStart}
                          onChangeBlockType={handleChangeBlockType}
                          onInsertImage={handleInsertImageFromCommand}
                          onCreateList={handleCreateListFromCommand}
                          onUploadImage={onUploadImage}
                        />
                      </div>

                      {/* Add block button after each block */}
                      {!readOnly && (
                        <AddBlockButton
                          onAdd={() => handleAddBlock(node.id, "after")}
                          position="after"
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Class Popover - Floats on text selection */}
      {!readOnly && <CustomClassPopover />}

      {/* Link Popover - Floats on text selection */}
      {!readOnly && <LinkPopover />}
    </div>
  );
}
