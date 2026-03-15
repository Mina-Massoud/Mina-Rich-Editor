/**
 * useEditorSelection
 *
 * Encapsulates all selection-related formatting handlers and the debounced
 * selection-change listener for the editor.
 *
 * Stable design: handler functions are created once via useRef and never
 * recreated. They read all live values through a mutable ref so no closures
 * ever go stale.
 */

import React, { useState, useCallback, useRef } from "react";
import {
  createHandleSelectionChange,
  createHandleFormat,
  createHandleApplyColor,
  createHandleApplyFontSize,
  createHandleTypeChange,
} from "../lib/handlers/selection-handlers";
import type { ContainerNode } from "../lib/types";
import type { SelectionHandlerParams } from "../lib/handlers/selection-handlers";

interface UseEditorSelectionParams {
  dispatch: React.Dispatch<any>;
  selectionManager: any;
  activeNodeId: string | null;
  getContainer: () => ContainerNode;
  toast: any;
  undoStackLength: number;
  currentSelection: any;
  nodeRefs: React.MutableRefObject<Map<string, HTMLElement>>;
}

export function useEditorSelection({
  dispatch,
  selectionManager,
  activeNodeId,
  getContainer,
  toast,
  undoStackLength,
  currentSelection,
  nodeRefs,
}: UseEditorSelectionParams) {
  const [selectedColor, setSelectedColor] = useState<string>("");

  // A single mutable ref that always holds the latest prop values.
  // All handler closures read from this ref, so they never go stale.
  const latestRef = useRef({
    dispatch,
    selectionManager,
    activeNodeId,
    getContainer,
    toast,
    undoStackLength,
    currentSelection,
    nodeRefs,
    setSelectedColor,
  });
  // Keep the ref up-to-date every render (cheap write, no re-render triggered)
  latestRef.current.dispatch = dispatch;
  latestRef.current.selectionManager = selectionManager;
  latestRef.current.activeNodeId = activeNodeId;
  latestRef.current.getContainer = getContainer;
  latestRef.current.toast = toast;
  latestRef.current.undoStackLength = undoStackLength;
  latestRef.current.currentSelection = currentSelection;
  latestRef.current.nodeRefs = nodeRefs;
  latestRef.current.setSelectedColor = setSelectedColor;

  const selectionDispatchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Build a stable SelectionHandlerParams proxy that always forwards to
  // the latest values via latestRef. This object is created once and its
  // identity never changes, so handlers that close over it are always fresh.
  const stableParams = useRef<SelectionHandlerParams>(null as any);
  if (!stableParams.current) {
    stableParams.current = {
      get container() {
        return latestRef.current.getContainer;
      },
      get state() {
        return {
          activeNodeId: latestRef.current.activeNodeId,
          current: latestRef.current.getContainer(),
          undoStack: [],
          redoStack: [],
          currentSelection: latestRef.current.currentSelection,
        } as any;
      },
      get dispatch() {
        return latestRef.current.dispatch;
      },
      get selectionManager() {
        return latestRef.current.selectionManager;
      },
      get nodeRefs() {
        return latestRef.current.nodeRefs;
      },
    };
  }

  // Build stable toast/setSelectedColor wrappers for color/fontSize handlers
  const stableToast = useCallback((...args: any[]) => {
    return (latestRef.current.toast as any)(...args);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const stableSetSelectedColor = useCallback((color: string) => {
    latestRef.current.setSelectedColor(color);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Create all handlers once (truly stable, empty deps) ───────────────────

  const handleSelectionChange = useCallback(
    createHandleSelectionChange(stableParams.current, selectionDispatchTimerRef),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleFormat = useCallback(
    createHandleFormat(stableParams.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleApplyColor = useCallback(
    createHandleApplyColor(stableParams.current, stableToast, stableSetSelectedColor),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleApplyFontSize = useCallback(
    createHandleApplyFontSize(stableParams.current, stableToast),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // handleTypeChange depends on handleSelectionChange but since that is
  // now stable ([] deps), handleTypeChange is also stable.
  const handleTypeChange = useCallback(
    createHandleTypeChange(stableParams.current, handleSelectionChange),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return {
    selectedColor,
    handleSelectionChange,
    handleFormat,
    handleApplyColor,
    handleApplyFontSize,
    handleTypeChange,
  };
}
