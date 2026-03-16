import React from "react";

export function MonoTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 border border-border text-muted-foreground bg-muted"
    >
      {children}
    </span>
  );
}
