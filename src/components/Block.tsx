/**
 * Block Component - Zustand Version
 *
 * Represents a single editable block (paragraph, heading, etc.)
 * Handles its own rendering, editing, and event handling.
 * Supports recursive rendering of nested blocks via ContainerNode.
 *
 * ZUSTAND VERSION - Uses selective subscriptions for optimal performance
 * CONTEXT VERSION - Reads stable editor-wide values from EditorContext
 *                   instead of receiving them as props, eliminating 30+
 *                   props and simplifying the memo comparator to 4 fields.
 */

"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { WrapText, ArrowRightLeft } from "lucide-react";
import {
  TextNode,
  getNodeTextContent,
} from "../lib";
import { ImageBlock } from "./ImageBlock";
import { VideoBlock } from "./VideoBlock";
import { CommandMenu } from "./CommandMenu";
import {
  useBlockNode,
  useEditorDispatch,
  useContainerGetter,
} from "../lib/store/editor-store";
import { BlockContextMenu } from "./BlockContextMenu";
import { BlockContainer } from "./BlockContainer";
import { BlockDragHandle } from "./BlockDragHandle";
import { useEditorContext } from "../hooks/useEditorContext";

// Import all block handlers and utilities
import {
  buildHTML,
  createHandleCompositionStart,
  createHandleCompositionEnd,
  createHandleInput,
  createHandleKeyDown,
  createHandleClick,
  createHandleCommandSelect,
  createHandleBackgroundColorChange,
  getTypeClassName,
} from "../lib/handlers/block";
import { getCharacterOffset, restoreCursorByOffset } from "../lib/utils/dom-reconciler";
import { getNodeRenderType } from "../lib/handlers/block/block-renderer";

/**
 * BlockProps — only block-specific values.
 * All stable editor-wide callbacks now live in EditorContext.
 */
export interface BlockProps {
  nodeId: string;
  isActive: boolean;
  isFirstBlock?: boolean;
  depth?: number;
}


