/**
 * File Upload Handler Functions
 * 
 * Functions for handling file uploads in the editor
 */

import { EditorActions } from '../reducer/actions';
import { ContainerNode, TextNode } from '../types';
import { uploadImage } from '../utils/image-upload';

export interface FileUploadHandlerParams {
  container: ContainerNode;
  dispatch: React.Dispatch<any>;
  state: any;
  toast: any;
  setIsUploading: (uploading: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  multipleFileInputRef: React.RefObject<HTMLInputElement | null>;
  onUploadImage?: (file: File) => Promise<string>;
}

/**
 * Handle single file change (supports both images and videos)
 */
export function createHandleFileChange(params: FileUploadHandlerParams) {
  return async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { container, dispatch, state, toast, setIsUploading, fileInputRef, onUploadImage } = params;
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // Determine if file is image or video
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image or video file.",
      });
      setIsUploading(false);
      return;
    }

    try {
      // Use custom upload handler if provided, otherwise use default
      let fileUrl: string;

      if (onUploadImage) {
        fileUrl = await onUploadImage(file);
      } else {
        const result = await uploadImage(file);
        if (!result.success || !result.url) {
          throw new Error(result.error || "Upload failed");
        }
        fileUrl = result.url;
      }

      // Create new media node (image or video)
      const mediaNode: TextNode = {
        id: `${isVideo ? 'video' : 'img'}-${Date.now()}`,
        type: isVideo ? "video" : "img",
        content: "", // Optional caption
        attributes: {
          src: fileUrl,
          alt: file.name,
        },
      };

      // Insert media after current node or at end
      const targetId =
        state.activeNodeId ||
        container.children[container.children.length - 1]?.id;
      if (targetId) {
        dispatch(EditorActions.insertNode(mediaNode, targetId, "after"));
      } else {
        dispatch(EditorActions.insertNode(mediaNode, container.id, "append"));
      }

      toast({
        title: `${isVideo ? 'Video' : 'Image'} uploaded`,
        description: `Your ${isVideo ? 'video' : 'image'} has been added to the editor.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
}

/**
 * Handle multiple files change (supports both images and videos)
 */
export function createHandleMultipleFilesChange(params: FileUploadHandlerParams) {
  return async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { container, dispatch, state, toast, setIsUploading, multipleFileInputRef, onUploadImage } = params;
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      // Filter to only images and videos
      const validFiles = files.filter(
        (file) => file.type.startsWith('image/') || file.type.startsWith('video/')
      );

      if (validFiles.length === 0) {
        toast({
          variant: "destructive",
          title: "Invalid file types",
          description: "Please upload only image or video files.",
        });
        setIsUploading(false);
        return;
      }

      // Upload all media files
      const uploadPromises = validFiles.map(async (file) => {
        if (onUploadImage) {
          return await onUploadImage(file);
        } else {
          const result = await uploadImage(file);
          if (!result.success || !result.url) {
            throw new Error(result.error || "Upload failed");
          }
          return result.url;
        }
      });

      const mediaUrls = await Promise.all(uploadPromises);

      // Create media nodes (images and videos)
      const timestamp = Date.now();
      const mediaNodes: TextNode[] = mediaUrls.map((url, index) => {
        const file = validFiles[index];
        const isVideo = file.type.startsWith('video/');
        
        return {
          id: `${isVideo ? 'video' : 'img'}-${timestamp}-${index}`,
          type: isVideo ? "video" : "img",
          content: "",
          attributes: {
            src: url,
            alt: file.name,
          },
        };
      });

      // Create flex container with media
      const flexContainer: ContainerNode = {
        id: `flex-container-${timestamp}`,
        type: "container",
        children: mediaNodes,
        attributes: {
          layoutType: "flex",
          gap: "4",
          flexWrap: "wrap", // Enable wrapping
        },
      };

      // Insert the flex container after current node or at end
      const targetId =
        state.activeNodeId ||
        container.children[container.children.length - 1]?.id;
      if (targetId) {
        dispatch(EditorActions.insertNode(flexContainer, targetId, "after"));
      } else {
        dispatch(
          EditorActions.insertNode(flexContainer, container.id, "append")
        );
      }

      // For flex containers, set the first child as active (containers themselves aren't focusable)
      if (mediaNodes.length > 0) {
        dispatch(EditorActions.setActiveNode(mediaNodes[0].id));
      }

      const videoCount = validFiles.filter((f) => f.type.startsWith('video/')).length;
      const imageCount = validFiles.filter((f) => f.type.startsWith('image/')).length;
      let description = "";
      if (videoCount > 0 && imageCount > 0) {
        description = `${imageCount} image(s) and ${videoCount} video(s) added in a flex layout.`;
      } else if (videoCount > 0) {
        description = `${videoCount} video(s) added in a flex layout.`;
      } else {
        description = `${imageCount} image(s) added in a flex layout.`;
      }

      toast({
        title: "Media uploaded",
        description,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (multipleFileInputRef.current) {
        multipleFileInputRef.current.value = "";
      }
    }
  };
}

/**
 * Handle image upload click
 */
export function createHandleImageUploadClick(fileInputRef: React.RefObject<HTMLInputElement | null>) {
  return () => {
    fileInputRef.current?.click();
  };
}

/**
 * Handle multiple images upload click
 */
export function createHandleMultipleImagesUploadClick(multipleFileInputRef: React.RefObject<HTMLInputElement | null>) {
  return () => {
    multipleFileInputRef.current?.click();
  };
}

