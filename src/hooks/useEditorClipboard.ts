/**
 * useEditorClipboard
 *
 * Provides stable copy, paste, and cut event handlers wired to the editor's
 * dispatch and container state.
 */

import React, { useCallback, useMemo } from "react";
import {
  createHandleCopy,
  createHandlePaste,
  createHandleCut,
} from "../lib/handlers/clipboard-handlers";
import type { ContainerNode } from "../lib/types";
import type { EditorAction } from "../lib/reducer/actions";

interface UseEditorClipboardParams {
  dispatch: React.Dispatch<EditorAction>;
  getContainer: () => ContainerNode;
  getActiveNodeId: () => string | null;
}

export function useEditorClipboard({
  dispatch,
  getContainer,
  getActiveNodeId,
}: UseEditorClipboardParams) {
  const clipboardParams = useMemo(
    () => ({
      getContainer,
      getActiveNodeId,
      dispatch,
    }),
    [getContainer, getActiveNodeId, dispatch]
  );

  const handleCopy = useCallback(createHandleCopy(clipboardParams), [
    clipboardParams,
  ]);

  const handlePaste = useCallback(createHandlePaste(clipboardParams), [
    clipboardParams,
  ]);

  const handleCut = useCallback(createHandleCut(clipboardParams), [
    clipboardParams,
  ]);

  return { handleCopy, handlePaste, handleCut };
}
