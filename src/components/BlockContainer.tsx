"use client";

import React from "react";
import { EditorNode, ContainerNode } from "../lib";
import { FlexContainer } from "./FlexContainer";
import { TableBuilder } from "./TableBuilder";
import { getContainerClasses } from "../lib/handlers/block/block-renderer";
import { useEditorDispatch } from "../lib/store/editor-store";
import { useEditorContext } from "../hooks/useEditorContext";

// Import Block lazily to avoid circular dependency at module load time
// (BlockContainer is rendered by Block, and Block renders BlockContainer)
// The actual Block component is passed in as a prop.
import type { BlockProps } from "./Block";

/**
 * BlockContainerProps
 *
 * Now only carries the node, its render type, the depth/isActive values
 * that are block-specific, and the BlockComponent pass-through to avoid
 * a circular module dependency.
 *
 * All stable editor-wide callbacks are read from EditorContext inside this
 * component, so they no longer need to be threaded through as props.
 */
export interface BlockContainerProps {
  node: EditorNode;
  renderType: "table" | "flex" | "nested-container";
  /** depth of this container (children will be rendered at depth + 1) */
  depth?: number;
  /** whether any child of this container is the active node */
  isActive: boolean;
  BlockComponent: React.ComponentType<BlockProps>;
}

/**
 * BlockContainer
 *
 * Handles the early-return rendering paths for container nodes:
 *   - "table"            → renders <TableBuilder>
 *   - "flex"             → renders <FlexContainer> with child <Block>s
 *   - "nested-container" → renders a div with child <Block>s
 *
 * Accepts `BlockComponent` as a prop so Block.tsx can pass itself in,
 * breaking the circular-import at component level (not module level).
 */
export function BlockContainer({
  node,
  renderType,
  depth = 0,
  isActive,
  BlockComponent,
}: BlockContainerProps) {
  const dispatch = useEditorDispatch();

  // Read stable callbacks from context instead of receiving them as props
  const {
    readOnly,
    onDeleteNode,
    onBlockDragStart,
    onFlexContainerDragOver,
    onFlexContainerDragLeave,
    onFlexContainerDrop,
    dragOverFlexId,
    flexDropPosition,
  } = useEditorContext();

  if (renderType === "table") {
    const containerNode = node as ContainerNode;
    return (
      <TableBuilder
        key={node.id}
        node={containerNode}
        onUpdate={(id, updates) => {
          if (dispatch) {
            dispatch({
              type: "UPDATE_NODE",
              payload: { id, updates },
            });
          }
        }}
        readOnly={readOnly}
        onBlockDragStart={onBlockDragStart}
        onDelete={(nodeId?: string) => onDeleteNode(nodeId ?? node.id)}
      />
    );
  }

  if (renderType === "flex") {
    const containerNode = node as ContainerNode;
    return (
      <FlexContainer
        key={node.id}
        node={containerNode}
        onDragOver={(e, position) => {
          onFlexContainerDragOver(e, node.id, position);
        }}
        onDragLeave={onFlexContainerDragLeave}
        onDrop={(e, position) => {
          onFlexContainerDrop(e, node.id, position);
        }}
        dragOverPosition={dragOverFlexId === node.id ? flexDropPosition : null}
      >
        {containerNode.children.map((childNode) => (
          <div key={childNode.id} className="flex-1 min-w-[280px] max-w-full">
            <BlockComponent
              nodeId={childNode.id}
              isActive={isActive}
              depth={depth + 1}
            />
          </div>
        ))}
      </FlexContainer>
    );
  }

  // nested-container
  const containerNode = node as ContainerNode;
  const containerClasses = getContainerClasses(false, isActive);

  return (
    <div
      key={node.id}
      data-node-id={node.id}
      data-node-type="container"
      className={containerClasses}
    >
      {containerNode.children.map((childNode: EditorNode) => (
        <BlockComponent
          key={childNode.id}
          nodeId={childNode.id}
          isActive={isActive}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
