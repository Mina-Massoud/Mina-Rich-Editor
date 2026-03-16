/**
 * useEditorDragDrop
 *
 * Encapsulates all drag-and-drop state and handlers for the editor,
 * including both block-level drag-drop and flex-container drag-drop.
 *
 * Uses refs for draggingNodeId and dropPosition so that useCallback
 * dependencies stay stable and handlers always read current values.
 */

import { useState, useCallback, useRef } from "react";
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

  // Refs for stable callback access to current values
  const draggingNodeIdRef = useRef(draggingNodeId);
  draggingNodeIdRef.current = draggingNodeId;

  const dropPositionRef = useRef(dropPosition);
  dropPositionRef.current = dropPosition;

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
    (e: React.DragEvent, nodeId: string) => {
      const handler = createHandleDragOver({
        container: getContainer,
        dispatch,
        draggingNodeId: draggingNodeIdRef.current,
        setDraggingNodeId,
        setDragOverNodeId,
        setDropPosition,
      });
      return handler(e, nodeId);
    },
    [dispatch, getContainer]
  );

  const handleDragLeave = useCallback(
    createHandleDragLeave(setDragOverNodeId, setDropPosition),
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, nodeId: string) => {
      const handler = createHandleDrop(
        {
          container: getContainer,
          dispatch,
          toast,
          draggingNodeId: draggingNodeIdRef.current,
          setDraggingNodeId,
          setDragOverNodeId,
          setDropPosition,
          setIsUploading: () => {},
          onUploadImage,
        },
        dropPositionRef.current
      );
      return handler(e, nodeId);
    },
    [dispatch, getContainer, toast, onUploadImage]
  );

  const handleFlexContainerDragOver = useCallback(
    (e: React.DragEvent, flexContainerId: string, position: "left" | "right" | null) => {
      const handler = createHandleFlexContainerDragOver({
        container: getContainer(),
        dispatch,
        draggingNodeId: draggingNodeIdRef.current,
        setDragOverFlexId,
        setFlexDropPosition,
      });
      return handler(e, flexContainerId, position);
    },
    [dispatch, getContainer]
  );

  const handleFlexContainerDragLeave = useCallback(
    createHandleFlexContainerDragLeave(setDragOverFlexId, setFlexDropPosition),
    []
  );

  const handleFlexContainerDrop = useCallback(
    (e: React.DragEvent, flexContainerId: string, position: "left" | "right" | null) => {
      const handler = createHandleFlexContainerDrop({
        container: getContainer(),
        dispatch,
        draggingNodeId: draggingNodeIdRef.current,
        setDragOverFlexId,
        setFlexDropPosition,
      });
      return handler(e, flexContainerId, position);
    },
    [dispatch, getContainer]
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
