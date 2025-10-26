/**
 * Block Component - Zustand Version
 *
 * Represents a single editable block (paragraph, heading, etc.)
 * Handles its own rendering, editing, and event handling.
 * Supports recursive rendering of nested blocks via ContainerNode.
 *
 * ZUSTAND VERSION - Uses selective subscriptions for optimal performance
 */

"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  TextNode,
  EditorNode,
  isContainerNode,
  ContainerNode,
  getNodeTextContent,
} from "../lib";
import { ImageBlock } from "./ImageBlock";
import { VideoBlock } from "./VideoBlock";
import { CommandMenu } from "./CommandMenu";
import { 
  useBlockNode, 
  useIsNodeActive, 
  useEditorDispatch, 
  useEditorStore
} from "../lib/store/editor-store";
import { GripVertical, Plus } from "lucide-react";
import { BlockContextMenu } from "./BlockContextMenu";
import { FlexContainer } from "./FlexContainer";
import { TableBuilder } from "./TableBuilder";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { ELEMENT_OPTIONS } from "@/lib/elements";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  List,
  ListOrdered,
  ImageIcon,
} from "lucide-react";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Quote,
  List,
  ListOrdered,
};

// Import all block handlers and utilities
import {
  buildHTML,
  saveSelection,
  restoreSelection,
  createHandleCompositionStart,
  createHandleCompositionEnd,
  createHandleInput,
  createHandleKeyDown,
  createHandleClick,
  createHandleCommandSelect,
  createHandleBackgroundColorChange,
  createHandleBlockDragStart,
  createHandleBlockDragEnd,
  getTypeClassName,
} from "../lib/handlers/block";
import {
  getNodeRenderType,
  getElementType,
  getContainerClasses,
} from "../lib/handlers/block/block-renderer";
import {
  buildBlockClassName,
  buildBlockStyles,
  parseCustomClassName,
} from "../lib/handlers/block/block-styles";

interface BlockProps {
  nodeId: string; // Changed: pass ID instead of full node to prevent re-renders
  isActive: boolean;
  nodeRef: (el: HTMLElement | null) => void;
  onInput: (element: HTMLElement) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
  onClick: () => void;
  onDelete?: (nodeId?: string) => void;
  onCreateNested?: (nodeId: string) => void;
  depth?: number;
  readOnly?: boolean;
  onImageDragStart?: (nodeId: string) => void;
  onChangeBlockType?: (nodeId: string, newType: string) => void;
  onInsertImage?: (nodeId: string) => void;
  onCreateList?: (nodeId: string, listType: string) => void;
  onCreateTable?: (nodeId: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  onBlockDragStart?: (nodeId: string) => void;
  selectedImageIds?: Set<string>;
  onToggleImageSelection?: (nodeId: string) => void;
  onClickWithModifier?: (e: React.MouseEvent, nodeId: string) => void;
  onFlexContainerDragOver?: (e: React.DragEvent, flexId: string, position: "left" | "right" | null) => void;
  onFlexContainerDragLeave?: (e: React.DragEvent) => void;
  onFlexContainerDrop?: (e: React.DragEvent, flexId: string, position: "left" | "right" | null) => void;
  dragOverFlexId?: string | null;
  flexDropPosition?: "left" | "right" | null;
  isFirstBlock?: boolean;
  notionBased?: boolean;
  hasCoverImage?: boolean;
  onUploadCoverImage?: (file: File) => Promise<string>;
  onSetDragOverNodeId?: (nodeId: string | null) => void;
  onSetDropPosition?: (position: "before" | "after" | "left" | "right" | null) => void;
  draggingNodeId?: string | null;
  onSetDraggingNodeId?: (nodeId: string | null) => void;
}

// Cache for tracking node changes across renders
const nodeCache = new Map<string, EditorNode>();

export const Block = React.memo(function Block({
  nodeId,
  isActive,
  nodeRef,
  onInput,
  onKeyDown,
  onClick,
  onDelete,
  onCreateNested,
  depth = 0,
  readOnly = false,
  onImageDragStart,
  onChangeBlockType,
  onInsertImage,
  onCreateList,
  onCreateTable,
  onUploadImage,
  onBlockDragStart,
  selectedImageIds,
  onToggleImageSelection,
  onClickWithModifier,
  onFlexContainerDragOver,
  onFlexContainerDragLeave,
  onFlexContainerDrop,
  dragOverFlexId,
  flexDropPosition,
  isFirstBlock = false,
  notionBased = true,
  hasCoverImage = false,
  onUploadCoverImage,
  onSetDragOverNodeId,
  onSetDropPosition,
  draggingNodeId,
  onSetDraggingNodeId,
}: BlockProps) {
  // ✅ OPTIMIZATION: Subscribe to ONLY this node's data
  // Thanks to structural sharing, this only causes re-render when THIS node changes
  const node = useBlockNode(nodeId);
  
  // If node not found, return null (shouldn't happen but safe guard)
  if (!node) {
    console.warn(`Block: Node ${nodeId} not found`);
    return null;
  }

  const localRef = useRef<HTMLElement | null>(null);
  const isComposingRef = useRef(false);
  const shouldPreserveSelectionRef = useRef(false);
  const [isHovering, setIsHovering] = useState(false);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // DEV: Track renders to verify optimization
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔄testBlock ${nodeId} render #${renderCountRef.current}`);
  }
  
  // ZUSTAND: Get dispatch function (never changes, no re-renders)
  const dispatch = useEditorDispatch();


  // Command menu state
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuAnchor, setCommandMenuAnchor] =
    useState<HTMLElement | null>(null);

