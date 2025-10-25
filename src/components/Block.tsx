/**
 * Block Component - Clean Version
 *
 * Represents a single editable block (paragraph, heading, etc.)
 * Handles its own rendering, editing, and event handling.
 * Supports recursive rendering of nested blocks via ContainerNode.
 *
 * CLEAN VERSION - All handlers extracted to separate modules
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
import { useEditor } from "../lib/context/EditorContext";
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
  getContainerElementType,
  getContainerClasses,
} from "../lib/handlers/block/block-renderer";
import {
  buildBlockClassName,
  buildBlockStyles,
  parseCustomClassName,
} from "../lib/handlers/block/block-styles";

interface BlockProps {
  node: EditorNode;
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
}

export function Block({
  node,
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
}: BlockProps) {
  const localRef = useRef<HTMLElement | null>(null);
  const isComposingRef = useRef(false);
  const shouldPreserveSelectionRef = useRef(false);
  const [isHovering, setIsHovering] = useState(false);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Get editor context for direct state manipulation (needed for table updates)
  const [state, dispatch] = useEditor();

  // Command menu state
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuAnchor, setCommandMenuAnchor] =
    useState<HTMLElement | null>(null);

  // Add block popover state
  const [addBlockPopoverOpen, setAddBlockPopoverOpen] = useState(false);

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
              node={childNode}
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

    case "list-container":
    case "nested-container": {
      const containerNode = node as ContainerNode;
      
      // Determine list type for list containers
      const firstChild = containerNode.children[0];
      const listTypeFromAttribute = containerNode.attributes?.listType as string | undefined;
      const listTypeFromChild =
        firstChild &&
        (firstChild.type === "ul" || firstChild.type === "ol" || firstChild.type === "li")
          ? firstChild.type === "li"
            ? "ul"
            : firstChild.type
          : null;
      const listType = listTypeFromAttribute || listTypeFromChild;
      
      // Determine container element type
      const ContainerElement = getContainerElementType(listType);
      
      // Get container classes
      const isListContainer = renderType === "list-container";
      const containerClasses = getContainerClasses(false, isListContainer, isActive);

      return (
        <ContainerElement
          key={node.id}
          data-node-id={node.id}
          data-node-type="container"
          data-list-type={listType || undefined}
          className={containerClasses}
        >
          {containerNode.children.map((childNode: EditorNode) => {
            const isChildMedia =
              childNode && "type" in childNode && (childNode.type === "img" || childNode.type === "video");

            return (
              <Block
                key={childNode.id}
                node={childNode}
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
              />
            );
          })}
        </ContainerElement>
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

  // Get current container from state (already have dispatch from top of component)
  const currentContainer = state.history[state.historyIndex];

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
      currentContainer,
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
      currentContainer,
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

  const handleBlockDragEndFn = useCallback(createHandleBlockDragEnd(), []);

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

  const isListItem = textNode.type === "li";

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
    className: `
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
          className="relative group"
          onMouseEnter={() => !readOnly && setIsHovering(true)}
          onMouseLeave={() => !readOnly && setIsHovering(false)}
        >
          {/* Drag Handle & Add Button */}
          {!readOnly && onBlockDragStart && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 -ml-[4.5rem] opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
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
                className="p-0.5 cursor-grab active:cursor-grabbing"
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
}
