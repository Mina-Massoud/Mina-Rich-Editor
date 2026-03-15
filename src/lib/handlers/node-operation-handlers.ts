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
import { generateId } from "../utils/id-generator";
import { serializeToHtml } from "../utils/serialize-to-html";

/** Parameters shared by node operation handler factories. */
export interface NodeOperationHandlerParams {
  container: ContainerNode | (() => ContainerNode);
  dispatch: React.Dispatch<any>;
  toast: any;
  nodeRefs: React.MutableRefObject<Map<string, HTMLElement>>;
  editorContentRef: React.RefObject<HTMLDivElement | null>;
}

/** Creates a click handler that sets the clicked text node as the active node, ignoring container nodes. */
export function createHandleNodeClick(
  params: Pick<NodeOperationHandlerParams, "container" | "dispatch">
) {
  return (nodeId: string) => {
    const { container: containerOrGetter, dispatch } = params;
    const container = typeof containerOrGetter === 'function' ? containerOrGetter() : containerOrGetter;
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

/** Creates a handler that deletes a node and automatically unwraps its parent flex container if only one child remains. */
export function createHandleDeleteNode(
  params: Pick<NodeOperationHandlerParams, "container" | "dispatch" | "toast">
) {
  return (nodeId: string) => {
    const { container: containerOrGetter, dispatch, toast } = params;
    const container = typeof containerOrGetter === 'function' ? containerOrGetter() : containerOrGetter;

    // Find the node being deleted to determine its type
    const findNode = (nodes: EditorNode[]): EditorNode | null => {
      for (const node of nodes) {
        if (node.id === nodeId) return node;
        if (isContainerNode(node)) {
          const found = findNode((node as ContainerNode).children);
          if (found) return found;
        }
      }
      return null;
    };

    const nodeToDelete = findNode(container.children);
    
    // Determine the type of content being deleted
    let contentType = "Block";
    let contentDescription = "The block has been deleted.";
    
    if (nodeToDelete) {
      if (isContainerNode(nodeToDelete)) {
        const firstChild = (nodeToDelete as ContainerNode).children[0];
        if (firstChild?.type === "table") {
          contentType = "Table removed";
          contentDescription = "The table has been deleted.";
        }
      } else if (nodeToDelete.type === "img") {
        contentType = "Image removed";
        contentDescription = "The image has been deleted.";
      } else if (nodeToDelete.type === "video") {
        contentType = "Video removed";
        contentDescription = "The video has been deleted.";
      }
    }

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
      title: contentType,
      description: contentDescription,
    });
  };
}

/** Creates a handler that inserts a new empty paragraph before or after the given target node and focuses it. */
export function createHandleAddBlock(
  params: Pick<NodeOperationHandlerParams, "dispatch" | "nodeRefs">
) {
  return (targetId: string, position: "before" | "after" = "after") => {
    const { dispatch, nodeRefs } = params;
    // Create new paragraph node
    const newNode: TextNode = {
      id: generateId("p"),
      type: "p",
      content: "",
      attributes: {},
    };

    dispatch(EditorActions.insertNode(newNode, targetId, position));
    dispatch(EditorActions.setActiveNode(newNode.id));

    // Wait for the browser to paint the new paragraph before focusing it.
    requestAnimationFrame(() => {
      const newElement = nodeRefs.current.get(newNode.id);
      if (newElement) {
        newElement.focus();
      }
    });
  };
}

