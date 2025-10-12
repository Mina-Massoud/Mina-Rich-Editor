/**
 * Node Operation Handler Functions
 *
 * Functions for handling node operations (add, delete, create nested, etc.)
 */

import { EditorActions } from "../reducer/actions";
import {
  ContainerNode,
  StructuralNode,
  TextNode,
  EditorNode,
  isContainerNode,
  isTextNode,
} from "../types";
import { findNodeInTree } from "../utils/editor-helpers";

export interface NodeOperationHandlerParams {
  container: ContainerNode;
  dispatch: React.Dispatch<any>;
  toast: any;
  nodeRefs: React.MutableRefObject<Map<string, HTMLElement>>;
  editorContentRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Handle node click
 */
export function createHandleNodeClick(
  params: Pick<NodeOperationHandlerParams, "container" | "dispatch">
) {
  return (nodeId: string) => {
    const { container, dispatch } = params;
    // Don't set container nodes as active - they're not focusable
    // Only text nodes and image nodes can be focused
    const result = findNodeInTree(nodeId, container);
    if (result && isContainerNode(result.node)) {
      // For container nodes, don't set as active
      // The child blocks will handle their own clicks
      return;
    }
    dispatch(EditorActions.setActiveNode(nodeId));
  };
}

/**
 * Handle delete node
 */
export function createHandleDeleteNode(
  params: Pick<NodeOperationHandlerParams, "container" | "dispatch" | "toast">
) {
  return (nodeId: string) => {
    const { container, dispatch, toast } = params;

    // Check if the node is inside a flex container
    const parentContainer = container.children.find(
      (child) =>
        isContainerNode(child) &&
        (child as ContainerNode).children.some((c) => c.id === nodeId)
    );

    if (parentContainer) {
      const containerNode = parentContainer as ContainerNode;
      const remainingChildren = containerNode.children.filter(
        (c) => c.id !== nodeId
      );

      // If only one child left, unwrap it from the container
      if (remainingChildren.length === 1) {
        // Batch: delete container and insert remaining child (single history entry)
        const containerIndex = container.children.findIndex(
          (c) => c.id === parentContainer.id
        );
        const actions: any[] = [EditorActions.deleteNode(parentContainer.id)];

        if (containerIndex > 0) {
          const prevNode = container.children[containerIndex - 1];
          actions.push(
            EditorActions.insertNode(remainingChildren[0], prevNode.id, "after")
          );
        } else if (containerIndex === 0 && container.children.length > 1) {
          const nextNode = container.children[1];
          actions.push(
            EditorActions.insertNode(
              remainingChildren[0],
              nextNode.id,
              "before"
            )
          );
        }

        dispatch(EditorActions.batch(actions));
      } else if (remainingChildren.length === 0) {
        // No children left, delete the container
        dispatch(EditorActions.deleteNode(parentContainer.id));
      } else {
        // Multiple children remain, just remove this one
        dispatch(EditorActions.deleteNode(nodeId));
      }
    } else {
      dispatch(EditorActions.deleteNode(nodeId));
    }

    toast({
      title: "Image removed",
      description: "The image has been deleted.",
    });
  };
}

/**
 * Handle add block
 */
export function createHandleAddBlock(
  params: Pick<NodeOperationHandlerParams, "dispatch" | "nodeRefs">
) {
  return (targetId: string, position: "before" | "after" = "after") => {
    const { dispatch, nodeRefs } = params;
    // Create new paragraph node
    const newNode: TextNode = {
      id: "p-" + Date.now(),
      type: "p",
      content: "",
      attributes: {},
    };

    dispatch(EditorActions.insertNode(newNode, targetId, position));
    dispatch(EditorActions.setActiveNode(newNode.id));

    // Focus the new node after a brief delay
    setTimeout(() => {
      const newElement = nodeRefs.current.get(newNode.id);
      if (newElement) {
        newElement.focus();
      }
    }, 50);
  };
}

/**
 * Handle create nested block
 */
export function createHandleCreateNested(
  params: Pick<NodeOperationHandlerParams, "container" | "dispatch" | "toast">
) {
  return (nodeId: string) => {
    const { container, dispatch, toast } = params;
    const result = findNodeInTree(nodeId, container);
    if (!result) return;

    const { node, parentId } = result;

    // If the node is inside a nested container (not root), we need to handle it differently
    // We only allow 1 level of nesting, so if we're already nested, add to the parent container
    const isAlreadyNested = parentId !== container.id;

    if (isAlreadyNested) {
      // We're inside a nested container, so just add a new paragraph to the parent container
      const newParagraph: TextNode = {
        id: "p-" + Date.now(),
        type: "p",
        content: "",
        attributes: {},
      };

      // Insert after the current node within the parent container
      dispatch(EditorActions.insertNode(newParagraph, nodeId, "after"));
      dispatch(EditorActions.setActiveNode(newParagraph.id));

      // Focus is handled by the useEffect watching state.activeNodeId
      return;
    }

    // Node is at root level, create a nested container
    if (!isTextNode(node)) return;
    const textNode = node as TextNode;

    // Create the new paragraph that will be focused
    const newParagraphId = "p-" + Date.now();
    const newParagraph: TextNode = {
      id: newParagraphId,
      type: "p",
      content: "",
      attributes: {},
    };

    // Create a nested container with the current node inside it
    const nestedContainer: ContainerNode = {
      id: "container-" + Date.now(),
      type: "container",
      children: [
        // Copy the current node
        { ...textNode },
        // Add a new empty paragraph inside the nested container
        newParagraph,
      ],
      attributes: {},
    };

    // Delete the original node
    dispatch(EditorActions.deleteNode(nodeId));

    // Insert the nested container in its place
    // Since we deleted the node, we insert after the previous node or prepend to container
    const nodeIndex = container.children.findIndex((n) => n.id === nodeId);
    if (nodeIndex > 0) {
      const previousNode = container.children[nodeIndex - 1];
      dispatch(
        EditorActions.insertNode(nestedContainer, previousNode.id, "after")
      );
    } else {
      dispatch(
        EditorActions.insertNode(nestedContainer, container.id, "prepend")
      );
    }

    // Set the new paragraph as active
    dispatch(EditorActions.setActiveNode(newParagraphId));

    toast({
      title: "Nested block created",
      description:
        "Press Shift+Enter again to add more blocks in this container",
    });

    // Focus is handled by the useEffect watching state.activeNodeId
  };
}

/**
 * Handle change block type
 */
export function createHandleChangeBlockType(
  params: Pick<NodeOperationHandlerParams, "dispatch" | "nodeRefs">
) {
  return (nodeId: string, newType: string) => {
    const { dispatch, nodeRefs } = params;
    // Special handling for list items - initialize with empty content
    if (newType === "li") {
      dispatch(
        EditorActions.updateNode(nodeId, {
          type: newType as any,
          content: "",
        })
      );
    } else {
      dispatch(EditorActions.updateNode(nodeId, { type: newType as any }));
    }

    // Focus the updated node after a brief delay
    setTimeout(() => {
      const element = nodeRefs.current.get(nodeId);
      if (element) {
        element.focus();
      }
    }, 50);
  };
}

/**
 * Handle insert image from command
 */
export function createHandleInsertImageFromCommand(
  params: Pick<NodeOperationHandlerParams, "dispatch" | "nodeRefs">,
  fileInputRef: React.RefObject<HTMLInputElement | null>
) {
  return (nodeId: string) => {
    const { dispatch } = params;
    // Delete the current empty block
    dispatch(EditorActions.deleteNode(nodeId));

    // Trigger the file input
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };
}

/**
 * Handle create list
 */
export function createHandleCreateList(params: NodeOperationHandlerParams) {
  return (listType: "ul" | "ol") => {
    const { container, dispatch, toast, editorContentRef } = params;
    const timestamp = Date.now();

    // Create a container with a header and 1 nested item
    const listContainer: ContainerNode = {
      id: `container-${timestamp}`,
      type: "container",
      children: [
        {
          id: `h3-${timestamp}`,
          type: "h3",
          content: "List Title",
          attributes: {},
        } as TextNode,
        {
          id: `li-${timestamp}-1`,
          type: "li",
          content: "First item",
          attributes: {},
        } as TextNode,
      ],
      attributes: {
        listType: listType,
      },
    };

    // Insert the list container at the end
    const lastNode = container.children[container.children.length - 1];
    if (lastNode) {
      dispatch(EditorActions.insertNode(listContainer, lastNode.id, "after"));
    } else {
      // If no nodes exist, replace the container
      dispatch(
        EditorActions.replaceContainer({
          ...container,
          children: [listContainer],
        })
      );
    }

    const listTypeLabel = listType === "ol" ? "ordered" : "unordered";
    toast({
      title: "List Created",
      description: `Added a new ${listTypeLabel} list with header and 3 items`,
    });

    // Smooth scroll to the newly created list
    setTimeout(() => {
      // Find the last element in the editor (the newly created list container)
      const editorContent = editorContentRef.current;
      if (editorContent) {
        const lastChild = editorContent.querySelector(
          "[data-editor-content]"
        )?.lastElementChild;
        if (lastChild) {
          lastChild.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
          });
        }
      }
    }, 150);
  };
}

