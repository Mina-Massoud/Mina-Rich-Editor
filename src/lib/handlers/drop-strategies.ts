/**
 * Drop Strategy Functions
 *
 * Extracted from the monolithic createHandleDrop into focused, testable strategies.
 * Each strategy handles one specific drag-and-drop scenario.
 */

import { ContainerNode, TextNode, EditorNode, isTextNode, isContainerNode } from '../types';
import { EditorActions } from '../reducer/actions';
import { generateId } from '../utils/id-generator';
import { uploadImage } from '../utils/image-upload';

interface FindNodeResult {
  node: EditorNode;
  parent?: ContainerNode;
  parentId?: string;
}

export type DropPosition = "before" | "after" | "left" | "right";

export interface DropContext {
  container: ContainerNode;
  dispatch: (action: any) => void;
  draggingNodeId: string;
  draggingResult: FindNodeResult;
  targetNodeId: string;
  targetResult: FindNodeResult;
  dropPosition: DropPosition;
  cleanup: () => void;
}

/**
 * Strategy 1: Reorder children within the same flex container.
 * Handles left/right drops where both nodes share a flex parent.
 */
export function handleFlexReorder(ctx: DropContext): void {
  const { draggingNodeId, targetNodeId, dropPosition, dispatch, cleanup } = ctx;
  const parent = ctx.draggingResult.parent!;
  const newChildren = [...parent.children];

  const dragIndex = newChildren.findIndex((c) => c.id === draggingNodeId);
  const targetIndex = newChildren.findIndex((c) => c.id === targetNodeId);

  // Remove the dragged item from its current position
  const [draggedItem] = newChildren.splice(dragIndex, 1);

  // Calculate the new target index after removal
  const adjustedTargetIndex =
    dragIndex < targetIndex ? targetIndex - 1 : targetIndex;

  // Insert at the correct position based on drop side
  if (dropPosition === "left") {
    newChildren.splice(adjustedTargetIndex, 0, draggedItem);
  } else {
    newChildren.splice(adjustedTargetIndex + 1, 0, draggedItem);
  }

  dispatch(
    EditorActions.updateNode(parent.id, {
      children: newChildren as any,
    })
  );

  cleanup();
}

/**
 * Strategy 2: Merge separate images into a flex container.
 * Handles left/right drops between images not in the same flex parent,
 * including adding to an existing flex container or creating a new one.
 */
