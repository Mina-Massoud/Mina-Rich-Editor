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
import { AddBlockButton } from "./AddBlockButton";
import { CustomClassPopover } from "./CustomClassPopover";
import { LinkPopover } from "./LinkPopover";
import { EditorToolbar } from "./EditorToolbar";
import { SelectionToolbar } from "./SelectionToolbar";
import { TableDialog } from "./TableDialog";
import { TableBuilder } from "./TableBuilder";
import { Card, CardContent } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { QuickModeToggle } from "./QuickModeToggle";
import { useDragAutoScroll } from "../lib/utils/drag-auto-scroll";
import { GroupImagesButton } from "./GroupImagesButton";

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
  createHandleClickWithModifier,
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
  createHandleCreateTable,
  createHandleCopyHtml,
  createHandleCopyJson,
} from "../lib/handlers/node-operation-handlers";

import {
  createHandleToggleImageSelection,
  createHandleClearImageSelection,
  createHandleGroupSelectedImages,
  checkImagesInSameFlex,
  createHandleReverseImagesInFlex,
  createHandleExtractFromFlex,
} from "../lib/handlers/image-selection-handlers";

import {
  createHandleFlexContainerDragOver,
  createHandleFlexContainerDragLeave,
  createHandleFlexContainerDrop,
} from "../lib/handlers/flex-container-handlers";

import { Block } from "./Block";
import { CoverImage } from "./CoverImage";
import { ExportFloatingButton } from "./ExportFloatingButton";
import { TemplateSwitcherButton } from "./TemplateSwitcherButton";
import { Button } from "./ui/button";

/**
 * Editor Component Props
 */
interface EditorProps {
  readOnly?: boolean; // View-only mode - renders content without editing capabilities
  onUploadImage?: (file: File) => Promise<string>; // Custom image upload handler - should return the uploaded image URL
  notionBased?: boolean; // Enable Notion-style features (cover image, first header spacing) - default: true
  onNotionBasedChange?: (notionBased: boolean) => void; // Callback when notion mode is toggled
}