/**
 * Handle create list from command menu
 */
export function createHandleCreateListFromCommand(
  params: Pick<NodeOperationHandlerParams, "dispatch" | "toast" | "nodeRefs">
) {
  return (nodeId: string, listType: string) => {
    const { dispatch, toast, nodeRefs } = params;
    const timestamp = Date.now();
    const firstItemId = `li-${timestamp}-1`;

    // Create a container with 1 list item (always "li", regardless of ul/ol)
    // The container's attributes will store whether it's ul or ol
    const listContainer: ContainerNode = {
      id: `container-${timestamp}`,
      type: "container",
      attributes: {
        listType: listType, // Store 'ul' or 'ol' in the container attributes
      },
      children: [
        {
          id: firstItemId,
          type: "li",
          content: "",
          attributes: {},
        } as TextNode,
      ],
    };

    // Insert the list container after the current node, then delete the current node
    dispatch(EditorActions.insertNode(listContainer, nodeId, "after"));
    dispatch(EditorActions.deleteNode(nodeId));

    const listTypeLabel = listType === "ol" ? "numbered" : "bulleted";
    toast({
      title: "List Created",
      description: `Created a ${listTypeLabel} list with 3 items`,
    });

    // Focus the first item after a longer delay to ensure nested elements are registered
    // Nested elements take longer to mount and register their refs
    setTimeout(() => {
      const element = nodeRefs.current.get(firstItemId);
      if (element) {
        element.focus();
        // Also set it as active node
        dispatch(EditorActions.setActiveNode(firstItemId));
      } else {
        // Retry after another delay
        setTimeout(() => {
          const retryElement = nodeRefs.current.get(firstItemId);
          if (retryElement) {
            retryElement.focus();
            dispatch(EditorActions.setActiveNode(firstItemId));
          }
        }, 100);
      }
    }, 150);
  };
}

