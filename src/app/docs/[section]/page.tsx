"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Github, ChevronLeft, ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";
import { DocsSidebar } from "../_components/DocsSidebar";
import { DocsMobileNav } from "../_components/DocsMobileNav";
import { DocsTOC } from "../_components/DocsTOC";
import { ModeToggle } from "@/components/ui/mode-toggle";
import type { SectionMeta } from "../_components/DocsSidebar";

import S01_Installation, { sectionMeta as s01 } from "../_sections/S01_Installation";
import S02_Usage, { sectionMeta as s02 } from "../_sections/S02_Usage";
import S03_BlockTypes, { sectionMeta as s03 } from "../_sections/S03_BlockTypes";
import S04_KeyboardShortcuts, { sectionMeta as s04 } from "../_sections/S04_KeyboardShortcuts";
import S05_SlashCommands, { sectionMeta as s05 } from "../_sections/S05_SlashCommands";
import S06_MarkdownRules, { sectionMeta as s06 } from "../_sections/S06_MarkdownRules";
import S07_TextFormatting, { sectionMeta as s07 } from "../_sections/S07_TextFormatting";
import S08_Toolbars, { sectionMeta as s08 } from "../_sections/S08_Toolbars";
import S09_DragAndDrop, { sectionMeta as s09 } from "../_sections/S09_DragAndDrop";
import S10_ImageAndMedia, { sectionMeta as s10 } from "../_sections/S10_ImageAndMedia";
import S11_Tables, { sectionMeta as s11 } from "../_sections/S11_Tables";
import S12_CoverImage, { sectionMeta as s12 } from "../_sections/S12_CoverImage";
import S13_ContextMenuAndLinks, { sectionMeta as s13 } from "../_sections/S13_ContextMenuAndLinks";
import S14_AIIntegration, { sectionMeta as s14 } from "../_sections/S14_AIIntegration";
import S15_Collaboration, { sectionMeta as s15 } from "../_sections/S15_Collaboration";
import S16_Serialization, { sectionMeta as s16 } from "../_sections/S16_Serialization";
import S17_UseEditorAPI, { sectionMeta as s17 } from "../_sections/S17_UseEditorAPI";
import S18_Hooks, { sectionMeta as s18 } from "../_sections/S18_Hooks";
import S19_CompactEditor, { sectionMeta as s19 } from "../_sections/S19_CompactEditor";
import S20_HistorySystem, { sectionMeta as s20 } from "../_sections/S20_HistorySystem";
import S21_APIReference, { sectionMeta as s21 } from "../_sections/S21_APIReference";
import S22_Credits, { sectionMeta as s22 } from "../_sections/S22_Credits";
import S23_Extensions, { sectionMeta as s23 } from "../_sections/S23_Extensions";
import S24_Themes, { sectionMeta as s24 } from "../_sections/S24_Themes";

const sections: SectionMeta[] = [
  s01, s02, s14, s15, s03, s19, s07, s05, s08, s04,
  s06, s09, s10, s11, s12, s13, s16, s18, s17, s20,
  s21, s23, s24, s22,
];

const sectionComponents: Record<string, React.ComponentType> = {
  "installation": S01_Installation,
  "usage": S02_Usage,
  "block-types": S03_BlockTypes,
  "keyboard-shortcuts": S04_KeyboardShortcuts,
  "slash-commands": S05_SlashCommands,
  "markdown-rules": S06_MarkdownRules,
  "text-formatting": S07_TextFormatting,
  "toolbars": S08_Toolbars,
  "drag-and-drop": S09_DragAndDrop,
  "image-and-media": S10_ImageAndMedia,
  "tables": S11_Tables,
  "cover-image": S12_CoverImage,
  "context-menu-links": S13_ContextMenuAndLinks,
  "ai-integration": S14_AIIntegration,
  "collaboration": S15_Collaboration,
  "serialization": S16_Serialization,
  "editor-api": S17_UseEditorAPI,
  "hooks": S18_Hooks,
  "compact-editor": S19_CompactEditor,
  "history-system": S20_HistorySystem,
  "api-reference": S21_APIReference,
  "extensions": S23_Extensions,
  "themes": S24_Themes,
  "credits": S22_Credits,
};

export default function DocsSectionPage() {
  const params = useParams();
  const slug = params.section as string;

  const SectionComponent = sectionComponents[slug];
  const currentIndex = sections.findIndex((s) => s.id === slug);
  const prevSection = currentIndex > 0 ? sections[currentIndex - 1] : null;
  const nextSection = currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;
  const currentSection = sections[currentIndex];

  if (!SectionComponent) {
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
            <ModeToggle />
            <DocsMobileNav sections={sections} activeSection={slug} />
          </div>
        </div>
      </header>

      {/* 3-Column Layout */}
      <div className="max-w-[1400px] mx-auto flex relative">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 border-r" style={{ borderColor: "var(--int-border)" }}>
          <DocsSidebar sections={sections} activeSection={slug} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-6 md:px-10 lg:px-12 py-10 md:py-14 max-w-3xl mx-auto" id="docs-content">
          {/* Section title area */}
          {currentSection && (
            <div className="mb-4">
              <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
                {currentSection.num} / {sections.length.toString().padStart(2, "0")}
              </span>
            </div>
          )}

          <SectionComponent />

          {/* Prev / Next Navigation */}
          <div className="int-divider mt-16 mb-8" />
          <div className="flex items-stretch gap-4 mb-16">
            {prevSection ? (
              <Link
                href={`/docs/${prevSection.id}`}
                className="flex-1 group flex items-center gap-3 p-4 rounded-lg border transition-colors hover:bg-muted"
                style={{ borderColor: "var(--int-border)" }}
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Previous</div>
                  <div className="text-sm font-medium text-foreground truncate">{prevSection.label}</div>
                </div>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {nextSection ? (
              <Link
                href={`/docs/${nextSection.id}`}
                className="flex-1 group flex items-center justify-end gap-3 p-4 rounded-lg border text-right transition-colors hover:bg-muted"
                style={{ borderColor: "var(--int-border)" }}
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Next</div>
                  <div className="text-sm font-medium text-foreground truncate">{nextSection.label}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </main>

        {/* Right TOC */}
        <aside className="hidden xl:block w-48 shrink-0 border-l" style={{ borderColor: "var(--int-border)" }}>
          <DocsTOC contentSelector="#docs-content" />
        </aside>
      </div>
    </div>
  );
}
