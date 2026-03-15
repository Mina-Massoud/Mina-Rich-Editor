/**
 * Image Selection Handler Functions
 * 
 * Functions for handling multi-image selection and flex container creation
 */

import { EditorActions } from '../reducer/actions';
import { ContainerNode, TextNode } from '../types';
import { findNodeAnywhere } from '../utils/editor-helpers';
import { generateId } from '../utils/id-generator';

/** Parameters shared by image selection handler factories. */
export interface ImageSelectionHandlerParams {
  container: ContainerNode | (() => ContainerNode);
  dispatch: React.Dispatch<any>;
  toast: any;
}

/** Creates a handler that groups two or more selected images into a flex container node. */
export function createHandleGroupSelectedImages(
  params: ImageSelectionHandlerParams,
  selectedImageIds: Set<string>,
  clearSelection: () => void
) {
  return () => {
    const { container: containerOrGetter, dispatch, toast } = params;
    const container = typeof containerOrGetter === 'function' ? containerOrGetter() : containerOrGetter;

    if (selectedImageIds.size < 2) {
      toast({
        variant: "destructive",
        title: "Not enough images",
        description: "Please select at least 2 images to group",
      });
      return;
    }

    // Find all selected image nodes
    const imageNodes: TextNode[] = [];
    const imageResults = [];

    for (const imageId of selectedImageIds) {
      const result = findNodeAnywhere(imageId, container);
      if (result && result.node.type === 'img') {
        imageNodes.push(result.node as TextNode);
        imageResults.push(result);
      }
    }

    if (imageNodes.length < 2) {
      toast({
        variant: "destructive",
        title: "Invalid selection",
        description: "Could not find all selected images",
      });
      return;
    }

    // Find the position to insert the new flex container
    // Use the position of the first selected image (topmost in the document)
    let referenceNodeId: string | null = null;
    let insertPosition: "before" | "after" = "after";
    
    // Find the first image in the root container
    for (const child of container.children) {
      if (selectedImageIds.has(child.id)) {
        // Found the first selected image at root level
        const index = container.children.indexOf(child);
        if (index > 0) {
          referenceNodeId = container.children[index - 1].id;
          insertPosition = "after";
        } else if (container.children.length > imageNodes.length) {
          // Find a non-selected node to use as reference
          const nextNonSelected = container.children.find(
            c => !selectedImageIds.has(c.id)
          );
          if (nextNonSelected) {
            referenceNodeId = nextNonSelected.id;
            insertPosition = "before";
          }
        }
        break;
      }
    }

    // Create a flex container with all selected images
    const flexContainer: ContainerNode = {
      id: generateId("flex-container"),
      type: "container",
      children: imageNodes,
      attributes: {
        layoutType: "flex",
        gap: "4",
        flexWrap: "wrap",
      },
    };

    // Batch: delete all selected images and insert flex container
    const actions: any[] = [];
    
    // Delete all selected images
    for (const imageId of selectedImageIds) {
      actions.push(EditorActions.deleteNode(imageId));
    }
    
    // Insert the flex container
    if (referenceNodeId) {
      actions.push(
        EditorActions.insertNode(flexContainer, referenceNodeId, insertPosition)
      );
    } else {
      // If no reference node, replace entire container
      actions.push(
        EditorActions.replaceContainer({
          ...container,
          children: [flexContainer],
        })
      );
    }

    dispatch(EditorActions.batch(actions));

    toast({
      title: "Images grouped!",
      description: `${imageNodes.length} images placed in a flex layout`,
    });

    clearSelection();
  };
}

/** Creates a handler that toggles an image's presence in the set of selected image IDs. */
export function createHandleToggleImageSelection(
  selectedImageIds: Set<string>,
  setSelectedImageIds: (ids: Set<string>) => void
) {
  return (imageId: string) => {
    const newSelection = new Set(selectedImageIds);
    if (newSelection.has(imageId)) {
      newSelection.delete(imageId);
    } else {
      newSelection.add(imageId);
    }
    setSelectedImageIds(newSelection);
  };
}

/** Creates a handler that clears all currently selected image IDs. */
export function createHandleClearImageSelection(
  setSelectedImageIds: (ids: Set<string>) => void
) {
  return () => {
    setSelectedImageIds(new Set());
  };
}

/** Checks whether all currently selected images share the same flex container parent, returning the parent ID if so. */
export function checkImagesInSameFlex(
  params: ImageSelectionHandlerParams,
  selectedImageIds: Set<string>
): { inSameFlex: boolean; flexParentId: string | null } {
  const { container: containerOrGetter } = params;
  const container = typeof containerOrGetter === 'function' ? containerOrGetter() : containerOrGetter;

  if (selectedImageIds.size < 2) {
    return { inSameFlex: false, flexParentId: null };
  }

  const imageResults = [];
  for (const imageId of selectedImageIds) {
    const result = findNodeAnywhere(imageId, container);
    if (result && result.node.type === 'img') {
      imageResults.push(result);
    }
  }

  // Check if all images have the same parent that is a flex container
  const firstParentId = imageResults[0]?.parentId;
  const firstParent = imageResults[0]?.parent;

  if (!firstParentId || !firstParent || firstParent.attributes?.layoutType !== 'flex') {
    return { inSameFlex: false, flexParentId: null };
  }

  // Check all images have the same flex parent
  const allSameParent = imageResults.every(
    r => r.parentId === firstParentId && r.parent?.attributes?.layoutType === 'flex'
  );

  return {
    inSameFlex: allSameParent,
    flexParentId: allSameParent ? firstParentId : null,
  };
}

