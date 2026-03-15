/**
 * useEditorDragDrop
 *
 * Encapsulates all drag-and-drop state and handlers for the editor,
 * including both block-level drag-drop and flex-container drag-drop.
 */

import { useState, useCallback } from "react";
import { ContainerNode } from "../lib";
import {
  createHandleImageDragStart,
  createHandleBlockDragStart,
  createHandleDragEnter,
  createHandleDragOver,
  createHandleDragLeave,
  createHandleDrop,
} from "../lib/handlers/drag-drop-handlers";
import {
  createHandleFlexContainerDragOver,
  createHandleFlexContainerDragLeave,
  createHandleFlexContainerDrop,
} from "../lib/handlers/flex-container-handlers";

interface UseEditorDragDropParams {
  dispatch: (action: any) => void;
  getContainer: () => ContainerNode;
  toast: any;
  onUploadImage?: (file: File) => Promise<string>;
}

export function useEditorDragDrop({
  dispatch,
  getContainer,
  toast,
  onUploadImage,
}: UseEditorDragDropParams) {
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<
    "before" | "after" | "left" | "right" | null
  >(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOverFlexId, setDragOverFlexId] = useState<string | null>(null);
  const [flexDropPosition, setFlexDropPosition] = useState<
    "left" | "right" | null
  >(null);

  const handleImageDragStart = useCallback(
    createHandleImageDragStart(setDraggingNodeId),
    []
  );

  const handleBlockDragStart = useCallback(
    createHandleBlockDragStart(setDraggingNodeId),
    []
  );

  const handleDragEnter = useCallback(createHandleDragEnter(), []);

  const handleDragOver = useCallback(
    createHandleDragOver({
      get container() {
        return getContainer();
      },
      dispatch,
      draggingNodeId,
      setDraggingNodeId,
      setDragOverNodeId,
      setDropPosition,
    }),
    [draggingNodeId, dispatch, getContainer]
  );

  const handleDragLeave = useCallback(
    createHandleDragLeave(setDragOverNodeId, setDropPosition),
    []
  );

  const handleDrop = useCallback(
    createHandleDrop(
      {
        get container() {
          return getContainer();
        },
        dispatch,
        toast,
        draggingNodeId,
        setDraggingNodeId,
        setDragOverNodeId,
        setDropPosition,
        setIsUploading: () => {},
        onUploadImage,
      },
      dropPosition
    ),
    [draggingNodeId, dropPosition, dispatch, getContainer, toast, onUploadImage]
  );

  const handleFlexContainerDragOver = useCallback(
    createHandleFlexContainerDragOver({
      get container() {
        return getContainer();
      },
      dispatch,
      toast,
      draggingNodeId,
      setDragOverFlexId,
      setFlexDropPosition,
    }),
    [draggingNodeId, dispatch, getContainer, toast]
  );

  const handleFlexContainerDragLeave = useCallback(
    createHandleFlexContainerDragLeave(setDragOverFlexId, setFlexDropPosition),
    []
  );

  const handleFlexContainerDrop = useCallback(
    createHandleFlexContainerDrop({
      get container() {
        return getContainer();
      },
      dispatch,
      toast,
      draggingNodeId,
      setDragOverFlexId,
      setFlexDropPosition,
    }),
    [draggingNodeId, dispatch, getContainer, toast]
  );

  return {
    // State
    dragOverNodeId,
    setDragOverNodeId,
    dropPosition,
    setDropPosition,
    draggingNodeId,
    setDraggingNodeId,
    dragOverFlexId,
    flexDropPosition,
    // Block drag-drop handlers
    handleImageDragStart,
    handleBlockDragStart,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    // Flex container drag-drop handlers
    handleFlexContainerDragOver,
    handleFlexContainerDragLeave,
    handleFlexContainerDrop,
  };
}
