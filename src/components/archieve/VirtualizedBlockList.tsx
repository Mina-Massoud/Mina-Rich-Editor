/**
 * VirtualizedBlockList Component
 * 
 * Wraps the block rendering with TanStack Virtual for performance optimization.
 * Only visible blocks are rendered in the DOM, providing 60FPS scrolling even
 * with thousands of blocks.
 */

"use client";

import React, { useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { EditorNode, TextNode, isTextNode } from "../../lib";
import { Block } from "../Block";
import { AddBlockButton } from "../AddBlockButton";

interface VirtualizedBlockListProps {
  nodes: EditorNode[];
  activeNodeId: string | null;
  coverImage: any;
  notionBased: boolean;
  readOnly: boolean;
  onUploadImage?: (file: File) => Promise<string>;
  CoverImageComponent?: React.ReactNode;
  nodeRefs: React.MutableRefObject<Map<string, HTMLElement>>;
  handleContentChange: (nodeId: string, element: HTMLElement) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLElement>, nodeId: string) => void;
  handleNodeClick: (nodeId: string) => void;
  handleDeleteNode: (nodeId: string) => void;
  handleCreateNested: (nodeId: string) => void;
  handleImageDragStart: (nodeId: string) => void;
  handleBlockDragStart: (nodeId: string) => void;
  handleChangeBlockType: (nodeId: string, type: string) => void;
  handleInsertImageFromCommand: (nodeId: string) => void;
  handleCreateListFromCommand: (nodeId: string, type: string) => void;
  handleCreateTableFromCommand: (nodeId: string) => void;
  selectedImageIds: Set<string>;
  handleToggleImageSelection: (nodeId: string) => void;
  handleClickWithModifier: (e: React.MouseEvent, nodeId: string) => void;
  handleFlexContainerDragOver: (e: React.DragEvent, flexId: string, position: "left" | "right" | null) => void;
  handleFlexContainerDragLeave: (e: React.DragEvent) => void;
  handleFlexContainerDrop: (e: React.DragEvent, flexId: string, position: "left" | "right" | null) => void;
  dragOverFlexId: string | null;
  flexDropPosition: "left" | "right" | null;
  setDragOverNodeId: (nodeId: string | null) => void;
  setDropPosition: (position: "before" | "after" | "left" | "right" | null) => void;
  draggingNodeId: string | null;
  setDraggingNodeId: (nodeId: string | null) => void;
  handleAddBlock: (nodeId: string, position: "before" | "after") => void;
  handleDragEnter: (e: React.DragEvent, nodeId: string) => void;
  handleDragOver: (e: React.DragEvent, nodeId: string) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, nodeId: string) => void;
  dragOverNodeId: string | null;
  dropPosition: "before" | "after" | "left" | "right" | null;
}

