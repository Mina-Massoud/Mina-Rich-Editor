"use client";

import React, { useState, useCallback } from "react";
import { Menu, X } from "lucide-react";
import type { SectionMeta } from "./DocsSidebar";

interface DocsMobileNavProps {
  sections: SectionMeta[];
}

export function DocsMobileNav({ sections }: DocsMobileNavProps) {
  const [open, setOpen] = useState(false);

  const handleClick = useCallback((id: string) => {
    setOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        history.pushState(null, "", `#${id}`);
      }
    }, 150);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 text-warm-400 hover:text-warm-100 transition-colors"
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
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-surface-base border-r border-border-subtle overflow-y-auto lg:hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-warm-400">
                Navigation
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-warm-400 hover:text-warm-100 transition-colors"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="p-4 space-y-0.5">
              {sections.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => handleClick(s.id)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm font-light text-warm-400 hover:text-warm-100 hover:bg-white/[0.04] transition-all duration-200"
                  >
                    <span className="font-mono text-[10px] tabular-nums text-warm-500 shrink-0">
                      {s.num}
                    </span>
                    <span>{s.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