/**
 * Handle create link
 */
export function createHandleCreateLink(params: NodeOperationHandlerParams) {
  return () => {
    const { container, dispatch, toast, editorContentRef } = params;
    const timestamp = Date.now();

    // Create a paragraph with a link
    const linkNode: TextNode = {
      id: `p-${timestamp}`,
      type: "p",
      children: [
        {
          content: "www.text.com",
          href: "https://www.text.com",
        },
      ],
      attributes: {},
    };

    // Insert the link node at the end
    const lastNode = container.children[container.children.length - 1];
    if (lastNode) {
      dispatch(EditorActions.insertNode(linkNode, lastNode.id, "after"));
    } else {
      // If no nodes exist, replace the container
      dispatch(
        EditorActions.replaceContainer({
          ...container,
          children: [linkNode],
        })
      );
    }

    toast({
      title: "Link Created",
      description: "Added a new link element",
    });

    // Smooth scroll to the newly created link
    setTimeout(() => {
      const editorContent = editorContentRef.current;
      if (editorContent) {
        const lastChild = editorContent.querySelector(
          "[data-editor-content]"
        )?.lastElementChild;
        if (lastChild) {
          lastChild.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
          });
        }
      }
    }, 150);
  };
}

/**
 * Handle create table
 */
export function createHandleCreateTable(params: NodeOperationHandlerParams) {
  return (rows: number, cols: number) => {
    const { container, dispatch, toast, editorContentRef } = params;
    const timestamp = Date.now();

    // Create header cells
    const headerCells: TextNode[] = Array.from({ length: cols }, (_, i) => ({
      id: `th-${timestamp}-${i}`,
      type: "th",
      content: `Column ${i + 1}`,
      attributes: {},
    }));

    // Create header row
    const headerRow: StructuralNode = {
      id: `tr-header-${timestamp}`,
      type: "tr",
      children: headerCells,
      attributes: {},
    };

    // Create thead
    const thead: StructuralNode = {
      id: `thead-${timestamp}`,
      type: "thead",
      children: [headerRow],
      attributes: {},
    };

    // Create body rows
    const bodyRows: StructuralNode[] = Array.from({ length: rows }, (_, rowIdx) => {
      const cells: TextNode[] = Array.from({ length: cols }, (_, colIdx) => ({
        id: `td-${timestamp}-${rowIdx}-${colIdx}`,
        type: "td",
        content: "",
        attributes: {},
      }));

      return {
        id: `tr-${timestamp}-${rowIdx}`,
        type: "tr",
        children: cells,
        attributes: {},
      };
    });

    // Create tbody
    const tbody: StructuralNode = {
      id: `tbody-${timestamp}`,
      type: "tbody",
      children: bodyRows,
      attributes: {},
    };

    // Create table
    const table: StructuralNode = {
      id: `table-${timestamp}`,
      type: "table",
      children: [thead, tbody],
      attributes: {},
    };

    // Wrap table in a container for consistent handling
    const tableWrapper: ContainerNode = {
      id: `table-wrapper-${timestamp}`,
      type: "container",
      children: [table],
      attributes: {},
    };

    // Insert the table at the end
    const lastNode = container.children[container.children.length - 1];
    if (lastNode) {
      dispatch(EditorActions.insertNode(tableWrapper, lastNode.id, "after"));
    } else {
      // If no nodes exist, replace the container
      dispatch(
        EditorActions.replaceContainer({
          ...container,
          children: [tableWrapper],
        })
      );
    }

    toast({
      title: "Table Created",
      description: `Added a ${rows}×${cols} table`,
    });

    // Smooth scroll to the newly created table
    setTimeout(() => {
      const editorContent = editorContentRef.current;
      if (editorContent) {
        const lastChild = editorContent.querySelector(
          "[data-editor-content]"
        )?.lastElementChild;
        if (lastChild) {
          lastChild.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
          });
        }
      }
    }, 150);
  };
}