export function VirtualizedBlockList({
  nodes,
  activeNodeId,
  coverImage,
  notionBased,
  readOnly,
  onUploadImage,
  CoverImageComponent,
  nodeRefs,
  handleContentChange,
  handleKeyDown,
  handleNodeClick,
  handleDeleteNode,
  handleCreateNested,
  handleImageDragStart,
  handleBlockDragStart,
  handleChangeBlockType,
  handleInsertImageFromCommand,
  handleCreateListFromCommand,
  handleCreateTableFromCommand,
  selectedImageIds,
  handleToggleImageSelection,
  handleClickWithModifier,
  handleFlexContainerDragOver,
  handleFlexContainerDragLeave,
  handleFlexContainerDrop,
  dragOverFlexId,
  flexDropPosition,
  setDragOverNodeId,
  setDropPosition,
  draggingNodeId,
  setDraggingNodeId,
  handleAddBlock,
  handleDragEnter,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  dragOverNodeId,
  dropPosition,
}: VirtualizedBlockListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Filter out free-positioned images (they're rendered separately)
  const renderableNodes = nodes.filter((node) => {
    const textNode = isTextNode(node) ? (node as TextNode) : null;
    return !(
      textNode &&
      textNode.type === "img" &&
      textNode.attributes?.isFreePositioned
    );
  });

  // Setup virtualizer with dynamic measurement
  const rowVirtualizer = useVirtualizer({
    count: renderableNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      // Better estimation based on node type and content
      const node = renderableNodes[index];
      const textNode = isTextNode(node) ? (node as TextNode) : null;
      
      if (!textNode) return 200; // Containers/tables default
      
      // Calculate estimated height based on content length and type
      const contentLength = textNode.content?.length || 0;
      const hasChildren = textNode.children && textNode.children.length > 0;
      
      switch (textNode.type) {
        case "h1": return 100;
        case "h2": return 80;
        case "h3": return 70;
        case "img": return 500; // Increased for high-res images
        case "video": return 500;
        case "code": {
          // Estimate code block height based on content
          const lines = (textNode.content?.split('\n').length || 1);
          return Math.max(150, lines * 24 + 60); // ~24px per line + padding
        }
        case "blockquote": return Math.max(80, contentLength / 2);
        case "li": return hasChildren ? 100 : 50;
        default: {
          // For paragraphs, estimate based on content length
          // Assume ~80 characters per line at typical width
          const estimatedLines = Math.max(1, Math.ceil(contentLength / 80));
          return Math.max(40, estimatedLines * 24 + 20); // ~24px per line + padding
        }
      }
    },
    overscan: 10, // Increased overscan for smoother scrolling with dynamic content
    // Enable dynamic measurement with ResizeObserver
    measureElement:
      typeof window !== "undefined" && "ResizeObserver" in window
        ? (element) => {
            // Measure actual height including all content
            const height = element?.getBoundingClientRect().height;
            return height || 40; // Fallback to minimum height
          }
        : undefined,
    // Enable scroll margin for better UX
    scrollMargin: 0,
    // Adjust to changes in lane count
    lanes: 1,
  });

  return (
    <div
      ref={parentRef}
      className="transition-all duration-300 overflow-auto"
      style={{
        height: "calc(100vh - var(--toolbar-height, 0px))", // Full viewport height minus toolbar
        contain: "strict", // Performance optimization
      }}
    >
      {/* Cover Image - Part of the scrollable content */}
      {notionBased && CoverImageComponent && (
        <div className="relative">
          {CoverImageComponent}
        </div>
      )}
      
      {/* Content with proper padding */}
      <div
        className={`${
          notionBased && coverImage
            ? "pt-[420px]" // Overlap with cover image for Notion effect
            : notionBased
            ? "pt-[50px]"
            : "pt-4"
        } px-10 relative z-10`}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const node = renderableNodes[virtualItem.index];
          const index = virtualItem.index;
          const isFirstBlock = index === 0;
          const nodeKey = node.id;

          const isText = isTextNode(node);
          const textNode = isText ? (node as TextNode) : null;

          return (
            <div
              key={nodeKey}
              data-index={virtualItem.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="mx-auto max-w-6xl w-full">
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
                    nodeId={node.id}
                    isActive={activeNodeId === node.id}
                    isFirstBlock={isFirstBlock}
                    notionBased={notionBased}
                    hasCoverImage={!!coverImage}
                    onUploadCoverImage={onUploadImage}
                    nodeRef={(el) => {
                      if (el) {
                        const elementNodeId = el.getAttribute("data-node-id");
                        if (elementNodeId) {
                          nodeRefs.current.set(elementNodeId, el);
                        }

                        if (textNode && elementNodeId === node.id) {
                          const isCurrentlyFocused = document.activeElement === el;
                          const selection = window.getSelection();

                          const hasActiveSelection =
                            selection &&
                            selection.rangeCount > 0 &&
                            !selection.isCollapsed;

                          let selectionInThisElement = false;
                          if (hasActiveSelection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            selectionInThisElement = el.contains(
                              range.commonAncestorContainer
                            );
                          }

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
                    onInput={(element) => handleContentChange(node.id, element)}
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
                    onFlexContainerDragLeave={handleFlexContainerDragLeave}
                    onFlexContainerDrop={handleFlexContainerDrop}
                    dragOverFlexId={dragOverFlexId}
                    flexDropPosition={flexDropPosition}
                    onSetDragOverNodeId={setDragOverNodeId}
                    onSetDropPosition={setDropPosition}
                    draggingNodeId={draggingNodeId}
                    onSetDraggingNodeId={setDraggingNodeId}
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
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

