/**
 * EditorZustandTest Component
 * 
 * Test implementation using Zustand for optimized re-rendering.
 * This is a simplified version to verify blocks only re-render when their data changes.
 */

"use client";

import React, { useRef, useCallback } from "react";
import { BlockZustand } from "./BlockZustand";
import {
  useZustandContainerChildrenIds,
  useZustandDispatch,
  useZustandCanUndo,
  useZustandCanRedo,
  EditorActions,
  isTextNode,
} from "../lib";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

export function EditorZustandTest() {
  const childrenIds = useZustandContainerChildrenIds();
  const dispatch = useZustandDispatch();
  const canUndo = useZustandCanUndo();
  const canRedo = useZustandCanRedo();

  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Handlers
  const handleNodeClick = useCallback((nodeId: string) => {
    console.log("🖱️ [EditorTest] Node clicked:", nodeId);
    dispatch(EditorActions.setActiveNode(nodeId));
  }, [dispatch]);

  const handleContentChange = useCallback((nodeId: string, element: HTMLElement) => {
    const newContent = element.textContent || "";
    console.log("✏️ [EditorTest] Content changed:", nodeId, newContent);
    
    dispatch(
      EditorActions.updateNode(nodeId, {
        content: newContent,
      })
    );
  }, [dispatch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>, nodeId: string) => {
    console.log("⌨️ [EditorTest] Key down:", e.key, "on", nodeId);
    
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Could add new block here
    }
  }, []);

  const handleDelete = useCallback((nodeId?: string) => {
    if (nodeId) {
      console.log("🗑️ [EditorTest] Delete:", nodeId);
      dispatch(EditorActions.deleteNode(nodeId));
    }
  }, [dispatch]);

  const handleUndo = useCallback(() => {
    dispatch(EditorActions.undo());
  }, [dispatch]);

  const handleRedo = useCallback(() => {
    dispatch(EditorActions.redo());
  }, [dispatch]);

  console.log("🎨 [EditorTest] Rendering with", childrenIds.length, "children");

  return (
    <div className="min-h-screen bg-background p-8">
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="mb-4 flex gap-2">
            <Button onClick={handleUndo} disabled={!canUndo}>
              Undo
            </Button>
            <Button onClick={handleRedo} disabled={!canRedo}>
              Redo
            </Button>
            <div className="ml-auto text-sm text-muted-foreground">
              {childrenIds.length} blocks
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold mb-4">
              Zustand Optimized Editor Test
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Watch the console: Each block shows its render count. 
              When you type in one block, only that block should re-render!
            </p>

            {childrenIds.map((nodeId) => (
              <BlockZustand
                key={nodeId}
                nodeId={nodeId}
                nodeRef={(el) => {
                  if (el) {
                    nodeRefs.current.set(nodeId, el);
                  } else {
                    nodeRefs.current.delete(nodeId);
                  }
                }}
                onInput={(element) => handleContentChange(nodeId, element)}
                onKeyDown={(e) => handleKeyDown(e, nodeId)}
                onClick={() => handleNodeClick(nodeId)}
                onDelete={handleDelete}
                readOnly={false}
              />
            ))}

            {childrenIds.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No blocks yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

