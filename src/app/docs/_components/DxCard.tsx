import React from "react";
import { MonoTag } from "./MonoTag";

interface DxCardProps {
  tag: string;
  title: string;
  desc: string;
  idx: number;
}

export function DxCard({ tag, title, desc, idx }: DxCardProps) {
  return (
    <div className="group relative border-b border-r border-border p-5 transition-all duration-300 hover:bg-muted">
      <div className="absolute left-0 top-4 bottom-4 w-px bg-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="flex items-baseline gap-3 mb-2">
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">
          {String(idx).padStart(2, "0")}
        </span>
        <MonoTag>{tag}</MonoTag>
      </div>
      <h4 className="text-sm font-medium tracking-tight mb-1 text-foreground">{title}</h4>
      <p className="text-xs font-light leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}
