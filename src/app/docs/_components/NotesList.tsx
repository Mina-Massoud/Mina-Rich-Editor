import React from "react";

interface NotesListProps {
  items: React.ReactNode[];
}

export function NotesList({ items }: NotesListProps) {
  return (
    <div className="border border-border bg-muted p-4">
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-muted-foreground shrink-0">--</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
