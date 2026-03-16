"use client";

import React from "react";
import Link from "next/link";

export interface SectionMeta {
  id: string;
  num: string;
  label: string;
}

interface DocsSidebarProps {
  sections: SectionMeta[];
  activeSection: string;
  onNavigate?: (sectionId: string) => void;
}

export function DocsSidebar({ sections, activeSection, onNavigate }: DocsSidebarProps) {
  return (
    <nav className="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto py-8 pr-6">
      <div className="mb-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          Documentation
        </span>
      </div>
      <ul className="space-y-0.5">
        {sections.map((s) => {
          const isActive = activeSection === s.id;
          const className = `w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm font-light transition-all duration-200 border-l-2 ${
            isActive
              ? "border-foreground/30 text-foreground bg-muted"
              : "border-transparent text-muted-foreground/70 hover:text-muted-foreground hover:border-border"
          }`;
          return (
            <li key={s.id}>
              {onNavigate ? (
                <button
                  onClick={() => onNavigate(s.id)}
                  className={className}
                >
                  <span className="font-mono text-[10px] tabular-nums shrink-0">{s.num}</span>
                  <span className="truncate">{s.label}</span>
                </button>
              ) : (
                <Link
                  href={`/docs/${s.id}`}
                  className={className}
                >
                  <span className="font-mono text-[10px] tabular-nums shrink-0">{s.num}</span>
                  <span className="truncate">{s.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