/**
 * Handle copy HTML
 */
export function createHandleCopyHtml(
  params: Pick<NodeOperationHandlerParams, "toast">,
  enhanceSpaces: boolean,
  setCopiedHtml: (copied: boolean) => void
) {
  return async (container: ContainerNode) => {
    const { toast } = params;
    const { serializeToHtml } = require("../utils/serialize-to-html");
    let html = serializeToHtml(container);

    // Wrap with spacing classes if enhance spaces is enabled
    if (enhanceSpaces) {
      html = `<div class="[&>*]:my-3 [&_*]:my-5">\n${html}\n</div>`;
    }

    try {
      await navigator.clipboard.writeText(html);
      setCopiedHtml(true);
      toast({
        title: "HTML copied!",
        description: "HTML code has been copied to clipboard.",
      });
      setTimeout(() => setCopiedHtml(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Failed to copy HTML to clipboard.",
      });
    }
  };
}

/**
 * Handle copy JSON
 */
export function createHandleCopyJson(
  params: Pick<NodeOperationHandlerParams, "toast">,
  setCopiedJson: (copied: boolean) => void
) {
  return async (container: ContainerNode) => {
    const { toast } = params;
    const json = JSON.stringify(container.children, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setCopiedJson(true);
      toast({
        title: "JSON copied!",
        description: "JSON data has been copied to clipboard.",
      });
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Failed to copy JSON to clipboard.",
      });
    }
  };
}
