"use client";

import { useState, useMemo } from "react";
import { EditorProvider } from "@/lib";
import { SimpleEditor } from "@/components/SimpleEditor";
import { createDemoContent } from "@/lib/demo-content";
import { ContainerNode } from "@/lib/types";
import { Editor } from "@/components/Editor";

export default function Home() {
  const [readOnly, setReadOnly] = useState(false);

  // Create initial demo content - memoized to ensure stable IDs
  // The empty dependency array ensures this is only created once per component mount
  const initialContainer = useMemo<ContainerNode>(() => ({
    id: 'root',
    type: 'container',
    children: createDemoContent(), // Uses default stable timestamp
    attributes: {}
  }), []);

  // Example custom upload handler
  // In a real app, this would upload to your backend/cloud storage
  const handleImageUpload = async (file: File): Promise<string> => {
    // Simulate upload delay (1000ms)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In production, you would:
    // 1. Upload to your backend API
    // 2. Return the permanent URL
    // Example:
    // const formData = new FormData();
    // formData.append('image', file);
    // const response = await fetch('/api/upload', {
    //   method: 'POST',
    //   body: formData
    // });
    // const data = await response.json();
    // return data.url;

    // For demo purposes, return a data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="flex flex-col flex-1">
      <EditorProvider initialContainer={initialContainer} debug={true}>
        <Editor
          readOnly={readOnly} 
          onUploadImage={handleImageUpload}
        />
      </EditorProvider>
    </div>
  );
}
