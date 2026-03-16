"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { SectionMeta } from "./DocsSidebar";

interface DocsMobileNavProps {
  sections: SectionMeta[];
  activeSection?: string;
  onNavigate?: (sectionId: string) => void;
}

export function DocsMobileNav({ sections, activeSection, onNavigate }: DocsMobileNavProps) {
  const [open, setOpen] = useState(false);

  const handleClick = (sectionId: string) => {
    setOpen(false);
    if (onNavigate) {
      onNavigate(sectionId);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border overflow-y-auto lg:hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Navigation
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="p-4 space-y-0.5">
              {sections.map((s) => {
                const isActive = activeSection === s.id;
                const className = `w-full flex items-center gap-3 px-3 py-2 text-sm font-light transition-all duration-200 ${
                  isActive
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`;
                return (
                  <li key={s.id}>
                    {onNavigate ? (
                      <button
                        onClick={() => handleClick(s.id)}
                        className={`text-left ${className}`}
                      >
                        <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70 shrink-0">
                          {s.num}
                        </span>
                        <span>{s.label}</span>
                      </button>
                    ) : (
                      <Link
                        href={`/docs/${s.id}`}
                        onClick={() => setOpen(false)}
                        className={className}
                      >
                        <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70 shrink-0">
                          {s.num}
                        </span>
                        <span>{s.label}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
