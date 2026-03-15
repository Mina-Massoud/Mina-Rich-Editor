import React from "react";

interface ShortcutRowProps {
  shortcut: string;
  action: string;
}

export function ShortcutRow({ shortcut, action }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between p-3">
      <code className="bg-surface-code text-warm-100 px-2 py-1 text-sm font-mono border border-border-subtle">
        {shortcut}
      </code>
      <span className="text-sm text-warm-400">{action}</span>
    </div>
  );
}