/** Creates a handler that reverses the order of selected images within their shared flex container. */
export function createHandleReverseImagesInFlex(
  params: ImageSelectionHandlerParams,
  selectedImageIds: Set<string>,
  flexParentId: string
) {
  return () => {
    const { container: containerOrGetter, dispatch, toast } = params;
    const container = typeof containerOrGetter === 'function' ? containerOrGetter() : containerOrGetter;

    // Find the flex container
    const flexResult = findNodeAnywhere(flexParentId, container);
    if (!flexResult || flexResult.node.type !== 'container') {
      return;
    }

    const flexContainer = flexResult.node as ContainerNode;
    const children = [...flexContainer.children];

    // Separate selected and non-selected images
    const selectedIndices: number[] = [];
    const selectedNodes: TextNode[] = [];

    children.forEach((child, index) => {
      if (selectedImageIds.has(child.id)) {
        selectedIndices.push(index);
        selectedNodes.push(child as TextNode);
      }
    });

    // Reverse only the selected images
    selectedNodes.reverse();

    // Put them back in their positions
    selectedIndices.forEach((originalIndex, i) => {
      children[originalIndex] = selectedNodes[i];
    });

    // Update the flex container
    dispatch(
      EditorActions.updateNode(flexParentId, {
        children: children as any,
      })
    );

    toast({
      title: "Images reversed!",
      description: `Order of ${selectedImageIds.size} images reversed`,
    });
  };
}

/** Creates a handler that removes the selected images from their flex container and places them as standalone root-level nodes. */
export function createHandleExtractFromFlex(
  params: ImageSelectionHandlerParams,
  selectedImageIds: Set<string>,
  flexParentId: string,
  clearSelection: () => void
) {
  return () => {
    const { container: containerOrGetter, dispatch, toast } = params;
    const container = typeof containerOrGetter === 'function' ? containerOrGetter() : containerOrGetter;

    // Find the flex container
    const flexResult = findNodeAnywhere(flexParentId, container);
    if (!flexResult || flexResult.node.type !== 'container') {
      return;
    }

    const flexContainer = flexResult.node as ContainerNode;
    const imagesToExtract: TextNode[] = [];
    const remainingChildren = flexContainer.children.filter((child) => {
      if (selectedImageIds.has(child.id)) {
        imagesToExtract.push(child as TextNode);
        return false;
      }
      return true;
    });

    const actions: any[] = [];

    // If only one or no children remain, unwrap the flex container
    if (remainingChildren.length <= 1) {
      // Find the flex container's position in root
      const flexIndex = container.children.findIndex(c => c.id === flexParentId);

      if (flexIndex > 0) {
        const prevNode = container.children[flexIndex - 1];
        
        // Insert remaining child if exists
        if (remainingChildren.length === 1) {
          actions.push(
            EditorActions.insertNode(remainingChildren[0], prevNode.id, 'after')
          );
        }
        
        // Insert extracted images
        let lastNodeId = remainingChildren.length === 1 ? remainingChildren[0].id : prevNode.id;
        imagesToExtract.forEach(image => {
          actions.push(EditorActions.insertNode(image, lastNodeId, 'after'));
          lastNodeId = image.id;
        });
        
        // Delete the flex container
        actions.push(EditorActions.deleteNode(flexParentId));
      } else {
        // First position - just delete flex and add all children
        actions.push(EditorActions.deleteNode(flexParentId));
        
        if (remainingChildren.length === 1) {
          actions.push(
            EditorActions.insertNode(
              remainingChildren[0],
              container.children[1]?.id || container.id,
              container.children[1]?.id ? 'before' : 'append'
            )
          );
        }
        
        imagesToExtract.forEach(image => {
          actions.push(
            EditorActions.insertNode(
              image,
              container.children[1]?.id || container.id,
              container.children[1]?.id ? 'before' : 'append'
            )
          );
        });
      }
    } else {
      // Update flex container with remaining children
      actions.push(
        EditorActions.updateNode(flexParentId, {
          children: remainingChildren as any,
        })
      );

      // Insert extracted images after the flex container
      let lastNodeId = flexParentId;
      imagesToExtract.forEach(image => {
        actions.push(EditorActions.insertNode(image, lastNodeId, 'after'));
        lastNodeId = image.id;
      });
    }

    dispatch(EditorActions.batch(actions));

    toast({
      title: "Images extracted!",
      description: `${imagesToExtract.length} images removed from flex container`,
    });

    clearSelection();
  };
}

