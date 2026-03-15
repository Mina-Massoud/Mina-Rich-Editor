/**
 * useMediaPaste
 *
 * Attaches a document-level paste listener that intercepts image and video
 * file pastes from the clipboard and uploads them into the editor as nodes.
 */

import { useEffect } from "react";
import { EditorActions } from "../lib";
import type { ContainerNode, TextNode } from "../lib/types";

interface UseMediaPasteParams {
  readOnly: boolean;
  dispatch: React.Dispatch<any>;
  toast: any;
  onUploadImage?: (file: File) => Promise<string>;
  setIsUploading: (uploading: boolean) => void;
  getContainer: () => ContainerNode;
  getActiveNodeId: () => string | null;
  nodeRefs: React.MutableRefObject<Map<string, HTMLElement>>;
}

export function useMediaPaste({
  readOnly,
  dispatch,
  toast,
  onUploadImage,
  setIsUploading,
  getContainer,
  getActiveNodeId,
  nodeRefs,
}: UseMediaPasteParams) {
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const activeElement = document.activeElement;
      const isInEditor = Array.from(nodeRefs.current.values()).some(
        (el) => el === activeElement || el.contains(activeElement)
      );

      if (!isInEditor || readOnly) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const mediaFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (
          item.kind === "file" &&
          (item.type.startsWith("image/") || item.type.startsWith("video/"))
        ) {
          const file = item.getAsFile();
          if (file) {
            mediaFiles.push(file);
          }
        }
      }

      if (mediaFiles.length === 0) return;

      e.preventDefault();

      setIsUploading(true);

      try {
        const uploadPromises = mediaFiles.map(async (file) => {
          if (onUploadImage) {
            return await onUploadImage(file);
          } else {
            const { uploadImage } = await import("../lib/utils/image-upload");
            const result = await uploadImage(file);
            if (!result.success || !result.url) {
              throw new Error(result.error || "Upload failed");
            }
            return result.url;
          }
        });

        const mediaUrls = await Promise.all(uploadPromises);

        const timestamp = Date.now();
        const mediaNodes: TextNode[] = mediaUrls.map((url, index) => {
          const file = mediaFiles[index];
          const isVideo = file.type.startsWith("video/");

          return {
            id: `${isVideo ? "video" : "img"}-${timestamp}-${index}`,
            type: isVideo ? "video" : "img",
            content: "",
            attributes: {
              src: url,
              alt: file.name,
            },
          } as TextNode;
        });

        const container = getContainer();
        const targetId =
          getActiveNodeId() ||
          container.children[container.children.length - 1]?.id;

        if (mediaFiles.length === 1) {
          if (targetId) {
            dispatch(
              EditorActions.insertNode(mediaNodes[0], targetId, "after")
            );
          }
        } else {
          const flexContainer: ContainerNode = {
            id: `flex-container-${timestamp}`,
            type: "container",
            children: mediaNodes,
            attributes: {
              layoutType: "flex",
              gap: "4",
              flexWrap: "wrap",
            },
          };

          if (targetId) {
            dispatch(
              EditorActions.insertNode(flexContainer, targetId, "after")
            );
          }
        }

        const videoCount = mediaFiles.filter((f) =>
          f.type.startsWith("video/")
        ).length;
        const imageCount = mediaFiles.filter((f) =>
          f.type.startsWith("image/")
        ).length;
        let description = "";
        if (videoCount > 0 && imageCount > 0) {
          description = `${imageCount} image(s) and ${videoCount} video(s) pasted successfully.`;
        } else if (videoCount > 0) {
          description = `${videoCount} video(s) pasted successfully.`;
        } else {
          description = `${imageCount} image(s) pasted successfully.`;
        }

        toast({
          title: "Media pasted",
          description,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Paste failed",
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        });
      } finally {
        setIsUploading(false);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [
    readOnly,
    dispatch,
    toast,
    onUploadImage,
    setIsUploading,
    getContainer,
    getActiveNodeId,
    nodeRefs,
  ]);
}
