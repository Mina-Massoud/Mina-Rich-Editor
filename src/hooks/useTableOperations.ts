/**
 * useTableOperations
 *
 * Manages the table dialog state and handles table creation and markdown table import.
 */

import React, { useState, useCallback } from "react";
import { EditorActions } from "../lib";
import { createHandleCreateTable } from "../lib/handlers/node-operation-handlers";
import type { ContainerNode } from "../lib/types";

interface UseTableOperationsParams {
  dispatch: React.Dispatch<any>;
  toast: any;
  getContainer: () => ContainerNode;
  editorContentRef: React.RefObject<HTMLDivElement | null>;
}

export function useTableOperations({
  dispatch,
  toast,
  getContainer,
  editorContentRef,
}: UseTableOperationsParams) {
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [tableInsertionTargetId, setTableInsertionTargetId] = useState<
    string | undefined
  >(undefined);

  const nodeOperationParams = {
    container: getContainer,
    dispatch,
    toast,
    nodeRefs: { current: new Map<string, HTMLElement>() },
    editorContentRef,
  };

  const handleCreateTableFromCommand = useCallback(
    (nodeId: string) => {
      setTableInsertionTargetId(nodeId);
      dispatch(EditorActions.setActiveNode(nodeId));
      setTableDialogOpen(true);
    },
    [dispatch]
  );

  const handleImportMarkdownTable = useCallback(
    (table: any) => {
      const currentContainer = getContainer();
      const timestamp = Date.now();

      const tableWrapper: ContainerNode = {
        id: `table-wrapper-${timestamp}`,
        type: "container",
        children: [table],
        attributes: {},
      };

      let targetNode = null;
      let targetPosition: "after" | "before" = "after";

      if (tableInsertionTargetId) {
        targetNode = currentContainer.children.find(
          (n) => n.id === tableInsertionTargetId
        );
        targetPosition = "after";
      }

      if (!targetNode) {
        targetNode =
          currentContainer.children[currentContainer.children.length - 1];
        targetPosition = "after";
      }

      if (targetNode) {
        dispatch(
          EditorActions.insertNode(tableWrapper, targetNode.id, targetPosition)
        );
      } else {
        dispatch(
          EditorActions.replaceContainer({
            ...currentContainer,
            children: [tableWrapper],
          })
        );
      }

      toast({
        title: "Table Imported",
        description: "Markdown table has been imported successfully",
      });

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
    },
    [dispatch, toast, tableInsertionTargetId, getContainer, editorContentRef]
  );

  const handleCreateTable = useCallback(
    createHandleCreateTable(nodeOperationParams, tableInsertionTargetId),
    [dispatch, toast, tableInsertionTargetId]
  );

  return {
    tableDialogOpen,
    setTableDialogOpen,
    tableInsertionTargetId,
    setTableInsertionTargetId,
    handleCreateTableFromCommand,
    handleImportMarkdownTable,
    handleCreateTable,
  };
}
