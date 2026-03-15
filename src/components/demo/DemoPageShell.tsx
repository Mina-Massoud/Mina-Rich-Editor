"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface DemoPageShellProps {
  title: string;
  description: string;
  codeExample?: { label: string; code: string };
  headerActions?: ReactNode;
  children: ReactNode;
}

export function DemoPageShell({
  title,
  description,
  codeExample,
  headerActions,
  children,
}: DemoPageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-base text-warm-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-surface-base/95 backdrop-blur supports-[backdrop-filter]:bg-surface-base/60" style={{ borderColor: "rgba(200,180,160,0.1)" }}>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-warm-400 transition-colors hover:text-warm-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Home
            </Link>
            <div className="h-4 w-px bg-warm-700" />
            <h1 className="text-sm font-semibold text-warm-50">{title}</h1>
          </div>
          {headerActions && (
            <div className="flex items-center gap-3">{headerActions}</div>
          )}
        </div>
      </header>

      {/* Info banner */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-4">
        <div className="rounded-lg border px-4 py-3" style={{ borderColor: "rgba(200,180,160,0.1)", background: "rgba(200,180,160,0.03)" }}>
          <p className="text-xs leading-relaxed text-warm-400">
            {description}
          </p>
        </div>
      </div>

      {/* Code example */}
      {codeExample && (
        <div className="mx-auto w-full max-w-6xl px-4 pt-3">
          <details className="group rounded-lg border" style={{ borderColor: "rgba(200,180,160,0.1)", background: "rgba(200,180,160,0.02)" }}>
            <summary className="cursor-pointer px-4 py-2 text-xs font-medium text-warm-400 transition-colors hover:text-warm-100">
              View integration code
            </summary>
            <pre className="overflow-x-auto border-t px-4 py-3 font-mono text-[11px] leading-relaxed text-warm-300" style={{ borderColor: "rgba(200,180,160,0.06)" }}>
              {codeExample.code}
            </pre>
          </details>
        </div>
      )}

      {/* Main content */}
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">
        {children}
      </div>
    </div>
  );
}
