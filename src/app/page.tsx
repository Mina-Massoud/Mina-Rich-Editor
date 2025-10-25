"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EditorProvider, createInitialState } from "@/lib";
import { createDemoContent } from "@/lib/demo-content";
import { createEmptyContent } from "@/lib/empty-content";
import { ContainerNode, EditorState } from "@/lib/types";
import HeroSection from "@/components/landing";
import { Editor } from "@/components/Editor";

export default function Home() {
  const [readOnly, setReadOnly] = useState(false);
  const [showHero, setShowHero] = useState(true);
  
  // Toggle between modes: true = Notion-style (with cover & header), false = Rich Editor (clean blocks)
  const [notionBased, setNotionBased] = useState(true);

  // Scroll to top when editor is shown
  useEffect(() => {
    if (!showHero) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showHero]);

  // Create initial content based on mode
  // Notion mode: Full demo content with header and cover image
  // Normal mode: Empty paragraph blocks, no cover
  const initialState = useMemo<EditorState>(() => {
    const container: ContainerNode = {
      id: "root",
      type: "container",
      children: notionBased ? createDemoContent() : createEmptyContent(),
      attributes: {},
    };
    
    const state = createInitialState(container);
    
    // Add cover image for Notion mode
    if (notionBased) {
      state.coverImage = {
        url: "/templates/haloween/haloween.webp",
        alt: "Halloween Cover",
        position: 50,
      };
    }
    
    return state;
  }, [notionBased]);

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

  const handleTryEditor = () => {
    // Scroll to top immediately
    window.scrollTo(0, 0);
    setShowHero(false);
  };

  return (
    <div className="flex flex-col flex-1 w-full relative min-h-screen">
      <AnimatePresence mode="wait">
        {showHero ? (
          <motion.div
            key="hero"
            initial={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: -50,
              transition: {
                duration: 0.6,
                ease: [0.76, 0, 0.24, 1],
              },
            }}
            className="fixed inset-0 z-50 overflow-hidden"
          >
            <HeroSection onTryEditor={handleTryEditor} />
          </motion.div>
        ) : (
          <div className="flex flex-grow">
            <div className="flex w-full flex-col flex-grow">
              <motion.div
                key="editor"
                initial={{ opacity: 0, y: 50 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.6,
                    ease: [0.76, 0, 0.24, 1],
                    delay: 0.2,
                  },
                }}
                className="w-full flex-1 min-h-screen flex flex-col"
              >
                <EditorProvider
                  initialState={initialState}
                  debug={true}
                >
                  <Editor
                    readOnly={readOnly}
                    onUploadImage={handleImageUpload}
                    notionBased={notionBased}
                    onNotionBasedChange={setNotionBased}
                  />
                </EditorProvider>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