export function handleFlexMerge(ctx: DropContext): void {
  const {
    container, dispatch, draggingNodeId, draggingResult,
    targetNodeId, targetResult, dropPosition, cleanup,
  } = ctx;
  const draggingNode = draggingResult.node;
  const targetNode = targetResult.node;

  // If target is in a flex container, add dragged node to it
  if (
    targetResult.parentId &&
    targetResult.parent?.attributes?.layoutType === "flex"
  ) {
    const parent = targetResult.parent;
    const targetIndex = parent.children.findIndex((c) => c.id === targetNodeId);
    const newChildren = [...parent.children];

    if (dropPosition === "left") {
      newChildren.splice(targetIndex, 0, draggingNode as TextNode);
    } else {
      newChildren.splice(targetIndex + 1, 0, draggingNode as TextNode);
    }

    dispatch(
      EditorActions.batch([
        EditorActions.deleteNode(draggingNodeId),
        EditorActions.updateNode(parent.id, {
          children: newChildren as any,
        }),
      ])
    );

    cleanup();
    return;
  }

  // Neither is in a flex container -- create a new one

  // Find reference nodes at root level
  const targetRootIndex = container.children.findIndex(
    (n) =>
      n.id === targetNodeId ||
      (isContainerNode(n) &&
        (n as ContainerNode).children.some((c) => c.id === targetNodeId))
  );
  const draggingRootIndex = container.children.findIndex(
    (n) =>
      n.id === draggingNodeId ||
      (isContainerNode(n) &&
        (n as ContainerNode).children.some((c) => c.id === draggingNodeId))
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
  const flexContainer: ContainerNode = {
    id: generateId("flex-container"),
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

  const actions: any[] = [
    EditorActions.deleteNode(draggingNodeId),
    EditorActions.deleteNode(targetNodeId),
  ];

  if (referenceNodeId) {
    actions.push(
      EditorActions.insertNode(flexContainer, referenceNodeId, insertPosition)
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
  cleanup();
}

/**
 * Strategy 3: Extract an image from a flex container and place it elsewhere.
 * Handles vertical drops where the source is inside a flex container.
 * Also handles unwrapping the flex container when only one child remains.
 */
export function handleFlexExtract(ctx: DropContext): void {
  const {
    container, dispatch, draggingNodeId, draggingResult,
    targetNodeId, dropPosition, cleanup,
  } = ctx;
  const draggingNode = draggingResult.node;
  const parent = draggingResult.parent!;
  const remainingChildren = parent.children.filter(
    (c) => c.id !== draggingNodeId
  );

  const insertPos =
    dropPosition === "before" || dropPosition === "after"
      ? dropPosition
      : "after";

  const actions: any[] = [];

  // If only one child remains, unwrap the container
  if (remainingChildren.length === 1) {
    const parentIndex = container.children.findIndex(
      (c) => c.id === parent.id
    );

    const isTargetTheFlexContainer = targetNodeId === parent.id;

    if (isTargetTheFlexContainer) {
      let referenceNodeId: string | null = null;
      let referencePosition: "before" | "after" = insertPos === "before" ? "before" : "after";

      if (parentIndex > 0) {
        referenceNodeId = container.children[parentIndex - 1].id;
        referencePosition = "after";
      } else if (parentIndex < container.children.length - 1) {
        referenceNodeId = container.children[parentIndex + 1].id;
        referencePosition = "before";
      }

      if (referenceNodeId) {
        actions.push(
          EditorActions.insertNode(
            remainingChildren[0],
            referenceNodeId,
            referencePosition
          )
        );
        actions.push(
          EditorActions.insertNode(
            draggingNode,
            remainingChildren[0].id,
            insertPos
          )
        );
        actions.push(EditorActions.deleteNode(parent.id));
      } else {
        actions.push(EditorActions.insertNode(remainingChildren[0], container.id, "append"));
        actions.push(EditorActions.insertNode(draggingNode, remainingChildren[0].id, insertPos));
        actions.push(EditorActions.deleteNode(parent.id));
      }
    } else {
      // Target is NOT the flex container
      const targetIndex = container.children.findIndex((c) => c.id === targetNodeId);
      const isTargetBeforeFlex = targetIndex === parentIndex - 1 && insertPos === "after";
      const isTargetAfterFlex = targetIndex === parentIndex + 1 && insertPos === "before";

      if (isTargetBeforeFlex || isTargetAfterFlex) {
        actions.push(EditorActions.insertNode(draggingNode, targetNodeId, insertPos));

        if (isTargetBeforeFlex) {
          actions.push(
            EditorActions.insertNode(remainingChildren[0], draggingNodeId, "after")
          );
        } else {
          actions.push(
            EditorActions.insertNode(remainingChildren[0], draggingNodeId, "before")
          );
        }

        actions.push(EditorActions.deleteNode(parent.id));
      } else {
        actions.push(EditorActions.insertNode(draggingNode, targetNodeId, insertPos));
        actions.push(EditorActions.deleteNode(draggingNodeId));

        if (parentIndex > 0) {
          const prevNode = container.children[parentIndex - 1];
          actions.push(
            EditorActions.insertNode(remainingChildren[0], prevNode.id, "after")
          );
        } else if (parentIndex === 0 && container.children.length > 1) {
          const nextNode = container.children[1];
          actions.push(
            EditorActions.insertNode(remainingChildren[0], nextNode.id, "before")
          );
        } else {
          actions.push(
            EditorActions.insertNode(remainingChildren[0], container.id, "append")
          );
        }

        actions.push(EditorActions.deleteNode(parent.id));
      }
    }
  } else {
    // Multiple children remain, just update the flex container
    actions.push(
      EditorActions.updateNode(parent.id, {
        children: remainingChildren as any,
      })
    );
    actions.push(EditorActions.insertNode(draggingNode, targetNodeId, insertPos));
  }

  actions.push(EditorActions.setActiveNode(draggingNodeId));
  dispatch(EditorActions.batch(actions));
  cleanup();
}

/**
 * Strategy 4: Move blocks at root level.
 * Always uses moveNode (never swapNodes) for predictable ordering.
 */
export function handleRootMove(ctx: DropContext): void {
  const {
    dispatch, draggingNodeId, draggingResult,
    targetNodeId, dropPosition, cleanup,
  } = ctx;
  const draggingNode = draggingResult.node;

  const insertPos =
    dropPosition === "before" || dropPosition === "after"
      ? dropPosition
      : "after";

  dispatch(
    EditorActions.batch([
      EditorActions.moveNode(draggingNodeId, targetNodeId, insertPos),
      EditorActions.setActiveNode(draggingNodeId),
    ])
  );

  cleanup();
}

export interface FileDropParams {
  dispatch: (action: any) => void;
  toast: any;
  setIsUploading: (uploading: boolean) => void;
  onUploadImage?: (file: File) => Promise<string>;
  dropPosition: DropPosition | null;
  cleanup: () => void;
}

/**
 * Strategy 5: Handle external file upload drops.
 * Processes dropped media files, uploads them, and inserts a node.
 * Toast is kept only for upload failure reporting.
 */
export async function handleFileDrop(
  e: React.DragEvent,
  nodeId: string,
  params: FileDropParams
): Promise<void> {
  const { dispatch, toast, setIsUploading, onUploadImage, dropPosition, cleanup } = params;

  // Try to get files from dataTransfer
  let files: File[] = [];

  if (e.dataTransfer.items) {
    const items = Array.from(e.dataTransfer.items);
    files = items
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
  } else {
    files = Array.from(e.dataTransfer.files);
  }

  // Find first image or video file
  const mediaFile = files.find(
    (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
  );

  if (!mediaFile) {
    cleanup();
    return;
  }

  const isVideo = mediaFile.type.startsWith("video/");
  setIsUploading(true);

  try {
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
      id: generateId(isVideo ? "video" : "img"),
      type: isVideo ? "video" : "img",
      content: "",
      attributes: {
        src: mediaUrl,
        alt: mediaFile.name,
      },
    };

    const insertPos =
      dropPosition === "before" || dropPosition === "after"
        ? dropPosition
        : "after";

    dispatch(
      EditorActions.batch([
        EditorActions.insertNode(mediaNode, nodeId, insertPos),
        EditorActions.setActiveNode(mediaNode.id),
      ])
    );
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
    cleanup();
  }
}
