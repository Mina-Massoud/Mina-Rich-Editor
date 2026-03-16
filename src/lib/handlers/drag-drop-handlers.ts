/**
 * Drag and Drop Handler Functions
 *
 * Factory functions for handling drag and drop operations in the editor.
 * Drop logic is delegated to focused strategy functions in drop-strategies.ts.
 */

import { EditorActions } from '../reducer/actions';
import { ContainerNode, TextNode, isTextNode, isContainerNode } from '../types';
import { findNodeAnywhere } from '../utils/editor-helpers';
import {
  DropContext,
  DropPosition,
  handleFlexReorder,
  handleFlexMerge,
  handleFlexExtract,
  handleRootMove,
  handleFileDrop,
} from './drop-strategies';

/** Parameters shared by drag-and-drop handler factory functions. */
export interface DragDropHandlerParams {
  container: ContainerNode | (() => ContainerNode);
  dispatch: React.Dispatch<any>;
  toast: any;
  draggingNodeId: string | null;
  setDraggingNodeId: (id: string | null) => void;
  setDragOverNodeId: (id: string | null) => void;
  setDropPosition: (pos: "before" | "after" | "left" | "right" | null) => void;
  setIsUploading: (uploading: boolean) => void;
  onUploadImage?: (file: File) => Promise<string>;
}

/** Creates a dragstart handler that records the image node ID as the currently dragged node. */
export function createHandleImageDragStart(setDraggingNodeId: (id: string) => void) {
  return (nodeId: string) => {
    setDraggingNodeId(nodeId);
  };
}

/** Creates a dragstart handler that records the block node ID as the currently dragged node. */
export function createHandleBlockDragStart(setDraggingNodeId: (id: string) => void) {
  return (nodeId: string) => {
    setDraggingNodeId(nodeId);
  };
}

/** Creates a dragenter handler that prevents the default browser behavior to allow custom drop handling. */
export function createHandleDragEnter() {
  return (e: React.DragEvent, _nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
  };
}

/** Creates a dragover handler that calculates and sets the drop position (before/after/left/right) based on cursor location. */
export function createHandleDragOver(params: Omit<DragDropHandlerParams, 'toast' | 'setIsUploading' | 'onUploadImage'>) {
  return (e: React.DragEvent, nodeId: string) => {
    const { container: containerOrGetter, draggingNodeId, setDragOverNodeId, setDropPosition } = params;
    const container = typeof containerOrGetter === 'function' ? containerOrGetter() : containerOrGetter;
    e.preventDefault();
    e.stopPropagation();

    // Don't show drop indicator if we're hovering over the dragged element itself
    if (draggingNodeId === nodeId) {
      e.dataTransfer.dropEffect = "none";
      setDragOverNodeId(null);
      setDropPosition(null);
      return;
    }

    const targetResult = findNodeAnywhere(nodeId, container);
    const draggingResult = draggingNodeId
      ? findNodeAnywhere(draggingNodeId, container)
      : null;

    if (!targetResult) return;

    const targetNode = targetResult.node;
    const draggingNode = draggingResult?.node;
    const isTargetImage =
      isTextNode(targetNode) && (targetNode as TextNode).type === "img";
    const isDraggingImage =
      draggingNode &&
      isTextNode(draggingNode) &&
      (draggingNode as TextNode).type === "img";

    // Check if target and dragging nodes are in the same flex container
    const inSameFlexContainer =
      targetResult.parentId &&
      draggingResult?.parentId &&
      targetResult.parentId === draggingResult.parentId;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    // If both are images, check for horizontal (left/right) drop zones
    if (isTargetImage && isDraggingImage) {
      const edgeThreshold = rect.width * 0.3; // 30% from each edge

      // If in same flex container, allow reordering via horizontal drop
      if (inSameFlexContainer) {
        // Get the parent container to check positions
        const parent = draggingResult?.parentId
          ? (container.children.find(
              (c) => c.id === draggingResult.parentId
            ) as ContainerNode)
          : null;

        if (parent) {
          const dragIndex = parent.children.findIndex(
            (c) => c.id === draggingNodeId
          );
          const targetIndex = parent.children.findIndex((c) => c.id === nodeId);

          // Check if we're on the left edge
          if (e.clientX < rect.left + edgeThreshold) {
            // Prevent dropping to the left of the item immediately to our right
            if (targetIndex === dragIndex + 1) {
              e.dataTransfer.dropEffect = "none";
              setDragOverNodeId(null);
              setDropPosition(null);
              return;
            }
            setDragOverNodeId(nodeId);
            setDropPosition("left");
            e.dataTransfer.dropEffect = "move";
            return;
          }
          // Check if we're on the right edge
          else if (e.clientX > rect.right - edgeThreshold) {
            // Prevent dropping to the right of the item immediately to our left
            if (targetIndex === dragIndex - 1) {
              e.dataTransfer.dropEffect = "none";
              setDragOverNodeId(null);
              setDropPosition(null);
              return;
            }
            setDragOverNodeId(nodeId);
            setDropPosition("right");
            e.dataTransfer.dropEffect = "move";
            return;
          }
        }
        // If we're in the middle of an item in the same flex container, no drop
        e.dataTransfer.dropEffect = "none";
        setDragOverNodeId(null);
        setDropPosition(null);
        return;
      } else {
        // Not in same container - allow horizontal merge
        if (e.clientX < rect.left + edgeThreshold) {
          setDragOverNodeId(nodeId);
          setDropPosition("left");
          e.dataTransfer.dropEffect = "move";
          return;
        } else if (e.clientX > rect.right - edgeThreshold) {
          setDragOverNodeId(nodeId);
          setDropPosition("right");
          e.dataTransfer.dropEffect = "move";
          return;
        }
      }
    }

    // Default vertical drop logic
    const midPoint = rect.top + rect.height / 2;
    const position = e.clientY < midPoint ? "before" : "after";

    // If dragging an existing block, check if this would result in no movement
    if (draggingNodeId) {
      // Find the indices of the dragged node and target node
      const draggedIndex = container.children.findIndex(
        (n) => n.id === draggingNodeId
      );
      const targetIndex = container.children.findIndex((n) => n.id === nodeId);

      // Don't allow drops that would result in no movement
      if (
        (position === "after" && targetIndex === draggedIndex - 1) ||
        (position === "before" && targetIndex === draggedIndex + 1)
      ) {
        e.dataTransfer.dropEffect = "none";
        setDragOverNodeId(null);
        setDropPosition(null);
        return;
      }
    }

    // Allow drop - use "move" for existing blocks, "copy" for external files
    e.dataTransfer.dropEffect = draggingNodeId ? "move" : "copy";

    setDragOverNodeId(nodeId);
    setDropPosition(position);
  };
}