/** Creates a handler that wraps the current root-level node in a new container and appends a new empty paragraph beside it. */
export function createHandleCreateNested(
  params: Pick<NodeOperationHandlerParams, "container" | "dispatch" | "toast">
) {
  return (nodeId: string) => {
    const { container: containerOrGetter, dispatch, toast } = params;
    const container = typeof containerOrGetter === 'function' ? containerOrGetter() : containerOrGetter;
    const result = findNodeInTree(nodeId, container);
    if (!result) return;

    const { node, parentId } = result;

    // If the node is inside a nested container (not root), we need to handle it differently
    // We only allow 1 level of nesting, so if we're already nested, add to the parent container
    const isAlreadyNested = parentId !== container.id;

    if (isAlreadyNested) {
      // We're inside a nested container, so just add a new paragraph to the parent container
      const newParagraph: TextNode = {
        id: generateId("p"),
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
    const newParagraphId = generateId("p");
    const newParagraph: TextNode = {
      id: newParagraphId,
      type: "p",
      content: "",
      attributes: {},
    };

    // Create a nested container with the current node inside it
    const nestedContainer: ContainerNode = {
      id: generateId("container"),
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

/** Creates a handler that changes a node's block type and clears its content, typically called from the command menu. */
export function createHandleChangeBlockType(
  params: Pick<NodeOperationHandlerParams, "dispatch" | "nodeRefs">
) {
  return (nodeId: string, newType: string) => {
    const { dispatch, nodeRefs } = params;
    // When changing block type from command menu, clear the content (removes the "/" character)
    dispatch(
      EditorActions.updateNode(nodeId, {
        type: newType as any,
        content: "",
      })
    );

    // Wait for the browser to paint the type-changed block before focusing it.
    requestAnimationFrame(() => {
      const element = nodeRefs.current.get(nodeId);
      if (element) {
        element.focus();
      }
    });
  };
}

/** Creates a handler that deletes the current empty block and opens the file input to trigger an image upload. */
export function createHandleInsertImageFromCommand(
  params: Pick<NodeOperationHandlerParams, "dispatch" | "nodeRefs">,
  fileInputRef: React.RefObject<HTMLInputElement | null>
) {
  return (nodeId: string) => {
    const { dispatch } = params;
    // Delete the current empty block
    dispatch(EditorActions.deleteNode(nodeId));

    // Wait for the delete dispatch to flush before triggering the file input.
    requestAnimationFrame(() => {
      fileInputRef.current?.click();
    });
  };
}

/** Creates a handler that appends a new list item of the specified type to the end of the editor container. */
export function createHandleCreateList(params: NodeOperationHandlerParams) {
  return (listType: "ul" | "ol" | "li") => {
    const { container: containerOrGetter, dispatch, toast, editorContentRef } = params;
    const container = typeof containerOrGetter === 'function' ? containerOrGetter() : containerOrGetter;

    // For 'ul' and 'ol', we create 'ol' type items (numbered)
    // For 'li', we create 'li' type items (bulleted)
    const itemType = listType === "ul" ? "li" : listType === "ol" ? "ol" : "li";

    // Create a simple list item
    const listItem: TextNode = {
      id: generateId(itemType),
      type: itemType as any,
      content: "",
      attributes: {},
    };

    // Insert the list item at the end
    const lastNode = container.children[container.children.length - 1];
    if (lastNode) {
      dispatch(EditorActions.insertNode(listItem, lastNode.id, "after"));
    } else {
      // If no nodes exist, replace the container
      dispatch(
        EditorActions.replaceContainer({
          ...container,
          children: [listItem],
        })
      );
    }

    const listTypeLabel = listType === "ol" ? "numbered" : "bulleted";
    toast({
      title: "List Item Added",
      description: `Added a new ${listTypeLabel} list item`,
    });

    // Smooth scroll to the newly created list item
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

/** Creates a handler that converts the current block into a list item of the given type when triggered from the command menu. */
export function createHandleCreateListFromCommand(
  params: Pick<NodeOperationHandlerParams, "dispatch" | "toast" | "nodeRefs">
) {
  return (nodeId: string, listType: string) => {
    const { dispatch, toast, nodeRefs } = params;

    // Convert the current block to a list item
    // listType can be 'li' (bulleted) or 'ol' (numbered)
    dispatch(EditorActions.updateNode(nodeId, {
      type: listType as any,
      content: "", // Clear content when converting
    }));

    const listTypeLabel = listType === "ol" ? "numbered" : "bulleted";
    toast({
      title: "List Item Created",
      description: `Converted to ${listTypeLabel} list item`,
    });

    // Wait for the browser to paint the converted list item before focusing it.
    requestAnimationFrame(() => {
      const element = nodeRefs.current.get(nodeId);
      if (element) {
        element.focus();
        dispatch(EditorActions.setActiveNode(nodeId));
      }
    });
  };
}

/** Creates a handler that inserts a new paragraph with a default placeholder link at the end of the container. */
export function createHandleCreateLink(params: NodeOperationHandlerParams) {
  return () => {
    const { container: containerOrGetter, dispatch, toast, editorContentRef } = params;
    const container = typeof containerOrGetter === 'function' ? containerOrGetter() : containerOrGetter;

    // Create a paragraph with a link
    const linkNode: TextNode = {
      id: generateId("p"),
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

/** Creates a handler that builds and inserts a fully structured table node with the specified row and column count. */
export function createHandleCreateTable(
  params: NodeOperationHandlerParams,
  activeNodeId?: string
) {
  return (rows: number, cols: number) => {
    const { container: containerOrGetter, dispatch, toast, editorContentRef } = params;
    const container = typeof containerOrGetter === 'function' ? containerOrGetter() : containerOrGetter;

    // Create header cells
    const headerCells: TextNode[] = Array.from({ length: cols }, (_, i) => ({
      id: generateId("th"),
      type: "th",
      content: `Column ${i + 1}`,
      attributes: {},
    }));

    // Create header row
    const headerRow: StructuralNode = {
      id: generateId("tr-header"),
      type: "tr",
      children: headerCells,
      attributes: {},
    };

    // Create thead
    const thead: StructuralNode = {
      id: generateId("thead"),
      type: "thead",
      children: [headerRow],
      attributes: {},
    };

    // Create body rows
    const bodyRows: StructuralNode[] = Array.from({ length: rows }, () => {
      const cells: TextNode[] = Array.from({ length: cols }, () => ({
        id: generateId("td"),
        type: "td",
        content: "",
        attributes: {},
      }));

      return {
        id: generateId("tr"),
        type: "tr",
        children: cells,
        attributes: {},
      };
    });

    // Create tbody
    const tbody: StructuralNode = {
      id: generateId("tbody"),
      type: "tbody",
      children: bodyRows,
      attributes: {},
    };

    // Create table
    const table: StructuralNode = {
      id: generateId("table"),
      type: "table",
      children: [thead, tbody],
      attributes: {},
    };

    // Wrap table in a container for consistent handling
    const tableWrapper: ContainerNode = {
      id: generateId("table-wrapper"),
      type: "container",
      children: [table],
      attributes: {},
    };

    // Determine where to insert the table
    let targetNode = null;
    let targetPosition: "after" | "before" = "after";

    if (activeNodeId) {
      // If we have an active node (from command menu), insert after it
      targetNode = container.children.find((n) => n.id === activeNodeId);
      targetPosition = "after";
    }

    if (!targetNode) {
      // Fallback: insert at the end
      targetNode = container.children[container.children.length - 1];
      targetPosition = "after";
    }

    if (targetNode) {
      dispatch(EditorActions.insertNode(tableWrapper, targetNode.id, targetPosition));
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
        const tableElement = editorContent.querySelector(
          `[data-node-id="${tableWrapper.id}"]`
        );
        if (tableElement) {
          tableElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
        }
      }
    }, 150);
  };
}

/** Creates an async handler that serializes the editor container to HTML and copies it to the clipboard. */
export function createHandleCopyHtml(
  params: Pick<NodeOperationHandlerParams, "toast">,
  enhanceSpaces: boolean,
  setCopiedHtml: (copied: boolean) => void
) {
  return async (container: ContainerNode) => {
    const { toast } = params;
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

/** Creates an async handler that serializes the container's children to pretty-printed JSON and copies it to the clipboard. */
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
