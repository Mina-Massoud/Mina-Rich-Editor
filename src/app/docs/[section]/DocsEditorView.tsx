"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Github } from "lucide-react";
import { DocsSidebar } from "../_components/DocsSidebar";
import { DocsMobileNav } from "../_components/DocsMobileNav";
import { DocsEditorControls } from "@/components/DocsEditorControls";
import { DynamicEditorProvider } from "@/components/DynamicEditorProvider";
import { createInitialState } from "@/lib/reducer/editor-reducer";
import { Editor } from "@/components/Editor";
import { createDocsContent, docsSections, sectionNodeIds } from "@/lib/docs-content";
import type { SectionMeta } from "../_components/DocsSidebar";

const sections: SectionMeta[] = docsSections;

interface DocsEditorViewProps {
  slug: string;
}

export default function DocsEditorView({ slug }: DocsEditorViewProps) {
  const [readOnly, setReadOnly] = useState(false);
  const [activeSection, setActiveSection] = useState(slug);
  const scrollingRef = useRef(false);

  // Build docs content and initial state (stable across renders)
  const docsContainer = useMemo(() => createDocsContent(), []);
  const initialState = useMemo(() => createInitialState(docsContainer), [docsContainer]);

  // For reset: key to force re-mount the EditorProvider
  const [editorKey, setEditorKey] = useState(0);

  const handleReset = useCallback(() => {
    setEditorKey(k => k + 1);
  }, []);

  // Scroll to section within the editor
  const scrollToSection = useCallback((sectionId: string) => {
    const nodeId = sectionNodeIds[sectionId];
    if (!nodeId) return;

    const el = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (el) {
      scrollingRef.current = true;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
      window.history.pushState(null, "", `/docs/${sectionId}`);
      setTimeout(() => { scrollingRef.current = false; }, 1000);
    }
  }, []);

  // On mount, scroll to the requested section
  useEffect(() => {
    if (slug && slug !== "installation") {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToSection(slug);
        });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track active section via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const timer = setTimeout(() => {
      for (const section of docsSections) {
        const nodeId = sectionNodeIds[section.id];
        if (!nodeId) continue;
        const el = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (!el) continue;

        const observer = new IntersectionObserver(
          (entries) => {
            if (scrollingRef.current) return;
            for (const entry of entries) {
              if (entry.isIntersecting) {
                setActiveSection(section.id);
                window.history.replaceState(null, "", `/docs/${section.id}`);
              }
            }
          },
          { rootMargin: "-20% 0px -70% 0px" }
        );
        observer.observe(el);
        observers.push(observer);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      observers.forEach(o => o.disconnect());
    };
  }, [editorKey]);

  // Validate section exists
  const currentIndex = sections.findIndex((s) => s.id === slug);
  if (currentIndex === -1) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-foreground mb-2">Section not found</h1>
          <Link href="/docs/installation" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
            Go to Installation
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Gradient blur backgrounds */}
      <div className="pointer-events-none fixed -top-40 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.05]" style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }} />
      <div className="pointer-events-none fixed bottom-0 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.04]" style={{ background: "linear-gradient(135deg, #ec4899, #6366f1)" }} />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm" style={{ borderBottom: "1px solid var(--int-border)" }}>
        <div className="max-w-[1400px] mx-auto px-6 flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <span className="font-handwritten text-lg text-foreground hidden sm:inline">
              Documentation
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/Mina-Massoud/Mina-Rich-Editor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <DocsMobileNav sections={sections} activeSection={activeSection} onNavigate={scrollToSection} />
          </div>
        </div>
      </header>

      {/* Floating controls */}
      <DocsEditorControls
        readOnly={readOnly}
        onReadOnlyChange={setReadOnly}
        onReset={handleReset}
      />

      {/* 3-Column Layout */}
      <div className="max-w-[1400px] mx-auto flex relative">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 border-r" style={{ borderColor: "var(--int-border)" }}>
          <DocsSidebar sections={sections} activeSection={activeSection} onNavigate={scrollToSection} />
        </aside>

        {/* Main Content — Editor */}
        <main className="flex-1 min-w-0 py-6 md:py-10" id="docs-content">
          <DynamicEditorProvider key={editorKey} initialState={initialState}>
            <Editor
              readOnly={readOnly}
              notionBased={false}
              className="max-w-3xl mx-auto"
            />
          </DynamicEditorProvider>
        </main>
      </div>
    </div>
  );
}
