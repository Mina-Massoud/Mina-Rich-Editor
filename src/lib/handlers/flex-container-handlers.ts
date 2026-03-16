/**
 * Flex Container Drag-and-Drop Handlers
 *
 * Handles drag and drop operations for flex containers
 */

import { EditorActions } from '../reducer/actions';
import { ContainerNode, TextNode, isTextNode } from '../types';
import { findNodeAnywhere } from '../utils/editor-helpers';

export interface FlexContainerHandlerParams {
  container: ContainerNode;
  dispatch: React.Dispatch<any>;
  draggingNodeId: string | null;
  setDragOverFlexId: (id: string | null) => void;
  setFlexDropPosition: (pos: "left" | "right" | null) => void;
}

/**
 * Handle drag over on flex container edges
 */
export function createHandleFlexContainerDragOver(params: FlexContainerHandlerParams) {
  return (e: React.DragEvent, flexContainerId: string, position: "left" | "right" | null) => {
    const { container, draggingNodeId, setDragOverFlexId, setFlexDropPosition } = params;

    e.preventDefault();
    e.stopPropagation();

    // Only proceed if we have a dragging node from state
    if (!draggingNodeId) {
      return;
    }

    // Find the dragging node
    const draggingResult = findNodeAnywhere(draggingNodeId, container);

    if (!draggingResult || !isTextNode(draggingResult.node)) {
      // Not a valid node to drag
      setDragOverFlexId(null);
      setFlexDropPosition(null);
      return;
    }

    const draggingNode = draggingResult.node as TextNode;

    // Only allow image nodes
    if (draggingNode.type !== 'img') {
      setDragOverFlexId(null);
      setFlexDropPosition(null);
      return;
    }

    // Check if we're in the edge zones
    if (position) {
      setDragOverFlexId(flexContainerId);
      setFlexDropPosition(position);
      e.dataTransfer.dropEffect = "move";
    } else {
      setDragOverFlexId(null);
      setFlexDropPosition(null);
    }
  };
}

/**
 * Handle drag leave on flex container
 */
export function createHandleFlexContainerDragLeave(
  setDragOverFlexId: (id: string | null) => void,
  setFlexDropPosition: (pos: "left" | "right" | null) => void
) {
  return (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDragOverFlexId(null);
    setFlexDropPosition(null);
  };
}

/**
 * Handle drop on flex container edges
 */
export function createHandleFlexContainerDrop(params: FlexContainerHandlerParams) {
  return (e: React.DragEvent, flexContainerId: string, position: "left" | "right" | null) => {
    const {
      container,
      dispatch,
      draggingNodeId,
      setDragOverFlexId,
      setFlexDropPosition,
    } = params;

    e.preventDefault();
    e.stopPropagation();

    if (!position || !draggingNodeId) {
      setDragOverFlexId(null);
      setFlexDropPosition(null);
      return;
    }

    // Find the dragging node and the flex container
    const draggingResult = findNodeAnywhere(draggingNodeId, container);
    const flexResult = findNodeAnywhere(flexContainerId, container);

    if (!draggingResult || !flexResult) {
      setDragOverFlexId(null);
      setFlexDropPosition(null);
      return;
    }

    const draggingNode = draggingResult.node as TextNode;
    const flexContainer = flexResult.node as ContainerNode;

    // Only handle image nodes
    if (draggingNode.type !== 'img') {
      setDragOverFlexId(null);
      setFlexDropPosition(null);
      return;
    }

    // Check if the dragging node is already in this flex container
    const isInSameContainer = draggingResult.parentId === flexContainerId;

    if (isInSameContainer) {
      // Reordering within the same flex container
      const currentIndex = flexContainer.children.findIndex(c => c.id === draggingNodeId);
      const newChildren = [...flexContainer.children];

      // Remove from current position
      const [movedNode] = newChildren.splice(currentIndex, 1);

      // Insert at new position
      if (position === "left") {
        newChildren.unshift(movedNode);
      } else {
        newChildren.push(movedNode);
      }

      dispatch(EditorActions.updateNode(flexContainerId, {
        children: newChildren as any,
      }));
    } else {
      // Adding image from outside to the flex container
      const newChildren = [...flexContainer.children];

      if (position === "left") {
        newChildren.unshift(draggingNode);
      } else {
        newChildren.push(draggingNode);
      }

      dispatch(
        EditorActions.batch([
          EditorActions.deleteNode(draggingNodeId),
          EditorActions.updateNode(flexContainerId, {
            children: newChildren as any,
          }),
        ])
      );
    }

    setDragOverFlexId(null);
    setFlexDropPosition(null);
  };
}