export const Block = React.memo(function Block({
  nodeId,
  isActive,
  isFirstBlock = false,
  depth = 0,
}: BlockProps) {
  // ✅ OPTIMIZATION: Subscribe to ONLY this node's data.
  // Thanks to structural sharing, this only causes a re-render when THIS node changes.
  const node = useBlockNode(nodeId);

  // Determine how to render this node EARLY - before any conditional returns
  const renderType = node ? getNodeRenderType(node) : null;

  // If node not found, return null (shouldn't happen but safe guard)
  if (!node) {
    return null;
  }

  // Read all stable editor-wide values from context.
  // These never trigger a re-render of Block because the memo comparator
  // does not compare them — they are intentionally excluded from props.
  const {
    readOnly,
    notionBased,
    onUploadImage,
    onUploadVideo,
    onInput: ctxOnInput,
    onKeyDown: ctxOnKeyDown,
    onNodeClick,
    onDeleteNode,
    onCreateNested,
    onChangeBlockType,
    onInsertImage,
    onCreateList,
    onCreateTable,
    selectedImageIds,
    onToggleImageSelection,
    onClickWithModifier,
    onBlockDragStart,
    onImageDragStart,
    onSetDragOverNodeId,
    onSetDropPosition,
    onSetDraggingNodeId,
    registerNodeRef,
    hasCoverImage,
    onUploadCoverImage,
    onAISelect: ctxOnAISelect,
  } = useEditorContext();

  // Handle container nodes (recursive rendering) — delegate to BlockContainer
  if (
    renderType === "table" ||
    renderType === "flex" ||
    renderType === "nested-container"
  ) {
    return (
      <BlockContainer
        node={node}
        renderType={renderType}
        BlockComponent={Block}
        depth={depth}
        isActive={isActive}
      />
    );
  }

  // Cast to TextNode for remaining cases
  const textNode = node as TextNode;

  const localRef = useRef<HTMLElement | null>(null);
  const isComposingRef = useRef(false);
  const shouldPreserveSelectionRef = useRef(false);

  // ZUSTAND: Get dispatch function (never changes, no re-renders)
  const dispatch = useEditorDispatch();

  // ZUSTAND: Stable getter for the current container (avoids re-renders)
  const getContainer = useContainerGetter();

  // Command menu state
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuAnchor, setCommandMenuAnchor] =
    useState<HTMLElement | null>(null);

  // Bind context callbacks to this block's nodeId so the internal handlers
  // keep the same (element) / (e) signature they expect.
  const onInput = useCallback(
    (element: HTMLElement) => ctxOnInput(nodeId, element),
    [ctxOnInput, nodeId]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => ctxOnKeyDown(e, nodeId),
    [ctxOnKeyDown, nodeId]
  );

  const onClick = useCallback(
    () => onNodeClick(nodeId),
    [onNodeClick, nodeId]
  );

  const onDelete = useCallback(
    (id?: string) => onDeleteNode(id ?? nodeId),
    [onDeleteNode, nodeId]
  );

  // Build HTML callback (declare this hook for ALL render paths to maintain hook order)
  const memoizedBuildHTML = useCallback(() => {
    return buildHTML(textNode, readOnly);
  }, [textNode, readOnly]);

  // Update content when needed
  useEffect(() => {
    if (!localRef.current) return;
    if (isComposingRef.current || shouldPreserveSelectionRef.current) return;

    const element = localRef.current;
    const newHTML = memoizedBuildHTML();

    if (element.innerHTML !== newHTML) {
      const hadFocus = document.activeElement === element;
      let charOffset = -1;
      if (hadFocus) {
        charOffset = getCharacterOffset(element);
      }
      element.innerHTML = newHTML;
      if (hadFocus && charOffset >= 0) {
        try { restoreCursorByOffset(element, charOffset); } catch {}
      }
    }
  }, [memoizedBuildHTML]);

  // Create all handlers
  const handleCompositionStart = useCallback(
    createHandleCompositionStart()(isComposingRef),
    []
  );

  const handleCompositionEnd = useCallback(
    createHandleCompositionEnd()(isComposingRef, onInput, localRef),
    [onInput]
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
      dispatch,
    }),
    [textNode, readOnly, onInput, onChangeBlockType, showCommandMenu, dispatch]
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
      currentContainer: getContainer,
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

  // Code block word-wrap toggle
  const isCodeBlock = textNode.type === 'code';
  const wordWrap = textNode.attributes?.wordWrap !== false; // default: wrapped
  const handleToggleWrap = useCallback(() => {
    dispatch({
      type: 'UPDATE_NODE',
      payload: {
        id: textNode.id,
        updates: { attributes: { ...textNode.attributes, wordWrap: !wordWrap } } as any,
      },
    });
  }, [dispatch, textNode.id, textNode.attributes, wordWrap]);

  // Check if block is empty
  const textContent = getNodeTextContent(textNode);
  const isEmpty = !textContent || textContent.trim() === "";

  // Get placeholder from attributes
  const placeholder = textNode.attributes?.placeholder as string | undefined;

  // Show command menu placeholder only if no custom placeholder is set
  const showCommandPlaceholder = isEmpty && isActive && !readOnly && !placeholder;

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

  // ⚠️ IMPORTANT: Handle special block types AFTER all hooks are declared
  // This ensures React's Rules of Hooks are followed (hooks must be called in the same order every render)

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

  // Human-readable block type label for screen readers
  const blockTypeLabel: Record<string, string> = {
    p: "paragraph",
    h1: "heading 1",
    h2: "heading 2",
    h3: "heading 3",
    h4: "heading 4",
    h5: "heading 5",
    h6: "heading 6",
    blockquote: "blockquote",
    code: "code",
    li: "list item",
    ol: "ordered list",
    br: "line break",
  };
  const blockAriaLabel = `${blockTypeLabel[textNode.type] ?? textNode.type} block`;

  // Common props for all elements
  const commonProps = {
    key: textNode.id,
    "data-node-id": textNode.id,
    "data-node-type": textNode.type,
    "data-show-command-placeholder": showCommandPlaceholder ? "true" : undefined,
    contentEditable: !readOnly,
    suppressContentEditableWarning: true,
    "aria-label": blockAriaLabel,
    ...(placeholder ? { placeholder } : {}),
    className: `lg:!ml-5
      ${isListItem ? "relative" : ""}
      ${getTypeClassName(textNode.type)}
      ${isCodeBlock && !wordWrap ? "!whitespace-pre !overflow-x-auto !break-normal" : ""}
      ${className}
      ${readOnly ? "" : "outline-none"}
      ${isListItem ? "px-3 py-0.5 mb-1" : textNode.type.startsWith('h') ? "px-3 py-2 mb-2" : "px-3 py-1.5 mb-2"}
      ${notionBased && isFirstBlock && textNode.type === 'h1' ? "lg:mt-8 pb-4" : ""}
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
          className={`relative group transition-all flex flex-col gap-3`}
          style={{
            borderTop: '2px solid transparent',
            borderBottom: '2px solid transparent',
          }}
        >
          {/* Drag Handle & Add Button */}
          {!readOnly && onBlockDragStart && (
            <BlockDragHandle
              textNode={textNode}
              isFirstBlock={isFirstBlock}
              notionBased={notionBased}
              hasCoverImage={hasCoverImage}
              onUploadCoverImage={onUploadCoverImage}
              onBlockDragStart={onBlockDragStart}
              onSetDragOverNodeId={onSetDragOverNodeId}
              onSetDropPosition={onSetDropPosition}
              onSetDraggingNodeId={onSetDraggingNodeId}
            />
          )}

          {/* Code block word-wrap toggle */}
          {isCodeBlock && !readOnly && (
            <button
              type="button"
              onClick={handleToggleWrap}
              className="absolute top-2 right-2 z-10 p-1 rounded bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              title={wordWrap ? 'Disable word wrap' : 'Enable word wrap'}
              aria-label={wordWrap ? 'Disable word wrap' : 'Enable word wrap'}
            >
              {wordWrap ? <ArrowRightLeft className="w-3.5 h-3.5" /> : <WrapText className="w-3.5 h-3.5" />}
            </button>
          )}

          <ElementType
            {...commonProps}
            key={textNode.id}
            ref={(el: HTMLElement | null) => {
              localRef.current = el;
              // Register this element with the editor's nodeRefs map.
              // Use the data-node-id attribute as the key (handles container
              // children whose id may differ from the top-level nodeId).
              if (el) {
                const elementNodeId = el.getAttribute("data-node-id");
                if (elementNodeId) {
                  registerNodeRef(elementNodeId, el);
                }
              } else {
                registerNodeRef(nodeId, null);
              }
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
          onUploadVideo={onUploadVideo}
          onAISelect={ctxOnAISelect ? () => ctxOnAISelect(nodeId) : undefined}
        />
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo.
  // Returns true if props are equal (skip re-render), false if different (re-render).
  //
  // All stable editor-wide values are now in context (not props), so we only
  // need to compare the 4 block-specific props here.
  // Node content changes are handled by useBlockNode() subscribing to the
  // store internally.

  if (prevProps.nodeId !== nextProps.nodeId) return false;
  if (prevProps.isActive !== nextProps.isActive) return false;
  if (prevProps.isFirstBlock !== nextProps.isFirstBlock) return false;
  if (prevProps.depth !== nextProps.depth) return false;

  return true;
});
