"use client";

import React, { useEffect, useState, useCallback } from "react";

export interface SectionMeta {
  id: string;
  num: string;
  label: string;
}

interface DocsSidebarProps {
  sections: SectionMeta[];
}

export function DocsSidebar({ sections }: DocsSidebarProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];

    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const top = visible.reduce((prev, curr) =>
            prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr
          );
          const id = top.target.getAttribute("data-section-id") ?? top.target.id;
          setActiveId(id);
          history.replaceState(null, "", `#${id}`);
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setActiveId(hash);
      const el = document.getElementById(hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
      }
    }
  }, []);

  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      history.pushState(null, "", `#${id}`);
      setActiveId(id);
    }
  }, []);

  return (
    <nav className="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto py-8 pr-6">
      <div className="mb-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-warm-500">
          Documentation
        </span>
      </div>
      <ul className="space-y-0.5">
        {sections.map((s) => {
          const isActive = activeId === s.id;
          return (
            <li key={s.id}>
              <button
                onClick={() => handleClick(s.id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm font-light transition-all duration-200 border-l-2 ${
                  isActive
                    ? "border-warm-200 text-warm-50 bg-white/[0.02]"
                    : "border-transparent text-warm-500 hover:text-warm-300 hover:border-warm-600"
                }`}
              >
                <span className="font-mono text-[10px] tabular-nums shrink-0">{s.num}</span>
                <span className="truncate">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