  // Add block popover state
  const [addBlockPopoverOpen, setAddBlockPopoverOpen] = useState(false);

  // Touch/drag state for mobile
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isDraggingTouch, setIsDraggingTouch] = useState(false);

  // Determine how to render this node
  const renderType = getNodeRenderType(node);

  // Handle container nodes (recursive rendering)
  switch (renderType) {
    case "table": {
      const containerNode = node as ContainerNode;
      return (
        <TableBuilder
          key={node.id}
          node={containerNode}
          onUpdate={(id, updates) => {
            if (dispatch) {
              dispatch({
                type: "UPDATE_NODE",
                payload: { id, updates },
              });
            }
          }}
          readOnly={readOnly}
          onBlockDragStart={onBlockDragStart}
          onDelete={onDelete}
        />
      );
    }

    case "flex": {
      const containerNode = node as ContainerNode;
      return (
        <FlexContainer
          key={node.id}
          node={containerNode}
          onDragOver={(e, position) => {
            if (onFlexContainerDragOver) {
              onFlexContainerDragOver(e, node.id, position);
            }
          }}
          onDragLeave={onFlexContainerDragLeave}
          onDrop={(e, position) => {
            if (onFlexContainerDrop) {
              onFlexContainerDrop(e, node.id, position);
            }
          }}
          dragOverPosition={dragOverFlexId === node.id ? flexDropPosition : null}
        >
        {containerNode.children.map((childNode) => {
          const isChildMedia =
            childNode && "type" in childNode && (childNode.type === "img" || childNode.type === "video");

          const blockContent = (
            <Block
              key={childNode.id}
              nodeId={childNode.id}
              isActive={isActive}
              nodeRef={nodeRef}
              onInput={onInput}
              onKeyDown={(e) => {
                onKeyDown(e);
              }}
              onClick={onClick}
              onDelete={
                isChildMedia && onDelete
                  ? () => onDelete(childNode.id)
                  : undefined
              }
              onCreateNested={onCreateNested}
              depth={depth + 1}
              readOnly={readOnly}
              onImageDragStart={onImageDragStart}
              onChangeBlockType={onChangeBlockType}
              onInsertImage={onInsertImage}
              onCreateList={onCreateList}
              onCreateTable={onCreateTable}
              onUploadImage={onUploadImage}
              selectedImageIds={selectedImageIds}
              onToggleImageSelection={onToggleImageSelection}
              onClickWithModifier={onClickWithModifier}
              onFlexContainerDragOver={onFlexContainerDragOver}
              onFlexContainerDragLeave={onFlexContainerDragLeave}
              onFlexContainerDrop={onFlexContainerDrop}
              dragOverFlexId={dragOverFlexId}
              flexDropPosition={flexDropPosition}
              onSetDragOverNodeId={onSetDragOverNodeId}
              onSetDropPosition={onSetDropPosition}
              draggingNodeId={draggingNodeId}
              onSetDraggingNodeId={onSetDraggingNodeId}
            />
          );

          // Wrap in flex item div
          return (
            <div
              key={childNode.id}
              className="flex-1 min-w-[280px] max-w-full"
            >
              {blockContent}
            </div>
          );
        })}
        </FlexContainer>
      );
    }

    case "nested-container": {
      const containerNode = node as ContainerNode;
      
      // Get container classes
      const containerClasses = getContainerClasses(false, isActive);

      return (
        <div
          key={node.id}
          data-node-id={node.id}
          data-node-type="container"
          className={containerClasses}
        >
          {containerNode.children.map((childNode: EditorNode) => {
            const isChildMedia =
              childNode && "type" in childNode && (childNode.type === "img" || childNode.type === "video");

            return (
              <Block
                key={childNode.id}
                nodeId={childNode.id}
                isActive={isActive}
                nodeRef={nodeRef}
                onInput={onInput}
                onKeyDown={(e) => {
                  onKeyDown(e);
                }}
                onClick={onClick}
                onDelete={
                  isChildMedia && onDelete
                    ? () => onDelete(childNode.id)
                    : undefined
                }
                onCreateNested={onCreateNested}
                depth={depth + 1}
                readOnly={readOnly}
                onImageDragStart={onImageDragStart}
                onChangeBlockType={onChangeBlockType}
                onInsertImage={onInsertImage}
                onCreateList={onCreateList}
                onCreateTable={onCreateTable}
                onUploadImage={onUploadImage}
                selectedImageIds={selectedImageIds}
                onToggleImageSelection={onToggleImageSelection}
                onClickWithModifier={onClickWithModifier}
                onFlexContainerDragOver={onFlexContainerDragOver}
                onFlexContainerDragLeave={onFlexContainerDragLeave}
                onFlexContainerDrop={onFlexContainerDrop}
                dragOverFlexId={dragOverFlexId}
                flexDropPosition={flexDropPosition}
                onSetDragOverNodeId={onSetDragOverNodeId}
                onSetDropPosition={onSetDropPosition}
                draggingNodeId={draggingNodeId}
                onSetDraggingNodeId={onSetDraggingNodeId}
              />
            );
          })}
        </div>
      );
    }
  }

  // Cast to TextNode for remaining cases
  const textNode = node as TextNode;

  // BR elements render as empty space
  if (textNode.type === "br") {
    return (
      <div
        key={textNode.id}
        data-node-id={textNode.id}
        className="h-6"
        onClick={onClick}
      />
    );
  }

  // Image nodes render as ImageBlock
  if (textNode.type === "img") {
    return (
      <ImageBlock
        node={textNode}
        isActive={isActive}
        onClick={onClick}
        onDelete={onDelete}
        onDragStart={onImageDragStart}
        isSelected={selectedImageIds?.has(textNode.id)}
        onToggleSelection={onToggleImageSelection}
        onClickWithModifier={onClickWithModifier}
      />
    );
  }

  // Video nodes render as VideoBlock
  if (textNode.type === "video") {
    return (
      <VideoBlock
        node={textNode}
        isActive={isActive}
        onClick={onClick}
        onDelete={onDelete}
        onDragStart={onImageDragStart}
        isSelected={selectedImageIds?.has(textNode.id)}
        onToggleSelection={onToggleImageSelection}
        onClickWithModifier={onClickWithModifier}
      />
    );
  }

  // Build HTML callback
  const memoizedBuildHTML = useCallback(() => {
    return buildHTML(textNode, readOnly);
  }, [textNode, readOnly]);

  // Save selection callback
  const memoizedSaveSelection = useCallback(() => {
    return saveSelection(localRef);
  }, []);

  // Restore selection callback
  const memoizedRestoreSelection = useCallback(
    (
      savedSelection: { start: number; end: number; collapsed: boolean } | null
    ) => {
      restoreSelection(localRef, savedSelection);
    },
    []
  );

  // Update content when needed
  useEffect(() => {
    if (!localRef.current) return;

    if (isComposingRef.current || shouldPreserveSelectionRef.current) {
      return;
    }

    const element = localRef.current;
    const newHTML = memoizedBuildHTML();

    if (element.innerHTML !== newHTML) {
      const hadFocus = document.activeElement === element;
      const savedSelectionData = hadFocus ? memoizedSaveSelection() : null;

      element.innerHTML = newHTML;

      if (hadFocus && savedSelectionData) {
        memoizedRestoreSelection(savedSelectionData);
      }
    }
  }, [memoizedBuildHTML, memoizedSaveSelection, memoizedRestoreSelection]);

  // Create all handlers
  const handleCompositionStart = useCallback(
    createHandleCompositionStart()(isComposingRef),
    []
  );

  const handleCompositionEnd = useCallback(
    createHandleCompositionEnd()(isComposingRef),
    []
  );

  const handleInput = useCallback(
    createHandleInput({
      textNode,
      readOnly,
      onInput,
      onChangeBlockType,
      showCommandMenu,
      setShowCommandMenu,
      setCommandMenuAnchor,
      shouldPreserveSelectionRef,
    }),
    [textNode, readOnly, onInput, onChangeBlockType, showCommandMenu]
  );

  const handleKeyDown = useCallback(
    createHandleKeyDown({
      textNode,
      readOnly,
      onInput,
      onKeyDown,
      onClick,
      onCreateNested,
      onChangeBlockType,
      onInsertImage,
      onCreateList,
      // ✅ Pass getter function - only called when needed, doesn't cause re-renders
      currentContainer: () => useEditorStore.getState().history[useEditorStore.getState().historyIndex],
      dispatch,
      localRef,
      isComposingRef,
      shouldPreserveSelectionRef,
      showCommandMenu,
      setShowCommandMenu,
      setCommandMenuAnchor,
    }),
    [
      textNode,
      readOnly,
      onKeyDown,
      onCreateNested,
      showCommandMenu,
      dispatch,
    ]
  );

  const handleClick = useCallback(createHandleClick({ readOnly, onClick }), [
    readOnly,
    onClick,
  ]);

  const handleCommandSelect = useCallback(
    createHandleCommandSelect({
      textNode,
      onChangeBlockType,
      onInsertImage,
      onCreateList,
      onCreateTable,
      localRef,
      setShowCommandMenu,
      setCommandMenuAnchor,
    }),
    [textNode, onChangeBlockType, onInsertImage, onCreateList, onCreateTable]
  );

  const handleBackgroundColorChange = useCallback(
    createHandleBackgroundColorChange(textNode, dispatch),
    [textNode, dispatch]
  );

  const handleBlockDragStartFn = useCallback(
    createHandleBlockDragStart(textNode, onBlockDragStart),
    [textNode, onBlockDragStart]
  );

  const handleBlockDragEndFn = useCallback(
    createHandleBlockDragEnd(() => {
      // Clear all drag states when drag ends (including cancelled drags)
      if (onSetDragOverNodeId && onSetDropPosition && onSetDraggingNodeId) {
        onSetDragOverNodeId(null);
        onSetDropPosition(null);
        onSetDraggingNodeId(null);
      }
    }),
    [onSetDragOverNodeId, onSetDropPosition, onSetDraggingNodeId]
  );

  // Touch handlers for mobile drag support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Prevent default to stop scrolling
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsDraggingTouch(true);
    
    // Trigger drag start
    if (onBlockDragStart && textNode?.id) {
      onBlockDragStart(textNode.id);
    }
  }, [onBlockDragStart, textNode?.id]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !isDraggingTouch) return;
    
    // Prevent default scrolling while dragging
    e.preventDefault();
    e.stopPropagation();
    
    // Highlight the drop target using the same state as desktop
    const touch = e.touches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetBlock = elementBelow?.closest('[data-node-id]');
    
    if (targetBlock && onSetDragOverNodeId && onSetDropPosition) {
      const targetId = targetBlock.getAttribute('data-node-id');
      if (targetId && targetId !== textNode?.id) {
        onSetDragOverNodeId(targetId);
        onSetDropPosition('after'); // Default to after position on mobile
      } else {
        onSetDragOverNodeId(null);
        onSetDropPosition(null);
      }
    }
  }, [isDraggingTouch, textNode?.id, onSetDragOverNodeId, onSetDropPosition]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Find the closest block node
    const targetBlock = elementBelow?.closest('[data-node-id]');
    if (targetBlock && textNode?.id) {
      const targetId = targetBlock.getAttribute('data-node-id');
      if (targetId && targetId !== textNode.id && dispatch) {
        // Move the block
        dispatch({
          type: "MOVE_NODE",
          payload: {
            nodeId: textNode.id,
            targetId,
            position: "after",
          },
        });
      }
    }
    
    // Clean up
    touchStartRef.current = null;
    setIsDraggingTouch(false);
    
    // Clear drop indicators using the same state as desktop
    if (onSetDragOverNodeId && onSetDropPosition) {
      onSetDragOverNodeId(null);
      onSetDropPosition(null);
    }
  }, [textNode?.id, dispatch, onSetDragOverNodeId, onSetDropPosition]);

  const handleTouchCancel = useCallback(() => {
    // Clean up on touch cancel (e.g., user scrolled or drag was interrupted)
    touchStartRef.current = null;
    setIsDraggingTouch(false);
    
    // Clear drop indicators
    if (onSetDragOverNodeId && onSetDropPosition) {
      onSetDragOverNodeId(null);
      onSetDropPosition(null);
    }
  }, [onSetDragOverNodeId, onSetDropPosition]);

  // Handle cover image upload
  const handleCoverImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadCoverImage) return;

    setIsUploadingCover(true);
    try {
      const url = await onUploadCoverImage(file);
      const { EditorActions } = await import("../lib/reducer/actions");
      dispatch(EditorActions.setCoverImage({
        url,
        alt: file.name,
        position: 50,
      }));
    } catch (error) {
      console.error("Failed to upload cover image:", error);
    } finally {
      setIsUploadingCover(false);
      // Reset input value so the same file can be selected again
      if (coverImageInputRef.current) {
        coverImageInputRef.current.value = '';
      }
    }
  }, [onUploadCoverImage, dispatch]);

  // Check if block is empty
  const textContent = getNodeTextContent(textNode);
  const isEmpty = !textContent || textContent.trim() === "";
  
  // Get placeholder from attributes
  const placeholder = textNode.attributes?.placeholder as string | undefined;
  
  // Determine if this is a header block (h1) - headers don't show command menu
  const isHeaderBlock = textNode.type === 'h1';
  
  // Show command menu placeholder only if no custom placeholder is set and not a header block
  const showCommandPlaceholder = isEmpty && isActive && !readOnly && onChangeBlockType && !placeholder && !isHeaderBlock;

  // Determine which HTML element to render based on type
  const ElementType =
    textNode.type === "li"
      ? "li"
      : textNode.type === "ol"
      ? "ol"
      : textNode.type === "h1"
      ? "h1"
      : textNode.type === "h2"
      ? "h2"
      : textNode.type === "h3"
      ? "h3"
      : textNode.type === "h4"
      ? "h4"
      : textNode.type === "h5"
      ? "h5"
      : textNode.type === "h6"
      ? "h6"
      : textNode.type === "p"
      ? "p"
      : textNode.type === "blockquote"
      ? "blockquote"
      : textNode.type === "code"
      ? "pre"
      : "div";

  const isListItem = textNode.type === "li" || textNode.type === "ol";

  // Get custom class from attributes
  const customClassName = textNode.attributes?.className || "";
  const isHexColor =
    typeof customClassName === "string" && customClassName.startsWith("#");
  const textColor = isHexColor ? customClassName : "";
  const className = isHexColor ? "" : customClassName;

  // Get background color from attributes
  const backgroundColor = textNode.attributes?.backgroundColor as
    | string
    | undefined;

  // Common props for all elements
  const commonProps = {
    key: textNode.id,
    "data-node-id": textNode.id,
    "data-node-type": textNode.type,
    "data-show-command-placeholder": showCommandPlaceholder ? "true" : undefined,
    contentEditable: !readOnly,
    suppressContentEditableWarning: true,
    ...(placeholder ? { placeholder } : {}),
    className: `!ml-5
      ${isListItem ? "relative" : ""} 
      ${getTypeClassName(textNode.type)}
      ${className}
      ${readOnly ? "" : "outline-none"}
      ${isListItem ? "px-3 py-0.5 mb-1" : textNode.type.startsWith('h') ? "px-3 py-2 mb-2" : "px-3 py-1.5 mb-2"}
      ${notionBased && isFirstBlock && textNode.type === 'h1' ? "mt-8 pb-4" : ""}
      transition-all
      ${!readOnly && isActive ? "border-b bg-accent/5" : ""}
      ${!readOnly ? "hover:bg-accent/5" : ""}
      ${readOnly ? "cursor-default" : ""}
    `,
    style: {
      marginLeft: isListItem ? `${depth * 0.5 + 1.5}rem` : `${depth * 0.5}rem`,
      ...(textColor ? { color: textColor as string } : {}),
      ...(backgroundColor ? { backgroundColor: backgroundColor } : {}),
    },
    spellCheck: false,
  };

  return (
    <>
      <BlockContextMenu
        readOnly={readOnly}
        onBackgroundColorChange={handleBackgroundColorChange}
        currentBackgroundColor={backgroundColor}
      >
        <div
          className={`relative group transition-all ${
            (isDraggingTouch || (draggingNodeId === textNode?.id)) 
              ? 'opacity-50 scale-95' 
              : ''
          }`}
          onMouseEnter={() => !readOnly && setIsHovering(true)}
          onMouseLeave={() => !readOnly && setIsHovering(false)}
          style={{
            borderTop: '2px solid transparent',
            borderBottom: '2px solid transparent',
          }}
        >
          {/* Drag Handle & Add Button - Mobile: inline, Desktop: absolute positioned */}
          {!readOnly && onBlockDragStart && (
            <div className="flex md:absolute items-center gap-0.5 mb-1 md:mb-0 md:left-0 md:top-1/2 md:-translate-y-1/2 md:-ml-[4.5rem] md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
              {/* Add Cover Button - Only show on first block in Notion mode if no cover */}
              {notionBased && isFirstBlock && !hasCoverImage && onUploadCoverImage && (
                <>
                  <input
                    ref={coverImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverImageUpload}
                  />
                  <button
                    className="p-0.5 rounded hover:bg-accent transition-colors duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      coverImageInputRef.current?.click();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    disabled={isUploadingCover}
                    title="Add Cover"
                  >
                    {isUploadingCover ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                    ) : (
                      <ImageIcon
                        className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors duration-200"
                        strokeWidth={1.5}
                      />
                    )}
                  </button>
                </>
              )}

              {/* Add Block Button */}
              <Popover open={addBlockPopoverOpen} onOpenChange={setAddBlockPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="p-0.5 rounded hover:bg-accent transition-colors duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Plus
                      className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors duration-200"
                      strokeWidth={1.5}
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="flex flex-col gap-1">
                    {ELEMENT_OPTIONS.map((element) => {
                      const IconComponent = element.icon ? iconMap[element.icon] : null;
                      return (
                        <Button
                          key={element.value}
                          variant="ghost"
                          size="sm"
                          className="justify-start gap-2"
                          onClick={() => {
                            dispatch({
                              type: "INSERT_NODE",
                              payload: {
                                node: {
                                  id: `${element.value}-${Date.now()}`,
                                  type: element.value as TextNode["type"],
                                  content: "",
                                },
                                targetId: textNode.id,
                                position: "after",
                              },
                            });
                            setAddBlockPopoverOpen(false);
                          }}
                        >
                          {IconComponent && (
                            <IconComponent className={element.iconSize || "h-4 w-4"} />
                          )}
                          <span>{element.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Drag Handle */}
              <div
                draggable
                onDragStart={handleBlockDragStartFn}
                onDragEnd={handleBlockDragEndFn}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}
                className={`p-0.5 cursor-grab active:cursor-grabbing ${isDraggingTouch ? 'opacity-50' : ''}`}
                style={{ touchAction: 'none' }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <GripVertical
                  className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  strokeWidth={1.5}
                />
              </div>
            </div>
          )}

          <ElementType
            {...commonProps}
            key={textNode.id}
            ref={(el: HTMLElement | null) => {
              localRef.current = el;
              nodeRef(el);
            }}
            onInput={readOnly ? undefined : (e) => handleInput(e as any)}
            onKeyDown={readOnly ? undefined : (e) => handleKeyDown(e as any)}
            onClick={(e) => handleClick(e as any)}
            onCompositionStart={readOnly ? undefined : handleCompositionStart}
            onCompositionEnd={readOnly ? undefined : handleCompositionEnd}
          />
        </div>
      </BlockContextMenu>

      {/* Command Menu */}
      {!readOnly && (
        <CommandMenu
          isOpen={showCommandMenu}
          onClose={() => setShowCommandMenu(false)}
          onSelect={handleCommandSelect}
          anchorElement={commandMenuAnchor}
          nodeId={textNode.id}
          onUploadImage={onUploadImage}
        />
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Return true if props are equal (component should NOT re-render)
  // Return false if props are different (component SHOULD re-render)
  
  // IMPORTANT: We must check if node content changed, because if memo returns true,
  // the component body never executes, so useBlockNode() never runs, and content
  // changes would never be detected!
  
  const DEBUG = process.env.NODE_ENV === 'development';
  
  // Check if the node ID changed (critical prop)
  if (prevProps.nodeId !== nextProps.nodeId) {
    if (DEBUG) console.log(`🔄 Block ${prevProps.nodeId} → nodeId changed:`, prevProps.nodeId, '→', nextProps.nodeId);
    return false;
  }
  
  // Get the current node from store to check if its content changed
  const { useEditorStore } = require('../lib/store/editor-store');
  const store = useEditorStore.getState();
  const currentNode = store.getNode(nextProps.nodeId);
  
  // Check if node reference changed (thanks to Zustand structural sharing)
  const cachedNode = nodeCache.get(nextProps.nodeId);
  
  // Update cache with current node for next comparison
  nodeCache.set(nextProps.nodeId, currentNode);
  
  // If node reference changed, content must have changed
  // This is the KEY optimization - structural sharing ensures same reference = same data
  if (cachedNode !== undefined && cachedNode !== currentNode) {
    if (DEBUG) {
      console.log(`🔄 Block ${nextProps.nodeId} → node data changed in store`);
      console.log('  Previous node:', cachedNode);
      console.log('  Current node:', currentNode);
    }
    return false;
  }
  
  // Check if active state changed
  if (prevProps.isActive !== nextProps.isActive) {
    if (DEBUG) console.log(`🔄 Block ${prevProps.nodeId} → isActive changed:`, prevProps.isActive, '→', nextProps.isActive);
    return false;
  }
  
  // Check if read-only state changed
  if (prevProps.readOnly !== nextProps.readOnly) {
    if (DEBUG) console.log(`🔄 Block ${prevProps.nodeId} → readOnly changed:`, prevProps.readOnly, '→', nextProps.readOnly);
    return false;
  }
  
  // Check if depth changed
  if (prevProps.depth !== nextProps.depth) {
    if (DEBUG) console.log(`🔄 Block ${prevProps.nodeId} → depth changed:`, prevProps.depth, '→', nextProps.depth);
    return false;
  }
  
  // Check if drag-related props changed
  if (prevProps.draggingNodeId !== nextProps.draggingNodeId) {
    if (DEBUG) console.log(`🔄 Block ${prevProps.nodeId} → draggingNodeId changed:`, prevProps.draggingNodeId, '→', nextProps.draggingNodeId);
    return false;
  }
  if (prevProps.dragOverFlexId !== nextProps.dragOverFlexId) {
    if (DEBUG) console.log(`🔄 Block ${prevProps.nodeId} → dragOverFlexId changed:`, prevProps.dragOverFlexId, '→', nextProps.dragOverFlexId);
    return false;
  }
  if (prevProps.flexDropPosition !== nextProps.flexDropPosition) {
    if (DEBUG) console.log(`🔄 Block ${prevProps.nodeId} → flexDropPosition changed:`, prevProps.flexDropPosition, '→', nextProps.flexDropPosition);
    return false;
  }
  
  // Check if first block status changed
  if (prevProps.isFirstBlock !== nextProps.isFirstBlock) {
    if (DEBUG) console.log(`🔄 Block ${prevProps.nodeId} → isFirstBlock changed:`, prevProps.isFirstBlock, '→', nextProps.isFirstBlock);
    return false;
  }
  if (prevProps.notionBased !== nextProps.notionBased) {
    if (DEBUG) console.log(`🔄 Block ${prevProps.nodeId} → notionBased changed:`, prevProps.notionBased, '→', nextProps.notionBased);
    return false;
  }
  if (prevProps.hasCoverImage !== nextProps.hasCoverImage) {
    if (DEBUG) console.log(`🔄 Block ${prevProps.nodeId} → hasCoverImage changed:`, prevProps.hasCoverImage, '→', nextProps.hasCoverImage);
    return false;
  }
  
  // Check if selectedImageIds set changed
  if (prevProps.selectedImageIds !== nextProps.selectedImageIds) {
    // Deep comparison for Set
    if (prevProps.selectedImageIds?.size !== nextProps.selectedImageIds?.size) {
      if (DEBUG) console.log(`🔄 Block ${prevProps.nodeId} → selectedImageIds size changed:`, prevProps.selectedImageIds?.size, '→', nextProps.selectedImageIds?.size);
      return false;
    }
    if (prevProps.selectedImageIds && nextProps.selectedImageIds) {
      for (const id of prevProps.selectedImageIds) {
        if (!nextProps.selectedImageIds.has(id)) {
          if (DEBUG) console.log(`🔄 Block ${prevProps.nodeId} → selectedImageIds content changed`);
          return false;
        }
      }
    }
  }
  
  // All callback functions are stable references from parent, no need to compare
  // The node data itself is fetched via useBlockNode(nodeId) inside the component
  // so changes to the node will be detected via Zustand subscriptions
  
  if (DEBUG) console.log(`✅ Block ${prevProps.nodeId} → memo skipped re-render (props unchanged)`);
  return true; // Props are equal, skip re-render
});
