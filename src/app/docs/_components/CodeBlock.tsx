"use client";

import React, { useState, useCallback } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  children: React.ReactNode;
  label?: string;
}

export function CodeBlock({ children, label }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text = typeof children === "string" ? children : "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [children]);

  return (
    <div className="relative border border-border-subtle overflow-hidden bg-surface-code">
      {label && (
        <div
          className="px-6 py-2.5 border-b flex items-center justify-between"
          style={{ borderColor: "rgba(200,180,160,0.06)" }}
        >
          <span className="text-xs font-mono uppercase tracking-widest text-warm-400">
            {label}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="text-warm-500 hover:text-warm-200 transition-colors"
              aria-label="Copy code"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-warm-700" />
              <span className="w-2 h-2 rounded-full bg-warm-700" />
              <span className="w-2 h-2 rounded-full bg-warm-700" />
            </div>
          </div>
        </div>
      )}
      {!label && (
        <div className="absolute top-2 right-3">
          <button
            onClick={handleCopy}
            className="text-warm-500 hover:text-warm-200 transition-colors p-1"
            aria-label="Copy code"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
      <pre className="px-6 py-5 overflow-x-auto text-sm leading-7 font-mono text-warm-100">
        <code>{children}</code>
      </pre>
    </div>
  );
}
