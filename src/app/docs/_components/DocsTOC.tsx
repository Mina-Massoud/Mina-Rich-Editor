"use client";

import React, { useEffect, useState, useCallback } from "react";

interface TOCItem {
  id: string;
  text: string;
}

interface DocsTOCProps {
  contentSelector: string;
}

export function DocsTOC({ contentSelector }: DocsTOCProps) {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState("");

  // Extract h3 headings from the content area
  useEffect(() => {
    const container = document.querySelector(contentSelector);
    if (!container) return;

    // Small delay to let section content render
    const timer = setTimeout(() => {
      const h3s = container.querySelectorAll("h3");
      const items: TOCItem[] = [];

      h3s.forEach((h3, i) => {
        // Ensure h3 has an id for linking
        if (!h3.id) {
          h3.id = `toc-heading-${i}`;
        }
        items.push({
          id: h3.id,
          text: h3.textContent?.trim() ?? "",
        });
      });

      setHeadings(items);
      if (items.length > 0) setActiveId(items[0].id);
    }, 100);

    return () => clearTimeout(timer);
  }, [contentSelector]);

  // Track active heading via IntersectionObserver
  useEffect(() => {
    if (headings.length === 0) return;

    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const top = visible.reduce((prev, curr) =>
            prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr
          );
          setActiveId(top.target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setActiveId(id);
    }
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav className="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto py-8 pl-6 pr-4">
      <div className="mb-4">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/70">
          On this page
        </span>
      </div>
      <ul className="space-y-0.5">
        {headings.map((h) => {
          const isActive = activeId === h.id;
          return (
            <li key={h.id}>
              <button
                onClick={() => handleClick(h.id)}
                className={`w-full text-left px-3 py-1 text-xs leading-relaxed transition-all duration-200 border-l-2 ${
                  isActive
                    ? "border-foreground/30 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border"
                }`}
              >
                <span className="line-clamp-2">{h.text}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
