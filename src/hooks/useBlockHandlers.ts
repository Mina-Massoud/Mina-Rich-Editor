import { useCallback, useState } from "react";
import { TextNode } from "../lib";
import {
  createHandleCompositionStart,
  createHandleCompositionEnd,
  createHandleInput,
  createHandleKeyDown,
  createHandleClick,
  createHandleCommandSelect,
  createHandleBackgroundColorChange,
  createHandleBlockDragStart,
  createHandleBlockDragEnd,
} from "../lib/handlers/block";
import { useContainerGetter } from "../lib/store/editor-store";

export interface UseBlockHandlersParams {
  textNode: TextNode;
  readOnly: boolean;
  isActive: boolean;
  dispatch: (action: any) => void;
  localRef: React.RefObject<HTMLElement | null>;
  isComposingRef: React.MutableRefObject<boolean>;
  shouldPreserveSelectionRef: React.MutableRefObject<boolean>;
  onInput: (element: HTMLElement) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
  onClick: () => void;
  onCreateNested?: (nodeId: string) => void;
  onChangeBlockType?: (nodeId: string, newType: string) => void;
  onInsertImage?: (nodeId: string) => void;
  onCreateList?: (nodeId: string, listType: string) => void;
  onCreateTable?: (nodeId: string) => void;
  onBlockDragStart?: (nodeId: string) => void;
  onSetDragOverNodeId?: (nodeId: string | null) => void;
  onSetDropPosition?: (position: "before" | "after" | "left" | "right" | null) => void;
  onSetDraggingNodeId?: (nodeId: string | null) => void;
  onUploadCoverImage?: (file: File) => Promise<string>;
}

/**
 * useBlockHandlers
 *
 * Encapsulates all useCallback declarations for Block event handling,
 * keeping Block.tsx focused on structure and rendering.
 */
export function useBlockHandlers({
  textNode,
  readOnly,
  dispatch,
  localRef,
  isComposingRef,
  shouldPreserveSelectionRef,
  onInput,
  onKeyDown,
  onClick,
  onCreateNested,
  onChangeBlockType,
  onInsertImage,
  onCreateList,
  onCreateTable,
  onBlockDragStart,
  onSetDragOverNodeId,
  onSetDropPosition,
  onSetDraggingNodeId,
}: UseBlockHandlersParams) {
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuAnchor, setCommandMenuAnchor] = useState<HTMLElement | null>(null);

  // Stable getter for the current container (avoids re-renders)
  const getContainer = useContainerGetter();

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

  const handleBlockDragStartFn = useCallback(
    createHandleBlockDragStart(textNode, onBlockDragStart),
    [textNode, onBlockDragStart]
  );

  const handleBlockDragEndFn = useCallback(
    createHandleBlockDragEnd(() => {
      if (onSetDragOverNodeId && onSetDropPosition && onSetDraggingNodeId) {
        onSetDragOverNodeId(null);
        onSetDropPosition(null);
        onSetDraggingNodeId(null);
      }
    }),
    [onSetDragOverNodeId, onSetDropPosition, onSetDraggingNodeId]
  );

  return {
    showCommandMenu,
    setShowCommandMenu,
    commandMenuAnchor,
    setCommandMenuAnchor,
    handleCompositionStart,
    handleCompositionEnd,
    handleInput,
    handleKeyDown,
    handleClick,
    handleCommandSelect,
    handleBackgroundColorChange,
    handleBlockDragStartFn,
    handleBlockDragEndFn,
  };
}
