/**
 * BlockZustand Component - Optimized Version
 *
 * Uses Zustand for state management to prevent unnecessary re-renders.
 * Only re-renders when THIS specific block's data changes.
 *
 * Key optimization: Receives nodeId instead of full node object
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

// Import Zustand hooks
import {
  useZustandNode,
  useZustandIsNodeActive,
  useZustandDispatch,
} from "../lib/store/editor-store";

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

interface BlockZustandProps {
  nodeId: string; // Only pass the ID!
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

export function BlockZustand({
  nodeId,
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
}: BlockZustandProps) {
  // 🎯 KEY OPTIMIZATION: Fetch node data using Zustand selector
  // This component will ONLY re-render when THIS specific node changes!
  const node = useZustandNode(nodeId);
  const isActive = useZustandIsNodeActive(nodeId);
  const dispatch = useZustandDispatch();

  // Add render tracking for debugging
  const renderCountRef = useRef(0);
  const prevNodeRef = useRef(node);
  
  renderCountRef.current += 1;
  
  // Log what changed to cause re-render
  if (prevNodeRef.current !== node) {
    console.log(`🔄 [BlockZustand ${nodeId.substring(0, 8)}] Render #${renderCountRef.current} - NODE CHANGED`, {
      prevNode: prevNodeRef.current,
      newNode: node,
      sameReference: prevNodeRef.current === node
    });
    prevNodeRef.current = node;
  } else {
    console.log(`⚠️ [BlockZustand ${nodeId.substring(0, 8)}] Render #${renderCountRef.current} - NODE SAME BUT RE-RENDERED!`);
  }

  const localRef = useRef<HTMLElement | null>(null);
  const isComposingRef = useRef(false);
  const shouldPreserveSelectionRef = useRef(false);
  const [isHovering, setIsHovering] = useState(false);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Command menu state
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuAnchor, setCommandMenuAnchor] =
    useState<HTMLElement | null>(null);

  // Add block popover state
  const [addBlockPopoverOpen, setAddBlockPopoverOpen] = useState(false);

  // Touch/drag state for mobile
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isDraggingTouch, setIsDraggingTouch] = useState(false);

  // If node not found, return null
  if (!node) {
    console.warn(`⚠️ [BlockZustand] Node not found: ${nodeId}`);
    return null;
  }

  // Determine how to render this node
  const renderType = getNodeRenderType(node);

  // For now, just render a simple version to test
  // We'll add full implementation later
  return (
    <div
      data-node-id={nodeId}
      className={`block-wrapper ${isActive ? 'active' : ''}`}
      style={{
        padding: '8px',
        margin: '4px 0',
        border: isActive ? '2px solid blue' : '1px solid #ddd',
        borderRadius: '4px',
        background: isActive ? '#f0f8ff' : 'transparent',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">ID: {nodeId.substring(0, 8)}</span>
        <span className="text-xs text-gray-400">Type: {node.type}</span>
        <span className="text-xs text-gray-400">Renders: {renderCountRef.current}</span>
      </div>
      <div
        ref={(el) => {
          localRef.current = el;
          nodeRef(el);
        }}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={(e) => onInput(e.currentTarget)}
        onKeyDown={onKeyDown}
        onClick={onClick}
        data-node-id={nodeId}
        className="content-editable"
      >
        {'content' in node ? node.content : `[Container: ${node.children?.length || 0} children]`}
      </div>
    </div>
  );
}