export function Editor({
  readOnly: initialReadOnly = false,
  onUploadImage,
  notionBased = true,
  onNotionBasedChange,
}: EditorProps = {}) {
  const [state, dispatch] = useEditor();
  const selectionManager = useSelectionManager();
  const { toast } = useToast();
  const lastEnterTime = useRef<number>(0);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());
  const contentUpdateTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const editorContentRef = useRef<HTMLDivElement>(null);
  const [readOnly, setReadOnly] = useState(initialReadOnly);

  // Enable auto-scroll when dragging near viewport edges
  useDragAutoScroll(editorContentRef, {
    scrollZone: 100,
    scrollSpeed: 15,
    enableVertical: true,
    enableHorizontal: false,
  });

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
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(
    new Set()
  );
  const [dragOverFlexId, setDragOverFlexId] = useState<string | null>(null);
  const [flexDropPosition, setFlexDropPosition] = useState<
    "left" | "right" | null
  >(null);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);

  // Get the current container from history
  const container = state.history[state.historyIndex];

  const currentNode = state.activeNodeId
    ? (container.children.find((n) => n.id === state.activeNodeId) as
        | TextNode
        | undefined)
    : (container.children[0] as TextNode | undefined);

  console.log("🎨 [Editor] Current Node:", currentNode);
  console.log("🎨 [Editor] Current Selection:", state.currentSelection);

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

  // keyboardParams will be created dynamically with the handlers

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

  const videoUploadParams = {
    container,
    dispatch,
    state,
    toast,
    setIsUploading,
    fileInputRef: videoInputRef,
    multipleFileInputRef: videoInputRef, // Reuse the same ref for consistency
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
    createHandleTypeChange(selectionParams, handleSelectionChange),
    [dispatch, selectionManager, handleSelectionChange]
  );

  const handleToggleImageSelection = useCallback(
    createHandleToggleImageSelection(selectedImageIds, setSelectedImageIds),
    [selectedImageIds]
  );

  const handleContentChange = useCallback(
    createHandleContentChange(
      {
        container,
        dispatch,
        nodeRefs,
        lastEnterTime,
        onToggleImageSelection: handleToggleImageSelection,
      },
      contentUpdateTimers
    ),
    [container, dispatch, handleToggleImageSelection]
  );

  const handleKeyDown = useCallback(
    createHandleKeyDown({
      container,
      dispatch,
      nodeRefs,
      lastEnterTime,
      onToggleImageSelection: handleToggleImageSelection,
    }),
    [container, dispatch, nodeRefs, lastEnterTime, handleToggleImageSelection]
  );

  const handleClickWithModifier = useCallback(
    createHandleClickWithModifier({
      container,
      dispatch,
      nodeRefs,
      lastEnterTime,
      onToggleImageSelection: handleToggleImageSelection,
    }),
    [container, handleToggleImageSelection]
  );

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

  const handleCreateTable = useCallback(
    createHandleCreateTable(nodeOperationParams),
    [container, dispatch, toast, editorContentRef]
  );

  const handleCreateTableFromCommand = useCallback(
    (nodeId: string) => {
      // Store the node ID for later use when table is created
      dispatch(EditorActions.setActiveNode(nodeId));
      // Open the table dialog
      setTableDialogOpen(true);
    },
    [dispatch]
  );

  const handleImportMarkdownTable = useCallback(
    (table: any) => {
      const timestamp = Date.now();

      // Wrap table in a container for consistent handling
      const tableWrapper: ContainerNode = {
        id: `table-wrapper-${timestamp}`,
        type: "container",
        children: [table],
        attributes: {},
      };

      // Insert the table at the end
      const lastNode = container.children[container.children.length - 1];
      if (lastNode) {
        dispatch(EditorActions.insertNode(tableWrapper, lastNode.id, "after"));
      } else {
        // If no nodes exist, replace the container
        dispatch(
          EditorActions.replaceContainer({
            ...container,
            children: [tableWrapper],
          })
        );
      }

      toast({
        title: "Table Imported",
        description: "Markdown table has been imported successfully",
      });

      // Smooth scroll to the newly created table
      setTimeout(() => {
        const editorContent = editorContentRef.current;
        if (editorContent) {
          const lastChild = editorContent.querySelector(
            "[data-editor-content]"
          )?.lastElementChild;
          if (lastChild) {
            lastChild.scrollIntoView({
              behavior: "smooth",
              block: "end",
              inline: "nearest",
            });
          }
        }
      }, 150);
    },
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

  const handleVideoUploadClick = useCallback(
    createHandleImageUploadClick(videoInputRef),
    []
  );

  const handleVideoFileChange = useCallback(
    createHandleFileChange(videoUploadParams),
    [container, dispatch, state.activeNodeId, toast, onUploadImage]
  );

  const handleClearImageSelection = useCallback(
    createHandleClearImageSelection(setSelectedImageIds),
    []
  );

  const handleGroupSelectedImages = useCallback(
    createHandleGroupSelectedImages(
      { container, dispatch, toast },
      selectedImageIds,
      handleClearImageSelection
    ),
    [container, dispatch, toast, selectedImageIds, handleClearImageSelection]
  );

  // Check if selected images are in same flex container
  const flexInfo = React.useMemo(() => {
    if (selectedImageIds.size < 2) {
      return { inSameFlex: false, flexParentId: null };
    }
    return checkImagesInSameFlex(
      { container, dispatch, toast },
      selectedImageIds
    );
  }, [container, selectedImageIds, dispatch, toast]);

  const handleReverseImagesInFlex = useCallback(
    createHandleReverseImagesInFlex(
      { container, dispatch, toast },
      selectedImageIds,
      flexInfo.flexParentId || ""
    ),
    [container, dispatch, toast, selectedImageIds, flexInfo.flexParentId]
  );

  const handleExtractFromFlex = useCallback(
    createHandleExtractFromFlex(
      { container, dispatch, toast },
      selectedImageIds,
      flexInfo.flexParentId || "",
      handleClearImageSelection
    ),
    [
      container,
      dispatch,
      toast,
      selectedImageIds,
      flexInfo.flexParentId,
      handleClearImageSelection,
    ]
  );

  const handleFlexContainerDragOver = useCallback(
    createHandleFlexContainerDragOver({
      container,
      dispatch,
      toast,
      draggingNodeId,
      setDragOverFlexId,
      setFlexDropPosition,
    }),
    [container, dispatch, toast, draggingNodeId]
  );

  const handleFlexContainerDragLeave = useCallback(
    createHandleFlexContainerDragLeave(setDragOverFlexId, setFlexDropPosition),
    []
  );

  const handleFlexContainerDrop = useCallback(
    createHandleFlexContainerDrop({
      container,
      dispatch,
      toast,
      draggingNodeId,
      setDragOverFlexId,
      setFlexDropPosition,
    }),
    [container, dispatch, toast, draggingNodeId]
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

  // Handle paste events for images/videos
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const activeElement = document.activeElement;
      const isInEditor = Array.from(nodeRefs.current.values()).some(
        (el) => el === activeElement || el.contains(activeElement)
      );

      if (!isInEditor || readOnly) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      // Check if any item is an image or video file
      const mediaFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (
          item.kind === "file" &&
          (item.type.startsWith("image/") || item.type.startsWith("video/"))
        ) {
          const file = item.getAsFile();
          if (file) {
            mediaFiles.push(file);
          }
        }
      }

      if (mediaFiles.length === 0) return;

      // Prevent default paste behavior
      e.preventDefault();

      // Upload the files
      setIsUploading(true);

      try {
        const uploadPromises = mediaFiles.map(async (file) => {
          if (onUploadImage) {
            return await onUploadImage(file);
          } else {
            const { uploadImage } = await import("../lib/utils/image-upload");
            const result = await uploadImage(file);
            if (!result.success || !result.url) {
              throw new Error(result.error || "Upload failed");
            }
            return result.url;
          }
        });

        const mediaUrls = await Promise.all(uploadPromises);

        // Create media nodes
        const timestamp = Date.now();
        const mediaNodes: TextNode[] = mediaUrls.map((url, index) => {
          const file = mediaFiles[index];
          const isVideo = file.type.startsWith("video/");

          return {
            id: `${isVideo ? "video" : "img"}-${timestamp}-${index}`,
            type: isVideo ? "video" : "img",
            content: "",
            attributes: {
              src: url,
              alt: file.name,
            },
          };
        });

        // Insert media nodes after current active node
        const targetId =
          state.activeNodeId ||
          container.children[container.children.length - 1]?.id;

        if (mediaFiles.length === 1) {
          // Single media file - insert directly
          if (targetId) {
            dispatch(
              EditorActions.insertNode(mediaNodes[0], targetId, "after")
            );
          }
        } else {
          // Multiple media files - create flex container
          const flexContainer: ContainerNode = {
            id: `flex-container-${timestamp}`,
            type: "container",
            children: mediaNodes,
            attributes: {
              layoutType: "flex",
              gap: "4",
              flexWrap: "wrap",
            },
          };

          if (targetId) {
            dispatch(
              EditorActions.insertNode(flexContainer, targetId, "after")
            );
          }
        }

        const videoCount = mediaFiles.filter((f) =>
          f.type.startsWith("video/")
        ).length;
        const imageCount = mediaFiles.filter((f) =>
          f.type.startsWith("image/")
        ).length;
        let description = "";
        if (videoCount > 0 && imageCount > 0) {
          description = `${imageCount} image(s) and ${videoCount} video(s) pasted successfully.`;
        } else if (videoCount > 0) {
          description = `${videoCount} video(s) pasted successfully.`;
        } else {
          description = `${imageCount} image(s) pasted successfully.`;
        }

        toast({
          title: "Media pasted",
          description,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Paste failed",
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        });
      } finally {
        setIsUploading(false);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [
    readOnly,
    state.activeNodeId,
    container,
    dispatch,
    toast,
    onUploadImage,
    setIsUploading,
  ]);

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

      // Ctrl+Shift+S / Cmd+Shift+S - Toggle Strikethrough
      if (isCtrlOrCmd && e.shiftKey && e.key === "S" && isInEditor) {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          handleFormat("strikethrough");
        }
      }

      // Ctrl+E / Cmd+E - Toggle Code
      if (isCtrlOrCmd && e.key === "e" && isInEditor) {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          handleFormat("code");
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

      // F2 - Trigger re-render (for testing)
      if (e.key === "F2") {
        e.preventDefault();
        const {
          parseDOMToInlineChildren,
        } = require("@/lib/utils/editor-helpers");

        // Test Case 1: Empty bold span (the main issue)
        console.group("🧪 Test 1: Empty bold span");
        const test1 = document.createElement("div");
        test1.innerHTML = 'test <span class="font-bold"></span>';
        const result1 = parseDOMToInlineChildren(test1);
        console.log("Input:", test1.innerHTML);
        console.log("Result:", result1);
        const pass1 = result1.some(
          (child: any) => child.content === "" && child.bold === true
        );
        console.log(pass1 ? "✅ PASS" : "❌ FAIL");
        console.groupEnd();

        // Test Case 2: Empty italic + underline span
        console.group("🧪 Test 2: Empty italic + underline span");
        const test2 = document.createElement("div");
        test2.innerHTML = 'hello <span class="italic underline"></span> world';
        const result2 = parseDOMToInlineChildren(test2);
        console.log("Input:", test2.innerHTML);
        console.log("Result:", result2);
        const pass2 = result2.some(
          (child: any) =>
            child.content === "" &&
            child.italic === true &&
            child.underline === true
        );
        console.log(pass2 ? "✅ PASS" : "❌ FAIL");
        console.groupEnd();

        // Test Case 3: Empty span with custom class
        console.group("🧪 Test 3: Empty span with custom class");
        const test3 = document.createElement("div");
        test3.innerHTML = 'text <span class="text-red-500"></span>';
        const result3 = parseDOMToInlineChildren(test3);
        console.log("Input:", test3.innerHTML);
        console.log("Result:", result3);
        const pass3 = result3.some(
          (child: any) =>
            child.content === "" && child.className === "text-red-500"
        );
        console.log(pass3 ? "✅ PASS" : "❌ FAIL");
        console.groupEnd();

        // Test Case 4: Non-empty span should always be preserved
        console.group("🧪 Test 4: Non-empty span (control test)");
        const test4 = document.createElement("div");
        test4.innerHTML = 'test <span class="font-bold">bold</span>';
        const result4 = parseDOMToInlineChildren(test4);
        console.log("Input:", test4.innerHTML);
        console.log("Result:", result4);
        const pass4 = result4.some(
          (child: any) => child.content === "bold" && child.bold === true
        );
        console.log(pass4 ? "✅ PASS" : "❌ FAIL");
        console.groupEnd();

        // Test Case 5: Multiple formatting on empty span
        console.group("🧪 Test 5: Multiple formatting on empty span");
        const test5 = document.createElement("div");
        test5.innerHTML =
          '<span class="font-bold italic underline line-through"></span>';
        const result5 = parseDOMToInlineChildren(test5);
        console.log("Input:", test5.innerHTML);
        console.log("Result:", result5);
        const pass5 = result5.some(
          (child: any) =>
            child.content === "" &&
            child.bold === true &&
            child.italic === true &&
            child.underline === true &&
            child.strikethrough === true
        );
        console.log(pass5 ? "✅ PASS" : "❌ FAIL");
        console.groupEnd();

        const allPassed = pass1 && pass2 && pass3 && pass4 && pass5;

        if (allPassed) {
          toast({
            title: "✅ All Tests Passed!",
            description:
              "Empty formatted spans are preserved. Focus should remain stable during editing.",
          });
        } else {
          const failed = [];
          if (!pass1) failed.push("Test 1 (empty bold)");
          if (!pass2) failed.push("Test 2 (empty italic+underline)");
          if (!pass3) failed.push("Test 3 (empty custom class)");
          if (!pass4) failed.push("Test 4 (non-empty span)");
          if (!pass5) failed.push("Test 5 (multiple formats)");

          toast({
            variant: "destructive",
            title: "❌ Some Tests Failed",
            description: `Failed: ${failed.join(
              ", "
            )}. Check console for details.`,
          });
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [state.historyIndex, state.history.length, dispatch, toast, handleFormat]);

  return (
    <div className="bg-background transition-colors flex flex-col flex-1 duration-300">
      {/* Editor with integrated toolbar */}
      <div className="mx-auto flex flex-col flex-1 w-full">
        <QuickModeToggle 
          readOnly={readOnly} 
          onReadOnlyChange={setReadOnly}
          notionBased={notionBased}
          onNotionBasedChange={onNotionBasedChange}
        />
        {/* Toolbar - hidden in readOnly mode */}
        {!readOnly && (
          <EditorToolbar
            isUploading={isUploading}
            onImageUploadClick={handleImageUploadClick}
            onMultipleImagesUploadClick={handleMultipleImagesUploadClick}
            onVideoUploadClick={handleVideoUploadClick}
            onCreateList={handleCreateList}
            onCreateTable={() => setTableDialogOpen(true)}
          />
        )}
        <Card className="shadow-2xl relative flex flex-col flex-1 rounded-none border-2 gap-3 transition-all duration-300">
          {/* Table Dialog */}
          <TableDialog
            open={tableDialogOpen}
            onOpenChange={setTableDialogOpen}
            onCreateTable={handleCreateTable}
            onImportMarkdown={handleImportMarkdownTable}
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
            </>
          )}

          {/* Editor Content */}
          <CardContent
            className={`px-0 flex flex-col w-full flex-1 transition-all duration-300 mx-auto ${
              readOnly ? "py-14 md:py-20" : ""
            }`}
          >
            <div ref={editorContentRef}>
              {/* Cover Image - Only in Notion mode */}
              {notionBased && <CoverImage onUploadImage={onUploadImage} readOnly={readOnly} />}

              <div
                data-editor-content
                className={`${
                  notionBased && state.coverImage ? "pt-[350px]" : notionBased ? "pt-[50px]" : "pt-4"
                } transition-all duration-300`}
              >
                {container.children.map((node, index) => {
                  const isText = isTextNode(node);
                  const textNode = isText ? (node as TextNode) : null;

                  // Use stable key based only on node.id to prevent unnecessary remounts
                  // Previously included children.length which caused remounts on every edit
                  const nodeKey = node.id;

                  const isFirstBlock = index === 0;
                  const isSecondBlock = index === 1;

                  return (
                    <div className="mx-auto max-w-6xl w-full" key={nodeKey}>
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
                        ${notionBased && isSecondBlock ? "pt-14" : ""}
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
                          isFirstBlock={isFirstBlock}
                          notionBased={notionBased}
                          hasCoverImage={!!state.coverImage}
                          onUploadCoverImage={onUploadImage}
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

                                // Check if node has inline children
                                const nodeHasChildren =
                                  textNode &&
                                  Array.isArray(textNode.children) &&
                                  textNode.children.length > 0;

                                if (
                                  !isCurrentlyFocused &&
                                  !nodeHasChildren &&
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
                          onCreateTable={handleCreateTableFromCommand}
                          onUploadImage={onUploadImage}
                          selectedImageIds={selectedImageIds}
                          onToggleImageSelection={handleToggleImageSelection}
                          onClickWithModifier={handleClickWithModifier}
                          onFlexContainerDragOver={handleFlexContainerDragOver}
                          onFlexContainerDragLeave={
                            handleFlexContainerDragLeave
                          }
                          onFlexContainerDrop={handleFlexContainerDrop}
                          dragOverFlexId={dragOverFlexId}
                          flexDropPosition={flexDropPosition}
                        />
                      </div>

                      {/* Add block button after each block */}
                      {!readOnly && (
                        <AddBlockButton
                          onAdd={() => handleAddBlock(node.id, "after")}
                          position="after"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selection Toolbar - Floats above selected text (Notion-style) */}
      {/* LinkPopover and CustomClassPopover are now integrated directly into SelectionToolbar */}
      {!readOnly && (
        <SelectionToolbar
          selection={state.currentSelection}
          selectedColor={selectedColor}
          onFormat={handleFormat}
          onTypeChange={(type) => handleTypeChange(type as TextNode["type"])}
          onColorSelect={handleApplyColor}
          onFontSizeSelect={handleApplyFontSize}
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

      {/* Floating Export Button */}
      {!readOnly && (
        <ExportFloatingButton
          container={container}
          onCopyHtml={handleCopyHtml}
          onCopyJson={handleCopyJson}
          copiedHtml={copiedHtml}
          copiedJson={copiedJson}
          enhanceSpaces={enhanceSpaces}
          onEnhanceSpacesChange={setEnhanceSpaces}
        />
      )}

      {/* Template Switcher Button - Bottom Left */}
      {!readOnly && (
        <TemplateSwitcherButton
          currentState={state}
          onTemplateChange={(newState) => {
            dispatch({ type: "SET_STATE", payload: { state: newState } });
          }}
        />
      )}
    </div>
  );
}
