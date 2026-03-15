"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Github } from "lucide-react";
import { DocsSidebar } from "./_components/DocsSidebar";
import { DocsMobileNav } from "./_components/DocsMobileNav";
import type { SectionMeta } from "./_components/DocsSidebar";

import S01_Installation, { sectionMeta as s01 } from "./_sections/S01_Installation";
import S02_Usage, { sectionMeta as s02 } from "./_sections/S02_Usage";
import S03_BlockTypes, { sectionMeta as s03 } from "./_sections/S03_BlockTypes";
import S04_KeyboardShortcuts, { sectionMeta as s04 } from "./_sections/S04_KeyboardShortcuts";
import S05_SlashCommands, { sectionMeta as s05 } from "./_sections/S05_SlashCommands";
import S06_MarkdownRules, { sectionMeta as s06 } from "./_sections/S06_MarkdownRules";
import S07_TextFormatting, { sectionMeta as s07 } from "./_sections/S07_TextFormatting";
import S08_Toolbars, { sectionMeta as s08 } from "./_sections/S08_Toolbars";
import S09_DragAndDrop, { sectionMeta as s09 } from "./_sections/S09_DragAndDrop";
import S10_ImageAndMedia, { sectionMeta as s10 } from "./_sections/S10_ImageAndMedia";
import S11_Tables, { sectionMeta as s11 } from "./_sections/S11_Tables";
import S12_CoverImage, { sectionMeta as s12 } from "./_sections/S12_CoverImage";
import S13_ContextMenuAndLinks, { sectionMeta as s13 } from "./_sections/S13_ContextMenuAndLinks";
import S14_AIIntegration, { sectionMeta as s14 } from "./_sections/S14_AIIntegration";
import S15_Collaboration, { sectionMeta as s15 } from "./_sections/S15_Collaboration";
import S16_Serialization, { sectionMeta as s16 } from "./_sections/S16_Serialization";
import S17_UseEditorAPI, { sectionMeta as s17 } from "./_sections/S17_UseEditorAPI";
import S18_Hooks, { sectionMeta as s18 } from "./_sections/S18_Hooks";
import S19_CompactEditor, { sectionMeta as s19 } from "./_sections/S19_CompactEditor";
import S20_HistorySystem, { sectionMeta as s20 } from "./_sections/S20_HistorySystem";
import S21_APIReference, { sectionMeta as s21 } from "./_sections/S21_APIReference";
import S22_Credits, { sectionMeta as s22 } from "./_sections/S22_Credits";

const sections: SectionMeta[] = [
  s01, s02, s03, s04, s05, s06, s07, s08, s09, s10,
  s11, s12, s13, s14, s15, s16, s17, s18, s19, s20,
  s21, s22,
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-surface-base text-warm-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-surface-base/95 backdrop-blur supports-[backdrop-filter]:bg-surface-base/60">
        <div className="container px-5 flex h-14 items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-light text-warm-300 hover:text-warm-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Mina-Massoud/Mina-Rich-Editor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-warm-400 hover:text-warm-100 transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <DocsMobileNav sections={sections} />
          </div>
        </div>
      </header>

      <div className="container flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border-subtle">
          <DocsSidebar sections={sections} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-6 md:px-12 py-10 md:py-16 max-w-4xl">
          {/* Title */}
          <div className="mb-16 space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <span
                className="font-mono text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 border text-warm-200"
                style={{ borderColor: "rgba(200,180,160,0.2)", background: "rgba(200,180,160,0.08)" }}
              >
                v0.3.0
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extralight tracking-tight text-warm-50">
              Mina Rich Editor
            </h1>
            <p className="text-lg font-light text-warm-300 max-w-xl">
              A block-based rich text editor for React. AI-powered, collaborative,
              zero ProseMirror dependency, semantic HTML export -- in three lines of code.
            </p>
          </div>

          {/* Sections */}
          <S01_Installation />
          <S02_Usage />
          <S03_BlockTypes />
          <S04_KeyboardShortcuts />
          <S05_SlashCommands />
          <S06_MarkdownRules />
          <S07_TextFormatting />
          <S08_Toolbars />
          <S09_DragAndDrop />
          <S10_ImageAndMedia />
          <S11_Tables />
          <S12_CoverImage />
          <S13_ContextMenuAndLinks />
          <S14_AIIntegration />
          <S15_Collaboration />
          <S16_Serialization />
          <S17_UseEditorAPI />
          <S18_Hooks />
          <S19_CompactEditor />
          <S20_HistorySystem />
          <S21_APIReference />
          <S22_Credits />
        </main>
      </div>
    </div>
  );
}
