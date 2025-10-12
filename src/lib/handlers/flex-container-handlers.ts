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
  toast: any;
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

    // Check if we're dragging something
    const draggedNodeId = e.dataTransfer.getData("text/plain");
    if (!draggedNodeId && !draggingNodeId) {
      return;
    }

    const actualDraggingId = draggingNodeId || draggedNodeId;
    
    // Find the dragging node
    const draggingResult = actualDraggingId ? findNodeAnywhere(actualDraggingId, container) : null;
    
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
      toast, 
      draggingNodeId,
      setDragOverFlexId,
      setFlexDropPosition,
    } = params;
    
    e.preventDefault();
    e.stopPropagation();

    console.log('🎯 Flex Container Drop');
    console.log('  Flex Container ID:', flexContainerId);
    console.log('  Drop Position:', position);
    console.log('  Dragging Node ID:', draggingNodeId);

    if (!position || !draggingNodeId) {
      setDragOverFlexId(null);
      setFlexDropPosition(null);
      return;
    }

    // Find the dragging node and the flex container
    const draggingResult = findNodeAnywhere(draggingNodeId, container);
    const flexResult = findNodeAnywhere(flexContainerId, container);

    if (!draggingResult || !flexResult) {
      console.log('  ❌ Could not find nodes');
      setDragOverFlexId(null);
      setFlexDropPosition(null);
      return;
    }

    const draggingNode = draggingResult.node as TextNode;
    const flexContainer = flexResult.node as ContainerNode;

    // Only handle image nodes
    if (draggingNode.type !== 'img') {
      console.log('  ❌ Not an image node');
      setDragOverFlexId(null);
      setFlexDropPosition(null);
      return;
    }

    // Check if the dragging node is already in this flex container
    const isInSameContainer = draggingResult.parentId === flexContainerId;

    console.log('  Is in same container:', isInSameContainer);

    if (isInSameContainer) {
      // Case 1: Reordering within the same flex container
      console.log('  📝 Reordering within same container');
      
      const currentIndex = flexContainer.children.findIndex(c => c.id === draggingNodeId);
      const newChildren = [...flexContainer.children];
      
      // Remove from current position
      const [movedNode] = newChildren.splice(currentIndex, 1);
      
      // Insert at new position
      if (position === "left") {
        newChildren.unshift(movedNode);
        console.log('  Moving to start');
      } else {
        newChildren.push(movedNode);
        console.log('  Moving to end');
      }
      
      dispatch(EditorActions.updateNode(flexContainerId, {
        children: newChildren as any,
      }));
      
      toast({
        title: "Image repositioned!",
        description: "Image moved within the flex container",
      });
    } else {
      // Case 2: Adding image from outside to the flex container
      console.log('  ➕ Adding image to container');
      
      const newChildren = [...flexContainer.children];
      
      if (position === "left") {
        newChildren.unshift(draggingNode);
        console.log('  Adding to start');
      } else {
        newChildren.push(draggingNode);
        console.log('  Adding to end');
      }
      
      // Batch: delete from old location and update container
      const actions = [
        EditorActions.deleteNode(draggingNodeId),
        EditorActions.updateNode(flexContainerId, {
          children: newChildren as any,
        }),
      ];
      
      dispatch(EditorActions.batch(actions));
      
      toast({
        title: "Image added!",
        description: "Image added to the flex container",
      });
    }

    setDragOverFlexId(null);
    setFlexDropPosition(null);
  };
}

