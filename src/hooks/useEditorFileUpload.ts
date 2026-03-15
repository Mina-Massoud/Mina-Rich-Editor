/**
 * useEditorFileUpload
 *
 * Encapsulates all file upload state, refs, and handlers for the editor.
 * Covers single image, multiple images, video, and free-image uploads.
 */

import { useState, useRef, useCallback } from "react";
import { ContainerNode } from "../lib";
import {
  createHandleFileChange,
  createHandleMultipleFilesChange,
  createHandleImageUploadClick,
  createHandleMultipleImagesUploadClick,
  createHandleFreeImageFileChange,
  createHandleFreeImageUploadClick,
} from "../lib/handlers/file-upload-handlers";

interface UseEditorFileUploadParams {
  dispatch: (action: any) => void;
  getContainer: () => ContainerNode;
  getActiveNodeId: () => string | null;
  toast: any;
  onUploadImage?: (file: File) => Promise<string>;
}

export function useEditorFileUpload({
  dispatch,
  getContainer,
  getActiveNodeId,
  toast,
  onUploadImage,
}: UseEditorFileUploadParams) {
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const freeImageInputRef = useRef<HTMLInputElement>(null);

  // Build params objects using getters so handlers always see fresh values
  const makeUploadParams = (
    inputRef: React.RefObject<HTMLInputElement | null>,
    multiRef: React.RefObject<HTMLInputElement | null>
  ) => ({
    get container() {
      return getContainer();
    },
    dispatch,
    get state() {
      return {
        activeNodeId: getActiveNodeId(),
        current: getContainer(),
        undoStack: [],
        redoStack: [],
      } as any;
    },
    toast,
    setIsUploading,
    fileInputRef: inputRef,
    multipleFileInputRef: multiRef,
    onUploadImage,
  });

  const handleFileChange = useCallback(
    createHandleFileChange(makeUploadParams(fileInputRef, multipleFileInputRef)),
    [dispatch, getContainer, getActiveNodeId, toast, onUploadImage]
  );

  const handleMultipleFilesChange = useCallback(
    createHandleMultipleFilesChange(
      makeUploadParams(fileInputRef, multipleFileInputRef)
    ),
    [dispatch, getContainer, getActiveNodeId, toast, onUploadImage]
  );

  const handleImageUploadClick = useCallback(
    createHandleImageUploadClick(fileInputRef),
    []
  );

  const handleMultipleImagesUploadClick = useCallback(
    createHandleMultipleImagesUploadClick(multipleFileInputRef),
    []
  );

  const handleVideoUploadClick = useCallback(
    createHandleImageUploadClick(videoInputRef),
    []
  );

  const handleVideoFileChange = useCallback(
    createHandleFileChange(makeUploadParams(videoInputRef, videoInputRef)),
    [dispatch, getContainer, getActiveNodeId, toast, onUploadImage]
  );

  const handleFreeImageFileChange = useCallback(
    createHandleFreeImageFileChange(
      makeUploadParams(freeImageInputRef, freeImageInputRef)
    ),
    [dispatch, getContainer, getActiveNodeId, toast, onUploadImage]
  );

  const handleFreeImageUploadClick = useCallback(
    createHandleFreeImageUploadClick(freeImageInputRef),
    []
  );

  return {
    // State
    isUploading,
    setIsUploading,
    // Refs
    fileInputRef,
    multipleFileInputRef,
    videoInputRef,
    freeImageInputRef,
    // Handlers
    handleFileChange,
    handleMultipleFilesChange,
    handleImageUploadClick,
    handleMultipleImagesUploadClick,
    handleVideoUploadClick,
    handleVideoFileChange,
    handleFreeImageFileChange,
    handleFreeImageUploadClick,
  };
}
