import React from "react";

interface ShortcutRowProps {
  shortcut: string;
  action: string;
}

export function ShortcutRow({ shortcut, action }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between p-3">
      <code className="bg-muted text-foreground px-2 py-1 text-sm font-mono border border-border">
        {shortcut}
      </code>
      <span className="text-sm text-muted-foreground">{action}</span>
    </div>
  );
}
