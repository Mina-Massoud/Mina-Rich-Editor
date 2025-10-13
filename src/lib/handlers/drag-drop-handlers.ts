/**
 * Drag and Drop Handler Functions
 * 
 * Functions for handling drag and drop operations in the editor
 */

import { EditorActions } from '../reducer/actions';
import { ContainerNode, TextNode, isTextNode, isContainerNode, EditorNode } from '../types';
import { uploadImage } from '../utils/image-upload';
import { findNodeAnywhere } from '../utils/editor-helpers';

export interface DragDropHandlerParams {
  container: ContainerNode;
  dispatch: React.Dispatch<any>;
  toast: any;
  draggingNodeId: string | null;
  setDraggingNodeId: (id: string | null) => void;
  setDragOverNodeId: (id: string | null) => void;
  setDropPosition: (pos: "before" | "after" | "left" | "right" | null) => void;
  setIsUploading: (uploading: boolean) => void;
  onUploadImage?: (file: File) => Promise<string>;
}

/**
 * Handle image drag start
 */
export function createHandleImageDragStart(setDraggingNodeId: (id: string) => void) {
  return (nodeId: string) => {
    setDraggingNodeId(nodeId);
  };
}

/**
 * Handle block drag start
 */
export function createHandleBlockDragStart(setDraggingNodeId: (id: string) => void) {
  return (nodeId: string) => {
    setDraggingNodeId(nodeId);
  };
}

/**
 * Handle drag enter
 */
export function createHandleDragEnter() {
  return (e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
  };
}

/**
 * Handle drag over
 */
export function createHandleDragOver(params: Omit<DragDropHandlerParams, 'toast' | 'setIsUploading' | 'onUploadImage'>) {
  return (e: React.DragEvent, nodeId: string) => {
    const { container, draggingNodeId, setDragOverNodeId, setDropPosition } = params;
    e.preventDefault();
    e.stopPropagation();

    // Check if we're dragging an existing block (image) or files from outside
    const draggedNodeId = e.dataTransfer.getData("text/plain");

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

      // Don't allow drops that would result in no movement:
      // - Dropping "after" on the previous block (would stay in same position)
      // - Dropping "before" on the next block (would stay in same position)
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

    // Allow drop - this is required for drop to work
    // Use "move" for existing blocks, "copy" for external files
    e.dataTransfer.dropEffect =
      draggedNodeId || draggingNodeId ? "move" : "copy";

    setDragOverNodeId(nodeId);
    setDropPosition(position);
  };
}

/**
 * Handle drag leave
 */
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

/**
 * Handle drop - This is a complex function that handles multiple drop scenarios
 * Note: This function should be further broken down in the future
 */
