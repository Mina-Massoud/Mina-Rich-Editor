import React from "react";

interface SectionHeadingProps {
  num: string;
  label: string;
  id: string;
  children: React.ReactNode;
}

export function SectionHeading({ num, label, id, children }: SectionHeadingProps) {
  return (
    <div id={id} data-section-id={id} className="scroll-mt-20 mb-10">
      <div className="flex items-center gap-4 mb-6">
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{num}</span>
        <div className="h-px flex-1 bg-border" />
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
      </div>
      <h2 className="text-2xl md:text-3xl font-extralight tracking-tight text-foreground">
        {children}
      </h2>
    </div>
  );
}
