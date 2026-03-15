import React from "react";

export function MonoTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 border text-warm-300"
      style={{ borderColor: "rgba(200,180,160,0.15)", background: "rgba(200,180,160,0.05)" }}
    >
      {children}
    </span>
  );
}
