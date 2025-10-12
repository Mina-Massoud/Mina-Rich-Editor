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
 * Handle single file change
 */
export function createHandleFileChange(params: FileUploadHandlerParams) {
  return async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { container, dispatch, state, toast, setIsUploading, fileInputRef, onUploadImage } = params;
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Use custom upload handler if provided, otherwise use default
      let imageUrl: string;

      if (onUploadImage) {
        imageUrl = await onUploadImage(file);
      } else {
        const result = await uploadImage(file);
        if (!result.success || !result.url) {
          throw new Error(result.error || "Upload failed");
        }
        imageUrl = result.url;
      }

      // Create new image node
      const imageNode: TextNode = {
        id: "img-" + Date.now(),
        type: "img",
        content: "", // Optional caption
        attributes: {
          src: imageUrl,
          alt: file.name,
        },
      };

      // Insert image after current node or at end
      const targetId =
        state.activeNodeId ||
        container.children[container.children.length - 1]?.id;
      if (targetId) {
        dispatch(EditorActions.insertNode(imageNode, targetId, "after"));
      } else {
        dispatch(EditorActions.insertNode(imageNode, container.id, "append"));
      }

      toast({
        title: "Image uploaded",
        description: "Your image has been added to the editor.",
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
 * Handle multiple files change
 */
export function createHandleMultipleFilesChange(params: FileUploadHandlerParams) {
  return async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { container, dispatch, state, toast, setIsUploading, multipleFileInputRef, onUploadImage } = params;
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      // Upload all images
      const uploadPromises = files.map(async (file) => {
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

      const imageUrls = await Promise.all(uploadPromises);

      // Create image nodes
      const timestamp = Date.now();
      const imageNodes: TextNode[] = imageUrls.map((url, index) => ({
        id: `img-${timestamp}-${index}`,
        type: "img",
        content: "",
        attributes: {
          src: url,
          alt: files[index].name,
        },
      }));

      // Create flex container with images
      const flexContainer: ContainerNode = {
        id: `flex-container-${timestamp}`,
        type: "container",
        children: imageNodes,
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

      toast({
        title: "Images uploaded",
        description: `${imageUrls.length} images added in a flex layout.`,
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

