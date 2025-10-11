"use client";

import { useState } from "react";
import { EditorProvider } from "@/lib";
import { SimpleEditor } from "@/components/SimpleEditor";

export default function Home() {
  const [readOnly, setReadOnly] = useState(false);

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
    <div>
      <EditorProvider debug={true}>
        <SimpleEditor 
          readOnly={readOnly} 
          onUploadImage={handleImageUpload}
        />
      </EditorProvider>
    </div>
  );
}