export function createHandleDrop(params: DragDropHandlerParams, dropPosition: "before" | "after" | "left" | "right" | null) {
  return async (e: React.DragEvent, nodeId: string) => {
    const { 
      container, 
      dispatch, 
      toast, 
      draggingNodeId, 
      setDraggingNodeId, 
      setDragOverNodeId, 
      setDropPosition,
      setIsUploading,
      onUploadImage
    } = params;
    
    e.preventDefault();
    e.stopPropagation();

    // Check if we're moving an existing image block
    const draggedNodeId = e.dataTransfer.getData("text/plain");

    if (draggedNodeId && draggingNodeId) {
      // Moving an existing image

      // Don't drop on itself
      if (draggingNodeId === nodeId) {
        setDragOverNodeId(null);
        setDropPosition(null);
        setDraggingNodeId(null);
        return;
      }

      const draggingResult = findNodeAnywhere(draggingNodeId, container);
      const targetResult = findNodeAnywhere(nodeId, container);

      if (!draggingResult || !targetResult) {
        setDragOverNodeId(null);
        setDropPosition(null);
        setDraggingNodeId(null);
        return;
      }

      const draggingNode = draggingResult.node;
      const targetNode = targetResult.node;
      const inSameFlexContainer =
        draggingResult.parentId &&
        targetResult.parentId &&
        draggingResult.parentId === targetResult.parentId;

      // Check if this is a horizontal drop (left/right)
      if (dropPosition === "left" || dropPosition === "right") {
        // Case 1: Reordering images within the same flex container
        if (
          inSameFlexContainer &&
          draggingResult.parent &&
          targetResult.parent
        ) {
          const parent = draggingResult.parent;
          const newChildren = [...parent.children];

          const dragIndex = newChildren.findIndex(
            (c) => c.id === draggingNodeId
          );
          const targetIndex = newChildren.findIndex((c) => c.id === nodeId);

          // Remove the dragged item from its current position
          const [draggedItem] = newChildren.splice(dragIndex, 1);

          // Calculate the new target index after removal
          const adjustedTargetIndex =
            dragIndex < targetIndex ? targetIndex - 1 : targetIndex;

          // Insert at the correct position based on drop side
          if (dropPosition === "left") {
            newChildren.splice(adjustedTargetIndex, 0, draggedItem);
          } else {
            // "right"
            newChildren.splice(adjustedTargetIndex + 1, 0, draggedItem);
          }

          // Update the container with new order (single action for history)
          dispatch(
            EditorActions.updateNode(parent.id, {
              children: newChildren as any,
            })
          );

          toast({
            title: "Image repositioned!",
            description: "Image order updated in flex layout",
          });

          setDragOverNodeId(null);
          setDropPosition(null);
          setDraggingNodeId(null);
          return;
        }

        // Case 2: Merging two separate images into a flex container (or adding to existing one)
        if (isTextNode(draggingNode) && isTextNode(targetNode)) {

          // If one of them is already in a flex container, add the dragged one to it
          if (
            draggingResult.parentId &&
            draggingResult.parent?.attributes?.layoutType === "flex"
          ) {
            // Dragging node is in a flex container, extract it and merge with target
          } else if (
            targetResult.parentId &&
            targetResult.parent?.attributes?.layoutType === "flex"
          ) {
            // Target is in flex container, add dragged node to it
            const parent = targetResult.parent;
            const targetIndex = parent.children.findIndex(
              (c) => c.id === nodeId
            );
            const newChildren = [...parent.children];

            // Insert dragged node at the appropriate position
            if (dropPosition === "left") {
              newChildren.splice(targetIndex, 0, draggingNode as TextNode);
            } else {
              newChildren.splice(targetIndex + 1, 0, draggingNode as TextNode);
            }

            // Batch: delete from old location and update container (single history entry)
            dispatch(
              EditorActions.batch([
                EditorActions.deleteNode(draggingNodeId),
                EditorActions.updateNode(parent.id, {
                  children: newChildren as any,
                }),
              ])
            );

            toast({
              title: "Image added!",
              description: "Image added to the flex layout",
            });

            setDragOverNodeId(null);
            setDropPosition(null);
            setDraggingNodeId(null);
            return;
          }

          // Neither is in a flex container - create a new one

          // Find reference nodes at root level
          const targetRootIndex = container.children.findIndex(
            (n) =>
              n.id === nodeId ||
              (isContainerNode(n) &&
                (n as ContainerNode).children.some((c) => c.id === nodeId))
          );
          const draggingRootIndex = container.children.findIndex(
            (n) =>
              n.id === draggingNodeId ||
              (isContainerNode(n) &&
                (n as ContainerNode).children.some(
                  (c) => c.id === draggingNodeId
                ))
          );

          // Find a stable reference node for insertion
          let referenceNodeId: string | null = null;
          let insertPosition: "before" | "after" = "after";

          const firstIndex = Math.min(targetRootIndex, draggingRootIndex);
          if (firstIndex > 0) {
            referenceNodeId = container.children[firstIndex - 1].id;
            insertPosition = "after";
          } else if (container.children.length > 2) {
            for (let i = 0; i < container.children.length; i++) {
              if (i !== targetRootIndex && i !== draggingRootIndex) {
                referenceNodeId = container.children[i].id;
                insertPosition = i < firstIndex ? "after" : "before";
                break;
              }
            }
          }

          // Create a flex container with both images
          const timestamp = Date.now();
          const flexContainer: ContainerNode = {
            id: `flex-container-${timestamp}`,
            type: "container",
            children:
              dropPosition === "left"
                ? [draggingNode as TextNode, targetNode as TextNode]
                : [targetNode as TextNode, draggingNode as TextNode],
            attributes: {
              layoutType: "flex",
              gap: "4",
            },
          };

          // Batch: delete both images and insert flex container (single history entry)
          const actions: any[] = [
            EditorActions.deleteNode(draggingNodeId),
            EditorActions.deleteNode(nodeId),
          ];

          if (referenceNodeId) {
            actions.push(
              EditorActions.insertNode(
                flexContainer,
                referenceNodeId,
                insertPosition
              )
            );
          } else {
            actions.push(
              EditorActions.replaceContainer({
                ...container,
                children: [flexContainer],
              })
            );
          }

          dispatch(EditorActions.batch(actions));

          toast({
            title: "Images merged!",
            description: "Images placed side by side in a flex layout",
          });

          setDragOverNodeId(null);
          setDropPosition(null);
          setDraggingNodeId(null);
          return;
        }
      }

      // Vertical drop - extract from container or move at root level

      // If the dragging node is in a flex container, we need to extract it
      if (draggingResult.parentId && draggingResult.parent) {
        console.log('🔍 DEBUG: Extracting from flex container');
        console.log('  Dragging node ID:', draggingNodeId);
        console.log('  Target node ID:', nodeId);
        console.log('  Drop position:', dropPosition);
        console.log('  Parent container ID:', draggingResult.parentId);
        
        const parent = draggingResult.parent;
        const remainingChildren = parent.children.filter(
          (c) => c.id !== draggingNodeId
        );
        
        console.log('  Parent children count:', parent.children.length);
        console.log('  Remaining children count:', remainingChildren.length);
        
        const insertPos =
          dropPosition === "before" || dropPosition === "after"
            ? dropPosition
            : "after";

        // Batch all actions for single history entry
        const actions: any[] = [];

        // If only one child remains, unwrap the container
        if (remainingChildren.length === 1) {
          console.log('  ⚠️ Only 1 child remaining - unwrapping container');
          // Find where to insert the remaining child
          const parentIndex = container.children.findIndex(
            (c) => c.id === parent.id
          );
          
          console.log('  Parent index in container:', parentIndex);
          console.log('  Container children count:', container.children.length);
          
          // Check if target is the flex container itself
          const isTargetTheFlexContainer = nodeId === parent.id;
          console.log('  Is target the flex container?', isTargetTheFlexContainer);
          
          if (isTargetTheFlexContainer) {
            // We're trying to drop on the flex container itself
            // We need to find a better reference point
            let referenceNodeId: string | null = null;
            let referencePosition: "before" | "after" = insertPos === "before" ? "before" : "after";
            
            if (parentIndex > 0) {
              // Use the previous sibling
              referenceNodeId = container.children[parentIndex - 1].id;
              referencePosition = "after";
            } else if (parentIndex < container.children.length - 1) {
              // Use the next sibling
              referenceNodeId = container.children[parentIndex + 1].id;
              referencePosition = "before";
            }
            
            if (referenceNodeId) {
              console.log('  Using alternative reference:', referenceNodeId, referencePosition);
              
              // Insert remaining child first (it will replace the flex container position)
              console.log('  Action 1: Insert remaining child', referencePosition, referenceNodeId);
              actions.push(
                EditorActions.insertNode(
                  remainingChildren[0],
                  referenceNodeId,
                  referencePosition
                )
              );
              
              // Now insert the dragged node next to the remaining child
              console.log('  Action 2: Insert dragged node', insertPos, 'remaining child');
              actions.push(
                EditorActions.insertNode(
                  draggingNode,
                  remainingChildren[0].id,
                  insertPos
                )
              );
              
              // Delete the flex container (which also removes dragging node)
              console.log('  Action 3: Delete flex container:', parent.id);
              actions.push(EditorActions.deleteNode(parent.id));
            } else {
              // Fallback: no siblings, use container
              console.log('  No siblings found - using container as reference');
              actions.push(EditorActions.insertNode(remainingChildren[0], container.id, "append"));
              actions.push(EditorActions.insertNode(draggingNode, remainingChildren[0].id, insertPos));
              actions.push(EditorActions.deleteNode(parent.id));
            }
          } else {
            // Target is NOT the flex container - normal case
            
            // Check if the target node is right before or after the flex container
            const targetIndex = container.children.findIndex((c) => c.id === nodeId);
            const isTargetBeforeFlex = targetIndex === parentIndex - 1 && insertPos === "after";
            const isTargetAfterFlex = targetIndex === parentIndex + 1 && insertPos === "before";
            
            console.log('  Target index:', targetIndex);
            console.log('  Is target before flex?', isTargetBeforeFlex);
            console.log('  Is target after flex?', isTargetAfterFlex);
            
            if (isTargetBeforeFlex || isTargetAfterFlex) {
              // We're inserting right next to where the flex container is
              // Need to be careful about ordering
              console.log('  ⚠️ Inserting adjacent to flex container');
              
              // Insert dragged node at the target position
              console.log('  Action 1: Insert dragged node', draggingNodeId, insertPos, 'target:', nodeId);
              actions.push(EditorActions.insertNode(draggingNode, nodeId, insertPos));
              
              // Insert remaining child next to the dragged node (maintaining order)
              if (isTargetBeforeFlex) {
                // Inserting before flex, so remaining child should be after dragged node
                console.log('  Action 2: Insert remaining child after dragged node');
                actions.push(
                  EditorActions.insertNode(
                    remainingChildren[0],
                    draggingNodeId,
                    "after"
                  )
                );
              } else {
                // Inserting after flex, so remaining child should be before dragged node
                console.log('  Action 2: Insert remaining child before dragged node');
                actions.push(
                  EditorActions.insertNode(
                    remainingChildren[0],
                    draggingNodeId,
                    "before"
                  )
                );
              }
              
              // Delete the flex container (also removes old dragged node reference)
              console.log('  Action 3: Delete flex container:', parent.id);
              actions.push(EditorActions.deleteNode(parent.id));
            } else {
              // Target is somewhere else - use standard logic
              console.log('  Standard extraction (target not adjacent)');
              
              // Insert dragged node at new position first
              console.log('  Action 1: Insert dragged node', draggingNodeId, insertPos, 'target:', nodeId);
              actions.push(EditorActions.insertNode(draggingNode, nodeId, insertPos));
              
              // Delete the dragging node from flex
              console.log('  Action 2: Delete dragged node from original position');
              actions.push(EditorActions.deleteNode(draggingNodeId));
              
              // Insert remaining child where the flex container was
              if (parentIndex > 0) {
                const prevNode = container.children[parentIndex - 1];
                console.log('  Action 3: Insert remaining child after prevNode:', prevNode.id);
                actions.push(
                  EditorActions.insertNode(
                    remainingChildren[0],
                    prevNode.id,
                    "after"
                  )
                );
              } else if (parentIndex === 0 && container.children.length > 1) {
                const nextNode = container.children[1];
                console.log('  Action 3: Insert remaining child before nextNode:', nextNode.id);
                actions.push(
                  EditorActions.insertNode(
                    remainingChildren[0],
                    nextNode.id,
                    "before"
                  )
                );
              } else {
                // Only the flex container exists, just insert at root
                console.log('  Action 3: Append remaining child to container');
                actions.push(
                  EditorActions.insertNode(
                    remainingChildren[0],
                    container.id,
                    "append"
                  )
                );
              }
              
              // Delete the flex container
              console.log('  Action 4: Delete flex container:', parent.id);
              actions.push(EditorActions.deleteNode(parent.id));
            }
          }
        } else {
          console.log('  ✓ Multiple children remain - updating container');
          // Multiple children remain, just update the flex container
          actions.push(
            EditorActions.updateNode(parent.id, {
              children: remainingChildren as any,
            })
          );
          
          // Insert dragged node at new position
          console.log('  Action: Insert dragged node', draggingNodeId, insertPos, 'target:', nodeId);
          actions.push(EditorActions.insertNode(draggingNode, nodeId, insertPos));
        }
        
        console.log('  📦 Total actions:', actions.length);

        actions.push(EditorActions.setActiveNode(draggingNodeId));

        dispatch(EditorActions.batch(actions));

        toast({
          title: "Image moved!",
          description: "Image extracted and repositioned",
        });

        setDragOverNodeId(null);
        setDropPosition(null);
        setDraggingNodeId(null);
        return;
      }

      // Standard move at root level
      const draggingNodeAtRoot = container.children.find(
        (n) => n.id === draggingNodeId
      );
      
      if (draggingNodeAtRoot) {
        const targetNodeAtRoot = container.children.find((n) => n.id === nodeId);
        
        // Check if both are at root level and not images - use swap for blocks
        const isDraggingImage = isTextNode(draggingNode) && (draggingNode as TextNode).type === 'img';
        const isTargetImage = targetNodeAtRoot && isTextNode(targetNodeAtRoot) && (targetNodeAtRoot as TextNode).type === 'img';
        
        // Use swap for non-image blocks, use move for images
        if (!isDraggingImage && !isTargetImage && targetNodeAtRoot) {
          dispatch(EditorActions.swapNodes(draggingNodeId, nodeId));
          dispatch(EditorActions.setActiveNode(draggingNodeId));

          toast({
            title: "Blocks swapped!",
            description: "Block positions exchanged",
          });
        } else {
          // Convert dropPosition to valid InsertPosition
          const insertPos =
            dropPosition === "before" || dropPosition === "after"
              ? dropPosition
              : "after";

          dispatch(EditorActions.moveNode(draggingNodeId, nodeId, insertPos));
          dispatch(EditorActions.setActiveNode(draggingNodeId));

          toast({
            title: isDraggingImage ? "Image moved!" : "Block moved!",
            description: `${isDraggingImage ? 'Image' : 'Block'} repositioned ${dropPosition} the block`,
          });
        }
      }

      setDragOverNodeId(null);
      setDropPosition(null);
      setDraggingNodeId(null);
      return;
    }

    // Otherwise, handle file upload

    // Try to get files from dataTransfer
    let files: File[] = [];

    if (e.dataTransfer.items) {
      // Use DataTransferItemList interface
      const items = Array.from(e.dataTransfer.items);
      files = items
        .filter((item) => item.kind === "file")
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null);
    } else {
      // Use DataTransferList interface
      files = Array.from(e.dataTransfer.files);
    }

    // Find first image or video file
    const mediaFile = files.find((file) => 
      file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    if (!mediaFile) {
      setDragOverNodeId(null);
      setDropPosition(null);
      setDraggingNodeId(null);
      return;
    }

    const isVideo = mediaFile.type.startsWith("video/");
    setIsUploading(true);

    try {
      // Use custom upload handler if provided, otherwise use default
      let mediaUrl: string;

      if (onUploadImage) {
        mediaUrl = await onUploadImage(mediaFile);
      } else {
        const result = await uploadImage(mediaFile);
        if (!result.success || !result.url) {
          throw new Error(result.error || "Upload failed");
        }
        mediaUrl = result.url;
      }

      const mediaNode: TextNode = {
        id: `${isVideo ? 'video' : 'img'}-${Date.now()}`,
        type: isVideo ? "video" : "img",
        content: "", // Optional caption
        attributes: {
          src: mediaUrl,
          alt: mediaFile.name,
        },
      };

      // Insert at the determined position
      // Convert dropPosition to valid InsertPosition
      const insertPos =
        dropPosition === "before" || dropPosition === "after"
          ? dropPosition
          : "after";

      dispatch(EditorActions.insertNode(mediaNode, nodeId, insertPos));
      dispatch(EditorActions.setActiveNode(mediaNode.id));

      toast({
        title: `${isVideo ? 'Video' : 'Image'} uploaded!`,
        description: `${isVideo ? 'Video' : 'Image'} placed ${dropPosition} the block`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload file. Please try again.",
      });
    } finally {
      setIsUploading(false);
      setDragOverNodeId(null);
      setDropPosition(null);
      setDraggingNodeId(null);
    }
  };
}

