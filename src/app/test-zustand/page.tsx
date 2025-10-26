/**
 * Test page for Zustand optimized editor
 * 
 * Route: /test-zustand
 */

"use client";

import { EditorZustandTest } from "@/components/EditorZustandTest";
import { useEditorStore } from "@/lib/store/editor-store";
import { createDemoContent } from "@/lib/demo-content";
import { useEffect } from "react";

export default function TestZustandPage() {
  // Initialize the store with demo content on mount
  useEffect(() => {
    const store = useEditorStore.getState();
    const demoContent = createDemoContent();
    
    // createDemoContent returns EditorNode[], so we need to wrap it in a container
    const demoContainer = {
      id: "root",
      type: "container" as const,
      children: demoContent,
    };
    
    // Initialize store with demo content
    store.dispatch({
      type: "REPLACE_CONTAINER",
      payload: { container: demoContainer },
    });
  }, []);

  return (
    <div>
      <EditorZustandTest />
    </div>
  );
}