/** Creates a dragleave handler that clears the drop indicator when the pointer leaves the target element. */
export function createHandleDragLeave(setDragOverNodeId: (id: string | null) => void, setDropPosition: (pos: "before" | "after" | "left" | "right" | null) => void) {
  return (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only clear if we're actually leaving the element (not entering a child)
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;

    if (!currentTarget.contains(relatedTarget)) {
      setDragOverNodeId(null);
      setDropPosition(null);
    }
  };
}

/** Creates an async drop handler that delegates to the appropriate drop strategy. */
export function createHandleDrop(params: DragDropHandlerParams, dropPosition: "before" | "after" | "left" | "right" | null) {
  return async (e: React.DragEvent, nodeId: string) => {
    const {
      container: containerOrGetter,
      dispatch,
      toast,
      draggingNodeId,
      setDraggingNodeId,
      setDragOverNodeId,
      setDropPosition,
      setIsUploading,
      onUploadImage,
    } = params;
    const container = typeof containerOrGetter === 'function' ? containerOrGetter() : containerOrGetter;

    e.preventDefault();
    e.stopPropagation();

    const cleanup = () => {
      setDragOverNodeId(null);
      setDropPosition(null);
      setDraggingNodeId(null);
    };

    // If no dragging node, handle as file drop
    if (!draggingNodeId) {
      await handleFileDrop(e, nodeId, {
        dispatch, toast, setIsUploading, onUploadImage, dropPosition, cleanup,
      });
      return;
    }

    // Don't drop on itself
    if (draggingNodeId === nodeId) {
      cleanup();
      return;
    }

    const draggingResult = findNodeAnywhere(draggingNodeId, container);
    const targetResult = findNodeAnywhere(nodeId, container);

    if (!draggingResult || !targetResult) {
      cleanup();
      return;
    }

    const ctx: DropContext = {
      container, dispatch, draggingNodeId,
      draggingResult, targetNodeId: nodeId, targetResult,
      dropPosition: (dropPosition || "after") as DropPosition,
      cleanup,
    };

    const inSameFlexContainer =
      draggingResult.parentId &&
      targetResult.parentId &&
      draggingResult.parentId === targetResult.parentId;

    const isHorizontal = dropPosition === "left" || dropPosition === "right";

    if (isHorizontal) {
      if (inSameFlexContainer && draggingResult.parent && targetResult.parent) {
        handleFlexReorder(ctx);
      } else if (isTextNode(draggingResult.node) && isTextNode(targetResult.node)) {
        handleFlexMerge(ctx);
      } else {
        cleanup();
      }
    } else if (draggingResult.parentId && draggingResult.parent) {
      handleFlexExtract(ctx);
    } else {
      handleRootMove(ctx);
    }
  };
}
