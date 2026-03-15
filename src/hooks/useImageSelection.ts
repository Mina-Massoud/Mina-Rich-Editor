/**
 * useImageSelection
 *
 * Manages multi-image selection state and the operations that act on the selection
 * (group into flex, reverse order, extract from flex, clear).
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  createHandleToggleImageSelection,
  createHandleClearImageSelection,
  createHandleGroupSelectedImages,
  checkImagesInSameFlex,
  createHandleReverseImagesInFlex,
  createHandleExtractFromFlex,
} from "../lib/handlers/image-selection-handlers";
import type { ContainerNode } from "../lib/types";

interface UseImageSelectionParams {
  dispatch: React.Dispatch<any>;
  toast: any;
  getContainer: () => ContainerNode;
}

export function useImageSelection({
  dispatch,
  toast,
  getContainer,
}: UseImageSelectionParams) {
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(
    new Set()
  );

  const handleToggleImageSelection = useCallback(
    createHandleToggleImageSelection(selectedImageIds, setSelectedImageIds),
    [selectedImageIds]
  );

  const handleClearImageSelection = useCallback(
    createHandleClearImageSelection(setSelectedImageIds),
    []
  );

  const handleGroupSelectedImages = useCallback(
    createHandleGroupSelectedImages(
      { container: getContainer, dispatch, toast },
      selectedImageIds,
      handleClearImageSelection
    ),
    [dispatch, toast, selectedImageIds, handleClearImageSelection]
  );

  const flexInfo = useMemo(() => {
    if (selectedImageIds.size < 2) {
      return { inSameFlex: false, flexParentId: null };
    }
    return checkImagesInSameFlex(
      { container: getContainer, dispatch, toast },
      selectedImageIds
    );
  }, [selectedImageIds, dispatch, toast, getContainer]);

  const handleReverseImagesInFlex = useCallback(
    createHandleReverseImagesInFlex(
      { container: getContainer, dispatch, toast },
      selectedImageIds,
      flexInfo.flexParentId || ""
    ),
    [dispatch, toast, selectedImageIds, flexInfo.flexParentId]
  );

  const handleExtractFromFlex = useCallback(
    createHandleExtractFromFlex(
      { container: getContainer, dispatch, toast },
      selectedImageIds,
      flexInfo.flexParentId || "",
      handleClearImageSelection
    ),
    [dispatch, toast, selectedImageIds, flexInfo.flexParentId, handleClearImageSelection]
  );

  return {
    selectedImageIds,
    handleToggleImageSelection,
    handleClearImageSelection,
    handleGroupSelectedImages,
    flexInfo,
    handleReverseImagesInFlex,
    handleExtractFromFlex,
  };
}
